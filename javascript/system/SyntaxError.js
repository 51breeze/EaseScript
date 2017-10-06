/**
 * 语法错误构造器
 * @param message
 * @param filename
 * @param line
 * @constructor
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