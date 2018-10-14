<?php
$start = microtime(true);
define("EASESCRIPT_ROOT", realpath( __DIR__."[CODE[EASESCRIPT_ROOT]]") );
define("URL_PATH_NAME", "[CODE[STATIC_URL_PATH_NAME]]");
spl_autoload_register(function( $name )
{
    static $globals=['BaseObject','Function','Array','String','Number','EventDispatcher','Event',"PropertyEvent",
    'Boolean','Math','Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','Locator',
    'JSON','Reflect','Symbol','console','System','Element','Document','HTMLElement','Node','Console','Namespaces',
    'Render','DataSource','Http','HttpEvent','MouseEvent','DataSourceEvent','DataGrep','DataGrep','Request'];

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


function Element($selector,  $context = null)
{
    return new es\system\Element( $selector,  $context);
}


class EaseScript extends \es\system\EventDispatcher
{
    private $routes = array();
    //运行环境相关信息
    private $environmentObject = null;
    public function __construct( &$routes )
    {
        parent::__construct( \es\system\Document::document() );
        $this->routes = &$routes;
        $environmentObject = new \es\system\BaseObject(array(
            "DefaultRoute"=>"[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]",
            "RouteMap"=>&$routes,
            "UrlPathName"=>URL_PATH_NAME,
            "Version"=>[CODE[VERSION]],
            "RouteController"=>null,
            "RoutePath"=>null,
            "JsLoadPath"=>"[CODE[JS_LOAD_PATH]]",
            "CssLoadPath"=>"[CODE[CSS_LOAD_PATH]]",
        ));
        $this->environmentObject = $environmentObject;
        \es\system\Reflect::set(\es\system\System::class, \es\system\System::class, "environmentObject", $environmentObject);

        $this->addEventListener( \es\system\RouteEvent::HTTP_MATCH,function ($event)use($routes, $environmentObject ){
            $result = $this->match($event->request->method(), $event->request->path() );
            if( $result )
            {
                $environmentObject->RouteController = $result["provider"];
                $environmentObject->RoutePath = $event->request->path();
                list($module,$method) = explode("@", $result["provider"]);
                $event->response = $this->response( $module,  $method, $result["param"] );
                $event->matched = true;
            }
        });
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

    /**
     * 响应请求的数据
     * @param $controller
     * @return string
     */
    public function response( $module , $method , $args=array() )
    {
        $obj = new $module();

        //添加管道服务
        foreach ($this->pipelines as $pipe)
        {
            $obj->addEventListener($pipe[0], $pipe[1], false, $pipe[2]);
        }
        $response = call_user_func_array( array($obj, $method), $args);

        if( class_exists('\es\core\View',false) && is_a($response,'\es\core\View') )
        {
            return "<!DOCTYPE html>\r\n".(\es\system\Document::document()->documentElement->outerHTML);
        }else if( is_a($response,'\es\system\BaseObject') )
        {
            return $response->valueOf();
        }else
        {
            return $response;
        }
    }

    /**
     * 绑定路径
     * @param Closure $callback
     */
    public function bindRoute(\Closure $callback)
    {
        $environmentObject = $this->environmentObject;
        foreach ( $this->routes as $method => $route )
        {
            foreach ($route as $name => $controller )
            {
                $callback($method, $name , function(...$args)use( $controller , $name, $environmentObject )
                {
                     $environmentObject->RouteController = $controller;
                     $environmentObject->RoutePath = $name;
                     list($module,$method) = explode("@", $controller);
                     return $this->response( $module, $method, $args );
                });
            }
        }
    }
}
$routes=[CODE[SERVICE_ROUTE_LIST]];
return new EaseScript($routes);




