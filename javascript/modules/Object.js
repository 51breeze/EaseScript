/**
 * 对象类构造器
 * @param value
 * @returns {*}
 * @constructor
 * @require System,Internal.$get,Internal.$set;
 */
function Object( value )
{
    if ( value != null )return $Object(value);
    if( !(this instanceof Object) ) return {};
    return this;
}
System.Object = Object;
Object.prototype = new $Object();
Object.prototype.constructor=Object;

Object.prototype.valueOf = function valueOf()
{
    if( this.constructor instanceof System.Class )
    {
        var objClass = this.constructor;
        var p = objClass.__T__['package'];
        return '[object '+(p ? p+'.' : '')+objClass.__T__.classname+"]";
    }
    return $Object.prototype.valueOf.call(this);
};

Object.prototype.toString = function toString()
{
    if( this.constructor instanceof System.Class )
    {
        var objClass = this.constructor;
        var p = objClass.__T__['package'];
        return '[object '+(p ? p+'.' : '')+objClass.__T__.classname+"]";
    }
    return $Object.prototype.toString.call(this);
};

/**
 * 定义属性描述
 */
Object.defineProperty = $Object.defineProperty;
if( !Object.defineProperty || ( System.env.platform('IE') && System.env.version(8) ) )
{
    Object.defineProperty = function defineProperty(obj, prop, desc)
    {
        if( obj == null)throw new TypeError('target is non-object');
        if( !desc.value )throw new TypeError('description invalid');
        return obj[prop] = desc.value;
    }
}

/**
 * 合并其它参数到指定的 target 对象中
 * 如果只有一个参数则只对本身进行扩展。
 * @param deep true 深度合并
 * @param target object 目标源对象
 * @param ...valueObj object 待合并到目标源上的对象
 * @returns Object
 */
Object.merge =function merge()
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
    if( (target.constructor instanceof System.Class && target.constructor.__T__.dynamic !==true) || target instanceof System.Class )
    {
        return target;
    }

    for ( ;i < length; i++ )
    {
        if ( (options = arguments[ i ]) != null )
        {
            var token;
            if( options instanceof System.Class )continue;
            if( options.constructor instanceof System.Class )
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
};

/**
 * 设置对象的原型链
 * @returns {Object}
 */
Object.setPrototypeOf = $Object.setPrototypeOf || function setPrototypeOf(obj, proto)
{
    if( obj == null )throw new TypeError("non-object");
    if( obj instanceof System.Class || obj.constructor instanceof System.Class )
    {
        return false;
    }
    obj.__proto__ = proto;
    return obj;
};

/**
 * 获取对象的原型
 */
Object.getPrototypeOf = $Object.getPrototypeOf || function getPrototypeOf(obj)
{
    if( obj == null )throw new TypeError("non-object");
    if( obj instanceof System.Class || obj.constructor instanceof System.Class )
    {
        return null;
    }
    return obj.__proto__ ? obj.__proto__ : (obj.constructor ? obj.constructor.prototype : null);
};

/**
 * 生成一个对象
 */
Object.create = $Object.create;

/**
 * 指示 Object 类的实例是否在指定为参数的对象的原型链中
 * @param theClass
 * @returns {Boolean}
 */
Object.prototype.isPrototypeOf = $Object.prototype.isPrototypeOf;

/**
 * 表示对象本身是否已经定义了指定的属性。
 * 如果目标对象具有与 name 参数指定的字符串匹配的属性，则此方法返回 true；否则返回 false。
 * @param prop 对象的属性。
 * @returns {Boolean}
 */
var $hasOwnProperty = $Object.prototype.hasOwnProperty;
Object.prototype.hasOwnProperty = function( name )
{
    if( this == null )throw new TypeError("non-object");
    if( this instanceof  System.Class ) return false;
    if( this.constructor instanceof System.Class )
    {
        if( this.constructor.__T__.dynamic !==true )return false;
        if(  this.constructor.__T__.uri[0] === name )return false;
    }
    return $hasOwnProperty.call(this,name);
};

/**
 * 表示指定的属性是否存在、是否可枚举。
 * 如果为 true，则该属性存在并且可以在 for..in 循环中枚举。该属性必须存在于目标对象上，
 * 原因是：该方法不检查目标对象的原型链。您创建的属性是可枚举的，但是内置属性通常是不可枚举的。
 * @param name
 * @returns {Boolean}
 */
var $propertyIsEnumerable=$Object.prototype.propertyIsEnumerable;
Object.prototype.propertyIsEnumerable = function propertyIsEnumerable( name )
{
    if( this == null )throw new TypeError("non-object");
    if( this instanceof  System.Class ) return false;
    if( this.constructor instanceof System.Class )
    {
        if( this.constructor.__T__.dynamic !==true )return false;
        if(  this.constructor.__T__.uri[0] === name )return false;
    }
    //symbol property
    if( System.Symbol.isSymbolPropertyName && System.Symbol.isSymbolPropertyName(name) )return false;
    return $propertyIsEnumerable.call(this,name);
};

/**
 * 返回对象可枚举的属性的键名
 * @returns {Array}
 */
Object.prototype.keys=function()
{
    return Object.prototype.getEnumerableProperties.call(this,-1);
};

/**
 * 返回对象可枚举的属性值
 * @returns {Array}
 */
Object.prototype.values=function()
{
    return Object.prototype.getEnumerableProperties.call(this,1);
};

/**
 * 获取可枚举的属性
 * @param state
 * @returns {Array}
 */
Object.prototype.getEnumerableProperties=function getEnumerableProperties( state )
{
    if( this == null )throw new TypeError("non-object");
    if( this instanceof System.Class )return [];
    var token;
    if( this.constructor instanceof System.Class )
    {
        if( this.constructor.__T__.dynamic !==true )return [];
        token = this.constructor.__T__.uri[0];
    }
    var items=[];
    var prop;
    for( prop in this )
    {
        if( System.Symbol.isSymbolPropertyName && System.Symbol.isSymbolPropertyName(prop) )continue;
        if( prop !== token && $propertyIsEnumerable.call(this,prop) )
        {
            //类中定义的属性成员不可枚举
            //动态类设置的属性可以枚举，但属性描述符enumerable=false时不可枚举
            switch (state){
                case -1 : items.push(prop); break;
                case  1 : items.push( this[prop] ); break;
                case  2 : items[prop] = this[prop]; break;
                default : items.push({key: prop, value: this[prop]});
            }
        }
    }
    return items;
};