/*
* BreezeJS HttpRequest class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,DataSource,DataSourceEvent,SkinComponent,PaginationEvent,Element,Skin
*/

/**
 * 数据渲染器
 * @returns {DataGrid}
 * @inherit Template
 * @constructor
 */

package breeze.components
{
    import breeze.components.SkinComponent;
    import breeze.events.PaginationEvent;
    import breeze.components.Pagination;
    import DataSource;
    import DataSourceEvent;
    import breeze.skins.DataGridSkin;

    public class DataGrid extends SkinComponent
    {
        public function DataGrid(viewport)
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
            if( value===null )return DataGridSkin;
            return value;
        }

        /**
         * @private
         */
        private var __dataSource__:DataSource = null;

        /**
         * 获取数据源对象
         * @returns {DataSource}
         */
        public function get dataSource():DataSource
        {
            var dataSource = this.__dataSource__;
            if ( dataSource === null )
            {
                var self = this;
                dataSource = new DataSource();
                dataSource.addEventListener(DataSourceEvent.SELECT, function (event)
                {
                    if ( !event.waiting )
                    {
                        var body = self.skin.getChildById('body');
                        body.variable( self.dataProfile(), event.data );
                        body.createChildren();
                    }
                });
                this.__dataSource__ = dataSource;
            }
            return dataSource;
        };

        /**
         * 设置数据源
         * @param source
         * @returns {void}
         */
        public function set source( data:Object ):void
        {
            this.dataSource.source( data );
        };

        /**
         * 获取数据源
         * @returns {Object}
         */
        public function get source():Object
        {
            return this.dataSource.source();
        };

        /**
         * @private
         */
        private var __columns__:Object = null;

        /**
         * @returns {Object}
         */
        public function get columns():Object
        {
            return this.__columns__;
        };

        /**
         * 设置指定的列名
         * @param columns {'column':'text',...} | "column1,column2,..."
         */
        public function set columns( columns:Object ):void
        {
            this.__columns__ = isString(columns) ? columns.split(',') : columns;
        };

        /**
         * @type {string}
         * @private
         */
        private var __columnProfile__ = 'columns';

        /**
         * @param profile
         * @returns {*}
         */
        public function columnProfile(profile)
        {
            if (typeof profile === "string") {
                this.__columnProfile__ = profile;
                return this;
            }
            return this.__columnProfile__;
        };

        /**
         * @type {string}
         * @private
         */
        private var __dataProfile__ = 'data';

        /**
         * @param profile
         * @returns {*}
         */
        public function dataProfile(profile)
        {
            if (typeof profile === "string") {
                this.__dataProfile__ = profile;
                return this;
            }
            return this.__dataProfile__;
        };

        override protected function initializing():Boolean
        {
            if( super.initializing() )
            {
                var skin = this.skin;
                var body = skin.getChildById('body');
                var head = skin.getChildById('head');
                var pagination = skin.getChildById('pagination');
                body.variable( this.dataProfile(), [] );
                head.variable( this.columnProfile(), this.columns );
                if( pagination )
                {
                    pagination.dataSource = this.dataSource;
                }
                return true;
            }
            return false;
        }

        override public function display()
        {
            super.display();
            var pagination = this.skin.getChildById("pagination");
            if( pagination )
            {
                pagination.display();
            }else
            {
                this.dataSource.select(1);
            }
        };
    }
}