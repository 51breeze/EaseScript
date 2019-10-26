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
var Internal = require("./Internal.js");
var System = require("./System.js");
var Object = require("./Object.js");
var ReferenceError = require("./ReferenceError.js");
var TypeError = require("./TypeError.js");
var $Array = Internal.$Array;

Object.defineProperty(Array,"from",{value:$Array.from});
Object.defineProperty(Array,"of",{value:$Array.of});
Object.defineProperty(Array,"isArray",{value:$Array.isArray});

Array.prototype = Object.create( $Array.prototype,{
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
    "hasOwnProperty":{value:Object.prototype.hasOwnProperty},
    "propertyIsEnumerable":{value:Object.prototype.propertyIsEnumerable},

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
    }

});
