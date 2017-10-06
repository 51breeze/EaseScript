/**
 * 引用错误构造器
 * @param message
 * @param filename
 * @param line
 * @constructor
 * @require Error,Object;
 */
function ReferenceError( message , filename,line )
{
    Error.call(this, message , filename, line);
}
System.ReferenceError =ReferenceError;
ReferenceError.prototype = Object.create( Error.prototype );
ReferenceError.prototype.constructor=ReferenceError;
ReferenceError.prototype.name='ReferenceError';