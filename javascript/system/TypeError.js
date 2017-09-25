/**
 * 类型错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error,Object
 */
function TypeError( message , line, filename )
{
    this.name='TypeError';
    Error.call(this, message , line, filename);
}
TypeError.prototype =Object.create( Error.prototype );
TypeError.prototype.constructor=TypeError;
System.TypeError=TypeError;