<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
class RenderEvent extends Event
{
    const START = 'templateStart';
    const DONE = 'templateDone';
    public $view = null;
    public $variable = null;
    public $html = '';
    public function __construct($type, $bubbles=true, $cancelable=true)
    {
        parent::__construct($type, $bubbles, $cancelable);
    }
}
