/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event,Object
 */

package es.events{

    public class SystemManageEvent extends Event
    {
        public static const SERVER_REQUEST_DONE_ALL:String = "serverRequestDoneAll";
        
        public DataSourceEvent(type:String, bubbles:Boolean=true,cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        }
    }
}