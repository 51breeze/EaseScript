# EaseScript 1.2.0 Stable

## EaseScript 致力于改变web的开发方式，减少重复的开发成本。

## 为什么要使用 EaseScript

**EaseScript 的初衷是想让开发变得更劲松、优雅、灵活。倡导开发颗粒化组件从而达到共享复用的效果，让所有的业务功能通过复用组件砌合而成，尽量减少开发以节省人力成本**

## 特点

1. 基于ES6语法，实现了类命名空间、数据接口、编译时数据类型检查、属性存储器和类函数访问控制修饰符等。增强了代码的规范，减少质量缺陷
2. 编译时可指定需要兼容的浏览器版本，根据业务场景来实现浏览器兼容问题（编译时内置Polyfill，会相对增加文件体积）
3. 业务逻辑、界面布局、样式分开管理，想在复用组件的基础上定制功能更加轻松
4. 同功能只开发一次，可编译成不同的目标运行语言（比如 java、golang、python、php、nodejs等。目前仅支持php、nodejs敬请期待吧~）
5. 实现了less样式按需加载，使用时不需要单独再维护减少了样式文件的体积
6. 所有加载的文件只有使用过了才会打包，减少了项目文件的体积
7. 界面布局是用xml或者html的方式开发，更容易维护
8. 界面布局实现了状态机来控制界面的布局，不用使用if/else来判断
9. 数据的单/双向绑定，开发交互功能更容易
10. 所有的远程数据请求都是基于数据源管理，无需要手动发起请求
11. 使用了DOM差集算法更新，类似虚拟DOM但没有虚拟的对象开销

## 使用方法

1. 安装脚手架

>    npm install easescript-installer -g

2. 安装成功后进入 cmd
3. 在命令行中输入 ei --init 按提示输入相关信息
    ```
    >   D:\workspace\test>ei --init 
    >   ? 项目名: ./project 
    >   ? 构建路径: ./build 
    >   ? 描述: 
    >   ? 作者: 
    >   ? 配置文件路径: 
    >   ? 入口文件(file/path): [project_src_dir] 
    >   ? 皮肤扩展路径(libxmljs): 
    >   ? 支持皮肤: Yes 
    >   ? 是否拆分打包: Yes 
    >   ? 是否使用webpack打包: Yes 
    >   ? 服务端运行环境: node 
    >   ? 服务端运行地址: 127.0.0.1:8080 
    >   ? 指定编译参数: 
    >   ? 立即安装 (Y/n) Yes 
    ```
4. 在cmd 命令行中输入 cd ./project 进入到刚才创建的项目目录
5. 在cmd 命令行中输入 npm run start 来动启动项目
5. 如果看到 "Welcome use EaseScript!" 字样,那么恭喜你成功了！！

注意：安装 libxmljs 如果出现错误，可能是需要安装 Python2.7 请按错误信息要求来配置或者可以直接使用  npm install --global --production windows-build-tools

## 语法格式，看看是不是很期待~

``` js
//这里是设置命名空间，当前是在根目录下没有命名空间
//命名空间名必须与文件目录名一致
package
{
   import es.core.Application;
   import es.core.View;
   import es.core.Display;

   //指定路由默认进到的页面。当然也可以不指定,默认会找 index 如果不存在会把第一个类成员方法当成入口
   //所有的入口页必须为 public。
   //这样来标记路由页面入口是不是会优雅很多~，不用再为了一个配置文件而优伤了^v^
   [Router(default=home)]

   //入口模块必须要继承 Application 类
   public class Welcome extends Application 
   {
       public function Welcome()
       {
           super();
       }

       //默认入口页面，类成员 function 可以省略 
       public home()
       {
          //这是一个视图基类， 如果想实现自己的视图，可以使用基于 xml 的语法实现。
          var view:View = new View( this );

          //设置页面标题，这里是类属性存储器，所有的存储器都是函数可以继承。
          this.title = "Welcome to EaseScript ^v^";

          //创建一个元素，这只是一个实例不建议这样写，推荐用 html 的语法来编写界面
          var elem:Element = new Element("<p style='font-size:42px; margin:50px auto;width:100%; text-align:center;'>Welcome use EaseScript!</p>");

          //每一个显示对象都必须是 Display 类型
          //每一个显示对象需要指定一个元素  
          view.addChild( new Display( elem ) );

          //执行渲染视图
          this.render( view );
       }
   }

}

```

## 视图或者皮肤的语法格式

``` html

1、视图

./project/src/view/Welcome.html

<?xml version="1.0" encoding="UTF-8"?>
<s:View xmlns:s="es.core"  xmlns:c="es.components" xmlns:ss="@">
    <s:Metadata>[HostComponent("Welcome")]</s:Metadata>
    <![CDATA[
        import es.core.Display;
         public get child():Array
         {
            return  [
                new Display( new Element(Element.createElement("div")),  {jjj:999,innerHTML:"=======createElement======="} ),
                new Display( new Element(Element.createElement("div")),  {jjj:7777,innerHTML:"<span style='color:red;'>=======createElement===66666666====</span>"} )
            ]; 
         }
         private click()
         {
             console.log("=====");
         }
    ]]>

    <head>
        <title>{this.title}</title>
    </head>

    <s:states>
       <s:State name="show" stateGroup="fail,success"></s:State>
       <s:State name="hide" stateGroup="hide"></s:State>
    </s:states>

    <s:Declare>
       const {
           message:String="title"
        } = dataset;
    </s:Declare>

    <s:currentState>hide</s:currentState>

    <h1>Welcome use EaseScript</h1>

    <span>点我，弹个框看看</span>
 
    <c:PopUp title="弹框组件" includeIn="show">
        <div>这里是内容</div>
    </c:PopUp>

    <!--这只是一个普的元素容器，不能在组件中传递 -->
    <div>

         <!--dataset 是一个数据集，所有从组件中传过来的数据-->
        <h1>the value in dataset.message, {dataset.message}</h1>

        <!--message 是从dataset中提取的变量 -->
        <h1>the title {message}</h1>

        <!--这是显示对象（Display）容器元素, 可以在组件中传递-->
        <s:Container>
            <div>子元素一</div>
            <div>子元素二</div>
        </s:Container>
    
        <!-- id 直接声明的公开属性名为 dataGrid 在其它组件中可以直接引用 -->
        <!-- includeIn 当前所在的状态组件，如果当前状态为 show 则显示，否则不显示 -->
        <!-- onClick 为当前组件添加的 click 事件 -->
        <c:DataGrid 
        id="@dataGrid"  
        includeIn="success" 
        onClick="{click}">

            <!-- 这里是使用数据源自动加载数据 -->
            <!-- <c:source>http://local.working.com/json.php</c:source>
            <c:dataSource>
                <c:dataType>@Http.TYPE_JSONP</c:dataType>
            </c:dataSource> -->

            <!-- 这里是配置的配置数据源 -->
            <c:source>
                <ss:Array>
                    <ss:Object>
                        <id>1</id>
                        <name>张三</name>
                        <phone>15302662598</phone>
                    </ss:Object>
                    <ss:Object>
                        <id>2</id>
                        <name>李四</name>
                        <phone>1869875696</phone>
                    </ss:Object>
                     <ss:Object>
                        <id>2</id>
                        <name>王五</name>
                        <phone>1896325987</phone>
                    </ss:Object>
                </ss:Array>
            </c:source>

            <!-- 数据源对列的关系名 -->
            <c:columns>
                <id>ID</id>
                <name>名称</name>
                <phone>电话</phone>
            </c:columns>
            
        </c:DataGrid>

    </div>

</s:View>




```