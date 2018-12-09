/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Array,EventDispatcher,Document,Window,StyleEvent,PropertyEvent,ScrollEvent,ElementEvent,Math,TypeError,Error,SyntaxError,ReferenceError,Symbol
 */
var fix={
    attrMap:{
        'tabindex'       : 'tabIndex',
        'readonly'       : 'readOnly',
        'for'            : 'htmlFor',
        'maxlength'      : 'maxLength',
        'cellspacing'    : 'cellSpacing',
        'cellpadding'    : 'cellPadding',
        'rowspan'        : 'rowSpan',
        'colspan'        : 'colSpan',
        'usemap'         : 'useMap',
        'frameborder'    : 'frameBorder',
        'class'          : 'className',
        'contenteditable': 'contentEditable'
    }
    ,attrtrue:{
        'className':true,
        'innerHTML':true,
        'value'    :true
    }
    ,cssPrefixName:''
    ,cssPrefix:{
        'box-shadow':true,
        'border-radius':true,
        'border-top-left-radius':true,
        'border-top-right-radius':true,
        'border-bottom-left-radius':true,
        'border-bottom-right-radius':true,
        'focus-ring-color':true,
        'user-select':true,
        'radial-gradient':true,
        'linear-gradient':true,
        'transform':true,
        'transition':true,
        'animation':true,
        'animation-name':true,
        'animation-duration':true,
        'animation-iteration-count':true,
        'animation-delay':true,
        'animation-fill-mode':true,
        'animation-direction':true,
        'animation-timing-function':true,
        'animation-play-state':true
    }
    ,cssUpperRegex:/([A-Z]|^ms)/g
    ,cssCamelRegex:/-([a-z]|[0-9])/ig
    ,cssCamelCase:function( all, letter )
    {
        return ( letter + "" ).toUpperCase();
    }
    ,cssNumber:{
        "fillOpacity": true,
        "fontWeight": true,
        "lineHeight": true,
        "opacity": true,
        "orphans": true,
        "widows": true,
        "zIndex": true,
        "zoom": true
    }
    ,cssHooks:{}
    ,cssMap:{}
    ,fnHooks:{}
    ,cssDisplayRegex:/^(none|table(?!-c[ea]).+)/
    ,cssDisplayMap:{position:"absolute",visibility: "hidden", display:"block"}
    ,getsizeval:function( prop )
    {
        if ( Element.isWindow(this) )
        {
            var val =  Math.max(
                this['inner'+prop] || 0,
                this['offset'+prop] || 0,
                this['client'+prop] || 0
            ) || document.documentElement['client'+prop];
            if( document.compatMode ==="BackCompat" ){
                val = document.body['client'+prop];
            }
            return val;

        } else if ( Element.isDocument(this) )
        {
            return Math.max(
                    this.body['scroll'+prop] || 0,
                    this.documentElement['scroll'+prop] || 0,
                    this.body['offset'+prop] || 0,
                    this['offset'+prop] || 0,
                    this.body['client'+prop] || 0,
                    this['client'+prop] || 0
                )+(this.documentElement[ prop==='Height'? 'clientTop' : 'clientLeft' ] || 0);
        }
        var val = this['offset'+prop] || 0;
        if( val < 1 )
        {
            var style = getComputedStyle( this );
            val = parseFloat( prop==="Width" ? style.width : style.height )||0;
            if( val < 1 && fix.cssDisplayRegex.test( style.display ) )
            {
                var oldCss = {};
                var p;
                for( p in fix.cssDisplayMap )
                {
                    oldCss[p]=style[ p ];
                    this.style[ p ]=fix.cssDisplayMap[p];
                }
                val = this['offset'+prop] || 0;
                for( p in oldCss )this.style[ p ]=oldCss[p];
            }
        }
        return val;
    }
};

/**
 * @private
 */
var accessor={};
var storage=Internal.createSymbolStorage( Symbol('Element') );

/**
 * @private
 */
function access(callback, name, newValue, isDisplay, isHidden)
{
    var write= typeof newValue !== 'undefined';
    var getter = accessor[callback].get;
    var setter = accessor[callback].set;
    if( fix.fnHooks[callback] )
    {
        getter = typeof fix.fnHooks[callback].get === "function" ? fix.fnHooks[callback].get : getter ;
        setter = typeof fix.fnHooks[callback].set === "function" ? fix.fnHooks[callback].set : setter ;
    }
    if( !write )
    {
        var elem = this.current();
        return elem ? getter.call(elem,name,this) : false;
    }

    return this.forEach(function(elem)
    {
        var oldValue= getter.call(elem,name,this);
        if( isDisplay )
        {
            var _data = storage(elem, 'data') || storage(elem, 'data', {});
            if( isHidden ){
                _data['---display---'] = oldValue;
            }else{
                newValue = _data['---display---'];
                if( !newValue || newValue.toLowerCase() === "none" )
                {
                    newValue=getDisplayValueByElem( elem );
                }
            }
        }

        if( oldValue !== newValue )
        {
            var event = setter.call(elem,name,newValue,this);
            if( event )
            {
                if (typeof event === "string")
                {
                    event = event === StyleEvent.CHANGE ? new StyleEvent(StyleEvent.CHANGE) : new PropertyEvent(PropertyEvent.CHANGE);
                    event.property = name;
                }
                if (event instanceof PropertyEvent)
                {
                    event.property = event.property || name;
                    event.newValue = event.newValue || newValue;
                    event.oldValue = event.oldValue || oldValue;
                    this.dispatchEvent(event);
                }
            }
        }
    });
}

/**
 * 获取元素的显示属性
 * @param elem
 * @returns {*}
 */
function getDisplayValueByElem( elem )
{
    var nodename = elem.nodeName.toLowerCase();
    switch ( nodename )
    {
        case "table" :
            return 'table' ;
        case "thead" :
            return 'table-header-group' ;
        case "tbody" :
            return 'table-row-group';
        case "tfoot" :
            return 'table-footer-group';
        case "tr" :
            return 'table-row';
        case "td" :
            return 'table-cell';
        case "col" :
            return 'table-column';
        case "caption" :
            return 'table-caption';
        case "colgroup" :
            return 'table-column-group';
        case "div" :
        case "ul"  :
        case "li"  :
        case "p":
        case "address":
        case "dl":
        case "dd":
        case "dt":
        case "ol":
        case "fieldset":
        case "form":
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
            return 'block';
        default :
            return 'inline';
    }
}

/**
 * @private
 */
function getChildNodes(elem)
{
    var ret=[];
    if( !Element.isFrame(elem) && elem.hasChildNodes() )
    {
        var len=elem.childNodes.length,index= 0,node;
        while( index < len )
        {
            node=elem.childNodes.item(index);
            if( Element.getNodeName(node) !== "#text" )
            {
                ret.push(node);
            }
            ++index;
        }
    }
    return ret;
}
/**
 * @private
 */
function dispatchEvent(dispatch, type, parent, child )
{
    if( dispatch.hasEventListener(type) )
    {
        var event = new ElementEvent(type);
        event.parent = parent;
        event.child = child;
        return dispatch.dispatchEvent(event);
    }
    return true;
}

/**
 *  @private
 */
function recursion(prop, selector, deep, exclude)
{
    var results = new Array();
    var current;
    var nodename = '';
    var last;
    this.forEach(function(elem)
    {
        if( elem && elem.nodeType )
        {
            current = elem;
            do{
                last = current;
                current = current[prop];
                if( exclude && (elem === exclude || current===exclude) )return;
                if( current && ( nodename = Element.getNodeName(current) ) !== "#text" && results.indexOf( current ) < 0 )
                {
                    results.push( current );
                }
            } while ( current && last !== current && ( deep===true || nodename === "#text" ) );
        }
    });
    return selector ?
        ( typeof selector === "function" ?
            Array.prototype.filter.call(results,function(elem){
                this.current(elem);
                return selector.call(this,elem);
            },this)
           : querySelector(selector,null,null,results) )
        : results;
}

/**
 * @private
 * @param instance
 * @param results
 * @returns {*}
 */
function makeElement( instance, results , index )
{
    if( typeof results.valueOf === "function"  ){
        results = results.valueOf();
    }
    Array.prototype.splice.apply(instance, [].concat.apply([index || 0, 0], results));
    return instance;
}

/**
 * 统一规范的样式名
 * @param name
 * @returns {string}
 */
function getStyleName(name )
{
    if( typeof name !=='string' )
        return name;
    if( name === 'cssText')
        return name;
    name=fix.cssMap[name] || name;
    name=name.replace( /^-ms-/, "ms-" ).replace( fix.cssCamelRegex, fix.cssCamelCase );
    name = name.replace( fix.cssUpperRegex, "-$1" ).toLowerCase();
    if( fix.cssPrefix[name] === true )
    {
        return fix.cssPrefixName + name;
    }
    return name;
}

/**
 * @param cssText
 * @returns {string}
 */
function formatStyleSheet( styleObject,type,node,elem)
{
    if( type==="object" )
    {
        var results=[];
        for( var name in styleObject )
        {
            var value = formatStyleValue(name, styleObject[name], node, elem);
            if( value !==false )
            {
                value = typeof value === "object" ? System.serialize(value, 'style') : getStyleName(name) + ":" + value;
                results.push(value);
            }
        }
        return results.join(";");
    }
    return styleObject.replace(/([\w\-]+)\s*\:([^\;\}]*)/g, function (all, name, value) {
        value = formatStyleValue(name, value, node, elem);
        if( !value )return "";
        return typeof value === "object" ? System.serialize(value, 'style') : getStyleName(name)+":"+value;
    });
}

/**
 * 格式化样式名及属性值
 * @param name
 * @param value
 * @return {string}
 */
function formatStyleValue(name, value, node, elem, apply )
{
    var type = typeof value;
    if( type === "string" )
    {
        value = System.trim(value);
        type = /^\d+$/.test( value ) ? 'number' : type;
    }
    if( type === "string" )
    {
        var increment = /^([\-+])=([\-+.\de]+)/.exec(value);
        if (increment)
        {
            var inc = accessor.style.get.call(node||{}, name, elem);
            inc = parseFloat(inc) || 0;
            value = (+(increment[1] + 1) * +increment[2]) + inc;
            type = "number";

        } else if( System.env.platform("IE", 8) && value.substr(0, 5) === "rgba(" )
        {
            value = value.replace(/rgba\(.*?\)/i, rgbToHex(value));
        }
    }

    if( type === "number" && isNaN( value ) )
    {
        return false;
    }

    //添加单位
    if( type === "number" && !fix.cssNumber[name] )
    {
        value += "px";
    }
    if( fix.cssHooks[name] && typeof fix.cssHooks[name].set === "function")
    {
        if( apply )
        {
            var orgname = getStyleName(name);
            if( !fix.cssHooks[name].set.call(node,node.style,value,orgname) )
            {
                node.style[ orgname ] = value;
            }

        }else
        {
            var obj = {};
            fix.cssHooks[name].set.call(node||{},obj,value,elem);
            return obj;
        }

    }else
    {
        if( apply )
        {
            node.style[ getStyleName(name) ] = value;
        }else{
            return value;
        }
    }
}

//获取并设置id
function getIdSelector( elem )
{
    if( !Element.isNodeElement(elem) )return null;
    var id = elem.getAttribute('id');
    var has = false;
    if( !id )
    {
        has = true;
        id = 'sq_' + Math.ceil(Math.random() * 1000000);
        elem.setAttribute('id', id);
    }
    return {id:'#' + id,has:has,elem:elem};
}
/**
 * 选择元素
 * @param mixed selector CSS3选择器
 * @param mixed context  上下文
 * @returns []
 */
var querySelector = typeof Sizzle === "function" ?  function(selector, context, results, seed) {
    return Sizzle( selector, context, results, seed);
} : function(selector, context, results, seed )
{
    if( !results || !System.isArray(results) )
    {
        if( context )
        {
            if( Element.isWindow(context) )
            {
                context = document;
            }else if( typeof context === "string" && !( context = document.querySelector( context ) ) )
            {
                return [];
            }

            if( !Element.isHTMLContainer(context) )
            {
               throw new TypeError("Invalid context in Element.querySelector");
            }
        }
        results = Array.prototype.slice.call( (context||document).querySelectorAll(selector) );
    }

    if( seed && System.isArray(seed) )
    {
        var i=0;
        var ret=[];
        while( i<seed.length )
        {
            if( Array.prototype.indexOf.call(results, seed[i]) >=0 && Array.prototype.indexOf.call(ret,seed[i]) < 0)
            {
                ret.push( seed[i] );
            }
            i++;
        }
        return ret;
    }
    return results;
};

/**
 * @type {RegExp}
 */
var singleTagRegex=/^<(\w+)(.*?)\/\s*>$/;

/**
 * 创建HTML元素
 * @param html 一个html字符串
 * @returns {Node}
 */
function createElement(html , flag , isTable )
{
    if(System.isString(html) )
    {
        html=System.trim( html ).replace(/[\r\n]+/g,'');
        if( html )
        {
            if( flag ===true )
            {
                return document.createTextNode( html );
            }

            var match;
            if ( html.charAt(0) !== "<" && html.charAt(html.length - 1) !== ">" && html.length >= 1 && /^[a-zA-Z]+$/.test(html) )
            {
                try {
                    return document.createElement(html);
                } catch (e) {
                }

            } else if (html.charAt(0) === "<" && ( match = singleTagRegex.exec(html) ))
            {
                var elem = document.createElement(match[1]);
                var attr = matchAttr(html);
                for (var prop in attr) {
                    accessor['property'].set.call( elem, prop, attr[prop]);
                }
                return elem;
            }

            var div = document.createElement("div");
            var result = html.match(/^\<(tr|th|td|tbody|thead|tfoot)(?:[\s\>]+)/i);
            if( result )
            {
                var level = 1;
                switch( result[1] )
                {
                    case 'td':
                        html='<table><tbody><tr>'+html+'</tr></tbody></table>';
                        level = 3;
                        break;
                    case 'th':
                        html='<table><thead><tr>'+html+'</tr></thead></table>';
                        level = 3;
                        break;
                    case 'tr' :
                        html='<table><tbody>'+html+'</tbody></table>';
                        level = 2;
                        break;
                    default :
                        html ='<table>'+html+'</table>';
                        level = 1;
                }

                div.innerHTML = html;
                for (var i = 0; i < level; i++)
                {
                    div = div.childNodes.item(0);
                    div.parentNode.removeChild( div );
                }

                if( !div )
                {
                    throw new Error('Invalid html');
                }

                if( isTable )
                {
                    return div;
                }

            }else
            {
                div.innerHTML = html;
            }

            var len=div.childNodes.length;
            if(  len > 1 )
            {
                var fragment= document.createDocumentFragment();
                while( len > 0 )
                {
                    --len;
                    fragment.appendChild( div.childNodes.item(0) );
                }
                return fragment;
            }
            div=div.childNodes.item(0);
            return div.parentNode.removeChild( div );
        }

    }else if (Element.isNodeElement(html) )
        return  html.parentNode ?cloneNode(html,true) : html;
    throw new Error('createElement param invalid')
}
var getAttrExp = /(\w+)(\s*=\s*([\"\'])([^\3]*?)[^\\]\3)?/g;
var lrQuoteExp = /^[\'\"]|[\'\"]$/g;

/**
 * @private
 * 匹配字符串中的属性
 * @param strAttr
 * @return {}
 */
function matchAttr(strAttr)
{
    if( typeof strAttr === "string" && /[\S]*/.test(strAttr) )
    {
        var i=  strAttr.charAt(0)==='<' ? 1 : 0;
        var attr=strAttr.replace(/=\s*(\w+)/g,'="$1"').match( getAttrExp );
        strAttr={};
        if( attr && attr.length > 0 )
        {
            var item;
            while( item=attr[i++] )
            {
                var val  =  item.split('=');
                if( val.length > 0 )
                {
                    var prop =System.trim( val[0] );
                    strAttr[ prop ]='';
                    if( typeof val[1] === "string" )
                    {
                        strAttr[ prop ]=val[1].replace( lrQuoteExp ,'').replace(/\\([\'\"])/g,'$1');
                    }
                }
            }
        }
        return strAttr;
    }
    return null;
}

/**
 * @private
 * 合并元素属性。
 * 将 oSource 对象的属性合并到 target 元素
 * @param target 目标对象
 * @param oSource 引用对象
 * @returns {*}
 */
function mergeAttributes(target, oSource)
{
    var iselem=Element.isNodeElement( target );
    if( System.isObject(oSource) )
    {
        for (var key in oSource)if (oSource[key] && oSource[key] != '')
        {
            iselem ? accessor['property'].set.call( target, key,  oSource[key] ) : target[key] = oSource[key];
        }

    }else
    {
        var i=0, len=oSource.attributes.length,item;
        while( i<len )
        {
            item=oSource.attributes.item(i++);
            if( item.nodeValue && item.nodeValue !='' )
            {
                iselem ?  accessor['property'].set.call( target, item.nodeName, item.nodeValue ) : target[item.nodeName] = item.nodeValue;
            }
        }
    }
    return target;
}

/**
 * @private
 * 判断元素是否有样式
 * @param elem
 * @returns {boolean}
 */
function hasStyle(elem )
{
    return elem && elem.nodeType && elem.style && !(elem.nodeType === 3 || elem.nodeType === 8 || elem.nodeType === 9 || elem.nodeType === 11);
}

/**
 * @private
 * 获取元素当前的样式
 * @param elem
 * @returns {Object}
 */
function getComputedStyle(elem)
{
    if( !hasStyle(elem) )return {};
    return document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(elem, null)
        : elem.currentStyle || elem.style;
}

/**
 * @private
 * 克隆节点元素
 * @param nodeElement
 * @returns {Node}
 */
function cloneNode(nodeElement , deep )
{
    if( nodeElement.cloneNode )
    {
        return nodeElement.cloneNode( !!deep );
    }
    //nodeElement.nodeName
    if( typeof nodeElement.nodeName==='string' )
    {
        var node = document.createElement( nodeElement.nodeName  );
        if( node )mergeAttributes(node,nodeElement);
        return node;
    }
    return null;
}

/**
 * @private
 * @param results
 * @returns {Array}
 */
function filters(results) {
     return Array.prototype.filter.call(results, function (elem) {
        return Element.isNodeElement(elem) || Element.isWindow(elem);
    });
}

/**
 * Element class
 * @param selector
 * @param context
 * @returns {Element}
 * @constructor
 */
function Element(selector, context)
{
    if( !(this instanceof Element) )
    {
        return new Element( selector, context );
    }
    if( context )context= context instanceof Element ? context[0] : context;
    storage(this,true,{
        'context':context,
        'forEachCurrentItem':null,
        'forEachCurrentIndex':NaN
    });
    var result=null;
    if( selector )
    {
        //复制Element的结果到当前对象
         if( selector instanceof Element )
        {
            result = Array.prototype.slice.call(selector,0);
        }
        //指定的选择器是一组元素
        else if ( System.isArray(selector) )
        {
            result = filters( selector );
        }
        //是一个选择器或者指定一个需要创建的html标签
        else if (typeof selector === "string")
        {
            selector = System.trim( selector );
            //创建一个指定标签的新元素
            if( selector.charAt(0) === '<' && selector.charAt(selector.length - 1) === '>' )
            {
                result=[createElement(selector)];
            }
            //查询指定选择器的元素
            else
            {
                result = querySelector(selector, context);
            }
        }
        //指定的选择器为元素对象
        else if ( Element.isNodeElement(selector) || Element.isWindow(selector) )
        {
            result = [selector];
        }
    }
    Object.defineProperty(this,"length", {value:0,writable:true});
    if( result )makeElement( this, result);
    EventDispatcher.call(this);
}

Element.prototype= Object.create( EventDispatcher.prototype );
Element.prototype.constructor=Element;
Element.prototype.setCurrentElementTarget=true;

/**
 * 返回此对象的字符串
 * @returns {*}
 */
Element.prototype.toString=function toString()
{
     if( this.constructor === Element ){
         return "[object Element]";
     }
     return EventDispatcher.prototype.toString.call(this);
}

/**
 * 返回此对象的数据值
 * @returns {*}
 */
Element.prototype.valueOf=function valueOf()
{
    if( this.constructor === Element ){
        return this.slice(0);
    }
    return EventDispatcher.prototype.valueOf.call(this);
}

/**
 * 返回一个指定开始索引到结束索引的元素并返回新的Element集合
 */
Element.prototype.slice = Array.prototype.slice;

/**
 * 替换或者增加一个或者多个元素并返回新的Element集合
 */
Element.prototype.splice= function splice(start,deleteLenght)
{
    var results = Element.prototype.concat.apply([],Element.prototype.slice.call(arguments,2) );
    var items = Array.prototype.splice.call( this, start, deleteLenght);
    Array.prototype.splice.apply( this, Array.prototype.concat.apply( [0,this.length],  this.concat( results ) ) );
    return items;
}

/**
 * 合并一个或者多个元素并返回一个新的Element集合
 */
Element.prototype.concat = function concat()
{
    var results = this.slice(0);
    var index = 0;
    while ( arguments.length > index )
    {
        var items = [];
        if( arguments[index] instanceof Element )
        {
            items = arguments[index].slice(0);
        }
        else
        {
            items = filters( System.isArray(arguments[index]) ? arguments[index] : [ arguments[index] ] );
        }
        results = Array.prototype.concat.apply( results,items);
        index++;
    }
    return Array.prototype.unique.call(results);
}

/**
 * 搜索一个指定的元素在当前匹配的集合中的位置
 */
Element.prototype.indexOf= Array.prototype.indexOf;

/**
 * 遍历元素
 * @param function callback
 * @param object refObject
 * @returns {*}
 */
Element.prototype.forEach=function forEach(callback , refObject)
{
    var result=null;
    refObject=refObject || this;
    var current = storage(this,'forEachCurrentItem');
    if( current )
    {
        result=callback.call( refObject ,current, storage(this,'forEachCurrentIndex') );
    }else
    {
        var items=this.slice(0),
            index = 0,
            len=items.length;
        for( ; index < len ; index++ )
        {
            current = items[ index ];
            storage(this,'forEachCurrentItem',current);
            storage(this,'forEachCurrentIndex',index);
            result=callback.call(refObject ,current,index);
            if( result != null )break;
        }
        storage(this,'forEachCurrentItem',null);
        storage(this,'forEachCurrentIndex',NaN);
    }
    return result == null ? this : result;
};

/**
 * 设置获取当前操作的元素
 * 此操作不会改变原有元素结果集，只是对当前操作的设置和一个引用的元素
 * 如果在调用这个方法之前调用了this.forEach且没有结束遍历，则返回的是forEach当前游标位置的元素，否则为0的游标元素
 * @param selector|HTMLElement element
 * @returns {*}
 */
Element.prototype.current=function current( elem )
{
    if( typeof elem === "undefined" )
    {
        return storage(this,'forEachCurrentItem') || this[0];
    }
    if( elem )
    {
        if (typeof elem === "string")
        {
            elem = querySelector(elem, this.context || document);
            elem = elem && elem.length > 0 ? elem[0] : null;
        }
        elem = elem && ( Element.isNodeElement(elem) || Element.isWindow(elem) ) ? elem : null;
    }
    storage(this, 'forEachCurrentIndex', NaN);
    storage(this, 'forEachCurrentItem', elem);
    return this;
};

/**
 * @private
 */
accessor['property']={
    get:function(name){
        name = fix.attrMap[ name ] || name;
        return  ( fix.attrtrue[name] || !this.getAttribute  ? this[name] : this.getAttribute(name) ) || null;
    }
    ,set:function(name,newValue){
        name = fix.attrMap[ name ] || name;
        if( fix.attrtrue[name] ===true && newValue === null )newValue = '';
        if( newValue === null ){
            fix.attrtrue[name] || !this.removeAttribute ? delete this[name] : this.removeAttribute(name);
        }else
        {
            fix.attrtrue[name] || !this.setAttribute  ? this[name] = newValue : this.setAttribute(name, newValue);
        }
        return PropertyEvent.CHANGE;
    }
};

/**
 * 为每一个元素设置属性值
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.property=function property(name,value)
{
    return access.call(this,'property',name,value);
};

/**
 * 设置一组属性
 * @param propsObject
 * @returns {Element}
 */
Element.prototype.properties=function properties( propsObject )
{
    if( propsObject && typeof propsObject === "object" )
    {
        Object.forEach(propsObject,function(value,name)
        {
            access.call(this,'property',name,value);
        },this);
        return this;
    }

    var elem = this.current();
    var props={};
    if (elem.hasAttributes()) 
    {
       var attrs = elem.attributes;
       for(var i=0;i<attrs.length;i++)
       {
         props[ attrs[i].name ] = attrs[i].value;
       }
    } 
    return props;
}

/**
 * 判断当前匹配元素是否有指定的属性名
 * @param prop
 * @returns {boolean}
 */
Element.prototype.hasProperty=function hasProperty(prop)
{
    var elem = this.current();
    if( !elem )return false;
    if( fix.attrtrue[prop] === true )
    {
        return typeof elem[prop] !== "undefined";
    }
    return typeof elem.hasAttribute === 'function' ? elem.hasAttribute( prop ) : typeof elem[prop] !== "undefined";
};

/**
 * 获取设置数据对象
 * @param name
 * @param value
 * @returns {*}
 */
Element.prototype.data=function data(name, value)
{
    var type =  typeof name;
    var write = typeof value !== "undefined";
    var data;
    return this.forEach(function(elem)
    {
        if( type === "object" )
        {
            storage(elem,'data',name);

        }else if( type === 'string' && write )
        {
            data = storage(elem,'data') || storage(elem,'data',{});
            data[ name ]=value;

        }else
        {
            data = storage(elem,'data');
            return type === 'string' && data ? data[name] : data || null;
        }
    });
};

var rgbregex = /\s*rgba\(\s*(\d+)\,\s*(\d+)\,\s*(\d+)/i;
var rgbToHex = function(value)
{
      var ret = value.match(rgbregex);
      if( ret )
      {
          return [
              '#',
              ("0" + Number(ret[1] >> 0).toString(16) ).slice(-2),
              ("0" + Number(ret[2] >> 0).toString(16) ).slice(-2),
              ("0" + Number(ret[3] >> 0).toString(16) ).slice(-2),
          ].join('');
      }
      return value;
};

/**
 * @private
 */
accessor['style']= {
    get:function(name){
        var getter = fix.cssHooks[name] && typeof fix.cssHooks[name].get === "function" ? fix.cssHooks[name].get : null;
        var style = this.currentStyle || this.style;
        if( name !=="cssText" ){
            style = getComputedStyle(this);
        }
        return getter ? getter.call(this, style, name) : style[name]||'';
    }
    ,set:function(name, value, obj ){
        var type = typeof value;
        if( type === "object" )
        {
            for( var b in value )
            {
                formatStyleValue(b, value[b], this , obj , true );
            }
        }else
        {
            //解析 cssText 样式名
            if( name === 'cssText' )
            {
                if( value == null )
                {
                    value = "";
                }else if( type === "string" )
                {
                    var _cssText = this.style.cssText;
                    value = (_cssText ? _cssText+";" : "")+formatStyleSheet(value, type, this, obj);
                }
            }
            formatStyleValue(name, value, this , obj , true );
        }
        return StyleEvent.CHANGE;
    }
};

/**
 * 设置所有匹配元素的样式
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.style=function style(name, value)
{
    return access.call(this,'style',name,value);
};

/**
 * 显示元素
 * @returns {Element}
 */
Element.prototype.show=function show()
{
    access.call(this,'style',"display",'',true,false);
    return this;
};

/**
 * 隐藏当前元素
 * @returns {Element}
 */
Element.prototype.hide=function hide()
{
    access.call(this,'style',"display",'none',true,true);
    return this;
};

/**
 * @private
 */
accessor['text']= {
    get:function(){  return typeof this.textContent === "string" ? this.textContent : this.innerText; }
    ,set:function(name,newValue){
        typeof this.textContent === "string" ? this.textContent=newValue : this.innerText=newValue;
        return PropertyEvent.CHANGE;
    }
};

/**
 * 获取设置当前元素的文本内容。
 * @returns {string|Element}
 */
Element.prototype.text=function text( value )
{
    return access.call(this,'text','text',value);
};

/**
 * @private
 */
accessor['value']= {
    get:function(){ return this.value || null }
    ,set:function(name,newValue){
        this.value=newValue ;
        return PropertyEvent.CHANGE;
    }
};

/**
 * 获取设置表单元素的值。此方法只会对表单元素有用。
 * @returns {string|Element}
 */
Element.prototype.value=function value( val )
{
    return access.call(this,'value','value',val);
};

/**
 * 判断是否有指定的类名
 * @param className
 * @returns {boolean}
 */
Element.prototype.hasClass=function hasClass( className )
{
    if( typeof className !=='string' )
    {
        throw new Error("className is not String");
    }
    var value=this.property("class");
    if( !value ) return false;
    return new RegExp('(\\s|^)' + className + '(\\s|$)').test(  System.trim(value) );
};

/**
 * 添加指定的类名
 * @param className
 * @returns {Element}
 */
Element.prototype.addClass=function addClass( className , replace )
{
    if( typeof className !== "string" )throw new Error('className is not String');
    className = System.trim( className );
    var exp = replace===true ? null : new RegExp('(\\s|^)' + className + '(\\s|$)');
    this.forEach(function(elem){
        if( !hasStyle(elem) )return;
        var old = System.trim( this.property("class") || '' );
        if (!( old && exp && exp.test(old) )) {
            var oldClass = [old];
            var newValue = className;
            if (replace !== true) {
                oldClass.push(className);
                newValue = oldClass.join(' ');
            }
            elem['className'] = newValue;
            if (this.hasEventListener(StyleEvent.CHANGE)) {
                var event = new StyleEvent(StyleEvent.CHANGE);
                event.property = 'class';
                event.newValue = newValue;
                event.oldValue = old;
                if (!this.dispatchEvent(event)) {
                    elem['className'] = old;
                }
            }
            try{elem.offsetWidth = elem.offsetWidth}catch(e){};
        }
    });
    return this;
};

/**
 * 移除指定的类名或者清除所有的类名。
 * @param className
 * @returns {Element}
 */
Element.prototype.removeClass=function removeClass( className )
{
    var all = !className || typeof className !== 'string';
    return this.forEach(function(elem){
        if(!hasStyle(elem))return;
        var old = elem['className']||'';
        var newValue = !all && old ? old.replace( new RegExp('(\\s|^)' + className + '(\\s|$)'), ' ') : '';
        this.addClass(newValue, true);
    });
};

/**
 * 获取设置元素宽度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.width=function width( value )
{
    if( value == null )
    {
        return parseFloat( fix.getsizeval.call(this.current(),'Width') );
    }
    access.call(this,'style','width',value);
    return this;
};

/**
 * 获取设置元素高度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.height=function height( value )
{
    if( value == null )
    {
        return parseFloat( fix.getsizeval.call(this.current(),'Height') );
    }
    access.call(this,'style','height',value);
    return this;
};

/**
 * 为当前选择的元素集应用动画效果
 * @param name  动画名
 * @param duration 持续时间
 * @param timing 运行函数名  linear ease ease-in ease-out ease-in-out cubic-bezier(n,n,n,n)
 * @param delay  延时
 * @param count 重复次数
 * @param direction 是否应该轮流反向播放动画
 * @param fillMode 属性规定动画在播放之前或之后，其动画效果是否可见  none | forwards | backwards | both
 */
Element.prototype.animation=function animation(name, duration, timing, delay, count, direction, fillMode)
{
    var cmd = name+" "+(duration || 3)+"s "+(timing ||"ease");
    if(delay>0)cmd+=" "+delay+"s";
    if(count>1)cmd+=" "+count;
    if(direction)cmd+=" alternate";
    if(!fillMode)fillMode = "both";
    cmd+=" "+fillMode;
    this.style("animation","unset");
    this.style("animation",cmd);
    return this;
}

/**
 * 淡入效果
 * @param duration
 * @param opacity
 */
Element.prototype.fadeIn=function(duration, opacity)
{
    var name = "fadeIn";
    if( opacity>0 && opacity < 1)
    {
        name = Element.createAnimationStyleSheet("fadeIn_0_"+opacity,{from:{"opacity":0},to:{"opacity":opacity}});
    }
    this.animation(name,duration,"linear");
    return this;
}

/**
 * 淡出效果
 * @param duration
 * @param opacity
 */
Element.prototype.fadeOut=function(duration, opacity)
{
    var name = "fadeOut";
    if( opacity>0 && opacity<1)
    {
        name = Element.createAnimationStyleSheet("fadeOut_"+opacity+"_0",{from:{"opacity":opacity},to:{"opacity":0}});
    }
    this.animation(name,duration,"linear");
    return this;
}

/**
 * @private
 */
accessor['scroll']={
    get:function(prop){
        var e = this.defaultView || this.parentWindow || this;
        var p= 'scroll'+prop;
        return parseInt( Element.isWindow( e ) ? e[ prop.toLowerCase()==='top'?'pageYOffset':'pageXOffset'] || e.document.documentElement[p] || e.document.body[p] : e[p] );
    },
    set:function(prop,newValue,obj)
    {
        var e = this.defaultView || this.parentWindow || this;
        var old = accessor.scroll.get.call(this, prop);
        if( newValue == old )return;
        if( obj.style('position')==='static' )obj.style('position','relative');
        if(typeof e.scrollTo === "function")
        {
            var param = [newValue,NaN];
            if( prop.toLowerCase()==='top' )param = param.reverse();
            e.scrollTo.apply(e, param );

        } else
        {
            e['scroll'+prop] = newValue;
        }
        if( this.hasEventListener.call( ScrollEvent.CHANGE ) )
        {
            var event = new ScrollEvent( ScrollEvent.CHANGE );
            event.property = prop.toLowerCase();
            event.newValue = newValue;
            event.oldValue = old;
            return event;
        }
    }
};

/**
 * 获取设置滚动条顶部的位置
 * @param value
 */
Element.prototype.scrollTop=function scrollTop(value)
{
    return access.call(this,'scroll','Top',value);
};

/**
 * 获取设置滚动条左部的位置
 * @param value
 */
Element.prototype.scrollLeft=function scrollLeft(value)
{
    return access.call(this,'scroll','Left',value);
};

/**
 * 获取滚动条的宽度
 * @param value
 */
Element.prototype.scrollWidth=function scrollWidth()
{
    return access.call(this,'scroll','Width');
};

/**
 * 获取滚动条的高度
 * @param value
 */
Element.prototype.scrollHeight=function scrollHeight()
{
    return access.call(this,'scroll','Height');
};

/**
 * 获取元素相对文档页面边界的矩形坐标。
 * 如果元素的 position = fixed 或者 force=== true 则相对浏览器窗口的位置
 * @param NodeElement elem
 * @param boolean force 是否为全局坐标
 * @returns {left,top,right,bottom,width,height}
 */
Element.prototype.getBoundingRect=function getBoundingRect( force )
{
    var value={ 'top': 0, 'left': 0 ,'right' : 0,'bottom':0,'width':0,'height':0};
    var elem= this.current();
    if( Element.isWindow(elem) )
    {
        value.left = elem.screenLeft || elem.screenX;
        value.top = elem.screenTop || elem.screenY;
        value.width = this.width();
        value.height = this.height();
        value.right = value.width + value.left;
        value.bottom = value.height + value.top;
        return value;
    }

    if( !Element.isNodeElement( elem ) )
        throw new Error('invalid elem. elem not is NodeElement');

    var doc =  elem.ownerDocument || elem, docElem=doc.documentElement;
    this.current( Element.getWindow( doc ) );
    var scrollTop = this.scrollTop();
    var scrollLeft = this.scrollLeft();
    this.current( elem );

    if( "getBoundingClientRect" in document.documentElement )
    {
        var box = elem.getBoundingClientRect();
        var clientTop = docElem.clientTop || doc.body.clientTop || 0,
            clientLeft = docElem.clientLeft || doc.body.clientLeft || 0;

        value.top = box.top + scrollTop - clientTop;
        value.left = box.left + scrollLeft - clientLeft;
        value.right = box.right + scrollLeft - clientLeft;
        value.bottom = box.bottom + scrollTop - clientTop;
        value.width = box.width || box.right-box.left;
        value.height = box.height || box.bottom-box.top;

    }else
    {
        value.width = this.width();
        value.height= this.height();
        do {
            value.top += elem.offsetTop;
            value.left += elem.offsetLeft;
            elem = elem.offsetParent;
        } while (elem);
        value.right = value.width+value.left;
        value.bottom = value.height+value.top;
    }

    //始终相对浏览器窗口的位置
    if( this.style('position') === 'fixed' || force===true )
    {
        value.top -= scrollTop;
        value.left -= scrollLeft;
        value.right -= scrollLeft;
        value.bottom -= scrollTop;
    }
    return value;
};

/**
 * @private
 */
var position_hash={'absolute':true,'relative':true,'fixed':true};
accessor['position']={
    get:function(prop,obj){
        return obj.getBoundingRect()[ prop ];
    },
    set:function(prop,newValue,obj){
        var val = accessor.style.get.call(this,'position');
        if( val && !position_hash[val] )
        {
            accessor.style.set.call(this,'position','relative');
        }
        return accessor.style.set.call(this,prop,newValue,obj);
    }
};

/**
 * 获取或者设置相对于父元素的左边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.left=function left( val )
{
    return access.call(this,'position','left',val)
};

/**
 * 获取或者设置相对于父元素的顶边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.top=function top(val )
{
    return access.call(this,'position','top',val)
};

/**
 * 获取或者设置相对于父元素的右边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.right=function right(val )
{
    return access.call(this,'position','right',val)
};

/**
 * 获取或者设置相对于父元素的底端位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.bottom=function bottom(val )
{
    return access.call(this,'position','bottom',val)
};

/**
 * @private
 */
function point(left, top, local )
{
    var old = storage(this,'forEachCurrentItem');
    var target = this.current();
    this.current( target.parentNode );
    var offset=this.getBoundingRect();
    this.current( old );
    left = left || 0;
    top = top || 0;
    return local===true ? {left:offset.left+left,top:offset.top+top} : {left:left-offset.left, top:top-offset.top};
}

/**
 *  将本地坐标点转成相对视图的全局点
 *  @param left
 *  @param top
 *  @returns {object} left top
 */
Element.prototype.localToGlobal=function localToGlobal(left, top)
{
    return point.call(this,left, top, true);
};

/**
 *  将视图的全局点转成相对本地坐标点
 *  @param left
 *  @param top
 *  @returns {object}  left top
 */
Element.prototype.globalToLocal=function globalToLocal(left, top )
{
    return point.call(this,left, top);
};

//============================================元素选择===================================

/**
 * 查找当前匹配的第一个元素下的指定选择器的元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.find=function find( selector )
{
    if( selector == null )
    {
        throw new TypeError("selector is null or is undefined");
    }
    var resutls = [];
    if( typeof selector === "function" )
    {
        resutls= Array.prototype.filter.call( this.slice(0), function(elem){
            this.current(elem);
            return selector.call(this,elem);
        },this);

    }else
    {
        this.forEach(function (elem) {
            if (elem === selector) {
                resutls = [elem];
                return elem;
            }
            resutls = [].concat.apply(resutls, querySelector(selector, elem));
        });
    }
    return makeElement( new Element() , resutls );
};

/**
 * 查找所有匹配元素的父级元素或者指定selector的父级元素（不包括祖辈元素）
 * @param selector
 * @returns {Element}
 */
Element.prototype.parent=function parent( selector )
{
    return makeElement( new Element() , recursion.call(this,"parentNode",selector) );
};

/**
 * 查找所有匹配元素的祖辈元素或者指定 selector 的祖辈元素。
 * 如果指定了 selector 则返回最近的祖辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.parents=function parents( selector )
{
    return makeElement( new Element() , recursion.call(this,"parentNode",selector,true,document.body) );
};

/**
 * 获取所有匹配元素向上的所有同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prevAll=function prevAll( selector )
{
    return makeElement( new Element() , recursion.call(this,"previousSibling",selector,true) );
};

/**
 * 获取所有匹配元素紧邻的上一个同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prev=function prev( selector )
{
    return makeElement( new Element() ,recursion.call(this,"previousSibling",selector) );
};

/**
 * 获取所有匹配元素向下的所有同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.nextAll=function nextAll( selector )
{
    return makeElement(new Element() ,recursion.call(this,"nextSibling",selector, true));
};

/**
 * 获取每一个匹配元素紧邻的下一个同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.next=function next(selector )
{
    return makeElement( new Element() ,recursion.call(this,"nextSibling",selector) );
};

/**
 * 获取每一个匹配元素的所有同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.siblings=function siblings( selector )
{
    var instance = makeElement( new Element(),recursion.call(this,"previousSibling",selector,true) );
    makeElement(instance,recursion.call(this,"nextSibling",selector,true),instance.length);
    return instance;
};

/**
 * 查找所有匹配元素的所有子级元素，不包括孙元素
 * @param selector 如果是 * 返回包括文本节点的所有元素。不指定返回所有HTMLElement元素。
 * @returns {Element}
 */
Element.prototype.children=function children( selector )
{
    var results=[];
    this.forEach(function(elem)
    {
        results = results.concat( getChildNodes( elem ) );
    });
    if( typeof selector === "function" )
    {
        results = Array.prototype.filter.call(results,selector);
    }else if( selector ) {
        results = querySelector(selector,null,null,results);
    }
    return makeElement( new Element(), results );
};

//========================操作元素===========================

/**
 * 获取或者设置 html
 * @param htmlObject
 * @returns {string | Element}
 */
Element.prototype.html=function html( htmlObject )
{
    var outer = htmlObject === true;
    var write= !outer && typeof htmlObject !== "undefined";
    if( !write && this.length < 1 ) return '';
    var is = false;
    if( write && htmlObject )
    {
        if( typeof htmlObject === "string" )
        {
            htmlObject = System.trim( htmlObject ).replace(/[\r\n\t]+/g,'');

        }else if( htmlObject instanceof Element )
        {
            htmlObject = htmlObject.current();
            is = true;
        }else if( Element.isNodeElement(htmlObject) )
        {
            is = true;
        }
    }
    return this.forEach(function(elem)
    {
        if( !write )
        {
            htmlObject=elem.innerHTML;
            if( outer )
            {
                if( typeof elem.outerHTML==='string' )
                {
                    htmlObject=elem.outerHTML;
                }else
                {
                    var cloneElem=cloneNode( elem, true);
                    if( cloneElem )
                    {
                        htmlObject=document.createElement( 'div' ).appendChild( cloneElem ).innerHTML;
                    }
                }
            }
            return htmlObject;
        }

        //清空所有的子节点
        while( elem.hasChildNodes() )
        {
            this.removeChild( elem.childNodes.item(0) );
        }

        //如果是一个节点对象
        if(is)
        {
            return this.addChild( htmlObject );
        }
        try
        {
            elem.innerHTML = htmlObject;
            if( System.env.platform(System.env.BROWSER_IE,8) )
            {
               switch ( Element.getNodeName(elem) ){
                   case "thead" :
                   case "tbody":
                   case "tfoot":
                   case "table":
                   case "tr":
                   case "th":
                   case "td":
                       this[ this.indexOf( elem ) ] = replaceHtmlElement(elem, htmlObject);
               }
            }

        } catch (e)
        {
            this[ this.indexOf( elem ) ] = replaceHtmlElement(elem, htmlObject);
        }
    });
};

/**
 * 替换一个html元素
 * @param elem
 * @param htmlObject
 * @return {Node}
 */
function replaceHtmlElement(elem, htmlObject )
{
    var nodename = Element.getNodeName(elem);
    if ( !( new RegExp("^<" + nodename,'i').exec(htmlObject) ) )
    {
        htmlObject ="<"+nodename+">"+htmlObject+"</"+nodename+">";
    }

    var child = createElement(htmlObject,false,true);

    //thead,tbody,tfoot,tr,th,td
    if( Element.getNodeName(child.childNodes[0]) === nodename )
    {
        child = child.childNodes[0];
        child.parentNode.removeChild( child );
    }

    mergeAttributes(child, elem);
    var parent = elem.parentNode;
    if( !parent ){
        parent = document.createElement("div");
        parent.appendChild( elem );
        parent.replaceChild(child, elem);
        parent.removeChild(child);
    }else {
        parent.replaceChild(child, elem);
    }
    return child;
}

/**
 * 添加子级元素（所有已匹配的元素）
 * @param childElemnet
 * @returns {Element}
 */
Element.prototype.addChild=function addChild(childElemnet)
{
    return this.addChildAt(childElemnet,-1);
};

/**
 * 在指定位置加子级元素（所有已匹配的元素）。
 * 如果 childElemnet 是一个已存在的元素，那么会先删除后再添加到当前匹配的元素中后返回，后续匹配的元素不会再添加此元素。
 * @param childElemnet 要添加的子级元素
 * @param index | refChild | fn(node,index,parent)  要添加到的索引位置
 * @returns {Element}
 */
Element.prototype.addChildAt=function addChildAt( childElemnet, index )
{
     if( System.isNaN(index) )throw new Error('Invalid param the index in addChildAt');
     if( System.instanceOf(childElemnet,Element) )
     {
         childElemnet.forEach(function(child,at) {
             this.addChildAt(child, !isNaN(at) ? at+index : index );
         },this);
         return childElemnet;
     }
     if( !Element.isNodeElement( childElemnet ) )
     {
         throw new TypeError('is not Element in addChildAt');
     }
     var parent = this.current();
     if( !Element.isHTMLElement( parent ) )
     {
        throw new Error('parent is null of child elemnet in addChildAt');
     }

    var refChild=index===-1 ? null : this.getChildAt(index);
    if( childElemnet.parentNode )this.removeChild( childElemnet );
    parent.insertBefore( childElemnet , refChild || null );
    if( Element.getNodeName(childElemnet)==="#document-fragment" )
    {
        childElemnet['parent-element'] = parent;
    }
    dispatchEvent( new EventDispatcher( childElemnet ) ,ElementEvent.ADD, parent, childElemnet );
    dispatchEvent( new EventDispatcher( parent ) , ElementEvent.CHANGE, parent, childElemnet );
    if( this.isNodeInDocumentChain() ){
        dispatchAddToDocumentEvent(parent,childElemnet );
    }
    return childElemnet;
};

/**
 * 触发元素已经添加到文档中事件
 * @param parent
 * @param child
 */
function dispatchAddToDocumentEvent( parent, child )
{
    dispatchEvent( new EventDispatcher( child ) , ElementEvent.ADD_TO_DOCUMENT, parent, child);
    if( child.hasChildNodes() && child.childNodes.length > 0 )
    {
        for(var i=0; i<child.childNodes.length;i++)
        {
            dispatchAddToDocumentEvent( child, child.childNodes.item(i) )
        }
    }
}

/**
 * 返回指定索引位置的子级元素( 匹配选择器的第一个元素 )
 * 此方法只会计算节点类型为1的元素。
 * @param index | refChild | fn(node,index,parent)
 * @returns {Node|null}
 */
Element.prototype.getChildAt=function getChildAt( index )
{
    if( typeof index !== 'number' )throw new TypeError("index is not Number");
    var elem = this.current();
    if( !elem || !elem.hasChildNodes() )return null;
    var childNodes = getChildNodes(elem);
    index=index < 0 ? index+childNodes.length : index;
    return index >= 0 && index < childNodes.length ? childNodes[index] : null;
};

/**
 * 返回子级元素相对于父元素的索引位置( 匹配选择器的第一个元素 )
 * @param childElemnet | selector
 * @returns {Number}
 */
Element.prototype.getChildIndex=function getChildIndex( childElemnet )
{
    if( childElemnet instanceof Element )
    {
        childElemnet = childElemnet.current();
    }
    if( !Element.isNodeElement(childElemnet)  )
    {
        throw new TypeError('is not HTMLElement in getChildIndex');
    }
    var parent = childElemnet.parentNode;
    if( !parent || !parent.hasChildNodes() )return -1;
    var childNodes = getChildNodes(parent);
    return Array.prototype.indexOf.call( childNodes, childElemnet);
};

/**
 * 移除指定的子级元素
 * @param childElemnet|selector
 * @returns {Element}
 */
Element.prototype.removeChild=function removeChild( childElemnet )
{
    if( System.instanceOf(childElemnet,Element) )
    {
        childElemnet = childElemnet.current();
    }
    if( !Element.isNodeElement(childElemnet) )
    {
        throw new TypeError('is not HTMLElement in removeChild');
    }
    var parent = childElemnet.parentNode;
    var nodeChild;
    if( !parent )
    {
        if( Element.getNodeName(childElemnet)==="#document-fragment" )
        {
            parent = childElemnet['parent-element'];
            if( parent )
            {
                while ( parent.childNodes.length > 0 )
                {
                   nodeChild = this.removeChild( parent.childNodes[0] );
                   nodeChild = null;
                }
                return childElemnet;
            }
        }
    }else
    {
        nodeChild=parent.removeChild(childElemnet);
        dispatchEveryRemoveEvent(parent, childElemnet);
        dispatchEvent( new EventDispatcher( parent ) , ElementEvent.CHANGE, parent, childElemnet );
        nodeChild = null;
    }
    return childElemnet;
};

/**
 * 触发每一个元素的删除事件
 * @param parent
 * @param child
 */
function dispatchEveryRemoveEvent( parent, child )
{
    dispatchEvent( new EventDispatcher( child ) , ElementEvent.REMOVE, parent, child);
    if(child.hasChildNodes() && child.childNodes.length > 0 )
    {
        for(var i=0; i<child.childNodes.length;i++)
        {
            dispatchEveryRemoveEvent( child, child.childNodes.item(i) )
        }
    }
}

/**
 * 移除子级元素
 * @param childElemnet|index|fn  允许是一个节点元素或者是相对于节点列表中的索引位置（不包括文本节点）。
 *        也可以是一个回调函数过滤要删除的子节点元素。
 * @returns {Element}
 */
Element.prototype.removeChildAt=function removeChildAt( index )
{
    var child= this.getChildAt( index );
    if( !child )
    {
        throw new Error('Not found child. in removeChildAt');
    }
    return this.removeChild( child );
};

/**
 * 判断是否这空的集合
 * @returns {boolean}
 */
Element.prototype.isEmpty=function isEmpty()
{
    return !(this.length > 0);
}

/**
 * 判断当前元素节点是否在文档链中
 * @returns {boolean}
 */
Element.prototype.isNodeInDocumentChain=function isNodeInDocumentChain()
{
    var node = this.current();
    return node && Element.contains(document.documentElement, node);
}

/**
 * 测试指定的元素（或者是一个选择器）是否为当前元素的子级
 * @param parent
 * @param child
 * @returns {boolean}
 */
Element.contains=function contains(parent,child)
{
    if( !parent || !child )return false;
    if( parent instanceof Element )parent = parent.current();
    if( child instanceof Element )child = child.current();
    if( Element.isWindow(parent) )
    {
        parent = document.documentElement;
    }
    if( Element.isNodeElement(child) && Element.isNodeElement(parent) )
    {
        if('contains' in parent){
            return parent.contains( child ) && parent !== child;
        }
        if( parent.compareDocumentPosition )
        {
            return !!(parent.compareDocumentPosition(child) & 16) && parent !== child;
        }
    }
    return querySelector( child, parent ).length > 0;
};

/**
 * 判断两个元素是否一致
 * 如果指定的是一个元素对象（Element）， 那么会检查每一个元素都相等，只有所有的元素集都一致才会返回 true 反之 false。
 * 如果指定的参数为同一个对象也会返回true。
 * 此方法主要是比较集合元素，并非是元素对象(Element)
 * @param a
 * @param b
 */
Element.equal=function equal( a, b )
{
    if( a === b )return true;
    if( !a || !b )return false;
    var a1 = a instanceof Element ? a.slice(0) : [a];
    var b1 = b instanceof Element ? b.slice(0) : [b];
    if( a1.length != b1.length )return false;
    var i=0;
    var items = a1.concat(b1);
    var len   = items.length;
    for(;i<len;i++)
    {
        if( Element.isNodeElement( items[i] ) )
        {
            if( a1.indexOf(items[i]) < 0 || b1.indexOf(items[i]) < 0 )
            {
                return false;
            }
        }
    }
    return true;
}

/**
 * @private
 * @type {boolean}
 */
var ishtmlobject = typeof HTMLElement==='object';

/**
 * 判断是否为一个HtmlElement类型元素,document 不属性于 HtmlElement
 * @returns {boolean}
 */
Element.isHTMLElement=function isHTMLElement( elem )
{
    if( !elem )return false;
    return ishtmlobject ? elem instanceof HTMLElement : ( (elem.nodeType === 1 || elem.nodeType === 11) && typeof elem.nodeName === "string" );
};


/**
 * 判断是否为一个表单元素
 * @returns {boolean}
 */
Element.isForm=function isForm(elem, exclude)
{
    if( elem )
    {
        var nodename = Element.getNodeName(elem);
        switch ( nodename )
        {
            case 'select'   :
            case 'input'    :
            case 'textarea' :
            case 'button'   :
                return exclude && typeof exclude === 'string' ? exclude.toLowerCase() !== nodename : true;
        }
    }
    return false;
};

/**
 * 判断是否为一个节点类型元素
 * document window 不属于节点类型元素
 * @returns {boolean}
 */
var hasNode= typeof Node !== "undefined";
Element.isNodeElement=function isNodeElement( elem )
{
    if( !elem || typeof elem !== "object" ) return false;
    return hasNode ? elem instanceof Node : elem.nodeType && (typeof elem.nodeName === "string" || typeof elem.tagName === "string" || elem.nodeName==="#document-fragment");
};


/**
 * 判断是否为一个html容器元素。
 * HTMLElement和document属于Html容器
 * @param element
 * @returns {boolean|*|boolean}
 */
Element.isHTMLContainer=function isHTMLContainer( elem )
{
    return elem && ( Element.isHTMLElement(elem) || Element.isDocument(elem) );
};

/**
 * 判断是否为一个事件元素
 * @param element
 * @returns {boolean}
 */
Element.isEventElement=function isEventElement( elem )
{
    return elem && ( typeof elem.addEventListener === "function" || typeof elem.attachEvent=== "function" || typeof elem.onreadystatechange !== "undefined" );
};

/**
 * 判断是否为窗口对象
 * @param obj
 * @returns {boolean}
 */
Element.isWindow=function isWindow( elem )
{
    return elem && elem == Element.getWindow(elem);
};

/**
 * 决断是否为文档对象
 * @returns {*|boolean}
 */
Element.isDocument=function isDocument( elem )
{
    return elem && elem.nodeType===9;
};

/**
 * 判断是否为一个框架元素
 * @returns {boolean}
 */
Element.isFrame=function isFrame( elem )
{
    var nodename = Element.getNodeName(elem);
    return (nodename === 'iframe' || nodename === 'frame');
};


/**
 * 获取元素所在的窗口对象
 * @param elem
 * @returns {window|null}
 */
Element.getWindow=function getWindow( elem )
{
    if( elem && typeof elem === "object" )
    {
        elem = elem.ownerDocument || elem;
        return elem.window || elem.defaultView || elem.contentWindow || elem.parentWindow || window || null;
    }
    return null;
};

/**
 * 以小写的形式返回元素的节点名
 * @returns {string}
 */
Element.getNodeName = function getNodeName( elem )
{
    return elem && elem.nodeName && typeof elem.nodeName=== "string" ? elem.nodeName.toLowerCase() : '';
};


// fix style name add prefix
if( System.env.platform( System.env.BROWSER_FIREFOX ) && System.env.version(4) )
{
    fix.cssPrefixName='-moz-';
}else if( System.env.platform( System.env.BROWSER_SAFARI )  || System.env.platform( System.env.BROWSER_CHROME ) )
{
    fix.cssPrefixName='-webkit-';
}else if( System.env.platform(System.env.BROWSER_OPERA) )
{
    fix.cssPrefixName='-o-';
}else if( System.env.platform(System.env.BROWSER_IE) && System.env.version(9,'>=') )
{
    fix.cssPrefixName='-ms-';
}

if( fix.cssPrefixName==="-webkit-" && typeof Event !== "undefined" )
{
    Event.fix.cssprefix="webkit";
}

//set hooks for userSelect style
fix.cssHooks.userSelect={
    get: function( style )
    {
        return style[ getStyleName('userSelect') ] || '';
    },
    set: function( style, value )
    {
        style[ getStyleName('userSelect') ] = value;
        style['-moz-user-fetch'] = value;
        style['-webkit-touch-callout'] = value;
        style['-khtml-user-fetch'] = value;
        return true;
    }
};

//set hooks for radialGradient and linearGradient style
fix.cssHooks.radialGradient=fix.cssHooks.linearGradient={

    get: function( style, name )
    {
        return storage(this, name ) || '';
    },
    set: function( style, value, name )
    {
        value = System.trim(value);
        storage(this, name , value);
        if( ( System.env.platform(System.env.BROWSER_SAFARI) && System.env.version(5.1,'<') )  ||
            ( System.env.platform(System.env.BROWSER_CHROME) && System.env.version(10,'<') ) )
        {
            var position='';
            var deg= 0;
            if(name==='radialGradient')
            {
                position=value.match(/([^\#]*)/);
                if( position ){
                    position = position[1].replace(/\,\s*$/,'');
                    value=value.replace(/([^\#]*)/,'')
                }
                value = value.split(',');
            }else
            {
                var deg = value.match(/^(\d+)deg/);
                value = value.split(',');
                if( deg )
                {
                    deg = deg[1];
                    value.splice(0,1);
                }
                deg=System.parseFloat(deg) || 0;
            }
            var color = [];
            for(var i=0; i<value.length; i++)
            {
                var item = System.trim(value[i]).split(/\s+/,2);
                if( i===0 )color.push("from("+item[0]+")");
                if( !(i===0 || i===value.length-1 ) || typeof item[1] !== "undefined"  )
                {
                    var num = (item[1]>>0) / 100;
                    color.push( "color-stop("+num+","+item[0]+")" );
                }
                if( i===value.length-1 )
                    color.push("to("+item[0]+")");
            }

            var width= fix.getsizeval.call(this,'Width');
            var height= fix.getsizeval.call(this,'Height');
            if(name==='radialGradient')
            {
                position = position.split(/\,/,2);
                var point = System.trim(position[0]).split(/\s+/,2);
                if(point.length===1)point.push('50%');
                var point = point.join(' ');
                position=point+',0, '+point+', '+width/2;
                value=System.sprintf("%s,%s,%s",'radial',position,color.join(',') );

            }else{

                var x1=Math.cos(  deg*(Math.PI/180) );
                var y1=Math.sin(  deg*(Math.PI/180) );
                value=System.sprintf("%s,0% 0%,%s %s,%s",'linear',Math.round(x1*width),Math.round(y1*height),color.join(',') );
            }
            name='gradient';

        }else if( !value.match(/^(left|top|right|bottom|\d+)/) && name==='linearGradient' )
        {
            value= '0deg,'+value;

        }else if( name==='linearGradient' )
        {
            value= value.replace(/^(\d+)(deg)?/,'$1deg')
        }

        var prop = 'background-image';
        if( System.env.platform(System.env.BROWSER_IE,9) )
        {
            value=value.split(',');
            var deg = value.splice(0,1).toString();
            deg = parseFloat( deg ) || 0;
            var color=[];
            for(var i=0; i<value.length; i++)
            {
                var item = System.trim(value[i]).split(/\s+/,2);
                color.push( i%1===1 ? "startColorstr='"+item[0]+"'" :  "endColorstr='"+item[0]+"'" );
            }
            var type = deg % 90===0 ? '1' : '0';
            var linear = name==='linearGradient' ? '1' : '2';
            value = 'alpha(opacity=100 style='+linear+' startx=0,starty=5,finishx=90,finishy=60);';
            value= style.filter || '';
            value += System.sprintf(";progid:DXImageTransform.Microsoft.gradient(%s, GradientType=%s);",color.join(','), type );
            value += "progid:DXImageTransform.Microsoft.gradient(enabled = false);";
            prop='filter';

        }else
        {
            value= System.sprintf('%s(%s)', getStyleName( name ) , value ) ;
        }
        style[ prop ] = value ;
        return true;
    }
};

//@internal Element.fix;
Element.fix = fix;
Element.createElement = createElement;
Element.querySelector=querySelector;

/**
 * @private
 */
var animationSupport=null;

/**
 * 判断是否支持css3动画
 * @returns {boolean}
 */
Element.isAnimationSupport = function isAnimationSupport()
{
    if( animationSupport === null )
    {
        var prefix = fix.cssPrefixName;
        var div = Element.createElement('div');
        var prop = prefix+'animation-play-state';
        div.style[prop] = 'paused';
        animationSupport = div.style[prop] === 'paused';
    }
    return animationSupport;
};

var createdAnimationHash = {};

/**
 * 生成css3样式动画
 * properties={
*    '0%':'left:10px;',
*    '100%':'left:100px;'
* }
 */
Element.createAnimationStyleSheet=function(stylename, properties)
{
    if( !Element.isAnimationSupport() )return false;
    stylename = stylename.replace(".","_");
    var css=["{"];
    if( createdAnimationHash[stylename] ===true )
    {
        return stylename;
    }
    createdAnimationHash[stylename] = true;
    for( var i in properties )
    {
        css.push( i + ' {');
        if( System.isObject(properties[i]) )
        {
            css.push( System.serialize( properties[i], 'style' ) );
        }else
        {
            css.push( properties[i] );
        }
        css.push( '}' );
    }
    css.push('}');

    if( Element.addStyleSheet( '@'+fix.cssPrefixName+'keyframes '+stylename, css.join("\r\n") ) )
    {
        return stylename;
    }
    return null;
};

/**
 * @private
 */
var headStyle =null;

/**
 * @param string style
 */
Element.addStyleSheet=function addStyleSheet(styleName, StyleSheetObject)
{
    if( headStyle=== null )
    {
        var head = document.getElementsByTagName('head')[0];
        headStyle = document.createElement('style');
        head.appendChild( headStyle );
    }

    if( System.isObject(StyleSheetObject) )
    {
        StyleSheetObject= formatStyleSheet(StyleSheetObject,'object');
    }else {
        StyleSheetObject = formatStyleSheet( System.trim(StyleSheetObject) ,'string');
    }

    if( System.env.platform( System.env.BROWSER_IE, 8 ) )
    {
        var styleName = styleName.split(',');
        var styleSheet = headStyle.styleSheet;
        StyleSheetObject = StyleSheetObject.replace(/^\{/,'').replace(/\}$/,'');
        try {
            for (var i = 0; i < styleName.length; i++) {
                if (styleSheet.insertRule) {
                    styleSheet.insertRule(styleName + '{' + StyleSheetObject + '}', styleSheet.cssRules.length);
                }
                else {
                    styleSheet.addRule(styleName[i], StyleSheetObject, -1);
                }
            }
        }catch (e){}

    }else
    {
        if (StyleSheetObject.charAt(0) !== '{')
        {
            StyleSheetObject = '{' + StyleSheetObject + '}';
        }
        headStyle.appendChild( document.createTextNode(styleName + StyleSheetObject ) );
    }
    return true;
};

System.Element = Element;