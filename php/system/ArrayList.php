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

    public static function from( $target, \Closure $callback = null, $thisArg=null )
    {
        $items = new ArrayList();
        if( $thisArg !==null && $callback !==null )
        {
            $callback = \es\system\System::bind($callback,$thisArg);
        }

        $length = is_a($target,'\Countable') ? count( $target ) : isset($target->length) ? $target->length : 0;
        $is = \es\system\System::isIterator( $target ) && !\es\system\System::isObject($target);
        if( $is )
        {
            foreach($target as $value)
            {
                if( $callback )
                {
                    $value = call_user_func($callback, $value);
                }
                $items->push($value);
            }
            return $items;
        }
        if( $length > 0 )
        {
            for( $i=0;$i<$length;$i++)
            {
                $items->push( $target[$i] );
            }
        }
        return $items;
    }

    public static function of()
    {
        return new ArrayList( func_get_args() );
    }

    public static function isArray( $target )
    {
        return is_array( $target  );
    }

    private $dataItems=array();
    public function __construct()
    {
        if( func_num_args() === 1 )
        {
            if( System::isArray( func_get_arg(0) ) )
            {
               $this->dataItems=func_get_arg(0);

            }else if( is_int( func_get_arg(0) ) )
            {
                $this->dataItems = array_pad([], func_get_arg(0), null);
            }else
            {
                $this->dataItems = func_get_args();
            }

        }else
        {
            $this->dataItems=func_get_args();
        }
        parent::__construct( $this->dataItems );
    }

    public function slice($offset, $length = null, $preserve_keys = null)
    {
        return new ArrayList( array_slice($this->dataItems, $offset, $length, $preserve_keys) );
    }

    public function splice($offset, $length = null, $replacement=null )
    {
        if( $replacement===null )
        {
            return array_splice($this->dataItems, $offset, $length);
        }
        $replacement = array_slice( func_get_args(), 2);
        return array_splice($this->dataItems, $offset, $length, $replacement );
    }

    public function concat()
    {
        $param = array_merge( array( $this->dataItems ) , func_get_args() );
        return new ArrayList( $param  );
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
        $index = array_search($value, $this->dataItems, true );
        return $index === false ? -1 : $index;
    }

    public function lastIndexOf( $value )
    {
        $len = count( $this->dataItems );
        while( $len > 0 )
        {
           if( $this->dataItems[ --$i ] === $value )
           {
              return $i;
           }
        }
        return -1;
    }

    public function includes( $value )
    {
        return in_array($value, $this->dataItems, true);
    }

    public function map( $callback, $thisArg = null )
    {
        if( $thisArg !== null )
        {
           $callback = System::bind($callback,$thisArg);
        }
        return new ArrayList( array_map( $callback , $this->dataItems ) );
    }

    public function __call($name, $avrg)
    {
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
                return $this->current();
            }
            $this->next();
        }
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
    }

    public function offsetUnset($offset)
    {
        if( $offset!=='length' )
        {
            unset($this->dataItems[$offset]);
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

    public function keys()
    {
        return array_keys( $this->dataItems );
    }

    public function values()
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
        return isset($this->dataItems[ $name ]) ? $this->dataItems[ $name ] : null;
    }

    public function __set($name, $value)
    {
        if( $name ==="length" )
        {
            throw new ReferenceError('The length property is not writable');
        }
        $this->dataItems[ $name ] = $value;
    }

}