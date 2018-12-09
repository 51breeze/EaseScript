package es.interfaces
{
    import es.interfaces.IDisplay;
    import es.interfaces.IContainer;
    public interface IVirtualElement extends IDisplay,IContainer
    {
        /**
         * 移除所有的虚拟节点元素
         * 此方法不会立即删除节点元素，需要在调用 display 方法时才会去删除通过此方法被标记的所有元素
         * @returns {void}
         */ 
    	public function removeVirtualElementAll():void

		/**
         * 创建一个节点元素
         * @param childIndex 子级位于父级中的索引位置
         * @param key 元素位于当前父级中的唯一键
         * @param name 元素的节点名
         * @param attr 元素的初始属性
         * @param bindding 元素的动态属性
         * @returns {IVirtualElement}
         */ 
    	 public function createElement(childIndex:int,key:int,name:String,attr:Object=null,bidding:Object=null):IVirtualElement

    	 /**
         * 创建一个组件元素
         * @param childIndex 子级位于父级中的索引位置
         * @param key 元素位于当前父级中的唯一键
         * @param callback 生成组件对象的回调函数
         * @param bindding 设置组件属性的回调函数
         * @returns {IDisplay}
         */ 
        public function createComponent(childIndex:int,key:int,callback:Function,bidding:Function):IDisplay

        /**
         * 获取节点元素指定的唯一键
         * @returns {String}
         */
        public function get uniqueKey():String

         /**
         * 设置节点元素的唯一键
         * @returns {void}
         */
        public function set uniqueKey(val:String):void

		/**
         * 设置元素的节点名称
         * @returns {String}
         */
        public function get name():String
    }
}