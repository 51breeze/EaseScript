/*
* Copyright © 2017 EaseScript All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/EaseScript
* @author Jun Ye <664371281@qq.com>
*/
package es.components
{
    import es.core.SkinComponent;
    import es.components.Pagination;
    import es.core.Display;
    import es.core.Skin;
    import es.core.DataSource;
    import es.events.DataSourceEvent;

    [Skin("es.skins.DataGridSkin")]
    public class DataGrid extends SkinComponent
    {
        public function DataGrid( componentId:String = UIDInstance() )
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
                dataSource= new DataSource();
                this.dataSource = dataSource;
            }
            return dataSource;
        };

         /**
         * 设置数据源对象
         * @param value
         */
        public function set dataSource( value:DataSource ):void
        {
            var old:DataSource = this._dataSource;
            if( old !== value )
            {
                this._dataSource = value;
                var last:int = NaN;
                value.addEventListener( DataSourceEvent.SELECT,(e:DataSourceEvent)=>{
                    if( !e.waiting )
                    {
                        if( last != e.current )
                        {
                            last = e.current;
                            this.assign( "datalist", e.data);
                        }
                    }
                });
            }
        }

        /**
         * 设置数据源
         * @param source
         * @returns {void}
         */
        public function set source( data:* ):void
        {
            this.dataSource.source= data;
        };

        /**
         * 获取数据源
         * @returns {Object}
         */
        public function get source():*
        {
            return this.dataSource.source;
        };

        /**
         * @returns {Object}
         */
        public function get columns():Object
        {
            return this.assign("columns") as Object;
        };

        /**
         * 设置指定的列名
         * @param columns {'column':'text',...} | "column1,column2,..."
         */
        public function set columns( columns:Object ):void
        {
            this.assign("columns", isString(columns) ? columns.split(',') : columns );
        };

        /**
         * 每页显示数据的行数
         * @param value
         */
        public function set current( value:int ):void
        {
            this.assign("current", value);
        }

        /**
         * 每页显示数据的行数
         * @param value
         */
        public function get current():int
        {
            return this.assign( "current") as int;
        }

        /**
         * 每页显示数据的行数
         * @param value
         */
        public function set pageSize( value:int ):void
        {
            this.dataSource.pageSize = value;
        }

        /**
         * 每页显示数据的行数
         * @param value
         */
        public function get pageSize():int
        {
            return this.dataSource.pageSize;
        }

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set rowHeight(value:int):void
        {
            this.assign("rowHeight", value);
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get rowHeight():int
        {
            return this.assign("rowHeight") as int;
        }

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set headHeight(value:int):void
        {
            this.assign("headHeight", value);
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get headHeight():int
        {
            return this.assign("headHeight") as int;
        }

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set footHeight(value:int):void
        {
            this.assign("footHeight", value);
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get footHeight():int
        {
            return this.assign("footHeight") as int;
        }

        private var _footer:Array = null;
        public function set footer( value:Array ):void
        {
            this._footer=value;
            this.nowUpdateSkin();
        }

        public function get footer():Array
        {
            if( _footer === null )
            {
                this._footer = [ this.pagination ];
            }
            return this._footer;
        }

        /**
        * 获取分显示组件
        * @return {Pagination}
        */
        private var _pagination:Pagination=null;

        public function get pagination():Pagination
        {
            var page:Pagination = this._pagination;
            if( !page )
            {
               page = new Pagination();
               page.skinClass = es.skins.PaginationSkin;
               page.dataSource = this.dataSource;
               this._pagination = page;
            }
            return page;
        }

        /**
        * 设置分显示组件
        * @param value Pagination
        */
        public function set pagination( value:Pagination ):void
        {
            var page:Pagination = this._pagination;
            if( value !== page )
            {
                this._pagination = value;
                this.nowUpdateSkin();
            }
        }

        /**
         * @override
         */
        override protected function commitProperties()
        {
            super.commitProperties();
            if( !this.dataSource.selected() )
            {
               this.dataSource.select( this.pagination.current );
            }
        }
    }
}