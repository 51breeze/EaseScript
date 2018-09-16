<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event
 */
class ElementEvent extends Event
{
    const ADD='elementAdd';
    const REMOVE='elementRemove';
    const CHNAGED='elementContentChanged';

    public $parent=null;
    public $child=null;

    public function __construct($type, $bubbles=true, $cancelable=true)
    {
        parent::__construct($type, $bubbles, $cancelable);
    }
}