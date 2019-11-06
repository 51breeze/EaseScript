/*
* Copyright © 2017 EaseScript All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/EaseScript
* @author Jun Ye <664371281@qq.com>
*/
package es.components
{
    import es.core.SkinComponent;
    import es.skins.EditableSkin;

    public class Editable extends SkinComponent
    {
        public function Editable()
        {
            super();
        }

        /**
         * 获取皮肤类
         * @returns Class
         */
        override public function get skinClass():Class
        {
            var value:Class=super.skinClass;
            if( value===null )return EditableSkin;
            return value;
        }

        /**
         * @private
         */
        private var _radius:Number = 5;

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set radius(value:Number):void
        {
            _radius = value;
            commitPropertyAndUpdateSkin();
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get radius():Number
        {
            return _radius;
        }

        /**
         * @pirvate
         */
        private var _target:Element=null;

        /**
         * 获取指定需要编辑的目标对象
         */
        public function get target():Element
        {
            return _target;
        }

        /**
         * 设置指定需要编辑的目标对象
         */
        public function set target(value:Element):void
        {
            _target=value;
        }

        /**
         * @pirvate
         */
        private var _mask:Boolean=false;

        /**
         * 获取指定需要编辑时的遮罩层
         */
        public function get mask():Boolean
        {
            return _mask;
        }

        /**
         * 设置指定需要编辑时的遮罩层
         */
        public function set mask(value:Boolean):void
        {
            _mask=value;
        }
    }
}