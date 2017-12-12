var has = $Object.prototype.hasOwnProperty;
Object.defineProperty(Class.prototype,"__call__",{value:function(target, name, argumentsList, receiver, ns)
{
    var fn = target;
    if (target && name != null)
    {
        fn =  System.Reflect.get.call(this,target, name, receiver, ns);
    }
    return System.Reflect.apply(fn, receiver||target, argumentsList);
}});

Object.defineProperty(Class.prototype,"__throw__",{value:function( object )
{
    throw object.toString();
}});

Object.defineProperty(Class.prototype,"__construct__",{value:function(target,argumentsList)
{
    return System.Reflect.construct(target, argumentsList);
}});

Object.defineProperty(Class.prototype,"__get__",{value:function(target, propertyKey, receiver, ns)
{
    return System.Reflect.get.call(this, target, propertyKey, receiver, ns );
}});

Object.defineProperty(Class.prototype,"__set__",{value:function (target, propertyKey, value, receiver, ns)
{
    return System.Reflect.set.call(this, target, propertyKey, value, receiver, ns );
}});

Object.defineProperty(Class.prototype,"__has__",{value:function (target,name,ns)
{
    return System.Reflect.has.call(this,target,name,ns);
}});

Object.defineProperty(Class.prototype,"__unset__",{value:function (target,name,thisArgument,ns)
{
    return System.Reflect.deleteProperty.call(this,target,name,thisArgument,ns);
}});

Object.defineProperty(Class.prototype,"__incre__",{value:function (refObject, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(refObject, name, undefined, ns );
    var ret = val+1;
    this.__set__(refObject, name, ret , undefined, ns );
    return flag ? val : ret;
}});

Object.defineProperty(Class.prototype,"__decre__",{value:function (refObject, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(refObject, name, undefined, ns );
    var ret = val-1;
    this.__set__(refObject, name, ret , undefined, ns );
    return flag ? val : ret;
}});

Object.defineProperty(Class.prototype,"__check__",{value:function(type, value)
{
    if( value == null || type === System.Object )return value;
    if ( type && !System.is(value, type) )
    {
        throw new System.TypeError( 'Specify the type of value do not match. must is "' + System.getQualifiedClassName(type)+'"' ,  this.__T__.filename )
    }
    return value;
}});