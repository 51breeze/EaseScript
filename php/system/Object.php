<?php

use es\core\ReferenceError;
use es\core\System;

class Object extends \stdClass implements \Iterator, \ArrayAccess
{
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

        if ( $length === $i )
        {
            $target = new \stdClass();
            --$i;

        }else if ( !System::isObject($target) )
        {
            $target = new \stdClass();
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
                            $target[ $key ]=Object::merge( $deep, $cloneObj, $copy );
                        }else
                        {
                            $target->$key=Object::merge( $deep, $cloneObj, $copy );
                        }

                    } else if ( !empty($copy) )
                    {
                        if( $type==='array' )
                        {
                            $target[ $key ]=$copy;
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

    private $_originValue= null;
    private $_originType= null;
    public $length = 0;

    public function __construct( $object=null )
    {
         if( $object != null && !is_subclass_of($this,"Object") )
         {
             if( System::is($object,'Object') && !is_a($object,'ArrayAccess')  )
             {
                 $this->_originValue = $object->_originValue;
                 $this->_originType =  $object->_originType;

             }else if( is_object($object) )
             {
                 $object = (array)$object;
                 $this->_originValue = $object;
                 $this->_originType = 'object';

             }else
             {
                 $this->_originType = System::typeOf( $object );
                 $this->_originValue = $object;
             }

         }else
         {
             $this->_originValue = array();
             $this->_originType = 'object';
         }
    }

    public function valueOf()
    {
        return $this->_originValue;
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
            case 'regexp' :
                return $this->_originValue;
            break;
        }
        return json_encode( $this->_originValue, JSON_UNESCAPED_UNICODE);
    }

    public function defineProperty($obj, $prop, $desc)
    {
    }

    function hasOwnProperty( $name )
    {
        return isset( $this->_originValue[$name] );
    }

    function propertyIsEnumerable( $name )
    {
        return isset( $this->_originValue[$name] );
    }

    function keys()
    {
        return array_keys($this->_originValue);
    }

    public function values()
    {
        return array_values( $this->_originValue );
    }

    function getEnumerableProperties( $state=null )
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
        unset( $this->_originValue[$offset] );
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
        if( isset($this->__sealed__) && $this->__sealed__===true )
        {
            throw new ReferenceError($name.' is not exists.',__FILE__, __LINE__);
        }
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
        if( isset($this->__sealed__) && $this->__sealed__===true )
        {
            throw new ReferenceError($name . ' is not exists.', __FILE__, __LINE__);
        }
        if( $this->_originType !== "object" && is_subclass_of($this,"Object") )
        {
            throw new ReferenceError($name . ' is not writable. The value type is an '.$this->_originType,__FILE__, __LINE__);
        }
        $this->_originValue[ $name ] = $value;
    }

    public function __call($name, $arguments)
    {
        if( !method_exists($this, $name) )
        {
            throw new ReferenceError($name . ' is not exists.',__FILE__, __LINE__);
        }
        return call_user_func_array( array($this, $name),  $arguments );
    }
}
