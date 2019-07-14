/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
* @require Event,TouchEvent,EventDispatcher,Object;
*/
function TouchDragEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchDragEvent) )return new TouchDragEvent(type, bubbles,cancelable);
    TouchEvent.call(this, type, bubbles,cancelable );
    return this;
};

module.exports =TouchDragEvent;
var Object = require("./Object.js");
var TouchEvent = require("./TouchEvent.js");
var Event = require("./Event.js");

TouchDragEvent.prototype=Object.create( TouchEvent.prototype ,{
    "constructor":{value:TouchDragEvent}
});
TouchDragEvent.prototype.startX=NaN;
TouchDragEvent.prototype.startY=NaN;
TouchDragEvent.prototype.moveX=NaN;
TouchDragEvent.prototype.moveY=NaN;
TouchDragEvent.prototype.lastMoveX=NaN;
TouchDragEvent.prototype.lastMoveY=NaN;
TouchDragEvent.prototype.startDate=NaN;
TouchDragEvent.prototype.moveDate=NaN;
TouchDragEvent.prototype.velocity=NaN;
TouchDragEvent.prototype.held=false;
TouchDragEvent.TOUCH_DRAG_START='touchDragStart';
TouchDragEvent.TOUCH_DRAG_MOVE='touchDragMove';
TouchDragEvent.TOUCH_DRAG_END='touchDragEnd';

//触摸拖动事件
Event.registerEvent(function ( type ,target, originalEvent ) {
    switch ( type ){
        case TouchDragEvent.TOUCH_DRAG_START :
        case TouchDragEvent.TOUCH_DRAG_MOVE :
        case TouchDragEvent.TOUCH_DRAG_END :
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
    var currentTarget = this;
    var handle = function( event )
    {
        event = Event.create( event );
        var x=0;
        var y= 0;
        var target = currentTarget; // event.currentTarget;
        var data=target[dataKey];
        var touches=event.targetTouches;
        var dragEvent;

        if( touches && touches.length > 0 )
        {
            x=touches[0].pageX;
            y=touches[0].pageY;
        }
        if( touches && touches.length === 1 )
        {
            switch( event.type )
            {
                case TouchEvent.TOUCH_START :
                    dragEvent= new TouchDragEvent( TouchDragEvent.TOUCH_DRAG_START );
                    data=target[dataKey]={};
                    data.startX=x;
                    data.startY=y;
                    data.lastMoveX=x;
                    data.lastMoveY=y;
                    data.startDate=event.timeStamp;
                    data.held=false;
                break;
                case TouchEvent.TOUCH_MOVE :
                    data = target[dataKey] || {};
                    data.lastMoveX= data.moveX!==undefined ? data.moveX : data.startX;
                    data.lastMoveY= data.moveY!==undefined ? data.moveY : data.startY;
                    data.lastMoveDate=data.moveDate !==undefined ? data.moveDate : data.startDate;
                    data.moveDate=event.timeStamp;
                    data.moveX=x;
                    data.moveY=y;
                    data.held=( data.held || (data.moveDate - data.lastMoveDate) > 100 );
                    var distance = getDistance( data.lastMoveX,data.moveX,data.lastMoveY,data.moveY );
                    var ms = data.moveDate - data.lastMoveDate;
                    data.velocity = ms === 0 ? 0 : distance / ms;
                    if( data.held )
                    {
                        dragEvent = new TouchDragEvent( TouchDragEvent.TOUCH_DRAG_MOVE );
                    }
                break;
            }

        }else if( event.type===TouchEvent.TOUCH_END && data )
        {
            dragEvent= new TouchDragEvent( TouchDragEvent.TOUCH_DRAG_END );
            delete target[dataKey];
        }

        if( dragEvent )
        {
            Object.merge(dragEvent, data);
            dragEvent.originalEvent = event;
            dragEvent.currentTarget = event.currentTarget;
            dragEvent.target = event.target;
            dispatchHandle(dragEvent);
        }
    }

   /* listener.dispatcher.addEventListener(TouchEvent.TOUCH_START,handle, false, -1000)
    .addEventListener(TouchEvent.TOUCH_MOVE,handle, false, -1000)
    .addEventListener(TouchEvent.TOUCH_END,handle, false, -1000);*/

    listener.proxyHandle = handle;
    listener.proxyTarget = this;
    listener.proxyType = [
        Event.fix.prefix+TouchEvent.TOUCH_START,
        Event.fix.prefix+TouchEvent.TOUCH_MOVE,
        Event.fix.prefix+TouchEvent.TOUCH_END
    ];
    for(var i=0;i<3;i++){
        addListener(this, listener.proxyType[i] , handle);
    }
}

function addListener(target, type, handle)
{
    target.addEventListener ? target.addEventListener(type,  handle) : target.attachEvent(type, handle);
}

Event.fix.hooks[ TouchDragEvent.TOUCH_DRAG_START ] = Event.fix.hooks[ TouchDragEvent.TOUCH_DRAG_MOVE ] = Event.fix.hooks[ TouchDragEvent.TOUCH_DRAG_END ] = invoke;