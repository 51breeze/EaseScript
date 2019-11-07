# EaseScript Beta

## EaseScript 致力于改变web的开发方式，减少重复的开发成本。

## 为什么要使用 EaseScript

**EaseScript 的初衷是想让开发变得更劲松更优雅更灵活。倡导开发颗粒化组件从而达到共享复用的效果，让所有的业务功能通过复用组件砌合而成，尽量减少开发同功能的需求以节省人力成本**

## 特点

1. 基于ES6语法，实现了类命名空间、数据接口、编译时数据类型检查、属性存储器和类函数访问控制修饰符等。增强了代码的规范，减少质量缺陷
2. 编译时可指定需要兼容的浏览器版本，根据业务场景来实现浏览器兼容问题（编译时内置Polyfill，会相对增加文件体积）
3. 业务逻辑、界面布局、样式分开管理，想在复用组件的基础上定制功能更加轻松
4. 同功能只开发一次，可编译成不同的目标运行语言（比如 java、golang、python、php、nodejs等。目前仅支持php、nodejs敬请期待吧~）
5. 实现了lass样式按需加载，使用时不需要单独再维护减少了样式文件的体积
6. 所有加载的文件只有使用过了才会打包，减少了项目文件的体积
7. 界面布局是用xml或者html的方式开发，更容易维护
8. 界面布局实现了状态机来控制界面的布局，不用使用if/else来判断
9. 数据的单/双向绑定
10. 使用了DOM差集算法更新，类似虚拟DOM但没有虚拟的对象开销，所有不用担心性能问题。因为 EaseScript 采用的是xml的结构标记语法，
    在编译时就知道当前的元素是否有创建过否则不会再创建

## 使用方法

1. 安装脚手架

>    npm install easescript-installer -g

2. 安装成功后进入 cmd 切换到所在目录
3. 在命令行中输入 ei --init 按提示输入相关信息
    ```
    >   D:\workspace\test>ei --init 
    >   ? 项目名: ./ 
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
4. 立即安装成功后使用 npm run start 来动启动项目
5. 如果看到 "Welcome use EaseScript!" 字样,那么恭喜你成功了！！

注意：libxmljs 这个安装不稳定，有时候报错且过程较慢请耐心等待


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
