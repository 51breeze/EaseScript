/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    public class SkinEvent extends Event
    {
        static public const UPDATE_DISPLAY_LIST:String ='skinUpdateDisplayList';
        public var children:Array=null;
        public function SkinEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        }
    }
}

