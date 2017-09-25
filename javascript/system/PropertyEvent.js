/**
 * PropertyEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 * @require Event,Object
 */
function PropertyEvent( type, bubbles,cancelable ){
    if( !(this instanceof PropertyEvent) )return new PropertyEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}
System.PropertyEvent=PropertyEvent;
PropertyEvent.prototype=Object.create( Event.prototype );
PropertyEvent.prototype.property=null;
PropertyEvent.prototype.newValue=null;
PropertyEvent.prototype.oldValue=null;
PropertyEvent.prototype.constructor=PropertyEvent;
PropertyEvent.CHANGE='propertychange';
PropertyEvent.COMMIT='propertycommit';
Event.fix.map[ PropertyEvent.CHANGE ] = 'input';

var hash = 'lastValue_'+(new Date().getTime())+ '_'+ Math.random() * 10000;

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    switch ( type ){
        case PropertyEvent.CHANGE :
        case PropertyEvent.COMMIT :
            if( originalEvent instanceof  Event )return originalEvent;
            var event =new PropertyEvent( type );
            var property = typeof originalEvent.propertyName === "string" ? originalEvent.propertyName : null;
            if( property===hash)return null;
            if( !property && System.Element.isForm(target,'button') )
            {
                property = 'value';
            }
            if( property )
            {
                event.property = property;
                event.oldValue = target[hash] || undefined;
                event.newValue = target[property];
                target[hash]= event.newValue;
            }
            return event;
    }
});