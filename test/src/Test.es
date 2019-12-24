package{


   import es.core.Application;
   import es.core.View;
   import es.core.DataSource;
   import es.events.DataSourceEvent;
   import es.interfaces.IListIterator;

   public class Test extends Application implements IListIterator
   {
      public Test()
      {
         super();
      }

      public index()
      {

         var arr:Array= [1,5,6,9];

         console.log(  Array.from(arr) );


          var json:Object = {
             length:5,
             name:456,
             address:"sdfdsfdsf",
             arr
          };

          var str:String = "name=123;avg=8";

         console.log(  Array.from( json ) );
         console.log(  Array.from( str.matchAll(/\(=)/ig)  ) );


         console.log(  Array.from(  this  ) );


         for( var item:* of this )
         {
            console.log( item, "=============") ;
         }


         for( var name:String in this )
         {
            console.log( name, "========for in=====");
         }


         var v:View = new view.TestView(this) ;
         return this.render( v );
      }


        private var arr:Array = [1,5,6,9,11,12]; 
        private var offset:int = 0;


        public function current():*
        {
           return arr[ offset ];
        }
        public function key():*{

           return offset;

        }
        public function next():void{

           offset++;

        }
        public function rewind():void{
           offset = 0;
        }

        public function valid():Boolean{
           return arr.length > offset;
        }

   }

}