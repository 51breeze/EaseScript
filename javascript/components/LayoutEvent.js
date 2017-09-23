/**
 * HttpEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @returns {HttpEvent}
 * @constructor
 * @require Event,Object
 */
function LayoutEvent(type, bubbles, cancelable)
{
    Event.call(this, type, bubbles, cancelable);
}
LayoutEvent.prototype= Object.create( Event.prototype );
LayoutEvent.prototype.constructor=LayoutEvent;
LayoutEvent.CHANGE='layoutChange';
LayoutEvent.prototype.toString=function toString(){
    return '[object LayoutEvent]';
}
LayoutEvent.prototype.valueOf=function valueOf(){
    return '[object LayoutEvent]';
}
System.LayoutEvent = LayoutEvent;