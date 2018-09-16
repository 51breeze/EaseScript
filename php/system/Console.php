<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,HTMLElement,Node,EventDispatcher
 */
class Console
{
    static public function log()
    {
        $param = func_get_args();
        if( is_string($param[0]) && !preg_match("/%(s|d|f)\s+/", $param[0] ) )
        {
           array_unshift($param, str_repeat("%s ", count($param) ) );
        }
        $param = array_map(function ($item){
            if( $item instanceof \Object && get_class($item) !=="Object" )
            {
                return "[object ".get_class($item)."]";
            }
            return $item;
        },$param);
        echo call_user_func_array("sprintf", $param );
    }
}