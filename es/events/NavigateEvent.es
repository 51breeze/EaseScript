/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    import es.interfaces.IContainer;
    import es.core.State;
    public class NavigateEvent extends Event
    {
        static public const LOAD_CONTENT_BEFORE:String ='navigateLoadContentBefore';
        public var item:Object=null;
        public var viewport:IContainer=null;
        public var content:*=null;
        public function NavigateEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        };
    }
}

