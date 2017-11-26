/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object;
 */
function ReferenceError( message , filename,line )
{
    Error.call(this, message , filename, line);
}
System.ReferenceError =ReferenceError;
ReferenceError.prototype = Object.create( Error.prototype );
Object.defineProperty(ReferenceError.prototype,"constructor", {value:ReferenceError});
ReferenceError.prototype.name='ReferenceError';