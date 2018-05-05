package es.core
{
   import es.core.View;
   public class Application extends EventDispatcher
   {
       public function Application()
       {
           super( document );
       }

       /**
        * @private
        */
       private var assignments:Object={};

       /**
        * 获取或者指定数据
        * @param name
        * @param value
        * @return
        */
       public function assign(name:String, value:*=null)
       {
           if( value==null ){
               return assignments[ name ];
           }
           return assignments[ name ] = value;
       }

       /**
        * 设置此视图的标题
        * @param value
        */
       public function set title( value:String ):void
       {
           assignments.title = value;
       }

       /**
        * 获取此视图的标题
        * @param value
        * @returns String;
        */
       public function get title():String
       {
           return assignments.title as String;
       }

       public function getAssignments():Object
       {
           return assignments;
       }
   }
}