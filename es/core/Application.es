package es.core
{
   import es.core.View;
   import es.core.Interaction;
   public class Application extends EventDispatcher
   {
       public function Application()
       {
           super( document );
       }

       /**
        * 获取所有交互数据转成JSON字符串
        * @returns {String}
        */
       protected function propertiesToJson():String
       {
           return JSON.stringify( Interaction.getProperties().valueOf() );
       }

       /**
        * @private
        */
       private var _assignments:Object={};

       /**
        * 获取或者指定数据
        * @param name
        * @param value
        * @return
        */
       public function assign(name:String, value:*=null)
       {
           if( value==null ){
               return _assignments[ name ];
           }
           return _assignments[ name ] = value;
       }

       /**
        * 设置此视图的标题
        * @param value
        */
       public function set title( value:String ):void
       {
           _assignments.title = value;
       }

       /**
        * 获取此视图的标题
        * @param value
        * @returns String;
        */
       public function get title():String
       {
           return _assignments.title as String;
       }

       /**
        * 获取所有已分配的数据
        * @returns {Object}
        */
       public function getAssignments():Object
       {
           return _assignments;
       }

       /**
        * 渲染并且显示一个视图
        */
       public function render( view:View ):void
       {
           view.display();
           when( RunPlatform(server) )
           {
               var script:Node = new HTMLElement('script') as Node;
               script.content='window["'+Interaction.key+'"]='+ propertiesToJson();
               document.head.addChild( script );
           }
       }
   }
}