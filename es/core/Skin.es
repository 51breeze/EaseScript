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
    import es.core.VirtualElement;
    import es.events.SkinEvent;
    import es.events.StateEvent;
    import es.core.State;
    import es.interfaces.IDisplay;
    import es.core.Display;
    import es.interfaces.IContainer;
    import es.core.BaseLayout;
    import es.core.Render;
    import es.interfaces.IRender;
    import es.core.es_internal;

    public class Skin extends Container
    {
       
        /**
         * 皮肤类
         * @constructor
         */
        function Skin( name:*, attr:Object=null)
        {
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
            super( ele, attr );
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
        private var _children:Array=[];

        /**
         * 获取子级元素
         * @returns {Array}
         */
        override public function get children():Array
        {
            return this._children.slice(0);
        };

        /**
         * 获取指定索引处的子级元素
         * @param index
         * @returns {IDisplay}
         */
        override public function getChildAt( index:Number ):IDisplay
        {
            var children:Array = this._children;
            index = index < 0 ? index+children.length : index;
            if( !children[index] )
            {
                throw new RangeError('The index out of range');
            }
            return children[index].target as IDisplay;
        };

        /**
         * 根据子级皮肤返回索引
         * @param child
         * @returns {Number}
         */
        override public function getChildIndex( child:IDisplay ):Number
        {
            var children:Array = this._children;
            var len:int = children.length;
            var index:int = 0;
            for(;index<len;index++)
            {
                if( children[index].target === child )
                {
                    return index;
                }
            }
            return -1;
        };


         /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         * @returns {Display}
         */
        override public function addChildAt( child:IDisplay , index:Number ):IDisplay
        {
            var parent:IDisplay = child.parent;
            if( parent )
            {
                (parent as Container).removeChild( child );
            }
            var children:Array = this._children;
            var at:Number = index < 0 ? index+children.length+1 : index;
            children.splice(at, 0, {target:child,index:index});
            if( child is SkinComponent )
            {
                child = (child as SkinComponent).skin as IDisplay;
            }
            child.es_internal::setParentDisplay(this);
            return child;
        };

        /**
         * 移除指定的子级元素
         * @param child
         * @returns {Display}
         */
        override public function removeChild( child:IDisplay ):IDisplay
        {
            var children:Array = this._children;
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
        override public function removeChildAt( index:Number ):IDisplay
        {
            var children:Array = this._children;
            index = index < 0 ? index+children.length : index;
            if( !(children.length > index) )
            {
                throw new RangeError('The index out of range');
            }

            var child:IDisplay = children[index].target as IDisplay;
            children.splice(index, 1);
            if( child is SkinComponent )
            {
                child = (child as SkinComponent).skin as IDisplay;
            }
            if( child.parent )
            {
                child.element.parent().removeChild( child.element );
            }
            child.es_internal::setParentDisplay(null);
            return child;
        };

        /**
         * 移除所有的子级元素
         */
        override public function removeAllChild():void
        {
            var len:int = this._children.length;
            while( len>0 )
            {
                this.removeChildAt( --len );
            }
        }

        /**
         * @private
         */
        private var statesGroup:Object={};

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
            var statesGroup:Object=this.statesGroup;
            for(;i<len;i++)
            {
                var stateObj:State = value[i] as State;
                var name:String = stateObj.name;
                if( !name )throw new TypeError('name is not define in Skin.states');
                if( statesGroup.hasOwnProperty(name) )
                {
                    throw new TypeError('"'+name+'" has already been declared in Skin.states');
                }
                statesGroup[ name ] = stateObj;
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
                this._currentStateGroup = null;
                if( this.hasEventListener(StateEvent.CHANGE) )
                {
                    var e:StateEvent = new StateEvent(StateEvent.CHANGE);
                    e.oldState = current;
                    e.newState = name;
                    this.dispatchEvent(e);
                }
                if( this.initialized )
                {
                    this.invalidate = false;
                    this.createChildren();
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
         * @private
         */
        private var _currentStateGroup:State=null;

        /**
         * @private
         * @param stateGroup
         * @param currentState
         * @returns {*}
         */
        protected function getCurrentStateGroup():State
        {
            var currentState:String = this._currentState;
            if( !currentState )
            {
                throw new ReferenceError('State is not define.');
            }

            if( this._currentStateGroup )
            {
                return this._currentStateGroup;
            }
            var state:State = null;
            var statesGroup:Object = this.statesGroup;
            if( statesGroup.hasOwnProperty( currentState ) )
            {
                state = statesGroup[ currentState ] as State;
                this._currentStateGroup = state;
                return state;
            }

            for( var p:String in statesGroup )
            {
                state = statesGroup[p] as State;
                if( state.includeIn(currentState) )
                {
                    this._currentStateGroup = state;
                    return state;
                }
            }
            throw new ReferenceError('"' + currentState + '"' + ' is not define');
        }

        /**
         * 在第一次调用 createChildren 之前调用此函数，用来初始化皮肤需要的一些参数
         * 在子类中覆盖
         */
        protected function initializing(){}

    
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
            if( invalidate === false )
            {
                invalidate = true;

                var children:Array = this._children;
                var i:int = 0;
                var len:int = children.length;
                var child:IDisplay = null;
                var parent:IDisplay = null;
                var container:Element = this.element;
                var render:IRender = this._render;
                if( render )
                {
                    var nodes:Array= render.create(this) as Array;
                    for(;i<len;i++)
                    {
                        child = children[i].target as IDisplay;
                        parent = child.parent;
                        if( parent && parent !== this )
                        {
                            (parent as Container).removeChild( child );
                        }
                        nodes.splice(children[i].index,0, child.display()[0] );
                    }
                    render.createChildren( container[0], nodes);

                }else
                {
                    for(;i<len;i++)
                    {
                       child = children[i].target as IDisplay;
                       parent = child.parent;
                       if( parent !== this )
                       {
                            if( parent )
                            {
                                (parent as Container).removeChild( child );
                            }
                            container.addChildAt( (children[i].target as IDisplay).display(), children[i].index );
                       }
                    }
                }
                this.updateDisplayList();
            }
        };

        /**
         * 更新显示列表
         * 此方法主要用来显示和隐藏指定对应状态的元素
         * 当调用 createChildren 方法后，系统会自动调用无需手动调用。
         */
        protected function updateDisplayList()
        {
            /*
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
            }*/
        }

         /**
         * @private
         */
        private var _render:IRender=null;

         /**
         * 获取当前元素的渲染工厂
         * @param name
         * @param value
         */
        protected function get render():IRender
        {
             var render:IRender = this._render;
             if( render===null )
             {
                render = new Render();
                render.dataset = _dataset;
                this._render = render;
             }
             return render;
        }

        protected function set render(value:IRender=null):void
        {
            this._render = value;
            invalidate = false;
        }

        /**
         * 分配指定名称的值到模板数据集中
         * @param name
         * @param value
         * @return {*}
         */
        public function assign(name:String,value:*=null):*
        {
            var dataset:Object = _dataset;
            if( value===null )
            {
                return dataset[name];
            }

            if( dataset[name] !== value )
            {
                invalidate=false;
                this.render.assign(name,value);
                if( initialized )
                {
                    // this.createChildren();
                }
            }
            return value;
        }

        /**
        *@private
        */  
        private var _dataset:Object={};

        /**
        * 获取数据集
        */
        public function get dataset():Object
        {
            return _dataset;
        }

        /**
        * 设置数据集
        */
        public function set dataset(value:Object):void
        {
            _dataset = value;
            this.render.dataset=value;
            invalidate=false;
        }
    }
}
