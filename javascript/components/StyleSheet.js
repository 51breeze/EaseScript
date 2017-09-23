/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 * @require System,Object,Document,Window
 */

var StyleSheet = {};

/**
 * @private
 */
var animationSupport=null;

/**
 * 判断是否支持css3动画
 * @returns {boolean}
 */
function isAnimationSupport()
{
    if( animationSupport === null )
    {
        var prefix = Element.fix.cssPrefixName;
        var div = Element.createElement('div');
        var prop = prefix+'animation-play-state';
        div.style[prop] = 'paused';
        animationSupport = div.style[prop] === 'paused';
    }
    return animationSupport;
};

/**
 * @private
 */
var defaultOptions= {
    'duration':'1s',
    'repeats':'1',
    'reverse':'normal',
    'delay':'0s',
    'timing':'ease',
    'state':'running',
    'mode':'forwards'
};

/**
 * 生成css3样式动画
 * properties={
*    '0%':'left:10px;',
*    '100%':'left:100px;'
* }
 */
StyleSheet.createAnimationStyleSheet=function(stylename, properties, options )
{
    if( !isAnimationSupport() )return false;
    options =Object.merge(defaultOptions,options || {});
    var  css=[];
    for( var i in properties )
    {
        if( typeof  properties[i] === "string" )
        {
            css.push( i + ' {');
            css.push( properties[i] );
            css.push( '}' );
        }
    }

    var prefix = Element.fix.cssPrefixName;
    css.unshift('@'+prefix+'keyframes ' + stylename + '{');
    css.push('}');
    css.push( '.'+stylename+'{' );

    var repeats = options.repeats < 0 ? 'infinite' : options.repeats;
    var timing=options.timing.replace(/([A-Z])/,function(all,a){
        return '-'+a.toLowerCase();
    });

    var param = {
        'name':stylename,
        'duration':options.duration,
        'iteration-count': repeats,  //infinite
        'delay':options.delay,
        'fill-mode':options.mode,  //both backwards none forwards
        'direction': options.reverse,  // alternate-reverse  reverse alternate normal
        'timing-function': timing,  //ease  ease-in  ease-out  cubic-bezier  linear
        'play-state':options.state //paused running
    };
    for( var p in  param )
    {
        css.push(prefix+'animation-'+p+':'+param[p]+';');
    }
    css.push('}');
    return css.join("\r\n");
};

/**
 * @private
 */
var headStyle =null;

/**
 * @param string style
 */
StyleSheet.addStyleSheet=function addStyleSheet(styleName, StyleSheetObject )
{
    if( headStyle=== null )
    {
        var head = document.getElementsByTagName('head')[0];
        headStyle = document.createElement('style');
        document.getElementsByTagName('head')[0].appendChild( headStyle );
    }

    if(System.isObject(StyleSheetObject) )
    {
        StyleSheetObject=System.serialize( StyleSheetObject, 'style' );
    }

    if( typeof StyleSheetObject === "string" )
    {
        if( System.env.platform( System.env.BROWSER_IE ) && System.env.version(9,'<') )
        {
            var styleName = styleName.split(',');
            StyleSheetObject = StyleSheetObject.replace(/^\{/,'').replace(/\}$/,'');
            for(var i=0; i<styleName.length; i++ )
            {
                headStyle.StyleSheet.addRule(styleName[i], StyleSheetObject, -1);
            }
        }else
        {
            if (StyleSheetObject.charAt(0) !== '{')
            {
                StyleSheetObject = '{' + StyleSheetObject + '}';
            }
            headStyle.appendChild(document.createTextNode(styleName + StyleSheetObject));
        }
        return true;
    }
    return false;
};
System.StyleSheel = StyleSheet;