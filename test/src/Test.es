package{


   import es.core.Application;
   import es.core.View;
   import es.core.DataSource;
   import es.events.DataSourceEvent;

   public class Test extends Application
   {
      public Test()
      {
         super();
      }

      public index()
      {
         var v:View = new view.TestView(this) ;
         return this.render( v );
      }

   }

}