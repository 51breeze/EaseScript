/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

package es.core
{
   import es.events.PipelineEvent;

   [RunPlatform(server)]
   public class Service extends EventDispatcher
   {
       /**
        * @constructor
        */
       public function Service()
       {
           super();
       }

       /**
        * 发送管道指令
        * @param name
        * @param type
        * @param cmd
        * @return {*}
        */
       protected static function pipeline(target:EventDispatcher,type:String,name:String, args:Array )
       {
           var event:PipelineEvent = new PipelineEvent( type );
           event.name = name;
           event.cmd = (String)args[0];
           if( args.length > 1 )
           {
               if( args[1] instanceof Function )
               {
                  event.callback = (Function)args[1];
               }else{
                  event.params = (Array)args[1];
               }

               if( args.length > 2 )
               {
                  if( args[2] instanceof Function )
                  {
                     event.callback = (Function)args[2];
                  }else{
                     event.params = (Array)args[2];
                  }
               }
           }

           if( target.hasEventListener(type) )
           {
               target.dispatchEvent( event );
               return event;
           }
           throw new ReferenceError("No binding to the specified '"+type+"' pipeline.");
       }

       /**
        * 查询数据
        * @param sql
        * @param params
        * @param callback
        * @return {*}
        */
       protected function query( sql:String  )
       {
           return Service.pipeline(this, PipelineEvent.PIPELINE_DATABASE, "select", arguments as Array );
       }

       /**
        * 更新数据
        *
        * @param sql
        * @return {*}
        */
       protected function save( sql:String)
       {
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "update", arguments as Array );
       }

       /**
        * 追加数据
        * @param sql
        * @return {*}
        */
       protected function append(sql:String )
       {
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "insert",arguments as Array );
       }

       /**
        * 删除数据
        * @param sql
        * @return {*}
        */
       protected function remove( sql:String )
       {
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "delete", arguments as Array );
       }

       /**
        * 成功时的响应数据结构
        * @param data
        * @return {Object}
        */
       protected function success( data:* )
       {
           if( data instanceof Array )
           {
               data = (data as Array).map(function (item:*) 
               {
                    return System.isObject(item) ? (item as Object).valueOf() : item;
               });

           }else if( System.isObject(data) )
           {
               data = (data as Object).valueOf();
           }
           return this._response = {"data":data, "status":200};
       }

       /**
        * 失败时的响应数据结构
        * @param message
        * @param errorCode
        * @param status
        * @return {Object}
        */
       protected function failed(message:String, errorCode:int=500, status:int=200)
       {
            return this._response = {"message":message,"errorCode":errorCode,"status":status};
       }

       private var _response:Object = null;

      /**
       * 发送响应数据对象
       */
       public function get response():Object
       {
            var res:Object = this._response;
            if( res.data instanceof PipelineEvent )
            {
                res.data = res.data.valueOf();
            }
            return res;
       }
   }
}