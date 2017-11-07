/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.Skin;

    public class SkinGroup extends Skin
    {

        public static const CHARSET_GB2312 = 'GB2312';
        public static const CHARSET_GBK    = 'GBK';
        public static const CHARSET_UTF8   = 'UTF-8';

        private var _skinChildren:Array = [];
        private var _skinObject = null;

        /**
         * 皮肤类
         * @constructor
         */
        function SkinGroup(skinObject:Object)
        {
            _skinObject = skinObject;
            super( new Element( document.body ) );
        }

        private function create( skinObject , parent )
        {
            var children:Array = skinObject.children;
            var len = children.length;
            var head:Object = document.documentElement.head;
            for(;len>0;)
            {
                var child = children[--len];
                var name =  child.name.toLowerCase();
                switch ( name )
                {
                    case 'body'   :
                        this._skinChildren = child is Skin ?  child.skinChildren : child.children;
                        break;
                    case 'head'   :
                        this.create( child , head );
                        break;
                    case 'meta'   :
                    case 'link'   :
                    case 'script' :
                    case 'title'  :
                        head.addChild( Element.createElement( Skin.parseSkinObject( child ) ) );
                        break;
                    default :
                        parent.addChild( Element.createElement( Skin.parseSkinObject( child ) ) );
                }
            }
        }

        override protected function createChildren()
        {
            this.create(_skinObject, document.body );
            super.createChildren();
        }

        private var _charset:String = SkinGroup.CHARSET_UTF8;
        public function get charset():String
        {
            return _charset;
        }

        public function set charset(value:String)
        {
            if( value===SkinGroup.CHARSET_UTF8 || value === SkinGroup.CHARSET_GB2312 || value === SkinGroup.CHARSET_GBK )
            {
                _charset = value;
            }
        }

        private var _title:String='';
        public function get title():String
        {
            return _title;
        }

        public function set title(value:String)
        {
            _title = value;
        }

        override public function get name():String
        {
            return 'html';
        }
        override public function set name(value:String){}


        override protected function get skinChildren():Array
        {
            return _skinChildren;
        }
    }
}


