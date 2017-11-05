<?php

class HttpEvent extends Event
{
    const  LOAD_START = 'httpLoadStart';
    const SUCCESS = 'httpSuccess';
    const PROGRESS = 'httpProgress';
    const ERROR   = 'httpError';
    const CANCELED  = 'httpCanceled';
    const TIMEOUT = 'httpTimeout';

    public $data=null;
    public $url=null;
    public $loaded = 0;
    public $total = 0;

    public function __construct($type, $bubbles=true, $cancelable=true)
    {
        parent::__construct($type, $bubbles, $cancelable);
    }
}
