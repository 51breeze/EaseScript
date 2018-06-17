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

            }else if( $method->isProtected() && $scopeReflect->isSubclassOf( $method->class ) )
            {
                $method->setAccessible( true );
                $accessible=true;
            }
        }
        return $accessible ? array($type, $method, $reflect) : null;
    }

    final static public function apply( $target, $thisArgument=null, $argumentsList=null )
    {
        if( !is_callable($target) )
        {
            throw new TypeError('target is not callable');
        }
        if( $thisArgument !=null )
        {
            $obj = new \ReflectionFunction( $target );
            $target = \Closure::bind( $obj->getClosure(), $thisArgument );
            unset($obj);
        }
        return call_user_func_array( $target, $argumentsList==null ? array() :  $argumentsList );
    }

    final static public function call( $scope, $target, $name=null, array $args=null, $thisArg=null, $ns=null )
    {
        if( is_string($target) )
        {
            switch ( $name ){
                case "charAt" :
                    return $target[ $args[0] ];
                break;
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
            return $target[$name];
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
            $desc = false;
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
        if ( $typeClass && !\System::is($value, $typeClass) )
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