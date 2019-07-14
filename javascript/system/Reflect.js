/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object,System,Namespace,Error,TypeError,ReferenceError,SyntaxError
 */

function Reflect()
{ 
    throw new SyntaxError('Reflect is not constructor.');
}
module.exports =Reflect;
var Object = require("./Object.js");
var ReferenceError = require("./ReferenceError.js");
var Namespace = require("./Namespace.js");
var TypeError = require("./TypeError.js");
var SyntaxError = require("./SyntaxError.js");
var Object = require("./Object.js");
var $has = Object.prototype.hasOwnProperty;
var ATTR_TYPE={
    1:"function",
    2:"get",
    4:"set",
    8:"var",
    16:"const",
    32:"namespace"
};
var _construct = $Reflect ? $Reflect.construct : function construct(theClass,args)
{
    if( !System.isFunction( theClass ) )
    {
        throw new TypeError('is not function');
    }
    switch ( args.length )
    {
        case 0 :
            return new theClass();
        case 1 :
            return new theClass(args[0]);
        case 2 :
            return new theClass(args[0], args[1]);
        case 3 :
            return new theClass(args[0], args[1], args[2]);
        default :
            return Function('f,a', 'return new f(a[' + System.range(0, args.length).join('],a[') + ']);')(theClass, args);
    }
};

var _apply = $Reflect ? $Reflect.apply : function apply(target, thisArgument, argumentsList)
{
    if( System.typeOf(target) !== "function" )
    {
        throw new TypeError('is not function');
    }
    thisArgument = thisArgument === target ? undefined : thisArgument;
    if (argumentsList != null) {
        return target.apply(thisArgument === target ? undefined : thisArgument, argumentsList);
    }
    if (thisArgument != null) {
        return target.call(thisArgument);
    }
    return target();
};

function fetchAccessorName(name,accessor)
{
    return accessor+(name.substr(0,1).toUpperCase()+name.substr(1));
}

function fetchDescObject(target, prop, value, desc, accessor )
{
    if( accessor && ATTR_TYPE[ desc.type ] === accessor )
    {
        var def = {"prop": prop, "desc": desc};
        def[ accessor ] = desc.value;
        return def;
    }
    return {"target":target,"prop": prop,"value":value, "desc": desc};
}

function fetchMethodAndAttributeDesc(context,proto,target,name,isstatic,accessor,ns)
{
    var prop = accessor ? fetchAccessorName(name,accessor) : name;
    prop = ns ? ns+'_'+prop : prop;
    if( $has.call(proto,prop) )
    {
        var desc = proto[prop];

        //静态成员
        if( isstatic )
        {
            return fetchDescObject(target, prop, target[prop], desc, accessor );
        }
        //实例成员
        else
        {
            //私有实例属性
            if( context && context.__T__.uri[0]===ns )
            {
                var _private = context.__T__.privateSymbol.valueOf();
                if( $has.call( target[_private], name ) )
                {
                    return fetchDescObject(target[_private], name, target[_private][name], desc, accessor);
                }
            }
            return fetchDescObject(proto, prop, desc.value, desc, accessor);
        }
    }
    if( accessor )
    {
       return fetchMethodAndAttributeDesc(context,proto,target, name,isstatic,'',ns);
    }
    return null;
}

function getNamespaceUri(context, ns)
{
    if( !ns || !(ns.length > 0) )
    {
        return context ? context.__T__.uri : [];
    }
    var uri = context.__T__.uri.slice(0);
    var len = ns.length;
    for(;i<len;i++)
    {
        var item = ns[i];
        if( item instanceof Namespace )
        {
            uri.push( Namespace.getCodeByUri( item.valueOf() ) );
        }
    }
    return uri;
}

function description(scope, target, name , receiver , ns, accessor)
{
    //表示获取一个类中的属性或者方法（静态属性或者静态方法）
    if( System.isClass(target.constructor) )
    {
        var isstatic = ( !receiver || receiver === target ) && System.isClass(target);
        var objClass = isstatic ? target : target.constructor;
        var context = System.isClass(scope) ? scope : null;
        var proto = isstatic ? objClass.__T__.method : objClass.__T__.proto;

        //获取公开的属性
        var desc = fetchMethodAndAttributeDesc( context, proto, target, name, isstatic, accessor, '');
        if( desc )
        {
            return desc;
        }

        //获取带有命名空间的属性
        var uri = getNamespaceUri( context, ns);
        do{ 
            var i = uri.length;
            proto = isstatic ? objClass.__T__.method : objClass.__T__.proto;
            while ( proto && (i--) > 0)
            {
                desc = fetchMethodAndAttributeDesc( context, proto, target, name, isstatic, accessor, uri[i]);
                if ( desc )
                {
                    return desc;
                }
            }

        }while( !isstatic && System.isClass(objClass = objClass.__T__["extends"]) );

        if( accessor && accessor==="set" )
        {
           return {"writable":false};
        }

        objClass = (objClass || Object).prototype;
        var obj = objClass[name];
        if( obj )
        {
            return {"target":objClass, "prop": name, "value":obj, "desc": {value:obj} };
        }
    }
    return null;
};


/**
 * 静态方法 Reflect.apply() 通过指定的参数列表发起对目标(target)函数的调用
 * @param theClass
 * @param thisArgument
 * @param argumentsList
 * @returns {*}
 */
Reflect.apply=function apply(target, thisArgument, argumentsList )
{
    if( !System.isFunction( target ) || System.isClass(target) )
    {
        throw new TypeError('target is not function');
    }

    if( !System.isArray(argumentsList) )
    {
        argumentsList = typeof argumentsList !== "undefined" ? [argumentsList] : [];
    }
    return _apply(target, thisArgument, argumentsList);
};

/**
 * 调用一个对象上的函数
 * @param target
 * @param propertyKey
 * @param thisArgument
 * @param argumentsList
 * @returns {*}
 */
Reflect.call=function call(scope, target, propertyKey,argumentsList,thisArgument,ns)
{
    if( target == null )throw new ReferenceError('target is null or undefined');
    if( propertyKey==null ){
        return Reflect.apply( target, thisArgument, argumentsList );
    }
    var fn = Reflect.get(scope,target, propertyKey, thisArgument , ns );
    if( typeof fn !== "function" )
    {
        throw new TypeError('target.'+propertyKey+' is not function');
    }
    return _apply(fn, thisArgument||target, argumentsList||[]);
};

/**
 * Reflect.construct() 方法的行为有点像 new 操作符 构造函数 ， 相当于运行 new target(...args).
 * @param target
 * @param argumentsList
 * @returns {*}
 */
Reflect.construct=function construct(target , args)
{
    if( System.isClass(target) )
    {
        if( target.__T__.abstract )
        {
            throw new TypeError('Abstract class cannot be instantiated');
        }
    }
    return _construct(target, args || []);
};

/**
 * 静态方法 Reflect.deleteProperty() 允许用于删除属性。它很像 delete operator ，但它是一个函数。
 * @param target
 * @param propertyKey
 * @returns {boolean}
 */
Reflect.deleteProperty=function deleteProperty(target, propertyKey)
{
    if( !target || propertyKey==null )return false;
    if( propertyKey==="__proto__")return false;
    if( System.isClass(target) ){
        if( target.__T__.dynamic !==true )return false;
        if( target.__T__.privateSymbol === propertyKey)return false;
    }
    if( $has.call(target,propertyKey) )
    {
        return (delete target[propertyKey]);
    }
    return false;
};

/**
 * 静态方法 Reflect.has() 作用与 in 操作符 相同。
 * @param target
 * @param propertyKey
 * @returns {boolean}
 */
Reflect.has=function has(scope, target, propertyKey)
{
    if( propertyKey==null || target == null )return false;
    if( propertyKey==="__proto__")return false;
    if( System.isClass(target.constructor) )
    {
        return !!description(scope,target,propertyKey,null,null,"get");
    }
    return propertyKey in target;
};

Reflect.type=function type(value, typeClass)
{
    if( typeof typeClass === "string" )
    {
        var original = value;
        typeClass = typeClass.toLowerCase();
        switch ( typeClass )
        {
            case "integer" :
            case "int" :
            case "number":
            case "uint":
                value = parseInt(value);
                if (typeClass !== "number")
                 {
                    if (typeClass === "uint" && value < 0)
                    {
                        throw new System.RangeError(original + " convert failed. can only be an unsigned Integer");
                    }
                    if (value > 2147483647 || value < -2147483648)
                    {
                        throw new System.RangeError(original + " convert failed. the length of overflow Integer");
                    }
                }
                break;
            case "double":
            case "float":
                value = parseFloat(value);
                break;
            case "class" :
               if( !System.isClass(value) )
               {
                   throw new System.TypeError(original + " is not Class.");
               }
               break;
        }
        return value;
    }
    if( value == null || typeClass === Object )return value;
    if( typeClass && !System.is(value, typeClass) )
    {
        var classname = System.isClass(typeClass.constructor) ? typeClass.constructor.__CLASS__ :  System.typeOf( typeClass );
        var up = System.ucfirst( System.typeOf( typeClass ) );
        if( System[ up ] ){
            classname = up;
        }
        throw new System.TypeError( value+' can not be convert for ' + classname );
    }
    return value;
};

/**
 * 获取目标公开的属性值
 * @param target
 * @param propertyKey
 * @returns {*}
 */
Reflect.get=function(scope,target, propertyKey, receiver , ns )
{
    if( propertyKey==null )return target;
    if( target == null )throw new ReferenceError('target is null or undefined');
    var desc = description(scope,target,propertyKey,receiver,ns,"get");
    receiver = receiver || target;
    if( !desc )
    {
        //内置对象属性外部不可访问
        if( propertyKey === '__proto__' )return undefined;
        return target[propertyKey];
    }
    if( desc.get )
    {
        return desc.get.call( System.isClass(receiver) ? null : receiver);
    }
    return desc.value;
};

/**
 * 设置目标公开的属性值
 * @param target
 * @param propertyKey
 * @param value
 * @returns {*}
 */
Reflect.set=function(scope,target, propertyKey, value , receiver ,ns )
{
    if( propertyKey==null )return target;
    if( target == null )throw new ReferenceError('target is null or undefined');
    var desc = description(scope,target,propertyKey,receiver,ns,"set");
    var isstatic = System.isClass(target);
    receiver = receiver || target;
    if( !desc )
    {
        //内置对象属性外部不可访问
        if( propertyKey === '__proto__' )
        {
            throw new ReferenceError('__proto__ is not writable');
        }
        if( isstatic )
        {
            throw new ReferenceError(propertyKey+' is not exists');
        }
        var objClass = target.constructor;
        if( System.isClass(objClass) ) 
        {
            if( objClass.__T__.dynamic !==true )
            {
                throw new ReferenceError(propertyKey+' is not exists');
            }
            var obj = target[propertyKey];
            //如果是一个动态对象并且是第一次赋值时存在此属性名则认为是原型对象上的类成员， 不能赋值。
            if( obj && !$has.call(target,propertyKey) )
            {
                throw new TypeError(propertyKey+' is not configurable');
            }

        }
        //如果是一个静态类不能赋值。
        else if( typeof target ==="function" )
        {
            throw new TypeError(propertyKey+' is not configurable');
        }
        return target[propertyKey]=value;
    }
    if( desc.set )
    {
        return desc.set.call( isstatic ? null : receiver, value);
    }
    if( desc.writable === false  )
    {
        throw new ReferenceError(propertyKey+' is not writable');
    }
    if( typeof desc.target === "object" || typeof desc.target === "function" )
    {
        return desc.target[ desc.prop ] = value;
    }
    throw new ReferenceError(propertyKey+' is not writable');
};

Reflect.incre=function incre(scope,target, propertyKey, flag , ns)
{
    flag = flag !== false;
    var val = Reflect.get(scope,target, propertyKey, undefined, ns );
    var ret = val+1;
    Reflect.set(scope,target, propertyKey, ret , undefined, ns );
    return flag ? val : ret;
}

Reflect.decre= function decre(scope,target, propertyKey, flag , ns )
{
    flag = flag !== false;
    var val = Reflect.get(scope,target, propertyKey, undefined, ns );
    var ret = val-1;
    Reflect.set(scope,target, propertyKey, ret , undefined, ns );
    return flag ? val : ret;
}