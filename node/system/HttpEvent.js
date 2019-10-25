/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,Object
 */
function HttpEvent( type, bubbles,cancelable ){
    if( !(this instanceof HttpEvent) )return new HttpEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};

module.exports = HttpEvent;
var Object = require("./Object.js");
var Event = require("./Event.js");

HttpEvent.prototype=Object.create( Event.prototype,{
    "constructor":{value:HttpEvent},
    "toString":{value:function toString(){
        return '[object HttpEvent]';
    }},
    "valueOf":{value:function valueOf(){
        return '[object HttpEvent]';
    }}
});
HttpEvent.prototype.data=null;
HttpEvent.prototype.url=null;
HttpEvent.prototype.loaded = 0;
HttpEvent.prototype.total = 0;
HttpEvent.LOAD_START = 'httpLoadStart';
HttpEvent.SUCCESS = 'httpSuccess';
HttpEvent.PROGRESS = 'httpProgress';
HttpEvent.ERROR   = 'httpError';
HttpEvent.CANCELED  = 'httpCanceled';
HttpEvent.TIMEOUT = 'httpTimeout';