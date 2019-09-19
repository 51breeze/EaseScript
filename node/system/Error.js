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
    this.stack = (obj.stack || '').toString();
    this.message = message;
    this.line=line || 0;
    this.filename =filename || '';
}

module.exports = Error;
var Object = require("./Object.js");
var Internal = require("./Internal.js");
var $Error = Internal.$Error;

Error.prototype =Object.create( $Error.prototype,{
    "constructor":{value:Error},
    "valueOf":{value:function toString()
    {
        var msg = [];
        if( this.filename )msg.push( this.filename );
        if( this.line )msg.push( this.line );
        if( msg.length > 0 )
        {
            return this.name+': '+this.message+'\n at '+ msg.join(':') + '\n' + this.stack;
        }
        return this.name+': '+this.message+'\n'+ this.stack;
    }}
});

Error.prototype.line=null;
Error.prototype.name='Error';
Error.prototype.message=null;
Error.prototype.filename=null;
Error.prototype.stack='';

