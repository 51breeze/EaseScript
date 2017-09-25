/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/

/**
 * 所有皮肤组件的基类。
 * 只有需要显示皮肤的组件才需要继承此类。此组件是 Component 的子类，具备 Component 的特性。
 * 有关SkinGroup的用法请查看SkinGroup的说明。
 * @param SkinGroup skinGroup
 * @returns {Component}
 * @constructor
 */

package es.components
{
    import es.components.Component;
    import es.events.ComponentEvent;
    import es.core.Skin;
    import es.core.Container;
    import es.core.es_internal;

    public class SkinComponent extends Component
    {
        /**
         * 安装皮肤。
         * 此阶段为编译阶段将皮肤转化成html
         * 此函数无需要手动调用，皮肤在初始化时会自动调用
         */
        protected function skinInstaller()
        {
            var skin = this.skin;
            skin.createChildren();
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
                return true;
            }
            return false;
        }

        /**
         * @private
         */
        private var __skin__ = null;

        /**
         * 获取皮肤对象
         * @returns {Object}
         */
        public function get skin():Skin
        {
            if (this.__skin__ === null)
            {
                var skinClass = this.skinClass;
                if( skinClass===null )skinClass = Skin;
                this.__skin__ = new skinClass();
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
                    this.__skin__ = new value();
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
        private var __viewport__:Container = null;

        /**
         * @returns {Object}
         */
        public function get viewport():Container
        {
            return this.__viewport__;
        };

        /**
         * 设置此组件在指定的视口中
         * @param Object obj
         * @returns {void}
         */
        public function set viewport(obj:Container):void
        {
            var old = this.__viewport__;
            if( obj !== old )
            {
                if( old )
                {
                    old.removeEventListener( ElementEvent.ADD, this.display);
                }
                this.__viewport__ = obj;
                
                //自动显示组件
                if( this.__auto__ )
                {
                    //当视图被添加时渲染显示此组件
                    obj.addEventListener( ElementEvent.ADD, this.display, false, 0, this);
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
                 var viewport = this.viewport;
                 if( viewport )
                 {
                     viewport.removeEventListener(ElementEvent.ADD,this.display);
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
                this.initializeCompleted = true;
                this.initializing();
                this.skinInstaller();
                this.initialized();

            }else if( this._updateSkin===true )
            {
                this.skinInstaller();
            }
            this._updateSkin=false;
            return flag;
        };
    }
}
