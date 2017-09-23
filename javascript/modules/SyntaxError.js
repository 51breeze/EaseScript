/**
 * 语法错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error,Object;
 */
function SyntaxError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='SyntaxError';
};
System.SyntaxError = SyntaxError;
SyntaxError.prototype = Object.create( Error.prototype );
SyntaxError.prototype.constructor=SyntaxError;