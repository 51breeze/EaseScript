<?php
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,BaseObject,ReferenceError,TypeError
 */
class ArrayList extends BaseObject implements \Countable
{
    private $dataItems=array();
    public function __construct()
    {
        $this->dataItems=func_get_args();
    }

    public function slice($offset, $length = null, $preserve_keys = null)
    {
        return array_slice($this->dataItems, $offset, $length, $preserve_keys);
    }

    public function splice($offset, $length = null, $replacement = null)
    {
        if( $replacement===null )
        {
            return array_splice($this->dataItems, $offset, $length);
        }
        return array_splice($this->dataItems, $offset, $length, array( $replacement ) );
    }

    public function concat()
    {
        $param = array_merge( array( $this->dataItems ) , func_get_args() );
        return new ArrayList( call_user_func_array("array_merge", $param ) );
    }

    public function join( $glue="" )
    {
        return implode($glue, $this->dataItems );
    }

    public function pop()
    {
        return array_pop( $this->dataItems );
    }

    public function push()
    {
        $param = array_merge( array( &$this->dataItems ) , func_get_args() );
        return call_user_func_array('array_push', $param );
    }

    public function shift()
    {
        return array_shift( $this->dataItems );
    }

    public function unshift()
    {
        $param = array_merge( array( &$this->dataItems ) , func_get_args() );
        return call_user_func_array('array_unshift', $param );
    }

    public function sort()
    {
        return sort( $this->dataItems );
    }

    public function reverse( $keys = null )
    {
        return new ArrayList( array_reverse( $this->dataItems , $keys ) );
    }

    public function indexOf( $value )
    {
        return array_search($value, $this->dataItems, true );
    }

    public function map( $callback, $thisArg = null )
    {
        if( $thisArg == null )$thisArg=$this;
        $callback = System::bind($thisArg,$callback);
        return new ArrayList( array_map( $callback , $this->dataItems ) );
    }

    public function each( $callback , $thisArg = null )
    {
        if( $thisArg == null )$thisArg=$this;
        $callback = System::bind($thisArg,$callback);
        $this->rewind();
        while ( $this->valid() )
        {
            $callback($this->current(), $this->key() );
            $this->next();
        }
        $this->rewind();
    }

    public function filter($callback = null, $flag = 0 )
    {
        return new ArrayList( array_filter($this->dataItems,  $callback, $flag ) );
    }

    public function unique( $sort = null )
    {
        return new ArrayList( array_unique($this->dataItems, $sort ) );
    }

    public function fill($value, $start, $end)
    {
        return new ArrayList( array_fill($start, $end, $value ) );
    }

    public function find($callback, $thisArg = null)
    {
        if( $thisArg == null )$thisArg=$this;
        $callback = System::bind($thisArg,$callback);
        $this->rewind();
        while ( $this->valid() )
        {
            if( $callback($this->current(), $this->key() ) )
            {
                $this->rewind();
                return $this->current();
            }
            $this->next();
        }
        $this->rewind();
        return null;
    }

    public function count()
    {
        return count( $this->dataItems );
    }

    public function offsetExists($offset)
    {
        if( $offset==='length' ) return true;
        return isset( $this->dataItems[$offset] );
    }

    public function offsetGet($offset)
    {
        if( $offset==='length' )return $this->length;
        return isset( $this->dataItems[$offset] ) ? $this->dataItems[$offset] : null;
    }

    public function offsetSet($offset, $value)
    {
        if( $offset==='length' )
        {
            throw new ReferenceError('The length property is not writable');
        }
        if ( is_null($offset) )
        {
            $this->dataItems[] = $value;
        } else {
            $this->dataItems[$offset] = $value;
        }
        $this->length++;
    }

    public function offsetUnset($offset)
    {
        if( $offset!=='length' )
        {
            unset($this->dataItems[$offset]);
            $this->length--;
        }
    }

    public function current()
    {
        return current($this->dataItems);
    }

    public function next()
    {
        return next($this->dataItems);
    }

    public function key()
    {
        return key($this->dataItems);
    }

    public function valid()
    {
        return key($this->dataItems) !== null;
    }

    public function rewind()
    {
        return reset($this->dataItems);
    }

    public function valueOf()
    {
       return $this->dataItems;
    }

    public function __toString()
    {
        return json_decode($this->dataItems, JSON_UNESCAPED_UNICODE );
    }

    public function __get($name)
    {
        if( $name ==="length" )
        {
            return count( $this->dataItems );
        }
        return parent::__get($name);
    }

    public function __set($name, $value)
    {
        if( $name ==="length" )
        {
            throw new ReferenceError('The length property is not writable');
        }
        return parent::__set($name, $value);
    }

}