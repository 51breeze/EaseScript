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
