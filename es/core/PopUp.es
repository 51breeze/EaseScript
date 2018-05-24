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
        static public var skinClass:Class = null;

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
                "profile":{
                    "currentState":"confirm",
                    "bodyContent":message
                }
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
                    "currentState":"confirm",
                    "titleText":title,
                    "bodyContent":content,
                }
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
         * @override
         * @return Boolean
         */
        override public function display():Element
        {
            var flag:Boolean = this.initialized;
            var elem:Element = super.display();
            var opt:Object = this.options;
            if( !flag )
            {
                //设置窗体位置
                if (!isNaN(opt.x) || !isNaN(opt.y)) {
                    elem.left(opt.x >> 0);
                    elem.top(opt.y >> 0);

                } else {
                    var self:PopUp = this;
                    SystemManage.getWindow().addEventListener(Event.RESIZE, function (e:Event) {
                        self.position(opt.offsetX, opt.offsetY, opt.horizontal, opt.vertical);
                    });
                    this.position(opt.offsetX, opt.offsetY, opt.horizontal, opt.vertical);
                }
            }
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
    }
}
