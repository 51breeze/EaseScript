<?php
class ReferenceError extends Error
{
    public $name = "ReferenceError";
    function __construct( $message ,$filename=null,$line=null )
    {
         parent::__construct( $message ,$filename,$line);
    }
}