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
    public class View extends EventDispatcher
    {
        /**
         * 字符集常量值
         */
        public static const CHARSET_GB2312 = 'GB2312';
        public static const CHARSET_GBK    = 'GBK';
        public static const CHARSET_UTF8   = 'UTF-8';

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
            super( document );
            _context = context;
        }

        /**
         * 当前第一次调用display方法时，会调用此方法来初始化一些属性，无需手动调用。
         * 此方法由子类继承来实现
         */
        protected function initializing(){}

        /**
         * 获取应用上下文
         */
        public function get context():Application
        {
            return _context;
        }

        /**
         * 获取或者指定数据
         * @param name
         * @param value
         * @return
         */
        public function assign(name:String, value:*=null)
        {
           return _context.assign(name,value);
        }

        /**
         * @private
         */
        private var _initialized = false;

        /**
         * 执行此视图，并初始化相关属性
         */
        public function display()
        {
            if( !_initialized )
            {
                _initialized = true;
                this.initializing();
            }
        }
    }
}


