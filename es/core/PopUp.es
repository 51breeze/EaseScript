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
    import es.core.BasePopUp;
    import es.core.Skin;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.skins.PopUpSkin;
    import es.core.SystemManage;
    import es.core.PopUpManage;
    import es.skins.PopUpSkin;

    [Skin(es.skins.PopUpSkin)]
    [RunPlatform("client")]
    public class PopUp extends BasePopUp
    {
        public function PopUp(componentId:String = UIDInstance())
        {
            super(componentId);
        }

        /**
         * @pirvate
         */
        static private var _instance:BasePopUp = null;

        /**
         * 弹框的皮肤类
         */
        static public var skinClass:Class = PopUpSkin;

        /**
         * @private
         * 获取弹框实例对象
         */
        static private function getInstance( skinClass:Class=null ):BasePopUp
        {
            if( !_instance )
            {
                _instance=new PopUp();
                _instance.skinClass = PopUp.skinClass;
            }
            //如果有指定一个新的皮肤类
            if( skinClass && _instance.skinClass !== skinClass )
            {
                _instance.skinClass = skinClass;
            }
            return _instance;
        }

        /**
         * 模态框实例
         */
        static private var modalityInstance:BasePopUp = null;

        /**
         * @private
         * 获取弹框实例对象
         */
        static private function getModalityInstance( skinClass:Class=null ):BasePopUp
        {
            if( !skinClass )skinClass = PopUp.skinClass;
            if( !modalityInstance )
            {
                modalityInstance=new PopUp();
                modalityInstance.skinClass = skinClass;
            }
            //如果有指定一个新的皮肤类
            if( skinClass && modalityInstance.skinClass !== skinClass )
            {
                modalityInstance.skinClass = skinClass;
            }
            return modalityInstance;
        }

        /**
         * 显示一个无样式的弹出框
         * @param message
         * @param options
         * @return {PopUp}
         */
        static public function box( message:String ,options:Object={}):BasePopUp
        {
            return getInstance( options.skinClass ).show( Object.merge(true,{
                "mask":true,
                "disableScroll":false,
                "profile":{
                    "currentState":"tips",
                    "content":message
                },
                "skinStyle":{
                    "background":"none",
                    "borderRadius":"0px",
                    "boxShadow":"none",
                    "border":"none",
                }
            },options) );
        }

        /**
         * 弹出提示框
         * @param title
         * @returns {PopUp}
         */
        static public function tips( message:String ,options:Object={}):BasePopUp
        {
            return getInstance(options.skinClass).show(Object.merge(true,{
                "timeout":2,
                "vertical":"top",
                "profile":{
                    "currentState":"tips",
                    "content":message
                },
                "disableScroll":false
            },options));
        }

        /**
         * 弹出提示框
         * @param title
         * @returns {PopUp}
         */
        static public function title( message:String ,options:Object={}):BasePopUp
        {
            return getInstance(options.skinClass).show(Object.merge(true,{
                "timeout":2,
                "vertical":"top",
                "profile":{
                    "currentState":"title",
                    "content":message
                },
                "disableScroll":false
            },options));
        }

        /**
         * 弹出警告框
         * @param title
         * @returns {PopUp}
         */
        static public function alert( message:String, options:Object={} ):BasePopUp
        {
            return getInstance(options.skinClass).show(Object.merge(true,{
                "mask":true,
                "vertical":"top",
                "profile":{
                    "currentState":"alert",
                    "content":message
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
        static public function confirm(message:String,callback:Function,options:Object={}):BasePopUp
        {
            return getInstance(options.skinClass).show(Object.merge(true,{
                "mask":true,
                "callback":callback,
                "vertical":"top",
                "profile":{
                    "currentState":"confirm",
                    "content":message
                },"offsetY":2
            },options));
        }

        /**
         * 弹出确认对话框
         * @param title
         * @param callback
         * @param options
         * @returns {PopUp}
         */
        static public function modality(title:*,content:*,options:Object={}):BasePopUp
        {
            return getModalityInstance(options.skinClass).show(Object.merge(true,{
                "mask":true,
                "isModalWindow":true,
                "profile":{
                    "currentState":"modality",
                    "titleText":title,
                    "content":content,
                }, "animation":{
                    "fadeIn": {
                        "name":"fadeIn",
                    },
                    "fadeOut": {
                        "name":"fadeOut",
                    }
                },
            },options));
        }

        private var _title:* = "标题";
        public function set title(value:*):void
        {
            _title = value;
        }

        public function get title():*
        {
            return _title;
        }

        public function set onSubmit(value:Function):void
        {
            this.option.onSubmit = value;
        }

        public function get onSubmit():Function
        {
            return this.option.onSubmit;
        }

        public function set onCancel(value:Function):void
        {
            this.option.onCancel = value;
        }

        public function get onCancel():Function
        {
            return this.option.onCancel;
        }

        public function set onClose(value:Function):void
        {
            this.option.onClose = value;
        }

        public function get onClose():Function
        {
            return this.option.onClose;
        }

        /**
         * 显示弹窗
         * @param options
         * @returns {PopUp}
         */
        override protected function show(options:Object={}):BasePopUp
        {
            if( !this.state )
            {
                this.option = options;
                this.display();
            }
            return this;
        }

        /**
         * 获取弹框的容器
         * @return Container
         */
        override protected function getContainer():Container
        {
            return (this.skin as PopUpSkin).mainContainer;
        }

        /**
         * @override
         * @return Boolean
         */
        override public function display():Element
        {
            var opt:Object = this.option;
            if( !this.state ){
                opt = Object.merge(true,PopUpManage.defaultOptions, opt);
                opt.profile.titleText = _title;
                super.show(opt);
                super.display();
                PopUpManage.show(this, opt.isModalWindow as Boolean, this.owner );
            }
            return this.element;
        }

        /**
         * 点击按扭时或者关闭窗口时触发
         * @param type
         * @return
         */
        override public function action(type:String):Boolean
        {
            if( type === "close" )
            {
                PopUpManage.close( this );
            }
            return super.action( type );
        }
    }
}
