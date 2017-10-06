package es.core
{
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
         * 设置显示对象的样式
         * @param name
         * @param value
         */
        public function style(name, value)
        {
             var obj = _element.style( name, value );
             return _element===obj ? this : obj;
        }

        /**
         * 添加指定的类名
         * @param className
         */
        public function addClass(name:String):void
        {
            _element.addClass( name );
        }

        /**
         * 移除指定的类名或者清除所有的类名。
         * @param className
         */
        public function removeClass( name:String ):void
        {
            _element.removeClass( name );
        }

        /**
         * 获取滚动条在上边的位置
         * @returns {Number}
         */
        public function get scrollTop():Number
        {
             return _element.scrollTop();
        }

        /**
         * 设置滚动条在上边的位置
         * @param value
         */
        public function set scrollTop(value:Number):void
        {
             _element.scrollTop(value);
        }

        /**
         * 获取滚动条在左边的位置
         * @returns {Number}
         */
        public function get scrollLeft():Number
        {
             return _element.scrollTop();
        }

        /**
         * 设置滚动条在左边的位置
         * @param value
         */
        public function set scrollLeft(value:Number):void
        {
             _element.scrollTop(value);
        }

        /**
         * 获取滚动条的宽度
         * @returns {Number}
         */
        public function get scrollWidth()
        {
            return _element.scrollWidth();
        };

        /**
         * 获取滚动条的高度
         * @returns {Number}
         */
        public function get scrollHeight()
        {
            return  _element.scrollHeight();
        };

        /**
         * 获取元素相对文档页面边界的矩形坐标。
         * 如果元素的 position = fixed 或者 force=== true 则相对浏览器窗口的位置
         * @param boolean global 是否为全局坐标
         * @returns {left,top,right,bottom,width,height}
         */
        public function getBoundingRect( global )
        {
            return _element.getBoundingRect( global );
        };


        /**
         * 获取元素相对父元素的左边距
         * @returns {Number}
         */
        public function get left():Number
        {
            return _element.left();
        }
        /**
         * 设置元素相对父元素的左边距
         * @returns {Number}
         */
        public function set left( value:Number ):void
        {
            _element.left( value );
        }

        /**
         * 获取元素相对父元素的上边距
         * @returns {Number}
         */
        public function get top():Number
        {
            return _element.top();
        }
        /**
         * 设置元素相对父元素的上边距
         * @returns {Number}
         */
        public function set top( value:Number ):void
        {
            _element.top( value );
        }

        /**
         * 获取元素相对父元素的右边距
         * @returns {Number}
         */
        public function get right():Number
        {
            return _element.right();
        }
        /**
         * 设置元素相对父元素的右边距
         * @returns {Number}
         */
        public function set right( value:Number ):void
        {
            _element.right( value );
        }

        /**
         * 获取元素相对父元素的下边距
         * @returns {Number}
         */
        public function get bottom():Number
        {
            return _element.bottom();
        }
        /**
         * 设置元素相对父元素的下边距
         * @returns {Number}
         */
        public function set bottom( value:Number ):void
        {
            _element.bottom( value );
        }

        /**
         *  将本地坐标点转成相对视图的全局点
         *  @param left
         *  @param top
         *  @returns {object} left top
         */
        public function localToGlobal(left:Number, top:Number)
        {
            return _element.localToGlobal(left, top);
        };

        /**
         *  将视图的全局点转成相对本地坐标点
         *  @param left
         *  @param top
         *  @returns {object}  left top
         */
        public function globalToLocal(left:Number, top:Number )
        {
            return _element.globalToLocal(left, top);
        };

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