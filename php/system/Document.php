<?php
class Document extends HTMLElement
{
    private $body = null;
    private $documentElement=null;

    public function __construct()
    {
        parent::__construct();
        $this->documentElement = new HTMLElement('html',1);
        $this->body = new HTMLElement('body',9);
        $this->documentElement->addChild( $this->body );
        $this->nodeName = 'document';
    }

    public function __get($name)
    {
         return $this->$name;
    }
}