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
       private static function pipeline(target:EventDispatcher,type:String,name:String, cmd:String, args:Array, callback:Function )
       {
           var event:PipelineEvent = new PipelineEvent( type );
           event.name = name;
           event.cmd = cmd;
           event.callback = callback;
           event.params = args;
           if( target.hasEventListener(type) )
           {
               target.dispatchEvent( event );
               return event;
           }
           throw new ReferenceError("No binding to the specified '"+type+"' pipeline.");
       }

      /**
       * 生成一个响应结果的回调函数
       * 如需要实现自定义响应逻辑，请在子类中覆盖此方法
       */
       protected function makeCallback(args:Array,name:String=''):Function
       {
           if( args.length > 0 && args[ args.length - 1 ] instanceof Function )
           {
                return args.pop() as Function;
           }
           return (result:*)=>{
                if( result !== false ){
                    this.success( result );
                }else{
                    this.failed( result );
                }
           };
       }

       /**
        * 查询数据
        * @param sql
        * @param params
        * @param callback
        * @return {PipelineEvent}
        */
       protected function query( sql:String,...args):PipelineEvent
       {
           const callback:Function = this.makeCallback(args, 'query');
           return Service.pipeline(this, PipelineEvent.PIPELINE_DATABASE, "select", sql, args, callback );
       }

       /**
        * 更新数据
        *
        * @param sql
        * @return {PipelineEvent}
        */
       protected function save( sql:String,...args):PipelineEvent
       {
           const callback:Function = this.makeCallback(args, 'save');
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "update", sql,args, callback );
       }

       /**
        * 追加数据
        * @param sql
        * @return {PipelineEvent}
        */
       protected function insert(sql:String,...args):PipelineEvent
       {
           const callback:Function = this.makeCallback(args, 'insert');
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "insert", sql,args, callback );
       }

       /**
        * 删除数据
        * @param sql
        * @return {PipelineEvent}
        */
       protected function remove( sql:String,...args):PipelineEvent
       {
           const callback:Function = this.makeCallback(args, 'remove');
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "delete",sql,args, callback );
       }

       /**
        * 成功时的响应数据结构
        * @param data
        * @return {void}
        */
       protected function success( data:* ):void
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

           this.response({"data":data, "status":200});
       }

       /**
        * 失败时的响应数据结构
        * @param message
        * @param errorCode
        * @param status
        * @return {void}
        */
       protected function failed(message:String, errorCode:int=500, status:int=200):void
       {
             this.response({
                "message":message,
                "errorCode":errorCode,
                "status":status
             },status);
       }

      /**
       * 发送响应数据对象
       */
       public function response(data:*,status:int=200):void
       {
           const response:* = System.environments("HTTP_RESPONSE");
           response.send( data );
           response.status( status );
       }
   }
}