/**
 * 接口构造函数
 * @constructor
 * @require Object;
 */
function Interface() {
}
System.Interface=Interface;
Interface.prototype = Object.create( null );
Interface.prototype.constructor = Interface;
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