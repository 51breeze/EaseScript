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
    import es.core.Display;
    import es.interfaces.IContainer;
    import es.interfaces.IBindable;
    import es.core.BaseLayout;
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
            }else if( Element.isNodeElement(name) ){
                elem = new Element( name );
            }else if( name is IDisplay )
            {
                elem = (name as IDisplay).element;
            } 
            super( elem , attr ); 
        }

        /**
        * 获取当前皮肤下需要生成的元素节点列表，此方法为编译器预留。
        * 在继承的子类中通过皮肤编译器会生成相关的子级节点元素并覆盖此方法。
        * 在皮肤文件中不要声明此方法否则会报错。
        * @return Array
        */
        protected function render():Array
        {
            return [];
        }

        /**
         * @private
         */
        private var _bindable:Bindable=null;

        /**
         * 获取一个实现双向绑定的绑定器对象
         * 如果需要改变此对象来达到同样的效果，请在皮肤文件中覆盖此方法。
         * @return Bindable
         */
        protected function get bindable():Bindable
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
         * 如需要使用，请在子类中覆盖
         */
        protected function initializing(){}

        /**
        * 当前皮肤重新生成子级列表后调用
        * 此方法主要是为了获取当前有效子级元素时非常有用。
        * 如需要使用，请在子类中覆盖
        */
        protected function updateDisplayList(){}

        /**
         * @private
         * 皮肤是否已初始化
         */
        protected var initialized:Boolean=false;

        /**
         * @private
         * 一个标记用来区分是否需要重新生成子级列表
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
                this.updateChildren(this, nodes);
                this.updateDisplayList();
                if( this.hasEventListener(SkinEvent.UPDATE_DISPLAY_LIST) )
                {
                    var e:SkinEvent = new SkinEvent( SkinEvent.UPDATE_DISPLAY_LIST );
                    e.children = nodes;
                    this.dispatchEvent( e );
                }
            }
        };

        /**
        * @private
        */
        private var bindEventMaps:Object={};

        /**
        * 绑定事件至指定的目标元素
        * @param index
        * @param uniqueKey
        * @param target
        * @param events
        */
        protected function bindEvent(index:int,uniqueKey:*,target:Object,events:Object):void
        {
            var uukey:String = (index+""+uniqueKey) as String;
            var data:Object = bindEventMaps[uukey] as Object;
            if( !data )
            {
                data = {items:{},origin:target};
                bindEventMaps[uukey] = data;
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
        * @private
        * 所有子级元素对象的集合
        */
        private var elementMaps:Object={};

        /**
        * 创建一个节点元素
        * @param index 当前节点元素的索引位置
        * @param uniqueKey 当前元素位于当前域中的唯一键值
        * @param name 元素的节点名
        * @param attrs 元素的初始属性
        * @param update 元素的动态属性
        * @param events 绑定元素的事件
        * @returns {Object} 一个表示当前节点元素的对象
        */ 
        protected function createElement(index:int,uniqueKey:*, name:String, children:*=null, attrs:Object=null,update:Object=null,events:Object=null):Object
        {
            var uukey:String = (uniqueKey+''+index) as String;
            var obj:Node = elementMaps[ uukey ] as Node;
            if( !obj )
            {
                obj = document.createElement( name );
                elementMaps[ uukey ] = obj;
                if( attrs )
                {
                    this.attributes(obj,attrs);
                }
            }

            if( children )
            {
                if( children instanceof Array ){
                    this.updateChildren(obj,children as Array);
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

        /**
        * 创建一个组件实例
        * @param index 当前节点元素的索引位置
        * @param uniqueKey 当前元素位于当前域中的唯一键值
        * @param classTarget 组件类名
        * @param attrs 元素的初始属性
        * @param update 元素的动态属性
        * @param events 绑定元素的事件
        * @returns {Object} 一个表示当前节点元素的对象
        */ 
        protected function createComponent(index:int,uniqueKey:*, classTarget:Class, children:*=null, attrs:Object=null,update:Object=null,events:Object=null):Object
        {
            var uukey:String = (uniqueKey+''+index) as String;
            var obj:Object = elementMaps[ uukey ] as Object;
            if( !obj )
            {
                obj = new classTarget( uukey ) as Object;
                elementMaps[ uukey ] = obj;
                if( attrs )
                {
                    this.attributes( (obj as IDisplay).element,attrs);
                }
            }

            /*if( children )
            {
                if( children instanceof Array )
                {
                    if( obj is SkinComponent ){
                       (obj as SkinComponent).skin.updateChildren( (obj as SkinComponent).skin.getContainer(), children );
                    }else{
                       this.updateChildren(obj,children as Array);
                    }

                }else
                {
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
            }*/
            return obj;
        }

        /**
        * 根据索引和元素的唯一key获取元素对象
        * @param index
        * @param uniqueKey
        * @return Object
        */  
        protected function getElement(index:int,uniqueKey:*):Object
        {
            var uukey:String = (uniqueKey+""+index) as String;
            return elementMaps[ uukey ]||null;
        }

        /**
        * 根据索引和元素的唯一key设置指定的元素对象
        * @param index
        * @param uniqueKey
        * @param value
        * @return Object
        */  
        protected function setElement(index:int,uniqueKey:*,value:Object):Object
        {
            var uukey:String = (uniqueKey+""+index) as String;
            elementMaps[ uukey ] = value;
            return value;
        }

        /**
        * 更新一组应于父节点的子级元素。更新完后两边的子级节点会完全一致。
        * 如果指定的children列表和parentNode的子级列表中的每一个元素不相等，则会做相应的添加和删除操作。
        * @param parentNode 
        * @param children 
        */
        protected function updateChildren(parentNode:Object,children:Array):void
        {
            var parentDisplay:IDisplay=null;
            if( parentNode instanceof SkinComponent )
            {
                var skin:Skin = (parentNode as SkinComponent).skin as Skin;
                skin.updateChildren(skin.container, children);
                return;

            }else if( parentNode is IDisplay )
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
                var oldNode:Node=parent.childNodes[i] as Node;
                var isDisplay:Boolean = children[i] is IDisplay;
                if( isDisplay )
                {
                    newNode =(children[i] as IDisplay).display().current() as Node;
                }else
                { 
                    newNode = children[i] as Node;
                }
                
                //两边节点不一致 
                if( newNode !== oldNode )
                {
                    //替换元素
                    if( newNode && oldNode )
                    {
                        parent.replaceChild(newNode,oldNode);

                    }else
                    {
                        //移除元素
                        if( oldNode )
                        {
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
                        childDisplay.element.dispatchEvent( e );
                    }
                }
                i++;
            }
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
        * 设置一组指定的属性
        * @param target
        * @param attrs
        */ 
        public function attributes(target:Object, attrs:Object):void
        {
            if( target == null )return;
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

                    }else if( name ==="class" || name==="className")
                    {
                        if( target.className !== attrs[name] )
                        {
                            target.className=attrs[name];
                        }
    
                    }else if( target.getAttribute(name) != attrs[name] )
                    {
                        target.setAttribute(name, attrs[name] );
                    }
                }
            });
        }

        /*
        * @private
        */
        private var _dictionary:Dictionary=null;

        /*
        * @private
        */
        private function get dictionary():Dictionary
        {
            var dict:Dictionary = this._dictionary;
            if( dict === null ){
                dict = new Dictionary();
                this._dictionary = dict;
            }
            return dict;
        }

         /**
        * 观察指定的属性，如果当前对象或者目标对象上有指定的属性发生变化时相互影响
        * @param name 数据源上的属性名
        * @param target 目标对象
        * @param propName 目标属性名
        * @param sourceTarget 绑定的数据源对象, 不指定为当前对象
        */
        public function watch(name:String,target:Object,propName:String,sourceTarget:Object=null):void
        {
            var bindable:Bindable= this.bindable;
            if( sourceTarget )
            {
               var dict:Dictionary = this.dictionary;
               bindable = dict.get( sourceTarget ) as Bindable;
               if( !bindable ){
                  bindable = new Bindable(sourceTarget,"*");
                  dict.set(sourceTarget, bindable);
               }
            }
            bindable.bind(target, propName, name);
        }

        /**
        * 取消观察指定的属性
        * @param target 目标对象
        * @param propName 目标属性名
        */
        public function unwatch(target:Object,propName:String=null,sourceTarget:Object=null):void
        {
            if( sourceTarget )
            {
               var dict:Dictionary = this.dictionary;
               var bind:Bindable = dict.get( sourceTarget ) as Bindable;
               if( bind )
               {
                    bind.unbind(target, propName);
                    dict.remove( sourceTarget );
               }

            }else
            {
               var bindable:Bindable= this.bindable;
               bindable.unbind(target, propName);
           }
        }

        /**
         * 获取一个承载子级对象的容器
         * 如果需要改变此默认容器，请在子类中覆盖此方法
         * @return {es.interfaces.IContainer}
         */
        public function get container():IContainer
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
         * @return void
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
        }
    }
}
