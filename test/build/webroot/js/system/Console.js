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
var Internal =require("system/Internal.es");
var System =require("system/System.es");
var SyntaxError =require("system/SyntaxError.es");
var Function =require("system/Function.es");
var call = Function.prototype.call;
var output = Internal.$console;

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
if(!window.console)
{
    (function ()
    {
        var __container__ = null;
        var Element = require("./Element.js");
        var EventDispatcher = require("./EventDispatcher.js");
        var Event = require("./Event.js");
        var Array = require("./Array.js");
        function panel()
        {
            if( Element && !__container__ )
            {
                var container = Element('<div />');
                container.style('border', 'solid 1px #ccc');
                container.width('100%');
                container.height(200);
                container.style('position', 'absolute');
                container.style('background', '#ffffff');
                container.style('left', '0px');
                container.style('bottom', '0px');
                container.style('overflow', 'auto');
                // container.bottom(0);
                // container.left(0);
                __container__ = container;
                EventDispatcher(document).addEventListener( Event.READY, function (e) 
                {
                    Element(document.body).addChild(container);
                })
            }
            return __container__;
        }

        Console.log=function log()
        {
            var container = panel();
            if (container) {
               var p = Element.createElement('<p style="line-height: 12px; font-size:12px;color:#333333; font-family: Arial; padding: 5px 0px;margin: 0px;">' + Array.prototype.slice.call(arguments, 0).join(' ') + '</p>')
                container.addChild( p );
            }
        }

        Console.info=function info()
        {
            Console.log.apply(this, arguments);
        }
        Console.trace=function trace()
        {
            Console.log.apply(this, arguments);
        }
        Console.warn=function warn()
        {
            Console.log.apply(this, arguments);
        }
        Console.error=function error()
        {
            Console.log.apply(this, arguments);
        }
        Console.dir=function dir()
        {
        }
        Console.assert=function assert()
        {
        }
        Console.time=function time()
        {
        }
        Console.timeEnd=function timeEnd()
        {
        }
    }());
}
