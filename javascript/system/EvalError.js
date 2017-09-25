/**
 * EvalError
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require System,Error,Object;
 */
function EvalError( message , line, filename) {
    this.name='EvalError';
    Error.call(this, message , line, filename);
};
System.EvalError = EvalError;
EvalError.prototype = Object.create( Error.prototype );
EvalError.prototype.constructor=EvalError;