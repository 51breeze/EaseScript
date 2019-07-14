/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,PropertyEvent,Object
 */
function StyleEvent( type, bubbles,cancelable ){
    if( !(this instanceof StyleEvent) )return new StyleEvent(type, bubbles,cancelable);
    PropertyEvent.call(this, type, bubbles,cancelable );
    return this;
};

module.exports =StyleEvent;
var Object = require("./Object.js");
var PropertyEvent = require("./PropertyEvent.js");

StyleEvent.prototype=Object.create( PropertyEvent.prototype ,{
    "constructor":{value:StyleEvent}
});
StyleEvent.CHANGE='styleChange';