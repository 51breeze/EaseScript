/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
     import Element;
     import es.interfaces.IDisplay;
     import es.core.es_internal;
     import es.interfaces.IContainer;

    public class Display extends EventDispatcher implements IDisplay
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
        function Display( element:Element, attr:Object=null )
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
            if( attr )
            {
                if( attr.innerHTML )
                {
                    element.html( attr.innerHTML );
                    delete attr.innerHTML;
                }else if( attr.content )
                {
                    element.text( attr.content );
                    delete attr.content;
                }
                element.properties( attr );
            }
            super( element );
        }

        /**
         * 获取元素对象
         * @returns {Element}
         */
        public function get element():Element
        {
            return _element;
        }

        /**
         * @private
         */
        private var _width:uint=NaN;

        /**
         * 设置显示对象的宽度
         * @returns {Number}
         */
        public function get width():uint
        {
            return isNaN(_width) ? _element.width() : _width;
        }

        /**
         * 获取显示对象的宽度
         * @param value
         */
        public function set width(value:uint):void
        {
            if( !isNaN(value) )
            {
                _width = value;
                _element.width(value);
            }
        }

        /**
         * @private
         */
        private var _height:uint=NaN;

        /**
         * 设置显示对象的高度
         * @returns {Number}
         */
        public function get height():uint
        {
            return isNaN(_height) ? _element.height() : _height;
        }

        /**
         * 获取显示对象的高度
         * @param value
         */
        public function set height(value:uint):void
        {
            if( !isNaN(value) )
            {
                _height = value;
                _element.height(value);
            }
        }

        /**
         * @private
         */
        private var _visible:Boolean=false;
        private var _visibleFlag:Boolean = false;

        /**
         * 标记此显示对象是否可见
         * @param flag
         */
        public function set visible( flag:Boolean ):void
        {
            _visible= flag;
            _visibleFlag = true;
           flag===false ? _element.hide() : _element.show();
        }

        /**
         * 获取此显示对象的可见状态
         * @returns {Boolean}
         */
        public function get visible():Boolean
        {
            if( _visibleFlag===false )
            {
                return !( _element.style("display") === "none");
            }
            return _visible;
        }
        
        /**
         * 设置对象的属性
         * @param name
         * @param value
         * @returns {*}
         */
        public function property(name:String,value:String=null):*
        {
            return _element.property(name,value);
        }

        /**
         * 设置显示对象的样式
         * @param name
         * @param value
         * @returns {Object}
         */
        public function style(name:String, value:*=null):Object
        {
             return _element.style(name,value);
        }

        /**
         * 获取滚动条在上边的位置
         * @returns {Number}
         */
        public function get scrollTop():int
        {
             return _element.scrollTop();
        }

        /**
         * 设置滚动条在上边的位置
         * @param value
         */
        public function set scrollTop(value:int):void
        {
            if( !isNaN(value) )
            {
               _element.scrollTop(value);
            }
        }

        /**
         * 获取滚动条在左边的位置
         * @returns {Number}
         */
        public function get scrollLeft():int
        {
             return _element.scrollTop();
        }

        /**
         * 设置滚动条在左边的位置
         * @param value
         */
        public function set scrollLeft(value:int):void
        {
            if( !isNaN(value) )
            {
               _element.scrollTop(value);
            }
        }

        /**
         * 获取滚动条的宽度
         * @returns {Number}
         */
        public function get scrollWidth():int
        {
            return _element.scrollWidth();
        };

        /**
         * 获取滚动条的高度
         * @returns {Number}
         */
        public function get scrollHeight():int
        {
            return  _element.scrollHeight();
        };

        /**
         * 获取元素相对文档页面边界的矩形坐标。
         * 如果元素的 position = fixed 或者 force=== true 则相对浏览器窗口的位置
         * @param boolean global 是否为全局坐标
         * @returns {left,top,right,bottom,width,height}
         */
        public function getBoundingRect( global:Boolean=false ):Object
        {
            return _element.getBoundingRect( global );
        };


        /**
         * 获取元素相对父元素的左边距
         * @returns {Number}
         */
        public function get left():int
        {
            return _element.left();
        }
        /**
         * 设置元素相对父元素的左边距
         * @returns {Number}
         */
        public function set left( value:int ):void
        {
            if( !isNaN(value) )
            {
                _element.left( value );
            }
        }

        /**
         * 获取元素相对父元素的上边距
         * @returns {Number}
         */
        public function get top():int
        {
            return _element.top();
        }
        /**
         * 设置元素相对父元素的上边距
         * @returns {Number}
         */
        public function set top( value:int ):void
        {
            if( !isNaN(value) )
            {
                _element.top( value );
            }
        }

        /**
         * 获取元素相对父元素的右边距
         * @returns {Number}
         */
        public function get right():int
        {
            return _element.right();
        }
        /**
         * 设置元素相对父元素的右边距
         * @returns {Number}
         */
        public function set right( value:int ):void
        {
            if( !isNaN(value) )
            {
                _element.right( value );
            }
        }

        /**
         * 获取元素相对父元素的下边距
         * @returns {Number}
         */
        public function get bottom():int
        {
            return _element.bottom();
        }
        /**
         * 设置元素相对父元素的下边距
         * @returns {Number}
         */
        public function set bottom( value:int ):void
        {
            if( !isNaN(value) )
            {
                _element.bottom( value );
            }
        }

        /**
         *  将本地坐标点转成相对视图的全局点
         *  @param left
         *  @param top
         *  @returns {object} left top
         */
        public function localToGlobal(left:int, top:int):Object
        {
            return _element.localToGlobal(left, top);
        };

        /**
         *  将视图的全局点转成相对本地坐标点
         *  @param left
         *  @param top
         *  @returns {object}  left top
         */
        public function globalToLocal(left:int, top:int ):Object
        {
            return _element.globalToLocal(left, top);
        };
        
        /**
         * @private
         */
        private var parentDisplay:IContainer=null;

        /**
         * @es_internal
         */
        es_internal function setParentDisplay(value:IContainer=null):void
        {
            parentDisplay = value;
        }

        /**
         * 获取父级皮肤元素
         * 只有已经添加到父级元素中才会返回父级皮肤元素，否则返回 null
         * @returns {Display}
         */
        public function get parent():IContainer
        {
            return parentDisplay;
        };

        /**
         * 判断当前元素是否已经添加到文档链中
         * @returns {*}
         */
        public function inDocumentChain()
        {
            return Element.contains( document, this._element[0] );
        }

        /**
         * 渲染显示皮肤对象。
         * 调用此方法会重新创建子级对象，在非必要情况下请谨慎使用，可以节省资源。
         */
        public function display():Element
        {
            return this._element;
        };

        /**
        * @private
        */
        private var _owner:IContainer=null;

        /**
        * 获取一个承载此元素的容器
        * 默认返回null在当前节点中添加
        */
        public function get owner():IContainer
        {
            return _owner;
        }

        /**
        * 设置一个承载此元素的容器
        * 可以是任何元素节点对象
        */
        public function set owner(value:IContainer):void
        {
            _owner = value;
        }
    }
}