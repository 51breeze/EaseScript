<?php
namespace es\system;
use es\system\Error;

/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error
 */

class SyntaxError extends Error
{
    public $name = "SyntaxError";
    function __construct( $message ,$filename=null,$line=null )
    {
        parent::__construct( $message ,$filename,$line);
    }
}