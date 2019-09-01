/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

package es.core
{
   import es.core.View;
   import es.core.Skin;
   import es.core.Interaction;
   import es.events.ApplicationEvent;
   import es.interfaces.IDisplay;

   public class Application extends EventDispatcher
   {
       static private var lastApp:Node=null;
       private var appContainer:Node=null;
       private var initiated:Boolean = false;
       public function Application()
       {
           super( document );
           this.appContainer = Element.createElement("div");
           this.appContainer.className="application";
       }

       /**
        * 视图的根节点容器
        * 每一个视图在初始化时都会调用方法来获取一个装载的容器
        * 如果想改变默认容器可以通过 ApplicationEvent.FETCH_ROOT_CONTAINER 事件来传递。
        * @return {Node}
        */
       public function getContainer():Node
       {
           var container:Node = this.appContainer;
           if( initiated === false )
           {
                var event:ApplicationEvent = new ApplicationEvent( ApplicationEvent.FETCH_ROOT_CONTAINER );
                event.container = container;
                if( this.dispatchEvent( event ) )
                {
                    if( event.container is IDisplay){
                        container = (event.container as IDisplay).element[0] as Node;
                    }else{
                        container = event.container as Node;
                    }

                    //如果不想替换根容器，需要在侦听器中添加 e.preventDefault(); 来阻止这一行为。
                    if( !event.defaultPrevented )
                    {
                        if( lastApp )
                        {
                            document.body.removeChild( lastApp );
                        }
                        (document.body as Node).appendChild( container );
                        lastApp = container;
                    }
                }
                initiated = true;
                this.appContainer = container;
           }
           return container;
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
                  // return '#' + (value as Skin).generateId();
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
        * 获取或者指定数据
        * @param name
        * @param value
        * @return
        */
       public function assign(name:String, value:*=null)
       {
           if( value==null )
           {
               return _dataset[ name ];
           }
           return _dataset[ name ] = value;
       }

       /**
        *@private
        */  
        private var _dataset:Object={};

        /**
        * 获取数据集
        */
        public function get dataset():Object
        {
            return _dataset;
        }

        /**
        * 设置数据集
        */
        public function set dataset(value:Object):void
        {
            _dataset = value;
        }

       /**
        * 设置此视图的标题
        * @param value
        */
       public function set title( value:String ):void
       {
           _dataset.title = value;
           document.title = value;
       }

       /**
        * 获取此视图的标题
        * @param value
        * @returns String;
        */
       public function get title():String
       {
          return _dataset.title as String;
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
       public function render( view:View ):View
       {
           view.display();
           when( RunPlatform(server) )
           {
               var script:Node = new HTMLElement('script') as Node;
               script.content='window["'+Interaction.key+'"]='+ propertiesToJson();
               document.head.appendChild( script );
           }
           return view;
       }
   }
}