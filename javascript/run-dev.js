var has = $Object.prototype.hasOwnProperty;
Object.defineProperty(System.Error.prototype,"toString",{value:function toString()
{
    return this.name+': '+this.message+'\n at '+ this.stack;
}});

Object.defineProperty(Class.prototype,"__call__",{value:function(info,target, name, argumentsList, receiver, ns)
{
        Internal.addStack(this.__T__.filename, info);
        if( name ){
            return Reflect.call(this,target, name, argumentsList, receiver, ns);
        }
        return Reflect.apply(target,receiver,argumentsList);
}});

Object.defineProperty(Class.prototype,"__construct__",{value:function(info,target,argumentsList)
{
        Internal.addStack(this.__T__.filename, "new "+info);
        return Reflect.construct(target, argumentsList);
}});

Object.defineProperty(Class.prototype,"__get__",{value:function(info,target, propertyKey, receiver, ns)
{
    Internal.addStack( this.__T__.filename, info );
    return Reflect.get(this, target, propertyKey, receiver, ns );
}});

Object.defineProperty(Class.prototype,"__set__",{value:function (info,target, propertyKey, value, receiver, ns)
{
    Internal.addStack( this.__T__.filename, info);
    return Reflect.set(this, target, propertyKey, value, receiver, ns );
}});

Object.defineProperty(Class.prototype,"__has__",{value:function (info,target,name)
{
    Internal.addStack( this.__T__.filename, info);
    return Reflect.has(target,name);
}});

Object.defineProperty(Class.prototype,"__unset__",{value:function (info,target,name)
{
    Internal.addStack( this.__T__.filename, info);
    return Reflect.deleteProperty(target,name);
    
}});

Object.defineProperty(Class.prototype,"__incre__",{value:function (info, target, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(info,target, name, undefined, ns );
    var ret = val+1;
    this.__set__(info,target, name, ret , undefined, ns );
    return flag ? val : ret;
}});

Object.defineProperty(Class.prototype,"__decre__",{value:function (info, target, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(info,target, name, undefined, ns );
    var ret = val-1;
    this.__set__(info,target, name, ret , undefined, ns );
    return flag ? val : ret;
}});

Object.defineProperty(Class.prototype,"__check__",{value:function(info,type, value)
{
    Internal.addStack(this.__T__.filename, info);
    return Reflect.type( value, type);
}});