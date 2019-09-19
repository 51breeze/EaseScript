/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,HTMLElement,Document,Node,EventDispatcher
 */

import System from "System.js";
import EventDispatcher from "EventDispatcher.js";
import Node from "Node.js";

export default class Element extends EventDispatcher
{
    constructor( selector, context=null )
    {
        this.length = 0;
        this.items=[];

        if( typeof selector === 'string' )
        {
            selector = System.trim( selector );
            if( selector ==="body" )
            {
                selector = [ System.document().body ];
            }else if( selector==="document")
            {
                selector = [System.document()];
            }else if( selector==="window")
            {
                selector = [System.window()];

            }else if(  selector.charAt(0) ==='<' )
            {
                selector = [ Element.createElement( selector ) ];
            }else
            {
                selector = Document.querySelectorAll( selector, context );
            }

        }else if( selector instanceof Node )
        {
            selector = [selector];
        }else{
            selector = [];
        }
        this.items = selector;
        this.length =  selector.length;
        super();
    }

    static createElement( html )
    {
        html = System.trim( html );
        var name = html;
        var attr = {};
        var match = html.match(/^<(\w+)([^>]*?)\/>/);

        if( match )
        {
            if( match[2] )
            {
                attr = match[2].match( /(\w+)\s*\=\s*([\'\"])([^\\2]*?)\\2/g );
                if( attr )
                {
                   // attr = array_combine( attr[1], attr[3] );
                }
            }
            name = match[1];
        }

        if( name.charAt(0) === '<' )
        {
            elem = new HTMLElement('#documentFragment');
            elem.innerHTML = html;
            childNodes = elem.childNodes;
            if( count(childNodes)===1 )
            {
                elem = childNodes[0];
                return elem;
            }
            return elem;
        }

        switch ( name.strtolower(name) )
        {
            case 'body' :
                return System.document().body;
                break;
            case 'head' :
                return System.document().head;
                break;
            case 'html' :
                return System.document().documentElement;
                break;
            case 'document' :
                return System.document();
                break;
        }

        if( name.match(/^\w+/) )
        {
            elem = new HTMLElement( name, 1, attr);

        }else
        {
            elem = new Node();
            elem.content = html;
        }
        return elem;
    }

    static isNodeElement( element )
    {
        return element instanceof Node;
    }

    static contains( parent, child )
    {
        return false;
    }

    static isHTMLContainer( element )
    {
        return element instanceof HTMLElement;
    }

    static getNodeName( element )
    {
        return element ? element.nodeName : '';
    }


    html( value=null )
    {
        if( value != null && typeof value === "string" )
        {
            this.items.forEach( function(item){
                item.innerHTML= value;
            });
            return this;
        }
        if( value===true )
        {
            return this.items[0] ? this.items[0].outerHTML : '';
        }
        return this.items[0] ? this.items[0].innerHTML : '';
    }

    addChild(child)
    {
        return this.addChildAt(child,-1);
    }

    addChildAt(child, index=-1 )
    {
        child = child instanceof Element ? child.items : child;
        if( !isset(this.items[0]) ){
            throw new TypeError("Invalid element");
        }
        return this.items[0].addChildAt(child, index);

    }

    removeChild( child )
    {
        child = child instanceof Element ? child.items[0] : child;
        if( !(child instanceof Node) )
        {
            throw new TypeError("child is not Node Element");
        }
        if( child.parentNode )
        {
            return child.parentNode.removeChild( child );
        }
        return false;
    }

    removeChildAt( index )
    {
        child = this.items[0];
        if( child.parentNode )
        {
            return child.parentNode.removeChildAt( index );
        }
        return false;
    }

     getChildIndex( child )
    {
        child = child instanceof Element ? child.items[0] : child;
        if( !(child instanceof Node) )
        {
            throw new TypeError("child is not Node Element");
        }
        parent = child.parentNode;
        if( parent instanceof HTMLElement )
        {
            index = parent.childNodes.indexOf( child );
            if( index >= 0 )return index;
        }
        throw new TypeError("Invaild child element");
    }

    width(value=null)
    {
        return this.style('width', value);
    }

    height(value=null)
    {
        return this.style('height', value);
    }

    current( elem=null )
    {
        return current(this.items);
    }

    property(name, value=null)
    {
        item = this.items[0];
        if( value===null )
        {
            if( System.isObject(name) )
            {
                item.attr = Object.merge(item.attr,name);
                return this;
            }
            return item.name;
        }
        item.attr.name = value;
        return this;
    }

    properties( object )
    {
        item = this.items[0];
        item.attr = object;
        return this;
    }

    hasProperty(prop){

    }

    data(name, value ){

    }

    style(name, value=null)
    {
        item = this.items[0];
        if( value != null )
        {
            if( item )
            {
                var attrpx = {
                    "width":"px",
                    "height":"px",
                    "left":"px",
                    "top":"px",
                    "bottom":"px",
                    "right":"px",
                    "borderRadius":"px",
                };
                item.style[name]=value+( attrpx[name] ? attrpx[name] : '' );
            }
            return this;
        }
        return item ? item.style.name : null;
    }
    show(){}
    hide(){}
    text( value ){}
    value( val ){}
    hasClass(className ){}
    addClass(className ){}
    removeClass(className ){}

    slice(){}
    splice(){}
    concat(){}
    indexOf(){}

    isNodeInDocumentChain()
    {
        if( isset(this.items[0]) )
        {
            return this.items[0].isNodeInDocumentChain();
        }
        return false;
    }

    toString()
    {
        return isset( this.items[0] ) ? this.items[0].outerHTML : '';
    }

    count()
    {
        return this.length;
    }

}