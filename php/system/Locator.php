<?php
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require TypeError,System
 */


/**
 * 资源定位器
 * @constructor
 */
class Locator
{
    public function __construct()
    {
        throw new TypeError("Locator is not constructor");
    }

    /**
     * 返回一个请求对象的实例
     * @return null|Request
     */
    static private function getRequest()
    {
        static $request = null;
        if($request===null)$request = new Request();
        return $request;
    }

    /**
     * 返回地址栏中的URL
     * @returns {string|*}
     */
    static public function url()
    {
        return Locator::getRequest()->url();
    }

    /**
     * 返回地址栏中的URI
     * @returns {string}
     */
    static public function uri()
    {
        return Locator::getRequest()->uri();
    }

    /**
     * 返回地址栏中请求的路径部分。如查指定index则返回位于index索引的路径名，否则返回一个数组。
     * 给定的index必须是一个从0开始的整数
     * @param index
     * @returns {*}
     */
    static public function path( $index = -1 )
    {
        static $path=null;
        if( $path === null )
        {
            $str = preg_replace('/^\/|\/$/',"", Locator::getRequest()->path() );
            $str = preg_split('/\//', $str);
            $file = array_shift( $str );
            if( strpos($file,".") === false )
            {
               array_unshift($str, $file );
               $file = "";
            }
            $path = $str;
        }
        if( $index >= 0 )
        {
            return isset( $path[$index] ) ? $path[$index] : null;
        }
        return $path;
    }

    /**
     * 返回地址栏中请求的主机名称
     * @returns {string}
     */
    static public function host()
    {
        return Locator::getRequest()->host();
    }

    /**
     * 返回地址栏中的资源地址
     * 通常是一个带有请求协议的主机名
     * @returns {string}
     */
    static public function origin()
    {
        return Locator::getRequest()->scheme()."://". Locator::getRequest()->host();
    }

    /**
     * 返回地址样中的请求协议
     * 通常为http,https
     * @returns {string}
     */
    static public function scheme()
    {
        return Locator::getRequest()->scheme();
    }

    /**
     * 返回端口号
     * @returns {string|*}
     */
    static public function port()
    {
        return Locator::getRequest()->port();
    }

    /**
     * 返回指定位置的片段名（锚点名）, 从URL的左边开始索引
     * 如果没有指定索引则返回一个数组
     * @param index
     * @returns *
     */
    static public function fragment( $index=-1 )
    {
        $fragment = Locator::getRequest()->fragment();
        if( $index > 0 )
        {
            return isset($fragment[$index]) ? $fragment[$index] : null ;
        }
        return $fragment;
    }

    /**
     * 返回指定名称的值， 如果没有返回指定的默认值
     * @param name 查询指定的key名称
     * @param defaultValue 默认值，默认返回null
     * @returns {*}
     */
    static public function query( $name, $defaultValue=null )
    {
        if ( is_string($name) )
        {
            return isset($_GET[ $name ]) ? $_GET[ $name ] : $defaultValue;
        }
        return (object)$_GET;
    }

    /**
     * 将一个url的片段组装成url
     * @param urlSegments
     * @return {string}
     */
    static public function toUrl( $urlSegments )
    {
        return http_build_url( (array)$urlSegments );
    }

    /**
     * 创建一个指定的url的分段信息
     * @param url  一个完整的url信息
     * @param name 返回指定的段名部分
     * @return {}
     */
    static public function create($url,$name=null)
    {
        if( !is_string($url) )return false;
        $url = time($url);
        if( !preg_match('/^https?\:\/\//i',$url) )
        {
            $request = static::getRequest();
            $port = $request->host();
            if( $port==80 ){
                $port=0;
            }
            $http = $request->scheme().'://'.$request->host().($port?':'.$port:'');
            $url = $url[0] === '/' || $url[0] === '?' ? $http.$url : $http.'/'.$url;
        }

        if( !preg_match('/^((https?)\:\/\/)([^\:\/]+)(\:(\d+))?([\/\?]+[\w\=\-\#\&\{\}\[\]\%\.\,\;\$\~\^\*]+?)?$/si', $url) )
        {
            return null;
        }

        if( is_string($name) )
        {
            $name = strtoupper( $name );
            return defined( 'PHP_URL_'.$name ) ? parse_url($url, constant( 'PHP_URL_'.$name  ) ) : null;
        }
        return (object)parse_url($url);
    }

    /**
     * 返回一个匹配的路由服务提供者
     * @param name
     * @return {*}
     */
    static public function match( $name )
    {
        $urlSegments = static::create( $name );
        if( !$urlSegments )return null;
        if( $urlSegments->host !== static::getRequest()->host() )
        {
            return null;
        }
        $pathName = System::environments("URL_PATH_NAME");
        if( isset($urlSegments->query[ $pathName ])  )
        {
            $name = $urlSegments->query[ $pathName ];
        }else{
            $name = '/'. implode('/',$urlSegments->path);
        }
        $routes = System::environments("HTTP_ROUTES");
        foreach($routes as $method => $route )
        {
            if( isset($route[$name]) )
            {
                return $route[$name];
            }
        }
        return null;
    }
}


