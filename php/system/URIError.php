<?php
class URIError extends Error
{
    public $name = "URIError";
    function __construct( $message ,$filename=null,$line=null )
    {
        parent::__construct( $message ,$line );
    }
}