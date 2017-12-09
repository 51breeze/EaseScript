/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{

import es.core.Container;
import es.interfaces.IDisplay;
import es.skins.PopUpSkin;
    import es.core.Skin;

    public static class PopUp
    {
        private var _getInstanceSkin:Skin = null;
        private function getInstance()
        {
              if( _getInstanceSkin===null )
              {
                  _getInstanceSkin = new PopUpSkin();
                  _getInstanceSkin.skinInstaller();
              }
              return _getInstanceSkin;
        }

        private var container:Container=null;

        private function show()
        {
            if( container === null )
            {
                container =  new Container( Element(document.body) );
            }

            container.addChild( getInstance() as IDisplay );
        }

        public function info( title )
        {
            PopUp.show();
        }
    }
}
