/*
* BreezeJS TouchEvent class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Event,TouchEvent,Math,EventDispather,Object;
*/
function TouchDragEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchDragEvent) )return new TouchDragEvent(type, bubbles,cancelable);
    TouchEvent.call(this, type, bubbles,cancelable );
    return this;
};
System.TouchDragEvent=TouchDragEvent;
TouchDragEvent.prototype.constructor=TouchDragEvent;
TouchDragEvent.prototype=Object.create( TouchEvent.prototype );
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

var dragDataKey='__touchDragData__';
function invoke(listener, dispatchHandle )
{
    var handle = function( event )
    {
        var x=0,y= 0,
        target = event.currentTarget,
        data=target[dragDataKey],
        touches=event.targetTouches
        if( touches.length > 0 )
        {
            x=touches[0].pageX;
            y=touches[0].pageY;
        }
        var dragEvent;
        if( touches.length === 1 )
        {
            switch( event.type )
            {
                case TouchEvent.TOUCH_START :
                    var dragEvent= new TouchDragEvent( TouchDragEvent.TOUCH_DRAG_START );
                    dragEvent.originalEvent = event;
                    data=target[dragDataKey]={};
                    data.startX=x;
                    data.startY=y;
                    data.lastMoveX=x;
                    data.lastMoveY=y;
                    data.startDate=event.timeStamp;
                    data.held=false;
                    Object.merge(dragEvent,data);
                    dispatchHandle( dragEvent );
                break;
                case TouchEvent.TOUCH_MOVE :
                    data = target[dragDataKey] || {};
                    data.lastMoveX= data.moveX!==undefined ? data.moveX : data.startX;
                    data.lastMoveY= data.moveY!==undefined ? data.moveY : data.startY;
                    data.lastMoveDate=data.moveDate !==undefined ? data.moveDate : data.startDate;
                    data.moveDate=event.timeStamp;
                    data.moveX=x;
                    data.moveY=y;
                    data.held=( data.held || (data.moveDate - data.lastMoveDate) > 100 );
                    var distance = getDistance( data.lastMoveX,data.moveX,data.lastMoveY,data.moveY ),
                        ms = data.moveDate - data.lastMoveDate;
                    data.velocity = ms === 0 ? 0 : distance / ms;
                    if( data.held )
                    {
                        dragEvent = new TouchDragEvent( TouchEvent.TOUCH_MOVE );
                        dragEvent.originalEvent = event;
                        Object.merge(dragEvent,data);
                        dispatchHandle( dragEvent );
                    }
                break;
            }

        }else if( event.type===TouchEvent.TOUCH_END && data )
        {
            dragEvent= new TouchDragEvent( TouchEvent.TOUCH_END );
            dragEvent.originalEvent = event;
            delete target[dragDataKey];
            Object.merge(dragEvent,data);
            dispatchHandle( dragEvent );
        }
    }
    EventDispatcher( this ).addEventListener(TouchEvent.TOUCH_START,handle, false, -1000, listener.dispatcher)
    .addEventListener(TouchEvent.TOUCH_MOVE,handle, false, -1000)
    .addEventListener(TouchEvent.TOUCH_END,handle, false, -1000);
}
Event.fix.hooks[ TouchDragEvent.TOUCH_DRAG_START ] = Event.fix.hooks[ TouchDragEvent.TOUCH_DRAG_MOVE ] = Event.fix.hooks[ TouchDragEvent.TOUCH_DRAG_END ] = invoke;
