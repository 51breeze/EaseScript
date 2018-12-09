/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.interfaces.IDisplay;
    import es.interfaces.IContainer;
    import es.interfaces.IVirtualElement;
    import es.core.Container;
    public class VirtualElement extends Container implements IVirtualElement
    {
        /**
         * 虚拟元素类
         * @name 元素节点名
         * @attrs 元素属性
         */
        public function VirtualElement(name:String="div",attrs:Object=null)
        {
           var elem:Element = new Element( Element.createElement( name ) );
           this._name = name;
           if( attrs )
           {
              elem.properties( attrs );
           }
           super( elem );
        }

        /**
         * @private
         */
        private var _name:String;

        /**
         * 获取元素的节点名称
         * @returns {String}
         */
        public function get name():String
        {
            return this._name;
        }

         /**
         * @private
         * 获取元素的节点名称
         * @returns {String}
         */
        private var _uniqueKey:String;

        /**
         * 获取节点元素指定的唯一键
         * @returns {Node}
         */
        public function get uniqueKey():String
        {
            return this._uniqueKey;
        }

         /**
         * 设置节点元素的唯一键
         * @returns {Node}
         */
        public function set uniqueKey(val:String):void
        {
            this._uniqueKey=val;
        }

        /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         * @returns {Display}
         */
        override public function addChildAt( child:IDisplay , index:Number ):IDisplay
        {
            super.addChildAt(child,index);
            childrenElementCount++;
            return child;
        }

         /**
         * 移除指定的子级元素
         * @param child
         * @returns {Display}
         */
        override public function removeChild( child:IDisplay ):IDisplay
        {
            super.removeChild( child );
            childrenElementCount--;
            return child;
        }

        /**
         * 移除所有的子级元素
         */
        override public function removeAllChild():void
        {
            super.removeAllChild();
            childrenElementCount = 0;
        }

        /**
         * @protected
         */
        protected var validateFlag:Boolean=false;

        /**
         * 渲染显示皮肤对象。
         * 调用此方法会重新创建子级对象，在非必要情况下请谨慎使用，可以节省资源。
         */
        override public function display():Element
        {
            if( validateFlag === true )
            {
                validateFlag = false;
                var newCount:int = childrenElementCount;
                var children:Array = this.children;
                var lastCount:int = children.length;
                while( newCount < lastCount )
                {
                    this.removeChild( children[ --lastCount ] as IDisplay );
                }
                while(lastCount>0)
                {
                    (children[ --lastCount ] as  IDisplay).display(); 
                }
            }
            return super.display();
        }

         /**
         * 移除所有的虚拟节点元素
         * 此方法不会立即删除节点元素，而是在调用 display 方法时才会去才会去删除通过此方法被标记的所有元素
         * @returns {void}
         */ 
        public function removeVirtualElementAll():void
        {
           childrenElementCount = 0;
           validateFlag = true;
        }

        /**
         * @private
         */
        private var childrenElementCount:int=0;

        /**
        * @private
        * 所有子级元素对象的集合
        */
        private var hashMapElements:Object={};

         /**
         * 创建一个节点元素
         * @param childIndex 子级位于父级中的索引位置
         * @param key 元素位于当前Render中的唯一键
         * @param id 元素的唯一ID
         * @param name 元素的节点名
         * @param attr 元素的初始属性
         * @param bindding 元素的动态属性
         */ 
        public function createElement(childIndex:int, key:int,name:String,attr:Object=null,bidding:Object=null):IVirtualElement
        {
            var uniqueKey:int = childIndex+key;
            var obj:VirtualElement = hashMapElements[ uniqueKey ] as VirtualElement;
            if( !obj || obj.name !== name )
            {
                if( obj )
                {
                    (obj.parent as IContainer).removeChild( obj );
                }
                var pkey:* = this._uniqueKey;
                obj = new VirtualElement(name,attr);
                obj.uniqueKey = (pkey ? pkey+"-"+uniqueKey : uniqueKey) as String;
                this.addChildAt(obj,childIndex);
            }else{
                 childrenElementCount++;
            }
            if( bidding )
            {
                obj.element.properties( bidding );
            }
            return obj as IVirtualElement;
        }

         /**
         * 创建一个组件元素
         * @param childIndex 子级位于父级中的索引位置
         * @param key 元素位于当前Render中的唯一键
         * @param id 元素的唯一ID
         * @param callback 生成组件对象的回调函数
         * @param bindding 设置组件属性的回调函数
         */ 
        public function createComponent(childIndex:int, key:int,callback:Function,bidding:Function=null):IDisplay
        {
            var uniqueKey:int = childIndex+key;
            var obj:IDisplay = hashMapElements[ uniqueKey ] as IDisplay;
            var newObj:IDisplay = callback( obj , uniqueKey ) as IDisplay;
            if( newObj !== obj )
            {
                if( obj )
                {
                    (obj.parent as IContainer).removeChild( obj );
                }
                hashMapElements[ uniqueKey ] = newObj; 
                this.addChildAt(newObj,childIndex);
            }
            if( bidding )
            {
                bidding( newObj );
            }
            childrenElementCount++;
            return newObj;
        }

    }
}


