<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event
 */
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
