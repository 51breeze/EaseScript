<?php
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,ReferenceError,TypeError
 */
class ArrayList extends EventDispatcher implements \ArrayAccess,\Iterator,\Countable
{
    public $length = 0;
    private $_data = array();
    public function __construct( $data = null )
    {
        if( $data != null  )
        {
            if( is_a($data, 'ArrayList' ) )
            {
                $this->_data = $data->data;
            }else if( is_array($data) )
            {
                $this->_data = $data;
            }
            $this->length=count($this->_data);
        }
    }

    public function count()
    {
        return $this->length;
    }

    public function offsetExists($offset)
    {
        if( $offset==='length' ) return true;
        return isset( $this->_data[$offset] );
    }

    public function offsetGet($offset)
    {
        if( $offset==='length' )return $this->length;
        return isset( $this->_data[$offset] ) ? $this->_data[$offset] : null;
    }

    public function offsetSet($offset, $value)
    {
        if ( is_null($offset) )
        {
            $this->_data[] = $value;
        } else {
            if( $offset==='length' )
            {
                throw new ReferenceError('The length property is be protected');
            }
            $this->_data[$offset] = $value;
        }
        $this->length++;
    }

    public function offsetUnset($offset)
    {
        if( $offset!=='length' )
        {
            unset( $this->_data[$offset] );
            $this->length--;
        }
    }

    public function current()
    {
        return current($this->_data);
    }

    public function next()
    {
        return next($this->_data);
    }

    public function key()
    {
        return key($this->_data);
    }

    public function valid()
    {
        return key($this->_data) !== null;
    }

    public function rewind()
    {
        return reset( $this->_data );
    }

    public function slice($offset, $length = null, $preserve_keys = null)
    {
        return array_slice($this->_data, $offset, $length, $preserve_keys);
    }

    public function splice($offset, $length = null, $replacement = null)
    {
        $param = func_get_args();
        array_unshift( $param, $this->_data );
        return call_user_func_array("array_splice", $param );
    }

    public function concat()
    {
        $param = func_get_args();
        array_unshift( $param, $this->_data );
        return new ArrayList( call_user_func_array("array_merge", $param ) );
    }

    public function join( $glue="" )
    {
        return implode($glue, $this->_data );
    }

    public function pop()
    {
        return array_pop( $this->_data );
    }

    public function push()
    {
        $param = func_get_args();
        array_unshift( $param, $this->_data );
        return call_user_func_array('array_push', $param );
    }

    public function shift()
    {
       return array_shift( $this->_data );
    }

    public function unshift()
    {
        $param = func_get_args();
        array_unshift( $param, $this->_data );
        return call_user_func_array('array_unshift', $param );
    }

    public function sort()
    {
        sort( $this->_data );
        return $this;
    }

    public function reverse( $keys = null )
    {
        return new ArrayList( array_reverse( $this->_data , $keys ) );
    }

    public function indexOf( $value )
    {
         return array_search($value, $this->_data, true );
    }

    public function map( $callback, $thisArg = null )
    {
        if( $thisArg == null )$thisArg=$this;
        $callback = System::bind($thisArg,$callback);
        return new ArrayList( array_map( $callback , $this->_data ) );
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
        return new ArrayList( array_filter($this->_data,  $callback, $flag ) );
    }

    public function unique( $sort = null )
    {
        return new ArrayList( array_unique($this->_data, $sort ) );
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
}