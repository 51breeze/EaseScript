/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.Display;
    import es.interfaces.IDisplay;
    import es.interfaces.IContainer;
    public class Container extends Display implements IContainer
    {
        /**
         * 显示对象构造类
         * @constructor
         */
        function Container( element:Element )
        {
            if( !Element.isHTMLContainer( element[0] ) )
            {
                throw new TypeError("Invalid container element");
            }
            super( element );
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
         * @returns {IDisplay}
         */
        public function getChildAt( index:Number ):IDisplay
        {
            var children:Array = this._children;
            index = index < 0 ? index+children.length : index;
            var result:IDisplay = children[index];
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
        public function getChildIndex( child:IDisplay ):Number
        {
            var children:Array = this._children;
            return children.indexOf( child );
        };

        /**
         * 添加一个子级元素
         * @param child
         * @returns {Display}
         */
        public function addChild( child:IDisplay ):IDisplay
        {
            return this.addChildAt(child, -1);
        };

        /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         * @returns {Display}
         */
        public function addChildAt( child:IDisplay , index ):IDisplay
        {
            var parent = child.parent;
            if( parent )
            {
                (parent as Container).removeChild( child );
            }
            var children:Array = this._children;
            var indexAt = index < 0 ? index+children.length : index;
            this.element.addChildAt( child.element, index);
            children.splice(indexAt, 0, child);
            (child as Display).displayParent = this;
            return child;
        };

        /**
         * 移除指定的子级元素
         * @param child
         * @returns {Display}
         */
        public function removeChild( child:IDisplay ):IDisplay
        {
            if( child )
            {
                var children:Array = this._children;
                var index = children.indexOf( child );
                (child as Display).displayParent = null;
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
        public function removeChildAt( index:Number ):IDisplay
        {
            return this.removeChild( this.getChildAt(index) );
        };

        /**
         * 移除所有的子级元素
         */
        public function removeAllChild():void
        {
            var children:Array = this._children;
            var len = children.length;
            while( len>0 )
            {
                this.removeChild( children[ --len ] );
            }
            this._children = [];
        }

        /**
         * 添加一个html子级元素, 并清空当前容器中之前的所有子极
         * @param strHtml 如果是一个有效的html标签则生成对应的html元素，否则生成一个文本元素添加到当前容器中。
         * @return IDisplay
         */
        public function html( strHtml:String ):IDisplay
        {
            removeAllChild();
            return addChild( new Display( new Element( Element.createElement( strHtml , true ) ) ) );
        }
    }
}