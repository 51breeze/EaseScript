if(!window.console)
{
    (function (System)
    {
        var __container__ = null;
        function panel()
        {
            if (System.Element && !__container__)
            {
                var container = System.Element('<div />');
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
                System.EventDispatcher(document).addEventListener(System.Event.READY, function (e) {
                    System.Element(document.body).addChild(container);
                })
            }
            return __container__;
        }

        System.Console.log=function log()
        {
            var container = panel();
            if (container) {
               var p = System.Element.createElement('<p style="line-height: 12px; font-size:12px;color:#333333; font-family: Arial; padding: 5px 0px;margin: 0px;">' + System.Array.prototype.slice.call(arguments, 0).join(' ') + '</p>')
                container.addChild( p );
            }
        }

        System.Console.info=function info()
        {
            System.console.log.apply(this, arguments);
        }
        System.Console.trace=function trace()
        {
            System.console.log.apply(this, arguments);
        }
        System.Console.warn=function warn()
        {
            System.console.log.apply(this, arguments);
        }
        System.Console.error=function error()
        {
            System.console.log.apply(this, arguments);
        }
        System.Console.dir=function dir()
        {
        }
        System.Console.assert=function assert()
        {
        }
        System.Console.time=function time()
        {
        }
        System.Console.timeEnd=function timeEnd()
        {
        }
    }(System));
}
