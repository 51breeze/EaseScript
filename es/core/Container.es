/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{

    import es.components.SkinComponent;
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

        [ArrayElementType("es.interfaces.IDisplay")]
        
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
            var result:IDisplay = children[index] as IDisplay;
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
        public function addChildAt( child:IDisplay , index:Number ):IDisplay
        {
            var parent:IDisplay = child.parent;
            if( parent )
            {
                (parent as Container).removeChild( child );
            }
            var children:Array = this._children;
            var at:Number = index < 0 ? index+children.length+1 : index;
            children.splice(at, 0, child);
            if( child is SkinComponent )
            {
                child = (child as SkinComponent).skin as IDisplay;
            }
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
                var index:int = children.indexOf( child );
                if( child is SkinComponent )
                {
                    child = (child as SkinComponent).skin as IDisplay;
                }
                (child as Display).displayParent = null;
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
            var len:int = children.length;
            while( len>0 )
            {
                this.removeChild( children[ --len ] as IDisplay );
            }
            this._children = [];
        }

        /**
         * 测是是否包括指定的子级（包括孙级）元素
         * 此操作与Element.contains()一致
         * @param child
         * @return Boolean
         */
        public function contains( child:IDisplay ):Boolean
        {
            return element.contains( child.element );
        }
    }
}