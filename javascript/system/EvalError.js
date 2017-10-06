/**
 * EvalError
 * @param message
 * @param filename
 * @param line
 * @constructor
 * @require System,Error,Object;
 */
function EvalError( message , filename, line) {
    Error.call(this, message , filename, line);
};
System.EvalError = EvalError;
EvalError.prototype = Object.create( Error.prototype );
EvalError.prototype.constructor=EvalError;
EvalError.prototype.name='EvalError';