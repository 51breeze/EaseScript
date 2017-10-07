/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object
 */
function Error( message , filename, line )
{
    message = message ||"";
    var obj = $Error.call(this, message);
    obj.name = this.name;
    this.stack = Internal.environment == 1 ? Internal.getStack().reverse().join("\n at ") : (obj.stack || '').toString();
    this.message = message;
    this.line=line || 0;
    this.filename =filename || '';
}
System.Error=Error;
Error.prototype =Object.create( $Error.prototype );
Error.prototype.constructor=Error;
Error.prototype.line=null;
Error.prototype.name='Error';
Error.prototype.message=null;
Error.prototype.filename=null;
Error.prototype.stack='';
Error.prototype.toString=function ()
{
    var msg = [];
    if( this.filename )msg.push( this.filename );
    if( this.line )msg.push( this.line );
    if( msg.length > 0 )
    {
        return this.name+': '+this.message+'\n at '+ msg.join(':');
    }
    return this.name+': '+this.message;
};
