/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/
package es.interfaces
{
    import es.interfaces.IDisplay;
    public interface IContainer
    {
        /**
         * 获取所有的子级元素
         * @returns {Array}
         */
        public function get children():Array;

        /**
         * 设置子级元素
         * @returns {Array}
         */
        public function set children( value:Array ):void;

        /**
         * 获取指定索引处的子级元素
         * @param index
         * @returns {IDisplay}
         */
        public function getChildAt( index:Number ):IDisplay;

        /**
         * 根据子级皮肤返回索引
         * @param child
         * @returns {Number}Number
         */
        public function getChildIndex( child:IDisplay ):Number;

        /**
         * 添加一个子级元素
         * @param child
         * @returns {Display}
         */
        public function addChild( child:IDisplay ):IDisplay;
        /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         * @returns {Display}
         */
        public function addChildAt( child:IDisplay , index:Number ):IDisplay;
        /**
         * 移除指定的子级元素
         * @param child
         * @returns {Display}
         */
        public function removeChild( child:IDisplay ):IDisplay;

        /**
         * 移除指定索引的子级元素
         * @param index
         * @returns {Display}
         */
        public function removeChildAt( index:Number ):IDisplay;

        /**
         * 移除所有的子级元素
         *  @returns {void}
         */
        public function removeAllChild():void;

        /**
         * 测是是否包括指定的子级（包括孙级）元素
         * 此操作与Element.contains()一致
         * @param child
         * @return Boolean
         */
        public function contains( child:IDisplay ):Boolean;

    }
}

