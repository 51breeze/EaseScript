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
System.URIError=URIError;
URIError.prototype = Object.create( Error.prototype );
URIError.prototype.name = 'URIError';
URIError.prototype.constructor=URIError;