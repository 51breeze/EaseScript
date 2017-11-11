<?php
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,ReferenceError,TypeError
 */
class ArrayList extends Object implements \Countable
{
    public $length = 0;
    private $_dataItems=array();
    public function __construct( $data = null )
    {
        if( !System::is( $data, 'Array') )
        {
            $data = array();
        }
        $this->_dataItems=$data;
        $this->length=count( $data );
    }

    public function slice($offset, $length = null, $preserve_keys = null)
    {
        return array_slice($this->_dataItems, $offset, $length, $preserve_keys);
    }

    public function splice($offset, $length = null, $replacement = null)
    {
        $param = func_get_args();
        array_unshift( $param, $this->_dataItems );
        return call_user_func_array("array_splice", $param );
    }

    public function concat()
    {
        $param = func_get_args();
        array_unshift( $param, $this->_dataItems );
        return new ArrayList( call_user_func_array("array_merge", $param ) );
    }

    public function join( $glue="" )
    {
        return implode($glue, $this->_dataItems );
    }

    public function pop()
    {
        return array_pop( $this->_dataItems );
    }

    public function push()
    {
        $param = func_get_args();
        array_unshift( $param, $this->_dataItems );
        return call_user_func_array('array_push', $param );
    }

    public function shift()
    {
        return array_shift( $this->_dataItems );
    }

    public function unshift()
    {
        $param = func_get_args();
        array_unshift( $param, $this->_dataItems );
        return call_user_func_array('array_unshift', $param );
    }

    public function sort()
    {
        sort( $this->_dataItems );
        return $this;
    }

    public function reverse( $keys = null )
    {
        return new ArrayList( array_reverse( $this->_dataItems , $keys ) );
    }

    public function indexOf( $value )
    {
        return array_search($value, $this->_dataItems, true );
    }

    public function map( $callback, $thisArg = null )
    {
        if( $thisArg == null )$thisArg=$this;
        $callback = System::bind($thisArg,$callback);
        return new ArrayList( array_map( $callback , $this->_dataItems ) );
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
        return new ArrayList( array_filter($this->_dataItems,  $callback, $flag ) );
    }

    public function unique( $sort = null )
    {
        return new ArrayList( array_unique($this->_dataItems, $sort ) );
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
        return $this->length;
    }

    public function offsetExists($offset)
    {
        if( $offset==='length' ) return true;
        return isset( $this->_dataItems[$offset] );
    }

    public function offsetGet($offset)
    {
        if( $offset==='length' )return $this->length;
        return isset( $this->_dataItems[$offset] ) ? $this->_dataItems[$offset] : null;
    }

    public function offsetSet($offset, $value)
    {
        if( $offset==='length' )
        {
            throw new ReferenceError('The length property is be protected');
        }
        if ( is_null($offset) )
        {
            $this->_dataItems[] = $value;
        } else {
            $this->_dataItems[$offset] = $value;
        }
        $this->length++;
    }

    public function offsetUnset($offset)
    {
        if( $offset!=='length' )
        {
            unset($this->_dataItems[$offset]);
            $this->length--;
        }
    }

    public function current()
    {
        return current($this->_dataItems);
    }

    public function next()
    {
        return next($this->_dataItems);
    }

    public function key()
    {
        return key($this->_dataItems);
    }

    public function valid()
    {
        return key($this->_dataItems) !== null;
    }

    public function rewind()
    {
        return reset($this->_dataItems);
    }

    public function valueOf()
    {
       return $this->_dataItems;
    }

    public function __toString()
    {
        return json_decode($this->_dataItems, JSON_UNESCAPED_UNICODE );
    }
}