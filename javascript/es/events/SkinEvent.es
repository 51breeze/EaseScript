/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    import es.core.Display;
    public class SkinEvent extends Event
    {
        static public const CREATE_CHILDREN_COMPLETED ='createChildrenCompleted';
        public var parent:Display;
        public var child:Display;
        public function SkinEvent(type, bubbles, cancelable)
        {
            super(type, bubbles, cancelable);
        };
    }
}

