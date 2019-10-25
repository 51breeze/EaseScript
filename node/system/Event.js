/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object
 */
function Event( type, bubbles, cancelable )
{
    if( type && typeof type !=="string" )throw new TypeError('event type is not string');
    this.type = type;
    this.bubbles = !(bubbles===false);
    this.cancelable = !(cancelable===false);
}

module.exports = Event;
var Object = require("./Object.js");
var TypeError = require("./TypeError.js");

/**
 * 一组事件名的常量
 * @type {string}
 */
Event.SUBMIT='submit';
Event.RESIZE='resize';
Event.SELECT='fetch';
Event.UNLOAD='unload';
Event.LOAD='load';
Event.LOAD_START='loadstart';
Event.PROGRESS='progress';
Event.RESET='reset';
Event.FOCUS='focus';
Event.BLUR='blur';
Event.ERROR='error';
Event.COPY='copy';
Event.BEFORECOPY='beforecopy';
Event.CUT='cut';
Event.BEFORECUT='beforecut';
Event.PASTE='paste';
Event.BEFOREPASTE='beforepaste';
Event.SELECTSTART='selectstart';
Event.READY='ready';
Event.SCROLL='scroll';
Event.INITIALIZE_COMPLETED = "initializeCompleted";
Event.ANIMATION_START="animationstart";
Event.ANIMATION_END="animationend";
Event.ANIMATION_ITERATION="animationiteration";
Event.TRANSITION_END="transitionend";

/**
 * 事件原型
 * @type {Object}
 */
Event.prototype = Object.create( Object.prototype,{
    "constructor":{value:Event},
    "toString":function toString(){
        return '[object Event]';
    },
    "valueOf":function valueOf(){
        return '[object Event]';
    }
});

Event.prototype.bubbles = true;
Event.prototype.cancelable = true;
Event.prototype.currentTarget = null;
Event.prototype.target = null;
Event.prototype.defaultPrevented = false;
Event.prototype.type = null;
Event.prototype.propagationStopped = false;
Event.prototype.immediatePropagationStopped = false;


/**
 * 阻止事件的默认行为
 */
Event.prototype.preventDefault = function preventDefault()
{
    if( this.cancelable===true )
    {
        this.defaultPrevented = true;
        if ( this.originalEvent )
        {
            if( this.originalEvent.preventDefault ){
                this.originalEvent.preventDefault();
            }else{
                this.originalEvent.returnValue = false;
            }
        }
    }
};

/**
 * 阻止向上冒泡事件
 */
Event.prototype.stopPropagation = function stopPropagation()
{
    this.propagationStopped = true;
};

/**
 *  阻止向上冒泡事件，并停止执行当前事件类型的所有侦听器
 */
Event.prototype.stopImmediatePropagation = function stopImmediatePropagation()
{
    this.stopPropagation();
    this.immediatePropagationStopped = true;
};