<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event,Object
 */

class DataSourceEvent extends Event
{
    const APPEND = 'dataSourceAppend';
    const REMOVE = 'dataSourceRemove';
    const UPDATE = 'dataSourceUpdate';
    const SELECT = 'dataSourceSelect';
    const CHANGED = 'dataSourceChanged';

    public $condition = null;
    public $index = NaN;
    public $data = null;
    public $oldValue = null;
    public $newValue = null;
    public $current = NaN;
    public $offset = NaN;
    public $waiting = false;
    public $totalSize = NaN;
    public $pageSize = NaN;

    public function __construct($type, $bubbles, $cancelable)
    {
        parent::__construct($type, $bubbles, $cancelable);
    }
}