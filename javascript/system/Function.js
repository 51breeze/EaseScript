/**
 * 函数构造器
 * @returns {*}
 * @constructor
 * @require System,Array,Object
 */
function Function() {
    return $Function.apply(this, Array.prototype.slice.call(arguments,0) );
};
System.Function = Function;
Function.prototype = Object.create( Object.prototype );
Function.prototype.apply = $Function.prototype.apply;
Function.prototype.call = $Function.prototype.call;
Function.prototype.bind = $Function.prototype.bind;
