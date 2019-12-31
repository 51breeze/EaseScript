package
{
   import es.core.Application;
   import es.core.View;
   import es.core.Display;
   import WelcomeView;

   [Router(default=index)]
   public class Welcome extends Application 
   {
       public function Welcome()
       {
           super();
       }

       [Router(method="get")]
       public index()
       {
           var view:WelcomeView = new WelcomeView( this );
           this.render( view );
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