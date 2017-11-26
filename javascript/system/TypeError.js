/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object
 */
function TypeError( message , filename, line)
{
    Error.call(this, message , filename, line);
}
TypeError.prototype =Object.create( Error.prototype );
Object.defineProperty(TypeError.prototype,"constructor", {value:TypeError});
TypeError.prototype.name='TypeError';
System.TypeError=TypeError;