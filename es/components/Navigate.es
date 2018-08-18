/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

package es.components
{
    import es.components.SkinComponent;

    [Syntax(origin)]
    [Skin("es.skins.NavigateSkin")]
    public class Navigate extends SkinComponent
    {
        function Navigate( componentId:String = UIDInstance() )
        {
            super( componentId );
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

        public function set dataSource(value:DataSource):void
        {
            this._dataSource = value;
        };

        /**
         * 设置数据源
         * @param source
         * @returns {void}
         */
        [Remove(origin,expect=false)]
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

        private var _current:*=0;
        public function get current():*
        {
            return _current;
        }

        public function set current(value:*):void
        {
            _current = value;
        }
    }
}