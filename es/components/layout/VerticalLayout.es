/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.components.layout
{
    import es.components.layout.BaseLayout;
    public class VerticalLayout extends BaseLayout
    {
        public static const TOP:String = "top";
        public static const MIDDLE:String = "middle";
        public static const BOTTOM:String = "bottom";
        public static const JUSTIFY:String = "justify";
        public static const CONTENT_JUSTIFY:String = "contentJustify";

        /**
         * @constructor
         */
        public function VerticalLayout()
        {
            super();
        }

        /**
         * @private
         */
        private var _verticalAlign:String = VerticalLayout.CENTER;

        /**
         * 指定相对于视口的水平对齐属性
         * @return {String}
         */
        public function set verticalAlign(value:String):void
        {
            if( [VerticalLayout.TOP,VerticalLayout.MIDDLE,VerticalLayout.BOTTOM, VerticalLayout.JUSTIFY,VerticalLayout.CONTENT_JUSTIFY].indexOf(value)<0 )
            {
                throw new ReferenceError("Invalid verticalAlign value the '"+value+"'");
            }
            _verticalAlign = value;
        }

        /**
         * 获取相对于视口的水平对齐属性
         * @return {String}
         */
        public function get verticalAlign():String
        {
           return _verticalAlign;
        }
    }
}