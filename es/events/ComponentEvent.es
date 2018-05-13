/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    import es.components.Component;
    public class ComponentEvent extends Event
    {
        static public const INITIALIZING:String = 'componentInitializing';
        static public const INITIALIZED:String  = 'componentInitialized';
        static public const INSTALLING:String   ='componentInstalling';
        static public const UPDATE_DISPLAY_LIST:String ='componentUpdateDisplayList';
        public var hostComponent:Component=null;
        public function ComponentEvent(type:String, bubbles:Boolean=true, cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        };
    }
}

