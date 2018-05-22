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
    import es.core.Display;
    import es.core.Skin;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.core.SystemManage;
    import es.core.PopUpManage;

    [RunPlatform("client")]
    public abstract class BasePopUp extends SkinComponent
    {
        /**
         * @private
         */
        protected var timeoutId:Number=null;

        /**
         * @private
         */
        protected var options:Object={};

        /**
         * 当前窗体是否在显示状态, true 已显示，反之已关闭
         */
        protected var state:Boolean = false;

        /**
         * 遮罩层实例对象
         */
        protected var maskIntance:Display = null;

        /**
         * 是否关闭窗体。
         * 如果回调函数返回false则不关闭
         * @param type
         */
        public function action( type:String ):Boolean
        {
            var options:Object = this.options;
            if( options.callback )
            {
                if( options.callback( type ) === false ) return false;
                options.callback = null;
            }

            if( this.maskIntance )
            {
                PopUpManage.mask( this.maskIntance );
                this.maskIntance = null;
            }

            if( timeoutId )
            {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            if( options.disableScroll )
            {
                SystemManage.enableScroll();
            }

            var animation:Object = options.animation;
            var skin:Skin = this.skin;
            if( this.state && animation && animation.enabled )
            {
                var fadeOut:Object = animation.fadeOut;
                skin.style("animation", fadeOut.name+" "+fadeOut.duration+"s "+fadeOut.timing+" "+fadeOut.delay+"s "+fadeOut.fillMode);
                setTimeout(function () {
                    skin.visible=false;
                }, (fadeOut.delay+fadeOut.duration)*1000);

            }else{
                skin.visible=false;
            }
            this.state = false;
            return true;
        }

        /**
         * 设置窗体的位置
         */
        protected function position(offsetX:int, offsetY:int, horizontal:String="center", vertical:String="middle" )
        {
            var win:Element = SystemManage.getWindow();
            var skin:Skin = this.skin;
            switch ( horizontal )
            {
                case "left" :
                    skin.left = offsetX;
                    break;
                case "right" :
                    skin.left = offsetX+( win.width() - skin.width );
                    break;
                default :
                    skin.left = offsetX+( win.width() - skin.width ) / 2;
            }
            switch ( vertical )
            {
                case "top" :
                    skin.top = offsetY+0;
                    break;
                case "bottom" :
                    skin.top = offsetY+( win.height() - skin.height );
                    break;
                default :
                    skin.top = offsetY+( win.height() - skin.height ) / 2;
            }
        }

        //引用窗体中皮肤按扭的属性名
        private var actionButtons:Array = ["cancel","submit","close"];

        /**
         * @override
         * @return Boolean
         */
        override protected function initializing()
        {
            super.initializing();
            var skin:Skin = this.skin;
            var buttons:Array = this.actionButtons;
            var i:int=0;
            var len:int = buttons.length;
            var self:es.core.BasePopUp = this;
            for(;i<len;i++)
            {
                var name:String = buttons[i] as String;
                if( name in skin )
                {
                    var btn:Skin = skin[name] as Skin;
                    btn.addEventListener(MouseEvent.CLICK, (function (actionName:String) {
                        return function (e:MouseEvent) {
                            self.action(actionName);
                        };
                    })(name));
                }
            }
        }

        /**
         * 显示弹窗
         * @param options
         * @returns {PopUp}
         */
        protected function show( options:Object={} , isModalWindow:Boolean=false):es.core.BasePopUp
        {
            this.options  = options;
            this.state    = true;

            //启用背景遮罩
            if( options.mask === true )
            {
                maskIntance = PopUpManage.mask( null, options.maskStyle );
            }

            //禁用滚动条
            if( options.disableScroll )
            {
                SystemManage.disableScroll();
            }
            return this;
        }

        override public function display():Element
        {
            var options:Object = this.options;
            var elem:Element = super.display();
            var skin:Skin    = this.skin;
            var profile:Object = options.profile;

            if( System.env.platform('IE', 8) )
            {
                skin.style('position','absolute');
            }

            //设置皮肤元素属性
            Object.forEach(profile,function(value:*,prop:String)
            {
                if( prop in skin ){
                    skin[ prop ] = value;
                }
            });

            //应用效果
            elem.show();
            var animation:Object = options.animation;
            var timeout:Number   = options.timeout * 1000;
            if( animation.enabled )
            {
                var fadeIn:Object = animation.fadeIn;
                elem.style("animation", fadeIn.name+" "+fadeIn.duration+"s "+fadeIn.timing+" "+fadeIn.delay+"s "+fadeIn.fillMode);
                timeout = (options.timeout+fadeIn.delay+fadeIn.duration )*1000;
            }

            //定时关闭窗体
            if( options.timeout > 0 )
            {
                var self:es.core.BasePopUp = this;
                timeoutId = setTimeout(function () {
                    self.action("close");
                }, timeout );
            }
            return elem;
        }

        /**
         * 关闭窗体
         */
        public function close():void
        {
            this.action("close");
        }
    }
}
