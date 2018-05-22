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
