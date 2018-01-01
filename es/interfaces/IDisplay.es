/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/
package es.interfaces
{
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
        public function get width():Number;

        /**
         * 获取显示对象的宽度
         * @param value
         */
        public function set width(value:Number):void;

        /**
         * 设置显示对象的高度
         * @returns {Number}
         */
        public function get height():Number;

        /**
         * 获取显示对象的高度
         * @param value
         */
        public function set height(value:Number):void;

        /**
         * 标记此显示对象是否可见
         * @param flag
         */
        public function set visible( flag:Boolean ):void;

        /**
         * 获取此显示对象的可见状态
         * @returns {Boolean}
         */
        public function get visible():Boolean;

        /**
         * 设置对象的属性
         * @param name
         * @param value
         */
        public function property(name,value):Object;

        /**
         * 设置显示对象的样式
         * @param name
         * @param value
         */
        public function style(name, value):Object;

        /**
         * 获取滚动条在上边的位置
         * @returns {Number}
         */
        public function get scrollTop():Number;
        /**
         * 设置滚动条在上边的位置
         * @param value
         */
        public function set scrollTop(value:Number):void;

        /**
         * 获取滚动条在左边的位置
         * @returns {Number}
         */
        public function get scrollLeft():Number;

        /**
         * 设置滚动条在左边的位置
         * @param value
         */
        public function set scrollLeft(value:Number):void;

        /**
         * 获取滚动条的宽度
         * @returns {Number}
         */
        public function get scrollWidth():Number;

        /**
         * 获取滚动条的高度
         * @returns {Number}
         */
        public function get scrollHeight():Number;

        /**
         * 获取元素相对文档页面边界的矩形坐标。
         * 如果元素的 position = fixed 或者 force=== true 则相对浏览器窗口的位置
         * @param boolean global 是否为全局坐标
         * @returns {left,top,right,bottom,width,height}
         */
        public function getBoundingRect( global ):Object;

        /**
         * 获取元素相对父元素的左边距
         * @returns {Number}
         */
        public function get left():Number;

        /**
         * 设置元素相对父元素的左边距
         * @returns {Number}
         */
        public function set left( value:Number ):void;

        /**
         * 获取元素相对父元素的上边距
         * @returns {Number}
         */
        public function get top():Number;

        /**
         * 设置元素相对父元素的上边距
         * @returns {Number}
         */
        public function set top( value:Number ):void;

        /**
         * 获取元素相对父元素的右边距
         * @returns {Number}
         */
        public function get right():Number;

        /**
         * 设置元素相对父元素的右边距
         * @returns {Number}
         */
        public function set right( value:Number ):void;

        /**
         * 获取元素相对父元素的下边距
         * @returns {Number}
         */
        public function get bottom():Number;

        /**
         * 设置元素相对父元素的下边距
         * @returns {Number}
         */
        public function set bottom( value:Number ):void;

        /**
         *  将本地坐标点转成相对视图的全局点
         *  @param left
         *  @param top
         *  @returns {object} left top
         */
        public function localToGlobal(left:Number, top:Number):Object;

        /**
         *  将视图的全局点转成相对本地坐标点
         *  @param left
         *  @param top
         *  @returns {object}  left top
         */
        public function globalToLocal(left:Number, top:Number ):Object;

        /**
         * 获取父级皮肤元素
         * 只有已经添加到父级元素中才会返回父级皮肤元素，否则返回 null
         * @returns {Display}
         */
        public function get parent():IDisplay;

    }
}

