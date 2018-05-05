<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
class Error extends \Exception
{
    public $name = "Error";
    function __construct( $message ,$filename=null,$line=null )
    {
        $this->line = $line;
        $this->file = $filename;
        parent::__construct( $message );
    }
    public function __toString()
    {
        return $this->name." ".$this->getMessage();
    }
}