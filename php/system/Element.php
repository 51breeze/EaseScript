<?php

use \es\core\HTMLElement;
use \es\core\Node;

class Element extends EventDispatcher implements \ArrayAccess,\Countable
{
    static public function createElement( $html )
    {
        $html = trim( $html );
        $name = $html;
        $attr = array();
        if( preg_match('/^<(\w+)([^>]*?)\/>/', $html, $match ) )
        {
            if( !empty($match[2]) && preg_match_all( '/(\w+)\s*\=\s*([\'\"])([^\\2]*?)\\2/', $match[2][0], $attr ) )
            {
                $attr = array_combine( $attr[1], $attr[3] );
            }
            $name = $match[1];
        }

        if( substr($name,0,1) === '<' )
        {
            $elem = new HTMLElement( $name, 1,  $attr );
            $elem->outerHTML = $html;
            return $elem;
        }

        switch ( strtolower($name) )
        {
            case 'body' :
                return System::document()->body;
                break;
            case 'html' :
                return System::document()->documentElement;
                break;
            case 'document' :
                return System::document();
                break;
        }

        if( preg_match('/^\w+$/') )
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

    static function isHTMLContainer( $element )
    {
        return $element instanceof HTMLElement;
    }


    public $length = 0;
    private $items=array();
    public function __construct( $selector, $context=null )
    {
        if( is_string($selector) )
        {
            $selector = trim($selector);
            if( $selector==="body")
            {
                $selector = [System::document()->body];
            }else if( $selector==="document")
            {
                $selector = [System::document()];
            }else if( $selector==="window")
            {
                $selector = [System::window()];

            }else if( substr( $selector, 0, 1) ==='<' )
            {
                $selector = [ self::createElement( $selector ) ];
            }else
            {

            }

        }else if( $selector instanceof Node )
        {
            $selector = [$selector];
        }else{
            $selector = [];
        }
        $this->items = $selector;
        $this->length = count( $selector );
        parent::__construct( isset($selector[0]) ? $selector[0] : null );
    }

    public function html( $value )
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
        return $this->items[0]->addChildAt($child, $index);
    }

    public function removeChild( $child )
    {
        return $this->removeChildAt( $this->getChildIndex( $child ) );
    }

    public function removeChildAt( $index )
    {
        return $this->items[0]->removeChildAt($index);
    }

    public function getChildIndex( $child )
    {
        $child = $child instanceof Element ? $this->items[0] : $child;
        return array_search($child,$this->items, true );
    }

    public function width($width=null)
    {
         $item = $this->items[0];
         if( $width==null )
         {
             return $item->style->width;
         }
        $item->style->width=$width;
        return $this;
    }

    public function height(){}

    public function current( $elem=null )
    {

    }
    public function property($name, $value ){}
    public function hasProperty($prop){}
    public function data($name, $value ){}
    public function style($name, $value ){}
    public function show(){}
    public function hide(){}
    public function text( $value ){}
    public function value( $val ){}
    public function hasClass($className ){}
    public function addClass($className ){}
    public function removeClass($className ){}

    public function slice(){}
    public function splice(){}
    public function concat(){}
    public function indexOf(){}


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