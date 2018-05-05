<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @require Error
 */
class URIError extends Error
{
    public $name = "URIError";
    function __construct( $message ,$filename=null,$line=null )
    {
        parent::__construct( $message ,$line );
    }
}