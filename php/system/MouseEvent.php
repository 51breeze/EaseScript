<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event;
 */
class MouseEvent extends Event
{
    const MOUSE_DOWN='mousedown';
    const MOUSE_UP='mouseup';
    const MOUSE_OVER='mouseover';
    const MOUSE_OUT='mouseout';
    const MOUSE_OUTSIDE='mouseoutside';
    const MOUSE_MOVE='mousemove';
    const MOUSE_WHEEL='mousewheel';
    const CLICK='click';
    const DBLCLICK='dblclick';

    public $wheelDelta= null;
    public $pageX= NaN;
    public $pageY= NaN;
    public $offsetX=NaN;
    public $offsetY=NaN;
    public $screenX= NaN;
    public $screenY= NaN;

    public function __construct($type, $bubbles=true, $cancelable=true)
    {
        parent::__construct($type, $bubbles, $cancelable);
    }
}