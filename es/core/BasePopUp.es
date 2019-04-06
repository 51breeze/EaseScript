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
        protected var timeoutId:Number=NaN;

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

        //动画是否完成
        protected var animationEnd:Boolean = true;

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

            if( !isNaN( timeoutId ) )
            {
                clearTimeout(timeoutId);
                timeoutId = NaN;
            }

            if( options.disableScroll )
            {
                SystemManage.enableScroll();
            }
            
            var animation:Object = options.animation as Object;
            var skin:Skin = this.skin;
            if( this.state && animation && animation.enabled )
            {
                var container:Container = this.getContainer();
                var fadeOut:Object = animation.fadeOut as Object;
                this.animationEnd = false;
                container.style("animation", fadeOut.name+" "+fadeOut.duration+"s "+fadeOut.timing+" "+fadeOut.delay+"s "+fadeOut.fillMode);
                setTimeout(function (obj:BasePopUp) {
                    skin.visible=false;
                    obj.state = false;
                    obj.animationEnd = true;
                }, (fadeOut.delay+fadeOut.duration)*1000, this );

            }else
            {
                this.state = false;
                skin.visible=false;
            }
            return true;
        }

        /**
         * 获取弹框的容器
         * @return Object
         */
        protected function getContainer():Container
        {
            return this.skin;
        }

        /**
         * 设置窗体的位置
         */
        protected function position()
        {
            var opt:Object =  this.options;
            var horizontal:String = opt.horizontal as String;
            var vertical:String = opt.vertical as String;
            var skin:Container = this.getContainer();

            //设置弹框水平位置
            if( typeof opt.x ==="string" && opt.x.slice(-1) ==="%"  || !isNaN(opt.x) )
            {
                skin.style("left", opt.x );
                horizontal = '';
            }

            //设置弹框垂直位置
            if( typeof opt.y ==="string" && opt.y.slice(-1) ==="%" || !isNaN(opt.y) )
            {
                skin.style("top", opt.y );
                vertical = '';
            }

            var offsetX:int = (int)opt.offsetX;
            var offsetY:int = (int)opt.offsetY;
            var win:Element = SystemManage.getWindow();
            var winX:int =  win.width();
            var winY:int =  win.height();
            switch ( horizontal )
            {
                case "left" :
                    skin.left = Math.max(offsetX,0);
                    break;
                case "right" :
                    skin.left = getMaxAndMin(offsetX+( winX - skin.width ),winX, skin.width);
                    break;
                case "center" :
                    skin.left = getMaxAndMin( offsetX+( winX - skin.width ) / 2, winX, skin.width );
                    break;
            }

            switch ( vertical )
            {
                case "top" :
                    skin.top = Math.max(offsetY,0);
                    break;
                case "bottom" :
                    skin.top =  getMaxAndMin( offsetY+( winY - skin.height ) , winY, skin.height );
                    break;
                case "middle" :
                    skin.top = getMaxAndMin( offsetY+( winY - skin.height ) / 2, winY,  skin.height );
                    break;
            }
        }

        //返回给定窗口大小范围内的值
        private function getMaxAndMin( val:int, winSize:int,  skinSize:int ):int
        {
            return Math.max( Math.max( val , 0 ),  Math.min(val, winSize-skinSize)  );
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
                    var btn:EventDispatcher = new EventDispatcher( skin[name] );
                    btn.addEventListener(MouseEvent.CLICK, (function (actionName:String) {
                        return function (e:MouseEvent) {
                            self.action(actionName);
                            e.stopPropagation();
                        };
                    })(name));
                }
            }

            //使用排列位置
            SystemManage.getWindow().addEventListener( Event.RESIZE, this.position, false, 0, this);
            skin.addEventListener(ElementEvent.ADD, this.position,false, 0, this);

        }

        /**
         * 显示弹窗
         * @param options
         * @returns {PopUp}
         */
        protected function show( options:Object={} , isModalWindow:Boolean=false):es.core.BasePopUp
        {
            options.isModalWindow = isModalWindow;
            this.options  = options;
            this.state    = true;

            //禁用滚动条
            if( options.disableScroll )
            {
                SystemManage.disableScroll();
            }

            //启用背景遮罩
            if( options.mask === true )
            {
                maskIntance = PopUpManage.mask( null, options.maskStyle );
            }
            return this;
        }

        /**
         * @inherit
         * @return
         */
        override public function display():Element
        {
            var elem:Element = super.display();
            var options:Object = this.options;
            var skin:Skin    = this.skin;
            var profile:Object = options.profile as Object;
            if( System.env.platform('IE', 8) )
            {
                skin.style('position','absolute');
            }

            //应用效果
            elem.show();

            //设置皮肤元素属性
            Object.forEach(profile,function(value:*,prop:String)
            {
                if( prop in skin ){
                    skin[ prop ] = value;
                }
            });

            var container:Container = this.getContainer();
            var animation:Object = options.animation as Object;
            var timeout:Number   = options.timeout * 1000;
            var self:es.core.BasePopUp = this;
            if( animation.enabled && !animation.running )
            {
                this.animationEnd = false;
                var fadeIn:Object = animation.fadeIn as Object;
                container.style("animation", fadeIn.name+" "+fadeIn.duration+"s "+fadeIn.timing+" "+fadeIn.delay+"s "+fadeIn.fillMode);
                timeout = (options.timeout+fadeIn.delay+fadeIn.duration )*1000;
                setTimeout(function (obj:BasePopUp) {
                   obj.animationEnd= true;
                }, timeout , this );
            }

            //定时关闭窗体
            if( options.timeout > 0 )
            {
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
