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
    import es.core.es_internal;
    use namespace es_internal;

    public class SkinComponent extends Component
    {
        public function SkinComponent()
        {
            super();
        }
        
        /**
         * 安装皮肤。
         * 此阶段为编译阶段将皮肤转化成html
         * 此函数无需要手动调用，皮肤在初始化时会自动调用
         */
        protected function skinInstaller()
        {
            skin.skinInstaller();
            this.viewport.addChild( skin );
        }

        /**
         * 组件初始化进行中
         * @returns {Boolean}
         */
        override protected function initializing():Boolean
        {
            if( super.initializing() )
            {
                this.skin.es_internal::hostComponent = this;
                var _height = this.height;
                if( _height !== NaN ){
                    (this.skin as IDisplay).height = _height;
                }
                var _width  = this.width;
                if( _width !== NaN ){
                    (this.skin as IDisplay).width = _width;
                }
                return true;
            }
            return false;
        }

        /**
         * @private
         */
        private var __skin__:Skin = null;

        /**
         * 获取皮肤对象
         * @returns {Object}
         */
        public function get skin():Skin
        {
            if (this.__skin__ === null)
            {
                var skinClass:Class = this.skinClass;
                if( skinClass===null ){
                    throw new TypeError("skinClass is not assign");
                }
                this.__skin__ = new skinClass();
                if( !(this.__skin__ instanceof Skin) ){
                    throw new TypeError("skinClass is not Skin");
                }
            }
            return this.__skin__;
        };

        /**
         * @protected
         */
        private var __skinClass__:Class=null;

        /**
         * 获取皮肤类
         */
        public function get skinClass():Class
        {
            return this.__skinClass__;
        }

        /**
         * 设置一个皮肤类
         * @param value
         */
        public function set skinClass(value:Class):void
        {
            var old = this.__skinClass__;
            if( old !== value )
            {
                this.__skinClass__ = value;
                if( this.initializeCompleted )
                {
                    this.__skin__ =  new value();
                    if( !(this.__skin__ instanceof Skin) ){
                        throw new TypeError("skinClass is not Skin");
                    }
                    this.skin.es_internal::hostComponent= this;
                    this.skinInstaller();
                    if( this.hasEventListener(PropertyEvent.CHANGE) )
                    {
                        var event = new PropertyEvent(PropertyEvent.CHANGE);
                        event.oldValue = old;
                        event.newValue = value;
                        event.property = 'skinClass';
                        this.dispatchEvent(event);
                    }
                }
            }
        }

        /**
         * @private
         */
        private var __viewport__:IContainer = null;

        /**
         * @returns {Object}
         */
        public function get viewport():IContainer
        {
            return this.__viewport__;
        };

        /**
         * 设置此组件在指定的视口中
         * @param Object obj
         * @returns {void}
         */
        public function set viewport(container:IContainer):void
        {
            var old:IContainer = this.__viewport__;
            if( container !== old )
            {
                if( old )
                {
                    (old as EventDispatcher).removeEventListener( ElementEvent.ADD, this.display);
                }
                this.__viewport__ = container;
                
                //自动显示组件
                if( this.__auto__ )
                {
                    //当视图被添加时渲染显示此组件
                    (container as EventDispatcher).addEventListener( ElementEvent.ADD, this.display, false, 0, this);
                }
            }
        };

        /**
         * @private
         */
        private var __auto__=true;

        /**
         * 标记为是否自动显示组件, 如果为 false 则必须手动调用 display 方法才会显示此组件
         * @param value
         */
        public function set auto( value:Boolean ):void
        {
             this.__auto__=value;
             if( value===false )
             {
                 var viewport:IContainer = this.viewport;
                 if( viewport )
                 {
                     (viewport as EventDispatcher).removeEventListener(ElementEvent.ADD,this.display);
                 }
             }
        }

        /**
         * @public
         */
        public function get auto():Boolean
        {
            return this.__auto__;
        }

        /**
         * @private
         */
        private var _height:Number=NaN;

        /**
         * 获取此对象的高度
         */
        public function get height():Number
        {
            if( initializeCompleted )
            {
                return (this.skin as IDisplay).height;
            }
            return _height;
        }

        /**
         * 设置此对象的高度
         */
        public function set height(value:Number):void
        {
            _height = value;
            if( initializeCompleted )
            {
                (this.skin as IDisplay).height = value;
            }
        }

        /**
         * @private
         */
        private var _width:Number=NaN;

        /**
         * 获取此对象的高度
         */
        public function get width():Number
        {
            if( initializeCompleted )
            {
                return (this.skin as IDisplay).width;
            }
            return _width;
        }

        /**
         * 设置此对象的高度
         */
        public function set width(value:Number):void
        {
            _width = value;
            if( initializeCompleted )
            {
                (this.skin as IDisplay).width = value;
            }
        }

        /**
         * 提交属性并更新到皮肤
         */
        protected function commitPropertyAndUpdateSkin()
        {
            if( initializeCompleted )
            {
                updateSkin();
                display();
            }
        }

        /**
         * 标记组件是否初始化完成
         */
        protected var initializeCompleted = false;

        /**
         * 标记组件在是否需要更新皮肤
         * 此标记主要是用来优化重复渲染皮肤造成性能的问题。
         */
        private var _updateSkin=true;
        protected function updateSkin()
        {
            this._updateSkin=true;
        }

        /**
         * 渲染显示皮肤对象。
         * 调用此方法会重新创建子级对象，在非必要情况下请谨慎使用，可以节省资源。
         */
        public function display()
        {
            var flag = this.initializeCompleted;
            if( !flag )
            {
                this.initializing();
                this.skinInstaller();
                this.initialized();
                this.initializeCompleted = true;

            }else if( this._updateSkin===true )
            {
                this.skinInstaller();
            }
            this._updateSkin=false;
            return flag;
        };
    }
}
