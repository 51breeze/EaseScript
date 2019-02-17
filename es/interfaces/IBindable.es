package es.interfaces
{
    public interface IBindable 
    {
        /**
        * 观察指定的属性，如果当前对象或者目标对象上有指定的属性发生变化时相互调度
        * @param name 数据源上的属性名
        * @param target 目标对象
        * @param propName 目标属性名
        */
        public function watch(name:String,target:Object,propName:String):void

        /**
        * 取消观察指定的属性
        * @param target 目标对象
        * @param propName 目标属性名
        */
        public function unwatch(target:Object,propName:String=null):void
    }
}