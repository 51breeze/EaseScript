/*
* Copyright © 2017 EaseScript All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/EaseScript
* @author Jun Ye <664371281@qq.com>
*/
package es.components
{
    import es.components.SkinComponent;
    import es.core.Display;

    [Skin("es.skins.DataGridSkin")]
    public class DataGrid extends SkinComponent
    {
        public function DataGrid()
        {
            super();
        }

        /**
         * @private
         */
        private var _dataSource:DataSource = null;

        /**
         * 获取数据源对象
         * @returns {DataSource}
         */
        public function get dataSource():DataSource
        {
            var dataSource:DataSource = this._dataSource;
            if ( dataSource === null )
            {
                dataSource = new DataSource();
                this._dataSource = dataSource;
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
        private var _columns:Object = {};

        /**
         * @returns {Object}
         */
        public function get columns():Object
        {
            return this._columns;
        };

        /**
         * 设置指定的列名
         * @param columns {'column':'text',...} | "column1,column2,..."
         */
        public function set columns( columns:Object ):void
        {
            this._columns = isString(columns) ? columns.split(',') : columns;
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
        private var _columnProfile:String = 'columns';

        /**
         * @param profile
         * @returns {*}
         */
        public function columnProfile(profile:String=null)
        {
            if (typeof profile === "string")
            {
                this._columnProfile = profile;
                return this;
            }
            return this._columnProfile;
        };

        /**
         * @type {string}
         * @private
         */
        private var _dataProfile:String = 'datalist';

        /**
         * @param profile
         * @returns {*}
         */
        public function dataProfile(profile:String=null)
        {
            if (typeof profile === "string") {
                this._dataProfile = profile;
                return this;
            }
            return this._dataProfile;
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

        /**
         * @prvate
         */
        private var _wheelEnable:Boolean = true;

        [Injection]

        /**
         * 是否启用滚动分页
         * @param value
         */
        public function set wheelEnable( value:Boolean )
        {
            _wheelEnable = value;
        }

        /**
         * 是否启用滚动分页
         * @returns Boolean
         */
        public function get wheelEnable():Boolean
        {
            return _wheelEnable;
        }

        [Injection("es.core.Skin")]

        /**
         * 设置鼠标滚动的目标元素
         * @param value
         */
        public function set wheelTarget( value:Display )
        {
            this.properties.wheelTarget = value;
        }

        /**
         * 获取鼠标滚动的目标元素
         * @returns Boolean
         */
        public function get wheelTarget():Display
        {
            return this.properties.wheelTarget as Display;
        }
    }
}