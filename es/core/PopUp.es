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
    import es.core.Skin;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.skins.PopUpSkin;

    public class PopUp extends SkinComponent
    {
        /**
         * @private
         * 触发弹窗按扭后的回调函数
         */
        private var callback:Function;

        /**
         * @override
         */
        override public function get skinClass():Class
        {
            var skinClass = super.skinClass;
            if( !skinClass )skinClass = PopUpSkin;
            return skinClass;
        }

        /**
         *  @override
         */
        override public function get viewport():IContainer
        {
             var _viewport:IContainer = super.viewport;
             if( !_viewport )
             {
                 _viewport =  new Container( Element(document.body) );
                 super.viewport = _viewport;
             }
             return _viewport;
        }

        /**
         * 淡入显示窗体
         * @param duration
         * @param delay
         */
        protected function fadeIn( duration:Number=0 , delay:Number=0):void
        {
            var skin:Skin = this.skin;
            skin.visible  = true;
            skin.style("animation", "fadeIn "+duration+"s linear "+delay+"s forwards" );
        }

        /**
         * 淡出关闭窗体
         * @param duration
         * @param delay
         */
        protected function fadeOut( duration:Number=0.8 , delay:Number=3 ):void
        {
            var skin:Skin = this.skin;
            skin.visible = true;
            skin.style("animation", "fadeOut "+duration+"s linear "+delay+"s forwards" );
            var self = this;
            setTimeout(function () {
                self.close("close");
            },(delay + duration)*1000 );
        }

        /**
         * @private
         */
        private var timeoutId=null;

        /**
         * 淡入淡出窗体
         * @param duration
         * @param delay
         */
        protected function fadeInOut( duration:Number=1, delay:Number=3 ):void
        {
            var skin:Skin = this.skin;
            skin.visible = true;
            skin.style("animation", "fadeIn "+duration+"s linear 0s forwards" );
            var self = this;
            timeoutId = setTimeout(function () {
                skin.style("animation", "fadeOut "+(duration)+"s linear 0s forwards" );
                setTimeout(function () {
                    self.close("close");
                }, duration*1000+100 );
            },(delay + duration)*1000 );
        }

        /**
         * 是否关闭窗体。
         * 如果回调函数返回false则不关闭
         * @param type
         */
        protected function close( type:String )
        {
            if( callback && callback( type ) === false )
            {
                return false;
            }
            if( maskInstance )maskInstance.hide();
            if( timeoutId )clearTimeout(timeoutId);
            skin.visible=false;
            return true;
        }

        /**
         * @override
         * @return Boolean
         */
        override protected function initializing():Boolean
        {
            if( super.initializing() )
            {
                var skin:Skin = this.skin;
                var bottons:Array = ["cancel","submit","close"];
                var i=0;
                var len = bottons.length;
                var self = this;
                for(;i<len;i++){
                    var name:String = bottons[i];
                    if( name in skin )
                    {
                        var btn:Skin = skin[name] as Skin;
                        btn.addEventListener(MouseEvent.CLICK, (function (name) {
                            return function (e:MouseEvent) {
                                self.close(name);
                            };
                        })(name));
                    }
                }
                return true;
            }
            return false;
        }

        /**
         * 遮罩层的显示层级
         */
        static public const MASK_LEVEL = 99990;

        /**
         * 窗口容器的显示层级
         */
        static public const WINDOW_LEVEL = 99995;

        /**
         * 系统弹窗的顶级层级
         */
        static public const TOP_LEVEL = 99999;

        /**
         * 遮罩层实例对象
         */
        static private var maskInstance:Element=null;

        /**
         * 显示一个遮罩层
         * @param style
         */
        static public function mask( style={} )
        {
            if( maskInstance === null )
            {
                style.zIndex = MASK_LEVEL;
                style = Object.merge({
                    "backgroundColor":"#000",
                    "opacity":0.7,
                    "width":"100%",
                    "height":"100%",
                    "position":"absolute",
                    "left":"0px",
                    "top":"0px",
                },style);
                var elem:Element = new Element('<div />');
                var container = new Element(document.body);
                var win = new Element(window);
                elem.style( style );
                container.addChild(elem);
                win.addEventListener( Event.RESIZE ,function (e){
                    var width = win.width();
                    var height = win.height();
                    elem.width( width + Math.max(win.scrollWidth()-width, 0 ) );
                    elem.height( height + Math.max(win.scrollHeight()-height,0) );
                });
                win.dispatchEvent( Event.RESIZE );
                maskInstance = elem;
            }
            maskInstance.show();
            return maskInstance;
        }

        /**
         * @pirvate
         * 弹框实例对象
         */
        static private var instance:PopUp = null;

        /**
         * 显示弹窗
         * @param options
         * @returns {PopUp}
         */
        static public function show(message:String, options:Object={}):PopUp
        {
            options =  Object.merge({"titleText":"提示","bodyContent":message}, options) as JSON;
            var popup:PopUp = instance;
            if( options.skinClass instanceof Class )
            {
                if( popup )
                {
                    popup.viewport.removeChild( popup.skin );
                }
                popup = new PopUp();
                PopUp.instance =popup;
                popup.skinClass = options.skinClass;

            }else if( !popup )
            {
                popup = new PopUp();
                PopUp.instance =popup;
            }
            var skin:Skin = popup.skin;
            popup.callback = null;
            popup.close('close');
            popup.display();
            if( options.callback != null )
            {
                popup.callback = options.callback;
                delete options.callback;
            }

            var animation = options.animation || {};
            var mask = options.mask;
            var maskStyle = options.maskStyle||{};
            delete options.maskStyle;
            delete options.mask;
            delete options.animation;
            for( var p in options )if( p in skin )
            {
                skin[ p ] = options[p];
            }
            if(mask===true)PopUp.mask( maskStyle );
            if( animation.fadeOut != null ){
                popup.fadeOut( animation.fadeOut , animation.delay );
            }else if( animation.fadeIn != null ){
                popup.fadeIn( options.fadeIn , animation.delay );
            }else if( animation.fadeInOut != null ){
                popup.fadeInOut( animation.fadeInOut , animation.delay );
            }else{
                skin.visible = true;
            }
            return popup;
        }

        /**
         * 弹出提示框
         * @param title
         * @returns {PopUp}
         */
        static public function info( message:String ,options:Object={}):PopUp
        {
            options =  Object.merge(true,{"animation":{"fadeInOut":0.2,"delay":2},"currentState":"info"},options);
            return PopUp.show(message, options);
        }

        /**
         * 弹出警告框
         * @param title
         * @returns {PopUp}
         */
        static public function alert( message:String, options:Object={} ):PopUp
        {
            options =  Object.merge({"currentState":"alert","mask":true} ,options);
            return PopUp.show(message,options);
        }

        /**
         * 弹出确认对话框
         * @param title
         * @param callback
         * @param options
         * @returns {PopUp}
         */
        static public function confirm(message:String,callback:Function,options:Object={}):PopUp
        {
            options =  Object.merge({"currentState":"confirm","mask":true,"callback":callback},options);
            return PopUp.show(message,options);
        }
    }
}
