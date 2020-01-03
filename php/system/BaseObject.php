<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System
 */
class BaseObject extends \stdClass implements \Iterator, \ArrayAccess
{
    static public function forEach($target, $callback, $thisArg=null)
    {
        if( $target==null )return;
        if( $thisArg && $thisArg !== null )
        {
            $callback = System::bind($callback,$thisArg);
        }
        foreach ($target as $key=>$item)
        {
            $callback($item, $key);
        }
    }

    static public function merge()
    {
        $length = func_num_args();
        $target = func_get_arg(0);
        $target = $target==null ? new \stdClass() : $target;
        $i = 1;
        $deep = false;

        if ( is_bool($target) )
        {
            $deep = $target;
            $target = func_get_arg(1);
            $target = $target==null ? new \stdClass() : $target;
            $i++;
        }

        $type = System::isArray($target) ? 'array' : 'object';
        for ( ;$i < $length; $i++ )
        {
            $options=null;
            if ( ( $options = func_get_arg($i) ) != null )
            {
                foreach ( $options as $key=>$item )
                {
                    if( !isset($options[$key]) )continue;
                    $copy = $item;
                    if ( $target === $copy )continue;
                    $copyIsArray = false;
                    if ( $deep && $copy && ( System::isObject($copy) || ( $copyIsArray =is_array($copy) ) ) )
                    {
                        $src =  $item;
                        if ( $copyIsArray )
                        {
                            $cloneObj = $src && is_array($src) ? $src : [];
                        } else
                        {
                            $cloneObj = $src && System::isObject($src) ? $src : new \stdClass();
                        }
                        if( $type==='array' )
                        {
                            if( is_int($key) ){
                                array_push( $target, BaseObject::merge( $deep, $cloneObj, $copy ) );
                            }else{
                               $target[ $key ]=BaseObject::merge( $deep, $cloneObj, $copy );
                            }
                        }else
                        {
                            $target->$key=BaseObject::merge( $deep, $cloneObj, $copy );
                        }

                    } else if ( !empty($copy) )
                    {
                        if( $type==='array' )
                        {
                            if( is_int($key) ){
                               array_push( $target, $copy);
                            }else{
                                $target[ $key ]=$copy; 
                            }
                            
                        }else
                        {
                            $target->$key=$copy;
                        }
                    }
                }
            }
        }
        return $target;
    }

    static public function __callStatic($name, $args)
    {
        switch ( $name )
        {
            //param $proto $properties
            case "create" :
                 return BaseObject::merge($args[0]===null ? new \stdClass() : $args[0], $args[1]);
            //param $object
            case "values" :
            //param $object   
            case "keys" :
                $object = $args[0];
                if( $object instanceof BaseObject)
                {
                    $object = $object->valueOf();
                }
                if( $name ==="keys")
                {
                   return new \es\system\ArrayList( array_keys( (array)$object ) );    
                }
                return new \es\system\ArrayList( array_values( (array)$object ) );
            //param $obj, $prop, $desc
            case "defineProperty" :
                $args[0]->$args[1] = $args[2]->value;  
        }
        throw new RefenrenceError("\"{$name}\" is not exists.");
    }

    private $_originValue= array();
    private $_originType= 'object';
    
    public function __construct( $object=null )
    {
         if( $object != null && !is_subclass_of($this,BaseObject::class) )
         {
             if( is_object($object) )
             {
                 $object = (array)$object;
                 $this->_originValue = $object;
                 $this->_originType = 'object';

             }else if( System::isArray($object) )
             {
                 $this->_originType = "array";
                 $this->_originValue = $object;

             }else 
             {
                 $this->_originType = System::typeOf( $object );
                 $this->_originValue = $object;
             }
         }
    }

    public function valueOf()
    {
        $value = $this->_originValue;
        if( System::isObject( $value, true ) )
        {
            foreach ( $value as &$item )
            {
                if( $item instanceof BaseObject )
                {
                    $item = $item->valueOf();
                }
            }
        }
        return $value;
    }

    public function toString()
    {
        return $this->__toString();
    }

    public function __toString()
    {
        switch ( $this->_originType )
        {
            case 'string'  :
            case 'number'  :
            case 'boolean' :
            case 'regexp'  :
                return $this->_originValue;
            break;
        }
        return '[object '.get_class( $this ).']';
    }

    public function hasOwnProperty( $name )
    {
        return isset( $this->_originValue[$name] );
    }

    public function propertyIsEnumerable( $name )
    {
        return isset( $this->_originValue[$name] );
    }

    public function getEnumerableProperties( $state=null )
    {
        return array_slice($this->_originValue,0);
    }

    public function offsetExists($offset)
    {
        return isset( $this->_originValue[$offset] );
    }

    public function offsetGet($offset)
    {
        return isset( $this->_originValue[$offset] ) ? $this->_originValue[$offset] : null;
    }

    public function offsetSet($offset, $value)
    {
        if ( is_null($offset) )
        {
            $this->_originValue[] = $value;
        } else {
            $this->_originValue[$offset] = $value;
        }
    }

    public function offsetUnset($offset)
    {
        if( $this->_originValue )
        {
            unset($this->_originValue[$offset]);
        }
    }

    public function current()
    {
        return current($this->_originValue);
    }

    public function next()
    {
        return next($this->_originValue);
    }

    public function key()
    {
        return key($this->_originValue);
    }

    public function valid()
    {
        return key($this->_originValue) != null;
    }

    public function rewind()
    {
        return reset($this->_originValue);
    }

    public function __get($name)
    {
        return isset($this->_originValue[$name]) ? $this->_originValue[$name] : null;
    }

    public function __isset($name)
    {
        return isset($this->_originValue[$name]);
    }

    public function __unset($name)
    {
       unset( $this->_originValue[$name] );
    }

    public function __set($name,$value)
    {
        if( $this->_originType && $this->_originType !== "object" && is_subclass_of($this,"BaseObject") )
        {
            throw new ReferenceError($name . ' is not writable. The value type is an '.$this->_originType);
        }
        $this->_originValue[ $name ] = $value;
    }
}
