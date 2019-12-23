<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,HTMLElement,Document,Node,EventDispatcher
 */
class Element extends EventDispatcher implements \ArrayAccess,\Countable
{
    static public function createElement( $html )
    {
        $html = trim( $html );
        $name = $html;
        $attr = array();
        if( preg_match('/^<(\w+)([^>]*?)\/>$/', $html, $match ) )
        {
            if( !empty($match[2]) && preg_match_all( '/(\w+)\s*\=\s*([\'\"])([^\\2]*?)\\2/', $match[2], $attr ) )
            {
                $attr = array_combine( $attr[1], $attr[3] );
            }
            $name = $match[1];
        }

        if( substr($name,0,1) === '<' )
        {
            $elem = new HTMLElement('#documentFragment');
            $elem->innerHTML = $html;
            $childNodes = $elem->childNodes;
            if( count($childNodes)===1 )
            {
                $elem = $childNodes[0];
                unset($childNodes);
                return $elem;
            }
            return $elem;
        }

        switch ( strtolower($name) )
        {
            case 'body' :
                return System::document()->body;
                break;
            case 'head' :
                return System::document()->head;
                break;
            case 'html' :
                return System::document()->documentElement;
                break;
            case 'document' :
                return System::document();
                break;
        }

        if( preg_match('/^\w+$/', $name ) )
        {
            $elem = new HTMLElement( $name, 1, $attr);

        }else
        {
            $elem = new Node();
            $elem->content = $html;
        }
        return $elem;
    }

    static function isNodeElement( $element )
    {
        return $element instanceof Node;
    }

    static function contains( $parent, $child )
    {
        return false;
    }

    static function isHTMLContainer( $element )
    {
        return $element instanceof HTMLElement;
    }

    static function getNodeName( $element )
    {
        return $element ? $element->nodeName : '';
    }

    public $length = 0;
    private $items=array();
    public function __construct( $selector=null, $context=null )
    {
        if( is_string($selector) )
        {
            $selector = trim($selector);
            if( $selector==="body")
            {
                $selector = [\es\system\Document::documet()->body];
            }else if( $selector==="document")
            {
                $selector = [\es\system\Document::documet()];
            }else if( $selector==="window")
            {
                $selector = [ \es\system\Window::window() ];

            }else if( substr( $selector, 0, 1) ==='<' )
            {
                $selector = [ self::createElement( $selector ) ];
            }else
            {
                $selector = Document::querySelectorAll( $selector, $context );
            }

        }else if( $selector instanceof Node ||  $selector === \es\system\Window::window() ||  $selector === \es\system\Document::documet() )
        {
            $selector = [$selector];

        }else
        {
            $selector = [];
        }

        $this->items = $selector;
        $this->length = count( $selector );
        parent::__construct( isset($selector[0]) ? $selector[0] : null );
    }

    public function html( $value=null )
    {
        if( $value != null && is_string($value) )
        {
            foreach ($this->items as $item)
            {
                $item->innerHTML= $value;
            }
            return $this;
        }
        if( $value===true )
        {
            return isset( $this->items[0] ) ? $this->items[0]->outerHTML : '';
        }
        return isset( $this->items[0] ) ? $this->items[0]->innerHTML : '';
    }

    public function addChild($child)
    {
        return $this->addChildAt($child,-1);
    }

    public function addChildAt($child, $index=-1 )
    {
        $child = $child instanceof Element ? $child->items[0] : $child;
        if( !isset($this->items[0]) ){
            throw new TypeError("Invalid element");
        }
        return $this->items[0]->addChildAt($child, $index);

    }

    public function removeChild( $child )
    {
        $child = $child instanceof Element ? $child->items[0] : $child;
        if( !($child instanceof Node) )
        {
            throw new TypeError("child is not Node Element");
        }
        if( $child->parentNode )
        {
            return $child->parentNode->removeChild( $child );
        }
        return false;
    }

    public function removeChildAt( $index )
    {
        $child = $this->items[0];
        if( $child->parentNode )
        {
            return $child->parentNode->removeChildAt( $index );
        }
        return false;
    }

    public function getChildIndex( $child )
    {
        $child = $child instanceof Element ? $child->items[0] : $child;
        if( !($child instanceof Node) )
        {
            throw new TypeError("child is not Node Element");
        }
        $parent = $child->parentNode;
        if( $parent instanceof HTMLElement )
        {
            $index = array_search($child, $parent->childNodes , true );
            if( $index >= 0 )return $index;
        }
        throw new TypeError("Invaild child element");
    }

    public function width($value=null)
    {
        return $this->style('width', $value);
    }

    public function height($value=null)
    {
        return $this->style('height', $value);
    }

    private $_current = null;
    public function current( $elem=null )
    {
        if( $elem )
        {
            $this->_current = $elem;
            return $this;
        }
        return $this->_current ?: current($this->items);
    }

    public function property($name, $value=null)
    {
        $item = $this->current();
        if( $value===null )
        {
            if( System::isObject($name) )
            {
                $item->attr = \BaseObject::merge($item->attr,$name);
                return $this;
            }
            return $item->$name;
        }
        $item->attr->$name = $value;
        return $this;
    }

    public function properties( $object )
    {
        $item = $this->current();
        $item->attr = $object;
        return $this;
    }


    public function hasProperty($prop){}
    public function data(){}
    public function fadeIn(){}
    public function fadeOut(){}

    static private function setStyle($node, $name, $value)
    {
        static $attrpx = array(
            "width"=>"px",
            "height"=>"px",
            "left"=>"px",
            "top"=>"px",
            "bottom"=>"px",
            "right"=>"px",
            "border-radius"=>"px",
        );
       
        $name = preg_replace_callback('/([A-Z])/',function($a){
            return "-". strtolower($a[1]);
        },$name);

        if( $name[0] === "-" )
        {
            $name = substr($name,1);
        }
        $pix  = "";

        if( isset($attrpx[$name]) && !preg_match('/(px|em|rem)$/i', $value ) )
        {
            $pix = "px";
        }
        $node->style->$name=$value.$pix;
    }


    public function style($name, $value=null)
    {
        $item = $this->current();
        if( !$item )return null;
        if( $name==="cssText" )
        {
            if( is_string($value) )
            {
                $name = \es\system\System::unserialize($value);
            }else{
                $name = $value;
            }
            $value = null;
        }

        if( is_object($name) )
        {
            foreach( $name as $prop=>$value )
            {
                static::setStyle($item,$prop,$value);
            }
            return $this;
        }

        if( $value != null )
        {
            static::setStyle($item,$name,$value);
            return $this;
        }
        return isset( $item->style->$name) ? $item->style->$name : null;
    }
    public function show(){}
    public function hide(){}
    public function left(){}
    public function top(){}
    public function right(){}
    public function bottom(){}


    public function text( $value ){}
    public function value( $val ){}
    public function hasClass($className ){}
    public function addClass($className ){}
    public function removeClass($className ){}

    public function slice(){}
    public function splice(){}
    public function concat(){}
    public function indexOf(){}

    public function isNodeInDocumentChain()
    {
        if( isset($this->items[0]) )
        {
            return $this->items[0]->isNodeInDocumentChain();
        }
        return false;
    }

    public function toString()
    {
        return isset( $this->items[0] ) ? $this->items[0]->outerHTML : '';
    }

    public function count()
    {
        return $this->length;
    }

    public function offsetExists($offset)
    {
        if( $offset==='length' ) return true;
        return isset( $this->items[$offset] );
    }

    public function offsetGet($offset)
    {
        if( $offset==='length' )return $this->length;
        return isset( $this->items[$offset] ) ? $this->items[$offset] : null;
    }

    public function __get( $name )
    {
        if( $this->items[$name] )
        {
            return $this->items[$name];
        }
        return parent::__get($name);
    }

    public function offsetSet($offset, $value)
    {
        if ( is_null($offset) )
        {
            $this->items[] = $value;
        } else {
            if( $offset==='length' )
            {
                throw new ReferenceError('The length property is be protected');
            }
            $this->items[$offset] = $value;
        }
        $this->length++;
    }

    public function offsetUnset($offset)
    {
        if( $offset!=='length' )
        {
            unset( $this->items[$offset] );
            $this->length--;
        }
    }

}