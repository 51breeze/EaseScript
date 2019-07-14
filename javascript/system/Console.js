/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,SyntaxError
 */
function Console()
{
   throw new SyntaxError('console object is not constructor or function');
}

module.exports = Console;
var System = require("./System.js");
var SyntaxError = require("./SyntaxError.js");
var Function = require("./Function.js");
var call = Function.prototype.call;
var output = $console;

function toString( args )
{
    var str=[ output ];
    for(var i=0; i<args.length; i++)
    {
        if( args[i] && ( System.isObject(args[i],true) || typeof args[i] ==="function" ) )
        {
            str.push( args[i].valueOf() );
        }else
        {
            str.push( args[i] );
        }
    }
    return str;
}

Console.log=function log(){
    call.apply(output.log, toString( arguments ) );
};
Console.info =function info(){
    call.apply(output.info, toString( arguments ) );
};
Console.trace = function trace(){
    call.apply(output.trace, toString( arguments ) );
};
Console.warn = function warn(){
    call.apply(output.warn, toString( arguments ) );
};
Console.error = function error(){
    call.apply(output.error, toString( arguments ) );
};
Console.dir = function dir(){
    call.apply(output.dir, toString( arguments ) );
};
Console.assert = function assert(){
    call.apply(output.assert, toString( arguments ) );
};
Console.time = function time(){
    call.apply(output.time, toString( arguments ) );
};
Console.timeEnd = function timeEnd(){
    call.apply(output.timeEnd, toString( arguments ) );
};