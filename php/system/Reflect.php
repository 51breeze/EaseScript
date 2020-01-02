<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Namespaces,TypeError,System,ReferenceError
 */
final class Reflect
{
    final static private function funMap($type)
    {
        static $map=null;
        if( $map === null )
        {
            $map = [
                "system"=>function (&$target, &$name, $args=null){
                    
                    switch ( $name ) {
                        case "isDefined":
                            return ["isset", [&$target]];
                        case "trim" :
                            return ["trim",[&$target]];
                        case "isString" :
                            return ["is_string",[&$target]];
                        case "isFunction" :
                            return ["is_callable",[&$target]];
                        case "parseInt" :
                            return ["intval",[&$target]];
                    }
                    return null;
                },
                "function"=>function (&$target, &$name, $args=null) {
                    switch ( $name ) {
                        case "call" :
                            return  [["\\es\\system\\Reflect","call"], $args ];
                        case "apply" :
                            return  [["\\es\\system\\Reflect","apply"], $args ];
                        case "bind" :
                            return  [["\\es\\system\\System","bind"], $args ];
                    }
                    return null;
                },
                "array"=>function (&$target, &$name, $args=null)
                {
                    switch ( $name ){
                        case "slice" :
                            return ["array_slice", $args];
                        case "indexOf" :
                            return [function(&$target,&$needle){ 
                                return ($result = array_search($needle, $target)) !== false ? $result : -1;
                            }, array_merge( [&$target], $args) ];
                        case "splice" :
                            return ["array_splice", array_merge( [&$target], $args) ];
                        case "push" :
                            return ["array_push", array_merge( [&$target], $args) ];
                        case "shift" :
                            return ["array_shift", array_merge( [&$target], $args) ];
                        case "unshift" :
                            return ["array_unshift", array_merge( [&$target], $args) ];
                        case "pop" :
                            return ["array_unshift", [&$target] ];
                        case "length" :
                            return ["count", [&$target] ];
                        case "concat" :
                            return [function(&$args){
                                $results = [];
                                foreach( $args as $value )
                                {
                                    if( $value instanceof \es\system\BaseObject )
                                    {
                                        $value = $value->valueOf();
                                    }
                                    if( System::isArray($value) )
                                    {
                                        $results = array_merge($results, $value);
                                    }else{
                                        array_push($results,  $value);
                                    }
                                }
                                return $results;
                            }, [array_merge( [&$target], $args)] ];
                        case "fill" :
                            return ["array_fill", array_merge( [&$target], $args) ];
                        case "filter" :
                            return ["array_filter", array_merge( [&$target], $args) ];
                        case "forEach" :
                            return ["array_walk", array_merge( [&$target], $args) ];
                        case "join" :
                            return ["implode", array_merge($args,[&$target]) ];
                        case "unique" :
                            return ["array_unique", [&$target] ];
                        case "sort" :
                            return ["usort", array_merge( [&$target], $args) ];
                        case "map" :
                            return ["array_map", array_merge($args, [&$target] ) ];
                        case "lastIndexOf" :
                            return [function(&$target,&$needle){
                                $len = count( $target );
                                while( $len > 0 )
                                {
                                    if( $target[ --$len ] === $needle )
                                    {
                                        return $len;
                                    }
                                }
                                return null;
                            }, array_merge( [&$target], $args) ];
                        case "find" :
                            return [function(&$target,&$needle){
                                $len = count( $target );
                                for( $index = 0; $index < $len;$index++ )
                                {
                                    if( $target[ $index ] === $needle )
                                    {
                                        return  $target[ $index ];
                                    }
                                }
                                return null;
                            }, array_merge( [&$target], $args) ];
                    }
                    return null;
                },
                "string"=>function (&$target, &$name, $args=null)
                {
                    switch ( $name )
                    {
                        case "length" :
                            return ["mb_strlen", [$target] ];
                        case "replace" :
                            return ["str_replace", array_merge($args,[$target])];
                        case "indexOf" :
                            return [function(&$target,&$needle){
                                return ($result = strpos($target, $needle )) !== false ? $result : -1;
                            }, array_merge( [$target], $args) ];
                        case "lastIndexOf" :
                            return [function(&$target,&$needle){
                                return ($result = strrpos($target, $needle )) !== false ? $result : -1;
                            }, array_merge( [$target], $args) ];
                        case "match" :
                            return [ [$args[0],$name], [$target] ];
                        case "matchAll" :
                            return [ [$args[0],$name], [$target] ];
                        case "split" :
                            return ["explode", [$args[0],$target]];
                        case "search" :
                            return [function(&$target,&$needle){
                                if( is_string($needle) )
                                {
                                    return ($result = strpos($target, $needle )) !== false ? $result : -1;

                                }else if( $needle instanceof \es\system\RegExp )
                                {
                                    return $needle->search( $target );
                                }
                                throw new \es\system\TypeError("String.search parameter can only be String or RegExp");
                            }, array_merge( [$target], $args) ];
                        case "charAt" :
                            return ["substr", [$target,$args[0],$args[0]+1] ];
                        case "charCodeAt" :
                            return ["ord", [substr($target,$args[0],$args[0]+1)]];
                        case "repeat" :
                            return ["str_repeat",  array_merge([$target], $args)];
                        case "slice" :
                            return ["substr",array_merge([$target], $args)];
                        case "substring" :
                            return ["substr",array_merge([$target], $args)];
                        case "substr" :
                            return ["substr",array_merge([$target], $args)];
                        case "toLocaleLowerCase" :
                        case "toLowerCase" :
                            return ["strtolower",[$target]];
                        case "toLocaleUpperCase" :
                        case "toUpperCase" :
                            return ["strtoupper",[$target]];
                        case "trim" :
                            return ["trim",[$target]];
                        case "trimRight" :
                            return ["rtrim",[$target]];
                        case "trimLeft" :
                            return ["ltrim",[$target]];
                        case "includes" :
                            return [function(&$target,&$needle){
                                return @strpos( $target, $needle) !== false;
                            },array_merge([$target], $args)];
                        case "concat" :
                            return ["implode",  array_merge([""], [array_merge([$target], $args)])];
                        case "padEnd" :
                            return ["str_pad", array_merge([$target], array_merge( array_pad( $args,3," " ),STR_PAD_RIGHT))];
                        case "padStart" :
                            return ["str_pad", array_merge([$target], array_merge( array_pad( $args,3," " ),STR_PAD_LEFT))];
                    }
                    return null;
                } ,
                "regexp"=>function (&$target, &$name, $args=null)
                {
                    return null;
                },
                "math"=>function (&$target, &$name, $args=null)
                {
                    switch ( $name )
                    {
                        case "random" :
                            return [function(){
                                return mt_rand(1,2147483647) / 2147483647;
                            },[]];
                        default :
                            return [$name, $args];
                    }
                    return null;
                }
            ];
        }
        return @$map[$type] ?: null;
    }

    final static private function getReflectionMethodOrProperty( $target, $name, $accessor='',$scope=null, $ns=null)
    {
        if( $target==null )
        {
            return null;
        }

        $reflect = null;
        if( is_string($target) ){
            $reflect = new \ReflectionClass( $target );
        } else{
            $reflect = new \ReflectionObject( $target );
        }

        $type = 0;
        $method = null;
        if( $ns != null )
        {
            $ns = is_array($ns) ? $ns : array($ns);
            $len = count( $ns );
            $index = 0;
            $lastProperty = [];

            while ( $index < $len )
            {
                $prop =  '_N'. Namespaces::getUid( $ns[$index]->valueOf() ).'_'.$name;
                $accessor =  '_N'. Namespaces::getUid( $ns[$index]->valueOf() ).'_'.$accessor.$name;
                if( $reflect->hasProperty( $prop )  )
                {
                    $method = $reflect->getProperty($prop);
                    array_push($lastProperty , array(1,$prop,$method) );
                }
                if( $reflect->hasMethod( $accessor ) )
                {
                    $method = $reflect->getMethod( $accessor );
                    array_push($lastProperty , array(2,$accessor,$method) );
                }
                $index++;
            }
            if( count($lastProperty) !==1 )
            {
                if( count($lastProperty)===0 )
                {
                   return null;
                }else{
                   return false;
                }
            }
            list($type,$name,$method) = $lastProperty[0];
        }

        //在实例对象中查找
        if( $reflect->hasProperty($name) )
        {
            $type = 1;
            $method = $reflect->getProperty($name);

        }else if(  $reflect->hasMethod( $accessor.$name ) )
        {
            $type = 2;
            $name = $accessor.$name;
            $method = $reflect->getMethod( $name );

        }else if(  $reflect->hasMethod( $name ) )
        {
            $type = 3;
            $name = $name;
            $method = $reflect->getMethod( $name );
        }

        $scopeReflect = null;

        //如果指定的$target是$scope的子类，尝试在作用域中查找
        if( $type === 0 && $scope && is_subclass_of($target, $scope) )
        {
            $scopeReflect = is_string($scope) ? new \ReflectionClass($scope) : new \ReflectionObject( $scope );
            if( $scopeReflect->hasProperty($name) )
            {
                $type = 1;
                $method = $scopeReflect->getProperty($name);

            }else if(  $scopeReflect->hasMethod( $accessor.$name ) )
            {
                $type = 2;
                $name = $accessor.$name;
                $method = $scopeReflect->getMethod( $name );
            
            }else if(  $scopeReflect->hasMethod( $name ) )
            {
                $type = 3;
                $name = $name;
                $method = $scopeReflect->getMethod( $name );
            }
        }

        if( $method == null )return null;

        $accessible = $method->isPublic();
        if( $scope != null && !$accessible )
        {
            if( $scopeReflect ===null )
            {
                $scopeReflect = is_string($scope) ? new \ReflectionClass($scope) : new \ReflectionObject( $scope );
            }

            if( $method->isPrivate() && $method->class === $scopeReflect->getName() )
            {
                $method->setAccessible( true );
                $accessible = true;

            }else if( $method->isProtected() && ( $method->class === $scopeReflect->getName() || $scopeReflect->isSubclassOf( $method->class ) ) )
            {
                $method->setAccessible( true );
                $accessible=true;
            }
        }
        return $accessible ? array($type, $method, $reflect) : null;
    }

    /**
     * Reflect.construct() 方法的行为有点像 new 操作符 构造函数 ， 相当于运行 new target(...args).
     * @param target
     * @param argumentsList
     * @returns {*}
     */
    final static public function construct($scope, $target , $args=null )
    {
        if( class_exists($target) )
        {
            $reflect = new \ReflectionClass( $target );
            if( $reflect->isAbstract() )
            {
                throw new TypeError('Abstract class cannot be instantiated');
            }

            if ($args && System::isArray($args)) {
                return $reflect->newInstanceArgs($args);
            } else {
                return $reflect->newInstance($args);
            }

        }else
        {
            throw new TypeError('Not found the "'.$target.'" class.');
        }
    }

    final static public function apply( $target, $thisArgument=null, $argumentsList=null )
    {
        if( !is_callable($target) )
        {
            throw new TypeError('target is not callable');
        }
        if( $thisArgument !=null )
        {
            $target = System::bind( $target, $thisArgument);
        }
        return call_user_func_array( $target, $argumentsList==null ? array() : $argumentsList instanceof BaseObject ? $argumentsList->valueOf() : $argumentsList );
    }

    final static public function call( $scope, $target, $name=null, array $args=null, $thisArg=null, $ns=null )
    {
        $type = null;
        if( is_string($target) )
        {
            $type = "string";
        }else if( is_array($target) )
        {
            $type = "array";
        }

        if( $type )
        {
            $fn = Reflect::funMap( $type );
            if( $fn )
            {
                $args = $args ?: [];
                $method = $fn($target, $name, $args);
                if( $method )
                {
                    return call_user_func_array($method[0], $method[1]);
                }
            }
        }

        if( is_callable($target) && $name==null )
        {
            return Reflect::apply($target, $thisArg, $args);
        }

        if( !is_object($target) )
        {
            throw new ReferenceError( 'target is non-object');
        }

        $desc =  self::getReflectionMethodOrProperty($target, $name,'',$scope,$ns);
        if( $desc )
        {
            list($type, $method) = $desc;
            $desc = false;
            if( $type===2 )
            {
                $thisArg = $thisArg==null && !is_string($target) ? $target : $thisArg;
                if( $thisArg != null && $thisArg !== $target )
                {
                    $fn = \Closure::bind( $method->getClosure($thisArg), $thisArg );
                    return $args==null ? $fn() : call_user_func_array($fn, $args);
                }
                return $args==null ? $method->invoke( $thisArg ) : $method->invokeArgs( $thisArg , $args );
            }
        }

        if( $desc==false )
        {
            return $target->__call($name, $args==null ? [] : $args );
        }else
        {
            throw new ReferenceError( $name." method is not accessible", __FILE__, __LINE__);
        }
    }

    final static public function get( $scope, $target, $name, $thisArg=null, $ns=null )
    {
        if( System::isArray($target) )
        {
            if ( is_string($name) )
            {
                switch ($name) {
                    case 'length' :
                        return count($target);
                }
            }
            return isset($target[$name]) ? $target[$name] : null;
        }

        if ( is_string($target) )
        {
            switch ($name) {
                case 'length' :
                    return strlen( $target );
            }
        }

        $desc =  self::getReflectionMethodOrProperty($target, $name,'Get_', $scope,$ns);
        if( $desc )
        {
            list($type, $method) = $desc;
            if( $type === 3 )
            {
                return $method->getClosure($target);
            }

            if( $type===2 )
            {
                $thisArg = $thisArg==null ? $target : $thisArg;
                if( $thisArg !== $target )
                {
                    $fn = \Closure::bind( $method->getClosure($target), $thisArg );
                    return $fn();
                }
                return $method->invoke( $thisArg );

            }else
            {
                return $method->getValue($target);
            }
        }
        return $target->__get($name);
    }

    final static public function type($value, $typeClass)
    {
        if( is_string($typeClass) )
        {
            $original = $value;
            $flag = false;
            switch ( strtolower($typeClass) )
            {
                case "integer" :
                case "int" :
                case "number":
                case "uint":
                    $value = intval($value);
                    $flag = true;
                    if ( strtolower($typeClass) !== "number")
                    {
                        if( $typeClass === "uint" && $value < 0 )throw new RangeError($original ." convert failed. can only be an unsigned Integer");
                        if( $value > 2147483647 || $value < -2147483648)throw new RangeError($original . " convert failed. the length of overflow Integer");
                    }
                    break;
                case "double":
                case "float":
                    $flag = true;
                    $value = floatval($value);
                    break;
            }

            if( $flag ===true )
            {
                if( System::isNaN($value) ) throw new TypeError($original + " can not be converted for " . $typeClass);
                return $value;
            }
        }

        if( $value == null || $typeClass === "Object" )return $value;
        if ( $typeClass && !System::is($value, $typeClass) )
        {
            throw new TypeError( 'Specify the type of value do not match. must is "'.$typeClass.'"');
        }
        return $value;
    }

    final static public function set($scope,$target, $name, $value, $thisArg=null,$ns=null )
    {
        if( System::isArray($target) )
        {
            if ( is_string($name) )
            {
                switch ($name)
                {
                    case 'length' :
                        return count($target);
                }
            }
            return $target[$name] = $value;
        }

        $desc =  self::getReflectionMethodOrProperty($target, $name,'Set_', $scope,$ns);
        if( $desc )
        {
            list($type, $method) = $desc;
            $desc = false;
            if( $type===2 )
            {
                $thisArg = $thisArg==null ? $target : $thisArg;
                if( $thisArg!==$target )
                {
                    $fn = \Closure::bind( $method->getClosure($target), $thisArg );
                    return $fn( $value );
                }
                $method->invoke( $thisArg , $value );
                return $value;

            }else
            {
                $method->setValue($target, $value);
                return $value;
            }
        }
        $target->__set($name,$value);
        return $value;
    }

    final static public function has($scope, $target, $name,$ns=null )
    {
        return !!self::getReflectionMethodOrProperty($target, $name,'Get_', $scope,$ns);
    }

    final static public function incre($scope,$target, $propertyKey, $flag=true , $ns=null )
    {
        $val = \Reflect::get($scope,$target, $propertyKey, null, $ns );
        $ret = $val+1;
        \Reflect::set($scope,$target, $propertyKey, $ret , null, $ns );
        return $flag ? $val : $ret;
    }

    final static public function decre($scope,$target, $propertyKey, $flag=true , $ns=null )
    {
        $val = \Reflect::get($scope,$target, $propertyKey, null, $ns );
        $ret = $val-1;
        \Reflect::set($scope,$target, $propertyKey, $ret , null, $ns );
        return $flag ? $val : $ret;
    }
}