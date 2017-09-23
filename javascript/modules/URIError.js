/**
 * URIError
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error,Object
 */
function URIError( message , line, filename) {

    this.name='URIError';
    Error.call(this, message , line, filename);
};
System.URIError=URIError;
URIError.prototype = Object.create( Error.prototype );
URIError.prototype.constructor=URIError;