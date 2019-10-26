/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    [RunPlatform(server)]
    public class PipelineEvent extends Event
    {
        static public const PIPELINE_DATABASE:String = 'pipelineDatabase';
        static public const PIPELINE_REDIS:String = 'pipelineRedis';
        static public const RESPONSE_BEFORE:String = 'pipelineResponseBefore';
        public var name:String=null;
        public var data:*=null;
        public var cmd:String=null;
        public var message:String=null;
        public var code:int=NaN;
        public var callback:Function=null;
        public var params:Array=null;
        public function PipelineEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        };
        override public function valueOf():*
        {
            var callback:Function = this.callback;
            var data:* = this.data;
            var message:String = this.message;
            var code:int = this.code;
            if( callback )
            {
                var ret:* = callback( data, message, code );
                if( ret )
                {
                    return ret;
                }
            }
            return {
                "data":data,
                "message":message,
                "status": isNaN(code) ? 200 : code
            };
        }
    }
}

