/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Error,Object;
 */
function EvalError( message , filename, line) {
    Error.call(this, message , filename, line);
};
System.EvalError = EvalError;
EvalError.prototype = Object.create( Error.prototype );
EvalError.prototype.constructor=EvalError;
EvalError.prototype.name='EvalError';