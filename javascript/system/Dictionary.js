/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Symbol,Object
 */

var storage=Internal.createSymbolStorage( Symbol('dictionary') );
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


/**
 * 可以使用非字符串作为键值的存储表
 * @constructor
 * @require Object,Symbol
 */
function Dictionary()
{
    if( !(this instanceof Dictionary) )
        return new Dictionary();
    storage(this,true,{map:[]});
}

/**
 * 设置指定键值的数据,如果相同的键值则会覆盖之前的值。
 * @param key
 * @param value
 * @returns {Dictionary}
 */
Dictionary.prototype.set=function(key,value)
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
};

/**
 * 获取已设置的值
 * @param key
 * @returns {*}
 */
Dictionary.prototype.get=function( key , defualt)
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
};

/**
 * 返回所有已设置的数据
 * 数组中的每个项是一个对象
 * @returns {Array}
 */
Dictionary.prototype.getAll=function()
{
    return storage(this,'map');
};

/**
 * 返回有的key值
 * @returns {Array}
 */
Dictionary.prototype.keys=function()
{
    var map = storage(this,'map');
    var value=[],i;
    for( i in map )
    {
        value.push(map[i].key);
    }
    return value;
};

/**
 * 返回有键的值
 * @returns {Array}
 */
Dictionary.prototype.values=function()
{
    var map = storage(this,'map');
    var value=[],i;
    for( i in map )
    {
        value.push(map[i].value);
    }
    return value;
};

/**
 * 删除已设置过的对象,并返回已删除的值（如果存在）否则为空。
 * @param key
 * @returns {*}
 */
Dictionary.prototype.remove=function( key )
{
    var map = storage(this,'map');
    var index = indexByKey(map,key);
    if( index >=0 )
    {
        return map.splice(index,1);
    }
    return null;
};

/**
 * 返回已设置数据的总数
 * @returns {Number}
 */
Dictionary.prototype.count=function()
{
    var map = storage(this,'map');
    return map.length;
}

System.Dictionary=Dictionary;
