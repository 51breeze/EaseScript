<?php
namespace es\system;
use es\system\System;
use es\system\ReferenceError;
use es\system\TypeError;
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,ReferenceError,TypeError
 */
class Date
{
    public function __construct()
    {
    }

    public function getTime(){
        return time();
    }
}