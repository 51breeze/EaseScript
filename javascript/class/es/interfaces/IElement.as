/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/

package breeze.interfaces
{
    public interface IElement
    {
        /**
         * 添加一个子级元素
         * @param child
         */
        function addChild( child:IElement ):IElement;

        /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         */
        function addChildAt(child:IElement, index:Number ):IElement;

        /**
         * 移除指定的子级元素
         * @param child
         */
        public function removeChild(child):IElement;

        /**
         * 移除指定索引的子级元素
         * @param index
         */
        public function removeChildAt(index):IElement;

        public function html( child );
    }
}

