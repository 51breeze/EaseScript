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
    import es.core.Skin;

    public class PopUp extends SkinComponent
    {
        override public function get skinClass():Class
        {
            var skinClass = super.skinClass;
            if( !skinClass )skinClass = PopUpSkin;
            return skinClass;
        }

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

        protected function bindEvent( type:String )
        {
            skin.visible=false;
        }

        override protected function initializing():Boolean
        {
            if( super.initializing() )
            {
                var skin:Skin = this.skin;
                var bottons:Array = ["cancel","submit","close"];
                var i=0;
                var len = bottons.length;
                for(;i<len;i++){
                    var name:String = bottons[i];
                    var btn:Skin = skin[ name ] as Skin;
                    btn.addEventListener(MouseEvent.CLICK,function (e:MouseEvent){
                        this.bindEvent( name );
                    },false,0,this);
                }
                return true;
            }
            return false;
        }

        static private var instanceSkin:PopUp = null;
        static protected function getInstance():PopUp
        {
              if( instanceSkin===null )
              {
                  instanceSkin = new PopUp();
              }
              return instanceSkin;
        }

        static public function show(options={})
        {
            var popUp:PopUp = getInstance() as PopUp;
            for( var p in options )if( p in popUp.skin )
            {
                popUp.skin[ p ] = options[p];
            }
            popUp.skin.visible = true;
            popUp.display();
        }

        static public function info( title )
        {
            PopUp.show({"titleText":title,"currentState":"info"});
        }
    }
}
