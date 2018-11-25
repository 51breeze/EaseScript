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
    import es.core.Skin;
    import es.events.SkinEvent;
    import es.core.State;
    import es.interfaces.IDisplay;
    import es.interfaces.IContainer;
    import es.core.BaseLayout;
    public class Skin extends Container
    {
        private var _name:String="div";

        private var _attr:Object = null;

        /**
         * 皮肤类
         * @constructor
         */
        function Skin( name:*, attr:Object=null)
        {
            this._name = name;
            this._attr = attr;
            var ele:Element = null;
            if( Element.isHTMLContainer(name) )
            {
                ele= new Element(name);
            }
            else if( name instanceof Element )
            {
                ele=name as Element;

            }else if( name is IDisplay )
            {
                ele=(name as IDisplay).element;

            }else if( name instanceof String )
            {
                var id:String = (name as String).charAt(0);
                ele = id === "#" || id==="." || id==="<" ? new Element(name) : new Element('<' + name +'/>');
            }else
            {
                throw new Error( "Invalid parameter. in Skin" );
            }
            if( attr )
            {
                if( attr.innerHtml )
                {
                    ele.html( attr.innerHtml );
                    delete attr.innerHtml;
                }
                ele.properties( attr );
            }
            super( ele );
        }

        public function get name():String
        {
            return _name;
        }

        public function get attr():Object
        {
            return _attr;
        }


        [RunPlatform(server)]
        public function generateId():String
        {
            var ele:Element = this.element;
            var id:String = ele.property("id") as String;
            if( !id )
            {
                id = "S"+System.uid(8);
                ele.property("id", id);
            }
            return id;
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

        /**
         * 获取一个承载子级对象的容器
         * 如果需要改变此默认容器，请在子类中覆盖此方法
         * @return {es.interfaces.IContainer}
         */
        public function getContainer():IContainer
        {
            return this;
        }

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
            var len:int = value.length;
            var i:int=0;
            var stateGroup:Object=this.stateGroup;
            for(;i<len;i++)
            {
                var stateObj:State = value[i] as State;
                var name:String = stateObj.name;
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
        private var _currentState:String=null;

        /**
         * 设置当前状态组名
         */
        public function set currentState( name:String ):void
        {
            var current:String = this._currentState;
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
            var obj:Render = _render;
            if( !obj )
            {
                obj = new Render();
                _render = obj;
            }
            return obj;
        };

        /**
         * @private
         */
        private var hasChildTemplate:Boolean = false;

        /**
         * 设置一个皮肤模板
         * @param value
         * @returns {*}
         */
        public function set template( value:Function ):void
        {
           // hasChildTemplate = !!value;
           // this.render.template( value );
        };

        /**
         * 获取皮肤模板
         * @returns {String}
         */
        public function get template():Function
        {
            //return this.render.template();
            return null;
        };

        /**
         * 设置或者获取指定名称在模板数据集中的值
         * @param name
         * @param value
         */
        public function variable(name:String,value:*=null):*
        {
            var oldValue:* = this.render.variable(name);
            if(value===null)return oldValue;
            if( oldValue !== value )
            {
                this.render.variable(name, value);
                if (initialized === true)
                {
                    invalidate = false;
                    this.display();
                }
            }
            return value;
        };

        /**
         * 分配指定名称的值到模板数据集中
         * @param name
         * @param value
         */
        public function assign(name:String,value:*=null):*
        {
            if( value !== null )
            {
                var children: Array = this.children;
                var len: int = children.length;
                var c: int = 0;
                for (; c < len; c++) {
                    if (children[c] is Skin) {
                        var child: Skin = children[c] as Skin;
                        if (child.hasChildTemplate && _inheritAssign === true) {
                            child.assign(name, value);
                        }
                    }
                }
            }
            return this.variable(name,value);
        }

        /**
         * @private
         */
        private var _inheritAssign:Boolean=true;

        /**
         * 指示当前皮肤是否继承为父级指定的数据。
         * true为继承,false为不继承。
         * 默认为true
         * @param value
         */
        public function set inheritAssign(value:Boolean):void
        {
            _inheritAssign = value;
        }

        /**
         * 获取可继承的数据标记
         * @return {Boolean}
         */
        public function get inheritAssign():Boolean
        {
            return _inheritAssign;
        }

        /**
         * 渲染显示皮肤对象。
         * 调用此方法会重新创建子级对象，在非必要情况下请谨慎使用，可以节省资源。
         */
        override public function display():Element
        {
            if( initialized===false )
            {
                initialized = true;
                this.initializing();
            }
            this.createChildren();
            this.updateVirtualElements();
            return super.display();
        };

        /**
        *  支持对虚拟元素的处理
        *  更新虚拟元素列表
        */
        protected function updateVirtualElements():void
        {
           var count:int = this.virtualChildrenCount;
           var lastCount:int = this.virtualChildrenLastCount;
        
           //当前的虚拟子级元素小于上一次时需要删除
           if( count < lastCount )
           {
                var hashElements:Object = this.virtualHashElements;
                this.virtualChildrenElements.splice(count, lastCount - count).forEach(function(key:int)
                {
                      var obj:IDisplay = hashElements[ key ] as IDisplay;
                      if( obj.parent )
                      {
                         (obj.parent as IContainer).removeChild( obj );
                      } 
                      delete hashElements[ key ];
                });
                this.virtualChildrenLastCount = count;
           }
        }

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
            var render:Render = this._render;
            if( render && hasChildTemplate )
            {
                var str:String = render.fetch();
                if( str )element.html( str );

            }else
            {
                var children:Array = this.children;
                var len:int = children.length;
                var c:int = 0;
                for (; c < len; c++)
                {
                    var child:IDisplay = children[c] as IDisplay;
                    when(RunPlatform(server))
                    {
                        if (child is SkinComponent && (child as SkinComponent).async === true)
                        {
                            continue;
                        }
                    }

                    var ele:Element = child.display();
                    if( !ele[0].parentNode || ele[0].parentNode.nodeType === 11 )
                    {
                        element.addChild( ele );
                    }
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
        [RunPlatform(client)]
        private var currentStateObject:State=null;

        /**
         * @private
         * @param stateGroup
         * @param currentState
         * @returns {*}
         */
        [RunPlatform(client)]
        private function getCurrentState():State
        {
            var currentState:String = this.currentState;
            if( !currentState )return null;
            if( this.currentStateObject )
            {
                return this.currentStateObject;
            }
            var stateGroup:Object = this.stateGroup;
            if( stateGroup.hasOwnProperty( currentState ) )return stateGroup[ currentState ] as State;
            for( var p:String in stateGroup )
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
         * 此方法主要用来显示和隐藏指定对应状态的元素
         * 当调用 createChildren 方法后，系统会自动调用无需手动调用。
         */
        [RunPlatform(client)]
        protected function updateDisplayList()
        {
            var stateGroup:State = getCurrentState();
            if( stateGroup )
            {
                var elems:Element = new Element('[includeIn],[excludeFrom]', this.element );

                //隐藏或者显示当前已设置的状态
                elems.forEach(function ()
                {
                    var includeIn:String = elems.property('includeIn');
                    var excludeFrom:String = elems.property('excludeFrom');
                    var _include:Boolean    = true;
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

        private var virtualChildrenElements:Array=[];
        private var virtualChildrenCount:int=0;
        private var virtualChildrenLastCount:int=0;
        private var virtualHashElements:Object={};


         /**
         * 创建一个子级虚拟元素，如果不存在
         */ 
        protected function createVirtualElement(childIndex:int,key:int,id:int,name:String,attr:Object=null,bidding:Object=null):IDisplay
        {
            var uniquekey:int = key+id;
            var obj:IDisplay = virtualHashElements[ uniquekey ] as IDisplay;
            if( !obj || obj.name !== name )
            {
                if( obj && obj.parent )
                {
                   (obj.parent as IContainer).removeChild( obj );
                   this.virtualChildrenElements.splice( this.virtualChildrenElements.indexOf( uniquekey ) , 1);
                }
                obj = new Skin(name,attr) as IDisplay;
                virtualHashElements[ uniquekey ] = obj;
                this.addChildAt(obj,childIndex);
                this.virtualChildrenElements.push( uniquekey );
            }
            if( bidding )
            {
                obj.element.properties( bidding );
            }
            this.virtualChildrenCount++;
            return obj;
        }

         /**
         * 创建一个子级元素，如果不存在
         */ 
        protected function createVirtualComponent(childIndex:int,key:int,id:int,callback:Function,bidding:Function=null):IDisplay
        {
            var uniquekey:int = key+id;
            var obj:IDisplay = virtualHashElements[ uniquekey ] as IDisplay;
            var newObj:IDisplay = callback( obj ) as IDisplay;
            if( newObj !== obj )
            {
               if( obj && obj.parent )
               {
                   (obj.parent as IContainer).removeChild( obj );
                   this.virtualChildrenElements.splice( this.virtualChildrenElements.indexOf( uniquekey ) , 1);
               }
               virtualHashElements[ uniquekey ] = newObj; 
               this.addChildAt(newObj,childIndex); 
               this.virtualChildrenElements.push( uniquekey );
            }
            if( bidding ){
                bidding( newObj );
            }
            this.virtualChildrenCount++;
            return newObj;
        }
    }
}
