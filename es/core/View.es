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
            super( new Element( document ) );
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
         * 视图类中不能添加子级元素
         * @param child
         * @param index
         * @return
         */
        override public function addChildAt( child:IDisplay , index:Number ):IDisplay
        {
             throw new Error("View is not addChildAt");
             return null;
        }

        /**
         * 视图类中不能移除子级元素
         * @param child
         * @return
         */
        override public function removeChild( child:IDisplay ):IDisplay
        {
            throw new Error("View is not removeChild");
            return null;
        }

        /**
         * 执行此视图，并初始化相关属性
         */
        override public function commitPropertyAndUpdateSkin()
        {
            var init = initialized;
            super.commitPropertyAndUpdateSkin();
            if( !init && this.hasEventListener("INTERNAL_BEFORE_CHILDREN") )
            {
                this.dispatchEvent( new Event("INTERNAL_BEFORE_CHILDREN") );
            }
        }
    }
}


