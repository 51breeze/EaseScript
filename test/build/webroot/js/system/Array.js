/*
* Copyright © 2017 EaseScript All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/EaseScript
* @author Jun Ye <664371281@qq.com>
* @require System,Object,ReferenceError,TypeError
*/
function Array(length)
{
    if( !(this instanceof Array) )
    {
        var obj = new Array();
        $Array.apply(obj , Array.prototype.slice.call(arguments, 0) );
        return obj;
    }
    $Array.call(this);
    if( arguments.length > 0 )
    {
        if( typeof length === 'number' && arguments.length===1 )
        {
            this.length = length;
        }else
        {
            Array.prototype.splice.apply(this, [0,0].concat( Array.prototype.slice.call(arguments,0) ) );
        }
    }
    return this;
};

module.exports = Array;
var Internal =require("system/Internal.es");
var System =require("system/System.es");
var Object =require("system/Object.es");
var ReferenceError =require("system/ReferenceError.es");
var TypeError =require("system/TypeError.es");
var $Array = Internal.$Array;

Array.prototype = Object.create( Object.prototype,{
    "constructor":{value:Array},  
    /**
     * 返回此对象的字符串
     * @returns {*}
     */
    "toString":{value:function toString()
    {
        if( this.constructor === Array ){
            return "[object Array]";
        }
        return Object.prototype.toString.call(this);
    }},

    /**
     * 返回此对象的数据值
     * @returns {*}
     */
    "valueOf":{value:function valueOf()
    {
        if( this.constructor === Array ){
            return this.slice(0);
        }
        return Object.prototype.valueOf.call(this);
    }},
    "length":{value:0,writable:true},
    "slice":{value:$Array.prototype.slice},
    "concat":{value:$Array.prototype.concat},
    "splice":{value:$Array.prototype.splice},
    "join":{value:$Array.prototype.join},
    "pop":{value:$Array.prototype.pop},
    "push":{value:$Array.prototype.push},
    "shift":{value:$Array.prototype.shift},
    "unshift":{value:$Array.prototype.unshift},
    "sort":{value:$Array.prototype.sort},
    "reverse":{value:$Array.prototype.reverse},
    "toLocaleString":{value:$Array.prototype.toLocaleString},
    "indexOf":{value:$Array.prototype.indexOf},
    "lastIndexOf":{value:$Array.prototype.lastIndexOf},
    "map":{value:$Array.prototype.map},

    /**
     * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
     * @param callback 一个回调函数。
     * 参数中的第一个为属性值，第二个为属性名。
     * 如果返回 false 则退出循环
     * @returns {Object}
     */
    "forEach":{value:$Array.prototype.forEach || function forEach(callback, thisArg)
        {
            if (!System.isFunction(callback)) throw new TypeError(callback + " is not a function");
            if (this == null) throw new ReferenceError('this is null or not defined');
            var i = 0;
            var len = this.length;
            for(;i<len;i++)
            {
                callback.call(thisArg||this, this[i], i );
            }
            return this;
        }
    },


    /**
     * 方法使用指定的函数测试所有元素，并创建一个包含所有通过测试的元素的新数组。
     * @param callback
     * @param thisArg
     * @returns {Array}
     */
    "filter":{value:$Array.prototype.filter || function filter(callback, thisArg)
        {
            if (typeof callback !== 'function')throw new TypeError('callback must be a function');
            if (this==null)throw new ReferenceError('this is null or not defined');
            var items = new Array();
            var obj = System.Object(this);
            var len = obj.length >> 0;
            var k = 0;
            thisArg = thisArg || this;
            while (k<len)
            {
                if( k in obj && callback.call(thisArg, obj[k], k, obj) )
                {
                    items.push(obj[k]);
                }
                k++;
            }
            return items;
        }
    },

    /**
     * 返回一个唯一元素的数组
     * @returns {Array}
     */
    "unique":{value:function unique()
        {
            if (this==null)throw new ReferenceError('this is null or not defined');
            var obj = System.Object(this);
            var arr = Array.prototype.slice.call(obj,0);
            var i=0;
            var b;
            var len = arr.length >> 0;
            for(;i<len;i++)
            {
                b = i+1;
                for (;b<len;b++)if(arr[i]===arr[b])arr.splice(b, 1);
            }
            return arr;
        }
    },

    /**
     * 将一个数组的所有元素从开始索引填充到具有静态值的结束索引
     * @param value
     * @param start
     * @param end
     * @returns {Object}
     */
    "fill":{value:function fill(value, start, end)
        {
            if (this==null)throw new ReferenceError('this is null or not defined');
            if (!(System.is(this, Array) || System.isArray(this)))throw new ReferenceError('this is not Array');
            var len = this.length >> 0;
            var relativeStart = start >> 0;
            var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
            var relativeEnd = end == null ? len : end >> 0;
            var final = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
            while (k < final) {
                this[k] = value;
                k++;
            }
            return this;
        }
    },

    /**
     * 返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。
     * @param callback
     * @param thisArg
     * @returns {*}
     */
    "find":{value:function find(callback, thisArg)
        {
            if (typeof callback !== 'function')throw new TypeError('callback must be a function');
            if (this==null)throw new ReferenceError('this is null or not defined');
            var obj = System.Object(this);
            var len = obj.length >> 0;
            var k = 0;
            thisArg = thisArg || this;
            while (k<len)if( k in obj)
            {
                if( callback.call(thisArg, obj[k++], k, obj) )
                {
                    return obj[k];
                }
            }
            return;
        }
    }
});

/**
 * 返回一个数组
 * @type {Function}
 */
if( !Array.prototype.map )
{
    Object.defineProperty(Array.prototype,"map", {value:function map(callback, thisArg)
    {
        var T, A, k;
        if (this == null)throw new TypeError("this is null or not defined");
        if (!System.isFunction(callback))throw new TypeError(callback + " is not a function");
        var O =  System.isArray(this) ? this : [];
        var len = O.length >>> 0;
        if (thisArg)T = thisArg;
        A = new Array(len);
        k = 0;
        var kValue, mappedValue;
        while(k < len) {
            if (k in O) {
                kValue = O[ k ];
                mappedValue = callback.call(T, kValue, k, O);
                A[ k ] = mappedValue;
            }
            k++;
        }
        return A;
    }});
}
/**
 * 返回指定元素的索引位置
 * @param searchElement
 * @returns {number}
 */
if ( !Array.prototype.indexOf )
{
    Object.defineProperty(Array.prototype,"indexOf", {value:function indexOf(searchElement, fromIndex)
    {
        if (this == null)throw new TypeError('this is null or not defined');
        var obj = Object(this);
        var len = obj.length >>> 0;
        if (len === 0)return -1;
        var n = +fromIndex || 0;
        if ( System.Math.abs(n) === System.Infinity)n = 0;
        if (n >= len)return -1;
        var k = System.Math.max(n >= 0 ? n : len - System.Math.abs(n), 0);
        while (k < len)
        {
            if (k in obj && obj[k] === searchElement)return k;
            k++;
        }
        return -1;
    }});
}

if (!Array.prototype.lastIndexOf)
{
    Object.defineProperty(Array.prototype,"indexOf", {value:function lastIndexOf(searchElement)
    {
        if (this == null)throw new TypeError('this is null or not defined');
        var n, k, t = Object(this), len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        n = len - 1;
        if (arguments.length > 1)
        {
            n = Number(arguments[1]);
            if (n != n) {
                n = 0;
            }
            else if (n != 0 && n != (1 / 0) && n != -(1 / 0))
            {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        for (k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--)
        {
            if (k in t && t[k] === searchElement)
            {
                return k;
            }
        }
        return -1;
    }});
}