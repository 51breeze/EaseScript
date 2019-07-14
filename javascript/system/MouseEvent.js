/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event,Object;
 */
function MouseEvent( type, bubbles,cancelable  )
{
    if( !(this instanceof MouseEvent) )return new MouseEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
}

module.exports = MouseEvent;
var Object = require("./Object.js");
var Event = require("./Event.js");
var System = require("./System.js");

MouseEvent.prototype=Object.create( Event.prototype,{
    "constructor":{value:MouseEvent}
});
MouseEvent.prototype.wheelDelta= null;
MouseEvent.prototype.pageX= NaN;
MouseEvent.prototype.pageY= NaN;
MouseEvent.prototype.offsetX=NaN;
MouseEvent.prototype.offsetY=NaN;
MouseEvent.prototype.screenX= NaN;
MouseEvent.prototype.screenY= NaN;
MouseEvent.MOUSE_DOWN='mousedown';
MouseEvent.MOUSE_UP='mouseup';
MouseEvent.MOUSE_OVER='mouseover';
MouseEvent.MOUSE_OUT='mouseout';
MouseEvent.MOUSE_OUTSIDE='mouseoutside';
MouseEvent.MOUSE_MOVE='mousemove';
MouseEvent.MOUSE_WHEEL='mousewheel';
MouseEvent.CLICK='click';
MouseEvent.DBLCLICK='dblclick';

var lastOriginalEvent;

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent ) {

    lastOriginalEvent = originalEvent;
    if( type && /^mouse|click$/i.test(type) )
    {
        var event =new MouseEvent( type );
        event.pageX= originalEvent.x || originalEvent.clientX || originalEvent.pageX;
        event.pageY= originalEvent.y || originalEvent.clientY || originalEvent.pageY;
        event.offsetX = originalEvent.offsetX;
        event.offsetY = originalEvent.offsetY;
        event.screenX= originalEvent.screenX;
        event.screenY= originalEvent.screenY;
        if( typeof event.offsetX !=='number' && target )
        {
            event.offsetX=originalEvent.pageX-target.offsetLeft;
            event.offsetY=originalEvent.pageY-target.offsetTop;
        }
        if( type === MouseEvent.MOUSE_WHEEL )
        {
            event.wheelDelta=originalEvent.wheelDelta || ( originalEvent.detail > 0 ? -originalEvent.detail : Math.abs( originalEvent.detail ) );
        }
        return event;
    }
});

if( System.env.platform( System.env.BROWSER_FIREFOX ) )
{
    Event.fix.map[ MouseEvent.MOUSE_WHEEL ] = 'DOMMouseScroll';
}

Event.fix.hooks[ MouseEvent.MOUSE_OUTSIDE ]=function(listener, dispatcher)
{
    var doc = window;
    var target = this;
    var elem = new System.Element( this );
    var type = Event.fix.prefix+MouseEvent.CLICK;
    listener.proxyTarget = doc;
    listener.proxyType = [type];
    listener.proxyHandle = function(event)
    {
        var e = Event.create(event);
        var range = elem.getBoundingRect();
        if (!(e.pageX >= range.left && e.pageX <= range.right && e.pageY >= range.top && e.pageY <= range.bottom))
        {
            e.type = MouseEvent.MOUSE_OUTSIDE;
            e.currentTarget = target;
            listener.dispatcher.dispatchEvent( e );
        }
    }
    //防止当前鼠标点击事件向上冒泡后触发。
    setTimeout(function () {
        doc.addEventListener ? doc.addEventListener(type, listener.proxyHandle ) : doc.attachEvent(type, listener.proxyHandle );
    },10);
}