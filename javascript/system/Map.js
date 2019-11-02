/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Symbol,Object
 */


/**
 * 可以使用非字符串作为键值的存储表
 * @constructor
 */
function Map()
{
    if( !(this instanceof Map) )
        return new Map();
    storage(this,true,{map:[]});
}

module.exports = Map;
var Object = require("./Object.js");
var Internal = require("./Internal.js");
var Symbol = require("./Symbol.js");
var ListIterator = require("./ListIterator.js");
var storage=Internal.createSymbolStorage( Symbol('Map') );

function indexByKey(map,key)
{
    var i = 0,len=map.length
    for(; i<len; i++)
    {
        if( map[i].key===key )
        {
            return i;
        }
    }
    return -1;
};

Map.prototype = Object.create( Object.prototype, {

/**
 * 设置指定键值的数据,如果相同的键值则会覆盖之前的值。
 * @param key
 * @param value
 * @returns {Dictionary}
 */
"set":{value:function set(key,value)
{
    var map =  storage(this,'map');
    var index = indexByKey(map,key);
    if( index < 0 )
    {
        map.push({'key':key,'value':value});
    }else
    {
        map[index].value=value;
    }
    return value;
}},

/**
 * 获取已设置的值
 * @param key
 * @returns {*}
 */
"get":{value:function get( key , defualt)
{
    var map =  storage(this,'map');
    var index = indexByKey(map,key);
    if( index >= 0 )
    {
       return map[index].value;

    }else if( typeof defualt !== "undefined" )
    {
        map.push({'key':key,'value':defualt});
        return defualt;
    }
    return undefined;
}},

/**
 * 返回所有已设置的数据
 * 数组中的每个项是一个对象
 * @returns {Array}
 */
"entries":{value:function entries()
{
    return new ListIterator( storage(this,'map') );
}},

/**
 * 返回所有已设置的数据
 * 数组中的每个项是一个对象
 * @returns {Array}
 */
"forEach":{value:function forEach(callback,thisObj)
{
    var map = storage(this,'map');
    var len = map.length;
    var i=0;
    while( i<len )
    {
       var item = map[i++];
       callback.call(thisObj||null,  item.value, item.key, this);
    }
}},

/**
 * 返回有的key值
 * @returns {Array}
 */
"keys":{value:function keys()
{
    var map = storage(this,'map');
    var value=[],i;
    for( i in map )
    {
        value.push(map[i].key);
    }
    return value;
}},

/**
 * 返回有键的值
 * @returns {Array}
 */
"values":{value:function values()
{
    var map = storage(this,'map');
    var value=[],i;
    for( i in map )
    {
        value.push(map[i].value);
    }
    return value;
}},

/**
 * 删除已设置过的对象,并返回已删除的值（如果存在）否则为空。
 * @param key
 * @returns {*}
 */
"delete":{value:function( key )
{
    var map = storage(this,'map');
    var index = indexByKey(map,key);
    if( index >=0 )
    {
        delete map.splice(index,1);
        return true;
    }
    return false;
}},

/**
 * 返回已设置数据的总数
 * @returns {Number}
 */
"size":{value:function size()
{
    var map = storage(this,'map');
    return map.length;
}},

/**
 * 返回已设置数据的总数
 * @returns {Number}
 */
"has":{value:function has()
{
    var map = storage(this,'map');
    return indexByKey(map,key) >= 0;
}},

/**
 * 返回已设置数据的总数
 * @returns {Number}
 */
"clear":{value:function clear()
{
    var map = storage(this,'map');
    var len = map.length;
    var i=0;
    while( i<len )
    {
       delete map.splice(i,1);
    }
}}

});

Object.defineProperty(Map.prototype["delete"],"name",{value:"delete"});