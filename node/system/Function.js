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
var Object = require("./Object.js");
var Array = require("./Array.js");
var Internal = require("./Internal.js");
var $Function = Internal.$Function;

Function.prototype = Object.create( Object.prototype );
Function.prototype.apply = $Function.prototype.apply;
Function.prototype.call = $Function.prototype.call;
Function.prototype.bind = $Function.prototype.bind;
