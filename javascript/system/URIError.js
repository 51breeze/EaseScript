/**
 * URIError
 * @param message
 * @param filename
 * @param line
 * @constructor
 * @require Error,Object
 */
function URIError( message , filename, line) {
    Error.call(this, message , filename, line);
};
System.URIError=URIError;
URIError.prototype = Object.create( Error.prototype );
URIError.prototype.name = 'URIError';
URIError.prototype.constructor=URIError;