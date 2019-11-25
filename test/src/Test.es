package{


   import es.core.Application;

   public class Test  extends Application
   {
      public Test()
      {
          console.log("test");
          
      }

      public index(){

          this.render( new view.TestView(this) );

      }


   }

}