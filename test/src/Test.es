package{


   import es.core.Application;

   public class Test  extends Application
   {
      public Test()
      {
          console.log("test");

          const b:Function = (item:Object=[]):Object=>{

                 console.log( this, this.index({}) );

                  name():Array{

                      var b:Function = (item:*)=>item;
                      return [];

                  }

                 return item;
            };
      }

      public index(obj:Object):Object{

          this.render( new view.TestView(this) );
          //return new es.core.Application();

          return {};

      }


   }

}