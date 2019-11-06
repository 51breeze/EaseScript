# EaseScript Beta
```

## EaseScript 致力于改变web的开发方式，减少重复的开发成本。
```

### 目前开发的现状
```
1、目前所有开源的web组件，可选实现技术比较广泛，很难形成统一的规范且不能通用
2、不同种类的编程语言都可能需要开发同功能的组件，比如js开发的组件不能在php中使用等
3、同种类的编程语言在不同的开发框架中可能需要开发同功能的组件，比如很强的 Ant Design 也要分别为 React、Vue、Angular 开发同功能的组件等
4、都在自己的开发世界里感觉可以掌控一切，或许不同的开发人员、不同的项目组、不同的公司都在写同功能的组件
5、不同的技术需要不同的技术人员来支撑
6、日新月异的技术让开发人员感觉无所适从，不是不学只是一直在奔跑的路上...哎~

基于以上我们大部分在做着同样的事情，那么要如何解决这个问题，这就是 EaseScript 的价值所在 

### 为什么要使用 EaseScript
```
1、基于ES6语法，实现了类命名空间、数据接口、编译时数据类型检查、属性存储器和类函数访问控制修饰符等。增强了代码的规范，减少质量缺陷
2、跨浏览器实现，再也不用担心会有兼容问题了
2、颗粒化组件开发，所有组件只开发一次，即使运行在其它语言环境，比如 java、golang、python、php、nodejs等（目前仅支持php、nodejs）， 只需要编译成指定的目标运行语言即可
3、前端和服务端打包在一起开发，减少开发和联调人员的依赖
5、在编译时基于元类型的配置，让开发更容易理解和减少繁琐的配置

### 使用 EaseScript 目的就是要统一语法
```
只有统一了才能形成标准，只有标准化了才能复用，只有复用了才可以减少开发节省成本

### 安装脚手架
```
npm install easescript-installer -g

安装成功后进入 cmd 切换到所在目录

输入: ei --init 按提示输入相关信息

D:\workspace\test>ei --init
? 项目名: ./
? 构建路径: ./build
? 描述:
? 作者:
? 配置文件路径:
? 入口文件(file/path): [project_src_dir]
? 皮肤扩展路径(libxmljs):
? 支持皮肤: Yes
? 是否拆分打包: Yes
? 是否使用webpack打包: Yes
? 服务端运行环境: node
? 服务端运行地址: 127.0.0.1:8080
? 指定编译参数:
? 立即安装 (Y/n) Yes

立即安装成功后可启动项目，就可以看到 "Welcome use EaseScript!" 字样

注意：libxmljs@0.18.8 这个安装不稳定，有时候报错且过程较慢请耐心等待

### 语法格式
```
package
{
   import es.core.Application;
   import es.core.View;
   import es.core.Display;

   [Router(default=home)]
   public class Welcome extends Application 
   {
       public function Welcome()
       {
           super();
       }

       public function home()
       {
          //这是一个视图基类， 如果想实现自己的视图，可以使用基于 xml 的语法实现。
          var view:View = new View( this );

          //设置页面标题
          this.title = "Welcome to EaseScript ^v^";

          //创建一个元素
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
