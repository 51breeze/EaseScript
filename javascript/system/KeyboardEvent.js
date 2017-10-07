/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,Object
 */
function KeyboardEvent( type, bubbles,cancelable  )
{
    if( !(this instanceof KeyboardEvent) )return new KeyboardEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
System.KeyboardEvent=KeyboardEvent;
KeyboardEvent.prototype=Object.create( Event.prototype );
KeyboardEvent.prototype.constructor=KeyboardEvent;
KeyboardEvent.prototype.keycode=null;
KeyboardEvent.KEY_PRESS='keypress';
KeyboardEvent.KEY_UP='keyup';
KeyboardEvent.KEY_DOWN='keydown';

//键盘事件
Event.registerEvent(function ( type , target, originalEvent )
{
    switch ( type ){
        case KeyboardEvent.KEY_PRESS :
        case KeyboardEvent.KEY_UP :
        case KeyboardEvent.KEY_DOWN :
            var event =new KeyboardEvent( type );
            event.originalEvent = originalEvent;
            event.keycode = originalEvent.keyCode || originalEvent.keycode;
            return event;
    }
});