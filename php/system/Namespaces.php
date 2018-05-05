<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object
 */
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
