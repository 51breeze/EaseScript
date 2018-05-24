/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,SyntaxError,Array
 */
function Console() {
   throw new SyntaxError('console object is not constructor or function');
}
System.Console=Console;
/**
 * @private
 * @param items
 * @returns {string}
 */
function toString(items)
{
    var str=[];
    for(var i=0; i<items.length; i++)
    {
        if( items[i] != null && items[i].constructor instanceof System.Class )
        {
            var item  = items[i];
            var name = (items[i]._toString||items[i].toString).call(items[i]);
            if( !(System.isArray(item,Array) || System.isObject(item)) ){
                item = Object.prototype.getEnumerableProperties.call(item,2);
            }
            str = item ? str.concat(name,item) : str.concat(name);

        }else
        {
            str.push( items[i] );
        }
    }
    return str;
}
var $call = System.Function.prototype.call;
Console.log=function log(){
    $call.apply($console.log, [$console].concat( toString( arguments ) ) );
};
Console.info =function info(){
    $call.apply($console.info, [$console].concat( toString( arguments ) ) );
};
Console.trace = function trace(){
    $call.apply($console.trace, [$console].concat( toString( arguments ) ) );
};
Console.warn = function warn(){
    $call.apply($console.warn, [$console].concat( toString( arguments ) ) );
};
Console.error = function error(){
    $call.apply($console.error, [$console].concat( toString( arguments ) ) );
};
Console.dir = function dir(){
    $call.apply($console.dir, [$console].concat( toString( arguments ) ) );
};
Console.assert = function assert(){
    $call.apply($console.assert, [$console].concat( toString( arguments ) ) );
};
Console.time = function time( name ){
    $console.time( name );
};
Console.timeEnd = function timeEnd( name ){
    $console.timeEnd( name );
};