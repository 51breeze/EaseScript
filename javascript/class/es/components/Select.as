/*
* BreezeJS HttpRequest class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,PaginationEvent,SkinComponent,TypeError,Element,MouseEvent
*/

/**
 * 分页组件.
 * 此组件包含如下特性：
 * 皮肤元素：{info}{firstPage}{prevPage}{hiddenLeft}{links}{hiddenRight}{nextPage}{lastPage}{goto}
 * 动态变量：{totalPage}{totalRows}{rows}{current} （仅限用于info皮肤下）
 *
 * 这些皮肤元素可以自由组合位置和删减以满足各种需求。
 * 此组件支持鼠标单击和鼠标滚动事件，默认为鼠标单击事件
 * 如果同时需要支持两种事件 只需要在 options.eventType 中设置 [MouseEvent.CLICK,MouseEvent.MOUSE_WHEEL] 即可。
 * @param viewport
 * @param context
 * @returns {*}
 * @constructor
 */

package breeze.components
{
    import breeze.components.SkinComponent;
    import breeze.skins.SelectSkin;
    import DataSource;
    import DataSourceEvent;
    import PropertyEvent;

    public class Select extends SkinComponent
    {
        function Select(viewport)
        {
            super(viewport);
        }

        /**
         * 获取皮肤类
         * @returns Class
         */
        override public function get skinClass():Class
        {
            var value=super.skinClass;
            if( value===null )return SelectSkin;
            return value;
        }

        /**
         * @private
         */
        private var __dataSource__=null;

        /**
         * 设置需要要页的数据源
         * @param value
         */
        public function set dataSource( value:DataSource ):void
        {
            var old = this.__dataSource__;
            if( old !== value )
            {
                this.__dataSource__ = value;
                value.addEventListener( DataSourceEvent.SELECT,function (e) {
                    if( !e.waiting )this.skinInstaller();
                },false,0, this);
                if( this.initializeCompleted )
                {

                }
            }
        }

        /**
         * 获取老需要分页的数据源
         * @returns DataSource;
         */
        public function get dataSource():DataSource
        {
            return this.__dataSource__;
        }


        /**
         * 初始化皮肤
         *  @inherit
         * @returns {String}
         */
        override protected function skinInstaller()
        {
            super.skinInstaller();
        }

        override public function display()
        {
            log(" select display");
            super.display();
        }

    }
}