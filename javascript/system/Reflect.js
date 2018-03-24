/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Class,Object,Namespace,Error,TypeError,ReferenceError,SyntaxError
 */
var $has = $Object.prototype.hasOwnProperty;
var _construct = $Reflect ? $Reflect.construct : function (theClass,args)
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

var _apply = $Reflect ? $Reflect.apply : function(target, thisArgument, argumentsList)
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

var description = function(scope, target, name , receiver , ns, accessor)
{
    //表示获取一个类中的属性或者方法（静态属性或者静态方法）
    var isstatic = target instanceof Class;
    var objClass = target.constructor;
    if( isstatic || objClass instanceof Class )
    {
        var objClass = isstatic ? target : objClass;
        isstatic = isstatic && ( !receiver || receiver === target );
        var uri = ['_'];
        var prop;
        var obj;
        var proto;
        var i=0;
        var context = scope instanceof Class ? scope : null;

        //指定作用域
        if ( context )
        {
            uri = context.__T__.uri;
        }

        //自定义命名空间
        if (ns && ns.length > 0)
        {
            var nsitem;
            var len = ns.length;
            uri = uri.splice(1,-1);
            uri.unshift("_");
            for(;i<len;i++)
            {
                nsitem = ns[i];
                if(nsitem instanceof Namespace)uri.push( Namespace.getCodeByUri( nsitem.valueOf() ) );
            }
        }

        do{
            proto = isstatic ? objClass.__T__.method : objClass.__T__.proto;
            i = uri.length;
            while ( proto && (i--) > 0)
            {
                prop = uri[i] + name;
                obj = proto[prop];
                if( obj ){
                    //静态成员
                    if( isstatic )
                    {
                        return {"target": target, "prop": prop,"value":target[prop],  "desc": obj};
                    }
                    //实例成员
                    else
                    {
                        //实例属性
                        if( context && context.__T__.uri[0]===uri[i] )
                        {
                            var _private = context.__T__._private.valueOf();
                            if( $has.call(target[_private],name) )
                            {
                                return {
                                    "target": target[_private],
                                    "prop": name,
                                    "value": target[_private][name],
                                    "desc": proto[prop]
                                };
                            }
                        }
                        return {"target": proto, "prop": prop,"value":obj.value,  "desc": obj};
                    }
                }
                if ( accessor )
                {
                    obj = proto[ prop= accessor + prop ];
                    if (obj){
                        return accessor === "Set_" ? {"set": obj.value, "prop": prop, "desc": obj} : {"get":obj.value, "prop": prop, "desc": obj};
                    }
                }
            }

        }while ( !isstatic && (objClass = objClass.__T__["extends"]) instanceof Class );
        objClass = (objClass || Object).prototype;
        obj = objClass[name];
        if( obj ){
            return {"target":objClass, "prop": name, "value":obj, "desc": {value:obj} };
        }
    }
    return null;
};


function Reflect(){ if(this instanceof Reflect)throw new SyntaxError('Reflect is not constructor.'); }
System.Reflect=Reflect;
/**
 * 静态方法 Reflect.apply() 通过指定的参数列表发起对目标(target)函数的调用
 * @param theClass
 * @param thisArgument
 * @param argumentsList
 * @returns {*}
 */
Reflect.apply=function apply( target, thisArgument, argumentsList )
{
    if( target instanceof Class )
    {
        target = target.constructor;
    }
    if( !System.isArray(argumentsList) )
    {
        argumentsList = typeof argumentsList !== "undefined" ? [argumentsList] : [];
    }
    if( !System.isFunction( target ) )
    {
        throw new TypeError('target is not function');
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
Reflect.construct=function construct(scope, target , args )
{
    if( target instanceof Class )
    {
        if( target.abstract )
        {
            throw new TypeError('Abstract class cannot be instantiated');
        }
        target = target.constructor;
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
    if( target instanceof Class ){
        if( target.__T__.dynamic !==true )return false;
        if( target.__T__._private === propertyKey)return false;
    }
    if( $has.call(target,propertyKey) )
    {
        delete target[propertyKey];
        return true;
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
    if( propertyKey in target )return true;
    if( target instanceof Class || target.constructor instanceof Class  )
    {
        var uri=['_'];
        if( scope && scope instanceof Class )
        {
            uri = scope.__T__.uri;
        }
        var i=0;
        var len = uri.length;
        for(;i<len;i++)
        {
            if( (uri[i]+propertyKey) in target )return true;
            if( ('Get_'+uri[i]+propertyKey) in target )return true;
            if( ('Set_'+uri[i]+propertyKey) in target )return true;
        }
    }
    return false;
};

Reflect.type=function type(value, typeClass)
{
    if( value == null || typeClass === System.Object )return value;
    if ( typeClass && !System.is(value, typeClass) )
    {
        throw new System.TypeError( 'Specify the type of value do not match. must is "' + System.getQualifiedClassName(typeClass)+'"')
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
    var desc = description(scope,target,propertyKey,receiver,ns,"Get_");
    receiver = receiver || target;
    if( !desc )
    {
        //内置对象属性外部不可访问
        if( propertyKey === '__proto__' )return undefined;
        return target[propertyKey];
    }
    if( desc.get )return desc.get.call( receiver instanceof Class ? null : receiver);
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
    var desc = description(scope,target,propertyKey,receiver,ns,"Set_");
    receiver = receiver || target;
    var isstatic = receiver instanceof Class;
    if( !desc )
    {
        //内置对象属性外部不可访问
        if( propertyKey === '__proto__' )throw new ReferenceError('__proto__ is not writable');
        if( isstatic )throw new ReferenceError(propertyKey+' is not exists');
        var objClass = target.constructor;
        if( objClass instanceof Class )
        {
            if( objClass.__T__.dynamic !==true ){
                throw new ReferenceError(propertyKey+' is not exists');
            }
            var obj = target[propertyKey];
            //如果是一个动态对象并且是第一次赋值时存在此属性名则认为是原型对象上的类成员， 不能赋值。
            if( obj && !$has.call(target,propertyKey) )
            {
                throw new TypeError(propertyKey+' is not configurable');
            }

        }else if( typeof target ==="function" )
        {
            throw new TypeError(propertyKey+' is not configurable');
        }
        return target[propertyKey]=value;
    }
    if( desc.set )
    {
        return desc.set.call( isstatic ? null : receiver, value);
    }
    if( desc.desc &&  desc.desc.writable !==true  )
    {
        throw new ReferenceError(propertyKey+' is not writable');
    }
    return desc.target[ desc.prop ] = value;
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