/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    import es.interfaces.IDisplay;
    import es.core.State;
    public class SkinEvent extends Event
    {
        static public const CREATE_CHILDREN_COMPLETED:String ='createChildrenCompleted';
        static public const INTERNAL_UPDATE_STATE:String ='internalUpdateState';
        public var parent:IDisplay;
        public var child:IDisplay;
        public var state:State;
        public function SkinEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        };
    }
}

