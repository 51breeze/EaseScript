package es.core
{
   import es.core.View;
   import es.core.Skin;
   import es.core.Interaction;
   public class Application extends EventDispatcher
   {
       public function Application()
       {
           super( document );
           Reflect.set(System, System, "context", this);
       }

       /**
        * 获取所有交互数据转成JSON字符串
        * @returns {String}
        */
       [RunPlatform(server)]
       protected function propertiesToJson():String
       {
           var object:Object = Interaction.getProperties().valueOf();
           var data:Object={};
           var self:Application = this;
           Object.forEach(object,function (value:*,name:*) {
               value = self.valueToString(value);
               if( value !== null ) {
                   data[name] =value;
               }
           });
           return JSON.stringify( data );
       }

       [RunPlatform(server)]
       protected function valueToString( value:* ):*
       {
           if( typeof value === "boolean" )
           {
               return value;
           }else if( typeof value === "Number" )
           {
               return value;
           }else if( value == null )
           {
               return null;
           }
           if( value instanceof Skin )
           {
               var elem:Element = (value as Skin).element;
               if(  elem.isNodeInDocumentChain() ) {
                   return '#' + (value as Skin).generateId();
               }else{
                   return null;
               }

           }else if( value instanceof Object || value instanceof Array )
           {
               var map:Object = {};
               var self:Application = this;
               var has:Boolean = false;
               Object.forEach(value, function (item: *, name: String) {
                   item = self.valueToString( item );
                   if( item !== null )
                   {
                       map[name] = item;
                       has = true;
                   }
               });
               if( has ) {
                   return map;
               }else{
                   return null;
               }
           }
           return value;
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
        * @private
        */
       private var _async:Boolean = Syntax(origin,javascript);

       /**
        * 标记此组件的运行行为。是否异步(前端/后端)执行
        * 此标记只对编译在服务端的组件有用。否则在编译为客户端(javascript)的时候始终返回true
        * @param flag
        */
       public function set async(flag:Boolean):void
       {
           _async = flag;
       }

       /**
        * 获取此组件的运行行为。是否异步(前端/后端)执行
        * 此标记只对编译在服务端的组件有用。否则在编译为客户端(javascript)的时候始终返回true
        * @returns {Boolean}
        */
       public function get async():Boolean
       {
           when( Syntax(origin,javascript) ){
           return true;
           }then{
               return _async;
           }
       }

       /**
        * 获取此组件的唯一ID
        * @returns {String}
        */
       public function getComponentId( prefix:String="" ):String
       {
           return "";
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