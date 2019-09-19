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

module.exports = ElementEvent;
var Object = require("./Object.js");
var Event = require("./Event.js");
var System = require("./System.js");

ElementEvent.prototype=Object.create( Event.prototype,{
    "constructor":{value:ElementEvent}
});
ElementEvent.prototype.parent=null;
ElementEvent.prototype.child=null;
ElementEvent.ADD='elementAdd';
ElementEvent.ADD_TO_DOCUMENT='elementAddToDocument';
ElementEvent.REMOVE='elementRemove';
ElementEvent.CHANGE='elementChildrenChange';

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof ElementEvent )return originalEvent;
});