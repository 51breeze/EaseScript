<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require BaseObject
 */
class Map extends BaseObject
{
    private $dataset = [];
    private $nullItem = null;
    public function __construct()
    {
    }

    private function getItemByKey( $key )
    {
        foreach( $this->dataset as &$item )
        {
            if( $item[0] === $key )
            {
                return $item;
            }
        }
        return null;
    }

    public function set( $key, &$value )
    {
        $item = $this->getItemByKey( $key );
        if( $item )
        {
            $item[1] = $value;
        }else{
            array_push($this->dataset,[$key, $value]);
        }
    }

    public function get( $key )
    {
        $item =  $this->getItemByKey( $key );
        return $item ? $item[1] : null;
    }

    public function clear()
    {
        $this->dataset = [];
    }

    public function forEach( $callback )
    {
        foreach( $this->dataset as $item)
        {
            call_user_func($callback, $item[1], $item[0]);
        }
    }

}