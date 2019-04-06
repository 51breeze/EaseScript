/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.State;
    import es.events.SkinEvent;
    import es.core.Application;
    import es.components.Component;
    import es.core.Skin;
    import es.interfaces.IDisplay;
    public class View extends Skin
    {
        /**
         * 字符集常量值
         */
        public static const CHARSET_GB2312:String = 'GB2312';
        public static const CHARSET_GBK:String    = 'GBK';
        public static const CHARSET_UTF8:String   = 'UTF-8';

        /**
         * @private
         */
        private var _context:Application;

        /**
         * 视图类
         * @constructor
         */
        public function View( context:Application )
        {
            super( context.getContainer() );
            _context = context;
        }

        /**
         * 获取应用上下文
         */
        public function get context():Application
        {
            return _context;
        }

        /**
        * 获取视图标题
        */
        public function get title():String
        {
             return _context.title;
        }

        /**
        * 设置视图标题
        */
        public function set title(value:String):void
        { 
            _context.title=value;
        }

        /**
         * 执行此视图，并初始化相关属性
         */
        override public function display():Element
        {
            var init:Boolean = initialized;
            var elem:Element = super.display();
            if( !init && this.hasEventListener("INTERNAL_BEFORE_CHILDREN") )
            {
                this.dispatchEvent( new Event("INTERNAL_BEFORE_CHILDREN") );
            }
            return elem;
        }
    }
}


