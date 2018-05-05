<?php
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
    private $documentElement=null;
    static public $document = null;
    public function __construct()
    {
        if( Document::$document !== null )
        {
            throw new Error("Document is not constructor");
        }

        parent::__construct();
        $this->documentElement = new HTMLElement('html');
        Document::$document = $this->documentElement;
        $this->addChild( $this->documentElement );

        $this->head = new HTMLElement('head');
        $this->documentElement->addChild( $this->head );

        $this->body = new HTMLElement('body');
        $this->documentElement->addChild( $this->body );
        $this->nodeName = 'document';
    }

    public function __get($name)
    {
         if( $name ==="outerHTML" ) {
             return $this->documentElement->outerHTML;
         }
         if( $name ==="innerHTML" ) {
             return $this->documentElement->innerHTML;
         }
         if( isset($this->$name) )
         {
             return $this->$name;
         }else{
             return null;
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