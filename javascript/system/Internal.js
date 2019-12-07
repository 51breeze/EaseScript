/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

module.exports =(function(
Internal,
$Object,
$Array,
$String,
$Number,
$Function,
$RegExp,
$Boolean,
$Date,
$Math,
$Error,
$SyntaxError,
$TypeError,
$EvalError,
$ReferenceError,
$JSON,
$Symbol,
$console
){

/**
 * 环境参数配置
 */
var env = Internal.env = {
    'BROWSER_IE': 'IE',
    'BROWSER_FIREFOX': 'FIREFOX',
    'BROWSER_CHROME': 'CHROME',
    'BROWSER_OPERA': 'OPERA',
    'BROWSER_SAFARI': 'SAFARI',
    'BROWSER_MOZILLA': 'MOZILLA',
    'NODE_JS': 'NODE_JS',
    'IS_CLIENT': false
};

var _platform = [];
if (typeof navigator !== "undefined") 
{
    var ua = navigator.userAgent.toLowerCase();
    var s;
    (s = ua.match(/msie ([\d.]+)/)) ? _platform = [env.BROWSER_IE, parseFloat(s[1])] :
    (s = ua.match(/firefox\/([\d.]+)/)) ? _platform = [env.BROWSER_FIREFOX, parseFloat(s[1])] :
    (s = ua.match(/chrome\/([\d.]+)/)) ? _platform = [env.BROWSER_CHROME, parseFloat(s[1])] :
    (s = ua.match(/opera.([\d.]+)/)) ? _platform = [env.BROWSER_OPERA, parseFloat(s[1])] :
    (s = ua.match(/version\/([\d.]+).*safari/)) ? _platform = [env.BROWSER_SAFARI, parseFloat(s[1])] :
    (s = ua.match(/^mozilla\/([\d.]+)/)) ? _platform = [env.BROWSER_MOZILLA, parseFloat(s[1])] : null;
    env.IS_CLIENT = true;

} else
{
    var nodejs = eval("(typeof process !== 'undefined' ? process.versions.node : 0)");
    _platform = [env.NODE_JS, nodejs];
}

/**
 * 获取当前运行平台
 * @returns {*}
 */
env.platform = function platform(name, version)
{
    if ( typeof name === "string" )
    {
        name = name.toUpperCase();
        if( version > 0 )return name == _platform[0] && env.version( version );
        return name == _platform[0];
    }
    return _platform[0];
};

/**
 * 判断是否为指定的浏览器
 * @param type
 * @returns {string|null}
 */
env.version = function version(value, expre) {
    var result = _platform[1];
    if (value == null)return result;
    value = parseFloat(value);
    switch (expre) {
        case '=' :
            return result == value;
        case '!=' :
            return result != value;
        case '>' :
            return result > value;
        case '>=' :
            return result >= value;
        case '<=' :
            return result <= value;
        case '<' :
            return result < value;
        default:
            return result <= value;
    }
};

Internal.defineProperty = $Object.defineProperty;

/**
* 定义属性描述
*/
if( !Internal.defineProperty || Internal.env.version(Internal.env.BROWSER_IE,8) )
{
    Internal.defineProperty = function defineProperty(obj, prop, desc)
    {
        if( obj == null)
        {
            throw new TypeError('target is non-object');
        }
        return obj[prop] = desc.value;
    }
}


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

var classValueMap={
    1:"Class",
    2:"Interface",
    3:"Namespace",
}
var modules = {};
Internal.defineClass=function(name,classFactory,desc,type)
{
    var p = desc["package"];
    var classname = p ? p+"."+desc.classname : desc.classname
    Internal.defineProperty(classFactory,"name",{enumerable: false, value: classname,configurable:false});
    if( type != 3 )
    {
        Internal.defineProperty(classFactory, "valueOf", { enumerable: false, value:function valueOf(){
            return "["+classValueMap[type]+" "+classname+"]";
        },configurable:false});
    }

    Internal.defineProperty(classFactory, "toString", { enumerable: false, value:function toString(){
        return "["+classValueMap[type]+" "+classname+"]";
    },configurable:false});

    Internal.defineProperty(classFactory, "constructor", { enumerable: false, value:classFactory,configurable:false});
    Internal.defineProperty(classFactory, "__CLASS__", { enumerable: false, value:name,configurable:false});
    Internal.defineProperty(classFactory, "__RESOURCETYPE__", { enumerable: false, value:type,configurable:false});
    Internal.defineProperty(classFactory, "__T__", { enumerable: false,value:desc,configurable:false});

    modules[ classname ] = classFactory;
    return classFactory;
}

Internal.getClassModule=function( name )
{
    if( modules.hasOwnProperty(name) )
    {
        return modules[name];
    }

    if( Internal.require.has(name) )
    {
        Internal.require( name );

    }else
    {
        var suffix = [".es",".html",".js"];
        var spase = Internal.env.WORKSPACE;
        name = name.replace(/\./g,'/');
        for(var i=0;i<suffix.length;i++)
        {
           if( Internal.require.has( name+suffix[i] ) )
           {
               return Internal.require( name+suffix[i] );

           }else if( Internal.require.has( spase+name+suffix[i] ) )
           {
              return Internal.require( spase+name+suffix[i] );

           }else if( Internal.require.has( "system/"+name+suffix[i] ) )
           {
              return Internal.require( "system/"+name+suffix[i] );
           }
        }
    }
    return null;
}

Internal.$Object = $Object;
Internal.$Array = $Array;
Internal.$String = $String;
Internal.$Number = $Number;
Internal.$Function = $Function;
Internal.$RegExp = $RegExp;
Internal.$Boolean = $Boolean;
Internal.$Date = $Date;
Internal.$Error = $Error;
Internal.$Math = $Math;
Internal.$SyntaxError = $SyntaxError;
Internal.$TypeError = $TypeError;
Internal.$SyntaxError = $SyntaxError;
Internal.$EvalError = $EvalError;
Internal.$ReferenceError = $ReferenceError;
Internal.$JSON = $JSON;
Internal.$Symbol = $Symbol;
Internal.$console = $console;
Internal.iteratorClassName="[CODE[ITERATOR_INTERFACE]]";
return Internal;

}({},Object,Array,String,Number,Function,RegExp,Boolean,Date,Math,Error,SyntaxError,TypeError,EvalError,ReferenceError,JSON,Symbol,console));