/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,StyleSheet,Timeline,Tween,TimelineEvent,Element
 */

function Animation() {}

/**
 *@private
 */
var createTimeline=function( options )
{
    options.duration = Math.max(options.duration>>0,1);
    options.timing =  options.timing || Tween.Linear;
    options.state = !options.state;
    var tl =Timeline();
    for( var prop in options ) if( tl[prop] && typeof tl[prop] === "function" )
    {
        tl[prop]( options[prop] );
    }
    if( options.callback && typeof options.callback === "function" )
    {
        tl.addEventListener( TimelineEvent.FINISH , options.callback );
    }
    return tl;
};

var bsPrefix = Element.fix.cssPrefixName.replace(/-/g,'');

/**
 *@private
 */
function fade(name, duration, options)
{
    options = options || {};
    options.duration = Math.max(duration>>0,1);
    var elem = Element(this);
    if( StyleSheet.isAnimationSupport() && options.engine !=='timeline'  )
    {
        options.duration = Math.max(duration>>0,1)+'s';
        var properties = null;
        switch (name)
        {
            case 'fadeIn'  :
                properties = {'0%': 'opacity:0;', '100%': 'opacity:1;'};
                break;
            case 'fadeOut' :
                properties = {'0%': 'opacity:1;', '100%': 'opacity:0;'};
                break;
        }
        var styleSheet = StyleSheet.createAnimationStyleSheet(name, properties, options);
        StyleSheet.addStyleSheet(name, styleSheet );
        if( options.callback && typeof options.callback === "function" )
        {
            var end = System.lcfirst( bsPrefix+'AnimationEnd' );
            var iteration = System.lcfirst( bsPrefix+'AnimationIteration' );
            var handle=function(event){
                options.callback.call(this, event.type === end );
                this.removeEventListener(end);
                this.removeEventListener(iteration);
            }
            elem.addEventListener(iteration,handle).addEventListener(end,handle);
        }
        elem.removeClass(name);
        elem.addClass(name);

    }else
    {
        var tl = createTimeline( options );
        tl.addKeyFrame(KeyFrame(options.duration * 60).motions(function(t,d,f){
            var value = name === 'fadeOut' ? f(t,1,-1,d) : f(t,0,1,d);
            elem.style('opacity',value);
        }));
        if( options.state )tl.play();
        return tl;
    }
}

/**
 * 调整元素到指定的大小
 * @param NodeElement elem 节点元素
 * @param number duration 持续的时间,秒为单位
 * @param object options 动画选项参数
 */
Animation.fadeIn=function(elem, duration, options )
{
   return fade.call(elem,'fadeIn',duration, options);
};

/**
 * 调整元素到指定的大小
 * @param NodeElement elem 节点元素
 * @param number duration 持续的时间,秒为单位
 * @param object options 动画选项参数
 */
Animation.fadeOut=function(elem, duration, options )
{
    return fade.call(elem,'fadeOut',duration, options);
};

/**
 * 调整元素到指定的大小
 * @param NodeElement element 节点元素
 * @param number duration 持续的时间,秒为单位
 * @param object options 动画选项参数
 */
Animation.resizeTo=function(elem, duration, options )
{
    options = options || {};
    options.duration = duration;
    elem = Element(elem);
    var tl =createTimeline(options);
    var width = elem.width();
    var height = elem.height();
    var motion = new Motions( elem );
    if( typeof options.width === "number")motion.set('width', width, options.width );
    if( typeof options.height === "number")motion.set('height', height, options.height );

    if( options.point > 1  )
    {
        var position = elem.style('position');
        var propX = 'left';
        var propY = 'top';
        if (position === 'static' || position === '')
        {
            propX = 'marginLeft';
            propY = 'marginTop';
        }

        var fromX = elem.style(propX) >> 0;
        var fromY = elem.style(propY) >> 0;
        var toX = 0;
        var toY = 0;

        switch( options.point>>0 )
        {
            case 2 : toX = 1; break;
            case 3 : toY = 1; break;
            case 4 : toY = 1; toX = 1; break;
            case 5 : toY = 0.5;toX = 0.5;break;
        }
        if( toX > 0 )motion.set(propX, fromX, fromX-(options.width - width) * toX );
        if( toY > 0 )motion.set(propY, fromY, fromY-(options.height - height) * toY );
    }
    tl.addKeyFrame( KeyFrame(options.duration * 60).motions(motion) );
    if( options.state )tl.play();
    return tl;
};


/**
 * 移动元素到指定的位置
 * @param NodeElement element 节点元素
 * @param number duration 持续的时间,秒为单位
 * @param object options 动画选项参数
 */
Animation.moveTo=function(elem, duration, options )
{
    options = options || {};
    options.duration = duration;
    elem = Element(elem);
    var tl =createTimeline(options);
    var position = elem.getBoundingRect();
    var motion = new Motions( elem );
    if( typeof options.x === "number" )motion.set('left', position.left, options.x );
    if( typeof options.y === "number" )motion.set('top', position.top, options.y );
    tl.addKeyFrame( KeyFrame(options.duration * 60).motions(motion) );
    if( options.state )tl.play();
    return tl;
};

/**
 * 抖动元素
 * @param NodeElement element 节点元素
 * @param number duration 持续的时间,秒为单位
 * @param object options 动画选项参数
 */
Animation.shake=function(elem, duration, options )
{
    options = options || {};
    options.duration = duration || 0.2;
    options.fps = options.fps || 30;
    elem = Element(elem);
    var tl =createTimeline(options);
    var position = elem.getBoundingRect();
    var size = options.size || 4;
    var keyframe = KeyFrame( options.duration * 60 );
    keyframe.action=function(){

        var i = tl.next();
        if( i >= tl.length()-1 )
        {
            elem.style('left', position.left);
            elem.style('top', position.top);
        }else {
            var prop = i % 2 == 0 ? 'left' : 'top';
            var val = position[prop];
            elem.style(prop,i % 4 < 2 ?val: val + size);
        }
    };

    tl.addKeyFrame( keyframe  );
    if( options.state )tl.play();
    return tl;
};
System.Animation=Animation;

