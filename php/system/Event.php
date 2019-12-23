<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require BaseObject,TypeError
 */
class Event extends BaseObject
{
    const CLICK = 'click';
    const READY = 'ready';
    const RESIZE = 'resize';
    const MOUSEOVER = 'mouseover';
    const MOUSEDOWN = 'mousedown';

    public $propagationStopped = false;
    public $defaultPrevented = false;
    public $immediatePropagationStopped = false;
    public $type = null;

    private $cancelable = true;
    private $bubbles    = true;

    public function __construct($type, $bubbles=true, $cancelable=true )
    {
        if( !is_string($type) )
        {
            throw new TypeError('type is not String');
        }
        $this->type = $type;
        $this->cancelable = $cancelable;
        $this->cancelable = $cancelable;
        $this->bubbles = $bubbles;
    }

    function preventDefault()
    {
        $this->defaultPrevented=true;
    }

    public function stopPropagation()
    {
        $this->propagationStopped=true;
    }

    function stopImmediatePropagation()
    {
        $this->stopPropagation();
        $this->immediatePropagationStopped = true;
    }
}