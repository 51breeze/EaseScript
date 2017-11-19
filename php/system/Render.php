<?php

/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

class Render extends Object
{
    const syntax_regexp = "/^\\s*(if|foreach|for|else|do|switch|case|default|break|var|function|while|code|{|})(.*)?/";
    const call_regexp = "/^([\\w\\.]+)\\s*\\(/";
    const foreach_regexp  = "/(\\w+)\\s+as\\s+(\\w+)(\\s+(\\w+))?/i";

    static private function escape( $str )
    {
        if( !$str )return $str;
        return preg_replace('/\\"/', '\\\\"',  $str );
    }

    static private function parseForEach( $expression )
    {
        if( !preg_match( self:: foreach_regexp,  $expression , $result ) )
        {
            throw new SyntaxError('Missing expression');
        }
        $data = $result[1];
        $key  ='key';
        $item = $result[2];
        if( isset($result[3]) )
        {
            $key=$result[2];
            $item=$result[3];
        }
        $key = trim( $key );
        $item = trim( $item );
        $code =  '$forIndex=0;'.PHP_EOL;
        $code .= 'if(isset($'.$data.'))foreach( $'.$data.'  as  $'.$key.'=>$'.$item.'){'.PHP_EOL;
        $code .= '$forIndex++;'.PHP_EOL;
        $code .= '$forKey=$'.$key.';'.PHP_EOL;
        $code .= '$forItem=$'.$item.';'.PHP_EOL;
        return $code;
    }

    static private function make($template, $variable, $split )
    {
        $code = '$___code___="";'.PHP_EOL;
        $match = null;
        $cursor = 0;
        if( $variable instanceof Variable )
        {
            $dataGroup = $variable->get();
            foreach( $dataGroup as $key=>$value )
            {
                $code.='$'.$key.'= $this->get("'.$key.'");'.PHP_EOL;
            }
        }
        $template = preg_replace("/[\r\n\t]+/","", $template);
        $begin_code=false;
        while( preg_match( $split, $template, $match, PREG_OFFSET_CAPTURE, $cursor ) )
        {
            $offsetPos = $match[0][1];
            if( $begin_code===true )
            {
                $code .= mb_substr($template,$cursor, $offsetPos - $cursor );
                $code .=PHP_EOL;
                $begin_code=false;

            }else
            {
                //模板元素
                if( $cursor != $offsetPos )
                {
                    $code .='$___code___.="'.self::escape(  mb_substr($template,$cursor, $offsetPos - $cursor ) ).'";'.PHP_EOL;
                }
                //短语法
                if( isset($match[2]) )
                {
                    $val= trim($match[2][0]);
                    if( preg_match(self::call_regexp, $val, $result) )
                    {
                        $val = preg_replace('/([\(\,])\s*([a-zA-Z_]+\w+)/i','\\1\$\\2', $val );
                        $code .='$___code___.= is_callable($'.$result[1].') ? $'.$val.' : $this->error();'.PHP_EOL;

                    }else
                    {
                        $val = preg_replace('/([\=\?\:])\s*([a-zA-Z_]+\w+)/i','\\1\$\\2', $val );
                        $code .='$___code___.= @$'.$val.';'.PHP_EOL;
                    }
                }
                //流程语法
                else if( isset($match[1]) )
                {
                    preg_match( self::syntax_regexp , $match[1][0] , $matchSyntax );
                    if( $matchSyntax && $matchSyntax[1] )
                    {
                        $syntax = preg_replace("/\\s+/",'',$matchSyntax[1]);
                        switch ( $syntax )
                        {
                            case 'foreach' :
                                $code .=  self::parseForEach( $matchSyntax[2] );
                                break;
                            case 'switch' :
                            case 'case' :
                            case 'default' :
                            case 'break' :
                            case 'if' :
                            case 'else' :
                            case 'do' :
                            case 'while' :
                            case 'for' :
                                $code .= $matchSyntax[1].( $matchSyntax[2] ? $matchSyntax[2] : '');
                                $code.=PHP_EOL;
                                break;
                            case 'code' :
                                $begin_code = true;
                                break;
                            default :
                                $code .= self::escape( $matchSyntax[1] );
                                $code .=PHP_EOL;
                        }
                    }
                }
            }
            $cursor = $offsetPos + strlen($match[0][0]);
        }
        $code .= '$___code___.="'.self::escape( substr( $template, $cursor ) ) .'";'.PHP_EOL;
        $code .= 'return $___code___;';
        try{

            $reflect = new \ReflectionFunction(create_function('', $code));
            $fun = \Closure::bind($reflect->getClosure(), $variable);
            return $fun();

        }catch ( \Exception $e )
        {
            echo $code;
            exit;
        }
    }

    /**
     * @private
     */
    private $_options=array(
        'left'=>"<\\?",
        'right'=>"\\?>",
        'shortLeft'=>"\\{(?!=\\{)",
        'shortRight'=>"\\}(?!=\\})"
    );

    private $_split = null;

    public  function __construct( array $options=null )
    {
        $o =(object)$this->_options;
        if( $options != null )
        {
            $o =(object)array_merge( $this->_options, $options );
        }
        $this->_split = '/'.$o->left.'(.*?)'.$o->right.'|'.$o->shortLeft.'(.*?)'.$o->shortRight.'/i';
    }

    private $_variable = null;
    public function variable($name=null, $value=null)
    {
        if ($this->_variable === null)
        {
            $this->_variable= new Variable( $this );
        }
        if( $name == null )return $this->_variable;
        if( $value != null )
        {
            $this->_variable->set($name, $value);
            return $this;
        }
        return $this->_variable->get($name);
    }

    /**
     * @private
     */
    private $_template='';

    /**
     * 获取设置要渲染的视图模板
     * @param view
     * @returns {*}
     */
    public function template( $val=null )
    {
        if( $val != null )
        {
            if( !is_string($val) )
            {
                throw new TypeError('Invalid param type, must be a String. in Render.prototype.template');
            }
            $this->_template= $val ;
        }
        return $this->_template;
    }

    /**
     * 解析模板为一个字符串
     * @param view
     * @returns {String}
     */
    public function fetch( $view = null )
    {
        if( is_string($view) )
        {
            return self::make($view , $this->variable() , $this->_split );
        }
        return self::make( $this->_template , $this->variable() ,  $this->_split  );
    }
}


/**
 * 模板变量构造器
 * @param data
 * @constructor
 */
class Variable extends Object
{
    private $data = null;
    public $render = null;
    public function __construct( Render $render )
    {
        $this->render = $render;
        $this->data = new Object();
    }

    /**
     *设置变量
     * @param name
     * @param val
     * @returns {Variable}
     */
    public function set($name, $val)
    {
        if ($name === true)
        {
            $this->data = $val;
            return $this;
        }
        if (is_string($name))
        {
            $this->data[$name] = $val;
            return $this;
        }
        throw new Error('param undefined for val');
    }

    /**
     * 获取数据
     * @param name
     * @returns {*}
     */
    public function get($name=null)
    {
        return $name == null ? $this->data : $this->data[$name];
    }

    /**
     * 删除变量
     * @param name
     * @returns {*}
     */
    public function remove($name=null)
    {
        $val = $this->data;
        if (is_string(name))
        {
            if (isset($this->data[$name]))
            {
                $val = $this->data[$name];
                unset($this->data[$name]);
                return $val;
            }
            return false;
        }
        return $val;
    }

    /**
     * 判断是否一个对象
     * @param val
     * @returns {boolean}
     */
    public function isObject($val)
    {
        return is_object($val) || is_array($val);
    }

    /**
     * 发生错误时的返回值
     * @returns {string}
     */
    public function error()
    {
        return '';
    }
}
