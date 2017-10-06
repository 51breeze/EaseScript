/**
 * RangeError
 * @param message
 * @param filename
 * @param line
 * @constructor
 * @require Error,Object;
 */
function RangeError( message , filename, line)
{
    Error.call(this,  message , filename, line);
};
System.RangeError=RangeError;
RangeError.prototype = Object.create( Error.prototype) ;
RangeError.prototype.constructor=RangeError;
RangeError.prototype.name='RangeError';