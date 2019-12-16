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
                            this.setAssign( "current", e.current );
                            this.setAssign( "dataList", e.data );
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
         * @returns {Object}
         */
        public function get columns():Object
        {
            return this.getAssign("columns",{}) as Object;
        };

        /**
         * 设置指定的列名
         * @param columns {'column':'text',...} | "column1,column2,..."
         */
        public function set columns( columns:Object ):void
        {
            this.setAssign("columns", isString(columns) ? columns.split(',') : columns );
        };

         /**
         * 获取一组数据
         * @param value
         */
        public function get dataList():Array
        {
            return this.getAssign("dataList", []) as Array;
        }

        /**
         * 每页显示数据的行数
         * @param value
         */
        public function set current( value:int ):void
        {
            this.setAssign("current", value);
            if( !isNullPagination )
            {
                this.pagination.current = value;
            }
        }

        /**
         * 每页显示数据的行数
         * @param value
         */
        public function get current():int
        {
            return this.getAssign("current", NaN ) as int;
        }

        /**
         * 每页显示数据的行数
         * @param value
         */
        public function set rows( value:Number ):void
        {
            this.dataSource.pageSize( value );
            this.setAssign("rows", value);
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
         * 设置表格的圆角值
         * @param value
         */
        public function set rowHeight(value:Number):void
        {
            this.setAssign("rowHeight", value);
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get rowHeight():Number
        {
            return this.getAssign("rowHeight", 25) as Number;
        }

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set headHeight(value:Number):void
        {
            this.setAssign("headHeight", value);
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get headHeight():Number
        {
            return this.getAssign("headHeight",30) as Number;
        }

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set footHeight(value:Number):void
        {
            this.setAssign("footHeight", value);
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get footHeight():Number
        {
            return this.getAssign("footHeight", 30) as Number;
        }

        /**
        * 获取分显示组件
        * @return {Pagination}
        */
        private var _pagination:Pagination=null;
        private var isNullPagination:Boolean=false;
        public function get pagination():Pagination
        {
            if( this.isNullPagination )
            {
                return null;
            }
            
            var page:Pagination = this._pagination;
            if( !page )
            {
               page = new Pagination();
               page.async = false;
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
            this.isNullPagination = value === null;
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
               this.dataSource.select(  !isNullPagination ? this.pagination.current : 1 );
            }
        }
    }
}