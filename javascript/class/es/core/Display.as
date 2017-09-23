package breeze.core
{
    import EventDispatcher;
    public class Display extends EventDispatcher
    {
        /**
         * 代理元素对象
         * @private
         */
        private var _element:Element;

        /**
         * 显示对象构造类
         * @constructor
         */
        function Display( element:Element )
        {
            if( element==null || element.length != 1 )
            {
                throw new TypeError("The selector elements can only is a single element");
            }
            if( !Element.isNodeElement( element[0] ) )
            {
               throw new TypeError("Invalid node element");
            }
            _element = element;
            super( element );
        }

        /**
         * 获取元素对象
         * @returns {Element}
         */
        protected function get element():Element
        {
            return _element;
        }

        /**
         * 设置对象的属性
         * @param name
         * @param value
         */
        public function property(name,value)
        {
            if( value !== undefined )
            {
                _element.property( name, value );
                return this;
            }
            return _element.property( name );
        }

        /**
         * @private
         */
        private var _parent:Display;

        /**
         * 获取父级皮肤元素
         * 只有已经添加到父级元素中才会返回父级皮肤元素，否则返回 null
         * @returns {Display}
         */
        public function get parent():Display
        {
            return _parent;
        };

        /**
         * 设置该对象的父级对象
         * @param parent
         */
        protected function setParentOf( parent:Display )
        {
            _parent = parent;
        }
    }
}