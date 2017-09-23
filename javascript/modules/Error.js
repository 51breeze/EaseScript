/**
 * 错误消息构造函数
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Object
 */
function Error( message , filename, line )
{
    message = message ||"";
    var msg = [];
    if( filename )msg.push( filename );
    if( line )msg.push( line );
    if( msg.length > 0 )
    {
        message+='('+ msg.join(':') +')';
    }
    $Error.call(this, message , filename, line);
    this.message = message;
    this.line=line || 0;
    this.filename =filename || '';
    this.name="Error";
}
System.Error=Error;
Error.prototype =Object.create( $Error.prototype );
Error.prototype.constructor=Error;
Error.prototype.line=null;
Error.prototype.name='Error';
Error.prototype.message=null;
Error.prototype.filename=null;
Error.prototype.toString=function ()
{
    return this.message;
};
