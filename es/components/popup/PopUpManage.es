/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.components.popup
{
    import es.core.SkinComponent;
    import es.core.Container;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.core.SystemManage;
    import es.components.popup.BasePopUp;

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
        static public var defaultOptions:Object={
            "profile":{
                "titleText":"提示",
                "currentState":"modality"
            },
            "disableScroll":false,
            "isModalWindow":true,
            "mask":true,
            "callback":null,
            "timeout":0,
            "maskStyle":null,
            "clickOutsideClose":false,
            "animation":{
                "enabled":true,
                "fadeIn": {
                    "name":"fadeInDown",
                    "duration":0.2,
                    "timing":"linear",
                    "delay":0,
                    "fillMode":"forwards",
                },
                "fadeOut": {
                    "name":"fadeOutUp",
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
         * 当前打开窗口的计数据器
         */
        static private var count:int = 0;

         //遮罩层实例对象
        static private var maskInstance:MaskDisplay = null;

        //系统级弹框实例对象
        static private var systemPopUpInstance:BasePopUp=null;

        //模态窗口实例对象
        static private var modalityInstances:Array=[];

        //当前遮罩层的活动数    
        static private var maskActiveCount:int = 0;

        /**
         * 显示一个遮罩层
         * @param style
         */
        static public function mask( target:Display=null, options:Object=null ):Display
        {
            //有指定目标遮罩层就关闭
            if( target )
            {
                maskActiveCount--;
                if( maskActiveCount < 1 )
                {
                    (target as MaskDisplay).fadeOut(); 
                    maskActiveCount = 0;
                }  
                return target;
            }
            var obj:MaskDisplay = maskInstance;
            if( obj == null )
            {
                obj = new MaskDisplay( SystemManage.getBody() );
                obj.style("zIndex", MASK_LEVEL );
                maskInstance = obj;
            }
            if( options )
            {
                obj.options( options );
            }
            maskActiveCount++;
            if( !obj.visible ){
                obj.fadeIn();
            }
            return obj;
        }

        /**
         * 显示系统级的弹框
         * @param instance
         * @param options
         */
        static public function show(target:BasePopUp, isModalWindow:Boolean = false, viewport:IContainer=null )
        {
            count++;
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
                    if( systemPopUpInstance.parent )
                    {
                        (systemPopUpInstance.parent as IContainer).removeChild( systemPopUpInstance );
                    }
                }
                //记录当前指定的实例
                systemPopUpInstance = target;
                level = TOP_LEVEL;
            }

            target.element.style("zIndex", level );

            //如果没有添加则添加到视口中
            if( target.element.parent().isEmpty() )
            {
                viewport.addChild( target );
            }
        }


        /**
         * 激活指定的模态窗口实例
         * @param instance
         */
        static public function active( target:BasePopUp )
        {
            var index:int=0;
            var len:int = modalityInstances.length;
            var at:int = 0;
            for(;index<len;index++)
            {
                 var obj:BasePopUp = modalityInstances[index] as BasePopUp;
                 var skin:IDisplay = target.skin;
                 if( target === obj)
                 {
                     at = index;
                     skin.element.style('zIndex', WINDOW_LEVEL );
                     skin.element.addClass("active");

                 }else
                 {
                     skin.element.style('zIndex', WINDOW_LEVEL - 1 );
                     skin.element.removeClass("active");
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
        static public function close( target:BasePopUp )
        {
            if( count > 0 )
            {
                count--;
            }

            var index:int = modalityInstances.indexOf(target);
            if( index >= 0 )
            {
                var parent:IContainer = target.parent;
                if( parent )
                {
                    parent.removeChild( target );
                }
                modalityInstances.splice(index,1);
                if( modalityInstances.length > 0 )
                {
                    active( modalityInstances[modalityInstances.length-1] as BasePopUp );
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
            "position":"fixed",
            "left":"0px",
            "top":"0px",
            "right":"0px",
            "bottom":"0px",
        }
    };

    //显示时使用的样式及动画配置
    private var _options:Object=null;

    //private
    private var _state:Boolean = false;

    /**
     * 遮罩层构造函数
     */
    public function MaskDisplay( viewport:Element, uid:String = UIDInstance() )
    {
        var elem:Element = new Element(`#popup-mask-${uid}`);
        if( elem.length < 1 ){
           elem = new Element(`<div tabIndex="-1" id="popup-mask-${uid}" />`);
        }
        super( elem );
        this._options = defaultOptions;
        this.style( defaultOptions.style );
        this.visible = false;
        viewport.addChild( this.element );
    }

    //设置遮罩层样式及动画
    public function options( option:Object )
    {
        this._options = Object.merge( true, {}, defaultOptions, option );
    }

    //淡入遮罩层
    public function fadeIn()
    {
        if( !isNaN(this.timeoutId) )
        {
            clearTimeout(this.timeoutId);
            this.timeoutId = NaN;

        }else if( !_state  )
        {
            var animation:Object = defaultOptions.animation as Object;
            if ( animation.fadeIn > 0 )
            {
                this.element.fadeIn( animation.fadeIn, this._options.style.opacity as float );
            }

        }else
        {
            this.element.style("opacity", this._options.style.opacity );
            this.element.style("animation", "none");
        }
         _state = true;
        this.visible = true;
    }

    private var timeoutId:Number = NaN;

    //淡出遮罩层
    public function fadeOut()
    {
        if( _state )
        {
            this._state = false;
            this.timeoutId = setTimeout(function(target:MaskDisplay)
            {
                var animation:Object = defaultOptions.animation as Object;
                var fadeOut:float = animation.fadeOut as float;
                if( animation.fadeOut > 0 )
                {
                    target.element.fadeOut( animation.fadeOut as float, target._options.style.opacity as float);
                }
                setTimeout(function () {
                    target.visible=false;
                    target.element.style("animation", "none");
                }, (fadeOut) * 1000);
                clearTimeout(target.timeoutId);

            },100, this);
        }
    }

}

