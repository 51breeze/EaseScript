/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,Event
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

