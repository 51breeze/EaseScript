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
System.HttpEvent=HttpEvent;
HttpEvent.prototype=Object.create( Event.prototype );
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
HttpEvent.prototype.toString=function toString(){
    return '[object HttpEvent]';
};
HttpEvent.prototype.valueOf=function valueOf(){
    return '[object HttpEvent]';
};

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof HttpEvent )return originalEvent;
});