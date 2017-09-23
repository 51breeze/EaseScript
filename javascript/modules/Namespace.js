/**
 * 命名空间构造器
 * @returns {Function}
 * @constructor
 * @require System,Object;
 */
function Namespace(prefix, uri)
{
    this.__prefix__ = prefix || '';
    this.__uri__ = uri || '';
}
Namespace.valueOf=Namespace.toString=function () {return '[object Namespace]'};
Namespace.prototype = Object.create( Object.prototype );
Namespace.prototype.__prefix__='';
Namespace.prototype.__uri__='';
Namespace.prototype.constructor = Namespace;
Namespace.prototype.toString=function (){return '[object Namespace]'};
Namespace.prototype.valueOf =function valueOf()
{
    return this.__prefix__+this.__uri__;
};
System.Namespace = Namespace;