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
   import es.core.Storage;
   import es.events.ApplicationEvent;
   import es.interfaces.IDisplay;
   import es.core.SystemManage;

   public class Application extends EventDispatcher
   {
       static private var lastApp:Node=null;
       private var appContainer:Node=null;
       private var initiated:Boolean = false;

       public function Application()
       {
           super( document );
           when( RunPlatform(server) )
           {
                this.appContainer = Element.createElement("div");
                this.appContainer.className="application";
                this.appContainer.setAttribute("id","application");

           }then
           {
                this.appContainer = document.getElementById("application");
                if( !this.appContainer )
                {
                    this.appContainer = Element.createElement("div");
                    this.appContainer.className="application";
                    this.appContainer.setAttribute("id","application");
                }
           }
       }

        /**
         * 获取此组件的唯一ID
         * @returns {String}
         */
        public function getComponentId( prefix:String="" ):String
        {
            return prefix;
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
                        if( lastApp && lastApp.parentNode )
                        {
                           lastApp.parentNode.removeChild( lastApp );
                        }
                        lastApp = container;
                    }
                }
                initiated = true;
                this.appContainer = container;
           }
           return container;
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
        *@private
        */
       private var metaMaps:Object = {};

       /**
       * 设置页面的meta元素属性
       * @key key
       * @attr
       */
       [RunPlatform(server)] 
       public function meta(key:*, attrs:Object):void
       {
          if( metaMaps[ key ] )
          {
              attrs =Object.merge( metaMaps[ key ], attrs);
          }
          metaMaps[ key ] = attrs;
       }

       /**
       * 获取页面的所有meta元素属性
       * @returns {Array}
       */
       protected function get metas():Array
       {
           return Object.values( metaMaps );
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
       * 获取当前应用入口需要的脚本文件
       * 只有在服务端渲染时此方法才会调用
       * @returns {Array}
       */
       [RunPlatform(server)] 
       protected function getViewScripts():Array
       {
            var scripts:Object = System.environments("LOAD_SCRIPTS");
            var classname:String = __CLASS__;
            var items:Array = scripts[classname] || [];
            return items;
       }

       /**
       * 响应一个视图页面
       */
       protected responser(view:View)
       {
            if( this.hasEventListener( ApplicationEvent.RESPONSE_BEFORE ) )
            {
                var event:ApplicationEvent = new ApplicationEvent( ApplicationEvent.RESPONSE_BEFORE );
                event.container = view;
                this.dispatchEvent( event );
                if( event.defaultPrevented )
                {
                    return;
                }
            }

            when( RunPlatform(server) )
            {
                SystemManage.done(()=>{

                    document.title = this.title || "title";

                    var script:Node = new HTMLElement('script') as Node;
                    script.content='window["'+Interaction.key+'"]='+ JSON.stringify( Interaction.dataset );
                    document.head.appendChild( script );

                    this.metas.map( (item:Object)=>{
                        var script:Node = new HTMLElement('meta') as Node;
                        for(var p:String in item )
                        {
                           script.setAttribute(p,item[p]);
                        }
                        document.head.appendChild( script );
                    });

                    var items:Array = this.getViewScripts();
                    for(var value:String of items )
                    {
                        var type:String = value.substr(value.lastIndexOf(".")+1);
                        if( type ==="js" )
                        {
                            var main:Node = new HTMLElement('script') as Node;
                            main.setAttribute("src", value ); 
                            document.body.appendChild( main );

                        }else if( type ==="css")
                        {
                            var link:Node = new HTMLElement('link') as Node;
                            link.setAttribute("href", value );
                            link.setAttribute("rel", "stylesheet"); 
                            document.head.appendChild( link );
                        }
                    }
                
                    var res:Response = System.environments("HTTP_RESPONSE") as Response;
                    res.status( 200 );
                    res.send( "<!DOCTYPE html>\n"+document.documentElement.outerHTML );

                });
            }
       }

       /**
        * 渲染并且显示一个视图
        * returns {View}
        */
       public function render( view:View ):View
       {
           var elem:Element = view.display();
           var app:Node = this.appContainer;
           if( !app.parentNode && elem.current() === app )
           {
               (document.body as Node).appendChild( app );
           }
           this.responser( view );
           return view;
       }
   }
}