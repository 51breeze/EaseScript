/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,BaseObject,Node,SyntaxError,ReferenceError
 */

import System from "System.js";
import Node from "Node.js";
import Document from "Document.js";

export default class HTMLElement extends Node
{
    /**
     * 节点类型
     * @var array
     */
    static typeMap ={
        'text':3,
        'document':9,
    };

    /**
     * 为子级设置相对根文档是可见的
     * @param Node child
     */
    static setVisibleForChild(child)
    {
        child.visible = true;
        if( child instanceof HTMLElement  )
        {
            child.children.forEach(function(item){
                HTMLElement.setVisibleForChild( item );
            });
        }
    }

    /**
     * HTMLElement constructor.
     * @param string name
     * @param int type
     * @param object attr
     */
    constructor(name='div', type = 1, attr={} )
    {
        this.nodeName = name;

        this.nodeType = type;

        /**
         * 元素的值属性(一般用于input元素)
         * @var string
         */
        this.value  = '';

        /**
         * 不包括元素本身的html字符串
         * @var string
         */
        this._innerHTML = '';

        /**
         * 包括元素本身的html字符串
         * @var string
         */
        this._outerHTML = '';

        /**
         * @var array
         */
        this._children=array();

        /**
         * 是否需要重新解析对象为html字符串
         * @var bool
         */
        this._parseHtml = true;

        /**
         * 一个标志是否需要解析内部元素
         * @var bool
         */
        this._hasInnerHTML = false;

        super(name, type, attr);
    }

    /**
     * 设置获取元素的属性
     * @param name
     * @param null value
     * @return mixed|null
     */
    attribute(name, value=null )
    {
         if( value === null ){
             return this.attr.name;
         }
         return this.attr.name = value;
    }

    /**
     * 根据指定的名称获取元素
     * @param name
     * @return array|bool
     */
     getElementByName( name )
    {
        if( typeof name !== "string" )return false;
        len =  this._children.length;
        i = 0;
        items = [];
        for(;i<len;i++)
        {
            child = this._children[i];
            if( child.nodeName.toLowerCase()===name.toLowerCase() )
            {
                items.push( child );
            }
        }
        return items;
    }

    /**
     * 根据指定的ID来获取元素
     * @param name
     * @return Node|null
     */
     getElementById( name )
    {
        if( typeof name !== "string" )return false;
        len = this._children.length;
        i = 0;
        for(;i<len;i++)
        {
            child = this._children[i];
            if( child.nodeName.toLowerCase()===name.toLowerCase() )
            {
                return child;
            }
        }
        return null;
    }

    /**
     * 获取当前元素的深度
     */
    countDepth()
    {
        return this.depth;
    }

    /**
     * 添加一个子级元素
     * @param Node child
     * @return Node
     * @throws ReferenceError
     */
     addChild( child )
    {
        return this.addChildAt(child, -1 );
    }

     /**
     * 添加一个子级元素
     * @param Node child
     * @return Node
     * @throws ReferenceError
     */
     appendChild( child )
    {
        return this.addChildAt(child, -1 );
    }

    /**
     * 添加一个子级元素到指定的索引位置
     * @param Node child
     * @param index
     * @return Node
     * @throws ReferenceError
     */

     addChildAt(child , index )
    {
        if( this === child )
        {
            throw new ReferenceError('parent and child elements can not be the same');
        }
        this.content = '';
        index = index<0 ? this._children.length+index+1 : index;
        if( child.parentNode )
        {
            child.parentNode.removeChild( child );
        }
        this._children.splice(index,0,child);
        child.parentNode = this;
        this._parseHtml = true;
        if( this.visible )
        {
            HTMLElement.setVisibleForChild( child );
        }
        return child;
    }

    /**
     * 移除一个子级元素
     * @param Node child
     * @return array
     * @throws ReferenceError
     */
     removeChild(child)
    {
        index = this._children.indexOf(child);
        if( index>=0 )
        {
            return this.removeChildAt( index );
        }
        throw new ReferenceError( 'child is not exists');
    }

    /**
     * 移除指定索引位置的元素
     * @param index
     * @return array
     * @throws ReferenceError
     */
     removeChildAt( index )
    {
        index = index<0 ? this._children.length+index : index;
        if( this._children[index] )
        {
            child =  this._children.splice(index, 1);
            child = child[0];
            child.parentNode = null;
            this._parseHtml = true;
            return child;
        }
        throw new ReferenceError( 'index is out range');
    }

    /**
     * 获取子级的索引位置
     * @param Node child
     * @return false|int|string
     */
     getChildIndex(child)
    {
        return this._children.indexOf(child);
    }

    /**
     * 是否有子级元素
     * @return bool
     */
     hasChildren()
    {
        return this._children.length>0;
    }

     getAttribute(name)
    {
        return this.attr[name] || null;
    }

    setAttribute(name, value)
    {
        this.attr[name]=value;
    }

    /**
     * 将元素对象转成html的字符串
     * @return array|null|string
     */
    toString()
    {
        if( this._parseHtml===true )
        {
            this._parseHtml = false;
            html = this._innerHTML;
            if( !this.hasInnerHTML )
            {
                html = '';
                this._children.forEach(function(item){
                    html += item.toString();
                })
                this._innerHTML = html;
            }

            attr = '';
            attrStr = System.serialize(this.attr, 'attr');
            styleStr = System.serialize(this.style, 'style');
            if (attrStr) attr += ' ' + attrStr;
            if (styleStr) attr += ' style="' + styleStr + '"';
            nodename = this.nodeName;
            if( nodename === 'link' || nodename === 'meta' || nodename==="input" )
            {
                this._outerHTML = '<' + this.nodeName + attr + ' />';
                this._innerHTML = '';

            } else
            {
                if( (nodename ==="html" || nodename==="head" || nodename==="body" ) && html.test( new RegExp( '<\\/'+nodename+'>' )))
                {
                    this._outerHTML = html;
                    return html;
                }

                left = '<' + this.nodeName + attr + '>';
                right = '</' + this.nodeName + '>';
                if (!html) html = this.content;
                if( this.nodeName != '#documentFragment' )
                {
                    html = left + html + right;
                }
                this._outerHTML = html;
            }
        }
        return this._outerHTML;
    }

    get innerHTML()
    {
        this.toString();
        return this.innerHTML;
    }

    set innerHTML( value )
    {
        this._children=[];
        this.innerHTML = value;
        this._parseHtml=true;
        this._hasInnerHTML = true;
        return value;
    }

    get outerHTML()
    {
        this.toString();
        return this.outerHTML;
    }

    set outerHTML( value )
    {
        this._children=[];
        this.outerHTML = value;
        this._parseHtml=true;
        this._hasInnerHTML = true;
        return value;
    }

    get html()
    {
        return Document.document.documentElement;
    }

    get documentElement()
    {
        return Document.document.documentElement;
    }

    get body()
    {
        return Document.document.body;
    }

    get head()
    {
        return Document.document.head;
    }

    get childNodes()
    {
        return this._children.slice(0);
    }

}


