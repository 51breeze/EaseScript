<?php
class Document extends HTMLElement
{
    private $body = null;
    private $head = null;
    private $documentElement=null;
    public function __construct()
    {
        parent::__construct();
        $this->documentElement = new HTMLElement('html');
        $this->addChild( $this->documentElement );

        $this->head = new HTMLElement('head');
        $this->documentElement->addChild( $this->head );

        $this->body = new HTMLElement('body');
        $this->documentElement->addChild( $this->body );
        $this->nodeName = 'document';
    }

    public function __get($name)
    {
         return $this->$name;
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