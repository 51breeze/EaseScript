/**
 * 类型错误构造器
 * @param message
 * @param filename
 * @param line
 * @constructor
 * @require Error,Object
 */
function TypeError( message , filename, line)
{
    Error.call(this, message , filename, line);
}
TypeError.prototype =Object.create( Error.prototype );
TypeError.prototype.constructor=TypeError;
TypeError.prototype.name='TypeError';
System.TypeError=TypeError;