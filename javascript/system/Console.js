/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,SyntaxError
 */
function Console() {
    if (this instanceof Console)throw new SyntaxError('is not constructor')
}
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
       str.push(  items[i] !=null && typeof items[i] === "object" && items[i].valueOf ? items[i].valueOf() : items[i] );
    }
    return str;
}
if( !$console )
{
    $console={};
    $console.trace=$console.warn=$console.error= $console.dir=$console.assert=$console.time=$console.timeEnd=$console.info=$console.log=function(){};
}
var $call = Function.prototype.call;
Console.log=function log(){
    $call.apply($console.log, [$console].concat( toString( arguments ) ) );
};
Console.info =function info(){
    $call.apply($console.info, [$console].concat( [].slice.call(arguments,0) ) );
};
Console.trace = function trace(){
    $console.trace( toString(arguments) );
};
Console.warn = function warn(){
    $console.warn( toString(arguments) );
};
Console.error = function error(){
    $console.error( toString(arguments)  );
};
Console.dir = function dir(){
    $console.dir( toString(arguments) );
};
Console.assert = function assert(){
    $console.assert();
};
Console.time = function time(){
    $console.time();
};
Console.timeEnd = function timeEnd(){
    $console.timeEnd();
};
System.Console = Console;
System.log =Console.log;
System.info=Console.info;
System.trace =Console.trace;
System.warn=Console.warn;
System.error =Console.error;
System.dir=Console.dir;
System.assert =Console.assert;
System.time=Console.time;
System.timeEnd =Console.timeEnd;
