/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,Object;
 */
function RenderEvent(type, bubbles, cancelable  ){
    if( !(this instanceof RenderEvent) )return new RenderEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}


module.exports =RenderEvent;
var Object = require("./Object.js");
var Event = require("./Event.js");

RenderEvent.prototype= Object.create(Event.prototype,{
    "constructor":{value:RenderEvent}
});
RenderEvent.prototype.view=null;
RenderEvent.prototype.variable=null;
RenderEvent.prototype.html='';
RenderEvent.START='templateStart';
RenderEvent.DONE='templateDone';


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
