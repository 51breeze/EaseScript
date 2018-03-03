/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.Container;
    import es.core.Display;
    import es.core.es_internal;
    import es.components.Component;
    import es.events.SkinEvent;
    import es.core.State;
    import es.interfaces.IDisplay;

    public class Skin extends Container
    {
        private var _hash:Object;
        private var _skinChildren;
        private var _name:String;
        private var _attr:Object;

        /**
         * 皮肤类
         * @constructor
         */
        function Skin( skinObject:Object={} )
        {
            if( !(skinObject is Element) )
            {
                var attr = skinObject.attr || {};
                var name = skinObject.name || 'div';
                var hash = skinObject.hash;
                if (hash)
                {
                    hash = hash as JSON;
                    attr = attr as JSON;
                    for (var h in hash)
                    {
                        if (hash[h] === '@id')
                        {
                            hash[h] = System.uid();
                            if (attr.id === h) attr.id = hash[h];
                        }
                    }
                }
                this._skinChildren = skinObject.children || [];
                this._hash = skinObject.hash || {};
                this._name = name;
                this._attr = attr;
                var str = System.serialize(attr, 'attr');
                skinObject = new Element('<' + name + " " + str + '/>');
            }
            super( skinObject );
        }

        protected function get skinChildren():Array
        {
            return _skinChildren;
        }

        /**
         * 获取皮肤的节点名
         *  @returns String
         */
        public function get name():String
        {
            return _name;
        }

        public function set name(value:String)
        {
            _name = value;
        }

        public function set attr(value:Object):void
        {
            Object.merge( _attr, value );
            this.property( value );
        }

        public function get attr():Object
        {
             return _attr;
        }

        /**
         * 根据id获取子级元素
         * @param id
         * @returns Object
         */
        public function getChildById( id ):Object
        {
            if( _hash.hasOwnProperty(id) )
            {
                return _hash[id];
            }
            return null;
        };

        /**
         * @private
         */
        private var stateGroup:Object={};

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
            var stateGroup=this.stateGroup as JSON;
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
                this.updateDisplayList();
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
         * @private
         */
        private var _layout=null;

        /**
         * 设置布局对象
         */
        public function set layout( layoutObject:Object ):void
        {
            var current = this._layout;
            if( current !== layoutObject )
            {
                this._layout=layoutObject;
            }
        };

        /**
         * 获取布局对象
         * @returns {Object}
         */
        public function get layout():Object
        {
            return this._layout;
        }

        /**
         * 在第一次调用 createChildren 之前调用此函数，用来初始化皮肤需要的一些参数
         * 在子类中覆盖
         */
        protected function initializing(){}

        /**
         * @private
         */
        private var _hostComponent;

        /**
         * 设置皮肤的宿主组件
         * @param host
         * @returns {Component}
         */
        es_internal function set hostComponent(host:Component):void
        {
            if( host == null )throw new ReferenceError("hostComponent is null");
            _hostComponent = host;
            initializing();
        };

        /**
         * 获取皮肤的宿主组件
         * @param host
         * @returns {Component}
         */
        protected function get hostComponent():Component
        {
            return _hostComponent;
        };

        private var _render;

        /**
         * 设置一个渲染器
         * @param value
         */
        public function set render( value:Render ):void
        {
             this._render = value;
        };

        /**
         * 获取一个渲染器
         * @returns {Render}
         */
        public function get render():Render
        {
            var obj = this._render;
            if( !obj )this._render = obj = new Render();
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
            return this.render.template(null);
        };

        /**
         * 为模板设置变量
         * @param name
         * @param value
         */
        public function variable(name,value)
        {
            return this.render.variable( name,value );
        };

        /**
         * 安装皮肤
         */
        public function skinInstaller()
        {
            this.createChildren();
        }

        /**
         * 创建一组子级元素
         * 当前皮肤被添加到视图中后会自动调用，无需要手动调用
         */
        protected function createChildren()
        {
            var children:Array = this.skinChildren;
            var hash = this._hash;
            var len = children.length;
            var c = 0;
            var child;
            var render = this._render;
            var parent = this.displayParent;
            this.removeAllChild();
            if( render )
            {
                child = render.fetch();
                if( child )
                {
                    this.addChildAt( new Display( new Element( Element.createElement( child ) ) ) , -1 );
                }
            }

            for (;c<len;c++)
            {
                child = children[c];
                if( System.isObject(child) )
                {
                    child = Skin.parseSkinObject(child, hash);

                }else if( child instanceof Render )
                {
                    var rd:Render = child as Render;
                    child = rd.fetch();
                }

                if( child )
                {
                    if ( System.isString( child ) )
                    {
                        child = System.trim( child );
                        var elem = new Element( Element.createElement( child , true ) );
                        this.addChildAt( new Display( elem ) , -1);

                    }else if( child instanceof Skin )
                    {
                        (child as Skin).createChildren();
                        this.addChild( child as Display );
                    }
                }
            }
            if( this.hasEventListener(SkinEvent.CREATE_CHILDREN_COMPLETED) )
            {
                var e:SkinEvent = new SkinEvent( SkinEvent.CREATE_CHILDREN_COMPLETED );
                e.parent = parent;
                e.child = this;
                this.dispatchEvent( e );
            }
            this.updateDisplayList();
        };

        override public function toString()
        {
            createChildren();
            return super.toString();
        }

        /**
         * @private
         * @param stateGroup
         * @param currentState
         * @returns {*}
         */
        private function getCurrentState(currentState:String):State
        {
            var stateGroup = this.stateGroup as JSON;
            if( stateGroup.hasOwnProperty( currentState ) )return stateGroup[ currentState ] as State;
            for( var p in stateGroup )
            {
                var state:State = stateGroup[p] as State;
                if( state.includeIn(currentState) )
                {
                    return state;
                }
            }
            return null;
        }

        /**
         * 更新显示列表
         */
        protected function updateDisplayList()
        {
            var currentState = this.currentState;
            if( currentState )
            {
                var stateGroup:State = getCurrentState( currentState );
                if( !stateGroup )throw new ReferenceError('"'+currentState+'"'+' is not define');
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
            }
        }

        /**
         * 将皮肤对象转成html的字符串形式
         * @param skin
         * @param hash
         */
        static protected function parseSkinObject( skin:Object={} , hash={} ):String
        {
            var tag = skin.name || 'div';
            var children:Array = skin.children as Array;
            var content:String='';
            var len = children.length;
            var i = 0;
            for (;i<len;i++)
            {
                content += typeof children[i] ==="string" ? children[i] : Skin.parseSkinObject(children[i], hash);
            }
            if( tag==='text' )return content;
            var str:String = '<' + tag;
            var attr = (skin.attr || {}) as JSON;
            for (var p in attr)
            {
                var v = attr[p];
                v = p==='id' && hash.hasOwnProperty(v) ? hash[v] : v;
                str += " " + p + '="' + v + '"';
            }
            str += '>' + content + '</' + tag + '>';
            return str;
        }
    }
}
