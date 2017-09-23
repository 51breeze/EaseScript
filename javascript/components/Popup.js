/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

/*
@example
1、提示框
Popup.info('Hello word!',{anchor:event,vertical:'top', horizontal:'left'})
2、警告框
Popup.alert('Hello word!')
3、确认框
Popup.confirm('Hello word!',function(result){
console.log(result);
})
4、模态框
Popup.modality('<div>the html</div>')

注意：
在使用过程中推荐使用以上几种命令来创建弹出框。
如果有一些特殊的需求还可以自定义一些属性来达到不同的效果
Popup(Popup.NORM, context).left(100).top(100).show("<div>the html</div>");
 */
define('components/Popup',['./SkinComponent','../events/ModalityEvent','../Breeze','./SkinGroup'],function(SkinComponent,ModalityEvent,Breeze,SkinGroup)
{
    "use strict";

    /**
     * @private
     * @param object
     * @param option
     */
    function setting(object,option)
    {
        if( Utils.isObject(option) )
        {
            for( var prop in option ) if( typeof object[prop] === "function" )
            {
                object[prop]( option[prop] );
            }
        }
    }

    /**
     * 设置此模态框的位置和大小
     * @returns {Popup}
     * @protected
     */
    function setPositionAndSize()
    {
        if( Popup.LAST_INSTANCE && Popup.LAST_INSTANCE !== this )
        {
            Popup.LAST_INSTANCE.hidden();
        }

        var skin = this.skinGroup().next(null);
        var containerHeight = skin.height();
        var containerWidth = skin.width();
        var halign=this.horizontal();
        var valign=this.vertical();
        var anchor =  this.anchor();
        var left = this.left();
        var top = this.top();

        if( (containerHeight < 1 || containerWidth < 1) && (halign==='left' && valign==='top') && !anchor && !( isNaN(left) || isNaN(top) ) )
            return this;

        var windowSize = Utils.getSize( window );
        var width      = windowSize.width;
        var height     = windowSize.height;
        var x = 0;
        var y = 0;
        var  h=halign==='center' ? 0.5 : halign==='right' ? 1 : 0
            ,v=valign==='middle' ? 0.5 : valign==='bottom' ? 1 : 0
            ,xOffset, yOffset;

        if( anchor )
        {
            width = containerWidth;
            height = containerHeight;
            x-=width-width * h;
            y-=height-height * v;

            if( anchor instanceof MouseEvent )
            {
                x += anchor.pageX;
                y += anchor.pageY;
                width = containerWidth;
                height = containerHeight;
            }else
            {
                var rect = Utils.getBoundingRect(anchor,true);
                x += rect.left;
                y += rect.top;
                containerWidth = rect.width;
                containerHeight = rect.height;
                width=containerWidth * 2;
                height=containerHeight * 2;
            }
        }

        xOffset = x+Math.floor( (width - containerWidth) * h);
        yOffset = y+Math.floor( (height - containerHeight) * v);
        if( isNaN(left) )skin.left(xOffset);
        if( isNaN(top) )skin.top(yOffset);
        return this;
    }

    /**
     * 弹框组件
     * 模态框默认位于屏幕中间方位,也可以设置锚点对象来确定弹框位置。可以自定义主题风格，此组件提供了三种风格可供选择即：标准（norm）、典型（typical）、简单（simple）。
     * 如果在使用过程中想改变此组件的皮肤有以下两种方法可以做到：
     *   1、直接覆盖 getDefaultSkin 这个方法
     *   2、在页面中直通过html方式写一个皮肤，然后通过 new SkinGroup(html) 对象传给组件。具体如何使用 SkinGroup 请查看相关文档。
     * 注意：此组件使用了皮肤分离层的设计方式，在使用时还必须遵守皮肤的使用规则。
     *
     * 在标准风格下需要的皮肤元素：head, label, close, cancel, submit,body
     * 在典型风格下需要的皮肤元素：head, label, close, body
     *
     * @param string type norm|simple|typical
     * @param NodeElement context 默认为 body。每一个上下文中都可以容纳以上类型的弹框实例,相反每一个上下文中都只能有一个以上类型的实例。
     * @returns {Popup}
     * @constructor
     */
    function Popup( type, context )
    {
        type = type || Popup.NORM;
        if( typeof context === "undefined" )
        {
           context = document.body;
        }

        if( !Utils.isNodeElement(context) )
        {
            throw new Error('invalid context');
        }

        if( !(type.toUpperCase() in Popup) )
        {
            throw new Error('invalid type');
        }

        var name = type === Popup.MODALITY ? 'popup.modalityInstance' : 'popup.generalInstance';
        var instance = Utils.storage(context,name);
        if( instance )return instance;
        if( !(this instanceof Popup) )
            return new Popup( type , context);

        this.__type__ = type;
        this.__horizontal__=Popup.HCENTER;
        this.__vertical__=Popup.VMIDDLE;
        this.__title__='提示信息';
        this.__anchor__=null;
        this.__theme__=null;
        this.__callback__=null;
        this.__left__=NaN;
        this.__top__=NaN;
        Utils.storage(context,name, this);
        return SkinComponent.call(this, new SkinGroup('<div class="popup" />', context) );
    }

    //弹出风格
    Popup.NORM='norm';
    Popup.TYPICAL='typical';
    Popup.SIMPLE='simple';
    Popup.MODALITY='modality';

    //水平垂直对齐常量
    Popup.HLEFT='left';
    Popup.HCENTER='center';
    Popup.HRIGHT='right';
    Popup.VTOP='top';
    Popup.VMIDDLE='middle';
    Popup.VBOTTOM='bottom';
    Popup.LAST_INSTANCE=null;

    //提示框
    Popup.info=function( message , option )
    {
        option = Utils.extend({zIndex:999} , option || {});
        var popup = Popup( Popup.SIMPLE );
        if( option.anchor instanceof MouseEvent )
        {
            popup.vertical('top').horizontal('left');
        }
        Popup.LAST_INSTANCE= popup;
        return popup.show( Utils.sprintf('<div style="margin: 5px;">%s</div>',message) , option);
    };

    //警告框
    Popup.alert=function( message , option )
    {
        option = Utils.extend({zIndex:999,minWidth:400,minHeight:80,autoHidden:false,vertical:'top',horizontal:'center'} , option || {});
        var popup =  Popup( Popup.NORM );
        //Popup.LAST_INSTANCE= popup;
        return popup.show( message , option);
    };

    //确认框
    Popup.confirm=function( message , option )
    {
        if( typeof option === "function" )option={callback:option};
        option = Utils.extend({zIndex:999,minWidth:400,minHeight:120,autoHidden:false,vertical:'top',horizontal:'center'} , option || {});
        var popup =  Popup( Popup.TYPICAL );
        //Popup.LAST_INSTANCE= popup;
        return  popup.show( message , option);
    };

    //模态框
    Popup.modality=function(title, content , option )
    {
        option =  Utils.extend({minWidth:600,minHeight:300,autoHidden:false,type:Popup.TYPICAL,style:{opacity:0.5},zIndex:900}, option || {});
        var popup = Popup( Popup.MODALITY );
        var theme={};
        theme[ Popup.NORM ] = '{skins head+body}';
        theme[ Popup.TYPICAL ] = '{skins head+body+footer}';
        popup.__theme__ = theme[option.type] || '';
        popup.mask().style(option.style);
        delete option.style;
        popup.title( title ).show( content , option );
        return  popup;
    };

    Popup.prototype=  new SkinComponent();
    Popup.prototype.constructor=Popup;
    Popup.prototype.__type__=Popup.NORM;
    Popup.prototype.__theme__=null;
    Popup.prototype.__vertical__=Popup.VMIDDLE;
    Popup.prototype.__horizontal__=Popup.HCENTER;
    Popup.prototype.componentProfile='popup';
    Popup.prototype.initializeMethod=[];

    /**
     * @private
     */
    Popup.prototype.__callback__=null;

    /**
     * 点击取消或者确认按扭后的回调函数
     * @param function callback
     * @returns {Popup|function}
     */
    Popup.prototype.callback=function( callback )
    {
        if( typeof callback === "function" )
        {
            this.__callback__ = callback;
            return this;
        }
        return this.__callback__;
    };

    /**
     * 设置提示框是否自动隐藏
     * @param flag
     * @returns {Popup}
     */
    Popup.prototype.autoHidden=function( flag )
    {
        this.skinGroup().next(null);
        if( !!flag === false )
        {
            this.skinGroup().removeEventListener(MouseEvent.MOUSE_OUTSIDE);

        }else if( !this.skinGroup().hasEventListener(MouseEvent.MOUSE_OUTSIDE) )
        {
            this.skinGroup().addEventListener(MouseEvent.MOUSE_OUTSIDE,function(event){
                this.hidden();
            },true,0,this);
        }
        return this;
    };

    /**
     * 设置获取标题头的高度
     * @param number value
     * @returns {number|Modality}
     * @public
     */
    Popup.prototype.headHeight=function( value )
    {
        var headSkin =  this.skinGroup().getSkin('head');
        if( typeof value === "number" )
        {
            if( headSkin )this.skinGroup().next( headSkin ).height( value );
            this.next(null);
            return this;
        }
        var val =  headSkin ? this.skinGroup().next( headSkin ).height() : 0;
        this.next(null);
        return val;
    };

    /**
     * 设置获取模态窗口的类型,默认标准
     * @returns {Popup|string}
     * @public
     */
    Popup.prototype.type=function()
    {
        return this.__type__;
    };

    /**
     * 设置获取模态窗口的水平位置,默认中间
     * @param string align [center,left,right]
     * @returns {Popup|string}
     * @public
     */
    Popup.prototype.horizontal=function( align )
    {
        if( typeof align !== "undefined" )
        {
            if( Popup['H'+align.toUpperCase()] )
                this.__horizontal__=align;
            return this;
        }
        return this.__horizontal__;
    };

    /**
     * 设置获取模态窗口的垂直位置,默认中间
     * @param string align [middle,top,bottom]
     * @returns {Popup|string}
     * @public
     */
    Popup.prototype.vertical=function( align )
    {
        if( typeof align !== "undefined" )
        {
            if( Popup['V'+align.toUpperCase()] )
                this.__vertical__=align;
            return this;
        }
        return this.__vertical__;
    };

    /**
     * @private
     */
    Popup.prototype.__title__='提示信息';

    /**
     * 隐藏此弹框
     * @returns {Popup}
     * @public
     */
    Popup.prototype.title=function( title )
    {
        if( typeof title !== "undefined" )
        {
            this.__title__=title;
            return this;
        }
        return this.__title__;
    };

    /**
     * 庶罩层
     * @returns {*}
     */
    Popup.prototype.mask=function()
    {
        if( this.type() === Popup.SIMPLE )
           return null;

        var skinGroup = this.skinGroup();
        var context = skinGroup[0].parentNode;
        var name = this.type() === Popup.MODALITY ? 'popup.maskmodality' : 'popup.maskalert';
        var mask = Utils.storage(context,name);
        if( !mask )
        {
            mask = Element('<div name="mask" />', skinGroup[0].parentNode )
                .style('cssText',"background-color:#000000;opacity:0;width:100%;height:100%;position:fixed;z-index:998;top:0px;left:0px;display:none" );
            var callback = function(event){
                this.height( Utils.getSize(window,'height'));
            };
            Utils.root().addEventListener(BreezeEvent.RESIZE,callback,true,0,mask);
            callback.call(mask);
            mask.addEventListener( MouseEvent.MOUSE_DOWN,function(event){
                Animation.shake( skinGroup[0] );
                event.stopPropagation();
            });
            Utils.storage(context,name, mask);
        }
        return mask;
    };

    /**
     * 隐藏此弹框
     * @returns {Popup}
     * @public
     */
    Popup.prototype.hidden=function( flag )
    {
        var mask = this.mask();
        if( mask )mask.display(false);

        var callback =  this.callback();
        if( !callback || callback.call(this, !!flag ) !== false )
        {
            this.next(null).display(false);
            if( this.hasEventListener( PopupEvent.CLOSE ) ){
                this.dispatchEvent( new PopupEvent( PopupEvent.CLOSE ) );
            }
        }
        return this;
    };

    /**
     * @private
     */
    Popup.prototype.__left__=NaN;

    /**
     * 显示弹框
     * @param number val
     * @returns {Popup|number}
     * @public
     */
    Popup.prototype.left=function( val )
    {
        if( typeof val !== "undefined" )
        {
            val = parseInt(val);
            if( !isNaN(val ) )this.skinGroup().next(null).left(val);
            this.__left__=val;
            return this;
        }
        return this.__left__;
    };

    /**
     * @private
     */
    Popup.prototype.__top__=NaN;

    /**
     * 显示弹框
     * @param number val
     * @returns {Popup|number}
     * @public
     */
    Popup.prototype.top=function( val )
    {
        if( typeof val !== "undefined" )
        {
            val = parseInt(val);
            if( !isNaN(val ) )this.skinGroup().next(null).top( val );
            this.__top__=val;
            return this;
        }
        return this.__top__;
    };

    /**
     * @private
     */
    Popup.prototype.__maxHeight__=600;

    /**
     * 最大高度
     * @param number val
     * @returns {Popup|number}
     * @public
     */
    Popup.prototype.maxHeight=function( val )
    {
        if( typeof val !== "undefined" )
        {
            this.__maxHeight__=parseInt(val);
            return this;
        }
        return this.__maxHeight__;
    };

    /**
     * @private
     */
    Popup.prototype.__minHeight__=30;

    /**
     * 最小高度
     * @param number val
     * @returns {Popup|number}
     * @public
     */
    Popup.prototype.minHeight=function( val )
    {
        if( typeof val !== "undefined" )
        {
            this.__minHeight__=parseInt(val);
            return this;
        }
        return this.__minHeight__;
    };

    /**
     * @private
     */
    Popup.prototype.__maxWidth__=600;

    /**
     * 最大宽度
     * @param number val
     * @returns {Popup|number}
     * @public
     */
    Popup.prototype.maxWidth=function( val )
    {
        if( typeof val !== "undefined" )
        {
            this.__maxWidth__=parseInt(val);
            return this;
        }
        return this.__maxWidth__;
    };

    /**
     * @private
     */
    Popup.prototype.__minWidth__=120;

    /**
     * 最小宽度
     * @param number val
     * @returns {Popup|number}
     * @public
     */
    Popup.prototype.minWidth=function( val )
    {
        if( typeof val !== "undefined" )
        {
            this.__minWidth__=parseInt(val);
            return this;
        }
        return this.__minWidth__;
    };

    /**
     * @private
     */
    Popup.prototype.__anchor__=null;

    /**
     * 设置一个锚点对象，可以是一个节点元素和鼠标事件对象。
     * 设置这个对象后弹框会根据设置的布局方位来紧贴锚点对象的周围
     * @param number val
     * @returns {Popup|number}
     * @public
     */
    Popup.prototype.anchor=function( val )
    {
        if( typeof val !== "undefined" )
        {
            if( !Utils.isNodeElement(val) && !(val instanceof MouseEvent) )
            {
                throw new Error('invalid anchor. the val only can is NodeElement or MouseEvent');
            }
            this.__anchor__=val;
            return this;
        }
        return this.__anchor__;
    };

    /**
     * 显示弹框
     * @param string content
     * @param object option
     * @returns {Popup}
     * @public
     */
    Popup.prototype.show=function( content, option )
    {
        var skinGroup = this.skinGroup();
        content = content || '';
        option =  Utils.extend({autoHidden:true,zIndex:999}, option || {});
        option.zIndex =  parseInt( option.zIndex ) || 999;
        setting(this, option);

        if( skinGroup.getSkin('label') )skinGroup.currentSkin('label').text( this.title() );
        var body = skinGroup.getSkin('body') || skinGroup.getSkin('container');
        skinGroup.next( body ).html( content );
        skinGroup.next( null ).style('zIndex',option.zIndex).display(true);

        var mask = this.mask();
        if( mask )mask.display(true).style('zIndex', option.zIndex-1 );

        var size = Utils.getSize( skinGroup[0] );
        var maxHeight =  this.maxHeight();
        var minHeight = this.minHeight();
        var maxWidth  = this.maxWidth();
        var minWidth  = this.minWidth();

        maxHeight = isNaN(maxHeight) ? size.height : maxHeight;
        minHeight = isNaN(minHeight) ? size.height : minHeight;
        maxWidth = isNaN(maxWidth) ? size.width : maxWidth;
        minWidth = isNaN(minWidth) ? size.width : minWidth;

        skinGroup.next(null);
        skinGroup.height( Math.max( Math.min(size.height, maxHeight ) , minHeight ) );
        skinGroup.width( Math.max( Math.min(size.width, maxWidth ) , minWidth ) );
        setPositionAndSize.call(this);
        return this;
    };

    /**
     * 皮肤安装完成
     * @param skinGroup
     * @returns {Popup}
     * @protected
     */
    Popup.prototype.skinInstalled=function( skinGroup )
    {
        SkinComponent.prototype.skinInstalled.call(this,skinGroup);
        skinGroup.next(null).addEventListener(PropertyEvent.CHANGE,function(event) {
            if( event.property==='width' || event.property==='height' )
            {
                setPositionAndSize.call(this);
                var bodySkin  = skinGroup.getSkin('body');
                if( bodySkin )
                {
                    var headSkin = skinGroup.getSkin('head');
                    var footerSkin = skinGroup.getSkin('footer');
                    var headHeight =headSkin ? Utils.getSize(headSkin,'height') : 0;
                    var footerHeight = footerSkin ? Utils.getSize(footerSkin,'height') : 0;
                    Utils.style( bodySkin, 'height', skinGroup.next(null).height() - headHeight - footerHeight );
                }
            }
        },false,0,this);

        if( skinGroup.getSkin('close') )
        {
            skinGroup.currentSkin('close').addEventListener(MouseEvent.CLICK,function(event)
            {
               this.hidden();
            },false,0,this);
            skinGroup.next(null);
        }

        if( skinGroup.getSkin('footer') )
        {
            skinGroup.getSkinGroup('footer > button').addEventListener(MouseEvent.CLICK,function(event)
            {
                var name =  Utils.property(event.currentTarget ,  SkinGroup.NAME ) || '';
                var type  = name.toUpperCase();
                if( this.hasEventListener( PopupEvent[type] ) && !this.dispatchEvent( new PopupEvent( PopupEvent[type]  ) ) )
                    return;
                this.hidden( PopupEvent.SUBMIT === PopupEvent[type] );

            },false,0,this);
        }

        Utils.root().addEventListener(BreezeEvent.RESIZE,function(event){
            setPositionAndSize.call(this);
        },false,0,this);
        return this;
    };


    /**
     * 获取模态框的默认皮肤
     * @returns {SkinObject}
     * @protected
     */
    Popup.prototype.defaultSkinObject=function()
    {
        var theme = this.__theme__;
        if( typeof theme !== "string" )
        {
            theme={};
            theme[ Popup.NORM ] = '{skins head+body}';
            theme[ Popup.TYPICAL ] = '{skins head+body+footer}';
            theme=theme[this.type()] || '';
        }

        return new SkinObject( theme ,{
            head: '<div>{skins label+close}</div>',
            label: '<label>Title</label>',
            close: '<span>关闭</span>',
            cancel:'<button>取消</button>',
            submit:'<button>确定</button>',
            footer:'<div>{skins cancel+submit}</div>',
            body:  '<div></div>'
        },{
            'container':"boxShadow:0px 0px 8px 0px rgba(0,0,0,.4);borderRadius:3px;zIndex:999;overflow:hidden;position:fixed;left:0px;top:0px;width:auto;height:auto;display:none;border:solid #b3b3b3 1px;backgroundColor:#ffffff",
            '.head':"width:100%;height:35px;lineHeight:35px;display:block;color:#333333;borderBottom:solid 1px #cccccc",
            '.head > .label':"width:auto;display:block;float:left;margin:0px 10px",
            '.head > .close':"width:auto;height:25px;padding:0px;margin:0px;cursor:pointer;float:right;margin:0px 10px",
            '.body':"padding:10px;width:100%;height:auto;display:block;overflow:auto;backgroundColor:#ffffff",
            '.cancel,.submit':"width:auto;height:25px;lineHeight:25px;padding:0px 10px;margin:5px 3px;display:inline-block;",
            '.footer':"width:100%;height:auto;display:block;borderTop:solid 1px #cccccc;padding:0px;textAlign:right;"
        },{
            'head':{ 'class':'head'},
            'body':{ 'class':'body'},
            'footer':{ 'class':'footer'},
            'label':{ 'class':'label'},
            'close':{ 'class':'close'},
            'cancel':{ 'class':'cancel btn btn-default'},
            'submit':{ 'class':'submit btn btn-default'}
        },theme =='' ? [] : ['head','body']);
    };
    return Popup;

});