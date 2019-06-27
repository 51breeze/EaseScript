var _stack = [];
Internal.addStack =function (filename, info){
    if( !info )return;
    _stack.push(info.replace(/(\:\d+\:\d+)$/, function (a,b) {
        return ' ('+filename+b+')';
    }));
    if( _stack.length > 10 )_stack.shift();
}
Internal.getStack =function()
{
    return _stack;
}

var contextModules = {};
var installedModules = {};
var has = Object.prototype.hasOwnProperty;

/**
 * 返回一个包的名称
 * @param name
 */
function getPackageName( name )
{
    var index = name.lastIndexOf(".");
    return index > 0 ? name.substr(0, index) : '';
}
Internal.getContext=getPackageName;

/**
 * 根据指定的类名返回一个所在的上下文对象
 * @param name 
 */
function getContext( name )
{
    var key = '/'+getPackageName(name);
    return has.call(contextModules,key) ? contextModules[key] : contextModules[key]={};
}
Internal.getContext=getContext;

/**
 * 获取类名
 * @param name 
 */
function getClassName(name)
{
    return name.substr( name.lastIndexOf(".")+1 );
}
Internal.getClassName=getClassName;

/**
 * 根据指定的类名返回类模块对象
 * @param  name 
 */
function getClassModule(name)
{
    var key = '/'+getPackageName(name);
    if( has.call(contextModules,key) )
    {
        var classname = getClassName(name);
        if( has.call(contextModules[key],classname ) )
        {
            return contextModules[key][ classname ]
        }
    }
    return null;
}
Internal.getClassModule=getClassModule;

/**
 * 生成一个类模块对象
 * @param {*} fullClassName 
 */
function createModule( fullClassName )
{
    var context = getContext( fullClassName );
    var classname = getClassName( fullClassName );
    if( context[classname] )
    {
        throw new ReferenceError( "\""+fullClassName+"\" class already exists.");
    }
    return context[classname] = {
        "name": fullClassName,
        "privateSymbol":System.Symbol(name).valueOf()
    };
}
Internal.createModule=createModule;

function require( fullClassName)
{
    var context = getContext( fullClassName );
    var classname = getClassName( fullClassName );
    if( context[classname] )
    {
        return context[classname].exports;
    }
    if( has.call(installedModules,fullClassName) )
    {
        var module = context[classname] = {
            "name": fullClassName,
            "privateSymbol":System.Symbol(name).valueOf()
        };
        installedModules[ fullClassName ].call(context,module,require);
        return module.exports;

    }else
    {
        throw new System.ReferenceError("require \""+fullClassName+"\" is not found.");
    }
}

var classValueMap={
    1:"Class",
    2:"Interface",
    3:"Namespace",
}

require.define=function(name,module,classFactory,type)
{
    Object.defineProperty(module, "exports", { enumerable: false, value: classFactory,configurable:false });
    Object.defineProperty(classFactory, "name", { enumerable: false, value: name,configurable:false });
    if( type != 3 )
    {
        Object.defineProperty(classFactory, "valueOf", { enumerable: false, value:function valueOf(){
            return "["+classValueMap[type]+" "+name+"]";
        },configurable:false});

        Object.defineProperty(classFactory, "toString", { enumerable: false, value:function toString(){
            return "["+classValueMap[type]+" "+name+"]";
        },configurable:false});
    }
    Object.defineProperty(classFactory, "constructor", { enumerable: false, value:classFactory,configurable:false});
    Object.defineProperty(classFactory, "__CLASS__", { enumerable: false, value:name,configurable:false});
    Object.defineProperty(classFactory, "__RESOURCETYPE__", { enumerable: false, value:type,configurable:false});
    Object.defineProperty(classFactory, "__T__", { enumerable: false,value:module,configurable:false});
    return classFactory;
}

Internal.require = require;


/**
 * 初始化一个起始组件模块
 */
Internal.initiator=function( modules )
{
    installedModules = modules;
}

/**
 * 注册本地模块
 */
Internal.register=function( modules )
{
    for(var name in modules)
    {
        installedModules[ name ] = modules[ name ];
    }
    return modules;
}

/**
 * 创建一个私有标识的对象
 */
Internal.createSymbolStorage=function(symbol)
{
    return function(target, name, value )
    {
        if( name === true )
        {
            target[ symbol ]=value;
            return value;
        }
        var data = target[ symbol ];
        if( !data )
        {
            data={};
            target[ symbol ]=data;
        }
        if( typeof value !== "undefined" )
        {
            if( typeof data[ name ] === "number" )
            {
                if (value === "increment")return data[name]++;
                if (value === "decrement")return data[name]--;
            }
            data[ name ]=value;
            return value;
        }
        return name==null ? data : data[ name ];
    }
};




