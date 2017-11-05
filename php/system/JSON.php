<?php
class JSON
{
    static public function stringify( $value )
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE);
    }
    static public function parse( $str )
    {
        return json_decode($str, true);
    }
}