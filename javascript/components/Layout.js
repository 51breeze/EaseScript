/*
 * BreezeJS Layout components.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

/**
 * 约束布局组件。
 * 通过此组件可以轻松控制元素的大小及需要对齐的位置。
 * @example
 * <div>
 *   <layout left="10" right="10" top="50" bottom="10" horizontal="left" vertical="top" />
 * </div>
 *
 * Layout
 * @param target
 * @constructor
 * @require EventDispatcher, Element, TypeError, Internal, ElementEvent, Event,LayoutEvent,SkinEvent,Skin
 */
var storage=Internal.createSymbolStorage( Symbol('layout') );
var has = $Object.prototype.hasOwnProperty;
var rootLayout={};
storage( rootLayout, true, {"childrenItem":[],'owner':null} );

function method(prop, val , flag )
{
    var old = parseInt( Element.prototype.property.call(this, prop ) );
    if( typeof val !== "undefined" )
    {
        val =  parseInt( val );
        if ( flag )Element.prototype.style.call(this, flag !== true ? flag : prop, val );
        if ( val !== old )
        {
            Element.prototype.property.call(this, prop , val);
        }
        return this;
    }
    return old;
};

function childAddParent( child, parent )
{
    removeLayout( child );
    var parentNodes = storage(parent,"childrenItem" );
    parentNodes.push( child );
    storage(child,"owner", parent);
}

function getLayoutByTarget( target , children )
{
    for(var i=0; i<children.length; i++)
    {
        if( storage(children[i],"target") === target )
        {
            return children[i];
        }else
        {
            return getLayoutByTarget( target , storage( children[i], "childrenItem") );
        }
    }
    return null;
}

function removeLayout( layout )
{
    var owner = storage(layout,"owner");
    var ownerNodes = storage(owner,"childrenItem" );
    var index = ownerNodes.indexOf( layout );
    return ownerNodes.splice(index, 1);
}

function makeChildren( children )
{
    var i = 0;
    var b=0;
    var len = children.length;
    var layout1,layout2,child1,child2;
    while ( i < len)
    {
        b = i+1;
        layout1 = children[i];
        while ( b<len )
        {
            layout2 = children[b];
            child1 = storage( layout1, "target");
            child2 = storage( layout2, "target");

            if( child1[0] === child2[0] )
            {
                removeLayout(layout1);
                len--;
                i--;

            }else if( Element.contains( child1[0], child2[0] ) )
            {
                childAddParent( layout1, layout2);
                len--;
                i--;

            }else if( Element.contains( child2[0], child1[0] ) )
            {
                childAddParent( layout2, layout1);
                len--;
                i--;

            }else
            {
                b++;
            }
        }
        makeChildren( storage(layout1,"childrenItem") );
       i++;
    }
}




/**
 * 布局管理
 * @param layoutObject
 */
function layoutManage()
{
    var target = storage(this, "target");
    EventDispatcher.prototype.removeEventListener.call(target, ElementEvent.ADD, layoutManage);
    makeChildren( storage(rootLayout,"childrenItem") );
    if( System.instanceOf(target,Skin) )
    {
        Element(target).children().addEventListener(ElementEvent.CHNAGED, function(e){
            Layout.prototype.updateDisplayList.call(this)
        },false,0,this);

        Element(window).addEventListener(Event.RESIZE, function(e){
            Layout.prototype.updateDisplayList.call(this)
        },false,0,this);
    }
    Layout.prototype.updateDisplayList.call(this);
}

Internal["Layout.prototype.target"]=function target( value )
{
    var old = storage(this,"target");
    if( value != null && old !== value )
    {
        if( !System.instanceOf(value, Element) || !Element.isHTMLElement(value[0]) )
        {
            throw new TypeError('Invalid viewport. is not element types or is null');
        }
        var childrenItem = storage(rootLayout, "childrenItem");
        if( old )
        {
             removeLayout( getLayoutByTarget( old , childrenItem ) );
             EventDispatcher.prototype.removeEventListener.call(old, ElementEvent.ADD, layoutManage);
             storage( old[0], "layoutInstance", null );
        }
        var root = value[0].ownerDocument.body;
        if( !Element.contains(root,value) || value[0]===root )
        {
            storage(this, "target", value);
            childrenItem.push( this );
            storage(this, "owner", rootLayout );
            storage( value[0], "layoutInstance", this);
            if( value[0].parentNode )
            {
                layoutManage.call(this);
            }else
            {
                EventDispatcher.prototype.addEventListener.call(value, ElementEvent.ADD, layoutManage,false,0,this);
            }
        }
        return this;
    }
    return old;
};


function Layout( target )
{
    //初始化组件
    EventDispatcher.call(this);
    storage(this,true,{
        "target":null,
        "owner":null,
        "scrollWidth":0,
        "scrollHeight":0,
        "overflowHeight":0,
        "overflowWidth":0,
        "layoutInvalidate":false,
        "childrenItem":[]
    });
    Internal["Layout.prototype.target"].call( this, target );
}
Layout.prototype= Object.create( EventDispatcher.prototype );

/**
 * @returns {string}
 */
Layout.prototype.toString=function toString()
{
    return '[object Layout]';
};

Layout.prototype.valueOf=function valueOf()
{
    return '[object Layout]';
};

/**
 * 根据当前的布局特性计算所需要的宽度
 * @returns {Number}
 */
function calculateWidth( parentWidth , flag )
{
    var width= method.call(this ,'explicitWidth');
    if( isNaN( width ) )
    {
        var percent = method.call(this,'percentWidth');
        width = !isNaN(percent) ? percent / 100 * parentWidth : Element.prototype.width.call(this);
    }
    if( flag !==true )
    {
        var left = method.call(this, 'left') || 0;
        var right = method.call(this, 'right') || 0;
        var paddingLeft = parseInt(Element.prototype.style.call(this, 'paddingLeft')) || 0;
        var paddingRight = parseInt(Element.prototype.style.call(this, 'paddingRight')) || 0;
        width -= left + right + paddingRight + paddingLeft;
    }
    return getMaxOrMinWidth.call(this, width );
};

/**
 * 根据当前的布局特性计算所需要的高度
 * @returns {Number}
 */
function calculateHeight( parentHeight, flag )
{
    var height= method.call(this,'explicitHeight');
    if( isNaN( height ) )
    {
        var percent = method.call(this,'percentHeight');
        height = !isNaN(percent) ? percent / 100 * parentHeight : Element.prototype.height.call( this );
    }
    if( flag !==true )
    {
        var bottom = method.call(this, 'bottom') || 0;
        var top = method.call(this, 'top') || 0;
        var paddingTop = parseInt(Element.prototype.style.call(this, 'paddingTop')) || 0;
        var paddingBottom = parseInt(Element.prototype.style.call(this, 'paddingBottom')) || 0;
        height -= bottom + top + paddingTop + paddingBottom;
    }
    return getMaxOrMinHeight.call(this, height );
};

/**
 * 获取布局已设置的最大或者最小宽度
 * @param width
 * @returns {Number}
 */
function getMaxOrMinWidth( width )
{
    var min=Math.max( method.call(this,'minWidth') || width , width );
    return Math.min( min,  Math.min( method.call(this,'maxWidth') || min , min ) );
};

/**
 * 获取布局已设置的最大或者最小高度
 * @param width
 * @returns {Number}
 */
function getMaxOrMinHeight( height )
{
    var min=Math.max( method.call(this,'minHeight') || height , height );
    return Math.min( min,  Math.min( method.call(this,'maxHeight') || min , min ) );
};

/**
 * @param width
 * @param height
 * @returns {Component}
 */
function setLayoutSize(width,height)
{
    var target =  storage(this, 'target');
    var oldh = method.call( target ,'height');
    var oldw = method.call(target,'width');
    if( oldh !== height || oldw !== width )
    {
        Element.prototype.width.call(target, width );
        Element.prototype.height.call(target, height );
        EventDispatcher.prototype.dispatchEvent.call(target, new LayoutEvent(LayoutEvent.CHANGE) )
    }
    return this;
};

var horizontalMap=['left','center','right'];
var verticalMap=['top','middle','bottom'];

/**
 * @param parentWidth
 * @param parentHeight
 */
Layout.prototype.measureChildren=function measureChildren(parentWidth,parentHeight)
{
    var viewport = new Element( storage(this,'target') );
    var paddingLeft  = parseInt( viewport.style('paddingLeft') )  || 0;
    var paddingRight = parseInt( viewport.style('paddingRight') ) || 0;
    var paddingTop   = parseInt( viewport.style('paddingTop') )   || 0;
    var paddingBottom= parseInt( viewport.style('paddingBottom') )|| 0;
    var yScroll = viewport.style("overflowY");
    var xScroll = viewport.style('overflowX');
    var realWidth = storage(this,'realWidth') || 0;
    var realHeight = storage(this,'realHeight' ) || 0;

    if( viewport.style('position')==='static' )
    {
        viewport.style('position','relative');
    }
    var gap=Layout.prototype.gap.call(this),
        x=gap+paddingLeft,
        y=gap+paddingTop,
        maxHeight=0,
        countHeight= 0,
        countWidth=0,
        hAlign=Layout.prototype.horizontalAlign.call(this)
        ,vAlign=Layout.prototype.verticalAlign.call(this)
        ,h=hAlign===horizontalMap[1] ? 0.5 : hAlign===horizontalMap[2] ? 1 : 0
        ,v=vAlign  ===verticalMap[1]   ? 0.5 : vAlign  ===verticalMap[2]   ? 1 : 0;


    var children = [];
    var target = Element( viewport[0] ).children(':not([includeLayout=false])');
    target.forEach(function(elem,index){

        this.style('position','absolute');
        var childWidth =  calculateWidth.call(this, parentWidth, true )
        var childHeight=  calculateHeight.call(this, parentHeight, true );
        var marginLeft =  parseInt( this.style('marginLeft') ) || 0;
        var marginRight =  parseInt( this.style('marginRight') ) || 0;
        var marginTop   =  parseInt( this.style('marginTop') ) || 0;
        var marginBottom = parseInt( this.style('marginBottom') ) || 0;

        var top = parseInt( this.property('top') ) || 0;
        var right = parseInt( this.property('right') ) || 0;
        var bottom = parseInt( this.property('bottom') ) || 0;
        var left = parseInt( this.property('left') ) || 0;

        marginLeft+=left;
        marginRight+=right;
        marginTop+=top;
        marginBottom+=bottom;

        //从第二个子级元素开始，如大于了容器宽度则换行
        if (x + childWidth+gap+marginLeft+marginRight+paddingRight > parentWidth && index > 0)
        {
            y += maxHeight;
            x = gap+paddingLeft;
            maxHeight = 0;
        }
        children.push({
            "target": elem,
            'left': x + marginLeft,
            'top': y + marginTop,
            'width':childWidth,
            'height':childHeight
        });
        x += childWidth+gap+marginRight;
        maxHeight = Math.max(maxHeight, childHeight + gap+marginTop+marginBottom);
        countHeight = maxHeight + y;
        countWidth = Math.max(countWidth, x+paddingRight );
    });

    storage(this,'realHeight', countHeight );
    storage(this,'realWidth', countWidth );

    //需要整体排列
    if( children.length > 0 )
     {
         var xOffset, yOffset, index=0;
         xOffset = Math.floor((parentWidth-countWidth) * h);
         yOffset = Math.floor((parentHeight-countHeight) * v);

         if( yScroll &&  xOffset< 0 )
             xOffset=gap+paddingLeft;

         if( xScroll && yOffset < 0 )
             yOffset=gap+paddingTop;

         for( ; index < children.length ; index++ )
         {
             var child = children[index];
             target.current( child.target ).left( child.left + xOffset ).top( child.top + yOffset )
             .width( child.width ).height( child.height );
         }
     }
     setLayoutSize.call(this,Math.max(parentWidth,countWidth), Math.max(parentHeight,countHeight) );
};

var paddingMap=['Left','Right','Top','Bottom'];
function getViewportSize( target )
{
    var root = target.ownerDocument.body;
    var elem = Element.contains( target.parentNode, root ) ? target.parentNode : root;
    var parent = new Element( elem );
    var height=parent.height();
    var width=parent.width();
    for( var index=0 ; index < paddingMap.length ; index++ )
    {
        var val = parseInt( parent.style('padding'+ paddingMap[ index ] ) ) || 0;
        index < 2 ? width-=val : height-=val;
    }
    height+=parent.scrollTop();
    width+=parent.scrollLeft();
    return {'width':width,'height':height};
}

/**
 * 更新布局视图
 * @returns {Layout}
 */
Layout.prototype.updateDisplayList=function updateDisplayList()
{
    var target = storage(this,'target');
    var size = getViewportSize.call(this, target[0] );
    var parentHeight=calculateHeight.call(target, size.height);
    var parentWidth= calculateWidth.call(target, size.width);

    //计算子级元素需要排列的位置
    Layout.prototype.measureChildren.call(this, parentWidth, parentHeight);
};

/**
 * 设置水平对齐的方位
 * @param val
 * @returns {*}
 */
Layout.prototype.horizontalAlign=function horizontal(val)
{
    var old = storage(this,'horizontal') || horizontalMap[0];
    if( typeof val !== "undefined" )
    {
        if ( val !== old && horizontalMap.indexOf(val) >=0  )
        {
            storage(this,'horizontal', val);
        }
        return this;
    }
    return old;
};

/**
 * 设置垂直对齐的方位
 * @param val
 * @returns {*}
 */
Layout.prototype.verticalAlign=function verticalAlign(val)
{
    var old = storage(this,'vertical') || verticalMap[0];
    if( typeof val !== "undefined" )
    {
        if ( val !== old && verticalMap.indexOf(val) >=0  )
        {
            storage(this,'vertical', val);
        }
        return this;
    }
    return old;
};

/**
 * 获取设置间隔
 * @param number val
 * @returns {*}
 */
Layout.prototype.gap=function(val)
{
    var old = parseInt( storage(this,'gap') ) || 0;
    if( !isNaN(val) && old !== val )
    {
        storage(this, 'gap', val);
        return this;
    }
    return old;
};

System.Layout=Layout;


