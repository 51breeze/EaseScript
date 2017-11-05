<?php
class SyntaxError extends Error
{
    public $name = "SyntaxError";
    function __construct( $message ,$filename=null,$line=null )
    {
        parent::__construct( $message ,$filename,$line);
    }
}