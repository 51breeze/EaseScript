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

         var obj:Object={name:123,ag:88,add:"dsfdsfdsfsdf"};

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