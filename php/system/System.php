<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require EventDispatcher,Document,Window,TypeError
 */

define('NaN','NaN');
define('ES_BUILD_APPLICATION_NAME','{@ES_BUILD_APPLICATION_NAME}');
define('ES_BUILD_LIBARAY_NAME','{@ES_BUILD_LIBARAY_NAME}');
define('ES_BUILD_SYSTEM_PATH','{@ES_BUILD_SYSTEM_PATH}');

final class System
{
    public static function log()
    {
        $param = func_get_args();
        array_unshift( $param, implode(' ',array_fill(0,func_num_args(),'%s') ) );
        echo call_user_func_array('sprintf',  $param );
    }

    /**
     * 全局唯一值
     * @returns {string}
     */
    public static function uid( $len=null )
    {
        if( $len ===null )
        {
            return md5( uniqid( md5( microtime(true) ),true) );
        }
        static $hash=array();
        $code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $rand = $code[rand(0,25)]
            .strtoupper(dechex(date('m')))
            .date('d')
            .substr(time(),-5)
            .substr(microtime(),2,5)
            .sprintf('%02d',rand(0,99));
        $len = min( max(6,$len), 12);
        for(
            $a = md5( $rand, true ),
            $s = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            $d = '',
            $f = 0;
            $f < $len;
            $g = ord( $a[ $f ] ),
            $d .= $s[ ( $g ^ ord( $a[ $f + 8 ] ) ) - $g & 0x1F ],
            $f++
        );
        if( isset($hash[$d]) )
        {
            return static::uid( $len );
        }
        $hash[$d] = true;
        return $d;
    }

    public static function isIterator( $obj )
    {
        static $iteratorClass = 'es\interfaces\IListIterator';
        if( interface_exists($iteratorClass) )
        {
            return is_a($obj, $iteratorClass);
        }
        return false;
    }

    /**
     * 判断对象是否为指定的类型
     * @param $obj 检查的目标对象
     * @param $class 指定的对象类型
     * @param bool $flag 是否查检接口类型。可选值true检查接口类型false不检查接口,默认true。
     * @return bool
     */
    public static function is( $obj, $class, $flag=true )
    {
        try{
            switch ( strtolower($class) )
            {
                case 'class' :
                    return is_string($obj) ? class_exists($obj, true) : false;
                case 'array' :
                    return static::isArray( $obj );
                case 'string' :
                    return is_string($obj);
                case 'boolean' :
                    return is_bool($obj);
                case "int" :
                case 'integer' :
                case 'number' :
                    return is_numeric($obj);
                case 'uint' :
                    return is_numeric($obj) && $obj >= 0;
                case "double" :
                case "float" :
                    return is_float($obj);
                case 'object' :
                    return $obj===null ? true : System::isObject($obj);
            }
            return is_string($obj) ? false : ( $flag === true ?  is_a($obj, $class) : $obj instanceof $class );
        }catch (\Exception $e)
        {
            return false;
        }
    }

    public function isScalar( $obj )
    {
        return false;
    }

    public static function typeOf( $obj )
    {
        if( is_callable( $obj ) ){
            return 'function';
        }else if( static::isArray( $obj ) ) {
            return 'array';
        }else if( is_bool($obj) ){
            return 'boolean';
        }else if( is_numeric($obj) ){
            return 'number';
        }else if( is_string($obj) ){
            return 'string';
        }else if( static::is($obj, ES_BUILD_SYSTEM_PATH.'\RegExp',false) ){
            return 'regexp';
        }
        return 'object';
    }

    public static function isObject( $obj, $flag=false )
    {
        if( is_object($obj) )
        {
            $type = strtolower(get_class($obj));
            return $type === trim(ES_BUILD_SYSTEM_PATH.'\baseobject','\\') || $type === "stdclass" || $type === "object";

        }else if( $flag !== true && is_array( $obj ) )
        {
            return true;
        }
        return false;
    }

    public static function isArray( $obj )
    {
        static $arrayListClass = 'es\system\ArrayList';
        return is_array($obj) || is_a($obj,$arrayListClass,false);
    }

    public static function isString( $obj )
    {
        return is_string($obj);
    }

    public static function isNumber( $obj )
    {
        return is_numeric($obj);
    }

    public static function isNaN($value)
    {
        return $value === NaN || !is_numeric($value);
    }

    public static function range($low, $high, $step=1)
    {
        return $high > $low ? range($low, $high, $step) : array($low);
    }

    public static function bind($thisArg, $callback )
    {
        if( is_array($callback) )
        {
            if( count($callback) === 2 )
            {
                $reflect = is_string($callback[0]) ? new \ReflectionClass($callback[0]) : new \ReflectionObject($callback[0]);
                if ($reflect->hasMethod($callback[1])) {
                    $method = $reflect->getMethod($callback[1]);
                    $method = \Closure::bind(is_string($callback[0]) ? $method->getClosure() : $method->getClosure($callback[0]), $thisArg);
                    return $method;
                }
            }else
            {
                $callback = $callback[0];
            }
        }
        if( is_callable($callback) )
        {
            $reflect = new \ReflectionFunction($callback);
            return \Closure::bind( $reflect->getClosure() , $thisArg);
        }
        throw new TypeError('callback is not callable');
    }

    static function when()
    {
        $num =  func_num_args();
        $index = 0;
        while( $index < $num )
        {
            if ( func_get_arg($index) != null )
            {
                return func_get_arg($index);
            }
            $index++;
        }
        return func_get_arg($num-1);
    }

    static function serialize($object, $type='url', $group=true)
    {
        if ( is_string($object)  || $object==null )
        {
            return $object==null ? '' : $object;
        }
        $str = [];
        $joint = '&';
        $separate = '=';
        $prefix = is_bool($group) ? null : $group;
        $group = $group !== false;
        if ($type === 'style')
        {
            $joint = ';';
            $separate = ':';
            $group = false;

        } else if ($type === 'attr')
        {
            $separate = '=';
            $joint = ' ';
            $group = false;
        }
        
        foreach ($object as $key=>$val)
        {
            if( static::isObject($val) )
            {
                $key = $prefix ? $prefix . '[' . $key . ']' : $key;
                $val = static::serialize($val, $type, $group ? $key : false);
            }else{
                if( $type === 'attr' )
                {
                    if (is_bool($val)) {
                        $val = $val ? "true" : "false";
                    } else if ($val === null) {
                        $val = "null";
                    }
                }
                $val = $type === 'attr' ? '"' . $val . '"' : $val;
            }
            array_splice( $str, 0, 0, array( $key . $separate . $val ) );
        }
        return implode($joint, $str);
    }

    static function unserialize($str)
    {
        $object = array();
        $joint = '&';
        $separate = '=';
        $group = false;
        if ( preg_match('/[\w\-]+\s*\=.*?(?=\&|$)/',$str) )
        {
            $str = preg_replace('/^&|&$/','',$str);
            $group = true;

        } else if ( preg_match('/[\w\-\_]+\s*\:.*?(?=\;|$)/',$str) )
        {
            $joint = ';';
            $separate = ':';
            $str =preg_replace('/^;|;$/','',$str);
        }

        $str = explode($joint,$str);
        foreach ($str as $index=>$item) {
            $item = explode($separate,$item);
            if ( $group && preg_match('/\]\s*$/',$item[0]) )
            {
                $ref = &$object;
                $last= null;
                $lastKey= '';

                preg_replace('/\w+/i',function ($key)use( &$ref, $last, $lastKey ) {
                    $last = &$ref;
                    $lastKey = $key;
                    $ref = !isset( $ref[$key] ) ? $ref[ $key ] = array() : $ref[ $key ];
                }, $item[0] );

                if( $last!=null)
                {
                    $last[ $lastKey ] = $item[1];
                }

            } else
            {
                $object[ $item[0] ] = $item[1];
            }
        }
        return $object;
    }

    static function getQualifiedObjectName( $object )
    {
        return get_class($object);
    }

    static private $globalEvent=null;
    static function getGlobalEvent()
    {
        if( static::$globalEvent===null )
        {
            static::$globalEvent = new EventDispatcher( static::window() );
        }
        return static::$globalEvent;
    }

    static private $context = null;
    static function getContext()
    {
        return static::$context;
    }
}
