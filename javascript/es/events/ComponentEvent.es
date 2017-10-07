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
        static public const INITIALIZING = 'componentInitializing';
        static public const INITIALIZED  = 'componentInitialized';
        static public const INSTALLING   ='componentInstalling';
        static public const UPDATE_DISPLAY_LIST ='componentUpdateDisplayList';
        public var hostComponent:Component=null;
        public function ComponentEvent(type, bubbles, cancelable)
        {
            super(type, bubbles, cancelable);
        };
    }
}

