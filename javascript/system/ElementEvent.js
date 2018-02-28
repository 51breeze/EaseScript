/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event,Object
 */
function ElementEvent( type, bubbles,cancelable )
{
    if( !System.instanceOf(this,ElementEvent) )return new ElementEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
System.ElementEvent = ElementEvent;
ElementEvent.prototype=Object.create( Event.prototype );
ElementEvent.prototype.parent=null;
ElementEvent.prototype.child=null;
ElementEvent.prototype.constructor=ElementEvent;
ElementEvent.ADD='elementAdd';
ElementEvent.REMOVE='elementRemove';
ElementEvent.CHANGE='elementChildrenChange';

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof ElementEvent )return originalEvent;
});