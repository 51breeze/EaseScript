/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,SyntaxError,ReferenceError
 */
function Class() {
}
Class.valueOf=Class.toString=function () {return '[object Class]'};
Class.prototype = Object.create( Object.prototype );
Object.defineProperty(Class.prototype,"constructor", {value:Class});
Object.defineProperty( Class.prototype, "valueOf", {value:function valueOf()
{
    if(this==null)return this===null ? 'null' : 'undefined';
    if( this instanceof Class )
    {
        var t = this.__T__;
        if( t["package"] ){
            return '[class '+t["package"]+'.'+t.classname+']';
        }
        return '[class '+t.classname+']';
    }
    return Object.prototype.valueOf.call( this );
}});

/**
 * 返回指定对象的字符串表示形式。
 * @returns {String}
 */
Object.defineProperty( Class.prototype, "toString", {value:function toString()
{
    if(this==null)return this===null ? 'null' : 'undefined';
    if( this instanceof Class )
    {
        return '[object Class]';
    }
    return Object.prototype.toString.call( this );
}});

System.Class = Class;

