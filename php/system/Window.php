<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @require EventDispatcher,Document
 */
class Window extends EventDispatcher
{
    public $document = null;
    public function __construct()
    {
        parent::__construct();
        $this->document = new Document();
    }
}