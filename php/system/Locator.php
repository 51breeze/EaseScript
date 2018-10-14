<?php
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require TypeError
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
    static public function fragment( $index )
    {
        return Locator::getRequest()->fragment();
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
}


