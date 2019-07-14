<?php
namespace es\system;
use es\system\Error;
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @require Error
 */
class TypeError extends Error
{
    public $name = "TypeError";
    function __construct( $message ,$filename=null,$line=null )
    {
        parent::__construct( $message ,$filename,$line);
    }
}