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
    import es.interfaces.IBindable;
    import es.core.BaseLayout;
    import es.core.Render;
    import es.interfaces.IRender;
    import es.core.es_internal;

    public class Skin extends Container implements IBindable
    {
        /**
         * 皮肤类
         * @constructor
         */
        function Skin( name:*, attr:Object=null)
        {
            var elem:Element = null;
            if( typeof name === "string" )
            {
                elem=new Element( document.createElement(name) );
            }else if( name instanceof Element ){
                elem=name as Element;
            }else{
                elem = new Element( name );
            }
            super( elem , attr ); 
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

        protected function render():Array
        {
            return [];
        }

        /**
         * @private
         */
        private var _bindable:Bindable=null;

        /**
         * @protected
         */
        protected function getBindable():Bindable
        {
            var value:Bindable = _bindable;
            if( !value )
            {
                value = new Bindable(this,"*");
                _bindable = value;
            }
            return value;
        }

        /**
        * 观察指定的属性，如果当前对象或者目标对象上有指定的属性发生变化时相互调度
        * @param name 数据源上的属性名
        * @param target 目标对象
        * @param propName 目标属性名
        */
        public function watch(name:String,target:Object,propName:String):void
        {
           var bindable:Bindable= this.getBindable();
           bindable.bind(target, propName, name);
        }

        /**
        * 取消观察指定的属性
        * @param target 目标对象
        * @param propName 目标属性名
        */
        public function unwatch(target:Object,propName:String=null):void
        {
           var bindable:Bindable= this.getBindable();
           bindable.unbind(target, propName);
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
            children.push({target:child,index:index < 0 ? index+children.length+1 : index});
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
                var nodes:Array= this.render();
                for(;i<len;i++)
                {
                    child = children[i].target as IDisplay;
                    parent = child.parent;
                    if( parent && parent !== this )
                    {
                        (parent as Container).removeChild( child );
                    }
                    nodes.splice(children[i].index,0, child.display().current() );
                }
                this.updateNodes(this, nodes);
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
                dataset[name] = value;
                invalidate=false;
                if( initialized )
                {
                    //this.createChildren();
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
            invalidate=false;
            if( initialized === true )
            {
                //this.createChildren();
            }
        }

          /**
        * @private
        */
        private var bindEventHash:Object={};

        /**
        * 绑定事件至指定的目标元素
        */
        protected function bindEvent(index:int,uniqueKey:*,target:Object,events:Object):void
        {
            var uukey:String = (index+""+uniqueKey) as String;
            var data:Object = bindEventHash[uukey] as Object;
            if( !data )
            {
                data = {items:{},origin:target};
                bindEventHash[uukey] = data;
                if( target instanceof EventDispatcher )
                {
                    data.eventTarget = target;
                }else{
                    data.eventTarget = new EventDispatcher(target);
                }
            }
            for( var p:String in events)
            {
                if( data.items[ p ] !== events[p] )
                {
                    if( data.items[ p ] )
                    {
                        data.eventTarget.removeEventListener( p , data.items[ p ] );
                    }
                    if( events[p] )
                    {
                        data.items[ p ] = events[p];
                        data.eventTarget.addEventListener(p,events[p],false,0,this);
                    }
                }
            }
        }

        /**
        * 设置一组指定的属性
        * @param target
        * @param attrs
        */ 
        public function attributes(target:Object, attrs:Object):void
        {
            var isElem:Boolean = target instanceof Element;
            Object.forEach(attrs,function(value:*,name:String)
            {
                if( isElem )
                {
                    var elem:Element = target as Element;
                    if( name ==="content" && elem.text() !== value )
                    {
                        elem.text( value );
                          
                    }else if( name ==="innerHTML" && target.innerHTML !== value)
                    {
                        elem.html( value as String );

                    }else if( elem.property(name) != value )
                    {
                        elem.property(name, value );
                    }

                }else
                {
                    if( name ==="content" )
                    {
                        var prop:String = typeof target.textContent === "string" ? "textContent" : "innerText";
                        if( target[prop] !== value )
                        {
                            target[prop] = value;
                        }
                          
                    }else if( name ==="innerHTML" && target.innerHTML !== value)
                    {
                        target.innerHTML = value as String;

                    }else if( target.getAttribute(name) != attrs[name] )
                    {
                        target.setAttribute(name, attrs[name] );
                    }
                }
            });
        }


        /**
        * @private
        * 所有子级元素对象的集合
        */
        private var hashMapElements:Object={};

          /**
         * 创建一个节点元素
         * @param index 当前节点元素的索引位置
         * @param uniqueKey 当前元素位于当前域中的唯一键值
         * @param name 元素的节点名
         * @param attrs 元素的初始属性
         * @param update 元素的动态属性
         * @param binding 双向绑定元素属性
         * @param event 绑定元素的事件
         * @param context 指定当前上下文对象
         * @returns {Object} 一个表示当前节点元素的对象
         */ 
        protected function createElement(index:int,uniqueKey:*, name:String, children:*=null, attrs:Object=null,update:Object=null,events:Object=null):Object
        {
            var uukey:String = (uniqueKey+''+index) as String;
            var obj:Node = hashMapElements[ uukey ] as Node;
            if( !obj )
            {
                obj = document.createElement( name );
                obj["unique-key"] = uukey;
                hashMapElements[ uukey ] = obj;
                if( attrs )
                {
                    this.attributes(obj,attrs);
                }
            }

            if( children )
            {
                if( children instanceof Array ){
                    this.updateNodes(obj,children as Array);
                }else{
                    obj.textContent=children+"";
                }
            }
            if( update)
            {
                this.attributes(obj,update);
            }
            if( events )
            {
                this.bindEvent(index,uniqueKey,obj,events);
            }
            return obj;
        }

        protected function getElement(index:int,uniqueKey:*):Object
        {
            var uukey:String = (uniqueKey+""+index) as String;
            return hashMapElements[ uukey ]||null;
        }

        protected function setElement(index:int,uniqueKey:*,value:Object):Object
        {
            var uukey:String = (uniqueKey+""+index) as String;
            hashMapElements[ uukey ] = value;
            if( value is IDisplay )
            {
               // var elem:Element = (value as IDisplay).element;
              //  var node:Object = elem.current();
             //   node["unique-key"] = uukey;
                
            }else{
                value["unique-key"] = uukey;
            }
            return value;
        }


        /**
        * 更新一组应于父节点的子级元素。更新完后两边的子级节点会完全一致。
        * 如果指定的children列表和parentNode的子级列表中的每一个元素不相等，则会做相应的添加和删除操作。
        * @param parentNode 
        * @param children
        */
        protected function updateNodes(parentNode:Object,children:Array):void
        {
            var parentDisplay:IDisplay=null;
            if( parentNode is IDisplay )
            {
                parentDisplay = parentNode as IDisplay;
                parentNode = (parentNode as IDisplay).element.current() as Object; 
            }

            var parent:Node = parentNode as Node;
            var len:int = Math.max(children.length, parent.childNodes.length);
            var i:int=0;
            while( i<len )
            {
                var newNode:Node=null;
                var isDisplay:Boolean = children[i] is IDisplay;
                if( isDisplay )
                {
                    newNode =(children[i] as IDisplay).display().current() as Node;
                }else
                { 
                    newNode = children[i] as Node;
                }
                
                //两边节点不一致 
                if( newNode !== parent.childNodes[i] )
                {
                    //替换元素
                    if( newNode && parent.childNodes[i] )
                    {
                        parent.replaceChild(newNode, parent.childNodes[i] as Node);

                    }else
                    {
                        //移除元素
                        if( parent.childNodes[i] )
                        {
                            var oldNode:Node = parent.childNodes[i] as Node;
                            (oldNode.parentNode as Node).removeChild( oldNode );
                            children.splice(i,1);
                            len--;
                            continue;
                        }

                         //添加元素
                        if( newNode )
                        {
                            parent.appendChild(newNode);
                        }
                    }

                    //调度事件
                    if( newNode && isDisplay )
                    {
                        var childDisplay:IDisplay = children[i] as IDisplay;
                        if( parentDisplay ){
                            childDisplay.es_internal::setParentDisplay( parentDisplay );
                        }
                        var e:ElementEvent=new ElementEvent( ElementEvent.ADD );
                        e.parent = parentDisplay || parent;
                        e.child = newNode;
                        (childDisplay as EventDispatcher).dispatchEvent( e );
                    }
                }
                i++;
            }
        }
    }
}
