package es.interfaces
{
    public interface IBindable 
    {
        /**
        * 绑定一组属性，在当前作用域中变化时调度
        * @param properties 需要绑定的属性集
        * @param callback 当前属性变化时的回调函数
        * @param data 需要传递到回调函数中的参数
        */
        public function bindding(properties:Array,callback:Function,...data:*):void

        /**
        * 触发指定的属性集
        * @param properties 需要触发的属性集
        */ 
        public function trigger(properties:Object):void
    }
}