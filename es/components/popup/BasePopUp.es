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
    import es.core.Display;
    import es.core.Skin;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.core.SystemManage;
    import es.events.SkinEvent;
    import es.components.popup.PopUpManage;

    public abstract class BasePopUp extends SkinComponent
    {
        /**
         * @private
         */
        protected var timeoutId:Number=NaN;

        /**
         * @private
         */
        private var _option:Object=null;

        /**
         * 获取弹框选项配置
         */
        public get option():Object
        {
            if( _option === null )
            {
                _option = Object.merge(true,{},PopUpManage.defaultOptions);
            }
            return _option;
        }

        /**
         * 设置弹框选项配置
         */
        public set option(value:Object):void
        {
            _option=Object.merge(true,{},PopUpManage.defaultOptions, value);
        }

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
            var options:Object = this.option;

            if( typeof options["on"+type] === "function" )
            {
               var fn:Function =  options["on"+type] as Function;
               if( fn() === false )
               {
                   return false;
               }
            }
            
            if( options.callback )
            {
                if( options.callback( type ) === false )
                {
                    return false;
                }
            }
            
            if( this.maskIntance )
            {
                PopUpManage.mask( this.maskIntance );
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
                    PopUpManage.close( obj );
                }, (fadeOut.delay+fadeOut.duration)*1000, this );

            }else
            {
                this.state = false;
                skin.visible=false;
                PopUpManage.close( this );
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
            if( !this.state )
            {
                return;
            }

            var opt:Object =  this.option;
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

            //使用排列位置
            SystemManage.getWindow().addEventListener( Event.RESIZE, this.position, false, 0, this);
            this.getContainer().addEventListener(ElementEvent.ADD, this.position,false, 0, this);
            skin.addEventListener( SkinEvent.UPDATE_DISPLAY_LIST, this.position ,false,0, this);

            var main:Container = this.getContainer();
            var opt:Object = this.option;

            //如果是模态框添加鼠标在容器外点击时关闭窗口
            main.removeEventListener(MouseEvent.MOUSE_OUTSIDE);
            main.addEventListener(MouseEvent.MOUSE_OUTSIDE, function (e:MouseEvent)
            {
                if( this.state )
                {
                    if (opt.isModalWindow)
                    {
                        if (opt.clickOutsideClose === true)
                        {
                            this.close();
                        }

                    } else if( this.animationEnd )
                    {
                        this.animationEnd = false;
                        main.element.animation("shake", 0.2);
                        setTimeout(function (target:BasePopUp) {
                            target.animationEnd = true;
                        },300,this);
                    } 
                }
            },false,0,this);

        }

        /**
         * 显示弹窗
         * @param options
         * @returns {PopUp}
         */
        protected function show(options:Object={}):BasePopUp
        {
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
        * @private
        */
        private var _owner:IContainer = null;

        /**
        * 获取一个所属容器
        * @return IContainer
        */
        override public function get owner():IContainer
        {
            if( _owner === null )
            {
                _owner = new Container( SystemManage.getBody() );
            }
            return _owner;
        }

        /**
        * 设置一个所属容器
        * @return IContainer
        */
        override public function set owner(value:IContainer):void
        {
            _owner=value;
        }

        /**
        * @private
        */
        private var _title:* = null;

        /**
        * 设置标题,元素对象或者字符串
        */
        public function set title(value:*):void
        {
            _title = value;
        }

        /**
        * 获取标题
        * @return 元素对象或者字符串
        */
        public function get title():*
        {
            return _title;
        }

        /**
        * 设置一个提交按扭的回调函数。
        */
        public function set onSubmit(value:Function):void
        {
            this.option.onsubmit = value;
        }

        /**
        * 获取一个提交按扭的回调函数。
        */
        public function get onSubmit():Function
        {
            return this.option.onsubmit as Function;
        }

        /**
        * 设置一个取消按扭的回调函数。
        */
        public function set onCancel(value:Function):void
        {
            this.option.oncancel = value;
        }

        /**
        * 获取一个取消按扭的回调函数。
        */
        public function get onCancel():Function
        {
            return this.option.oncancel as Function;
        }

        /**
        * 设置一个关闭按扭的回调函数。
        */
        public function set onClose(value:Function):void
        {
            this.option.onclose = value;
        }

        /**
        * 获取一个关闭按扭的回调函数。
        */
        public function get onClose():Function
        {
            return this.option.onclose as Function;
        }

         /**
         * 设置皮肤对象
         * @inherit
         * @param Skin skinObj
         * @returns {Object}
         */
        override public function set skin( skinObj:Skin ):void
        {
            if( this.initialized )
            {
                var old:Skin = this.skin;
                if( skinObj !== old )
                {
                    if( old )
                    {
                        old.removeEventListener( SkinEvent.UPDATE_DISPLAY_LIST, this.position);
                    }
                    skinObj.addEventListener( SkinEvent.UPDATE_DISPLAY_LIST,this.position ,false,0, this);
                    if( this.state  )
                    {
                        super.skin = skinObj;
                        this.setProfile(); 

                    }else if( old && old.hasEventListener( SkinEvent.UNINSTALL ) )
                    {
                        var uninstall:SkinEvent = new SkinEvent( SkinEvent.UNINSTALL );
                        uninstall.oldSkin = old;
                        uninstall.newSkin = skinObj;
                        old.dispatchEvent( uninstall );
                    }
                }

            }else
            {
                super.skin = skinObj;
            }
        }

        /**
        * 设置组件的属性
        * @return void
        */
        protected function setProfile():void
        {
            var skin:Skin    = this.skin;
            var options:Object = this.option;
            var profile:Object = options.profile as Object;

            if( System.env.platform('IE', 8) )
            {
                skin.style('position','absolute');
            }

            if( _title != null )
            {
                profile.titleText=_title;
            }

            //设置皮肤元素属性
            Object.forEach(profile,function(value:*,prop:String)
            {
                switch(prop)
                {
                    case "currentState" :
                       skin.currentState = value as String;
                       break;
                    case "content" :
                       if( value ){
                          skin.children = value instanceof Array ? value : [value];
                       }
                    default :
                       skin.assign(prop, value);
                }

            },this);

            if( options.width > 0 )
            {
                skin.width = options.width as uint;
            }

            if( options.height > 0 )
            {
                skin.height = options.height as uint;
            }

            this.position();
        }

        /**
         * @inherit
         * @return
         */
        override public function display():Element
        {
            var elem:Element = super.display();
            var skin:Skin = this.skin;
            var options:Object = this.option;
            this.setProfile();

            //应用效果
            elem.show();
            
            var container:Container = this.getContainer();
            var animation:Object = options.animation as Object;
            var timeout:Number   = options.timeout * 1000;
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
                timeoutId = setTimeout(function (obj:BasePopUp) {
                    obj.action("close");
                }, timeout ,this);
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
