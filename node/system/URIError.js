/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object
 */
function URIError( message , filename, line) {
    Error.call(this, message , filename, line);
};

module.exports =URIError;
var Object = require("./Object.js");
var Error = require("./Error.js");

URIError.prototype = Object.create( Error.prototype ,{
    "constructor":{value:URIError}
});
URIError.prototype.name = 'URIError';
