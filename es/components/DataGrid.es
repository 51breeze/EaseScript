/*
* Copyright © 2017 EaseScript All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/EaseScript
* @author Jun Ye <664371281@qq.com>
*/
package es.components
{
    import es.components.SkinComponent;
    public class DataGrid extends SkinComponent
    {
        public function DataGrid()
        {
            super();
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
                dataSource = new DataSource();
                this.__dataSource__ = dataSource;
            }
            return dataSource;
        };

        /**
         * 设置数据源
         * @param source
         * @returns {void}
         */
        public function set source( data:* ):void
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
        private var __columns__:* = {};

        /**
         * @returns {Object}
         */
        public function get columns():*
        {
            return this.__columns__;
        };

        /**
         * 设置指定的列名
         * @param columns {'column':'text',...} | "column1,column2,..."
         */
        public function set columns( columns:* ):void
        {
            this.__columns__ = isString(columns) ? columns.split(',') : columns;
        };

        /**
         * 每页显示数据的行数
         * @param value
         */
        public function set rows( value:Number ):void
        {
            this.dataSource.pageSize( value );
        }

        /**
         * 每页显示数据的行数
         * @param value
         */
        public function get rows():Number
        {
            return this.dataSource.pageSize();
        }

        /**
         * @type {string}
         * @private
         */
        private var __columnProfile__ = 'columns';

        /**
         * @param profile
         * @returns {*}
         */
        public function columnProfile(profile=null)
        {
            if (typeof profile === "string")
            {
                this.__columnProfile__ = profile;
                return this;
            }
            return this.__columnProfile__;
        };

        /**
         * @type {string}
         * @private
         */
        private var __dataProfile__ = 'datalist';

        /**
         * @param profile
         * @returns {*}
         */
        public function dataProfile(profile=null)
        {
            if (typeof profile === "string") {
                this.__dataProfile__ = profile;
                return this;
            }
            return this.__dataProfile__;
        };

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
         * @private
         */
        private var _rowHeight:Number = 25;

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set rowHeight(value:Number):void
        {
            _rowHeight = value;
            commitPropertyAndUpdateSkin();
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get rowHeight():Number
        {
            return _rowHeight;
        }

        /**
         * @private
         */
        private var _headHeight:Number = 30;

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set headHeight(value:Number):void
        {
            _headHeight = value;
            commitPropertyAndUpdateSkin();
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get headHeight():Number
        {
            return _headHeight;
        }

        /**
         * @private
         */
        private var _footHeight:Number = 30;

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set footHeight(value:Number):void
        {
            _footHeight = value;
            commitPropertyAndUpdateSkin();
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get footHeight():Number
        {
            return _footHeight;
        }
    }
}