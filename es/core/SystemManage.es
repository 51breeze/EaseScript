/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.interfaces.IContainer;
    import es.core.Container;

    public class SystemManage extends EventDispatcher
    {
        public function SystemManage()
        {
            super();
        }

        /**
        * @private
        */
        static private var doneCallback:Function=null;

        /**
        * 当所有的服务完成后的调用
        * @param callback
        */
        static public function done( callback:Function ):void
        {
            SystemManage.doneCallback = callback;
            if( SystemManage.callServerCouter < 1 )
            {
                callback();
            }
        }

        /**
        * 统计服务调用数
        */
        static private var callServerCouter:int=0;

        /**
        * 在每次调用服务调用此方法来累计服务调用次数
        */
        [RunPlatform(server)]
        static public function incrementServerCouter():int
        {
            return callServerCouter++;
        }

        /**
        * 在每次调用服务调用此方法来减去服务调用数
        */
        [RunPlatform(server)]
        static public function decrementServerCouter():int
        {
            var val:int=--callServerCouter;
            if( val < 1 && SystemManage.doneCallback )
            {
               SystemManage.doneCallback();
            }
            return val;
        }

        /**
         * @pirvate
         */
        static private var _systemManage:SystemManage=null;
        static public function getSystemManage()
        {
            var systemManage:SystemManage = SystemManage._systemManage;
            if( systemManage === null )
            {
                systemManage = new SystemManage();
                SystemManage._systemManage = systemManage;
            }
            return systemManage;
        }

        /**
         * @pirvate
         */
        static private var _window:Element;

        /**
         * 获取全局窗口元素对象
         */
        static public function getWindow():Element
        {
            if( !_window )_window = new Element(window);
            return _window;
        }

        /**
         * @pirvate
         */
        static private var _document:Element;

        /**
         * 获取全局文档元素对象
         */
        static public function getDocument():Element
        {
            if( !_document )_document = new Element(document);
            return _document;
        }

        /**
         * @pirvate
         */
        static private var _body:Element;

        /**
         * 获取全局body元素对象
         */
        static public function getBody():Element
        {
            if( !_body )_body = new Element(document.body);
            return _body;
        }

        /**
         * @pirvate
         */
        static private var _disableScroll:Boolean=false;

        /**
         * 禁用body滚动条
         */
        static public function disableScroll()
        {
            if( !_disableScroll )
            {
                _disableScroll = true;
                var body:Element  = getBody();
                body.style("overflowX", "hidden");
                body.style("overflowY", "hidden");
            }
        }

        /**
         * 启用body滚动条
         */
        static public function enableScroll()
        {
            if( _disableScroll===true )
            {
                _disableScroll = false;
                var body:Element  = getBody();
                body.style("overflowX", "auto");
                body.style("overflowY", "auto");
            }
        }
    }
}
