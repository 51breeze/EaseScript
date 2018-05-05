<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require PropertyEvent
 */
class RenderEvent extends PropertyEvent
{
    const CHANGE='scrollChange';
    public function __construct($type, $bubbles=true, $cancelable=true)
    {
         parent::__construct($type, $bubbles, $cancelable);
    }
}
