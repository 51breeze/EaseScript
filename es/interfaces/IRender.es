package es.interfaces
{
    public interface IRender
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
        * 设置一个渲染器的工厂的上下文对象
        */
        public function set context(value:Object):void;

        /**
        * 获取一个渲染器的工厂的上下文对象
        */
        public function get context():Object;

        /**
        * 绑定一组指定对象的属性
        */
        public function watch(elem:Object,binding:Array):void

        /**
    	* 为此渲染器分配一个指定名称的数据值
        * @param name 指定值的名称
        * @param value 指定的值
    	*/
        public function assign(name:String, value:*):*

        /**
    	* 获取数据集
        * @returns {Object}
    	*/
        public function get dataset():Object

        /**
        * 设置数据集
        * @returns {void}
        */
        public function set dataset(value:Object):void;

        /**
        * 绑定事件至指定的目标元素
        */
        public function bindEvent(uniqueKey:*,target:Object,events:Object,context:Object=null):void;

        /**
        * 设置一组指定的属性
        * @param target
        * @param attrs
        */ 
        public function attributes(target:Object, attrs:Object):void;

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
    	 public function createElement(index:int,uniqueKey:*, name:String, children:*=null, attrs:Object=null,update:Object=null,binding:Array=null,event:Object=null,context:Object=null):Object

        public function getElement(index:int,uniqueKey:*):Object;
        public function setElement(index:int,uniqueKey:*,value:Object):Object;
        

    	 /**
         * 创建一个组件元素
         * @param index 当前节点元素的索引位置
         * @param uniqueKey 当前组件位于当前域中的唯一键值
         * @param callback 生成组件对象的回调函数
         * @returns {Object}  一个表示当前节点元素的对象
         */ 
        public function createComponent(index:int,uniqueKey:*,callback:Function):Object

         /**
         * 创建子级元素
         * @param children 当前有效的子级元素。如果在当前父级节点中的子级元素不包含在此数组中的都会被移除。
         * @param parent 需要应用到的父级节点元素
         * @returns {void}
         */ 
        public function createChildren(parent:Object,children:Array):void

        /**
        * 从指定的元素工厂中创建元素
        * @param context 指定一个在工厂函数里面需要用到的上文对象
        * @return {Array}
        */
        public function create():Array

    }
}