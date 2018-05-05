var has = $Object.prototype.hasOwnProperty;
function getProtoDescByNs(name, proto, ns,scope)
{
    var desc;
    for(var i=0; i< ns.length; i++)
    {
        var n = ns[i].valueOf();
        if( has.call(proto, n ) &&  has.call( proto[n].value, name) )
        {
            if( desc )
            {
                throw new System.ReferenceError('"'+name+'" inaccessible',  scope.__T__.filename );
            }
            desc = proto[ n ];
        }
    }
    return desc;
}

function description(scope, refObject, name , thisArgument , ns, setter)
{
    var objClass = refObject.constructor;
    //表示获取一个类中的属性或者方法（静态属性或者静态方法）
    var isstatic = refObject instanceof Class;
    var desc = null;
    if( isstatic || objClass instanceof Class )
    {
        if( isstatic ) objClass = refObject;
        //是否为调用超类中的方法
        isstatic =  isstatic && thisArgument===refObject;
        var proto = isstatic ? objClass.__T__.method : objClass.__T__.proto;

        //默认命名空间
        if( has.call(proto,name) && System.Array.prototype.indexOf.call(scope.__T__.uri, proto[ name ].ns ) >=0 )
        {
            desc = proto[ name ];
            if( setter && desc.value && !has.call(desc.value,'set') )desc=null;
        }

        //自定义命名空间
        if( ns && ns.length > 0 )
        {
            var descNs = getProtoDescByNs(name,proto,ns,scope);
            if( descNs && has.call(descNs.value, name) )
            {
                if( desc )
                {
                    throw new System.ReferenceError('"'+name+'" inaccessible',  scope.__T__.filename );
                }
                desc = descNs.value[ name ];
            }
        }
        return desc || refObject[name];
    }
    return null;
}

Class.prototype.__call__=function(target, name, argumentsList, receiver, ns)
{
    if( target && name != null )
    {
        receiver = receiver || target;
        target = this.__get__(target,name,receiver,ns);
    }
    return System.Reflect.apply(target, receiver, argumentsList);
};

Class.prototype.__throw__=function( object )
{
    throw object.toString();
};

Class.prototype.__construct__=function(target,argumentsList)
{
    return System.Reflect.construct(target, argumentsList);
};

Class.prototype.__get__=function(target, propertyKey, receiver, ns)
{
    if( propertyKey==null )return target;
    if( target == null ){
        throw new System.ReferenceError('reference target is null or undefined',  this.__T__.filename );
    }
    var refType = typeof target;

    //只对一个对象进行引用操作( number or boolean 不可以)
    if( !(refType === 'object' || refType === 'function' || refType ==='string' || refType ==='regexp' ) )
    {
        throw new System.ReferenceError('reference target be not object',  this.__T__.filename );
    }

    receiver = receiver || target;

    //是否静态原型
    var isstatic = receiver instanceof Class;

    //函数的属性或者方法
    if( System.isFunction(target) )
    {
        return has.call(target,propertyKey) ? target[propertyKey] : target.prototype[propertyKey] || Object.prototype[propertyKey];
    }

    var desc = description(this,target,propertyKey,receiver,ns);
    if( !desc )
    {
        if( desc === false )return undefined;
        //如果是一个静态属性的引用报错
        if( isstatic )
        {
            throw new System.ReferenceError( '"'+propertyKey+'" is not exist',  this.__T__.filename );
        }
        return Object.prototype[propertyKey] || target[propertyKey];
    }

    //一个访问器
    var getter = desc.value && desc.value.get ? desc.value.get : desc.get;
    if( getter )
    {
        return getter.call( isstatic ? undefined : receiver);
    }

    //是否为一个实例属性
    if( !isstatic )
    {
        var _private = this.__T__.uri[0];
        if( has.call(receiver,_private) && has.call(receiver[_private],propertyKey) )
        {
            return receiver[_private][propertyKey];
        }
    }
    //实例函数 或者 静态属性 或者 静态方法
    return desc.value || desc;
};

Class.prototype.__set__=function (target, propertyKey, value, receiver, ns)
{
    if( propertyKey==null )return target;
    if( target == null )
    {
        throw new System.ReferenceError('reference target is null or undefined',  this.__T__.filename );
    }

    var refType = typeof target;
    if( !(refType === 'object' || refType === 'function') )
    {
        throw new System.ReferenceError('reference target be not object', this.__T__.filename );
    }

    receiver = receiver || target;
    var desc = description(this,target,propertyKey,receiver,ns, true);
    var isstatic = receiver instanceof Class;
    if( !desc )
    {
        if( isstatic || desc === false )
        {
            throw new System.ReferenceError( '"'+propertyKey+'" is not exist',  this.__T__.filename );
        }

        var objClass = receiver.constructor;
        var isClass =  objClass instanceof Class;

        //设置一个动态属性
        if( isClass && objClass.__T__.dynamic ===true )
        {
            return receiver[propertyKey] = value;
        }

        //如果是一个类的引用
        if( isClass )
        {
            throw new System.ReferenceError( '"'+propertyKey+'" is not exist',  this.__T__.filename );
        }

        //对象属性
        return receiver[propertyKey] = value;
    }

    //一个访问器
    var setter = desc.value && desc.value.set ? desc.value.set : desc.set;
    if( setter )
    {
        setter.call( isstatic ? undefined : receiver, value );
        return value;
    }

    //如果在类中没有定义此属性或者是一个常量
    if( !has.call(desc, "value") || desc.writable !==true )
    {
        throw new System.ReferenceError( '"'+propertyKey+'" is not writable',  this.__T__.filename );
    }

    //静态属性
    if( isstatic )
    {
        return desc.value = value;
    }

    var _private = this.__T__.uri[0];
    if (has.call(receiver, _private) && has.call(receiver[_private], propertyKey))
    {
        return receiver[_private][propertyKey] = value;
    }
    throw new System.ReferenceError( '"'+propertyKey+'" is not exist',  this.__T__.filename );
};

Class.prototype.__has__=function (target,name,ns)
{
    var desc = description(this,target,name,undefined,ns);
    if( desc === false )return false;
    if( desc )return !!desc;
    return !!target[name];
};

Class.prototype.__unset__=function (refObject,name,thisArgument,ns)
{
    thisArgument = thisArgument || refObject;
    var objClass = thisArgument.constructor;
    var isstatic = thisArgument instanceof Class;
    if( name==null || isstatic )
    {
        return false;
    }
    if( objClass instanceof Class )
    {
        if( objClass.__T__.dynamic !== true )return false;
        var proto = objClass.__T__.proto;
        if( has.call(proto, name) )
        {
            return false;
        }
        //自定义命名空间
        if( ns && ns.length > 0 )
        {
            var descNs = getProtoDescByNs(name,proto,ns);
            if( descNs && has.call(descNs.value, name) )
            {
                return false;
            }
        }
    }
    delete thisArgument[name];
};

Class.prototype.__incre__=function ( refObject, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(refObject, name, undefined, ns );
    var ret = val+1;
    this.__set__(refObject, name, ret , undefined, ns );
    return flag ? val : ret;
};

Class.prototype.__decre__=function ( refObject, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(refObject, name, undefined, ns );
    var ret = val-1;
    this.__set__(refObject, name, ret , undefined, ns );
    return flag ? val : ret;
};

Class.prototype.__check__=function(type, value)
{
    if( value == null || type === System.Object )return value;
    if ( type && !System.is(value, type) )
    {
        throw new System.TypeError( 'Specify the type of value do not match. must is "' + System.getQualifiedClassName(type)+'"' ,  this.__T__.filename )
    }
    return value;
};