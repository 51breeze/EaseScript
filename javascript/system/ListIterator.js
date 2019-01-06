/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object,Symbol,TypeError,Reflect,Internal
 */
var storage=Internal.createSymbolStorage( Symbol('ListIterator') );
var has = $Object.prototype.hasOwnProperty;

//@private
function callMethod(target, name)
{
    target=storage(target,"target");
    return target["_"+name]();
}

function ListIterator( target )
{
    if( target instanceof ListIterator )return target;
    if( !(this instanceof ListIterator) )return new ListIterator(target);
    var isIterator = false;
    //如果是一个类则有可能实现迭代器接口
    if( target && target.constructor && Internal.iteratorClass && target.constructor instanceof System.Class )
    {
        isIterator = System.is(object, System.getDefinitionByName( Internal.iteratorClass ) );
    }

    storage(this,true,{
        "isIterator":isIterator,
        "target":target,
        "items": isIterator ? [] : Object.prototype.getEnumerableProperties.call( target || [] ),
        "cursor":-1,
        "key":undefined,
        "current":undefined
    });
}
System.ListIterator=ListIterator;
ListIterator.prototype = Object.create( Object.prototype );
ListIterator.prototype.constructor=ListIterator;

/**
 * 返回当前的元素键名
 * @returns {ListIterator.key|*|string}
 */
ListIterator.prototype.key = function key()
{
    if( storage(this,"isIterator") )
    {
        return callMethod(this,"key");
    }
    return storage(this,"key");
};

/**
 * 返回当前指针位置的元素
 * @returns {*}
 */
ListIterator.prototype.current = function current()
{
    if( storage(this,"isIterator") )
    {
        return callMethod(this,"current");
    }
    return storage(this,"current");
};

/**
 * 将指针定位到下一个元素。
 * 成功返回true，失败返回false
 * @returns Boolean
 */
ListIterator.prototype.next=function next()
{
    if( storage(this,"isIterator") )
    {
        return callMethod(this,"next");
    }
    var items = storage(this, "items");
    var result = false;
    if( items.length > 0 )
    {
        var cursor = storage(this, "cursor", "increment") + 1;
        result = cursor < items.length;
        if( result )
        {
            var item = items[ cursor ];
            storage(this, "current", item.value );
            storage(this, "key", item.key );

        }else if ( cursor > 0 )
        {
            this.rewind();
        }
    }
    return result;
};

/**
 * 重置指针
 * @returns {ListIterator}
 */
ListIterator.prototype.rewind=function rewind()
{
    if( storage(this,"isIterator") )
    {
        callMethod(this,"rewind");

    }else
    {
        storage(this, "current", undefined);
        storage(this, "key", undefined);
        storage(this, "cursor", -1);
    }
};