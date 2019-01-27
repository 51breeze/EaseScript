/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    public class StateEvent extends Event
    {
        static public const CHANGE:String ='stateChange';
        public  var newState:*=null;
        public  var oldState:*=null;
        public function StateEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        };
    }
}

