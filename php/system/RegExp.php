<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require BaseObject
 */
class RegExp extends BaseObject
{
    private $_pattern = '';
    private $_flag = '';
    public $lastIndex = null;

    public function __construct( $pattern, $flag='' )
    {
        $this->_pattern = $pattern;
        $this->_flag = $flag;
    }

    public function valueOf()
    {
        return '/'.$this->_pattern.'/'.$this->_flag;
    }

    private function getPattern()
    {
        return '/'.$this->_pattern.'/'. str_replace(["g","e"],'',$this->_flag);
    }

    public function exec( $str )
    {
        $result = null;
        $g = strpos($this->_flag,"g") !== false;
        $matched = preg_match( $this->getPattern(), $str, $result, PREG_OFFSET_CAPTURE, $this->lastIndex ?: 0 );
        if( $matched )
        { 
            $group = new \es\system\ArrayList();
            foreach( $result as $key=>$item )
            {
                $group->push( $item[0] );
            }

            $group->input =  $str;
            $group->index =  $result[0][1];
            $this->lastIndex =  strlen($result[0][0])+$result[0][1];
            return $group;
        }
        return null;
    }

    public function test( $str )
    {
        return !!preg_match($this->getPattern(), $str);
    }

    public function replace( $str, $replacement )
    {  
       $limit = strpos($this->_flag,"g") !==false ? -1 : 1;
       if( is_callable( $replacement ) )
       {
           return  preg_replace_callback( $this->getPattern(), function($group)use( $replacement){
               return call_user_func_array(  $replacement, $group );
           }, $str , $limit );
       }
       return  preg_replace( $this->getPattern(), $replacement, $str , $limit );
    }

    public function match( $str )
    {
        $result = null;
        $g = strpos($this->_flag,"g") !== false;
        $flags = $g ? 0 : PREG_OFFSET_CAPTURE;
        $matched = $g ? preg_match_all( $this->getPattern(), $str, $result,  $flags) : preg_match( $this->valueOf(), $str, $result,  $flags );

        if( $matched )
        {   
            if( $g )
            {
                return new \es\system\ArrayList( $result[0] );
            }

            $group = new \es\system\ArrayList();
            foreach( $result as $key=>$item )
            {
                $group->push( $item[0] );
            }

            $group->input =  $str;
            $group->index =  $result[0][1];
            return $group;
        }
        return null;
    }

    public function matchAll( $str )
    {
        $result = null;
        $g = strpos($this->_flag,"g") !== false;
        $flags = PREG_OFFSET_CAPTURE;
        $matched = $g ? preg_match_all( $this->getPattern(), $str, $result,  $flags) : preg_match( $this->valueOf(), $str, $result,  $flags );
        if( $matched )
        {   
            if( $g )
            {
                $result = $result[0];
            }

            $groups = new \es\system\ArrayList();
            foreach( $result as $key=>$item )
            {
                $group = new \es\system\ArrayList();
                $group[0]=$item[0];
                $group->input =  $str;
                $group->index = $item[1];
                $groups->push($group);
            }
            return $groups;
        }
        return null;
    }

    public function search( $str )
    {
        $result = null;
        $flags = PREG_OFFSET_CAPTURE;
        $matched = preg_match( $this->getPattern(), $str, $result,  $flags );
        if( $matched )
        {   
            return $result[ count($result)-1 ][1];
        }
        return -1;
    }


    public function split( $str, $limit=-1 )
    {
        $result = preg_split( $this->getPattern(), $str, -1, PREG_SPLIT_NO_EMPTY );
        if( $result ){
            return array_slice($result,0, $limit);
        }
        return [];
    }

}