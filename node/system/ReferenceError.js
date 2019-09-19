/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object;
 */
function ReferenceError( message , filename,line )
{
    Error.call(this, message , filename, line);
}

module.exports =ReferenceError;
var Error = require("./Error.js");
var Object = require("./Object.js");

ReferenceError.prototype = Object.create( Error.prototype ,{
    "constructor":{value:ReferenceError}
});
ReferenceError.prototype.name='ReferenceError';