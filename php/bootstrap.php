<?php
define("EASESCRIPT_ROOT", realpath( __DIR__."[CODE[EASESCRIPT_ROOT]]") );
spl_autoload_register(function( $name )
{
    static $globals=['BaseObject','ArrayList','String','EventDispatcher','Event',"PropertyEvent",
    'Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','Locator','JSON','Reflect','console',
    'System','Element','Document','HTMLElement','Node','Console','Namespaces','Http','HttpEvent','DataGrep'];

    if( in_array($name,$globals) )
    {
        $name = "es/system/".$name;
    }
    $name = preg_replace('/\\\\/','/', $name );
    $file = EASESCRIPT_ROOT.'/'.$name.'.php';
    if( file_exists($file) )
    {
        require_once $file;
    }

},true,true);


class Request
{
    private $request = null;
    private $params = null;
    public function __construct(Illuminate\Http\Request $request, $params)
    {
        $this->request = $request;
        $this->params = $params;
    }

    public function __get($name)
    {
        $request = $this->request;
        switch( strtolower($name) )
        {
            case "method":
               return $request->method();
            case "path":
                return $request->path();
            case "body":
                return new \es\system\BaseObject( $request->request->all() );
            case "query":
                return new \es\system\BaseObject( $request->query->all() );
            case "params":
                return new \es\system\BaseObject( $this->params );
            case "host":
                return $request->request->server->get("HTTP_HOST");
            case "port":
                return $request->request->server->get("SERVER_PORT");
            case "protocol":
                return $request->request->server->get("HTTPS")==="on" ? "https" : "http";
            case "cookie":
                return new BaseObject( $request->cookies->all() );
            case "uri":
                return $request->getUri();
            case "url":
                return $request->fullUrl();
        }
    }
}


class Response
{
    private $response = null;
    public function __construct(Illuminate\Http\Response $response)
    {
        $this->response = $response;
    }

    public function send( $content )
    {
        if( $content instanceof \es\system\BaseObject )
        {
            $content = $content->valueOf();
        }
        $this->response->setContent( $content );
    }

    public function sendFile(){

    }

    public function status( $code )
    {
        $this->response->setStatusCode( $code );
    }

    public function end()
    {

    }
}

function Element($selector,  $context = null)
{
    return new es\system\Element( $selector,  $context);
}

class EaseScript extends \es\system\EventDispatcher
{
    /**
     * @private
     */
    private $env = null;

    /**
     * @private
     */
    private $pipelines=null;

    /**
     * @private
     */
    private $app=null;

    /**
     * @Constructor
     */
    public function __construct( $app )
    {
        parent::__construct( \es\system\Document::document() );

        $this->app = $app;
        $env = \es\system\System::$env;
        $env->APP = $this;
        $env->HTTP_DEFAULT_ROUTE = "[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]";
        $env->HTTP_ROUTES = [CODE[SERVICE_ROUTE_LIST]];
        $env->HTTP_ROUTE  = null;
        $env->HTTP_PATH   = null;
        $env->HTTP_PARAMS = null;
        $env->URL_PATH_NAME = "[CODE[STATIC_URL_PATH_NAME]]";
        $env->VERSION =[CODE[VERSION]];
        $env->ROOT_PATH = EASESCRIPT_ROOT;
        $env->COMMAND_SWITCH =[CODE[COMMAND_SWITCH]];
        $env->LOAD_JS_PATH ="[CODE[JS_LOAD_PATH]]";
        $env->LOAD_CSS_PATH ="[CODE[CSS_LOAD_PATH]]";
        $env->LOAD_SCRIPTS = new \es\system\BaseObject();
        $env->APP_CONFIG = new \stdClass();
        $env->HTTP_DISPATCHER = function($module, $method, $args=null)use( $env )
        {
            $module = str_replace('.','\\',$module);

            if( is_callable($method) )
            {
                return method( $module );
            }

             $obj = new $module();
             if( !method_exists( $obj, $method ) )
             {
                  throw new \Exception("{$method} is exists. in the ".$module );
             }

             if( $args instanceof \es\system\BaseObject)
             {
                 $args = $args->valueOf();
                 if( is_object($args) )
                 {
                    $args = array_values( (array)$args );
                 }
             }
             call_user_func_array( array($obj, $method), $args ?: []);
        };

        $scripts = json_decode('[CODE[LOAD_SCRIPTS]]');
        foreach( $scripts as $key=>$value)
        {
            $env->LOAD_SCRIPTS->$key = new \es\system\ArrayList( $value );
        }

        $config_path = dirname(__FILE__) . "/config.json";
        if( file_exists($config_path) )
        {
            $env->APP_CONFIG =(object)json_decode( file_get_contents(  $config_path ) );
        }

        if( $env->HTTP_DEFAULT_ROUTE )
        {
            if( !isset($env->HTTP_ROUTES["get"]) )
            {
                $env->HTTP_ROUTES["get"] = [];
            }
            $env->HTTP_ROUTES["get"]["/"] = $env->HTTP_DEFAULT_ROUTE;
        }

        $this->env = $env;
        $this->pipelines = new \stdClass();
    }

    /**
     * 获取指定的配置项
     * @param {*} name 
     */
    public function getConfig( $name )
    {
        return $name ? $this->env->APP_CONFIG->$name ?? null : $this->env->APP_CONFIG;
    }

    /**
     * 获取指定的环境选项
     * @param {*} name 
     */
    public function getEnv( $name )
    {
        return $name ? $this->env->$name ?? null : $this->env;
    }

    /**
     * 匹配http请求
     * @param $routes
     * @param $path
     * @return array
     */
    public function match($method, $path )
    {
         $method = strtolower($method);
         if( !isset($this->routes[$method]) ){
             return null;
         }
         $routes = $this->routes[$method];
         if( isset($routes[ $path ]) )
         {
             return array(
                 "provider"=>$routes[ $path ],
                 "param"=>array(),
             );
         }

         $segment_path = explode("/", trim($path,'/'));
         $count_path = count($segment_path);

         foreach ($routes as $key=>$value)
         {
             $segment = explode("/", trim($key,'/') );
             $count = count($segment);
             if( $count === $count_path )
             {
                $result = array();
                $param = array();

                for($i=0;$i<$count;$i++)
                {
                    if( substr($segment[$i],0,1)==="{" && substr($segment[$i],-1)==="}" )
                    {
                        array_push($result, $segment_path[$i] );
                        array_push($param, $segment_path[$i] );

                    }else if( strcasecmp($segment[$i], $segment_path[$i])===0 )
                    {
                        array_push($result, $segment[$i]);
                    }else{
                        break;
                    }
                }
                if( count($result) === $count_path )
                {
                    return array(
                          "provider"=>$value,
                          "param"=>$param,
                    );
                }
             }
         }
         return null;
    }

    /**
     * 绑定管道操作服务
     * @param $name
     * @param Closure $factor
     */
    public function pipe($name, \Closure $factor)
    {
        switch( strtolower($name) )
        {
            case "database" :
                $name = \es\events\PipeLineEvent::PIPELINE_DATABASE;
            break;
            case "redis" :
                $name = \es\events\PipeLineEvent::PIPELINE_REDIS;
            break;
            default:
                throw new \Exception( $name . " is not supported.");
        }

        \es\system\System::getGlobalEvent()->addEventListener( $name, function(\es\events\PipeLineEvent $e)use($factor)
        {
            $factor( $e->cmd, $e->params, $e->callback );
        });
    }

    /**
     * 绑定路径
     * @param Closure $callback
     */
    public function bindRoute(\Closure $callback)
    {
        $env = $this->env;
        foreach ( $env->HTTP_ROUTES as $method => $route )
        {
            foreach ($route as $name => $provider )
            {
                call_user_func($callback, $method, $name,
                function( Illuminate\Http\Request $request, Illuminate\Http\Response $response, $params )
                use( $provider , $name, &$env )
                {
                     $env->HTTP_ROUTE  = $provider;
                     $env->HTTP_PATH   = $name;
                     $env->HTTP_PARAMS = $params;
                     $env->HTTP_REQUEST  = new Request( $request, $params );
                     $env->HTTP_RESPONSE = new Response( $response );

                     list($module,$method) = explode("@", $provider);
                     call_user_func( $env->HTTP_DISPATCHER,  $module, $method, $params);
                     return $response;
                });
            }
        }
    }
}