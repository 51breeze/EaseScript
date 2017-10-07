/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.Display;
    public class Container extends Display
    {
        /**
         * 显示对象构造类
         * @constructor
         */
        function Container( element:Element )
        {
            super( element );
            if( !Element.isHTMLContainer( element[0] ) )
            {
                 throw new TypeError("Invalid container element");
            }
        }
        
        /**
         * @private
         */
        private var _children:Array=[];

        /**
         * 获取子级元素
         * @returns {Array}
         */
        public function get children():Array
        {
             return this._children.slice(0);
        };

        /**
         * 获取指定索引处的子级元素
         * @param index
         * @returns {Display}
         */
        public function getChildAt( index ):Display
        {
            var children:Array = this._children;
            index = index < 0 ? index+children.length : index;
            var result = children[index];
            if( result == null )
            {
                throw new RangeError('The index out of range');
            }
            return result;
        };

        /**
         * 根据子级皮肤返回索引
         * @param child
         * @returns {Number}
         */
        public function getChildIndex( child:Display ):Number
        {
            var children:Array = this._children;
            return children.indexOf( child );
        };

        /**
         * 添加一个子级元素
         * @param child
         * @returns {Display}
         */
        public function addChild( child:Display ):Display
        {
            return this.addChildAt(child, -1);
        };

        /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         * @returns {Display}
         */
        public function addChildAt( child:Display , index ):Display
        {
            if( child.parent )
            {
                (child.parent as Container).removeChild( child );
            }
            var children = this._children;
            var indexAt = index < 0 ? index+children.length : index;
            this.element.addChildAt( child.element, index);
            children.splice(indexAt, 0, child);
            child.setParentOf(this);
            return child;
        };

        /**
         * 移除指定的子级元素
         * @param child
         * @returns {Display}
         */
        public function removeChild( child:Display ):Display
        {
            if( child )
            {
                var children:Array = this._children;
                var index = children.indexOf( child );
                child.setParentOf(null);
                this.element.removeChild( child.element );
                this._children.splice(index, 1);
                return child;
            }
            throw new ReferenceError('The child is null or undefined');
        };

        /**
         * 移除指定索引的子级元素
         * @param index
         * @returns {Display}
         */
        public function removeChildAt( index:Number ):Display
        {
            return this.removeChild( this.getChildAt(index) );
        };

        /**
         * 为当前的皮肤添加一组子级元素, 并清空当前已存在的子级元素
         * @param child
         */
        public function html( child:Display )
        {
            if( child !== null )
            {
                if( child.parent )
                {
                    (child.parent as Container).removeChild( child );
                }
                this.element.html( child.element );
                child.setParentOf(this);
                this._children = [ child ];

            }else{

                this.element.html('');
                this._children = [];
            }
        };
    }
}