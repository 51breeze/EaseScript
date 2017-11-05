<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,Object
 */
class PropertyEvent extends Event
{

    const CHANGE='propertychange';
    const COMMIT='propertycommit';

    public $property=null;
    public $newValue=null;
    public $oldValue=null;

    public function __construct($type, $bubbles=true, $cancelable=true)
    {
        parent::__construct($type, $bubbles, $cancelable);
    }
}