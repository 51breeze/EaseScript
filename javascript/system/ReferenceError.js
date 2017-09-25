/**
 * 引用错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error,Object;
 */
function ReferenceError( message , filename,line )
{
    this.name='ReferenceError';
    Error.call(this, message , filename,line);
}
System.ReferenceError =ReferenceError;
ReferenceError.prototype = Object.create( Error.prototype );
ReferenceError.prototype.constructor=ReferenceError;