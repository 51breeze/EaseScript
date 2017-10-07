/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Class,Object,Internal.$get,Internal.$set,Error,TypeError,ReferenceError,SyntaxError
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
        case 4 :
            return new theClass(args[0], args[1], args[2], args[3]);
        case 5 :
            return new theClass(args[0], args[1], args[2], args[3], args[4]);
        case 6 :
            return new theClass(args[0], args[1], args[2], args[3], args[4], args[5]);
        case 7 :
            return new theClass(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        case 8 :
            return new theClass(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        case 9 :
            return new theClass(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
        case 10:
            return new theClass(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
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

var getProtoDescByNs = function(name, proto, ns)
{
    var desc;
    for(var i=0; i< ns.length; i++)
    {
        var n = ns[i].valueOf();
        if( $has.call(proto, n ) &&  $has.call( proto[n].value, name) )
        {
            if( desc )
            {
                throw new System.ReferenceError('"'+name+'" inaccessible');
            }
            desc = proto[ n ];
        }
    }
    return desc;
};

var description = function(scope, target, name , receiver , ns)
{
    var objClass = target.constructor;
    //表示获取一个类中的属性或者方法（静态属性或者静态方法）
    var isstatic = target instanceof Class;
    var desc = null;
    if( isstatic || objClass instanceof Class )
    {
        if( isstatic ) objClass = target;
        //是否为调用超类中的方法
        isstatic =  isstatic && receiver===target;
        var proto = isstatic ? objClass.__T__.method : objClass.__T__.proto;
        var uri = scope instanceof Class ? scope.__T__.uri : [ objClass.__T__.uri[3] ];
        //默认命名空间
        if( $has.call(proto,name) && System.Array.prototype.indexOf.call(uri, proto[ name ].ns ) >=0 )
        {
            desc = proto[ name ];
        }
        //自定义命名空间
        if( ns && ns.length > 0 )
        {
            var descNs = getProtoDescByNs(name,proto,ns);
            if( descNs && has.call(descNs.value, name) )
            {
                if( desc )
                {
                    throw new ReferenceError('"'+name+'" inaccessible');
                }
                desc = descNs.value[ name ];
            }
        }
        return desc;
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
Reflect.apply=function apply( theClass, thisArgument, argumentsList )
{
    if( theClass instanceof Class )
    {
        theClass = theClass.constructor;
    }
    return _apply(theClass, thisArgument, argumentsList || [] );
};

/**
 * Reflect.construct() 方法的行为有点像 new 操作符 构造函数 ， 相当于运行 new target(...args).
 * @param target
 * @param argumentsList
 * @returns {*}
 */
Reflect.construct=function construct(theClass, args )
{
    if( theClass instanceof Class )
    {
        if( theClass.abstract )
        {
            throw new TypeError('Abstract class cannot be instantiated');
        }
        theClass = theClass.constructor;
    }
    return _construct(theClass, args || []);
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
    if( target instanceof Class )return false;
    if( target.constructor instanceof Class )
    {
        var objClass = target.constructor;
        var token = objClass.__T__.uri[0];
        if( !objClass.__T__.dynamic || token === propertyKey )return false;
    }
    if( propertyKey != null && $has.call(target,propertyKey) )
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
Reflect.has=function has(target, propertyKey, ns)
{
    if( propertyKey==null || target == null )return false;
    var desc = description(this,target,propertyKey,undefined,ns);
    if( desc )return !!desc;
    return propertyKey in target;
};

/**
 * 获取目标公开的属性值
 * @param target
 * @param propertyKey
 * @returns {*}
 */
Reflect.get=function(target, propertyKey, receiver , ns)
{
    if( propertyKey==null )return target;
    if( target == null )throw new ReferenceError('target is null or undefined');
    receiver = receiver || target;
    //是否静态原型
    var isstatic = receiver instanceof Class;
    var desc = description(this,target,propertyKey,receiver,ns);
    if( !desc )
    {
        //如果是一个静态属性的引用报错
        if( isstatic )
        {
            throw new ReferenceError( '"'+propertyKey+'" is not exist');
        }

        //内置对象属性外部不可访问
        if( propertyKey === '__proto__' )
        {
            return undefined;
        }

        if( System.isFunction(target) )
        {
            return $has.call(target,propertyKey) ? target[propertyKey] : target.prototype[propertyKey] || Object.prototype[propertyKey];
        }
        return Object.prototype[propertyKey] || target[propertyKey];
    }

    //一个访问器
    var getter = desc.value && desc.value.get ? desc.value.get : desc.get;
    if( getter )
    {
        return getter.call(isstatic ? undefined : receiver);
    }

    //是否为一个实例属性
    if( !isstatic )
    {
        var objClass = target instanceof Class ? target : target.constructor;
        var _private = objClass.__T__.uri[0];
        if( $has.call(receiver,_private) && $has.call(receiver[_private],propertyKey) )
        {
            return receiver[_private][propertyKey];
        }
    }
    //实例函数 或者 静态属性 或者 静态方法
    return desc.value || desc;
};

/**
 * 设置目标公开的属性值
 * @param target
 * @param propertyKey
 * @param value
 * @returns {*}
 */
Reflect.set=function(target, propertyKey, value , receiver ,ns )
{
    if( propertyKey==null )return target;
    if( target == null )throw new ReferenceError('target is null or undefined');
    receiver = receiver || target;
    //是否静态原型
    var isstatic = receiver instanceof Class;
    var desc = description(this,target,propertyKey,receiver,ns);
    if( !desc )
    {
        //如果是一个静态属性的引用报错
        if( isstatic || propertyKey==='__proto__' || !$has.call(target,propertyKey) )
        {
            throw new ReferenceError( '"'+propertyKey+'" is not exist');
        }

        var objClass = receiver.constructor;
        var isClass =  objClass instanceof Class;

        //设置一个动态属性
        if( isClass && objClass.__T__.dynamic === true )
        {
            return receiver[propertyKey] = value;
        }

        //如果是一个类的引用
        if( isClass )
        {
            throw new ReferenceError( '"'+propertyKey+'" is not exist');
        }
        return target[propertyKey]=value;
    }

    //一个访问器
    var setter = desc.value && desc.value.set ? desc.value.set : desc.set;
    if( setter )
    {
        return setter.call(isstatic ? undefined : receiver, value);
    }

    //如果在类中没有定义此属性或者是一个常量
    if( !$has.call(desc, "value") || desc.writable !==true )
    {
        throw new ReferenceError( '"'+propertyKey+'" is not writable');
    }

    //静态属性
    if( isstatic )
    {
        return desc.value = value;
    }
    var objClass = target instanceof Class ? target : target.constructor;
    var _private = objClass.__T__.uri[0];
    if( $has.call(receiver,_private) && $has.call(receiver[_private],propertyKey) )
    {
        return receiver[_private][propertyKey]=value;
    }
    throw new ReferenceError( '"'+propertyKey+'" is not exist');
};