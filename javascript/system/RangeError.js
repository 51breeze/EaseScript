/**
 * RangeError
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error,Object;
 */
function RangeError( message , line, filename)
{
    this.name='RangeError';
    Error.call(this, message , line, filename);
};
System.RangeError=RangeError;
RangeError.prototype = Object.create( Error.prototype) ;
RangeError.prototype.constructor=RangeError;