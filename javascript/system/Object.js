/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System
 */

var Internal = require("./Internal.js");
var $Object = Internal.$Object;

function Object( value )
{
    if ( value != null )return $Object(value);
    if( !(this instanceof Object) ) return new Object();
    return this;
}

/**
 * 定义属性
 */
Internal.defineProperty(Object,"defineProperty",{value:Internal.defineProperty});

/**
 * 生成一个对象
 */
Object.defineProperty(Object,"create",{value:$Object.create});

/**
 * 返回一个给定对象自身可枚举属性的键值对数组
 */
Object.defineProperty(Object,"entries",{value:function(obj){

    var properties = Object.prototype.getEnumerableProperties(2);
    var resArray = new Array();
    for(var p in properties)
    {
        resArray.push([ p , properties[p] ])
    } 
    return resArray;

}});


/**
 * 合并其它参数到指定的 target 对象中
 * 如果只有一个参数则只对本身进行扩展。
 * @param deep true 深度合并
 * @param target object 目标源对象
 * @param ...valueObj object 待合并到目标源上的对象
 * @returns Object
 */
Object.defineProperty(Object,"merge",{
    value:function merge()
    {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;
        if ( typeof target === "boolean" )
        {
            deep = target;
            target = arguments[1] || {};
            i++;
        }
        if ( length === i )
        {
            target = {};
            --i;
        }else if ( typeof target !== "object" && typeof target !== "function" )
        {
            target = {};
        }

        //只有动态类对象允许合并属性
        if( ( System.isClass(target.constructor) && target.constructor.__T__.dynamic !==true) || System.isClass(target) )
        {
            return target;
        }

        for ( ;i < length; i++ )
        {
            if ( (options = arguments[ i ]) != null )
            {
                var token;
                if( System.isClass(options) )continue;
                if( System.isClass(options.constructor) )
                {
                    if( options.constructor.__T__.dynamic !== true )continue;
                    token = options.constructor.__T__.uri[0];
                }
                for ( name in options )
                {
                    if( token===name || !$Object.prototype.hasOwnProperty.call(options,name) )continue;
                    copy = options[name];
                    if ( target === copy )continue;
                    if ( deep && copy && ( System.isObject(copy) || ( copyIsArray = System.isArray(copy) ) ) )
                    {
                        src =  target[name];
                        if ( copyIsArray )
                        {
                            copyIsArray = false;
                            clone = src && System.isArray(src) ? src : [];
                        } else
                        {
                            clone = src && System.isObject(src) ? src : {};
                        }
                        target[name]=Object.merge( deep, clone, copy )

                    } else if ( typeof copy !== "undefined" )
                    {
                        target[name]=copy;
                    }
                }
            }
        }
        return target;
    }
});

/**
 * 循环每一个元素并应用到指定的回调函数上
 * @param object
 * @param callback
 */
Object.defineProperty(Object,"forEach",{
    value:function forEach(object,callback,thisObject)
    {
        if( object == null || System.isClass(object) || typeof callback !== "function" )return;
        var value = null;
        var iteratorClass = Internal.getClassModule( Internal.iteratorClassName );
        var isIterator = object instanceof ListIterator || ( iteratorClass && System.is(object, iteratorClass) );
        thisObject = thisObject||object;
        if( isIterator && typeof object.next === "function" )
        {
            var next = object.next;
            var current = object.current;
            var key = object.key;
            var rewind = object.rewind;
            rewind.call(object);
            while(next.call(object))
            {
                value = current.call(object);
                if( callback.call(thisObject, value, key.call(object) ) === false )
                {
                    return value;
                }
            }

        }else
        {
            var token = null;
            if ( System.isClass(object.constructor) )
            {
                if (object.constructor.__T__.dynamic !== true)return;
                token = object.constructor.__T__.uri[0];
            }

            for (var prop in object)
            {
                if (Symbol.isSymbolPropertyName && Symbol.isSymbolPropertyName(prop))continue;
                if (prop !== token && $Object.prototype.propertyIsEnumerable.call(object, prop))
                {
                    value = object[prop];
                    if( callback.call(thisObject, value, prop) === false )
                    {
                        return value;
                    }
                }
            }
        }
    }
});

/**
 * 获取对象的原型
 */
Object.defineProperty(Object,"getPrototypeOf",{
    value:$Object.getPrototypeOf || function getPrototypeOf(obj)
    {
        if( obj == null )throw new TypeError("non-object");
        if( System.isClass(obj.constructor) )
        {
            return null;
        }
        return obj.__proto__ ? obj.__proto__ : (obj.constructor ? obj.constructor.prototype : null);
    }
});

/**
 * 设置对象的原型链
 * @returns {Object}
 */
Object.defineProperty(Object,"setPrototypeOf",{
    value:$Object.setPrototypeOf || function setPrototypeOf(obj, proto)
    {
        if( obj == null )throw new TypeError("non-object");
        if( System.isClass(obj.constructor))
        {
            return false;
        }
        obj.__proto__ = proto;
        return obj;
    }
});


/**
 * 设置对象的原型链
 * @returns {Object}
 */
Object.defineProperty(Object,"setPrototypeOf",{
    value:$Object.setPrototypeOf || function setPrototypeOf(obj, proto)
    {
        if( obj == null )throw new TypeError("non-object");
        if( System.isClass(obj.constructor))
        {
            return false;
        }
        obj.__proto__ = proto;
        return obj;
    }
});


 /**
 * 返回对象可枚举的属性的键名
 * @returns {Array}
 */
Object.defineProperty(Object,"keys",{
    value:function keys( target )
    {
        return Object.prototype.getEnumerableProperties.call(target,-1);
    }
});


/**
 * 返回对象可枚举的属性值
 * @returns {Array}
 */
Object.defineProperty(Object, "values",{
    value:function values( target )
    {
        return Object.prototype.getEnumerableProperties.call(target,1);
    }
});

//基础对象的原型方法
Object.prototype = Object.create( $Object.prototype,{

    /**
    * 返回对象的原始值
    */
   "valueOf":{
       value:function valueOf()
       {
           if( System.isClass(this.constructor) )
           {
               var objClass = this.constructor;
               var p = objClass.__T__['package'];
               return '[object '+(p ? p+'.' : '')+objClass.__T__.classname+"]";
           }
           return $Object.prototype.valueOf.call(this);
       }
   },
   "toString":{
        value:function toString()
        {
            if( System.isClass(this.constructor) )
            {
                var objClass = this.constructor;
                var p = objClass.__T__['package'];
                return '[object '+(p ? p+'.' : '')+objClass.__T__.classname+"]";
            }
            return $Object.prototype.toString.call(this);
        }
    },

    /**
     * 表示对象本身是否已经定义了指定的属性。
     * 如果目标对象具有与 name 参数指定的字符串匹配的属性，则此方法返回 true；否则返回 false。
     * @param prop 对象的属性。
     * @returns {Boolean}
     */
    "hasOwnProperty":{
        value:function hasOwnProperty( name )
        {
            if( this == null )throw new TypeError("non-object");
            if( System.isClass(this) ) return false;
            if( System.isClass(this.constructor) )
            {
                if( this.constructor.__T__.dynamic !==true )return false;
                if( this.constructor.__T__.uri[0] === name )return false;
            }
            return $Object.prototype.hasOwnProperty.call(this,name);
        }
    },


     /**
     * 表示指定的属性是否存在、是否可枚举。
     * 如果为 true，则该属性存在并且可以在 for..in 循环中枚举。该属性必须存在于目标对象上，
     * 原因是：该方法不检查目标对象的原型链。您创建的属性是可枚举的，但是内置属性通常是不可枚举的。
     * @param name
     * @returns {Boolean}
     */
    "propertyIsEnumerable":{
        value:function propertyIsEnumerable( name )
        {
            if( this == null )throw new TypeError("non-object");
            if( System.isClass(this) ) return false;
            if( System.isClass(this.constructor) )
            {
                if( this.constructor.__T__.dynamic !==true )return false;
                if( this.constructor.__T__.uri[0] === name )return false;
            }
            if( Symbol.isSymbolPropertyName && Symbol.isSymbolPropertyName(name) )return false;
            return $Object.prototype.propertyIsEnumerable.call(this,name);
        }
    },

    /**
     * 获取可枚举的属性
     * @param state
     * @returns {Array}
     */
    "getEnumerableProperties":{
        value:function getEnumerableProperties( state )
        {
            if( this == null )throw new TypeError("non-object");
            var items=state===2 ? {} : [];
            if( System.isClass(this) )return items;
            if( System.isArray(this) && state !==2 )return this;

            var iteratorClass = Internal.getClassModule( Internal.iteratorClassName );
            var isIterator = this instanceof ListIterator || ( iteratorClass && System.is(this, iteratorClass) );
            if( isIterator && typeof this.next === "function" )
            {
                var next = this.next;
                var current = this.current;
                var key = this.key;
                var rewind = this.rewind;
                rewind.call(this);
                while( next.call(this) )
                {
                    makeValue(items, current.call(this), key.call(this) , state);
                }
    
            }else 
            {
                var token = null;
                if ( System.isClass(this.constructor) )
                {
                    if (this.constructor.__T__.dynamic !== true)return items;
                    token = this.constructor.__T__.uri[0];
                }
                
                for (var prop in this)
                {
                    if (Symbol.isSymbolPropertyName && Symbol.isSymbolPropertyName(prop))continue;
                    if (prop !== token && $Object.prototype.propertyIsEnumerable.call(this, prop))
                    {
                        makeValue(items,this[prop], prop, state);
                    }
                }
            }
            return items;
        }
    },

    /**
    * 对象的构造函数
    */
    "constructor":{
        value:Object
    }
});

function makeValue(items,value, prop, state)
{
    //类中定义的属性成员不可枚举
    //动态类设置的属性可以枚举，但属性描述符enumerable=false时不可枚举
    switch (state){
        case -1 : items.push(prop); break;
        case  1 : items.push(value); break;
        case  2 : items[prop] = value; break;
        default : items.push({key: prop, value: value});
    }
}

module.exports =Object;
var System = require("./System.js");
var Symbol = require("./Symbol.js");
var Array = require("./Array.js");
var ListIterator = require("./ListIterator.js");
