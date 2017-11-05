<?php
class RangeError extends Error
{
    public $name = "RangeError";
    function __construct( $message ,$filename=null,$line=null )
    {
        parent::__construct( $message ,$filename,$line);
    }
}