/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
* @require Event,TouchEvent,Object;
*/
function TouchPinchEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchPinchEvent) )return new TouchPinchEvent(type, bubbles,cancelable);
    TouchEvent.call(this, type, bubbles,cancelable );
    return this;
};

module.exports =TouchPinchEvent;
var Object = require("./Object.js");
var TouchEvent = require("./TouchEvent.js");
var Event = require("./Event.js");

TouchPinchEvent.prototype=Object.create( TouchEvent.prototype ,{
    "constructor":{value:TouchPinchEvent}
});
TouchPinchEvent.prototype.moveX=NaN;
TouchPinchEvent.prototype.moveY=NaN;
TouchPinchEvent.prototype.startX=NaN;
TouchPinchEvent.prototype.startY=NaN;
TouchPinchEvent.prototype.scale=NaN;
TouchPinchEvent.prototype.previousScale=NaN;
TouchPinchEvent.prototype.moveDistance=NaN;
TouchPinchEvent.prototype.startDistance=NaN;
TouchPinchEvent.TOUCH_PINCH_START='touchPinchStart';
TouchPinchEvent.TOUCH_PINCH_MOVE='touchPinchMove';
TouchPinchEvent.TOUCH_PINCH_END='touchPinchEnd';

Event.registerEvent(function ( type ,target, originalEvent ) {
    switch ( type ){
        case TouchPinchEvent.TOUCH_PINCH_START :
        case TouchPinchEvent.TOUCH_PINCH_MOVE :
        case TouchPinchEvent.TOUCH_PINCH_END :
            var event =new TouchDragEvent( type );
            event.originalEvent = originalEvent;
            return event;
    }
});

function getDistance(startX,endX,startY,endY)
{
    return endX === startX && endY === startY ? 0 : Math.sqrt( Math.pow( (endX - startX), 2 ) + Math.pow( (endY - startY), 2 ) );
};

var dataKey='__$touchDragData__';
function invoke(listener, dispatchHandle )
{
    var handle = function( event )
    {
        var target = event.currentTarget;
        var data = target[dataKey];
        var touches = event.targetTouches;
        var pinchEvent;
        if (touches && touches.length === 2)
        {
            var points = {
                x1: touches[0].pageX,
                y1: touches[0].pageY,
                x2: touches[1].pageX,
                y2: touches[1].pageY
            };
            points.centerX = (points.x1 + points.x2) / 2;
            points.centerY = (points.y1 + points.y2) / 2;
            switch (event.type) {
                case TouchEvent.TOUCH_START:
                    data = target[dataKey] = {
                        'startX': points.centerX,
                        'startY': points.centerY,
                        'moveDistance' : 0,
                        'scale' : 1,
                        'startDistance': getDistance(points.x1, points.x2, points.y1, points.y2)
                    };
                    pinchEvent = new TouchPinchEvent(TouchPinchEvent.TOUCH_PINCH_START);
                    break;
                case TouchEvent.TOUCH_MOVE:
                    data = target[dataKey] || {};
                    data.previousScale = data.scale || 1;
                    var moveDistance = getDistance(points.x1, points.x2, points.y1, points.y2);
                    var startDistance = data.startDistance;
                    data.scale = moveDistance / startDistance;
                    data.moveDistance = moveDistance;
                    data.moveX = points.centerX;
                    data.moveY = points.centerY;
                    if (data.scale * startDistance > 0)
                    {
                        pinchEvent = new TouchPinchEvent(TouchPinchEvent.TOUCH_PINCH_MOVE);
                    }
                break;
            }

        } else if (event.type === TouchEvent.TOUCH_END && data)
        {
            pinchEvent = new TouchPinchEvent(TouchPinchEvent.TOUCH_PINCH_END);
            delete target[dataKey];
        }
        if( pinchEvent )
        {
            Object.merge(pinchEvent, data);
            pinchEvent.originalEvent = event;
            pinchEvent.currentTarget = event.currentTarget;
            pinchEvent.target = event.target;
            dispatchHandle(pinchEvent);
        }
    }
    listener.dispatcher.addEventListener(TouchEvent.TOUCH_START,handle, false, -1000)
        .addEventListener(TouchEvent.TOUCH_MOVE,handle, false, -1000)
        .addEventListener(TouchEvent.TOUCH_END,handle, false, -1000);
};
Event.fix.hooks[ TouchPinchEvent.TOUCH_PINCH_START ] = Event.fix.hooks[ TouchPinchEvent.TOUCH_PINCH_MOVE ] = Event.fix.hooks[ TouchPinchEvent.TOUCH_PINCH_END ] = invoke;