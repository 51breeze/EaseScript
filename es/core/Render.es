/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.interfaces.IDisplay;
    import es.interfaces.IRender;
    import es.core.State;
    public class Render extends EventDispatcher implements IRender
    {
        /**
        * @private
        */ 
        private var invalidate:Boolean=false;

        /**
         * @private
         */
        private var _factory:Function;

        /**
         * 动态元素渲染类
         * @constructor
         */
        public function Render(factory:Function=null)
        {
            super();
            _factory = factory;
        }

        /**
        * 设置一个渲染器的工厂函数
        * 在调用此函数时会传递一个 context 作为第一个参数
        * context 是一个 IContainer 数据类型
        * 此工厂函数负责生产一个元素集并应用于指定的 Element 集中
        */
        public function set factory(value:Function):void
        { 
            _factory = value;
        }

        /**
        * 获取一个渲染器的工厂函数
        * 每一个工厂函数必须返回一个 Element 对象
        */
        public function get factory():Function
        {
            return _factory;
        }

         /**
         * 分配指定名称的值到模板数据集中
         * @param name
         * @param value
         */
        public function assign(name:String, value:*=null):*
        {
            var dataset:Object=_dataset;
            if( value === null )
            {
                return dataset[name];
            }

            if( dataset[name] !== value )
            {
                invalidate = false;
                dataset[name]=value;
            }
            return value;
        }

        /**
        * @private
        */  
        private var _dataset:Object={};

        /**
        * 获取数据集
        * @return {Object}
        */
        public function get dataset():Object
        {
            return _dataset;
        }

        /**
        * 设置一组数据集
        * @return {Object}
        */
        public function set dataset(value:Object):void
        {
            invalidate = false;
            _dataset = value;
        }

        /**
        * @private
        */
        private var bindEventHash:Object={};

        /**
        * 绑定事件至指定的目标元素
        */
        public function bindEvent(index:int,uniqueKey:*,target:Object,events:Object,context:Object=null):void
        {
            context = context || _context || null;
            var uukey:String = (uniqueKey+''+index) as String;
            var binded:Object = bindEventHash[uukey] as Object;
            if( !binded )
            {
                binded = {items:{},origin:target};
                bindEventHash[uukey] = binded;
                if( target instanceof EventDispatcher )
                {
                    binded.eventTarget = target;
                }else{
                    binded.eventTarget = new EventDispatcher(target);
                }
            }

            for( var p:String in events)
            {
                if( binded.items[ p ] !== events[p] )
                {
                    if( binded.items[ p ] )
                    {
                        binded.eventTarget.removeEventListener( p , binded.items[ p ] );
                    }
                    if( events[p] )
                    {
                        binded.items[ p ] = events[p];
                        binded.eventTarget.addEventListener('click',events[p],false,0,context);
                    }
                }
            }
        }

        /**
        * @private
        */
        private var _destruction:Boolean=false;

        /**
        * 元素移除时是否需要销毁元素节点
        * 设置为 true 时销毁
        */
        public function get destruction():Boolean
        {
            return _destruction;
        }

        /**
        * 元素移除时是否需要销毁元素节点
        * 设置为 true 时销毁
        */
        public function set destruction(value:Boolean):void
        {
            _destruction = value;
        }

        /**
        * @protected
        */
        protected function setAttrs(target:Node,attrs:Object):void
        {
            Object.forEach(attrs,function(value:*,name:String)
            {
                if( name ==="innerHTML" && target.innerHTML !== value)
                {
                    target.innerHTML = value as String;

                }else if( target.getAttribute(name) != attrs[name] )
                {
                    target.setAttribute(name, attrs[name] );
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
         * @param index 子级位于父级中的索引位置
         * @param key 元素位于当前Render中的唯一键
         * @param id 元素的唯一ID
         * @param name 元素的节点名
         * @param attr 元素的初始属性
         * @param bindding 元素的动态属性
         */ 
        public function createElement(index:int,uniqueKey:*, name:String, children:*=null, attr:Object=null,updateAttrs:Object=null,bindEvent:Object=null,bindContext:Object=null):Object
        {
            var uukey:String = (uniqueKey+''+index) as String;
            var obj:Node = hashMapElements[ uukey ] as Node;
            if( !obj )
            {
                obj = document.createElement( name );
                obj["unique-key"] = uukey;
                hashMapElements[ uukey ] = obj;
                if( attr )
                {
                    this.setAttrs(obj,attr);
                }
            }
            if( children )
            {
                if( children instanceof Array ){
                    this.createChildren(obj,children as Array);
                }else{
                    obj.textContent=children+"";
                }
            }
            if( updateAttrs )
            {
                this.setAttrs(obj,updateAttrs);
            }
            if( bindEvent )
            {
                this.bindEvent(index,uniqueKey,obj, bindEvent, bindContext);
            }
            return obj;
        }

         /**
         * 创建一个组件元素
         * @param childIndex 子级位于父级中的索引位置
         * @param key 元素位于当前Render中的唯一键
         * @param id 元素的唯一ID
         * @param callback 生成组件对象的回调函数
         * @param bindding 设置组件属性的回调函数
         */ 
        public function createComponent(index:int,uniqueKey:*,callback:Function):Object
        {
            var uukey:String = (uniqueKey+""+index) as String;
            var obj:Object = hashMapElements[ uukey ];
            var newObj:Object = callback( obj , uukey );
            if( newObj !== obj )
            {
                hashMapElements[ uukey ] = newObj;
                if( newObj is IDisplay ){
                    (newObj as IDisplay).element[0]["unique-key"] = uukey;
                }
            }
            return newObj;
        }

        /**
        * @private
        */
        private function unsetNode( oldNode:Node )
        {
            var uniqueKey:* = oldNode["unique-key"];
            if( uniqueKey )
            {
                var child:* = hashMapElements[uniqueKey];
                if( child )
                {
                    hashMapElements[uniqueKey] = null;
                    delete hashMapElements[uniqueKey];
                    if(child instanceof EventDispatcher)
                    {
                        var e:ElementEvent = new ElementEvent( ElementEvent.REMOVE );
                        e.parent = oldNode.parentNode;
                        e.child = oldNode;
                        (child as EventDispatcher).dispatchEvent( e );
                    }
                }
            }
        }

        /**
        * @param parent 
        * 创建子级元素
        */
        public function createChildren(parentNode:Object,children:Array):void
        {
            if( parentNode is IDisplay )
            {
               parentNode = (parentNode as IDisplay).element[0] as Object; 
            }

            var parent:Node = parentNode as Node;
            var len:int = Math.max(children.length, parent.childNodes.length);
            var i:int=0;
            var destruct:Boolean = _destruction;
            while( i<len )
            {
                var newNode:Node=null;
                var isDisplay:Boolean = children[i] is IDisplay;
                if( isDisplay )
                {
                    var elem:Element =(children[i] as IDisplay).display();
                    newNode = elem[0] as Node;

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
                        //需要销毁元素
                        if( destruct )
                        {
                            this.unsetNode( parent.childNodes[i] as Node );
                        } 

                    }else
                    {
                        //移除元素
                        if( parent.childNodes[i] )
                        {
                            var oldNode:Node = parent.childNodes[i] as Node;
                            (oldNode.parentNode as Node).removeChild( oldNode );

                             //需要销毁元素
                            if( destruct )
                            {
                                this.unsetNode( oldNode );
                            } 

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
                        var e:ElementEvent=new ElementEvent( ElementEvent.ADD );
                        e.parent = parent;
                        e.child = newNode;
                        (children[i] as EventDispatcher).dispatchEvent( e );
                    }
                }
                i++;
            }
        }

        /**
        * @private
        */
        private var _context:Object=null;

        /**
        * @private
        */
        private var _result:Array=null;

        /**
        * 从指定的元素工厂中创建元素
        * @return {Array}
        */
        public function create(context:Object=null):Array
        {
            var factory:Function = _factory;
            if( !factory )
            {
                return [];
            }

            if( invalidate )
            {
                return _result;
            }
            _context = context;
            invalidate = true;
            var result:Array = factory(this,context, _dataset) as Array;
            _result = result;
            return result;
        }
    }
}


