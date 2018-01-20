/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object;
 */
function SyntaxError(  message , filename, line)
{
    Error.call(this, message , filename, line);
};
System.SyntaxError = SyntaxError;
SyntaxError.prototype = Object.create( Error.prototype );
SyntaxError.prototype.constructor=SyntaxError;
SyntaxError.prototype.name='SyntaxError';