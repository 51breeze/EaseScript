/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

var Internal = {};
module.exports = Internal;
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
var Object = require("./Object.js");
Internal.defineClass=function(name,classFactory,desc,type)
{
    Object.defineProperty(classFactory,"name",{enumerable: false, value: name,configurable:false});
    if( type != 3 )
    {
        Object.defineProperty(classFactory, "valueOf", { enumerable: false, value:function valueOf(){
            return "["+classValueMap[type]+" "+name+"]";
        },configurable:false});
    }

    Object.defineProperty(classFactory, "toString", { enumerable: false, value:function toString(){
        return "["+classValueMap[type]+" "+name+"]";
    },configurable:false});

    Object.defineProperty(classFactory, "constructor", { enumerable: false, value:classFactory,configurable:false});
    Object.defineProperty(classFactory, "__CLASS__", { enumerable: false, value:name,configurable:false});
    Object.defineProperty(classFactory, "__RESOURCETYPE__", { enumerable: false, value:type,configurable:false});
    Object.defineProperty(classFactory, "__T__", { enumerable: false,value:desc,configurable:false});
    return classFactory;
}