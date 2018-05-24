<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object,EventDispatcher,ReferenceError
 */
class Node extends EventDispatcher
{
    public $nodeName = 'text';
    public $nodeType = 3;
    public $content  = '';
    protected $parentNode = null;
    protected $attr = null;
    protected $style = null;

    public function __construct($nodeName='text', $nodeType=3, $attr=null )
    {
        $this->nodeName = $nodeName;
        $this->nodeType = $nodeType;
        $this->attr = $attr==null ? new \stdClass() : (object)$attr;
        $this->style = new \stdClass();
        parent::__construct();
    }

    public function __toString()
    {
        return $this->content;
    }

    public function __get($name)
    {
        switch ($name)
        {
            case 'style' :
                return $this->style;
            case 'parentNode' :
                return $this->parentNode;
        }
        return isset($this->attr->$name) ? $this->attr->$name : null;
    }

    public function __set($name, $value)
    {
        switch ($name)
        {
            case 'style' :
                $this->style = Object::merge( $this->style, (object)$value);
                return $this->style;
            case 'parentNode' :
                throw new ReferenceError('parentNode is not writable.');
            case 'text' :
                return $this->content = $value;
        }
        $this->attr->$name = $value;
    }

    public function __unset($name)
    {
        switch ($name)
        {
            case 'style' :
            return;
        }
        unset( $this->attr->$name );
    }
}