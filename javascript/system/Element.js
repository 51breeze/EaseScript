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
    ,getsizeval:function( prop )
    {
        if ( Element.isWindow(this) )
        {
            return Math.max(
                this['inner'+prop] || 0,
                this['offset'+prop] || 0,
                this['client'+prop] || 0,
                this.document.documentElement['client'+prop] || 0
            );

        } else if ( Element.isDocument.call(this) )
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
        return this['offset'+prop] || 0;
    }
};

/**
 * @private
 */
var accessor={};
var storage=Internal.createSymbolStorage( Symbol('element') );

/**
 * @private
 */
function access(callback, name, newValue)
{
    var write= typeof newValue !== 'undefined';
    if( !write && this.length < 1 )return null;
    var getter = accessor[callback].get;
    var setter = accessor[callback].set;
    if( fix.fnHooks[callback] )
    {
        getter = typeof fix.fnHooks[callback].get === "function" ? fix.fnHooks[callback].get : getter ;
        setter = typeof fix.fnHooks[callback].set === "function" ? fix.fnHooks[callback].set : setter ;
    }
    if( !write )return getter.call( Element.prototype.current.call(this),name,this);
    return Element.prototype.forEach.call(this,function(elem)
    {
        var oldValue= getter.call(elem,name,this);
        if( oldValue !== newValue )
        {
            var event = setter.call(elem,name,newValue,this);
            if( typeof event === "string" )
            {
                event = event===StyleEvent.CHANGE ?  new StyleEvent( StyleEvent.CHANGE ) :  new PropertyEvent( PropertyEvent.CHANGE );
                event.property = name;
            }
            if( event instanceof PropertyEvent )
            {
                event.property = event.property || name;
                event.newValue = event.newValue || newValue;
                event.oldValue = event.oldValue || oldValue;
                EventDispatcher.prototype.dispatchEvent.call(this, event);
            }
        }

    });
}

/**
 * @private
 */
function $getChildNodes(elem, selector, flag)
{
    var ret=[],isfn=System.isFunction(selector);
    if( elem.hasChildNodes() )
    {
        var len=elem.childNodes.length,index= 0,node;
        while( index < len )
        {
            node=elem.childNodes.item(index);
            if( ( isfn && selector.call(this,node,index) ) || ( !isfn && (selector==='*' || node) ) )
            {
                if( Element.getNodeName(node)!=="#text")
                {
                    ret.push(node);
                }
            }
            if( flag===true && ret.length >0 )break;
            ++index;
        }
    }
    return ret;
}
/**
 * @private
 */
function $dispatchEvent(thisArg, type, parent, child, result )
{
    var event=new ElementEvent( type );
    event.parent=parent;
    event.child=child;
    event.result=!!result;
    return EventDispatcher.prototype.dispatchEvent.call(thisArg, event );
}

/**
 *  @private
 */
function $doMake( elems )
{
    var r = storage(this,'reverts');
    r.push( Array.prototype.splice.apply(this, [0,this.length].concat(elems) ) );
    Element.prototype.current.call(this,null);
    return this;
}

/**
 *  @private
 */
function $doRecursion(propName, strainer, deep )
{
    var currentItem,ret=[];
    var s = typeof strainer === "string" ? function(){return querySelector(strainer, null , null, [this]).length > 0 } :
        typeof strainer === "undefined" ? function(){return this.nodeType===1} : strainer ;
    Element.prototype.forEach.call(this,function(elem)
    {
        if( elem && elem.nodeType )
        {
            currentItem=elem;
            do{
                currentItem = currentItem[propName];
                if( currentItem && s.call(currentItem) )
                {
                    ret = ret.concat( currentItem );
                    if( !deep )return false;
                }
            } while ( currentItem )
        }
    });
    return ret;
}

/**
 * 统一规范的样式名
 * @param name
 * @returns {string}
 */
function $getStyleName(name )
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
        //如果选择器不是一个字符串
        if (typeof selector !== "string")
        {
            results = Element.isNodeElement(selector) || Element.isWindow(selector) ? [selector] : [];
        }else
        {
            var has = false;
            //设置上下文
            if (context && typeof context.nodeName === "string" && context.nodeType === 1) {
                var id = context.getAttribute('id');
                if (!id || id == '') {
                    has = true;
                    id = 'sq_' + Math.ceil( Math.random() * 1000000);
                    context.setAttribute('id', id);
                }
                selector = '#' + id + ' ' + selector;
            } else if (typeof context === "string") {
                selector = context + ' ' + selector;
            }
            var tem=[];
            results = document.querySelectorAll(selector);
            if( results.length > 0 )for(var i=0; i< results.length ; i++)tem[i]=results[i];
            results = tem;
            if(has)context.removeAttribute('id');
        }
    }
    if( seed && System.isArray(seed) )
    {
        var i=0;
        var ret=[];
        while( i<seed.length )if( Array.prototype.indexOf.call(results, seed[i]) >=0 )
        {
            ret.push( seed[i] );
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
function $createElement(html , flag )
{
    if(System.isString(html) )
    {
        html=System.trim( html ).replace(/[\r\n]+/g,'');
        if( html )
        {
            if( flag ===true && html.charAt(0) !== "<" )
            {
                return document.createTextNode( html );
            }

            var match;
            if ( html.charAt(0) !== "<" && html.charAt(html.length - 1) !== ">" && html.length >= 1)
            {
                try {
                    return document.createElement(html);
                } catch (e) {
                }

            } else if (html.charAt(0) === "<" && ( match = singleTagRegex.exec(html) ))
            {
                var elem = document.createElement(match[1]);
                var attr = $matchAttr(html);
                var isset = typeof elem.setAttribute === "function";
                for (var prop in attr) {
                    if (isset) {
                        elem.setAttribute(prop, attr[prop]);
                    } else {
                        var attrNode = document.createAttribute(prop);
                        attrNode.nodeValue = attr[prop];
                        elem.setAttributeNode(attrNode)
                    }
                }
                return elem;
            }

            var div = document.createElement("div");
            var result = html.match(/^\<(tr|th|td|tbody|thead|tfoot)/);
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
                for (var i = 0; i < level; i++)div = div.childNodes.item(0);
                if( !div )
                {
                    throw new Error('Invalid html');
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
        return  html.parentNode ?$cloneNode(html,true) : html;
    throw new Error('createElement param invalid')
}
var getAttrExp = /(\w+)(\s*=\s*([\"\'])([^\3]*?)[^\\]\3)?/g;
var lrQuoteExp = /^[\'\"]|[\'\"]$/g;

/**
 * 匹配字符串中的属性
 * @param strAttr
 * @return {}
 */
function $matchAttr(strAttr)
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
 * 合并元素属性。
 * 将 refTarget 对象的属性合并到 target 元素
 * @param target 目标对象
 * @param oSource 引用对象
 * @returns {*}
 */
function $mergeAttributes(target, oSource)
{
    var iselem=Element.isNodeElement( target );
    if( System.isObject(oSource,true) )
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
 * 判断元素是否有Style
 * @returns {boolean}
 */
function $hasStyle(elem )
{
    return !( !elem || !elem.nodeType || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style );
}
/**
 * 克隆节点元素
 * @param nodeElement
 * @returns {Node}
 */
function $cloneNode(nodeElement , deep )
{
    if( nodeElement.cloneNode )
    {
        return nodeElement.cloneNode( !!deep );
    }
    //nodeElement.nodeName
    if( typeof nodeElement.nodeName==='string' )
    {
        var node = document.createElement( nodeElement.nodeName  );
        if( node )$mergeAttributes(node,nodeElement);
        return node;
    }
    return null;
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
    if( !System.instanceOf(this,Element) )
    {
        return new Element( selector, context );
    }

    if( context )
    {
        context=System.instanceOf(context,Element) ? context[0] : context;
    }

    storage(this,true,{
        'context':context,
        'forEachCurrentItem':null,
        'forEachCurrentIndex':NaN,
        'reverts':[]
    });

    var result=[];
    if( selector )
    {
        if (System.isArray(selector))
        {
            result = Array.prototype.filter.call(selector, function (elem) {
                return Element.isNodeElement(elem) || Element.isWindow(elem);
            });

        } else if ( System.instanceOf(selector,Element) )
        {
            result = Element.prototype.slice.call( selector, 0);

        } else if (typeof selector === "string")
        {
            result = selector.charAt(0) === '<' && selector.charAt(selector.length - 1) === '>' ? $createElement(selector) : querySelector(selector, context);
        } else if ( Element.isNodeElement(selector) || Element.isWindow(selector) )
        {
            result = selector;
        }
    }
    Object.defineProperty(this,"length", {value:0,writable:true});
    Array.prototype.splice.apply(this,[0,0].concat(result) );
    EventDispatcher.call(this);
}

Element.prototype= Object.create( EventDispatcher.prototype );
Object.defineProperty(Element,"querySelector", {value:querySelector});
Object.defineProperty(Element.prototype,"constructor", {value:Element});

Element.prototype.slice  = Array.prototype.slice;
Element.prototype.splice = Array.prototype.splice;
Element.prototype.concat = Array.prototype.concat;
Element.prototype.indexOf= Array.prototype.indexOf;

/**
 * 遍历元素
 * @param function callback
 * @param object refObject
 * @returns {*}
 */
Element.prototype.forEach=function forEach(callback , refObject )
{
    var result;
    refObject=refObject || this;
    var current = storage(this,'forEachCurrentItem');
    if( current  )
    {
        result=callback.call( refObject ,current, storage(this,'forEachCurrentIndex') );
    }else
    {
        var items=Element.prototype.slice.call(this,0),
            index = 0,
            len=items.length;
        for( ; index < len ; index++ )
        {
            current = items[ index ];
            storage(this,'forEachCurrentItem',current);
            storage(this,'forEachCurrentIndex',index);
            result=callback.call( refObject ,current,index);
            if( result !== undefined )
                break;
        }
        storage(this,'forEachCurrentItem',null);
        storage(this,'forEachCurrentIndex',NaN);
    }
    return typeof result === 'undefined' ? this : result;
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
    if( elem == null )return storage(this,'forEachCurrentItem') || this[0];
    if( typeof elem=== "string" )
    {
        elem=querySelector(elem, this.context || document );
        elem = elem && elem.length > 0 ? elem[0] : null;
        storage(this,'forEachCurrentItem',elem);
        storage(this,'forEachCurrentIndex',NaN);
    }else if( Element.isNodeElement(elem) || Element.isWindow(elem) )
    {
        storage(this,'forEachCurrentItem',elem);
        storage(this,'forEachCurrentIndex',NaN);
    }else
    {
        storage(this,'forEachCurrentItem',null);
        storage(this,'forEachCurrentIndex',NaN);
    }
    return this;
};

/**
 * @private
 */
accessor['property']={
    get:function(name){
        return ( fix.attrtrue[name] || typeof this.getAttribute !== "function"  ? this[name] : this.getAttribute(name) ) || null; }
    ,set:function(name,newValue){
        newValue === null ?
            ( fix.attrtrue[name] || typeof this.removeAttribute !== "function"  ? delete this[name] : this.removeAttribute(name) ) :
            ( fix.attrtrue[name] || typeof this.setAttribute !== "function"  ? this[name] = newValue : this.setAttribute(name, newValue) );
        return PropertyEvent.CHANGE;
    }
};

/**
 * 为每一个元素设置属性值
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.property=function property(name, value )
{
    if( name+"" === "[object Object]")
    {
        for(var i in name )
        {
            Element.prototype.property.call(this,i, name[i]);
        }
        return this;
    }

    name =  fix.attrMap[name] || name;
    var lower=name.toLowerCase();
    if( lower==='innerhtml' || lower==='html' )
    {
        return Element.prototype.html.call(this,value);

    }else if( lower==='value' || lower==='text' )
    {
        return Element.prototype[lower].call(this,value);

    }else if( lower === 'classname' && typeof value === "string" )
    {
        Element.prototype.addClass.call(this,value);

    }else if( lower === 'style' )
    {
        throw new Error( 'the style property names only use style method to operate in property' );
    }
    return access.call(this,'property',name,value);
};

/**
 * 判断当前匹配元素是否有指定的属性名
 * @param prop
 * @returns {boolean}
 */
Element.prototype.hasProperty=function hasProperty(prop)
{
    var elem = Element.prototype.current.call(this);
    if( !elem )return false;
    if( fix.attrtrue[prop] === true )
    {
        return typeof elem[prop] !== "undefined";
    }
    return typeof elem.hasAttribute === 'function' ? elem.hasAttribute( prop ) : typeof elem[prop] !== "undefined";
};

/**
 * 获取设置数据对象,支持带'.'操作
 * @param name
 * @param value
 * @returns {*}
 */
Element.prototype.data=function data(name, value )
{
    var type =  typeof name;
    var write = typeof value !== "undefined";
    var data;
    return Element.prototype.forEach.call(this,function(target)
    {
        if( type === "object" )
        {
            storage(target,'data',name);

        }else if( type === 'string' && write )
        {
            data = storage(target,'data') || storage(target,'data',{});
            data[ name ]=value;
        }else
        {
            data = storage(target,'data');
            return type === 'string' && data ? data[name] : data || null;
        }
    });
};

var rgbregex = /\s*rgba\(\s*(\d+)\,\s*(\d+)\,\s*(\d+)/i;
var rgbToHex = function (value)
{
      var ret = value.match(rgbregex);
      if( ret )
      {
          return [
              '#',
              ("0" + System.Number(ret[1] >> 0).toString(16) ).slice(-2),
              ("0" + System.Number(ret[2] >> 0).toString(16) ).slice(-2),
              ("0" + System.Number(ret[3] >> 0).toString(16) ).slice(-2),
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
        var currentStyle = $hasStyle(this) ? (document.defaultView && document.defaultView.getComputedStyle ?
            document.defaultView.getComputedStyle(this, null) : this.currentStyle || this.style) : {};
        return getter ? getter.call(this, currentStyle, name) : currentStyle[name];
    }
    ,set:function(name,value, obj ){
        var type = typeof value;
        if( type === "string" ){
            value = System.trim(value);
            type = /^\d+$/.test( value ) ? 'number' : type;
        }
        if( !this || !this.style || ( type === "number" && System.isNaN( value ) ) )return;
        var increment = type === "string" ? /^([\-+])=([\-+.\de]+)/.exec( value ) : null;

        //增量值
        if (increment) {
            var inc =accessor.style.get.call(this,name);
            inc = System.parseFloat(inc) || 0;
            value = ( +( increment[1] + 1 ) * +increment[2] ) + inc;
            type = "number";
        }else if(type==='string' && !fix.cssPrefixName && value.substr(0,5) === "rgba(" )
        {
            value = rgbToHex( value );
        }

        //添加单位
        if (type === "number" && !fix.cssNumber[name])
            value += "px";

        //解析 cssText 样式名
        if (name === 'cssText')
        {
            var elem = this;
            value = value.replace(/([\w\-]+)\s*\:([^\;]*)/g, function (all, name, value) {
                if( !fix.cssPrefixName && value.substr(0,5) === "rgba(" )
                {
                    value = rgbToHex( value );
                }
                if (fix.cssHooks[name] && typeof fix.cssHooks[name].set === "function") {
                    var obj = {};
                    fix.cssHooks[name].set.call(elem, obj, value);
                    return System.serialize(obj, 'style');
                }
                return $getStyleName(name) + ':' + value;
            });
        }

        try {
            var orgname = $getStyleName(name);
            if ( !fix.cssHooks[name] || typeof fix.cssHooks[name].set !== "function"
                || !fix.cssHooks[name].set.call(this, this.style, value, orgname) )
            {
                this.style[ orgname ] = value;
            }
        } catch (e) {}
        return StyleEvent.CHANGE;
    }
};

/**
 * 设置所有匹配元素的样式
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.style=function style(name, value )
{
    if( typeof name === 'string' && name.indexOf(':')>0 )
    {
        value=name;
        name='cssText';
    }
    else if( System.isObject(name) )
    {
        value=System.serialize( name,'style');
        name='cssText';
    }
    return access.call(this,'style',name,value);
};

/**
 * 显示元素
 * @returns {Element}
 */
Element.prototype.show=function show()
{
    return Element.prototype.forEach.call(this,function(){
        Element.prototype.style.call(this,'display', '' );
    });
};

/**
 * 隐藏当前元素
 * @returns {Element}
 */
Element.prototype.hide=function hide()
{
    return Element.prototype.forEach.call(this,function(){
        Element.prototype.style.call(this,'display', 'none' );
    });
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
Element.prototype.hasClass=function hasClass(className )
{
    var elem = Element.prototype.current.call(this);
    if( !elem )return false;
    var value=elem['className'] || '';
    return value === '' || !value ? false : typeof className==='string' ? new RegExp('(\\s|^)' + className + '(\\s|$)').test( value ) : true ;
};

/**
 * 添加指定的类名
 * @param className
 * @returns {Element}
 */
Element.prototype.addClass=function addClass(className )
{
    if( typeof className !== "string" )
        throw new Error('invaild class name');
    className = System.trim( className );
    Element.prototype.forEach.call(this,function(elem){

        if( !Element.prototype.hasClass.call(this, className ) )
        {
            var oldClass=System.trim( elem['className'] );
            var old = oldClass;
            oldClass= [ System.trim( oldClass ) ];
            oldClass.push( className );
            var newValue = System.trim( oldClass.join(' ') );
            elem['className'] = newValue;

            if( Element.prototype.hasEventListener.call(this,StyleEvent.CHANGE) )
            {
                var event = new StyleEvent( StyleEvent.CHANGE );
                event.property = 'class';
                event.newValue = newValue;
                event.oldValue = old;
                return event
            }
        }
    });
    return this;
};

/**
 * 移除指定的类名或者清除所有的类名。
 * @param className
 * @returns {Element}
 */
Element.prototype.removeClass=function removeClass(className )
{
    var all = typeof className !== 'string';
    return Element.prototype.forEach.call(this,function(elem){
        var newValue='';
        var old=elem['className'] || '';
        if( !all )
        {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            newValue=old.replace(reg, '');
        }
        newValue === '' ? elem.removeAttribute('class') : elem['className'] = System.trim(newValue);
        try {
            elem.offsetWidth = elem.offsetWidth;
            if( Element.prototype.hasEventListener.call(this,StyleEvent.CHANGE) )
            {
                var event = new StyleEvent( StyleEvent.CHANGE );
                event.property = 'class';
                event.newValue = old;
                event.oldValue = newValue;
                return event
            }
        }catch(e){}
    })
};

/**
 * 获取设置元素宽度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.width=function width(value )
{
    return access.call(this,'style','width',value);
};

/**
 * 获取设置元素高度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.height=function height(value )
{
    return access.call(this,'style','height',value);
};

/**
 * @private
 */
accessor['scroll']={
    get:function(prop){
        var e = this.defaultView || this.parentWindow || this;
        var p= 'scroll'+prop;
        return Element.isWindow( e ) ? e[ prop.toLowerCase()==='top'?'pageYOffset':'pageXOffset'] || e.document.documentElement[p] || e.document.body[p] : e[p] ;
    },
    set:function(prop,newValue,obj){
        var e = this.defaultView || this.parentWindow || this;
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

        if( Element.prototype.hasEventListener.call(this, ScrollEvent.CHANGE ) ){

            var event = new ScrollEvent( ScrollEvent.CHANGE );
            event.property = prop.toLowerCase();
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
    var elem= Element.prototype.current.call(this);
    if( Element.isWindow(elem) )
    {
        value.left = elem.screenLeft || elem.screenX;
        value.top = elem.screenTop || elem.screenY;
        value.width = Element.prototype.width.call(this);
        value.height = Element.prototype.height.call(this);
        value.right = value.width + value.left;
        value.bottom = value.height + value.top;
        return value;
    }

    if( !Element.isNodeElement( elem ) )
        throw new Error('invalid elem. elem not is NodeElement');

    var doc =  elem.ownerDocument || elem, docElem=doc.documentElement;
    Element.prototype.current.call(this, Element.getWindow( doc ) );
    var scrollTop = Element.prototype.scrollTop.call(this);
    var scrollLeft = Element.prototype.scrollLeft.call(this);
    Element.prototype.current.call(this, elem );

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
    if( Element.prototype.style.call(this,'position') === 'fixed' || force===true )
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
        return Element.prototype.getBoundingRect.call(obj)[ prop ];
    },
    set:function(prop,newValue,obj){

        var elem = Element.prototype.current.call(obj);
        var val = accessor.style.get.call(elem,'position');
        if( !position_hash[val] )
        {
            accessor.style.set.call(elem,'position','relative');
        }
        return Element.prototype.style.call(obj,prop,newValue>>0);
    }
};


/**
 * 获取或者设置相对于父元素的左边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.left=function left(val )
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
    var old =  storage(this,'forEachCurrentItem');
    var target = Element.prototype.current.call(this);
    Element.prototype.current.call(this, target.parentNode );
    var offset=Element.prototype.getBoundingRect.call(this);
    Element.prototype.current.call(this, old );
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
 * 回撒到指定步骤的选择器所匹配的元素,不包含初始化的步骤。
 * @param step
 * @returns {Element}
 */
Element.prototype.revert=function revert(step)
{
    var reverts = storage(this,'reverts');
    if( reverts && reverts.length > 0 )
    {
        var len=reverts.length;
        step = step || -1;
        step= step < 0 ? step+len : step;
        step=step >= len ? 0 : step;
        Element.prototype.splice.call(this,0,this.length, reverts.splice(step, len-step).shift() );
    }
    return this;
};

/**
 * 查找当前匹配的第一个元素下的指定选择器的元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.find=function find(selector)
{
    var ret=[];
    Element.prototype.forEach.call(this,function(elem){
        ret = ret.concat.apply(ret,querySelector(selector, elem ) );
    });
    return $doMake.call( this, ret );
};

/**
 * 查找所有匹配元素的父级元素或者指定selector的父级元素（不包括祖辈元素）
 * @param selector
 * @returns {Element}
 */
Element.prototype.parent=function parent( selector )
{
    return $doMake.call( this, Array.prototype.unique.call( $doRecursion.call(this,'parentNode',selector ) ) );
};

/**
 * 查找所有匹配元素的祖辈元素或者指定 selector 的祖辈元素。
 * 如果指定了 selector 则返回最近的祖辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.parents=function parents(selector )
{
    return $doMake.call( this, Array.prototype.unique.call( $doRecursion.call(this,'parentNode',selector, true ) ) );
};

/**
 * 获取所有匹配元素向上的所有同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prevAll=function prevAll(selector )
{
    return $doMake.call( this, $doRecursion.call(this,'previousSibling', selector, true ) );
};

/**
 * 获取所有匹配元素紧邻的上一个同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prev=function prev(selector )
{
    return $doMake.call( this, $doRecursion.call(this,'previousSibling', selector ) );
};

/**
 * 获取所有匹配元素向下的所有同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.nextAll=function nextAll(selector )
{
    return $doMake.call( this, $doRecursion.call(this,'nextSibling', selector , true ) );
};

/**
 * 获取每一个匹配元素紧邻的下一个同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.next=function next(selector )
{
    return $doMake.call( this, $doRecursion.call(this,'nextSibling', selector ) );
};

/**
 * 获取每一个匹配元素的所有同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.siblings=function siblings(selector )
{
    var results=[].concat( $doRecursion.call(this,'previousSibling',selector,true) , $doRecursion.call(this,'nextSibling',selector, true) );
    return $doMake.call( this, results );
};

/**
 * 查找所有匹配元素的所有子级元素，不包括孙元素
 * @param selector 如果是 * 返回包括文本节点的所有元素。不指定返回所有HTMLElement元素。
 * @returns {Element}
 */
Element.prototype.children=function children( selector )
{
    if( typeof selector === 'undefined' )
    {
        selector= function(item){ return item.nodeType===1 };
    }
    var is=typeof selector === "function";
    var results=[];
    Element.prototype.forEach.call(this,function(element)
    {
        if( !Element.isFrame(element) && element.hasChildNodes() )
        {
            var child = Element.prototype.slice.call( element.childNodes );
            results =  is ? Element.prototype.concat.apply( results, Array.prototype.filter.call(child, selector ) ) :
                Element.prototype.concat.apply( results, querySelector(selector,element,null,child) );
        }
    });
    return $doMake.call( this, Array.prototype.unique.call(results) );
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

        }else if( System.instanceOf(htmlObject,Element) )
        {
            htmlObject = Element.prototype.current.call(htmlObject);
            is = true;
        }
    }
    return Element.prototype.forEach.call(this,function(elem)
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
                    var cloneElem=$cloneNode( elem, true);
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
            Element.prototype.removeChild.call(this, elem.childNodes.item(0) );
        }
        if( htmlObject )
        {
            if(is)return Element.prototype.addChild.call(this, htmlObject);
            try
            {
                elem.innerHTML = htmlObject;
            } catch (e)
            {
                var nodename = Element.getNodeName(elem);
                if (!new RegExp("^<" + nodename).exec(htmlObject)) {
                    htmlObject = System.sprintf('<%s>%s</%s>', nodename, htmlObject, nodename);
                }
                var child = $createElement(htmlObject);
                var deep = nodename === 'tr' ? 2 : 1, d = 0;
                while (d < deep && child.firstChild)
                {
                    d++;
                    child = child.firstChild;
                }
                $mergeAttributes(child, elem);
                elem.parentNode.replaceChild(child, elem);
            }
        }
    });
};

/**
 * 添加子级元素（所有已匹配的元素）
 * @param childElemnet
 * @returns {Element}
 */
Element.prototype.addChild=function addChild(childElemnet)
{
    return Element.prototype.addChildAt.call(this, childElemnet,-1);
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
         childElemnet =  Element.prototype.current.call(childElemnet);
     }
     if( !Element.isNodeElement( childElemnet ) )
     {
         throw new TypeError('is not Element in addChildAt');
     }
     var parent = Element.prototype.current.call(this);
     if( !Element.isHTMLElement( parent ) )
     {
        throw new Error('parent is null of child elemnet in addChildAt');
     }

    var refChild=index===-1 ? null : Element.prototype.getChildAt.call(this,index);
    if( childElemnet.parentNode )Element.prototype.removeChild.call(this, childElemnet );
    var result = parent.insertBefore( childElemnet , refChild || null );
    if( Element.getNodeName(childElemnet)==="#document-fragment" )
    {
        childElemnet['parent-element'] = parent;
    }
    $dispatchEvent( EventDispatcher( childElemnet ) ,ElementEvent.ADD, parent, childElemnet , result );
    $dispatchEvent( EventDispatcher( parent ) , ElementEvent.CHNAGED, parent, childElemnet , result );
    return childElemnet;
};

/**
 * 返回指定索引位置的子级元素( 匹配选择器的第一个元素 )
 * 此方法只会计算节点类型为1的元素。
 * @param index | refChild | fn(node,index,parent)
 * @returns {Node|null}
 */
Element.prototype.getChildAt=function getChildAt( index )
{
    var parent = Element.prototype.current.call(this);
    if( !parent || !parent.hasChildNodes() )return null;
    var childNodes,child=null;
    if( typeof index === 'function' )
    {
        child=$getChildNodes.call(this, parent ,index ,true)[0];

    }else if( typeof index === 'number' )
    {
        childNodes=$getChildNodes.call(this,parent);
        index=index < 0 ? index+childNodes.length : index;
        child=index >= 0 && index < childNodes.length ? childNodes[index] : null;
    }
    return child;
};

/**
 * 返回子级元素的索引位置( 匹配选择器的第一个元素 )
 * @param childElemnet | selector
 * @returns {Number}
 */
Element.prototype.getChildIndex=function getChildIndex( childElemnet )
{
    var parent = Element.prototype.current.call(this);
    if( !parent || !parent.hasChildNodes() )return -1;
    var children = $getChildNodes(parent);
    if( typeof childElemnet==='string' )
    {
        childElemnet = querySelector(childElemnet,null,null,children);
    }
    if( childElemnet.parentNode === parent )
    {
        return Array.prototype.indexOf.call( children, childElemnet);
    }
    return -1;
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
        childElemnet = Element.prototype.current.call(childElemnet);
    }

    if( !Element.isNodeElement(childElemnet) )
    {
        throw new TypeError('is not HTMLElement in removeChild');
    }

    var parent = childElemnet.parentNode;
    if( !parent )
    {
        if( Element.getNodeName(childElemnet)==="#document-fragment" )
        {
            parent = childElemnet['parent-element'];
            if( parent )
            {
                while ( parent.childNodes.length > 0 )
                {
                    this.removeChild( parent.childNodes[0] );
                }
                return childElemnet;
            }
        }
        throw new TypeError('parentNode is null of child elemnet');
    }
    var result = parent.removeChild( childElemnet );
    $dispatchEvent( EventDispatcher( childElemnet ) , ElementEvent.REMOVE, parent, childElemnet , result );
    $dispatchEvent( EventDispatcher( parent ) , ElementEvent.CHNAGED, parent, childElemnet , result );
    return childElemnet;
};

/**
 * 移除子级元素
 * @param childElemnet|index|fn  允许是一个节点元素或者是相对于节点列表中的索引位置（不包括文本节点）。
 *        也可以是一个回调函数过滤要删除的子节点元素。
 * @returns {Element}
 */
Element.prototype.removeChildAt=function removeChildAt( index )
{
    var parent = Element.prototype.current.call(this);
    var child= Element.prototype.getChildAt.call(this, index );
    if( !child )
    {
        throw new Error('Not found child. in removeChildAt');
    }
    if( child.parentNode === parent )
    {
        return Element.prototype.removeChild.call(this, child );
    }
    return null;
};

/**
 * 测试指定的元素（或者是一个选择器）是否为当前元素的子级
 * @param child
 * @returns {boolean}
 */
Element.contains=function contains( child , parent )
{
    if( Element.isNodeElement(child) && Element.isNodeElement(parent) )
    {
        if('contains' in parent)return parent.contains( child ) && parent !== child;
        return !!(parent.compareDocumentPosition(child) & 16) && parent !== child ;
    }
    return querySelector( child, parent ).length > 0;
};

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
    if( !elem ) return false;
    return hasNode ? elem instanceof Node : elem.nodeType && typeof elem.nodeName === "string" &&
    (typeof elem.tagName === "string" || elem.nodeName==="#document-fragment");
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
    return elem && elem === Element.getWindow(elem);
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
    if( elem )
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

//set hooks for userSelect style
fix.cssHooks.userSelect={

    get: function( style )
    {
        return style[ $getStyleName('userSelect') ] || '';
    },
    set: function( style, value )
    {
        style[ $getStyleName('userSelect') ] = value;
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
        if( System.env.platform(System.env.BROWSER_IE) && System.env.version(10,'<') )
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
            value= System.sprintf('%s(%s)', $getStyleName( name ) , value ) ;
        }
        style[ prop ] = value ;
        return true;
    }
};

//add get width hooks
fix.cssHooks.width= {
    get:function(style){ return ( fix.getsizeval.call(this,'Width') || style['width'] ) >> 0; }
};

//add get height hooks
fix.cssHooks.height={
    get:function (style){return ( fix.getsizeval.call(this,'Height') || style['height'] ) >> 0;}
};

//@internal Element.fix;
Element.fix = fix;

Element.createElement = $createElement;

System.Element = Element;