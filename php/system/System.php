<?php
use \es\core\TypeError;
final class System
{
    public static function log()
    {
        $param = func_get_args();
        array_unshift( $param, implode(' ',array_fill(0,func_num_args(),'%s') ) );
        echo call_user_func_array('sprintf',  $param );
    }

    public static function isOf( $obj, $class )
    {
        try {
            if(interface_exists($class))return false;
        }catch (\Exception $e){}
        return self::is($obj, $class);
    }

    public static function is( $obj, $class )
    {
        try{
            switch ( $class )
            {
                case 'Class' :
                    return is_string($obj) ? class_exists($obj, true) : false;
                case 'Array' :
                    return self::isArray( $obj );
                case 'String' :
                    return is_string($obj);
                case 'Boolean' :
                    return is_bool($obj);
                case 'Number' :
                    return is_numeric($obj);
                case 'Object' :
                    return is_object($obj);
            }
            return is_string($obj) ? false : is_a($obj, $class);
        }catch (\Exception $e)
        {
            return false;
        }
    }

    public static function type($obj, $typeClass)
    {
        if( !self::is($obj, $typeClass) )
        {
            throw new TypeError('type is error');
        }
        return $obj;
    }

    public static function typeOf( $obj )
    {
        if( self::isArray( $obj ) )
        {
            return is_callable($obj) ? 'function' : 'array';
        }else if( function_exists( $obj ) ){
            return 'function';
        }else if( is_bool($obj) ){
            return 'boolean';
        }else if( is_numeric($obj) ){
            return 'number';
        }else if( is_string($obj) ){
            return 'string';
        }else if( self::is($obj,'RegExp') ){
            return 'regexp';
        }
        return 'object';
    }

    public static function isObject( $obj, $flag=false )
    {
        $result = is_object($obj);
        if( $result )
        {
            $type = get_class($obj);
            $result = $type === 'es\core\Object' || $type === "stdClass";
            if ( $result || ( $flag !== true && self::isArray( $obj ) ) )
            {
                return true;
            }
        }
        return false;
    }

    public static function isArray( $obj )
    {
        return is_array($obj) || is_a($obj,'ArrayList', false);
    }

    public static function isString( $obj )
    {
        return is_string($obj);
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

    static function document()
    {
        static $doc = null;
        if( $doc===null ) $doc = new \es\core\Document();
        return $doc;
    }

    static function window()
    {
        static $doc = null;
        if( $doc===null ) $doc = new \es\core\Document();
        return $doc;
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
            if( is_object($val)  )
            {
                $key = $prefix ? $prefix . '[' . $key . ']' : $key;
                $val = System::serialize($val, $type, $group ? $key : false);
            }else{
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
}
