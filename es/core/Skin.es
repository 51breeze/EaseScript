/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.components.SkinComponent;
    import es.core.Container;
    import es.core.Display;
    import es.core.es_internal;
    import es.components.Component;
    import es.events.SkinEvent;
    import es.core.State;
    import es.interfaces.IDisplay;
    public class Skin extends Container
    {
        /**
         * 皮肤类
         * @constructor
         */
        function Skin( name:*, attr:Object=null)
        {
            if( name instanceof Element )
            {
                super( name as Element );
                
            }else if( name instanceof String ) 
            {
                if ( name.charAt(0) === "#" || name.charAt(0) === "." ) 
                {
                    super( new Element(name) );

                } else
                {
                    var strAttr = '';
                    if (attr)
                    {
                        strAttr = System.serialize(attr, 'attr');
                    }
                    super( new Element('<' + name + " " + strAttr + '/>') );
                }

            }else
            {
                throw new Error( "Invalid parameter." );
            }
            this.addEventListener(ElementEvent.ADD,this.commitPropertyAndUpdateSkin);
        }

        /**
         * @private
         */
        private var stateGroup={};

        /**
         * 设置状态对象
         * 如果在每一个子皮肤中应用了当前状态，那么这些皮肤会随着状态的变化来决定是否显示在当前的视图中
         * @param String name
         * @param Array group
         */
        public function set states( value:Array ):void
        {
            var len = value.length;
            var i=0;
            var stateGroup=this.stateGroup;
            for(;i<len;i++)
            {
                var stateObj:State = value[i] as State;
                var name = stateObj.name;
                if( !name )throw new TypeError('name is not define in Skin.prototype.states');
                if( stateGroup.hasOwnProperty(name) )
                {
                    throw new TypeError('"'+name+'" has already been declared in Skin.prototype.states');
                }
                stateGroup[ name ] = stateObj;
            }
        };

        /**
         * @private
         */
        private var _currentState=null;

        /**
         * 设置当前状态组名
         */
        public function set currentState( name:String ):void
        {
            var current = this._currentState;
            if( current !== name )
            {
                this._currentState=name;
                currentStateObject = null;
                if( this.initialized )
                {
                    this.updateDisplayList();
                }
            }
        };

        /**
         * 获取当前状态组名
         * @returns {String}
         */
        public function get currentState():String
        {
            return this._currentState;
        }

        /**
         * 在第一次调用 createChildren 之前调用此函数，用来初始化皮肤需要的一些参数
         * 在子类中覆盖
         */
        protected function initializing(){}

        /**
         * @private
         */
        private var _render:Render;

        /**
         * 设置一个渲染器
         * @param value
         */
        public function set render( value:Render ):void
        {
             _render = value;
        };

        /**
         * 获取一个渲染器
         * @returns {Render}
         */
        public function get render():Render
        {
            var obj = _render;
            if( !obj )
            {
                obj = new Render();
                _render = obj;
            }
            return obj;
        };

        /**
         * 设置一个皮肤模板
         * @param value
         * @returns {*}
         */
        public function set template( value:String ):void
        {
            this.render.template( value );
        };

        /**
         * 获取皮肤模板
         * @returns {String}
         */
        public function get template():String
        {
            return this.render.template();
        };

        /**
         * 为模板设置变量
         * @param name
         * @param value
         */
        public function variable(name,value)
        {
            invalidate = false;
            return this.render.variable( name,value );
        };

        /**
         * 当修改数据或者属性后调用此方法来提交属性并刷新视图
         */
        public function commitPropertyAndUpdateSkin()
        {
            if( initialized===false )
            {
                initialized = true;
                this.initializing();
            }
            this.createChildren();
        }

        /**
         * 渲染显示皮肤对象。
         * 调用此方法会重新创建子级对象，在非必要情况下请谨慎使用，可以节省资源。
         */
        override public function display():Element
        {
            if( initialized===false )
            {
                this.commitPropertyAndUpdateSkin();
            }
            return super.display();
        };

        /**
         * @private
         */
        protected var initialized:Boolean=false;

        /**
         * @private
         */
        private var invalidate:Boolean=false;

        /**
         * 创建一组子级元素
         * 当前皮肤被添加到视图中后会自动调用，无需要手动调用
         */
        protected function createChildren()
        {
            if( invalidate === true )return;
            invalidate = true;
            var element:Element = this.element;
            var render = this._render;
            if( render )
            {
                var str:String = render.fetch();
                if( str )element.html( str );
                
            }else
            {
                var children:Array = this.children;
                var len = children.length;
                var c = 0;
                var child:IDisplay;
                for (; c < len; c++)
                {
                    child = children[c] as IDisplay;
                    element.addChild( child.display() );
                }
            }

            if( this.hasEventListener(SkinEvent.CREATE_CHILDREN_COMPLETED) )
            {
                var e:SkinEvent = new SkinEvent( SkinEvent.CREATE_CHILDREN_COMPLETED );
                e.parent = this.parent;
                e.child = this;
                this.dispatchEvent( e );
            }
            this.updateDisplayList();
        };

        /**
         * @private
         */
        private var currentStateObject:State=null;

        /**
         * @private
         * @param stateGroup
         * @param currentState
         * @returns {*}
         */
        private function getCurrentState():State
        {
            var currentState = this.currentState;
            if( !currentState )return null;
            if( this.currentStateObject ){
                return this.currentStateObject;
            }
            var stateGroup = this.stateGroup;
            if( stateGroup.hasOwnProperty( currentState ) )return stateGroup[ currentState ] as State;
            for( var p in stateGroup )
            {
                var state:State = stateGroup[p] as State;
                if( state.includeIn(currentState) )
                {
                    this.currentStateObject = state;
                    return state;
                }
            }
            throw new ReferenceError('"' + currentState + '"' + ' is not define');
        }

        /**
         * 更新显示列表
         */
        protected function updateDisplayList()
        {
            var stateGroup:State = getCurrentState();
            if( stateGroup )
            {
                var elems = new Element('[includeIn],[excludeFrom]', this.element );
                //隐藏或者显示当前已设置的状态
                elems.forEach(function ()
                {
                    var includeIn   = elems.property('includeIn');
                    var excludeFrom = elems.property('excludeFrom');
                    var _include    = true;
                    if( includeIn ){
                        _include = stateGroup.includeIn(includeIn);
                    }
                    if( excludeFrom ) {
                        _include = !stateGroup.includeIn(excludeFrom);
                    }
                    _include ? elems.show() : elems.hide();
                });

                if( this.hasEventListener(SkinEvent.INTERNAL_UPDATE_STATE) )
                {
                    var e:SkinEvent = new SkinEvent( SkinEvent.INTERNAL_UPDATE_STATE );
                    e.state = stateGroup;
                    this.dispatchEvent( e );
                }
            }
        }

    }
}
