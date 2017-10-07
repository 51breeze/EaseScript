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
System.Function = Function;
Function.prototype = Object.create( Object.prototype );
Function.prototype.apply = $Function.prototype.apply;
Function.prototype.call = $Function.prototype.call;
Function.prototype.bind = $Function.prototype.bind;
