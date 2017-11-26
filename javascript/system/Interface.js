/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object;
 */
function Interface() {
}
System.Interface=Interface;
Interface.prototype = Object.create( null );
Object.defineProperty(Interface.prototype,"constructor", {value:Interface});
Interface.prototype.valueOf=function valueOf()
{
    if(this==null)return this===null ? 'null' : 'undefined';
    return '[object '+this.__T__.classname+']';
};

/**
 * 返回指定对象的字符串表示形式。
 * @returns {String}
 */
Interface.prototype.toString=function toString()
{
    if(this==null)return this===null ? 'null' : 'undefined';
    return '[object Interface]';
};