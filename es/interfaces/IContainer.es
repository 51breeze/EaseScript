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
        public function addChildAt( child:IDisplay , index ):IDisplay;
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
         * 添加一个html子级元素, 并清空当前容器中之前的所有子极
         * @param strHtml 如果是一个有效的html标签则生成对应的html元素，否则生成一个文本元素添加到当前容器中。
         * @return {IDisplay}
         */
        public function html( strHtml:String ):IDisplay;

    }
}

