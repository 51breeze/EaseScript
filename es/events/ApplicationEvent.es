/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    public class ApplicationEvent extends Event
    {
        static public const FETCH_ROOT_CONTAINER:String ='applicationFetchRootContainer';
        static public const RESPONSE_BEFORE:String ='applicationResponseBefore';
        public var container:Object=null;
        public function ApplicationEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        }
    }
}