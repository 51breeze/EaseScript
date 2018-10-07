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
       protected static function pipeline(target:EventDispatcher,type:String,name:String, cmd:* )
       {
           var event:PipelineEvent = new PipelineEvent( type );
           event.name = name;
           event.cmd = cmd;
           if(target.hasEventListener(type) )
           {
               var data:* = target.dispatchEvent( event );
               return data===null ? event.data : data;
           }
           throw new ReferenceError("No binding to the specified '"+type+"' pipeline.");
       }

       /**
        * 查询数据
        * @param sql
        * @return {*}
        */
       protected function query( sql:String )
       {
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "select", arguments );
       }

       /**
        * 更新数据
        * @param sql
        * @return {*}
        */
       protected function save( sql:String)
       {
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "update", arguments );
       }

       /**
        * 追加数据
        * @param sql
        * @return {*}
        */
       protected function append(sql:String )
       {
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "insert", arguments );
       }

       /**
        * 删除数据
        * @param sql
        * @return {*}
        */
       protected function remove( sql:String )
       {
           return Service.pipeline(this,PipelineEvent.PIPELINE_DATABASE, "delete", arguments );
       }

       /**
        * 成功时的响应数据结构
        * @param data
        * @return {Object}
        */
       protected function success( data:* )
       {
           if( data instanceof Array ){
               data = (data as Array).map(function (item:*) {
                    return (Array)item;
               });
           }
           return {"data":data, "status":200};
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
            return {"message":message,"errorCode":errorCode,"status":status};
       }
   }
}