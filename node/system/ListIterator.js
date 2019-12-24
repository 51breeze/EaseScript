/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object,Symbol,Internal
 */

function ListIterator( target )
{
    if( target instanceof ListIterator )return target;
    if( !(this instanceof ListIterator) )return new ListIterator(target);
    var iteratorClass = Internal.getClassModule( Internal.iteratorClassName );
    var isIterator = target && iteratorClass && System.is(target, iteratorClass );
    var origin = false;
    if( target && Symbol.iterator && target[Symbol.iterator] )
    {
        var itarget = target[Symbol.iterator]();
        if( typeof itarget.next ==="function" )
        {
            target = itarget;
            isIterator = true;
            origin = true;
        }
    }

    storage(this,true,{
        "origin":origin,
        "isIterator":isIterator,
        "target":target,
        "items": isIterator ? null : Object.prototype.getEnumerableProperties.call( target ),
        "cursor":0,
        "done":false,
        "key":undefined,
        "current":undefined
    });
}

module.exports = ListIterator;
var Object = require("./Object.js");
var Symbol = require("./Symbol.js");
var System = require("./System.js");
var Internal = require("./Internal.js");
var storage=Internal.createSymbolStorage( Symbol('ListIterator') );

function next(thisArg)
{
    var target = storage(thisArg, "target");
    var current = target.next();
    if(current.done===true)
    {
        storage(thisArg,"current", undefined );
        storage(thisArg,"key", undefined );
        storage(thisArg, "cursor", 0 );
        storage(thisArg, "done", true);
        return false;

    }else
    {
       storage(thisArg,"current", current.value );
       if( current.key ){
           storage(thisArg,"key", current.key );
       }else{
           storage(thisArg,"key", storage(thisArg, "cursor") );
       }
    }
    storage(thisArg, "cursor", "increment");
}

//@private
function callMethod(thisArg, name)
{
    target=storage(thisArg,"target");
    if( storage(thisArg,"origin") )
    {
        if( storage(thisArg, "cursor") < 1 || name ==="next" )
        {
            next(thisArg);
        }
        if( name ==="valid" )
        {
            return storage(thisArg,"done") !== true;
        }
        return name ==="next" ? null : storage(thisArg,name);

    }else
    {
        return target[name]();
    }
}

ListIterator.prototype = Object.create( Object.prototype, {

    "constructor":{value:ListIterator},

    /**
     * 返回当前的元素键名
     * @returns {ListIterator.key|*|string}
     */
    "key":{value:function key()
    {
        if( storage(this,"isIterator") )
        {
            return callMethod(this,"key");
        }

        var items = storage(this, "items");
        var isorigin = items === storage(this, "target");
        var cursor = storage(this, "cursor");
        if( items && items.length > cursor )
        {
            var item = items[ cursor ];
            if( isorigin )
            {
                return cursor;

            }else
            {
                return item.key || cursor;
            }
        }
        return null;

    }},

    /**
     * 返回当前指针位置的元素
     * @returns {*}
     */
    "current":{value:function current()
    {
        if( storage(this,"isIterator") )
        {
            return callMethod(this,"current");
        }

        var items = storage(this, "items");
        var isorigin = items === storage(this, "target");
        var cursor = storage(this, "cursor");
        if( items && items.length > cursor )
        {
            var item = items[ cursor ];
            if( isorigin )
            {
                return item;
            }else
            {
                return item.value;
            }
        }
        return null;
    }},

    /**
     * 将指针定位到下一个元素。
     * @returns
     */
    "next":{value:function next()
    {
        if( storage(this,"isIterator") )
        {
            return callMethod(this,"next");
        }
        storage(this, "cursor", "increment");
    }},

    /**
     * 重置指针
     * @returns {ListIterator}
     */
    "rewind":{value:function rewind()
    {
        if( storage(this,"isIterator") )
        {
            callMethod(this,"rewind");

        }else
        {
            storage(this, "cursor", 0);
            storage(this, "done", false);
        }
    }},

    /**
     * 重置指针
     * @returns {Boolean}
     */
    "valid":{value:function valid()
    {
        if( storage(this,"isIterator") )
        {
            return !!callMethod(this,"valid");

        }else
        {
            var items = storage(this, "items");
            if( items && items.length > 0 )
            {
                return storage(this, "cursor") < items.length;
            }
        }
        return false;
    }}

});
