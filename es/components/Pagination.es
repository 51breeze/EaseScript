/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 *
 * 数据分页组件.
 * 此组件包含如下特性：
 * 1、 可以通过鼠标滚轮控制翻页
 * 2、 自动从数据源取数据
 * 3、 可自定义每页要显示的数据行数
 * 4、 可自定义按扭的数目
 *
 * 使用实例
 *  var viewport  = new Container( new Element('body') );
 *  var dataSource = new DataSource();
 *  //dataSource.source='http://working.com/json.php';
 *  dataSource.source = [
 *  {id:"1",phone:'15302662590'},
 *  {id:"2",phone:'15302662590'},
 *  {id:"3",phone:'15302662590'},
 *  {id:"4",phone:'15302662590'},
 *  {id:"5",phone:'15302662590'},
 *  ];
 *  var pagination = new Pagination( viewport );
 *  pagination.dataSource = dataSource;
 *  pagination.wheelTarget = viewport;
 *  pagination.display();
 */
package es.components
{
    import es.core.SkinComponent;
    import es.core.Skin;
    import es.events.PaginationEvent;
    import es.core.Display;
    import es.core.DataSource;
    import es.events.DataSourceEvent;

    [Skin("es.skins.PaginationSkin")]
    public class Pagination extends SkinComponent
    {
        function Pagination(componentId:String = UIDInstance())
        {
            super(componentId);
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
         * 获取分页在地址中的属性名
         * @returns String
         */
        public function get profile():String
        {
            return (this.assign("profile") || "page") as String;
        }

        /**
         * 设置分页在地址中的属性名
         * @returns String
         */
        public function set profile( value:String ):void
        {
            this.assign("profile", value);
            if( this.initialized )
            {
                var curr:int = (int)Locator.query(value, 0);
                if( curr > 0 )
                {
                    this.current = curr;
                }
            }
        }

        /**
         * 设置返回一个回调函数,用来返回一个url地址
         * @param callback
         * @returns {void}
         */
        public function set url( value:* ):void
        {
            this.assign("url", value);
        };

        /**
         * 获取一个返回url地址的回调函数
         * @returns {*}
         */
        public function get url():*
        {
            return this.assign("url");
        };

        /**
         * 获取总分页数
         * @param number totalPage
         * @returns {Number}
         */
        public function get totalPage():int
        {
            var dataSource:DataSource = this.dataSource;
            if( dataSource )
            {
               return dataSource.totalPage || 1;
            }
            return 1;
        };

        /**
         * 获取总数据
         * @returns {Number}
         */
        public function get totalSize():int
        {
            var dataSource:DataSource = this.dataSource;
            if( dataSource )
            {
                return dataSource.totalSize;
            }
            return NaN;
        };

        /**
         * 获取每页显示多少行数据
         * @returns {Number}
         */
        public function get pageSize():int
        {
            var dataSource:DataSource = this.dataSource;
            if( dataSource )
            {
                return dataSource.pageSize;
            }
            return (this.assign("pageSize") || 20) as int;
        };

        public function set pageSize(num:int):void
        {
            this.assign("pageSize",num);
            var dataSource:DataSource = this.dataSource;
            if( dataSource )
            {
                dataSource.pageSize=num;
                if( this.initialized )
                {
                    dataSource.select();
                }
            }
        };

        /**
         * 设置当前需要显示的分页
         * @returns {Number}
         */
        public function get current():int
        {
            return (this.assign("current") || parseInt(Locator.query( this.profile, 1))) as int;
        };

        /**
         * 设置当前需要显示的分页
         * @param num
         */
        public function set current(num:int):void
        {
            var current:int = this.current;
            num = this.totalSize > 0 ? Math.min( Math.max(1, num), this.totalPage ) : num;
            if( num !== current && !isNaN(num) )
            {
                this.assign("current",num);
                if( this.initialized )
                {
                    var event:PaginationEvent = new PaginationEvent(PaginationEvent.CHANGE);
                    event.oldValue = current;
                    event.newValue = num;
                    event.url =this.getUrlFactor( num, this.profile );

                    if( this.dispatchEvent(event) )
                    {
                        if( !this.jumpUrl )
                        {
                            this.dataSource.select( num );
                        }
                    }
                }
            }
        };

        /**
         * 获取分页的按扭数
         * @returns {Number}
         */
        public function get link():int
        {
            return (this.assign("link") || 7) as int;
        }

        /**
         * 设置分页的按扭数
         * @returns {void}
         */
        public function set link( num:int ):void
        {
            this.assign("link",num);
        }

         /**
         * 是否需要跳转地址
         * @returns {void}
         */
        public function get jumpUrl():Boolean
        {
            return !!this.assign("jumpUrl");
        }

         /**
         * 是否需要跳转地址
         * @returns {void}
         */
        public function set jumpUrl(value:Boolean):void
        {
            this.assign("jumpUrl",value);
        }

        /**
         * 获取侦听鼠标滚轮事件的目标对象,用于实现异步加载分页
         * 此方法只对异步执行的组件起作用
         * @returns {Display};
         */
        public function get wheelTarget():Object
        {
            return this.assign("wheelTarget") as Object;
        }

        /**
         * 设置鼠标滚轮事件的目标对象,用于实现异步加载分页
         * 此方法只对异步执行的组件起作用
         * @param Display value
         */
        public function set wheelTarget( value:Object )
        {
            var old:Object = this.assign("wheelTarget") as Object;
            if( old !== value && value )
            {
                this.assign("wheelTarget", value);
                when(RunPlatform(client))
                {
                    if (old)
                    {
                        (new EventDispatcher( old )).removeEventListener(MouseEvent.MOUSE_WHEEL);
                    }
                    
                    (new EventDispatcher( value )).addEventListener(MouseEvent.MOUSE_WHEEL, function (e: MouseEvent) {
                        e.preventDefault();
                        if( !this.jumpUrl ) 
                        {
                            var page: int = this.current;
                            page = e.wheelDelta > 0 ? page + 1 : page - 1;
                            this.current = page;
                        }
                    }, false, 0, this);
                }
            }
        }

        /**
         * @inherit
         */
        override protected function commitProperties()
        {
            super.commitProperties();
            if( !this.dataSource.selected() )
            {
               this.dataSource.select( this.current );
            }
        }

        /**
         * 组合url地址
         * @returns {String}
         */
        private function getUrlFactor(page:int, profile:String):String
        {
            var linkUrl:* = this.url;
            if( linkUrl )
            {
                if( linkUrl instanceof Function )
                {
                    return linkUrl(page,profile) as String;
                }
                return linkUrl.indexOf('?') >= 0 ? linkUrl + '&'+profile+'=' + page : linkUrl + '?'+profile+'=' + page;
            }
            return '?'+profile+'=' + page;
        }

        /**
         * 提交数据到皮肤
         */
        override protected function updateProperties()
        {
            var skin:Skin = this.skin;
            var current:int = this.current;
            var totalPage:int = this.totalPage;
            var pageSize:int = this.pageSize;
            var link:int = this.link;
            var offset:Number = Math.max(current - Math.ceil(link / 2), 0);
            offset = (offset + link) > totalPage ? offset - ( offset + link - totalPage ) : offset;
            skin.assign('totalPage', totalPage);
            skin.assign('pageSize', pageSize );
            skin.assign('offset',  (current - 1) * pageSize );
            skin.assign('profile', this.profile );
            skin.assign('urlFactor', skin.assign('urlFactor') || this.getUrlFactor.bind(this) );
            skin.assign('current', current);
            skin.assign('first', 1);
            skin.assign('prev', Math.max(current - 1, 1));
            skin.assign('next', Math.min(current + 1, totalPage));
            skin.assign('last', totalPage);
            skin.assign('linkBtn', System.range( Math.max(1 + offset, 1 ), link + offset, 1) );
        }
    }
}