<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require BaseObject,EventDispatcher,ReferenceError
 */
class Node extends EventDispatcher
{
    public $nodeName = 'text';
    public $nodeType = 3;
    public $content  = '';
    protected $parentNode = null;
    protected $attr = null;
    protected $style = null;
    protected $depth = 0;
    protected $visible = false;

    public function __construct($nodeName='text', $nodeType=3, $attr=null )
    {
        $this->nodeName = $nodeName;
        $this->nodeType = $nodeType;
        $this->attr = $attr==null ? new \stdClass() : (object)$attr;
        $this->style = new \stdClass();
        parent::__construct();
    }

    /**
     * 获取当前节点在文档中是否可见
     * 此属性来判断父级（包括祖辈直到根节点）是否有添加到文档中显示，如果有则为true反之false
     * @return bool
     */
    public function isNodeInDocumentChain()
    {
        return $this->visible;
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
                $this->style = BaseObject::merge( $this->style, (object)$value);
                return $this->style;
            case 'parentNode' :
                throw new ReferenceError('parentNode is not writable.');
            case 'text' :
                return $this->content = $value;
        }
        $this->attr->$name = $value;
        return $value;
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