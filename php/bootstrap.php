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
        parent::__construct( es\system\System::document() );
        $this->routes = $routes;
    }

    public function loader( \Closure $callback )
    {

    }

    public function bindRoute(\Closure $callback)
    {
        foreach ( $this->routes as $method => $route )
        {
            foreach ( $route as $name => $service )
            {
                $callback($method, $name , function()use( $service )
                {
                    list($module,$method) = explode("@", $service);
                    $obj = new $module();
                    $obj->$method();
                    $document = es\system\System::document();
                    $respansor = "<!DOCTYPE html>\r\n";
                    $respansor.= $document->documentElement->outerHTML;
                    return $respansor;
                });
            }
        }
    }
}
$routes=[CODE[SERVICE_ROUTE_LIST]];
return new EaseScript($routes);




