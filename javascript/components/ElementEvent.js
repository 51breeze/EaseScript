/**
 * ElementEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
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
ElementEvent.CHNAGED='elementContentChanged';

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof ElementEvent )return originalEvent;
});