package{


   import es.core.Application;
   import es.core.View;


   public class Test extends Application
   {
      public Test()
      {
          console.log("test");
          const b:Function = (item:Object=[]):Object=>{

                 console.log( this, this.index({}) );

                 var map:Object={
                   
                     name123:name(jj:*={},...arg):Array{

                        var b:Function = (item:*,...sas)=>item;
                        console.log(this, b ,  jj, arg );
                        return [];

                     }
                  
                  };

                  map.name123();

                 return item;
            };

            b();

      }

      public index( sss:*,dd:Function=null, ...args):View{

         var v:View = new view.TestView(this) ;
         // this.render( new view.TestView(this) );
          return v;

      }


   }

}