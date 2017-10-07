/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object,Symbol
 */
var storage=Internal.createSymbolStorage( Symbol('iterator') );
var has = $Object.prototype.hasOwnProperty;
function Iterator( target )
{
    if( System.is(target,Iterator) )return target;
    if( !(this instanceof Iterator) )return new Iterator(target);
    storage(this,true,{
        "target":target,
        "items": Object.prototype.getEnumerableProperties.call( target || [] ),
        "cursor":-1
    });
}
System.Iterator=Iterator;
Iterator.prototype = Object.create( Object.prototype );
Iterator.prototype.constructor = Iterator;

/**
 * 返回当前的元素键名
 * @returns {Iterator.key|*|string}
 */
Iterator.prototype.key = undefined;

/**
 * 返回当前的元素值
 * @returns {*}
 */
Iterator.prototype.value = undefined;

/**
 * 返回当前指针位置的元素
 * @returns {*}
 */
Iterator.prototype.current = undefined;

/**
 * 将指针向前移动一个位置并返回当前元素
 * @returns object{key:'keyname',value:'value'} | false;
 */
Iterator.prototype.seek=function seek()
{
    var items = storage(this,"items");
    var cursor = storage(this,"cursor");
    storage(this,"cursor", ++cursor );
    if( items.length <= cursor )
    {
        this.key = undefined;
        this.value = undefined;
        this.current = undefined;
        return false;
    }
    var current = items[ cursor ];
    this.current = current;
    this.key = current.key;
    this.value = current.value;
    return current;
};

/**
 * 返回上一个指针位置的元素
 * 如果当前指针位置在第一个则返回false
 * @returns {*}
 */
Iterator.prototype.prev=function prev()
{
    var cursor = storage(this,"cursor");
    if( cursor < 1 )return false;
    var items = storage(this,"items");
    return items[ cursor-1 ];
};

/**
 * 返回下一个指针位置的元素。
 * 如果当前指针位置在最后一个则返回false
 * @returns {*}
 */
Iterator.prototype.next=function next()
{
    var cursor = storage(this,"cursor");
    var items = storage(this,"items");
    if( cursor >= items.length )return false;
    return items[ cursor+1 ];
};

/**
 * 将指针移到到指定的位置并返回当前位置的元素
 * @param cursor
 * @returns {*}
 */
Iterator.prototype.move=function move( cursor )
{
    cursor=cursor >> 0;
    var items = storage(this,"items");

    if( cursor < 0 )
    {
        cursor = items.length+cursor;
    }
    if( cursor < 0 || cursor >= items.length )return false;
    storage(this, "cursor", cursor);
    var current = items[ cursor ];
    this.current = current;
    this.key = current.key;
    this.value = current.value;
    return current;
};

/**
 * 重置指针
 * @returns {Iterator}
 */
Iterator.prototype.reset=function reset()
{
    this.key = undefined;
    this.value = undefined;
    this.current = undefined;
    storage(this,"cursor", -1);
    return this;
};