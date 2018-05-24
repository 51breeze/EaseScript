/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.components.SkinComponent;
    import es.core.Container;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.interfaces.IPopUp;
    import es.core.SystemManage;

    [RunPlatform("client")]
    public class PopUpManage
    {
        /**
         * 遮罩层的显示层级
         */
        static public const MASK_LEVEL:int = 99900;

        /**
         * 窗口容器的显示层级
         */
        static public const WINDOW_LEVEL:int = 99910;

        /**
         * 系统弹窗的顶级层级
         */
        static public const TOP_LEVEL:int = 99999;

        /**
         * 默认配置选项
         */
        static public const defaultOptions:Object={
            "profile":{"titleText":"提示"},
            "disableScroll":false,
            "callback":null,
            "timeout":0,
            "skinStyle":null,
            "maskStyle":null,
            "animation":{
                "enabled":true,
                "fadeIn": {
                    "name":"fadeIn",
                    "duration":0.2,
                    "timing":"linear",
                    "delay":0,
                    "fillMode":"forwards",
                },
                "fadeOut": {
                    "name":"fadeOut",
                    "duration":0.2,
                    "timing":"linear",
                    "delay":0,
                    "fillMode":"forwards",
                }
            },
            "horizontal":"center",
            "vertical":"middle",
            "offsetX":0,
            "offsetY":0,
            "x":NaN,
            "y":NaN,
        };

        /**
         * 遮罩层实例对象
         */
        static private var maskHash:Dictionary = new Dictionary();

        /**
         * 显示一个遮罩层
         * @param style
         */
        static public function mask( target:Display=null, options:Object=null, viewport:Element=null ):Display
        {
            //有指定目标遮罩层就关闭
            if( target )
            {
                if( target.visible )
                {
                    (target as MaskDisplay).fadeOut();
                }
                return target;
            }

            if( viewport == null )
            {
                viewport = SystemManage.getBody();
            }

            var obj:MaskDisplay = maskHash.get( viewport ) as MaskDisplay;
            if( obj == null )
            {
                obj = new MaskDisplay( viewport );
                maskHash.set( viewport, obj );
                obj.style("zIndex", MASK_LEVEL );
            }
            if( options )
            {
                obj.options( options );
            }
            if( !obj.visible )
            {
                obj.fadeIn();
                return obj;
            }
            return null;
        }

        //系统级弹框实例对象
        static private var systemPopUpInstance:IPopUp=null;

        //模态窗口实例对象
        static private var modalityInstances:Array=[];

        /**
         * 显示系统级的弹框
         * @param instance
         * @param options
         */
        static public function show(target:IPopUp, isModalWindow:Boolean = false, viewport:Element=null )
        {
            if( viewport === null )
            {
                viewport = SystemManage.getBody();
            }

            var level:int = WINDOW_LEVEL;
            if( isModalWindow === true )
            {
                if( modalityInstances.indexOf(target) < 0 )
                {
                    modalityInstances.push(target);
                }
                active( target );

            }else
            {
                //系统级别的弹框始终只能有一个实例
                //如果已经添加过了系统弹框实例，并且与当前指定的弹框实例不一致则删除添加过的实例
                if( systemPopUpInstance && target !== systemPopUpInstance )
                {
                    var elem:Element = systemPopUpInstance.element;
                    elem.parent().removeChild( elem );
                }
                //记录当前指定的实例
                systemPopUpInstance = target;
                level = TOP_LEVEL;
            }

            //如果没有添加则添加到视口中
            if( target.element.parent().isEmpty() )
            {
                target.element.style("zIndex", level );
                viewport.addChild( target.element );
            }

            //显示皮肤对象
            target.display();
        }

        /**
         * 激活指定的模态窗口实例
         * @param instance
         */
        static public function active( target:IPopUp )
        {
            var index:int=0;
            var len:int = modalityInstances.length;
            var at:int = 0;
            for(;index<len;index++)
            {
                 var obj:IPopUp = modalityInstances[index] as IPopUp;
                 if( target === obj)
                 {
                     at = index;
                     target.element.style('zIndex', WINDOW_LEVEL );
                     target.element.addClass("active");

                 }else{
                     obj.element.style('zIndex', WINDOW_LEVEL - 1 );
                     obj.element.removeClass("active");
                 }
            }

            //将此窗口放到最上面
            if( at > 0 )
            {
                modalityInstances.splice(at,1);
                modalityInstances.push( target );
            }
        }

        /**
         * 关闭指定的模态窗口
         * @param target
         */
        static public function close( target:IPopUp )
        {
            var index:int = modalityInstances.indexOf(target);
            if( index >= 0 )
            {
                var parent:IDisplay = target.parent;
                if( parent )
                {
                    (parent as IContainer).removeChild( target );
                }
                modalityInstances.splice(index,1);
                if( modalityInstances.length > 0 )
                {
                    active( modalityInstances[modalityInstances.length-1] as IPopUp );
                }
                return target;
            }
            return null;
        }
    }
}

import es.core.SystemManage;
import es.core.Display;
class MaskDisplay extends Display
{
    //已绑定事件的容器
    static private var container:Element;

    /**
     * 遮罩层样式
     */
    static private var defaultOptions:Object={
        "animation": {
            "enabled": true,
            "fadeIn": 0.2,
            "fadeOut": 0.2,
        },
        "style":{
            "backgroundColor":"#000000",
            "opacity":0.7,
            "width":"100%",
            "height":"100%",
            "position":"absolute",
            "left":"0px",
            "top":"0px",
        }
    };

    //显示时使用的样式及动画配置
    private var _options:Object=null;

    /**
     * 遮罩层构造函数
     */
    public function MaskDisplay( viewport:Element )
    {
        super( new Element('<div />') );
        this._options = defaultOptions;
        this.style( "cssText", System.serialize(defaultOptions.style,"style") );
        this.visible = false;
        viewport.addChild( this.element );
        this.resize();
    }

    //设置遮罩层样式及动画
    public function options( option:Object )
    {
        this._options = Object.merge( true, {}, defaultOptions, option );
    }

    //调整遮罩层的高度
    //这个方法必须在当前对象添加到容器后才能生效
    private function resize()
    {
        var height:Number=0;
        var viewport:Element = this.element.parent();
        if( Element.equal( viewport,  SystemManage.getBody() ) )
        {
            viewport =SystemManage.getWindow();
            height = viewport.scrollHeight();
        }else{
            height = viewport.height();
        }

        if( !Element.equal(MaskDisplay.container, viewport) )
        {
            if( MaskDisplay.container )
            {
                MaskDisplay.container.removeEventListener(Event.RESIZE, this.resize);
            }
            viewport.addEventListener(Event.RESIZE, this.resize, false, 0, this);
            MaskDisplay.container = viewport;
        }
        var h:Number = this.height;
        this.height = h + Math.max( height-h,0);
    }

    //淡入遮罩层
    public function fadeIn()
    {
        var animation:Object = defaultOptions.animation;
        if ( animation.fadeIn > 0 )
        {
            this.element.fadeIn( animation.fadeIn, this._options.style.opacity as float );
        }
        this.visible = true;
    }

    //淡出遮罩层
    public function fadeOut()
    {
        var animation:Object = defaultOptions.animation;
        var fadeOut:float = animation.fadeOut as float;
        if( animation.fadeOut > 0 )
        {
            this.element.fadeOut( animation.fadeOut as float, this._options.style.opacity as float);
        }
        setTimeout(function (target:MaskDisplay) {
            target.visible=false;
        }, (fadeOut) * 1000, this);
    }

}

