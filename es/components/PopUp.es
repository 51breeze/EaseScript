/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.components
{
    import es.core.SkinComponent;
    import es.core.Container;
    import es.core.Skin;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.core.SystemManage;
    import es.components.popup.PopUpManage;
    import es.components.popup.BasePopUp;
    import es.skins.PopUpSkin;
    import es.events.SkinEvent;

    [Skin(es.skins.PopUpSkin)]
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
            if( !skinClass )skinClass = PopUpSkin;
            if( !_instance )
            {
                _instance=new PopUp();
                _instance.skinClass = skinClass;
                (_instance as PopUp)._type = "box";
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
            if( !skinClass )skinClass = PopUpSkin;
            if( !modalityInstance )
            {
                modalityInstance=new PopUp();
                modalityInstance.skinClass = skinClass;
                (modalityInstance as PopUp)._type = "modality";
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
                "mask":false,
                "isModalWindow":false,
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
                "mask":false,
                "isModalWindow":false,
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
                "isModalWindow":false,
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
                "isModalWindow":false,
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

        private var _type:String="box";

        
        /**
         * 显示弹窗
         * @param options
         * @returns {PopUp}
         */
        override protected function show(options:Object={}):BasePopUp
        {
            this.option = options;
            this.display();
            return this;
        }

        /**
         * 获取弹框的容器
         * @return Container
         */
        override protected function getContainer():Container
        {
            return (this.skin as PopUpSkin).popupContainer;
        }

        override protected function initializing()
        {
            super.initializing();
            var skin:Skin = this.skin;
            skin.addEventListener( SkinEvent.UNINSTALL,function(e:SkinEvent)
            {
                if( this._type ==="box" )
                {
                    PopUp._instance = null;
                }else
                {
                    PopUp.modalityInstance = null;   
                }

            } ,false,0,this);

        }
       
        /**
         * @override
         * @return Boolean
         */
        override public function display():Element
        {
            if( !this.state )
            {
                var opt:Object = this.option;
                super.show(opt);
                super.display();
                PopUpManage.show(this, opt.isModalWindow as Boolean, this.owner);
            }
            return this.element;
        }
    }
}
