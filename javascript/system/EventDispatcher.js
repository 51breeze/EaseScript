/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Event,Internal,Reflect,Symbol
 */

var storage=Internal.createSymbolStorage( Symbol('event') );
function EventDispatcher( target )
{
    if( !System.instanceOf(this,EventDispatcher) )
    {
        if( target && System.instanceOf(target, EventDispatcher) )return target;
        return new EventDispatcher( target );
    }
    if( target != null && !( typeof target.addEventListener === "function" ||
        typeof target.attachEvent=== "function" ||
        typeof target.onreadystatechange !== "undefined" ||
        System.instanceOf(target, EventDispatcher) ) )
    {
        target = null;
    }
    storage(this, true, {target:target||this, events:{}});
}
System.EventDispatcher=EventDispatcher;
EventDispatcher.prototype=Object.create( Object.prototype );
Object.defineProperty(EventDispatcher.prototype,"constructor", {value:EventDispatcher});

/**
 * 判断是否有指定类型的侦听器
 * @param type
 * @returns {boolean}
 */
Object.defineProperty(EventDispatcher.prototype,"hasEventListener", {value:function hasEventListener( type )
{
    var target =  storage(this,'target') || this;
    if( System.is(target,EventDispatcher) && target !== this )
    {
        return target.hasEventListener(type);
    }

    var events;
    var len = target.length >> 0;
    if( len > 0 )
    {
        while(len>0 && target[--len] )
        {
            events =  storage(target[len],'events');
            if( events && Object.prototype.hasOwnProperty.call(events,type) )
            {
                events =events[type];
                return events && events.length > 0;
            }
        }
        return false;
    }
    events =  storage(target,'events');
    if( events && Object.prototype.hasOwnProperty.call(events,type) )
    {
        return events[type].length > 0;
    }
    return false;
}});

/**
 * 添加侦听器
 * @param type
 * @param listener
 * @param priority
 * @returns {EventDispatcher}
 */
Object.defineProperty(EventDispatcher.prototype,"addEventListener", {value:function addEventListener(type,callback,useCapture,priority,reference)
{
    if( typeof type !== 'string' )throw new TypeError('Invalid event type');
    if( typeof callback !== 'function' )throw new TypeError('Invalid callback function');
    var target = storage(this,'target') || this;
    if( System.is(target,EventDispatcher) && target !== this )
    {
        target.addEventListener(type,callback,useCapture,priority,reference||this);
        return this;
    }

    var listener=new Listener(type,callback,useCapture,priority,reference,this);
    var len = target.length >> 0;
    if( len > 0 )
    {
        while(len>0 && target[--len] )
        {
            $addEventListener( target[len], listener );
        }
        return this;
    }
    $addEventListener(target, listener);
    return this;
}});

/**
 * 移除指定类型的侦听器
 * @param type
 * @param listener
 * @returns {boolean}
 */
Object.defineProperty(EventDispatcher.prototype,"removeEventListener", {value:function(type,listener)
{
    var target = storage(this,'target') || this;
    if( System.is(target,EventDispatcher) && target !== this )
    {
        return target.removeEventListener(type,listener);
    }
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0 && target[--len] )$removeEventListener( target[len], type, listener, this);
        return true;
    }
    return $removeEventListener(target,type,listener,this);
}});

/**
 * 调度指定事件
 * @param event
 * @returns {boolean}
 */
Object.defineProperty(EventDispatcher.prototype,"dispatchEvent", {value:function( event )
{
    if( !System.is(event,Event) )throw new TypeError('Invalid event');
    var target = storage(this,'target') || this;
    if( System.is(target,EventDispatcher) && target !== this )
    {
        return target.dispatchEvent(event);
    }

    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0 && target[--len] )
        {
            event.target = event.currentTarget = target[len];
            $dispatchEvent(event);
        }
        return !event.immediatePropagationStopped;
    }
    event.target = event.currentTarget=target;
    return $dispatchEvent( event );
}});

/**
 * 添加侦听器到元素中
 * @param listener
 * @param handle
 * @returns {boolean}
 */
function $addEventListener(target, listener )
{
    if( target==null )throw new ReferenceError('this is null or not define');

    //获取事件数据集
    var type = listener.type;
    var data = storage(target);
    var events = data.events || (data.events={});

    //获取指定事件类型的引用
    events = events[ type ] || ( events[ type ]=[] );

    //如果不是 EventDispatcher 则在第一个事件中添加事件代理。
    if( events.length===0 )
    {
        //自定义事件处理
        if( Object.prototype.hasOwnProperty.call(Event.fix.hooks,type) )
        {
            Event.fix.hooks[ type ].call(target, listener, $dispatchEvent);

        }else {
            type = Event.type(type);
            try {
                target.addEventListener ? target.addEventListener(type, $dispatchEvent, listener.useCapture) : target.attachEvent(type, function (e) {
                    $dispatchEvent(e, target)
                });
            }catch (e) {}
        }
    }

    //添加到元素
    events.push( listener );

    //按权重排序，值大的在前面
    if( events.length > 1 ) events.sort(function(a,b)
    {
        return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
    });
    return true;
}
/**
 * 添加侦听器到元素中
 * @param string type 事件类型, 如果是一个'*'则表示删除所有的事件
 * @param function listener 可选，如果指定则只删除此侦听器
 * @param EventDispatcher eventDispatcher 可选，如果指定则只删除本对象中的元素事件
 * @returns {boolean}
 */
function $removeEventListener(target, type, listener , dispatcher )
{
    if( target==null )throw new ReferenceError('this is null or not define');

    //获取事件数据集
    var events =storage(target,'events');
    if( !events || !Object.prototype.hasOwnProperty.call(events,type) )
    {
        return false;
    }
    events = events[type];
    var length= events.length;
    var ret = length;
    var is = typeof listener === "function";
    while (length > 0)
    {
        --length;
        //如果有指定侦听器则删除指定的侦听器
        if ( (!is || events[length].callback === listener) && events[length].dispatcher === dispatcher )
        {
            events.splice(length, 1);
        }
    }

    //如果是元素并且没有侦听器就删除
    if( events.length < 1 && !System.is(target,EventDispatcher)  )
    {
        var eventType= Event.type( type );
        if( target.removeEventListener )
        {
            target.removeEventListener(eventType,$dispatchEvent,false);
            target.removeEventListener(eventType,$dispatchEvent,true);

        }else if( target.detachEvent )
        {
            target.detachEvent(eventType,$dispatchEvent);
        }
    }
    return events.length !== ret;
}
/**
 * 调度指定侦听项
 * @param event
 * @param listeners
 * @returns {boolean}
 */
function $dispatchEvent(e, currentTarget )
{
    if( !System.is(e,Event) )
    {
        e = Event.create( e );
        if(currentTarget)e.currentTarget = currentTarget;
    }
    if( !e || !e.currentTarget )throw new Error('invalid event target');
    var target = e.currentTarget;
    var events = storage(target,'events');
    if( !events || !Object.prototype.hasOwnProperty.call(events, e.type) )return true;
    events = events[e.type];
    var length= 0,listener,thisArg;
    while( length < events.length )
    {
        listener = events[ length++ ];
        thisArg = listener.reference || listener.dispatcher;
        //调度侦听项
        listener.callback.call( thisArg , e );
        if( e.immediatePropagationStopped===true )
           return false;
    }
    return true;
}
/**
 * 事件侦听器
 * @param type
 * @param callback
 * @param priority
 * @param capture
 * @param currentTarget
 * @param target
 * @constructor
 */
function Listener(type,callback,useCapture,priority,reference,dispatcher)
{
    this.type=type;
    this.callback=callback;
    this.useCapture=!!useCapture;
    this.priority=priority>>0;
    this.reference=reference || null;
    this.dispatcher=dispatcher;
}
Object.defineProperty(Listener.prototype,"constructor",{value:Listener});
Listener.prototype.useCapture=false;
Listener.prototype.dispatcher=null;
Listener.prototype.reference=null;
Listener.prototype.priority=0;
Listener.prototype.callback=null;
Listener.prototype.currentTarget=null;
Listener.prototype.type=null;
