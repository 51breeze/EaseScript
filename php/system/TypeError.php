<?php
class TypeError extends Error
{
    public $name = "TypeError";
    function __construct( $message ,$filename=null,$line=null )
    {
        parent::__construct( $message ,$filename,$line);
    }
}