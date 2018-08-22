<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
class JSON
{
    static public function stringify( $value )
    {
        if( System::isObject($value,true) )
        {
            $value = $value->valueOf();
        }
        return json_encode($value, JSON_UNESCAPED_UNICODE);
    }
    static public function parse( $str )
    {
        return json_decode($str, true);
    }
}