<?php
class Error extends \Exception
{
    public $name = "Error";
    function __construct( $message ,$filename=null,$line=null )
    {
        $this->line = $line;
        $this->file = $filename;
        parent::__construct( $message ,$line );
    }
    public function __toString()
    {
        return $this->name." ".$this->getMessage();
    }
}