<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require BaseObject
 */
class RegExp extends BaseObject
{
    private $_pattern = '';
    private $_flag = '';
    public function __construct( $pattern, $flag='' )
    {
        $this->_pattern = $pattern;
        $this->_flag = $flag;
    }

    public function valueOf()
    {
        return '/'.$this->_pattern.'/'.$this->_flag;
    }

    public function exec( $str )
    {
        if( preg_match($this->valueOf(), $str, $match, PREG_OFFSET_CAPTURE) )
        {
            return $match;
        }
        return null;
    }

    public function test( $str )
    {
        return preg_match($this->valueOf(), $str);
    }

}