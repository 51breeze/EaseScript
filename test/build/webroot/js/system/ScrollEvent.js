/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,PropertyEvent,Object
 */
function ScrollEvent( type, bubbles,cancelable ){
    if( !(this instanceof ScrollEvent) )return new ScrollEvent(type, bubbles,cancelable);
    PropertyEvent.call(this, type, bubbles,cancelable );
    return this;
};

module.exports =ScrollEvent;
var Object =require("system/Object.es");
var PropertyEvent =require("system/PropertyEvent.es");
var Event =require("system/Event.es");

ScrollEvent.prototype=Object.create( PropertyEvent.prototype ,{
    "constructor":{value:ScrollEvent}
});
ScrollEvent.CHANGE='scrollChange';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof ScrollEvent )return originalEvent;
    if( type === ScrollEvent.CHANGE )return new ScrollEvent( ScrollEvent.CHANGE );
});