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
    storage(this,true,{
        "isIterator":isIterator,
        "target":target,
        "items": isIterator ? null : Object.prototype.getEnumerableProperties.call( target ),
        "cursor":-1,
        "key":undefined,
        "current":undefined
    });
}

module.exports = ListIterator;
var Object = require("./Object.js");
var Symbol = require("./Symbol.js");
var Internal = require("./Internal.js");
var storage=Internal.createSymbolStorage( Symbol('ListIterator') );

//@private
function callMethod(target, name)
{
    target=storage(target,"target");
    return target[name]();
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
        return storage(this,"key");
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
        return storage(this,"current");
    }},

    /**
     * 将指针定位到下一个元素。
     * 成功返回true，失败返回false
     * @returns Boolean
     */
    "next":{value:function next()
    {
        if( storage(this,"isIterator") )
        {
            return callMethod(this,"next");
        }
        var items = storage(this, "items");
        var result = false;
        var isorigin = items === storage(this, "target");
        if( items && items.length > 0 )
        {
            var cursor = storage(this, "cursor", "increment") + 1;
            result = cursor < items.length;
            if( result )
            {
                var item = items[ cursor ];
                if( isorigin )
                {
                    storage(this, "current", item );
                    storage(this, "key", cursor );

                }else
                {
                    storage(this, "current", item.value );
                    storage(this, "key", item.key );
                }

            }else if ( cursor > 0 )
            {
                this.rewind();
            }
        }
        return result;
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
            storage(this, "current", undefined);
            storage(this, "key", undefined);
            storage(this, "cursor", -1);
        }
    }}

});
