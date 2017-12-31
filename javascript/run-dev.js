var has = $Object.prototype.hasOwnProperty;
Object.defineProperty(System.Error.prototype,"toString",{value:function toString()
{
    return this.name+': '+this.message+'\n at '+ this.stack;
}});
Reflect._call=function(info,scope,target, name, argumentsList, receiver, ns)
{
    Internal.addStack(scope.__T__.filename, info);
    if( name )
    {
        return Reflect.call(scope,target, name, argumentsList, receiver, ns);
    }
    return Reflect.apply(target,receiver,argumentsList);
};

Reflect._construct=function(info,scope,target,argumentsList)
{
     Internal.addStack(scope.__T__.filename, "new "+info);
     return Reflect.construct(target, argumentsList);
};

Reflect._get=function(info,scope,target, propertyKey, receiver, ns)
{
    Internal.addStack( scope.__T__.filename, info );
    return Reflect.get(scope, target, propertyKey, receiver, ns );
};

Reflect._set=function (info,scope,target, propertyKey, value, receiver, ns)
{
    Internal.addStack( scope.__T__.filename, info);
    return Reflect.set(scope, target, propertyKey, value, receiver, ns );
};

Reflect._has=function (info,scope,target,name)
{
    Internal.addStack( scope.__T__.filename, info);
    return Reflect.has(scope,target,name);
};

Reflect._deleteProperty=function (info,scope,target,name)
{
    Internal.addStack( scope.__T__.filename, info);
    return Reflect.deleteProperty(target,name);
};

Reflect._incre=function (info,scope, target, name, flag , ns )
{
    Internal.addStack( scope.__T__.filename, info);
    return Reflect.incre(scope, target, name, flag , ns);
};

Reflect._decre=function (info,scope, target, name, flag , ns )
{
    Internal.addStack( scope.__T__.filename, info);
    return Reflect.decre(scope, target, name, flag , ns);
};

Reflect._type=function(info,scope , type, value)
{
    Internal.addStack(scope.__T__.filename, info);
    return Reflect.type( value, type);
};