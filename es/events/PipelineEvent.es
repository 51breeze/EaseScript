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
            var hook:Function = this.callback;
            if( hook )
            {
                var ret:* = hook();
                if( ret )
                {
                    return ret;
                }
            }
            return {
                "data":this.data,
                "message":this.message,
                "status": isNaN(this.code) ? 200 : code
            };
        }
    }
}

