<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error
 */
class EvalError extends Error
{
    public $name = "EvalError";
    function __construct( $message ,$filename=null,$line=null )
    {
        parent::__construct( $message ,$line );
    }
}