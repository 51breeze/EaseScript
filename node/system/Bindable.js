/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Symbol,Reflect,Element,EventDispatcher,SyntaxError,ReferenceError
 */

/**
 * 提交属性到每个绑定的对象
 * @private
 * @param property
 * @param newValue
 */
function commitProperties(event)
{
    var property = Reflect.get(null,event,'property');
    var binding = storage(this,'binding');
    var hash = storage(this,'hash');
    var bind =  binding[ property ];
    
    if( bind )
    {
        var newValue = Reflect.get(null,event, 'newValue');

        //相同的属性值不再提交
        if (typeof newValue !== "undefined" && newValue !== hash[property] )
        {
            hash[property] = newValue;
            var i,item;
            for( i in bind )
            {
                item=bind[i];
                setProperty(item.item.element, item.name, newValue );
            }
        }
    }
}
/**
 * 设置属性值
 * @param object
 * @param prop
 * @param newValue
 */
function setProperty(object, prop, newValue )
{
    if( object instanceof Bindable )
    {
        Bindable.prototype.property.call(object,prop,newValue);

    }else if( Element.isNodeElement(object) )
    {
        if( typeof object[ prop ] !== "undefined"  )object[ prop ] = newValue;

    }else if( object instanceof Element )
    {
        if( typeof object[prop] === "function" )
        {
            object[prop]( newValue );
        }else
        {
            Element.prototype.property.call(object,prop,newValue);
        }

    }else if( Reflect.has(null, object, prop) )
    {
        Reflect.set(null, object, prop, newValue );
    }
}

function getProperty(object, prop )
{
    if( object instanceof Bindable )
    {
        return Bindable.prototype.property.call(object,prop);

    }else if( Element.isNodeElement(object) )
    {
       return object[ prop ];

    }else if( object instanceof Element )
    {
        if( typeof object[prop] === "function" )
        {
            return object[prop]();
        }else {
            return Element.prototype.property.call(object, prop);
        }

    }else if( Reflect.has(null, object, prop) )
    {
        return Reflect.get(null, object, prop );
    }
    return undefined;
}

/**
 * 数据双向绑定器
 * @param source 数据源对象。
 * 如果是一个EventDispatcher对象，则该对象上的所有 PropertyEvent.CHANGE 事件都会反应到此绑定器中
 * 如果是一个DOM元素则会监听当前元素的属性变更并反应到此绑定器中。
 * @param type 监听的事件类型, 默认为 PropertyEvent.CHANGE
 * @constructor
 */
function Bindable(source,properties)
{
    if( !(this instanceof Bindable) )
        return new Bindable( source );
    EventDispatcher.call(this , source );
    if( typeof properties === "string" )
    {
        properties = [ properties ];
    }
    if( !System.isArray(properties) )
    {
        throw new TypeError('Invalid properties must is be String or Array. in Bindable');
    }
    storage(this,true,{"source":source,"properties":properties,"hash":{},"subscriber":new Dictionary(),"binding":{}});
    this.addEventListener(PropertyEvent.CHANGE,commitProperties);
}

module.exports = Bindable;
var EventDispatcher = require("./EventDispatcher.js");
var Object = require("./Object.js");
var System = require("./System.js");
var PropertyEvent = require("./PropertyEvent.js");
var Symbol = require("./Symbol.js");
var Dictionary = require("./Map.js");
var Symbol = require("./Symbol.js");
var Element = require("./Element.js");
var Reflect = require("./Reflect.js");
var Internal = require("./Internal.js");
var storage=Internal.createSymbolStorage( Symbol('Bindable') );


Bindable.prototype=Object.create( EventDispatcher.prototype,{
   "constructor":{value:Bindable}
});

/**
 * 指定对象到当前绑定器。
 * @param object target 绑定的目标对象。
 * @param string property 绑定目标对象的属性名。当绑定器中有属性变更时会更新这个属性名的值。
 * @param string name 绑定数据源中(source)的属性名。
 * @param boolean flag 一个布尔值， 如果为 false 此目标对象的属性发生变化时不会通知到此绑定器，默认为 true 通知。
 * @returns {Bindable}
 */
Bindable.prototype.bind=function bind(target, property, name, flag)
{
    var subscriber = storage(this,'subscriber');
    var properties = storage(this,'properties');
    var binding = storage(this,'binding');
    var item = subscriber.get(target,{binding:{},dispatcher:null,handle:null,element:target});
    var dispatch = flag !== false;
    name = name || property;
    if( typeof property !== "string" )
    {
        throw new TypeError("Invalid property must is be a String in Bindable.bind");
    }
    if( !(properties[0] ==='*' || properties.indexOf(name) >= 0) )
    {
        throw new TypeError("No binding source property name. in Bindable.bind");
    }

    //是否启用双向绑定
    if( dispatch && item.handle === null )
    {
        //创建一个可派发事件的对象
        if( !item.dispatcher )
        {
            dispatch = target;
            if( target instanceof Element ){

                item.element = target;
                dispatch = item.element;

            }else if( Element.isNodeElement(target) )
            {
                item.element = new Element(target);
                dispatch = item.element;
            }
            if( dispatch === target && !(target instanceof EventDispatcher) )dispatch = null;
            if( dispatch )item.dispatcher = dispatch;
        }

        //如果是一个可派发事件的对象，才能启用双向绑定
        if( item.dispatcher )
        {
            item.handle = function (event)
            {
                var property = Reflect.get(null,event,'property');
                var newValue = Reflect.get(null,event,'newValue');
                var oldValue = Reflect.get(null,event,'oldValue');
                if( property && typeof newValue !== "undefined" && newValue!==oldValue && item.binding.hasOwnProperty(property) )
                {
                    this.property( item.binding[ property ] , newValue );
                }
            };
            //如果目标对象的属性发生变化
            Reflect.call(null,item.dispatcher,'addEventListener',[PropertyEvent.CHANGE,item.handle,false,0,this] );
        }
    }

    if( !item.binding[ property ] )
    {
        item.binding[property] = name;
        ( binding[name] || (binding[name] = []) ).push({"name": property, "item": item});
    }
    var source = storage(this,'source');
    if( source )
    {
        if( !Reflect.has(null,source, name) )
        {
            throw new TypeError("target source property is not exists for '"+name+"'");
        }
        var value = Reflect.get(null,source, name);
        if( value )
        {
            setProperty(item.element, property, value );
        }
    }
    return this;
};

/**
 * 解除绑定(取消订阅)
 * @public
 * @param object target 数据对象，允许是一个 DOM元素、EventDispatcher、Object
 * @param string property 需要绑定的属性名
 * @returns {boolean}
 */
Bindable.prototype.unbind=function unbind(target,property)
{
    var subscriber = storage(this,'subscriber');
    var item=subscriber.get( target );
    var binding = storage(this,'binding');
    var bind;
    if( typeof property ==='string' )
    {
        if( item )
        {
            if( item.binding.hasOwnProperty( property ) )
            {
                var name = item.binding[property];
                if( binding[name] )
                {
                    removeItem(binding[name],item,property);
                    delete item.binding[property];
                    if( System.isEmpty(item.binding) )
                    {
                        item.dispatcher.removeEventListener(PropertyEvent.CHANGE,item.handle);
                    }
                    return true;
                }
            }
        }
        return false;
    }
    if( item )
    {
        for( var p in binding )
        {
            bind = binding[ p ];
            removeItem(bind,item);
        }
        item.dispatcher.removeEventListener(PropertyEvent.CHANGE,item.handle);
    }
    return !!subscriber.remove( target );
};

function removeItem( bind ,item, name )
{
    var index=0;
    for( ; index<bind.length; index++ )
    {
        if( bind[index].item === item && (!name || bind[index].name === name ) )
        {
            bind.splice(index--, 1);
        }
    }
}

/**
 * 提交属性的值到绑定器。
 * 调用此方法成功后会传递当前改变的值到绑定的对象中。
 * @param string name
 * @param void value
 */
Bindable.prototype.property=function property(name,value)
{
    if( typeof name === "string" )
    {
        var hash = storage(this,'hash');
        var old = hash[name];
        var source = storage(this, 'source');
        if (typeof value !== 'undefined' && old !== value )
        {
            //如果目标源属性没有定义
            if( !this.hasProperty(name) )return false;
            setProperty( source, name, value);
            var ev = new PropertyEvent(PropertyEvent.CHANGE);
            ev.property = name;
            ev.newValue = value;
            ev.oldValue = old;
            this.dispatchEvent(ev);
            return true;
        }
        return typeof old === "undefined" ? getProperty( source, name ) : old;
    }
    return false;
};

/**
 * 检查是否有指定的属性名
 * @param string name
 * @returns {boolean}
 */
Bindable.prototype.hasProperty=function hasProperty(name)
{
    var properties = storage(this,'properties');
    if( properties[0] === '*' )
    {
        return Reflect.has(null,storage(this,'source'),name);
    }
    return properties.indexOf(name) >= 0;
};
