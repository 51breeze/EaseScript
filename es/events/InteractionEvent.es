/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    public class InteractionEvent extends Event
    {
        static public const PULL_IN:String ='interactionPullIn';
        static public const PUSH_OUT:String ='interactionPushOut';
        public var data:Object={};
        public function InteractionEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        };
    }
}