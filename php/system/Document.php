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
}