/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,HTMLElement,Document,Node,EventDispatcher
 */
var EventDispatcher = require("./EventDispatcher.js");
const attrpx = {
    "width":"px",
    "height":"px",
    "left":"px",
    "top":"px",
    "bottom":"px",
    "right":"px",
    "border-radius":"px",
};
function setStyle(node, name, value)
{
    name = name.replace(/([A-Z])/g,function(a,b){
        return "-"+ b.toLowerCase();
    });
    if( name.charAt(0) === "-" )
    {
        name = name.substr(1);
    }
    var pix  = "";
    if( attrpx[name] && !/(px|em|rem)$/i.test(value) )
    {
        pix = "px";
    }
    node.style[ name ]=value+pix;
}

module.exports = class Element extends EventDispatcher
{
    constructor( selector, context=null )
    {
        super();
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
        this.length =  selector.length;
        for(var i in selector)
        {
            this[i] = selector[i];
        }
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
                var matchAttrs = match[2].match( /(\w+)\s*\=\s*([\'\"])([^\2]*?)\2/g );
                if( matchAttrs )
                {
                    for(var i=0;i<matchAttrs.length;i++)
                    {
                        var value = matchAttrs[i].split("=");
                        attr[ System.trim(value[0]) ] = value[1].slice(1,-1);
                    }
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

        switch ( name.toLowerCase(name) )
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
           return new HTMLElement( name, 1, attr);
        }
        
        var elem = new Node();
        elem.attr = attr;
        elem.content = html;
        return elem;
    }

    static isNodeElement( element )
    {
        return element instanceof Node;
    }

    static contains( parent, child )
    {
        if( child.parentNode )
        {
            while( child && child.parentNode !== parent  )
            {
                child = child.parentNode;
            }
            return child && child.parentNode === parent;
        }
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
            for(var i=0;i<this.length;i++)
            {
                this[i].innerHTML= value;
            }
            return this;
        }
        var node =  this.current();
        if( value===true )
        {
            return node ? node.outerHTML : '';
        }
        return node ? node.innerHTML : '';
    }

    addChild(child)
    {
        return this.addChildAt(child,-1);
    }

    addChildAt(child, index=-1 )
    {
        var parentNode = this.current();
        child = child instanceof Element ? child.current() : child;
        if( !child ){
            throw new TypeError("Invalid element");
        }
        return parentNode.addChildAt(child, index);

    }

    removeChild( child )
    {
        child = child instanceof Element ? child.current() : child;
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
        var child = this.current();
        if( child.parentNode )
        {
            return child.parentNode.removeChildAt( index );
        }
        return false;
    }

     getChildIndex( child )
    {
        child = child instanceof Element ? child.current() : child;
        if( !(child instanceof Node) )
        {
            throw new TypeError("child is not Node Element");
        }
        var parent = child.parentNode;
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
        if( elem )
        {
            this._current = elem;
            return this;
        }
        return this._current || this[0];
    }

    fadeIn()
    {

    }

    fadeOut()
    {

    }

    parent()
    {
       var node = this.current();
       if( node && node.parentNode )
       {
          return new Element( node.parentNode );
       }
       return new Element();
    }

    isEmpty()
    {
        return this.length < 1;
    }

    property(name, value)
    {
        var item = this.current();
        if( value === void 0 )
        {
            var isObject = System.isObject(name);
            for(var i=0;i<this.length;i++)
            {
                var item = this[i];
                if( isObject )
                {
                    item.attr = Object.merge(item.attr,name);
                }
            }
            return isObject ? this : item.name;
        }
        item.attr[ name ] = value;
        return this;
    }

    properties( object )
    {
        for(var i=0;i<this.length;i++)
        {
            var item = this[i];
            item.attr = Object.merge(item.attr,object);
        }
        return this;
    }

    hasProperty(prop)
    {
        var item = this.current();
        return item.hasOwnProperty( prop );
    }

    data(name, value )
    {
       var map = this[ privateSymbol ] || (this[ privateSymbol ]={});
       if( value !== void 0 )
       {
          map[name] = value;
       }
       return map[name];
    }

    style(name, value=null)
    {
        var item = this.current();
        if( name==="cssText" )
        {
            if( typeof value ==="string")
            {
                name = System.unserialize(value);
                value = null;
            }
        }

        if( typeof name ==="object" && item )
        {
            Object.forEach( name, function(value,prop){
                setStyle(item,prop,value);
            });
            return this;
        }

        if( value != null )
        {
            if( item )
            {
                setStyle(item,name,value);
            }
            return this;
        }
        return item ? item.style.name : null;
    }
    show()
    {
        this.style("display","block");
    }
    hide()
    {
        this.style("display","none");
    }
    text( value )
    {
       this.property("textContent", value);
    }
    value( val )
    {
        var nodename = this.nodeName.toLowerCase();
        if( nodename ==="input" || nodename ==="select" )
        {
            this.property("value", value); 
        }
    }
    hasClass( className )
    {
        var oldClassName = this.property("class");
        if( oldClassName ){
           return (new RegExp("\\b"+className+"\\b")).test( oldClassName );
        }
        return false;
    }
    addClass( className )
    {
        var classStr = this.property("class");
        className = System.trim( className );
        if( classStr )
        {
            classStr =  className.split(/\s+/);
            if( classStr.indexOf( className ) < 0 )
            {
                classStr.push( className )
                this.property("class", classStr.join(" ") );
            }
        }

    }
    removeClass(className)
    {
        var classStr = this.property("class");
        className = System.trim( className );
        if( classStr )
        {
            classStr =  className.split(/\s+/);
            var index = classStr.indexOf( className );
            if( index >= 0 )
            {
                classStr.splice(index,1);
                this.property("class", classStr.join(" ") );
            }
        }
    }

    slice()
    {
        return [].slice.call(this,0);
    }
    splice()
    {
        return [].splice.apply(this, Array.from(arguments) ); 
    }
    concat()
    {
        return [].concat.apply(this, Array.from(arguments) ); 
    }
    indexOf( obj )
    {
        return [].indexOf.call(this, obj );   
    }

    isNodeInDocumentChain()
    {
        var elem = this.current();
        if( elem )
        {
            return elem.isNodeInDocumentChain();
        }
        return false;
    }

    toString()
    {
        var elem = this.current();
        return elem ? elem.outerHTML : '';
    }

    count()
    {
        return this.length;
    }
}

var privateSymbol = Symbol("Element::data");
var System = require("./System.js");
var Node = require("./Node.js");
var Object = require("./Object.js");
var Document = require("./Document.js");
var HTMLElement = require("./HTMLElement.js");