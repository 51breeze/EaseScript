<?php
class Window extends EventDispatcher
{
    public $document = null;
    public function __construct()
    {
        parent::__construct();
        $this->document = new Document();
    }
}