/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object;
 */
function RangeError( message , filename, line)
{
    Error.call(this,  message , filename, line);
};
System.RangeError=RangeError;
RangeError.prototype = Object.create( Error.prototype) ;
Object.defineProperty(RangeError.prototype,"constructor", {value:RangeError});
RangeError.prototype.name='RangeError';