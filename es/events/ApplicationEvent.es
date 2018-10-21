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
    public class ApplicationEvent extends Event
    {
        static public const FETCH_ROOT_CONTAINER:String ='applicationFetchRootContainer';
        public var container:Object;
        public function ApplicationEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        };
    }
}