package{


   import es.core.Application;
   import es.core.View;



   public class Test extends Application
   {
      public Test()
      {

         super();
         
      }

      public index()
      {

         var v:View = new view.TestView(this) ;
         this.render( v );
      }


   }

}