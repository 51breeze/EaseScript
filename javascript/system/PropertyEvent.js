/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,Object
 */
function PropertyEvent( type, bubbles,cancelable ){
    if( !(this instanceof PropertyEvent) )return new PropertyEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}

module.exports =PropertyEvent;
var Event = require("./Event.js");
var Object = require("./Object.js");

PropertyEvent.prototype=Object.create( Event.prototype ,{
    "constructor":{value:PropertyEvent}
});
PropertyEvent.prototype.property=null;
PropertyEvent.prototype.newValue=null;
PropertyEvent.prototype.oldValue=null;
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
            if( originalEvent instanceof Event )return originalEvent;
            var event =new PropertyEvent( type );
            var property = typeof originalEvent.propertyName === "string" ? originalEvent.propertyName : null;
            if( property===hash)return null;

            var nodename = target && typeof target.nodeName=== "string" ? target.nodeName.toLowerCase() : '';
            if( !property && nodename )
            {
                switch ( nodename )
                {
                    case 'select'   :
                    case 'input'    :
                    case 'textarea' :
                        property='value';
                    break;
                    default:
                        property='textContent';
                }
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