<?php
define("EASESCRIPT_ROOT", realpath( __DIR__."[CODE[EASESCRIPT_ROOT]]") );
define("URL_PATH_NAME", "[CODE[STATIC_URL_PATH_NAME]]");
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
    private $routes = array();
    //运行环境相关信息
    private $environmentMap = null;
    public function __construct( &$routes )
    {
        parent::__construct( \es\system\Document::document() );
        $this->routes = &$routes;

        $env = \es\system\System::$env;
        $env->HTTP_DEFAULT_ROUTE = "[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]";
        $env->HTTP_ROUTES = $routes;
        $env->URL_PATH_NAME = URL_PATH_NAME;
        $env->VERSION =[CODE[VERSION]];
        $env->ROOT_PATH = EASESCRIPT_ROOT;
        $env->COMMAND_SWITCH =[CODE[COMMAND_SWITCH]];
        $env->LOAD_JS_PATH ="[CODE[JS_LOAD_PATH]]";
        $env->LOAD_CSS_PATH ="[CODE[CSS_LOAD_PATH]]";
        $env->LOAD_SCRIPTS = new \es\system\BaseObject( json_decode('[CODE[LOAD_SCRIPTS]]') );
        $this->environmentMap = $env;
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
     * @var array
     */
    private $pipelines=array();

    /**
     * 绑定管道操作服务
     * @param $name
     * @param Closure $callback
     */
    public function pipe($name, \Closure $callback, $priority=-500 )
    {
        array_push($this->pipelines, [$name, $callback, $priority]);
    }

    public function bindPipeline( \es\system\EventDispatcher $target )
    {
        foreach ($this->pipelines as $pipe)
        {
            $target->addEventListener($pipe[0], $pipe[1], false, $pipe[2]);
        }
    }

    /**
     * 绑定路径
     * @param Closure $callback
     */
    public function bindRoute(\Closure $callback)
    {
        $env = $this->environmentMap;
        $env->BOOT_APP = $this;
        foreach ( $this->routes as $method => $route )
        {
            foreach ($route as $name => $provider )
            {
                call_user_func($callback, $method, $name,
                function( Illuminate\Http\Request $request, Illuminate\Http\Response $response, $params )
                use( $provider , $name, $env )
                {
                     $env->HTTP_ROUTE_CONTROLLER = $provider;
                     $env->HTTP_ROUTE_PATH = $name;
                     list($module,$method) = explode("@", $provider);
                     $module = str_replace('.','\\',$module);

                     $env->HTTP_REQUEST  = new Request( $request, $params );
                     $env->HTTP_RESPONSE = new Response( $response );
                    
                     $obj = new $module();
                     $this->bindPipeline( $obj );
                     call_user_func_array( array($obj, $method), $params);
                     return $response;
                });
            }
        }
    }
}
$routes=[CODE[SERVICE_ROUTE_LIST]];
return new EaseScript($routes);