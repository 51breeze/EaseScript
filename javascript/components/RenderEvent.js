/*
 * BreezeJS TouchEvent class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 * @require Event,Object;
 */
function RenderEvent(type, bubbles, cancelable  ){
    if( !(this instanceof RenderEvent) )return new RenderEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}
RenderEvent.prototype= Object.create(Event.prototype);
RenderEvent.prototype.view=null;
RenderEvent.prototype.variable=null;
RenderEvent.prototype.html='';
RenderEvent.prototype.constructor=RenderEvent;
RenderEvent.START='templateStart';
RenderEvent.DONE='templateDone';
System.RenderEvent=RenderEvent;

//触摸拖动事件
Event.registerEvent(function ( type ,target, originalEvent )
{
    if(originalEvent instanceof RenderEvent)return originalEvent;
    switch ( type ){
        case RenderEvent.START :
        case RenderEvent.DONE :
            var event =new RenderEvent( type );
            event.originalEvent = originalEvent;
            return event;
    }
});
