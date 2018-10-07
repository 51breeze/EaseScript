<?php
$start = microtime(true);
define("EASESCRIPT_ROOT", realpath( __DIR__."[CODE[EASESCRIPT_ROOT]]") );
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

    public function __construct( &$routes )
    {
        parent::__construct( \es\system\Document::document() );
        $this->routes = $routes;
        $this->addEventListener( \es\system\RouteEvent::HTTP_MATCH,function ($event)use($routes){
            $method = strtolower($event->request->method());
            $path = $event->request->path();
            if( isset($routes[$method]) )
            {
                $result = $this->match($routes[$method], $path);
                if( $result )
                {
                    list($module,$method) = explode("@", $result["provider"]);
                    $event->response = $this->response( $module,  $method, $result["param"] );
                    $event->matched = true;
                }
            }
        });
    }

    /**
     * 匹配http请求
     * @param $routes
     * @param $path
     * @return array
     */
    private function match($routes, $path )
    {
         if( isset($routes[ $path ]) )
         {
             return array(
                 "provider"=>$routes[ $path ],
                 "param"=>array(),
             );
         }

         $segment_path = explode("/", rtrim($path,'/'));
         $count_path = count($segment_path);

         foreach ($routes as $key=>$value)
         {
             $segment = explode("/", rtrim($key,'/') );
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
    private function response( $module , $method , $args=array() )
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
        foreach ( $this->routes as $method => $route )
        {
            foreach ($route as $name => $controller )
            {
                $callback($method, $name , function()use( $controller )
                {
                    list($module,$method) = explode("@", $controller);
                    return $this->response( $module, $method );
                });
            }
        }
    }
}
$routes=[CODE[SERVICE_ROUTE_LIST]];
return new EaseScript($routes);




