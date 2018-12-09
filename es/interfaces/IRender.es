package es.interfaces
{
	import es.interfaces.IBindable;
	import es.interfaces.IDisplay;
    public interface IRender extends IBindable
    {
    	/**
    	* 设置一个渲染器的工厂函数
    	* 在调用此函数时会传递一个 context 作为第一个参数
    	* context 是一个 IDisplay 数据类型
    	* 此工厂函数负责生产一个元素集并应用于指定的 Element 集中
    	*/
        public function set factory(value:Function):void
      
        /**
    	* 获取一个渲染器的工厂函数
    	* 每一个工厂函数必须返回一个 Element 对象
    	*/
        public function get factory():Function

        /**
    	* 为此渲染器分配一个指定名称的数据值
    	*/
        public function assign(name:String, value:*):void

        /**
    	* 获取已经为此渲染器分配的数据集
    	*/
        public function get dataset():Object

        /**
         * 创建一个节点元素
         * @param uniqueKey 元素位于当前父级中的唯一键
         * @param name 元素的节点名
         * @param attr 元素的初始属性
         * @param bindding 元素的动态属性
         * @returns {IDisplay}
         */ 
    	 public function createElement(uniqueKey:int, name:String, children:Array=null, attr:Object=null,bidding:Object=null):IDisplay

    	 /**
         * 创建一个组件元素
         * @param uniqueKey 元素位于当前父级中的唯一键
         * @param callback 生成组件对象的回调函数
         * @param bindding 设置组件属性的回调函数
         * @returns {IDisplay}
         */ 
        public function createComponent(uniqueKey:String,callback:Function,bidding:Function=null):IDisplay

    }
}