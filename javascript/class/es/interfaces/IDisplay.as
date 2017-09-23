/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/
package breeze.interfaces
{
    public interface IDisplay
    {
        /**
         * 添加一个子级元素
         * @param child
         */
        function addChild( child:IDisplay ):IDisplay;

        /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         */
        function addChildAt(child:IDisplay, index:Number ):IDisplay;

        /**
         * 添加一个子级元素
         * @param child
         */
        function getChildIndex( child:IDisplay ):Number;

        /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         */
        function getChildAt( index:Number ):IDisplay;

        /**
         * 移除指定的子级元素
         * @param child
         */
        public function removeChild(child:IDisplay):IDisplay;

        /**
         * 移除指定索引的子级元素
         * @param index
         */
        public function removeChildAt(index):IDisplay;

        /**
         * 添加子级元素并移除已存在的子级
         * @param child
         */
        public function html( child:IDisplay );
    }
}

