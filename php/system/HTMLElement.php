<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Node,SyntaxError,ReferenceError
 */
class HTMLElement extends Node
{
    public $value  = '';
    private $innerHTML = '';
    private $outerHTML = '';

    public function __construct($name='div', $type = 1, $attr=array() )
    {
        $this->nodeName = $name;
        $this->nodeType = $type;
        parent::__construct($name, $type, $attr);
    }

    public function getElementByName( $name )
    {
        if( !is_string($name) )return false;
        $len = count( $this->children );
        $i = 0;
        $items = array();
        for(;$i<$len;$i++)
        {
            $child = $this->children[$i];
            if( strcasecmp($child->nodeName ,$name)===0 )
            {
                array_push($items, $child);
            }
        }
        return $items;
    }

    public function getElementById( $name )
    {
        if( !is_string($name) )return false;
        $len = count( $this->children );
        $i = 0;
        for(;$i<$len;$i++)
        {
            $child = $this->children[$i];
            if( strcasecmp($child->id ,$name)===0 )
            {
                return $child;
            }
        }
        return null;
    }

    private $children=array();

    public function childNodes()
    {
        return array_slice( $this->children, 0);
    }

    public function addChild( Node $child )
    {
        return $this->addChildAt($child, -1 );
    }

    /**
     * 是否需要重新解析对象为html字符串
     * @var bool
     */
    private $parseHtml = true;

    public function addChildAt(Node $child , $index )
    {
        if( $this === $child )
        {
            throw new ReferenceError('parent and child elements can not be the same');
        }
        $this->content = '';
        $index = $index<0 ? count($this->children)+$index+1 : $index;
        if( $child->parentNode )
        {
            $child->parentNode->removeChild( $child );
        }
        array_splice( $this->children,$index,0, array($child) );
        $child->parentNode = $this;
        $this->parseHtml = true;
        return $child;
    }

    public function removeChild(Node $child)
    {
        $index = array_search($child, $this->children, true);
        if( $index>=0 )
        {
            return $this->removeChildAt( $index );
        }
        throw new ReferenceError( 'child is not exists', __FILE__, __LINE__);
    }

    public function removeChildAt( $index )
    {
        $index = $index<0 ? count($this->children)+$index : $index;
        if( isset($this->children[$index]) )
        {
            $child =  array_splice($this->children, $index, 1);
            $child = $child[0];
            $child->parentNode = null;
            $this->parseHtml = true;
            return $child;
        }
        throw new ReferenceError( 'index is out range', __FILE__, __LINE__);
    }

    public function getChildIndex(Node $child)
    {
        return array_search($child, $this->children, true );
    }

    public function hasChildren()
    {
        return count( $this->children )>0;
    }

    public function __toString()
    {
        if( $this->parseHtml===true )
        {
            $this->parseHtml = false;
            $html = $this->innerHTML;
            if( !$this->hasInnerHTML )
            {
                $html = '';
                foreach ($this->children as $item)
                {
                    $html .= $item->toString();
                }
                $this->innerHTML = $html;
            }

            $attr = '';
            $attrStr = System::serialize($this->attr, 'attr');
            $styleStr = System::serialize($this->style, 'style');
            if ($attrStr) $attr .= ' ' . $attrStr;
            if ($styleStr) $attr .= ' style="' . $styleStr . '"';
            $nodename = $this->nodeName;
            if( $nodename === 'link' || $nodename === 'meta' || $nodename==="input" )
            {
                $this->outerHTML = '<' . $this->nodeName . $attr . ' />';
                $this->innerHTML = '';

            } else
            {
                if( ($nodename ==="html" || $nodename==="head" || $nodename==="body" ) && preg_match('/<\/'.$nodename.'>$/', $html ) )
                {
                    $this->outerHTML = $html;
                    return $html;
                }

                $left = '<' . $this->nodeName . $attr . '>';
                $right = '</' . $this->nodeName . '>';
                if (!$html) $html = $this->content;
                if( $this->nodeName != '#documentFragment' )
                {
                    $html = $left . $html . $right;
                }
                $this->outerHTML = $html;
            }
        }
        return $this->outerHTML;
    }

    public function __get($name)
    {
        switch ($name)
        {
            case 'innerHTML' :
                $this->__toString();
                return $this->innerHTML;
            case 'outerHTML' :
                $this->__toString();
                return $this->outerHTML;
            case 'attr' :
                return $this->attr;
            case 'html' :
            case 'documentElement' :
                return System::document()->__get('documentElement');
            case 'body' :
            case 'head' :
                return System::document()->__get( $name );
            case 'childNodes':
                return array_slice($this->children,0);
        }
        return parent::__get($name);
    }

    private $hasInnerHTML = false;

    public function __set($name, $value)
    {
        switch ($name)
        {
            case 'innerHTML' :
                $this->children=[];
                $this->innerHTML = $value;
                $this->parseHtml=true;
                $this->hasInnerHTML = true;
                return $value;
             //  return $this->setInnerHTML( $value );
            case 'attr' :
                if( is_object($value) )
                {
                    if( isset($value->style) )
                    {
                        $this->style = Object::merge( $this->style, System::unserialize($value->style) );
                        unset( $value->style );
                    }
                    $this->attr = Object::merge( $this->attr, $value);
                    return $this->attr;
                }
            case 'documentElement' :
            case 'html' :
            case 'body' :
            case 'head' :
            case 'childNodes':
            case 'children':
                return;
        }
        return parent::__set($name, $value);
    }

    public function __unset($name)
    {
        switch ($name)
        {
            case 'innerHTML' :
            case 'outerHTML' :
                return;
        }
        return parent::__unset($name);
    }

    static private $typeMap = array(
        'text'=>3,
        'document'=>9,
    );

    private function setInnerHTML( $html , $outer = false )
    {
        $index = count( $this->children );
        while ( $index > 0 )
        {
            $this->removeChildAt( --$index );
        }
        $items = array();
        $this->parseHtml = false;
        $offset = 0;
        $startPos = $offset;
        while ( preg_match('/[\s\r\n]*\<(\/)?(\w+)([^\>]*?)(\/)?\>/i', $html, $match, PREG_OFFSET_CAPTURE , $offset ) )
        {
            $tag    = $match[2][0];
            $attrs  = array();
            $attrraw = '';
            if( !empty($match[3]) && preg_match_all( '/(\w+)\s*\=\s*([\'\"])([^\\2]*?)\\2/', $match[3][0], $attr ) )
            {
                $attrraw = $match[3][0];
                $attrs = array_combine( $attr[1], $attr[3] );
            }

            $len = strlen( $match[0][0] );
            $pos = $match[0][1];
            $offset = $pos + $len;
            $closed = isset($match[4]);

            //结束标签
            if( isset($match[1][0]) && $match[1][0]==='/' )
            {
                $index = count($items);
                //找到最近的开始标签
                while ( $index > 0 )
                {
                    $index--;
                    $elem = &$items[$index];
                    if( $elem['tagname'] === $tag && !$elem['endtag'] && !$elem['closed'] )
                    {
                        $elem['endOffset'] = $pos;
                        $elem['endLength'] = $offset;
                        $elem['endtag'] = true;
                        $elem['content'] =  substr($html, $elem['length'], $pos - $elem['length'] );
                        break;
                    }
                }

            }
            //开始标签
            else
            {
                if( $pos > $startPos )
                {
                    $text = trim( substr($html, $startPos,  $pos-$startPos) );
                    if( $text ){
                        array_push($items, array(
                            'tagname' =>"text",
                            'closed' =>true,
                            'endtag' =>true,
                            'attr'   =>array(),
                            'attrraw'=>"",
                            'offset' =>$startPos,
                            'startPos' =>$startPos,
                            'length' =>$offset,
                            'endOffset' =>$pos,
                            'endLength' =>$pos,
                            'content'=> $text,
                        ));
                    }
                }

                array_push($items, array(
                    'tagname' =>$tag,
                    'closed' =>$closed,
                    'endtag' =>false,
                    'attr'   =>$attrs,
                    'attrraw'   =>$attrraw,
                    'offset' =>$pos,
                    'startPos' =>$startPos,
                    'length' =>$offset,
                    'endOffset' =>$pos,
                    'endLength' =>$offset,
                    'content'   =>'',
                ));
            }
            $startPos=$offset;
        }

        $children = array();
        $element = null;

        //生成元素对象
        while ( $childItem = array_pop($items) )
        {
            $index = count($items);
            $parentIndex = null;
            while( $index > 0 )
            {
                $parentItem = &$items[ --$index ];
                if( $childItem['offset'] > $parentItem['offset'] && $childItem['endOffset'] < $parentItem['endOffset'] )
                {
                    $parentIndex = $index;
                    break;
                }
            }

            $name = $childItem['tagname'];
            if( !$childItem['closed'] && !$childItem['endtag'] )
            {
                if( !in_array($name, array('link','meta') ) )
                {
                    throw new SyntaxError( $name.' is not closed');
                }
            }

            $type = isset( self::$typeMap[ $name ] ) ? self::$typeMap[ $name ] : 1;
            if( $parentIndex===null && $outer === true )
            {
                $element = $this;
                $element->nodeName = $name;
                $element->nodeType = $type;
                $element->attr     = $attrs;

            }else
            {
                switch ( strtolower($name) )
                {
                    case 'html' :
                        $element = System::document()->documentElement;
                        break;
                    case 'body' :
                        $element = System::document()->body;
                        break;
                    default :
                        $element  =  $name === "text" ? new Node($name, $type, $attrs) : new HTMLElement($name, $type, $childItem['attr']);
                }
            }

            if( isset($childItem['children']) )
            {
                foreach ( $childItem['children'] as $child )
                {
                    $element->addChildAt( $child, 0 );
                }
            }

            $element->content = $childItem['content'];
            $element->innerHTML = $childItem['content'];
            $element->outerHTML = '<'.$name.$childItem['attrraw'].'>'. $childItem['content'].'</'.$name.'>';

            //顶级元素
            if( $parentIndex === null )
            {
                if( $outer !== true && $element !== $this )$this->addChildAt( $element , 0);
                array_push( $children , $element );

            }else
            {
                $parent = &$items[ $parentIndex ];
                if( !isset($parent['children']) )$parent['children']=array();
                array_push( $parent['children'], $element );
            }
        }

        if( $html && $element==null )
        {
            $this->content = $html;
            $this->innerHTML = $html;
        }
        if( $outer ===true && count($children) > 1 )
        {
            throw new SyntaxError( 'parse outerHTML error');
        }
    }
}