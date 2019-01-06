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
           super( elem );
           if( attrs )
           {
              elem.properties( attrs );
           }
           this._name = name;
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

         private var invalidate:Boolean= false;

        /*override public function display():Element
        {
              var element:Element = this.element;
              if( invalidate === true )return element;
                 invalidate = true;

          
            var children:Array = this.children;
            var len:int = children.length;
            var c:int = 0;
            for (; c < len; c++)
            {
                var child:IDisplay = children[c] as IDisplay;
                var ele:Element = child.display();
                if( !ele[0].parentNode || ele[0].parentNode.nodeType === 11 )
                {
                    element.addChild( ele );
                }
            } 

            return super.display();
        }*/
    }
}


