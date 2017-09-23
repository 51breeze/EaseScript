/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */


/*
@example
1、使用默认皮肤
var modality = new Modality()
modality.label('New modality')
modality.content('<h1>Hello, the is demo</h1>')
modality.show(true)

2、使用自定义皮肤
<div id="modality" style="width: 500px; height: 500px;" >
    <div skin="head" style="width: 100%; height: 35px; background-color: #3baecc">
        <label skin="label">标题</label>
        <span skin="close">关闭</span>
    </div>
    <div skin="body" style="background-color: #fefff3">
        <h1>Hello, the is demo</h1>
    </div>
    <div skin="footer" style="width: 100%; height: 35px; background-color: #c6bec2">
        <button skin="cancel">取消</button>
        <button skin="submit">确认</button>
    </div>
</div>
 var modality = new Modality( new SkinGroup("#modality") )
 modality.show()
*/

define('components/Modality',['./SkinComponent','../events/ModalityEvent','../Breeze','./SkinGroup'],function(SkinComponent,ModalityEvent,Breeze,SkinGroup)
{
    "use strict";

    /**
     * 模态框
     * 模态框默认大小为 800*500 位于屏幕中间方位。可以自定义主题风格，此组件提供了三种风格可供选择即：标准（norm）、典型（typical）、简单（simple）。
     * 如果在 modality.show(true) 设置为 true 则在底下方显示一个半透明的遮罩层，如果不设置或者为false都将不会显示遮罩层。
     * 如果在使用过程中想改变此组件的皮肤有以下两种方法可以做到：
     *   1、直接覆盖 getDefaultSkin 这个方法
     *   2、在页面中直通过html方式写一个皮肤，然后通过 new SkinGroup(html) 对象传给模态框。具体如何使用 SkinGroup 请查看相关文档。
     * 注意：此组件使用了皮肤分离层的设计方式，在使用时还必须遵守皮肤的使用规则。
     *
     * 在标准风格下需要的皮肤元素：head, label, close, cancel, submit,body
     * 在典型风格下需要的皮肤元素：head, label, close, body
     * @extends Component
     * @param SkinGroup skinGroup 皮肤组件
     * @returns {Modality}
     * @constructor
     */
    function Modality( selector , context )
    {
        if( !(this instanceof Modality) )
            return new Modality( selector , context );
        return SkinComponent.call(this, selector , context );
    }

    Modality.prototype=  new SkinComponent();
    Modality.prototype.constructor=Modality;
    Modality.prototype.componentProfile='modality';
    Modality.prototype.initializeMethod=['show','hidden','label','headHeight','footerHeight','type','vertical','horizontal'];

    //窗体布局主题风格
    Modality.NORM='norm';
    Modality.SIMPLE='simple';
    Modality.TYPICAL='typical';

    //水平垂直对齐常量
    Modality.HLEFT='left';
    Modality.HCENTER='center';
    Modality.HRIGHT='right';
    Modality.VTOP='top';
    Modality.VMIDDLE='middle';
    Modality.VBOTTOM='bottom';

    /**
     * @param event
     * @private
     */
    Modality.prototype.__propertyChanged__=function(event)
    {
        event.stopPropagation();
        if( event.property==='width' || event.property==='height' )this.setPositionAndSize();
    };

    /**
     * 设置此模态框的位置和大小
     * @returns {Modality}
     * @protected
     */
    Modality.prototype.setPositionAndSize=function()
    {
        var type = this.type();
        if( type === Modality.SIMPLE )
            return this;
        var skin = this.skinGroup();
        skin.next(null);
        var containerHeight = skin.height();
        var containerWidth = skin.width();
        var top= 0,bottom= 0,right= 0,left= 0,headHeight=0,footerHeight=0;

        if( skin.getSkin('head') )
        {
            headHeight=skin.currentSkin('head').height();
            skin.style('position','absolute').left(0).top(0);
        }

        if( skin.getSkin('footer') )
        {
            footerHeight = skin.currentSkin('footer').height();
            skin.style('position','absolute').left(0).bottom(0);
        }

        if( skin.getSkin('body') )
        {
             skin.currentSkin('body');
             skin.style('position','absolute').top( headHeight).left(0);
             top = parseInt( skin.style('paddingTop') ) || 0;
             bottom= parseInt( skin.style('paddingBottom') ) || 0;
             right = parseInt( skin.style('paddingRight') ) || 0;
             left= parseInt( skin.style('paddingLeft') ) || 0;
             skin.height( containerHeight - headHeight - footerHeight-top-bottom ).width( containerWidth-right-left);
        }

        skin.next(null);
        var halign=this.horizontal()
            ,valign=this.vertical()
            ,width = Breeze.root().width()
            ,height = Breeze.root().height()
            ,h=halign==='center' ? 0.5 : halign==='right' ? 1 : 0
            ,v=valign==='middle' ? 0.5 : valign==='bottom' ? 1 : 0
            ,xOffset, yOffset;
        xOffset = Math.floor( (width-containerWidth) * h );
        yOffset = Math.floor( (height-containerHeight) * v);
        this.moveTo(xOffset,yOffset);
        return this;
    };

    /**
     * 皮肤安装完成
     * @param skinGroup
     * @returns {Modality}
     * @protected
     */
    Modality.prototype.skinInstalling=function( skinGroup )
    {
        if( this.type() !== Modality.SIMPLE )
        {
            var selector=Breeze.sprintf('[%s=head] > [%s=close],[%s=footer] button', SkinGroup.NAME,SkinGroup.NAME,SkinGroup.NAME );
            Breeze(selector,skinGroup).addEventListener(MouseEvent.CLICK,function(event)
            {
                event.stopPropagation();
                var type =  Breeze(event.__proxyTarget__).property(SkinGroup.NAME);
                if( typeof type === "string" )
                {
                    var uptype=type.toUpperCase();
                    var event = new ModalityEvent( ModalityEvent[uptype] );
                    if( this.hasEventListener( ModalityEvent[uptype] ) || !this.dispatchEvent(event) )
                        return;
                }
                this.hidden();
            },false,0,this);
            skinGroup.addEventListener( PropertyEvent.CHANGE , this.__propertyChanged__, false, 0, this )
        }

        Breeze.root().addEventListener(BreezeEvent.RESIZE,function(event){
            this.setPositionAndSize();
        },true,0,this);
        this.setPositionAndSize();
        return this;
    };

    /**
     * 获取模态框的默认皮肤
     * @returns {SkinGroup}
     * @protected
     */
    Modality.prototype.getDefaultSkinObject=function()
    {
        var defaultSkin={
            elements: {
                head: '<div>{elements label+close}</div>',
                label: '<label>Title</label>',
                close: '<span>关闭</span>',
                body:  '<div></div>',
                cancel:'<button {attributes button}>取消</button>',
                submit:'<button {attributes button}>确认</button>',
                footer:'<div><div style="width: auto; height: auto; float: right;">{elements cancel+submit}</div></div>'
            } ,
            attributes:{
                head:{ 'style':{'width':'100%',height:'30px',lineHeight:'30px','display':'block',backgroundColor:'#3a3a3a',color:'#d6d6db','fontSize':'14px'}  },
                label:{ 'style':{'width':'auto','display':'block',cursor:'pointer','float':'left',margin:'0px 10px'} },
                close:{ 'style':{'width':'auto',height:'25px',padding:"0px",cursor:'pointer','float':'right',margin:'0px 10px'} },
                body:{ 'style':{padding:'10px','width':'100%',height:'auto','display':'block',overflow:'auto',backgroundColor:'#ffffff'} },
                button:{ 'style':{margin:'0px 5px', width:'auto',height:'25px',padding:"0px 10px"} },
                container:{ 'style':{'width':'800px',height:'550px','display':'none',overflow:'hidden',"getBoundingRect":'absolute','zIndex':999,'backgroundColor':'#3a3a3a','shadow':'0px 0px 10px 2px #444444','radius':'5px'}},
                footer:{ 'style':{'width':'100%',height:'35px',lineHeight:'30px','display':'block',backgroundColor:'#d6d6db'}}
            }
        };
        return new SkinGroup(  this.theme( this.type() ) , defaultSkin,  document.body );
    };


    /**
     * 获取设置模态窗体的主题格式
     * @param string type [norm,simple,typical]
     * @param string skin [html]
     * @returns {string|Modality}
     * @public
     */
    Modality.prototype.__theme__={};
    Modality.prototype.__theme__[ Modality.NORM ]= '<div>{elements head+body+footer}</div>';
    Modality.prototype.__theme__[ Modality.TYPICAL ]= '<div>{elements head+body}</div>';
    Modality.prototype.__theme__[ Modality.SIMPLE ]= '<div></div>';
    Modality.prototype.theme=function( type, skin )
    {
        if( typeof skin !== "undefined" )
        {
            if(  type.toUpperCase() in Modality )
                this.__theme__[ type ]= skin;
            return this;
        }
        return typeof type === "string" && this.__theme__[ type ] ?  this.__theme__[ type ] :  this.__theme__[ this.type() ] ;
    };

    /**
     * 设置获取模态窗口的类型,默认标准
     * @param string type [norm,simple,typical]
     * @returns {Modality|string}
     * @public
     */
    Modality.prototype.__type__= Modality.NORM;
    Modality.prototype.type=function( type )
    {
        if(  typeof type !== "undefined"  )
        {
            type.toUpperCase() in Modality && ( this.__type__= type );
            return this;
        }
        return  this.__type__;
    };

    /**
     * 设置获取模态窗口的水平位置,默认中间
     * @param string align [center,left,right]
     * @returns {Modality|string}
     * @public
     */
    Modality.prototype.__horizontal__=Modality.HCENTER;
    Modality.prototype.horizontal=function( align )
    {
        if( typeof align !== "undefined" )
        {
            if( Modality['H'+align.toUpperCase()] )
                this.__horizontal__=align;
            return this;
        }
        return this.__horizontal__;
    };

    /**
     * 设置获取模态窗口的垂直位置,默认中间
     * @param string align [middle,top,bottom]
     * @returns {Modality|string}
     * @public
     */
    Modality.prototype.__vertical__=Modality.VMIDDLE;
    Modality.prototype.vertical=function( align )
    {
        if( typeof align !== "undefined" )
        {
            if( Modality['V'+align.toUpperCase()] )
                this.__vertical__=align;
            return this;
        }
        return this.__vertical__;
    };

    /**
     * 隐藏此模态框
     * @returns {Modality}
     * @public
     */
    Modality.prototype.hidden=function()
    {

        if( _shade instanceof Modality && this !==_shade && this.__shaded__===true ){
            _shade.hidden();
        }
        this.display(false);
        return this;
    };

    /**
     * @private
     */
    var _shade=null;
    Modality.prototype.__shaded__=false;

    /**
     * 遮罩层模态框
     * @returns {Modality}
     * @public
     */
    Modality.prototype.shade=function()
    {
        if( _shade === null )
        {
            _shade = new Modality();
            _shade.type(Modality.SIMPLE);
            _shade.style({'opacity':0.5,'backgroundColor':'#000000','radius':'0px','shadow':'none','left':'0px','top':'0px'});
            _shade.style('width','100%').style('height', Breeze(document).height() );

            Breeze.root().addEventListener(BreezeEvent.RESIZE,function(event)
            {
                var height = Breeze(window).height() + Breeze(document).scrollTop();
                _shade.style('height', height );

            },true);

            Breeze.root().addEventListener(BreezeEvent.SCROLL,function(event)
            {
                _shade.style('height', Breeze(document).height() );
            });
        }
        return _shade;
    };

    /**
     * 显示模态框
     * @param boolean shade 是否需要显示遮罩
     * @param number zIndex 浮在元素最前的索引
     * @returns {Modality}
     * @public
     */
    Modality.prototype.show=function( shade ,zIndex )
    {
        zIndex = zIndex || 999;
        shade= Breeze.boolean( shade );
        if( shade===true )
        {
            this.__shaded__=true;
            this.shade().show(false,zIndex-1);
        }
        this.next(null);
        this.style({'zIndex':zIndex,"position":'absolute'});
        this.skinGroup().show();
        return this;
    };

    /**
     * 设置获取模态框标题
     * @param string label
     * @returns {string|Modality}
     * @public
     */
    Modality.prototype.label=function(label)
    {
        if( typeof label === "string" )
        {
            if( this.type() !== Modality.SIMPLE )
            this.currentSkin('label').content( label );
            this.next(null);
            return this;
        }
        var val = this.type() !== Modality.SIMPLE ? this.skinGroup().currentSkin('label').content() : '';
        this.next(null);
        return val;
    };

    /**
     * 设置获取模态框内容
     * @param string content [html]
     * @returns {string|Modality}
     * @public
     */
    Modality.prototype.content=function( content )
    {
        if( typeof content === "undefined" )
        {
            var val =  this.skinGroup().currentSkin('body').html();
            this.next(null);
            return val;
        }

        this.skinGroup().currentSkin('body').html( content );
        this.next(null);
        return this;
    };

    /**
     * 设置获取标题头的高度
     * @param number value
     * @returns {number|Modality}
     * @public
     */
    Modality.prototype.headHeight=function( value )
    {
        if( typeof value === "number" )
        {
            if( this.type() !== Modality.SIMPLE )
            this.skinGroup().currentSkin('head').height( value );
            this.next(null);
            return this;
        }
        var val = this.type() !== Modality.SIMPLE ? this.skinGroup().currentSkin('head').height():0;
        this.next(null);
        return val;
    };

    /**
     * 设置获取脚部的高度
     * @param number value
     * @returns {number|Modality}
     * @public
     */
    Modality.prototype.footerHeight=function( value )
    {
        if( typeof value === "number" )
        {
            if( this.type() === Modality.NORM )
                 this.skinGroup().currentSkin('footer').height(value);
            this.next(null);
            return this;
        }
        var val = this.type() === Modality.NORM ? this.skinGroup().currentSkin('footer').height(this) : 0;
        this.next(null);
        return val;
    };

    return Modality;

});
