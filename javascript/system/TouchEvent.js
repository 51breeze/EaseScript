/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
* @require MouseEvent,Object,Event;
*/
function TouchEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchEvent) )return new TouchEvent(type, bubbles,cancelable);
    MouseEvent.call(this, type, bubbles,cancelable );
    return this;
};

module.exports =TouchEvent;
var Object = require("./Object.js");
var MouseEvent = require("./MouseEvent.js");
var Event = require("./Event.js");

TouchEvent.prototype=Object.create( MouseEvent.prototype ,{
    "constructor":{value:TouchEvent}
});
TouchEvent.TOUCH_START='touchstart';
TouchEvent.TOUCH_MOVE='touchmove';
TouchEvent.TOUCH_END='touchend';
TouchEvent.TOUCH_CANCEL='touchcancel';
TouchEvent.setting = {
    longpress: {
        requiredTouches: 1,
        msThresh: 800,
        triggerStartPhase: false
    },
    swipe:{
        velocityThresh:0.25
    },
    rotate: {
        requiredTouches: 1
    }
};

//触摸拖动事件
Event.registerEvent(function ( type ,target, originalEvent ) {
    switch ( type ){
        case TouchEvent.TOUCH_START :
        case TouchEvent.TOUCH_MOVE :
        case TouchEvent.TOUCH_END :
        case TouchEvent.TOUCH_CANCEL :
            var event =new TouchEvent( type );
            var touches=originalEvent.targetTouches;
            if(touches && touches.length > 0)
            {
                event.pageX = touches[0].pageX;
                event.pageY = touches[0].pageY;
                event.offsetX = originalEvent.clientX;
                event.offsetY = originalEvent.clientY;
                event.screenX= originalEvent.screenX;
                event.screenY= originalEvent.screenY;
            }
            event.targetTouches = originalEvent.targetTouches;
            event.changedTouches = originalEvent.changedTouches;
            event.touches=originalEvent.touches;
            event.originalEvent = originalEvent;
            return event;
    }
});