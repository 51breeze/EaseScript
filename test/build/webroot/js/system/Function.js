/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Array,Object
 */
function Function() {
    return $Function.apply(this, Array.prototype.slice.call(arguments,0) );
};

module.exports = Function;
var Object =require("system/Object.es");
var Array =require("system/Array.es");
var Internal =require("system/Internal.es");
var $Function = Internal.$Function;

Function.prototype = Object.create( Object.prototype );
Function.prototype.apply = $Function.prototype.apply;
Function.prototype.call = $Function.prototype.call;
Function.prototype.bind = $Function.prototype.bind;

/**
 * 绑定一个对象到返回的函数中
 * 返回一个函数
 * @type {bind}
 */
if( !Function.prototype.bind )
{
    var Array = require("./Array.js");
    var TypeError = require("./TypeError.js");
    Object.defineProperty(Function.prototype,"bind", {value:function bind(thisArg)
    {
        if (typeof this !== "function")throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        var args = Array.prototype.slice.call(arguments, 1),
            fn = this,
            Nop = function () {
            },
            Bound = function () {
                return fn.apply(this instanceof Nop ? this : thisArg || this, args.concat(Array.prototype.slice.call(arguments)));
            };
        Nop.prototype = this.prototype;
        Bound.prototype = new Nop();
        return Bound;
    }});
}