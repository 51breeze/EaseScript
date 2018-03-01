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
                self.action("close");
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
           // skin.style("animation", "fadeIn "+duration+"s ease-in 0s forwards" );

            skin.element.animation("fadeIn", duration);

            skin.element.addEventListener(Event.ANIMATION_START,function (e) {

                log("animation START");

                skin.element.removeEventListener(Event.ANIMATION_START);

            });


            var self = this;
            timeoutId = setTimeout(function () {
                skin.style("animation", "fadeOut "+(duration)+"s linear 0s forwards" );
                setTimeout(function () {
                    self.action("close");
                }, duration*1000+100 );
            },(delay + duration)*1000 );
        }

        /**
         * 是否关闭窗体。
         * 如果回调函数返回false则不关闭
         * @param type
         */
        public function action(type:String )
        {
            if( callback && callback( type ) === false )
            {
                return false;
            }
            if( maskInstance )maskInstance.hide();
            if( timeoutId )clearTimeout(timeoutId);
            skin.visible=false;
            enableScroll();
            callback = null;
            return true;
        }

        protected function position( options={} )
        {
            var skin = this.skin;
            var win = getWindow();
            var resize = function (e) {
                skin.left= ( win.width() - skin.width ) / 2;
                skin.top= ( win.height() - skin.height ) / 2;
            };
            win.addEventListener(Event.RESIZE, resize);
            resize();
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
                                self.action(name);
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
        static public const MASK_LEVEL = 99900;

        /**
         * 窗口容器的显示层级
         */
        static public const WINDOW_LEVEL = 99910;

        /**
         * 系统弹窗的顶级层级
         */
        static public const TOP_LEVEL = 99999;

        /**
         * 遮罩层实例对象
         */
        static private var maskInstance:Element=null;

        static private var _win:Element;
        static private function getWindow():Element
        {
            if( !_win )_win = new Element(window);
            return _win;
        }

        static private var _root:Element;
        static private function getRoot():Element
        {
            if( !_root )_root = new Element(document.body);
            return _root;
        }

        static private var _disableScroll=false;
        static private function disableScroll()
        {
            var root  = getRoot();
            _disableScroll = true;
            root.style("overflowX", "hidden");
            root.style("overflowY", "hidden");
        }

        static private function enableScroll()
        {
            if( _disableScroll===true )
            {
                _disableScroll = false;
                var root  = getRoot();
                root.style("overflowX", "auto");
                root.style("overflowY", "auto");
            }
        }

        /**
         * 显示一个遮罩层
         * @param style
         */
        static public function mask( style:Object={} )
        {
            if( maskInstance === null )
            {
                style.zIndex = MASK_LEVEL;
                style = Object.merge({
                    "backgroundColor":"#000000",
                    "opacity":0.7,
                    "width":"100%",
                    "height":"100%",
                    "position":"absolute",
                    "left":"0px",
                    "top":"0px",
                },style);

                var win = getWindow();
                var root  = getRoot();
                var elem:Element = new Element('<div />');
                elem.style( style );
                root.addChild(elem);
                win.addEventListener( Event.RESIZE ,function (e){
                    var height = win.height();
                    elem.height( height + Math.max( win.scrollHeight()-height,0) );
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
            options =  Object.merge(true,{"profile":{"titleText":"提示","bodyContent":message},"disableScroll":true}, options) as JSON;
            var popup:PopUp = instance;
            if( popup ){
                popup.action('close');
            }
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
            skin.style('zIndex',TOP_LEVEL);
            if( System.env.platform('IE') && System.env.version(8) )
            {
                skin.style('position','absolute');
            }

            popup.display();
            if( options.callback instanceof Function )
            {
                popup.callback =options.callback;
                delete options.callback;
            }

            var animation:JSON = (options.animation || {}) as JSON;
            var mask = options.mask;
            var maskStyle = options.maskStyle||{};
            var position = options.position;
            var profile = options.profile as JSON;
            for( var p in profile )if( p in skin )
            {
                skin[ p ] = profile[p];
            }
            popup.position( position );
            if(mask)PopUp.mask(maskStyle);
            if( options.disableScroll )
            {
                disableScroll();
            }
            if( animation.fadeOut != null ){
                popup.fadeOut( animation.fadeOut , animation.delay );
            }else if( animation.fadeIn != null ){
                popup.fadeIn( animation.fadeIn , animation.delay );
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
            options =  Object.merge(true,{"animation":{"fadeInOut":0.2,"delay":2},"profile":{"currentState":"info"},"disableScroll":false},options);
            return PopUp.show(message, options);
        }

        /**
         * 弹出警告框
         * @param title
         * @returns {PopUp}
         */
        static public function alert( message:String, options:Object={} ):PopUp
        {
            options =  Object.merge({"mask":true,"profile":{"currentState":"alert"}} ,options);
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
            options =  Object.merge({"mask":true,"callback":callback,"profile":{"currentState":"confirm"}},options);
            return PopUp.show(message,options);
        }
    }
}
