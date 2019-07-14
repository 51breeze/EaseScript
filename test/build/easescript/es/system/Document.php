<?php
namespace es\system;
use es\system\System;
use es\system\HTMLElement;
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,HTMLElement
 */

class Document extends HTMLElement
{
    private $body = null;
    private $head = null;
    private $title = null;
    private $documentElement=null;
    static private $document = null;
    protected $visible = true;

    /**
     * 获取Document的实例对象
     * @return Document|null
     * @throws Error
     */
    public static function __callStatic($name,$args)
    {
        if( $name==="document")
        {
            if (Document::$document === null)
            {
                return new Document();
            }
            return Document::$document;
        }
    }

    public function __construct()
    {
        if( Document::$document !== null )
        {
            throw new Error("Document is not constructor");
        }
        parent::__construct();
        $this->documentElement = new HTMLElement('html');
        $this->documentElement->visible=true;
        $this->head = new HTMLElement('head');
        $this->title= new HTMLElement('title');
        $this->body = new HTMLElement('body');
        $this->head->addChild( $this->title );
        $this->documentElement->addChild( $this->head );
        $this->documentElement->addChild( $this->body );
        Document::$document = $this;
        $this->nodeName = 'document';
    }

    public function createElement( $name ):Node
    {
        return new HTMLElement( $name );
    }

    public function __get($name)
    {
         if( $name ==="outerHTML" )
         {
             return $this->documentElement->outerHTML;
         }

         if( $name==="document" )
         {
             return Document::document();
         }

         if( $name ==="innerHTML" )
         {
             return $this->documentElement->innerHTML;
         }

         if( $name ==="title" )
         {
             return $this->title->innerHTML;
         }

         if( isset($this->$name) )
         {
             return $this->$name;
         }else{
             return null;
         }
    }

    public function __set($name, $value )
    {
         if( $name ==="innerHTML" )
         {
             return $this->documentElement->innerHTML = $value;
         }
         if( $name ==="outerHTML" )
         {
             return $this->documentElement->outerHTML = $value;
         }

         if( $name ==="title" )
         {
            return $this->title->innerHTML = $value;
         }

         if( isset($this->$name) )
         {
             return $this->$name = $value;

         }else{
         }
    }

    static public function querySelectorAll( $selector , $context=null )
    {
        $selector = 'thead > tr:first-child>th:first-child';
        // thead tr.name td[attr=123]
       // $selector

        if( $context === null )
        {
            $context = System::document();

        }else if( is_string($context) )
        {
            $context = self::querySelectorAll( $context );
            if( !isset($context[0]) )return array();
            $context = $context[0];
        }

        if( !($context instanceof HTMLElement) )
        {
            return array();
        }

        return array();

        $cursor= 0;
        $results = array();
        $last = null;
        while ( preg_match('/(\S+(?:[^>]))/', $selector, $match , PREG_OFFSET_CAPTURE , $cursor ) )
        {
             print_r( $match );
             $cursor = $match[0][1] + strlen( $match[0][0] );

            // $action = $match[1][0];
             /*switch ( $action )
             {
                 case ':':
                 case '.':
                 case '>':
                 case '[':
                 case ']':
                     break;
             }*/
        }

        exit;
    }

}