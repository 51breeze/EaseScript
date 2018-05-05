<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,TypeError
 */
class EventDispatcher extends Object
{
    protected $__sealed__=true;
    private $listener=array();
    private $target = null;
    function __construct( $target=null )
    {
        if( $target != null && !System::isOf($target, 'EventDispatcher') )
        {
            throw new TypeError('target is not EventDispatcher');
        }
        $this->target = $target ? $target : $this;
    }

    final function hasEventListener( $type )
    {
        if( !is_string($type) )
        {
            throw new TypeError( $type.' is not String');
        }
        return isset($this->target->listener[$type]);
    }

    final public function addEventListener($type, $listener, $useCapture=false, $priority=0, $reference=null)
    {
        if( !is_string($type) )
        {
            throw new TypeError( $type.' is not String');
        }

        $reflect = null;
        $thisArg = $reference;
        $object = null;
        $method = null;

        if( is_array($listener) )
        {
            if( is_string($listener[0]) )
            {
                $reflect = new \ReflectionClass( $listener[0] );
            } else
            {
                $object = $listener[0];
                $reflect = new \ReflectionObject( $object );
            }
            if( !$reflect->hasMethod( $listener[1] ) )
            {
                throw new TypeError( $listener[1]." is not callable");
            }
            $method = $reflect->getMethod( $listener[1] );
            $method->setAccessible(true);

        }else if( is_callable($listener) )
        {
            $method = new \ReflectionFunction( $listener );
        }
        if( $method==null )
        {
            throw new TypeError( "listener is not callable");
        }
        $thisArg = $thisArg==null ? $this : $thisArg;
        $callback = \Closure::bind( $object==null ? $method->getClosure() : $method->getClosure($object), $thisArg);
        if( !isset($this->target->listener[$type]) )
        {
            $this->target->listener[$type]=array();
        }
        array_push($this->target->listener[$type], array($type,$callback,$useCapture,$priority,$reference,$listener) );
        return $this;
    }

    final public function removeEventListener($type,$listener=null)
    {
        if( isset($this->target->listener[$type]) )
        {
            if( $listener==null )
            {
                unset( $this->target->listener[$type] );
                return true;
            }
            $list = &$this->target->listener[$type];
            $len = count($list);
            $i=0;
            while($i<$len)
            {
                $item = $list[$i][5];
                if( $item===$listener || (is_array($item) && is_array($listener) && $item[0] === $listener[0] && $item[1] === $listener[1]) )
                {
                    array_splice($list, $i, 1);
                    return true;
                }
                $i++;
            }
        }
        return false;
    }

    final public function dispatchEvent( Event $event )
    {
        $type = $event->type;
        if( isset($this->target->listener[$type]) )
        {
            $list = $this->target->listener[$type];
            $len = count($list);
            $i=0;
            while($i<$len)
            {
                $list[$i][1]($event);
                if( $event->propagationStopped === true )
                {
                    return false;
                }
                $i++;
            }
        }
        return true;
    }
}