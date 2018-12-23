/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.interfaces.IRender;
    import es.core.VirtualElement;
    public class Render extends EventDispatcher implements IRender
    {
        /**
         * @private
         */
        private var _factory:Function;

        /**
         * @private
         */
        private var _context:IContainer;

        /**
         * 动态元素渲染类
         * @constructor
         * @param context 上下文对象
         */
        public function Render( context:IContainer )
        {
            this._context = context;
            super( (context as IDisplay).element );
        }

        /**
        * 获取一个上下文对象
        * 此对象表示一个渲染器宿主对象
        */
        public function get context():IContainer
        { 
            return _context;
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

        private var _dataset:Object={};

        private var initialized:Boolean=false;

        /**
        * 为此渲染器分配一个指定名称的数据值
        */
        public function assign(name:String, value:*):void
        {
            if( _dataset[ name ] !== value )
            {
                 _dataset[name]=value;  
                 if( initialized === true )
                 {
                    this.trigger({name:value});
                 } 
            }
        }

        /**
        * 获取已经为此渲染器分配的数据集
        */
        public function get dataset():Object
        {
            return Object.merge({},_dataset);
        }

        /**
        * @private
        * 所有绑定属性的集合对象
        */
        private var binddingHashMap:Object={};

        /**
        * 绑定一组属性，在当前作用域中变化时调度
        * @param properties 需要绑定的属性集
        * @param callback 当前属性变化时的回调函数
        * @param data 需要传递到回调函数中的参数
        */
        public function binding(properties:Array,callback:Function,...data:*):void
        {
             var map:Object = binddingHashMap;
             var prop:String = properties[0] as String;
             var ref:Array = ( map.hasOwnProperty( prop ) ? map[ prop ] : null ) as Array;
             if( ref && ref[0] === properties && ref[1] === callback )
             {
                 ref[2] = data;

             }else
             {
                 var bind:Array = [properties,callback,data];
                 properties.map(function(property:String)
                 {
                      map[property]=bind;
                 });
             }
        }

        /**
        * 触发指定的属性集
        * @param properties 需要触发的属性集
        */ 
        public function trigger(properties:Object):void
        {
            var map:Object = binddingHashMap;
            var dataset:Object = this._dataset;
            Object.forEach(properties,function(value:*,name:String)
            {
                 var item:Array = map[ name ] as Array;
                 if( item && item[3] !== value )
                 {
                      var props:Array = item[0] as Array;
                      var fn:Function = item[1] as Function;
                      var data:* = item[2];
                      
                      //当前属性的状态
                      var state:Object={};
                      //当前变化的属性值
                      var propsValue:Array=[];

                      //获取每个绑定器中所有属性的默认值
                      for(var i:int ; i<props.length; i++)
                      {
                           //绑定的属性名
                           var propName:String = props[i] as String;

                           //绑定的属性必须要在当前作用域中存在
                           if( !dataset.hasOwnProperty( propName ) )
                           {
                               throw new ReferenceError("is not assign property for '"+propName+"'");
                           }

                           //默认的属性值
                           var val:* = dataset[ propName ];

                           //一个新的属性值
                           if( properties.hasOwnProperty( propName ) )
                           {
                                val=properties[ propName ];
                           }

                           var binding:Array = map[ propName ] as Array;
                           //当前属性值的变化状态
                           state[ propName ] = binding[3] !== val;
                           //保存当前属性值
                           binding[3] = val;
                           //属性值
                           propsValue.push( val );
                      }
                      //fn(state,...data,...propsValue);
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
        public function createElement(index:int,uniqueKey:*, name:String, children:*=null, attr:Object=null,bidding:Object=null):IDisplay
        {
            var uukey:String = uniqueKey+''+index as String;
            var obj:IDisplay = hashMapElements[ uukey ] as IDisplay;
            if( !obj )
            {
                if( obj )
                {
                    (obj.parent as IContainer).removeChild( obj );
                    delete hashMapElements[ uukey ];
                }
                obj = new VirtualElement(name,attr);
                hashMapElements[ uukey ] = obj;
            }
            if( bidding )
            {
                obj.element.properties( bidding );
            }
            return obj as IDisplay;
        }

         /**
         * 创建一个组件元素
         * @param childIndex 子级位于父级中的索引位置
         * @param key 元素位于当前Render中的唯一键
         * @param id 元素的唯一ID
         * @param callback 生成组件对象的回调函数
         * @param bindding 设置组件属性的回调函数
         */ 
        public function createComponent(uniqueKey:String,callback:Function,bidding:Function=null):IDisplay
        {
            var obj:IDisplay = hashMapElements[ uniqueKey ] as IDisplay;
            var newObj:IDisplay = callback( obj , uniqueKey ) as IDisplay;
            if( newObj !== obj )
            {
                if( obj )
                {
                    (obj.parent as IContainer).removeChild( obj );
                    delete hashMapElements[ uniqueKey ];
                }
                hashMapElements[ uniqueKey ] = newObj;
            }
            if( bidding )
            {
                bidding( newObj );
            }
            return newObj;
        }

        public function updateChildren( parent:IContainer,index:int, children:Array ):void
        {

        }
    }
}


