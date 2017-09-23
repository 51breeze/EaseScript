# breezejs
BreezeJS 1.0.0 Beta

BreezeJS 是一个需要编译后才能正常运行的JS语法<br/>

那为什么要编译？<br/>

1、语法标准化，兼容不同的平台，独立上下文与原生的javascript没有任何冲突。<br/>
2、完全面向对象编程并提供接口支持。<br/>
3、getter/setter 访问器的实现，类成员可见度控制。<br/>
4、事件驱动增强，任何数据的变化都可以实现捕捉。<br/>
5、可以自动生成服务端业务逻辑，不需要使用使用其它编辑语言去实现服务端的工作（暂未实现）<br/>
6、按需导入合并文件（未使用的模块即使用了import导入但在代码中未使用也不会合并）减少了代码体积。<br/>
...

*BreezeJS 希望能做到一次编程，实现多个端口通用* <br/>
------

```
package
{
    //自定义数据接口
    import com.Iproxy;
    public class Main extends EventDispatcher implements Iproxy
    {
            private var name:String = 'Ye Jun' ;
            function Main()
            {
                log('Hello '+this.name+'!');
                log( this is Iproxy ) // true
            }
    }
}

