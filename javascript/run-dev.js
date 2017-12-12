var has = $Object.prototype.hasOwnProperty;
Object.defineProperty(System.Error.prototype,"toString",{value:function toString()
{
    return this.name+': '+this.message+'\n at '+ this.stack;
}});

Object.defineProperty(Class.prototype,"__call__",{value:function(info,target, name, argumentsList, receiver, ns)
{
        Internal.addStack(this.__T__.filename, info);
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

Object.defineProperty(Class.prototype,"__construct__",{value:function(info,target,argumentsList)
{
        Internal.addStack(this.__T__.filename, info);
        return System.Reflect.construct(target, argumentsList);
}});

Object.defineProperty(Class.prototype,"__get__",{value:function(info,target, propertyKey, receiver, ns)
{
    Internal.addStack( this.__T__.filename, info );
    return System.Reflect.get.call(this, target, propertyKey, receiver, ns );
}});

Object.defineProperty(Class.prototype,"__set__",{value:function (info,target, propertyKey, value, receiver, ns)
{
    Internal.addStack( this.__T__.filename, info);
    return System.Reflect.set.call(this, target, propertyKey, value, receiver, ns );
}});

Object.defineProperty(Class.prototype,"__has__",{value:function (info,target,name,ns)
{
    Internal.addStack( this.__T__.filename, info);
    return System.Reflect.has.call(this,target,name,ns);
}});

Object.defineProperty(Class.prototype,"__unset__",{value:function (info,target,name,thisArgument,ns)
{
    Internal.addStack( this.__T__.filename, info);
    return System.Reflect.deleteProperty.call(this,target,name,thisArgument,ns);
    
}});

Object.defineProperty(Class.prototype,"__incre__",{value:function (info, refObject, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(info,refObject, name, undefined, ns );
    var ret = val+1;
    this.__set__(info,refObject, name, ret , undefined, ns );
    return flag ? val : ret;
}});

Object.defineProperty(Class.prototype,"__decre__",{value:function (info, refObject, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(info,refObject, name, undefined, ns );
    var ret = val-1;
    this.__set__(info,refObject, name, ret , undefined, ns );
    return flag ? val : ret;
}});

Object.defineProperty(Class.prototype,"__check__",{value:function(info,type, value)
{
    Internal.addStack( this.__T__.filename, info);
    if( value == null || type === System.Object )return value;
    if ( type && !System.is(value, type) )
    {
        throw new System.TypeError( 'Specify the type of value do not match. must is "' + System.getQualifiedClassName(type)+'"' ,  this.__T__.filename )
    }
    return value;
}});