<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,BaseObject,Node,SyntaxError,ReferenceError
 */
class HTMLElement extends Node
{
    /**
     * 元素的值属性(一般用于input元素)
     * @var string
     */
    public $value  = '';

    /**
     * 不包括元素本身的html字符串
     * @var string
     */
    private $innerHTML = '';

    /**
     * 包括元素本身的html字符串
     * @var string
     */
    private $outerHTML = '';

    /**
     * @var array
     */
    private $children=array();

    /**
     * 是否需要重新解析对象为html字符串
     * @var bool
     */
    private $parseHtml = true;

    /**
     * 一个标志是否需要解析内部元素
     * @var bool
     */
    private $hasInnerHTML = false;

    /**
     * 节点类型
     * @var array
     */
    static private $typeMap = array(
        'text'=>3,
        'document'=>9,
    );

    /**
     * 为子级设置相对根文档是可见的
     * @param Node $child
     */
    static private function setVisibleForChild(Node $child)
    {
        $child->visible = true;
        if( $child instanceof HTMLElement  )
        {
            foreach( $child->children as $item )
            {
                self::setVisibleForChild( $item );
            }
        }
    }

    /**
     * HTMLElement constructor.
     * @param string $name
     * @param int $type
     * @param array $attr
     */
    public function __construct($name='div', $type = 1, $attr=array() )
    {
        $this->nodeName = $name;
        $this->nodeType = $type;
        parent::__construct($name, $type, $attr);
    }

    /**
     * 设置获取元素的属性
     * @param $name
     * @param null $value
     * @return mixed|null
     */
    public function attribute($name, $value=null )
    {
         if( $value === null ){
             return $this->attr->$name;
         }
         return $this->attr->$name = $value;
    }

    /**
     * 根据指定的名称获取元素
     * @param $name
     * @return array|bool
     */
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

    /**
     * 根据指定的ID来获取元素
     * @param $name
     * @return Node|null
     */
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

    /**
     * 获取当前元素的深度
     */
    public function countDepth()
    {
        if( $this->parentNode )
        {
            $this->depth += $this->parentNode->depth + 1;
        }
        foreach( $this->children as $child )
        {
            $child->countDepth();
        }
    }

    /**
     * 获取元素的所有节点元素
     * @return array
     */
    public function childNodes()
    {
        return array_slice( $this->children, 0);
    }

    /**
     * 添加一个子级元素
     * @param Node $child
     * @return Node
     * @throws ReferenceError
     */
    public function addChild( Node $child )
    {
        return $this->addChildAt($child, -1 );
    }

     /**
     * 添加一个子级元素
     * @param Node $child
     * @return Node
     * @throws ReferenceError
     */
    public function appendChild( Node $child )
    {
        return $this->addChildAt($child, -1 );
    }

    /**
     * 添加一个子级元素到指定的索引位置
     * @param Node $child
     * @param $index
     * @return Node
     * @throws ReferenceError
     */

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
        if( $this->visible )
        {
            self::setVisibleForChild( $child );
        }
        return $child;
    }

    /**
     * 移除一个子级元素
     * @param Node $child
     * @return array
     * @throws ReferenceError
     */
    public function removeChild(Node $child)
    {
        $index = array_search($child, $this->children, true);
        if( $index>=0 )
        {
            return $this->removeChildAt( $index );
        }
        throw new ReferenceError( 'child is not exists', __FILE__, __LINE__);
    }

    /**
     * 移除指定索引位置的元素
     * @param $index
     * @return array
     * @throws ReferenceError
     */
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

    /**
     * 获取子级的索引位置
     * @param Node $child
     * @return false|int|string
     */
    public function getChildIndex(Node $child)
    {
        return array_search($child, $this->children, true );
    }

    /**
     * 是否有子级元素
     * @return bool
     */
    public function hasChildren()
    {
        return count( $this->children )>0;
    }

    /**
     * 将元素对象转成html的字符串
     * @return array|null|string
     */
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

    /**
     * 当前指定的属性名不存在时调用
     * @param $name
     * @return mixed|null|object|stdClass|string
     */
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

    /**
     * 当指定的属性名不存在时调用
     * @param $name
     * @param $value
     * @return mixed|null|stdClass|void
     */
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
                if( System::isObject($value) )
                {
                    if( isset($value->style) )
                    {
                        $this->style = BaseObject::merge( $this->style, System::unserialize($value->style) );
                        unset( $value->style );
                    }
                    $this->attr = BaseObject::merge( $this->attr, $value);
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

    /**
     * 销毁指定名称的属性
     * @param $name
     */
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


    /**
     * 解析内容元素为一个字符串(废弃)
     * @param $html
     * @param bool $outer
     * @throws ReferenceError
     * @throws SyntaxError
     * @deprecated
     */
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
                $element->attr = $attrs;

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