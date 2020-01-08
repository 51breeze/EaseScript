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
        private var doneCallbacks:Array = [];

        /**
        * @private
        */
        private function callDone()
        {
            var queues:Array = doneCallbacks;
            var task:Array = taskPromise;
            if( queues.length > 0 && task.length < 1 )
            {
                do{
                  var callback:Function = queues.shift() as Function;
                  callback();
                }while( queues.length > 0 );
            }
        }

        /**
        * @private
        */
        private var taskPromise:Array = [];

        /**
        * 生成一个任务处理器。
        * 每一个任务处理器必须在指定的任务完成后至少调用一次来取消此任务处理。否则可能会造成线程挂起直到超时。
        * 此方法主要用来异步处理数据时需要等待当前所有任务处理完成后再响应到前端。
        * @return {Function}
        */
        public function createTaskPromise( callback:Function ):Function
        {
            var task:Array = this.taskPromise;
            var promise:Function = (...args)=>{
                var index:int = task.indexOf( promise );
                if( index >= 0 )
                {
                    task.splice(index,1);
                    callback.apply(null, args);
                    this.callDone();
                }
            };
            task.push( promise );
            return promise;
        }

        /**
        * 当所有的任务处理器结束后调用
        * @param callback
        */
        static public function done( callback:Function ):void
        {
            var systemManage:SystemManage = SystemManage.getSystemManage();
            systemManage.doneCallbacks.push( callback );
            systemManage.callDone();
        }

        /**
         * @pirvate
         */
        static private var _systemManage:SystemManage=null;
        static public function getSystemManage():SystemManage
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
