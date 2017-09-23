/**
 * PropertyEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 * @require Event,Object
 */
function PaginationEvent( type, bubbles,cancelable )
{
    if( !(this instanceof PaginationEvent) )return new PaginationEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
System.PaginationEvent=PaginationEvent;
PaginationEvent.prototype=Object.create( Event.prototype );
PaginationEvent.prototype.newValue=null;
PaginationEvent.prototype.oldValue=null;
PaginationEvent.prototype.constructor=PaginationEvent;
PaginationEvent.CHANGE='paginationChange';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    switch ( type ){
        case PaginationEvent.CHANGE :
            var event =new PaginationEvent( type );
            return event;
    }
});