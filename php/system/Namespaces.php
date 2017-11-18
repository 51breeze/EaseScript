<?php
class Namespaces extends Object
{
    private $prefix = '';
    private $uri = '';
    private static $map=array();
    static public function getUid( $uri )
    {
          if( isset( self::$map[$uri] ) )
          {
              return self::$map[$uri];
          }
          return null;
    }

    function __construct($prefix='', $uri='')
    {
        $this->prefix = $prefix;
        $this->uri =$uri;
    }

    public function valueOf()
    {
        return $this->prefix . $this->uri;
    }

    public function toString()
    {
        return $this->__toString();
    }

    public function __toString()
    {
        return "[object Namespaces]";
    }
}
