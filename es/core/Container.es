/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.SkinComponent;
    import es.core.Display;
    import es.interfaces.IDisplay;
    import es.interfaces.IContainer;
    import es.core.es_internal;
    import es.components.layout.BaseLayout;

    public class Container extends Display implements IContainer
    {
        /**
         * 显示对象构造类
         * @constructor
         */
        function Container( element:Element, attr:Object=null )
        {
            if( !Element.isHTMLContainer( element[0] ) )
            {
                throw new TypeError("Invalid container element");
            }
            super( element, attr );
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
         * 设置子级元素
         * @returns {Array}
         */
        public function set children( value:Array ):void
        {
            this.removeAllChild();
            var len:int = value.length;
            var index:int = 0;
            for(;index<len;index++)
            {
                if( value[0] is IDisplay )
                {
                   this.addChild( value[0] as IDisplay );
                }
            }
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
            var parent:IContainer = child.parent;
            if( parent )
            {
                parent.removeChild( child );
            }
            var children:Array = this._children;
            var at:Number = index < 0 ? index+children.length+1 : index;
            children.splice(at, 0, child);
            child.es_internal::setParentDisplay(this);
            this.element.addChildAt(child.element,index);
            return child;
        };

        /**
         * 移除指定的子级元素
         * @param child
         * @returns {Display}
         */
        public function removeChild( child:IDisplay ):IDisplay
        {
            var index:int = this.getChildIndex( child );
            if( index >= 0 )
            {
                return this.removeChildAt( index );
            }else{
                throw new ReferenceError('The child is not added.');
            }
        };

        /**
         * 移除指定索引的子级元素
         * @param index
         * @returns {Display}
         */
        public function removeChildAt( index:Number ):IDisplay
        {
            var children:Array = this._children;
            index = index < 0 ? index+children.length : index;
            if( !(children.length > index) )
            {
                throw new RangeError('The index out of range');
            }
            var child:IDisplay = children[index] as IDisplay;
            children.splice(index, 1);
            this.element.removeChild( child.element );
            child.es_internal::setParentDisplay(null);
            return child;
        };

        /**
         * 移除所有的子级元素
         */
        public function removeAllChild():void
        {
            var len:int = this._children.length;
            while( len>0 )
            {
                this.removeChildAt( --len );
            }
            this.element.html('');
        }

        /**
         * 测是是否包括指定的子级（包括孙级）元素
         * 此操作与Element.contains()一致
         * @param child
         * @return Boolean
         */
        public function contains( child:IDisplay ):Boolean
        {
            return Element.contains(this.element, child.element);
        }

         /**
         * @private
         */
        private var _layout:BaseLayout=null;

        /**
         * 设置一个指定布局对象
         * @param value
         */
        [RunPlatform(client)]
        public function set layout( value:BaseLayout )
        {
            value.target = this;
            _layout = value;
        }

        /**
         * 获取一个指定的布局对象
         * @return {BaseLayout}
         */
        public function get layout():BaseLayout
        {
            return _layout;
        }
    }
}