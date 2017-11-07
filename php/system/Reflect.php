
<?php
use es\core\System;
final class Reflect
{
    final static private function getReflectionMethodOrProperty($target, $name, $accessor='',$scope=null, $ns=null)
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

    final static public function call( $callback, array $args=null, $thisArg=null, $scope=null, $ns=null )
    {
        if( is_array($callback) )
        {
            $target = $callback[0];
            $name =  $callback[1];
            if( is_string($name) )
            {
                if( is_array($target) )
                {
                    switch ($name) {
                        case 'pop' :
                            return array_pop($target);
                        case 'push' :
                            return array_push($target, $args[0]);
                    }

                } else if( is_string($target) )
                {
                    switch ($name) {
                        case 'toLowerCase' :
                            return strtolower( $target );
                        case 'toUpperCase' :
                            return strtoupper( $target );
                        case 'substr' :
                            return substr( $target, $args[0], isset($args[1]) ? $args[1] : null );
                    }
                }
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
                if( !is_object($target) )
                {
                    throw new ReferenceError( 'target is non-object', __FILE__, __LINE__);
                }
                return $target->__call($name, $args==null ? [] : $args );
            }else
            {
                throw new ReferenceError( $name." method is not accessible", __FILE__, __LINE__);
            }

        }else if( is_callable($callback) )
        {
            if( $thisArg != null )
            {
                $reflect = new \ReflectionFunction( $callback );
                $callback = Closure::bind( $reflect->getClosure(), $thisArg );
            }
            return $args ? call_user_func_array($callback, $args) : $callback();

        }else
        {
            throw new TypeError("Invalid callback method", __FILE__, __LINE__);
        }
    }

    final static public function get($target, $name, $thisArg=null, $scope=null, $ns=null )
    {
        if( is_array($target) || is_a($target, "ArrayAccess") )
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

    final static public function set($target, $name, $value, $thisArg=null, $scope=null, $ns=null )
    {
        if( is_array($target) || is_a($target, "ArrayAccess") )
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

    final static public function has($target, $name, $scope=null, $ns=null )
    {
        return !!self::getReflectionMethodOrProperty($target, $name,'Get_', $scope,$ns);
    }
}