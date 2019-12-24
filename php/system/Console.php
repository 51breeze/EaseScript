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
        $format = $param[0];
        if( is_string($format) )
        {
            $count = count($param) - 1;
            $index = preg_match_all("/%(s|d|f)\s+/", $format, $matches);
            if( $index > 0){
                array_shift( $param );
            }
            if( $index != $count )
            {
                if($index>0)
                {
                    $format .= str_repeat(" %s", count($param) - $index);
                }else
                {
                   $format =str_repeat("%s ", count($param) );
                }
            }

        }else
        {
            $format = str_repeat("%s ", count($param) );
        }

        $format = trim( $format,' ');
        $format.="\n";

        $param = array_map(function ($item){
            if( is_a($item, '\es\system\BaseObject') && !System::isObject($item,true) )
            {
                if( is_a($item, '\es\system\ArrayList') )
                {
                    return var_export($item->valueOf(),true);
                }
                return "[object ".get_class($item)."]";
            }

            if( is_a($item, '\es\system\BaseObject') )
            {
                return var_export($item->valueOf(),true);
            }

            if( is_bool($item) )
            {
                $item = $item === true ? "true" : "false";
            }

            if( !is_scalar($item) )
            {
                return var_export($item,true);
            }
            return $item;
        },$param);

        array_unshift( $param, $format );
        echo call_user_func_array("sprintf", $param );
    }
}