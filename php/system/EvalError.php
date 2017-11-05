<?php
class EvalError extends Error
{
    public $name = "EvalError";
    function __construct( $message ,$filename=null,$line=null )
    {
        parent::__construct( $message ,$line );
    }
}