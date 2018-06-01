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
    import es.interfaces.IPopUp;
    import es.skins.PopUpSkin;

    [RunPlatform("client")]
    public class PopUp extends BasePopUp  implements IPopUp
    {
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
                    "bodyContent":message
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
        static public function title( message:String ,options:Object={}):BasePopUp
        {
            return getInstance(options.skinClass).show(Object.merge(true,{
                "timeout":2,
                "vertical":"top",
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
        static public function alert( message:String, options:Object={} ):BasePopUp
        {
            return getInstance(options.skinClass).show(Object.merge(true,{
                "mask":true,
                "vertical":"top",
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
        static public function confirm(message:String,callback:Function,options:Object={}):BasePopUp
        {
            return getInstance(options.skinClass).show(Object.merge(true,{
                "mask":true,
                "callback":callback,
                "vertical":"top",
                "profile":{
                    "currentState":"confirm",
                    "bodyContent":message
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
        static public function modality(title:String,content:String,options:Object={}):BasePopUp
        {
            return getModalityInstance(options.skinClass).show(Object.merge(true,{
                "mask":true,
                "profile":{
                    "currentState":"modality",
                    "titleText":title,
                    "bodyContent":content,
                }, "animation":{
                    "fadeIn": {
                        "name":"fadeIn",
                    },
                    "fadeOut": {
                        "name":"fadeOut",
                    }
                },
            },options), true);
        }

        /**
         * 显示弹窗
         * @param options
         * @returns {PopUp}
         */
        override protected function show( options:Object={} , isModalWindow:Boolean=false ):BasePopUp
        {
            super.show( Object.merge(true,{},PopUpManage.defaultOptions,options), isModalWindow );
            PopUpManage.show(this, isModalWindow);
            return this;
        }

        /**
         * 获取弹框的容器
         * @return Skin
         */
        override protected function getContainer():Skin
        {
            return (this.skin as PopUpSkin).container;
        }

        /**
         * @override
         * @return Boolean
         */
        override public function display():Element
        {
            var flag:Boolean = this.initialized;
            var elem:Element = super.display();
            var opt:Object = this.options;
            var self:es.core.PopUp = this;
            var skin:Skin = this.getContainer();

            //如果是模态框添加鼠标在容器外点击时关闭窗口
            skin.removeEventListener(MouseEvent.MOUSE_OUTSIDE);
            skin.addEventListener(MouseEvent.MOUSE_OUTSIDE, function (e:MouseEvent)
            {
                if (opt.isModalWindow )
                {
                    if( opt.clickOutsideClose ===true )
                    {
                        self.close();
                    }

                }else
                {
                    skin.element.animation("shake", 0.2);
                }
            });

            if( !flag )
            {
                 //使用排列位置
                 SystemManage.getWindow().addEventListener( Event.RESIZE, this.position, false, 0, this);
            }
            this.position();
            return elem;
        }

        /**
         * 获取标题
         */
        public function get title():String
        {
            return (this.skin as PopUpSkin).titleText;
        }

        /**
         * 设置标题
         * @param value
         */
        public function set title(value:String):void
        {
            (this.skin as PopUpSkin).titleText = value;
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
