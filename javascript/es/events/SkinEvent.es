/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
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

