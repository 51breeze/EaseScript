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