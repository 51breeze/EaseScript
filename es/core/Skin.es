/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.SkinComponent;
    import es.events.ComponentEvent;
    import es.core.Container;
    import es.events.SkinEvent;
    import es.core.State;
    import es.interfaces.IDisplay;
    import es.core.Display;
    import es.interfaces.IContainer;
    import es.interfaces.IBindable;
    import es.components.layout.BaseLayout;
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
         * 实现热替换, 一般用于开发环境中
         * @protected
         */
        protected hotUpdate():void
        {
            this.addEventListener( SkinEvent.INSTALL, function( e:SkinEvent )
            {
                if( e.oldSkin )
                {
                    var oldNode:Node = e.oldSkin.element.current() as Node;
                    var newNode:Node = e.newSkin.element.current() as Node;
                    var parentNode:Node = oldNode.parentNode;
                    if( parentNode )
                    {
                        parentNode.replaceChild(newNode, oldNode);
                    }
                }
            });
        }

        /**
        * 获取当前皮肤下需要生成的元素节点列表，此方法为编译器预留。
        * 在继承的子类中通过皮肤编译器会生成相关的子级节点元素并覆盖此方法。
        * 在皮肤文件中不要声明此方法否则会报错。
        * @return Array
        */
        protected function render():Array
        {
            return this.children.slice(0);
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
        protected function initializing()
        {
             this.hotUpdate();
        }

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
                if( timeoutId )
                {
                    clearTimeout( timeoutId as Number );
                    timeoutId = null;
                }
                invalidate = true;
                var nodes:Array= this.render();
                this.updateChildren(this, nodes);
                this.updateInstallState();
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
                if( typeof children === "object" )
                {
                    if( !(children instanceof Array) )
                    {
                        children = [children];
                    }
                    this.updateChildren(obj,children as Array);

                }else
                {
                    obj.textContent = children+"";
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
        protected function createComponent(index:int,uniqueKey:*, classTarget:Class, tagName:String=null, children:*=null, attrs:Object=null,update:Object=null,events:Object=null):IDisplay
        {
            var uukey:String = (uniqueKey+''+index) as String;
            var obj:IDisplay = elementMaps[ uukey ] as IDisplay;
            if( !obj )
            {
                if( tagName )
                {
                    obj = new classTarget( new Element( Element.createElement(tagName) ) ) as IDisplay;

                }else{
                    obj = new classTarget( uukey ) as IDisplay;
                }
                elementMaps[ uukey ] = obj;
                if( attrs )
                {
                    this.attributes( obj.element, attrs);
                }
            }

            if( children )
            {
                if( !(children instanceof Array) )
                {
                    children = [ typeof children === "object" ? children : children+""];
                }
                if( obj instanceof SkinComponent )
                {
                    (obj as SkinComponent).children = children as Array;

                }else
                {
                    this.updateChildren(obj,children as Array);
                }
            }

            if( update )
            {
                this.attributes(obj.element,update);
            }

            if( events )
            {
                this.bindEvent(index,uniqueKey,obj,events);
            }
            return obj;
        }

        /**
        * @private
        */
        private function meregChildren( children:Array ):Array
        {
            var len:int = children.length;
            var index:int = 0;
            var results:Array = [];
            for(;index<len;index++)
            {
               var child:* = children[index];
               if( child instanceof Array )
               {
                  results = results.concat( meregChildren( child as Array ) );

               }else 
               {
                   results.push( child );
               }
            }
            return results;
        }

        /**
        * 更新一组应于父节点的子级元素。更新完后两边的子级节点会完全一致。
        * 如果指定的children列表和parentNode的子级列表中的每一个元素不相等，则会做相应的添加和删除操作。
        * @param parentNode 
        * @param children 
        * @param index
        * @param total
        */
        protected function updateChildren(parentNode:Object,children:Array):void
        {
            if(!parentNode)return;
            var parentDisplay:IDisplay=null;
            if( parentNode instanceof SkinComponent )
            {
                (parentNode as SkinComponent).children = children;
                return;

            }else if( parentNode is IDisplay )
            {
                parentDisplay = parentNode as IDisplay;
                parentNode = (parentNode as IDisplay).element.current() as Object; 
            }
     
            children = this.meregChildren( children );
            var parent:Node = parentNode as Node;
            var totalNodes:int = parent.childNodes.length;
            var totalChilds:int = children.length;
            var len:int = Math.max(totalChilds, totalNodes);
            var i:int=0;
            var offset:int = 0;
            while( i<len )
            {
                var newNode:Node=null;
                var oldNode:Node=parent.childNodes[i-offset] as Node;
                var childItem:* = children[i];
                var isDisplay:Boolean = childItem is IDisplay;
                if( isDisplay )
                {
                    var elem:Element = (childItem as IDisplay).display();
                    var owner:IContainer = (childItem as IDisplay).owner;
                    if( owner )
                    {
                        this.installer(childItem as IDisplay, owner);
                        offset++;
                        i++;
                        continue;

                    }else
                    {
                        newNode =elem.current() as Node;
                    }

                }else if( childItem )
                { 
                    if( typeof childItem === "string" )
                    {
                        if( Element.getNodeName(oldNode) === "text" )
                        {
                            if( oldNode.textContent !== childItem )
                            {
                                oldNode.textContent = childItem as String;
                            }
                            newNode = oldNode;

                        }else
                        {
                            newNode = Element.createElement("text") as Node;
                            newNode.textContent = childItem as String;
                        }

                    }else 
                    {
                        newNode = childItem as Node;
                    }

                }else
                {
                    offset++;
                }

                //两边节点不一致 
                if( newNode !== oldNode )
                {
                    //替换元素
                    if( newNode && oldNode )
                    {
                        parent.replaceChild(newNode,oldNode);
                        removeEvent(parent,oldNode);
                        
                    }else
                    {
                        //移除元素
                        if( oldNode )
                        {
                            var nextIndex:int = i;
                            var nextChild:* = null;
                            var nextChildNode:Node = null;
                            while( nextIndex < len && !(nextChild = children[ ++nextIndex ] ) );
                            if( nextChild )
                            {
                                if( nextChild is IDisplay )
                                {
                                    nextChildNode =(nextChild as IDisplay).display().current() as Node;

                                }else if( typeof nextChild === "string" && Element.getNodeName(oldNode) === "text" )
                                {
                                    nextChildNode = oldNode;
                                }else
                                {
                                    nextChildNode = nextChild as Node;
                                }
                            }

                            if( nextChildNode !== oldNode )
                            {
                                parent.removeChild( oldNode );
                                removeEvent(parent,oldNode);
                            }
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
                        var childDisplay:IDisplay = childItem as IDisplay;
                        if( parentDisplay ){
                            childDisplay.es_internal::setParentDisplay( parentDisplay as IContainer );
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
        * @private
        */
        private removeEvent(parentNode:Object,childNode:Object):void
        {
            var e:ElementEvent=new ElementEvent( ElementEvent.REMOVE );
            e.parent = parentNode;
            e.child = childNode;
            (new EventDispatcher(childNode)).dispatchEvent( e );
        }

        /**
        * @private
        */
        private var timeoutId:* = null;
        private var callback:Function = null;

        /**
        * 标记组件需要立即刷新子级。
        * 每一次调用此方法都会延迟执行来解决重复刷新的问题
        * @private
        */
        protected function nowUpdate(delay:int=200):void
        {
            invalidate=false;
            if( timeoutId )
            {
                clearTimeout( timeoutId as Number );
            }

            var callback:Function = this.callback;
            if( !callback )
            {
                callback = this.createChildren.bind(this);
                this.callback = callback;
            }
            timeoutId = setTimeout(callback,delay);
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
                if( initialized )
                {
                    this.nowUpdate();
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
            if( initialized  )
            {
                this.nowUpdate();
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
        private var _installer:Map=null;

        /*
        * @private
        */
        private function installer(child:IDisplay, viewport:IContainer):void
        {
            var map:Map = this._installer;
            if( map === null ){
                map = new Map();
                this._installer = map;
            }
            var install:Object = map.get(child);
            if( !install )
            {
                install = {
                    "viewport":viewport
                };
                map.set(child , install);
            }
            if( !install.state )
            {
                viewport.addChild( child );
            }
            install.state = true;
        }

        /*
        * @private
        */
        private function updateInstallState():void
        {
            var map:Map = this._installer;
            if( map )
            {
                map.forEach(function(value:Object, key:IDisplay){
                    if( value.state !== true && key.parent )
                    {
                        (value.viewport as IContainer).removeChild( key );
                    }
                    value.state = false;
                });
            }
        }

        /*
        * @private
        */
        private var _watchMap:Map=null;

        /*
        * @private
        */
        private function get watchMap():Map
        {
            var dict:Map = this._watchMap;
            if( dict === null ){
                dict = new Map();
                this._watchMap = dict;
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
               var dict:Map = this.watchMap;
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
               var dict:Map = this.watchMap;
               var bind:Bindable = dict.get( sourceTarget ) as Bindable;
               if( bind )
               {
                    bind.unbind(target, propName);
                    dict.delete( sourceTarget );
               }

            }else
            {
               var bindable:Bindable= this.bindable;
               bindable.unbind(target, propName);
           }
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
         * 设置子级元素
         * @returns {Array}
         */
        override public function set children( value:Array ):void
        {
            this._children = value.slice(0);
            if( initialized  ){
                this.nowUpdate();
            }
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
            var parent:IContainer = child.parent;
            if( parent )
            {
                parent.removeChild( child );
            }
            var children:Array = this._children;
            index = index < 0 ? index+children.length+1 : index;
            children.splice(index,0,child);
            child.es_internal::setParentDisplay(this);
            if( initialized  ){
                this.nowUpdate();
            }
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

            var child:IDisplay = children[index] as IDisplay;
            children.splice(index, 1);
            if( child.parent )
            {
                child.parent.removeChild( child );
            }
            child.es_internal::setParentDisplay(null);
            if( initialized  )
            {
                this.nowUpdate();
            }
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
                    this.nowUpdate();
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
            super.display();
            this.nowUpdate(0);
            return this.element;
        }
    }
}
