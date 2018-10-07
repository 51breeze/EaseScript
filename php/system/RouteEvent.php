<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event
 */
class RouteEvent extends Event
{
    const HTTP_MATCH = 'routeHttpMatch';
    public $data=null;
    public $response=null;
    public $request = null;
    public $matched = false;
    public function __construct($type, $bubbles=true, $cancelable=true)
    {
        parent::__construct($type, $bubbles, $cancelable);
    }
}
