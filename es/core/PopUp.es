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

    [RunPlatform("client")]
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
        private var options:Object={};

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
         * 遮罩层实例对象
         */
        static private var maskInstance:Element=null;

        /**
         * 默认配置选项
         */
        static public var defaultOptions:Object={
            "profile":{"titleText":"提示"},
            "disableScroll":false,
            "callback":null,
            "background":null,
            "timeout":0,
            "skinStyle":null,
            "maskStyle":null,
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
         */
        static private var _instance:PopUp = null;

        /**
         * @pirvate
         */
        static private var _win:Element;

        /**
         * @pirvate
         */
        static private function getWindow():Element
        {
            if( !_win )_win = new Element(window);
            return _win;
        }

        /**
         * @pirvate
         */
        static private var _root:Element;

        /**
         * @pirvate
         */
        static private function getRoot():Element
        {
            if( !_root )_root = new Element(document.body);
            return _root;
        }

        /**
         * @pirvate
         */
        static private var _disableScroll:Boolean=false;

        /**
         * 禁用滚动条
         */
        static private function disableScroll()
        {
            var root:Element  = getRoot();
            _disableScroll = true;
            root.style("overflowX", "hidden");
            root.style("overflowY", "hidden");
        }

        /**
         * 启用滚动条
         */
        static private function enableScroll()
        {
            if( _disableScroll===true )
            {
                _disableScroll = false;
                var root:Element  = getRoot();
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
                var win:Element = getWindow();
                var root:Element  = getRoot();
                var elem:Element = new Element('<div />');
                elem.style("cssText", System.serialize(style,"style") );
                root.addChild(elem);
                var resize:Function=function(){
                    var height:Number = win.height();
                    elem.height( height + Math.max( win.scrollHeight()-height,0) );
                };
                win.addEventListener(Event.RESIZE, resize);
                resize();
                maskInstance = elem;
            }
            maskInstance.show();
            return maskInstance;
        }

        /**
         * @public
         * 获取弹框实例对象
         */
        static public function getInstance():PopUp
        {
            //引用实例
            return _instance || (_instance=new PopUp());
        }

        /**
         * 显示一个无样式的弹出框
         * @param message
         * @param options
         * @return {PopUp}
         */
        static public function box( message:String ,options:Object={}):PopUp
        {
            return getInstance().show(Object.merge(true,{
                "mask":true,
                "profile":{
                    "currentState":"tips",
                    "bodyContent":message
                },
                "disableScroll":false,
                "skinStyle":{
                    "background":"none",
                    "borderRadius":"0px",
                    "boxShadow":"none",
                    "border":"none",
                }
            },options));
        }

        /**
         * 弹出提示框
         * @param title
         * @returns {PopUp}
         */
        static public function tips( message:String ,options:Object={}):PopUp
        {
            return getInstance().show(Object.merge(true,{
                "timeout":2,
                "profile":{
                    "currentState":"tips",
                    "bodyContent":message
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
            return getInstance().show(Object.merge(true,{
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
            return getInstance().show(Object.merge(true,{
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
            return getInstance().show(Object.merge(true,{
                "mask":true,
                "callback":callback,
                "profile":{
                    "currentState":"confirm",
                    "bodyContent":message
                }
            },options));
        }

        /**
         * 是否关闭窗体。
         * 如果回调函数返回false则不关闭
         * @param type
         */
        protected function action(type:String , flag:Boolean=false )
        {
            if( callback )
            {
                if( callback( type ) === false ) return false;
                callback = null;
            }
            if( maskInstance )maskInstance.hide();
            if( timeoutId )clearTimeout(timeoutId);
            enableScroll();
            var options:Object = this.options;
            var animation:Object = options.animation;
            var skin:Skin = this.skin;
            if( !flag && animation && animation.enabled )
            {
                var anHidden:Object = animation.hidden;
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
            var opt:Object = this.options;
            var skin:Skin = this.skin;
            var win:Element = getWindow();
            var offsetX:int =(int)opt.offsetX;
            var offsetY:int =(int)opt.offsetY;
            switch ( opt.horizontal )
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
        override protected function initializing()
        {
            super.initializing();
            var skin:Skin = this.skin;
            var bottons:Array = ["cancel","submit","close"];
            var i:int=0;
            var len:int = bottons.length;
            var self:PopUp = this;
            for(;i<len;i++){
                var name:String = bottons[i] as String;
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
            var win:Element = getWindow();
            win.addEventListener(Event.RESIZE,this.position,false,0,this);
            Element(document.body).addChild( skin.element );
        }

        /**
         * 显示弹窗
         * @param options
         * @returns {PopUp}
         */
        private function show(options:Object={}):es.core.PopUp
        {
            //初始化配置
            options = Object.merge(true,{},defaultOptions,options) as JSON;
            if( options.skinClass && options.skinClass instanceof Class )
            {
                this.skinClass = options.skinClass;
            }
            var skin:Skin = this.skin;
            this.action('close', true);
            skin.style('zIndex',TOP_LEVEL);
            if( System.env.platform('IE', 8) )
            {
                skin.style('position','absolute');
            }
            this.callback = options.callback as Function;
            this.options = options;
            var mask:Boolean = (Boolean)options.mask;
            var maskStyle:Object = options.maskStyle||{};
            var profile:Object = options.profile as JSON;

            //初始化皮肤对象
            this.display();

            //设置皮肤元素属性
            Object.forEach(profile,function(value:*,prop:String)
            {
                if( prop in skin )skin[ prop ] = value;
            });

            //设置窗体位置
            if( !isNaN( options.x ) || !isNaN(options.y) )
            {
                skin.left = options.x >> 0;
                skin.top  = options.y >> 0;
            }else
            {
                this.position();
            }

            //设置皮肤样式
            if(options.skinStyle && typeof options.skinStyle ==="object")
            {
                skin.style("cssText", System.serialize(options.skinStyle,"style") );
            }

            //启用背景遮罩
            if(mask)PopUp.mask(maskStyle);

            //禁用滚动条
            if( options.disableScroll )
            {
                disableScroll();
            }

            //应用效果
            skin.visible=true;
            var animation:Object = options.animation;
            var timeout:Number = options.timeout * 1000;
            if( animation.enabled )
            {
                var anShow:Object = animation.show;
                skin.style("animation", anShow.name+" "+anShow.duration+"s "+anShow.timing+" "+anShow.delay+"s "+anShow.fillMode);
                timeout = ( options.timeout+anShow.delay+anShow.duration )*1000;
            }

            //定时关闭窗体
            if( options.timeout > 0 )
            {
                var self:PopUp = this;
                timeoutId = setTimeout(function () {
                    self.action("close");
                }, timeout );
            }
            return this;
        }

        /**
         * 关闭窗体
         */
        public function close()
        {
            this.action("close");
        }
    }
}
