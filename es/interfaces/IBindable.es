package es.interfaces
{
    public interface IBindable 
    {
        /**
        * 观察指定的属性，如果当前对象或者目标对象上有指定的属性发生变化时相互调度
        * @param name 数据源上的属性名
        * @param target 目标对象
        * @param propName 目标属性名
        * @param sourceTarget 绑定的数据源对象, 不指定为当前对象
        */
        public function watch(name:String,target:Object,propName:String,sourceTarget:Object=null):void

        /**
        * 取消观察指定的属性
        * @param target 目标对象
        * @param propName 目标属性名
        * @param sourceTarget 绑定的数据源对象, 不指定为当前对象
        */
        public function unwatch(target:Object,propName:String=null,sourceTarget:Object=null):void
    }
}