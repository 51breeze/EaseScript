/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
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
Object.defineProperty(Namespace.prototype,"constructor", {value:Namespace});
Object.defineProperty( Namespace.prototype, "toString", {value:function toString(){
    return '[object Namespace]'
}});
Object.defineProperty( Namespace.prototype, "valueOf", {value:function valueOf(){
    return this.__prefix__+this.__uri__;
}});
System.Namespace = Namespace;