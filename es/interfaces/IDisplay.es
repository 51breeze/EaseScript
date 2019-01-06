/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/
package es.interfaces
{
    import es.core.es_internal;
    import es.interfaces.IContainer;

    public interface IDisplay
    {
        /**
         * 获取元素对象
         * @returns {Element}
         */
        public function get element():Element

        /**
         * 设置显示对象的宽度
         * @returns {Number}
         */
        //public function get width():uint;

        /**
         * 获取显示对象的宽度
         * @param value
         */
        //public function set width(value:uint):void;

        /**
         * 设置显示对象的高度
         * @returns {Number}
         */
        //public function get height():uint;

        /**
         * 获取显示对象的高度
         * @param value
         */
        //public function set height(value:uint):void;

        /**
         * 标记此显示对象是否可见
         * @param flag
         */
        //public function set visible( flag:Boolean ):void;

        /**
         * 获取此显示对象的可见状态
         * @returns {Boolean}
         */
        //public function get visible():Boolean;

       // es_internal function setParentDisplay(parent:IDisplay):void;

        /**
         * 获取父级皮肤元素
         * 只有已经添加到父级元素中才会返回父级皮肤元素，否则返回 null
         * @returns {Display}
         */
        public function get parent():IDisplay;

        /**
         * 渲染显示皮肤对象。
         * 调用此方法会重新创建子级对象，在非必要情况下请谨慎使用，可以节省资源。
         */
        public function display():Element;
    }
}

