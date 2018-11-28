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
        public var cmd:*=null;
        public function PipelineEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        };
    }
}

