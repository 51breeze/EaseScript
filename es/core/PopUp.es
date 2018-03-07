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
         * @private
         */
        private var timeoutId:Number=null;

        /**
         * @private
         */
        private var options={};

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
         * 是否关闭窗体。
         * 如果回调函数返回false则不关闭
         * @param type
         */
        public function action(type:String , flag )
        {
            if( callback )
            {
                if( callback( type ) === false ) return false;
                callback = null;
            }
            if( maskInstance )maskInstance.hide();
            if( timeoutId )clearTimeout(timeoutId);
            enableScroll();
            var options = this.options;
            var animation = options.animation;
            var skin = this.skin;
            if( !flag && animation && animation.enabled )
            {
                var anHidden = animation.hidden;
                skin.style("animation", anHidden.name+" "+anHidden.duration+"s "+anHidden.timing+" "+anHidden.delay+"s "+anHidden.fillMode);
                setTimeout(function () {
                    skin.visible=false;
                }, (anHidden.delay+anHidden.duration)*1000);

            }else{
                skin.visible=false;
            }
            return true;
        }

        /**
         * 设置窗体的位置
         */
        protected function position()
        {
            var opt = this.options;
            var skin = this.skin;
            var win = getWindow();
            var offsetX = opt.offsetX || 0;
            var offsetY = opt.offsetY || 0;
            switch ( opt.horizontal )
            {
                case "left" :
                    skin.left = offsetX+0;
                break;
                case "right" :
                    skin.left = offsetX+( win.width() - skin.width );
                break;
                default :
                    skin.left = offsetX+( win.width() - skin.width ) / 2;
            }
            switch ( opt.vertical )
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
                    var name:String = bottons[i] as String;
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
                var win = getWindow();
                win.addEventListener(Event.RESIZE,this.position,false,0,this);
                return true;
            }
            return false;
        }

        /**
         * @private
         */
        private var showing = false;

        /**
         * 显示弹窗
         * @param options
         * @returns {PopUp}
         */
        private function show(options:Object={}):es.core.PopUp
        {
            var skin:Skin = this.skin;
            this.action('close', true);
            //初始化配置
            options = Object.merge(true,defaultOptions,options) as JSON;
            skin.style('zIndex',TOP_LEVEL);
            if( System.env.platform('IE', 8) )
            {
                skin.style('position','absolute');
            }
            this.callback = options.callback as Function;
            this.options = options;
            var mask = options.mask;
            var maskStyle = options.maskStyle||{};
            var profile = options.profile as JSON;

            //初始化皮肤对象
            this.display();

            //设置皮肤元素属性
            for( var p in profile )if( p in skin )
            {
                skin[ p ] = profile[p];
            }

            //设置窗体位置
            if( !isNaN( options.x ) || !isNaN(options.y) )
            {
                skin.left = options.x >> 0;
                skin.top  = options.y >> 0;
            }else
            {
                this.position();
            }

            //启用背景遮罩
            if(mask)PopUp.mask(maskStyle);

            //禁用滚动条
            if( options.disableScroll )
            {
                disableScroll();
            }

            //应该效果
            skin.visible=true;
            var animation = options.animation;
            var timeout = options.timeout * 1000;
            if( animation.enabled )
            {
                var anShow = animation.show;
                skin.style("animation", anShow.name+" "+anShow.duration+"s "+anShow.timing+" "+anShow.delay+"s "+anShow.fillMode);
                timeout = ( options.timeout +anShow.delay+anShow.duration )*1000;
            }

            //定时关闭窗体
            if( options.timeout > 0 )
            {
                var self = this;
                timeoutId = setTimeout(function () {
                    self.action("close");
                }, timeout );
            }
            return this;
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
                    "fadeIn":0.2,
                    "width":"100%",
                    "height":"100%",
                    "position":"absolute",
                    "left":"0px",
                    "top":"0px",
                },style);

                if( style.fadeIn>0 )
                {
                    Element.createAnimationStyleSheet("maskFadeIn", {"from":{"opacity":0}, "to": {"opacity":style.opacity}});
                    style.animation="maskFadeIn "+style.fadeIn+"s forwards";
                }

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
         * 默认配置选项
         */
        static public var defaultOptions={
            "profile":{"titleText":"提示"},
            "disableScroll":false,
            "callback":null,
            "timeout":0,
            "animation":{
                "enabled":true,
                "show": {
                    "name":"fadeIn",
                    "duration":0.2,
                    "timing":"linear",
                    "delay":0,
                    "fillMode":"forwards",
                },
                "hidden": {
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
         * @pirvate
         * 弹框实例对象
         */
        static private var _instance:PopUp = null;
        static private function getInstance( options:JSON ):PopUp
        {
            //引用实例
            var popup:PopUp = _instance;
            //指定自定义的皮肤对象
            if( options.skinClass instanceof Class )
            {
                if( popup )
                {
                    popup.viewport.removeChild( popup.skin );
                }
                popup = new PopUp();
                _instance =popup;
                popup.skinClass = options.skinClass;

            }else if( !popup )
            {
                popup = new PopUp();
                _instance =popup;
            }
            return popup;
        }

        /**
         * 弹出提示框
         * @param title
         * @returns {PopUp}
         */
        static public function tips( message:String ,options:Object={}):PopUp
        {
            return getInstance(options).show(Object.merge(true,{
                "timeout":2,
                "profile":{
                    "currentState":"tips",
                    "tipsContent":message
                },
                "disableScroll":false
            },options));
        }

        /**
         * 弹出提示框
         * @param title
         * @returns {PopUp}
         */
        static public function title( message:String ,options:Object={}):PopUp
        {
            return getInstance(options).show(Object.merge(true,{
                "timeout":2,
                "profile":{
                    "currentState":"title",
                    "bodyContent":message
                },
                "disableScroll":false
            },options));
        }

        /**
         * 弹出警告框
         * @param title
         * @returns {PopUp}
         */
        static public function alert( message:String, options:Object={} ):PopUp
        {
            return getInstance(options).show(Object.merge(true,{
                "mask":true,
                "profile":{
                    "currentState":"alert",
                    "bodyContent":message
                }
            } ,options));
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
            return getInstance(options).show(Object.merge(true,{
                "mask":true,
                "callback":callback,
                "profile":{
                    "currentState":"confirm",
                    "bodyContent":message
                }
            },options));
        }
    }
}
