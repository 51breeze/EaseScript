/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.components
{
    import es.components.Component;
    import es.events.ComponentEvent;
    import es.core.Skin;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    public class SkinComponent extends Component implements IDisplay
    {
        public function SkinComponent()
        {
            super();
        }

        /**
         * @private
         */
        private var _skin:Skin = null;

        /**
         * 获取皮肤对象
         * @returns {Object}
         */
        public function get skin():Skin
        {
            if (this._skin === null)
            {
                var skinClass:Class = this.skinClass;
                if( skinClass===null ){
                    throw new TypeError("skinClass is not assign");
                }
                var skin:Skin = (Skin)new skinClass( this );
                //skin.addEventListener( ElementEvent.ADD, this.display, false, 0, this );
                this._skin = skin;
            }
            return this._skin;
        };

        /**
         * @protected
         */
        private var _skinClass:Class=null;

        /**
         * 获取皮肤类
         */
        public function get skinClass():Class
        {
            return this._skinClass;
        }

        /**
         * 设置一个皮肤类
         * @param value
         */
        public function set skinClass(value:Class):void
        {
            var old:Class = this._skinClass;
            if( old !== value )
            {
                this._skinClass = value;
                if( this.initialized )
                {
                    var skin:Skin = (Skin)new value( this );
                    this._skin = skin;
                    if( !(skin instanceof Skin) ){
                        throw new TypeError("skinClass is not Skin");
                    }
                    if( this.hasEventListener(PropertyEvent.CHANGE) )
                    {
                        var event:PropertyEvent = new PropertyEvent(PropertyEvent.CHANGE);
                        event.oldValue = old;
                        event.newValue = value;
                        event.property = 'skinClass';
                        this.dispatchEvent(event);
                    }
                    //skin.addEventListener( ElementEvent.ADD, this.display, false, 0, this );
                }
            }
        }

        /**
         * @private
         */
        private var properties:Object={};

        /**
         * 获取此对象的高度
         */
        public function get height():uint
        {
            if( this.initialized )
            {
                return this.skin.height;
            }
            return properties.height;
        }

        /**
         * 设置此对象的高度
         */
        public function set height(value:uint):void
        {
            if( this.initialized )
            {
                this.skin.height = value;
            }
            properties.height = value;
        }

        /**
         * 获取此对象的高度
         */
        public function get width():uint
        {
            if( this.initialized )
            {
                return this.skin.width;
            }
            return properties.width;
        }

        /**
         * 设置此对象的高度
         */
        public function set width(value:uint):void
        {
            if( this.initialized ) {
                this.skin.width = value;
            }
            properties.width=value;
        }

        /**
         * 获取元素对象
         * @returns {Element}
         */
        public function get element():Element
        {
            return this.skin.element;
        }

        /**
         * 标记此显示对象是否可见
         * @param flag
         */
        public function set visible( flag:Boolean ):void
        {
            if( this.initialized )
            {
                this.skin.visible = flag;
            }
            properties.visible=flag;
        };

        /**
         * 获取此显示对象的可见状态
         * @returns {Boolean}
         */
        public function get visible():Boolean
        {
            if( this.initialized ) {
                return this.skin.visible;
            }
            return properties.visible;
        };

        /**
         * 获取元素相对父元素的左边距
         * @returns {Number}
         */
        public function get left():int
        {
            if( this.initialized ) {
                return this.skin.left;
            }
            return properties.left;
        };

        /**
         * 设置元素相对父元素的左边距
         * @returns {Number}
         */
        public function set left( value:int ):void
        {
            if( this.initialized )
            {
                this.skin.left = value;
            }
            properties.left=value;
        };

        /**
         * 获取元素相对父元素的上边距
         * @returns {Number}
         */
        public function get top():int
        {
            if( this.initialized ) {
                return this.skin.top;
            }
            return properties.top;
        };

        /**
         * 设置元素相对父元素的上边距
         * @returns {Number}
         */
        public function set top( value:int ):void
        {
            if( this.initialized )
            {
                this.skin.top = value;
            }
            properties.top=value;
        };

        /**
         * 获取元素相对父元素的右边距
         * @returns {Number}
         */
        public function get right():int
        {
            if( this.initialized ) {
                return this.skin.right;
            }
            return properties.right;
        };

        /**
         * 设置元素相对父元素的右边距
         * @returns {Number}
         */
        public function set right( value:int ):void
        {
            if( this.initialized )
            {
                this.skin.right = value;
            }
            properties.right=value;
        };

        /**
         * 获取元素相对父元素的下边距
         * @returns {Number}
         */
        public function get bottom():int
        {
            if( this.initialized )
            {
                return this.skin.bottom;
            }
            return properties.bottom;
        };

        /**
         * 设置元素相对父元素的下边距
         * @returns {Number}
         */
        public function set bottom( value:int ):void
        {
            if( this.initialized )
            {
                this.skin.bottom = value;
            }
            properties.bottom=value;
        };

        /**
         * 获取父级皮肤元素
         * 只有已经添加到父级元素中才会返回父级皮肤元素，否则返回 null
         * @returns {Display}
         */
        public function get parent():IDisplay
        {
            if( this.initialized ) {
                return this.skin.parent;
            }
            return null;
        }

        /**
         * 渲染显示皮肤对象。
         * 调用此方法会重新创建子级对象，在非必要情况下请谨慎使用，可以节省资源。
         */
        public function display():Element
        {
            if( !this.initialized )
            {
                this.initializing();
                this.commitPropertyAndUpdateSkin();
            }
            return this.skin.element;
        };

        /**
         * 提交属性并且立即刷新视图
         * 此方法只对使用模板渲染的皮肤对象才管用。
         * 并且要在调用方法之前有重新分配过数据,才会重新创建视图。
         */
        protected function commitPropertyAndUpdateSkin()
        {
            var skin:Skin = this.skin;
            Object.forEach(properties, function (value:*, name:String){
                skin[ name ] = value;
            });
            skin.commitPropertyAndUpdateSkin();
        }
    }
}
