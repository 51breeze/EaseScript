<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event
 */
class KeyboardEvent extends Event
{
    const KEY_PRESS='keypress';
    const KEY_UP='keyup';
    const KEY_DOWN='keydown';
    public $keycode = 0;
    public function __construct($type, $bubbles=true, $cancelable=true)
    {
        parent::__construct($type, $bubbles, $cancelable);
    }
}