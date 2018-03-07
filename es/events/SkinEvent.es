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
        static public const CREATE_CHILDREN_COMPLETED ='createChildrenCompleted';
        static public const INTERNAL_UPDATE_STATE ='internalUpdateState';
        public var parent:IDisplay;
        public var child:IDisplay;
        public var state:State;
        public function SkinEvent(type, bubbles=true, cancelable=true)
        {
            super(type, bubbles, cancelable);
        };
    }
}

