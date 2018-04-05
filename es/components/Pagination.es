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
    import es.components.SkinComponent;
    import es.core.Skin;
    import es.events.PaginationEvent;
    import es.core.Display;

    public class Pagination extends SkinComponent
    {
        function Pagination()
        {
            super();
        }

        /**
         * @private
         */
        private var _dataSource=null;

        /**
         * 设置需要要页的数据源
         * @param value
         */
        public function set dataSource( value:DataSource ):void
        {
            var old = this._dataSource;
            if( old !== value )
            {
                this._dataSource = value;
                value.addEventListener( DataSourceEvent.SELECT,function (e) {
                    if( !e.waiting )this.skinInstaller();
                },false,0, this);
                if( this.initializeCompleted )
                {
                    value.select( this.current );
                }
            }
        }

        /**
         * 获取老需要分页的数据源
         * @returns DataSource;
         */
        public function get dataSource():DataSource
        {
            return this._dataSource;
        }

        /**
         * @private
         */
        private var _profile='page';

        /**
         * 获取分页在地址中的属性名
         * @returns String
         */
        public function get profile():String
        {
            return  this._profile;
        }

        /**
         * 设置分页在地址中的属性名
         * @returns String
         */
        public function set profile( value:String ):void
        {
            if( this._profile !== value )
            {
                this._profile = value;
                commitPropertyAndUpdateSkin();
            }
        }

        /**
         * @private
         */
        private var _url='';

        /**
         * 设置返回一个回调函数,用来返回一个url地址
         * @param callback
         * @returns {void}
         */
        public function set url( value ):void
        {
           if( this._url !== value )
           {
               this._url = value;
               this.commitPropertyAndUpdateSkin();
           }
        };

        /**
         * 获取一个返回url地址的回调函数
         * @returns {*}
         */
        public function get url()
        {
            return this._url;
        };

        /**
         * 获取总分页数
         * @param number totalPage
         * @returns {Number}
         */
        public function get totalPage():Number
        {
            var dataSource = this.dataSource;
            if( dataSource )
            {
                return dataSource.totalPage() || 1;
            }
            return 1;
        };

        /**
         * 获取总数据
         * @returns {Number}
         */
        public function get totalSize():Number
        {
            var dataSource = this.dataSource;
            if( dataSource )
            {
                return dataSource.totalSize();
            }
            return NaN;
        };

        /**
         * @private
         */
        private var _pageSize = NaN;

        /**
         * 获取每页显示多少行数据
         * @returns {Number}
         */
        public function get pageSize():Number
        {
            var dataSource = this.dataSource;
            if( dataSource )
            {
                return dataSource.pageSize();
            }
            return this._pageSize;
        };

        public function set pageSize(num:Number):void
        {
            if( this._pageSize !== num )
            {
                this._pageSize = num;
                var dataSource = this.dataSource;
                if( dataSource )
                {
                    dataSource.pageSize( num );
                    if( this.initializeCompleted )
                    {
                        dataSource.select( this.current );
                    }
                }
            }
        };

        /**
         * @private
         */
        private var _current:Number = 1;

        /**
         * 设置当前需要显示的分页
         * @returns {Number}
         */
        public function get current():Number
        {
            var dataSource = this.dataSource;
            if( dataSource && this.initializeCompleted )
            {
                return this.dataSource.current();
            }
            return this._current;
        };

        /**
         * 设置当前需要显示的分页
         * @param num
         */
        public function set current(num:Number):void
        {
            num = isNaN( this.totalSize ) ? num :  Math.min( Math.max(1, num), this.totalPage );
            var current = this._current;
            if( num !== current )
            {
                this._current = num;
                var event = new PaginationEvent(PaginationEvent.CHANGE);
                event.oldValue = current;
                event.newValue = num;
                this.dispatchEvent(event);
                var dataSource = this.dataSource;
                if( dataSource  )dataSource.select( num );
            }
        };

        /**
         * @private
         */
        private var _link:Number = 7;

        /**
         * 获取分页的按扭数
         * @returns {Number}
         */
        public function get link():Number
        {
            return this._link;
        }

        /**
         * 设置分页的按扭数
         * @returns {void}
         */
        public function set link( num:Number ):void
        {
            if( this._link !== num )
            {
                this._link = num;
                commitPropertyAndUpdateSkin();
            }
        }

        /**
         * 初始化皮肤
         *  @inherit
         * @returns {String}
         */
        override protected function skinInstaller()
        {
            var skin = this.skin;
            var render = skin.render;
            var current = this.current;
            var totalPage = this.totalPage;
            var pageSize = this.pageSize;
            var link = this.link;
            var url = this.url;
            var offset = Math.max(current - Math.ceil(link / 2), 0);
            if( typeof url !== "function" )
            {
                var linkUrl = url;
                url = linkUrl.length > 0 ? function(page, profile) {
                    return linkUrl.indexOf('?') >= 0 ? linkUrl + '&'+profile+'=' + page : linkUrl + '?'+profile+'=' + page;
                }:function(page, profile) {
                    return '?'+profile+'=' + page;
                };
            }
            offset = (offset + link) > totalPage ? offset - ( offset + link - totalPage ) : offset;
            render.variable('totalPage', totalPage);
            render.variable('pageSize', pageSize );
            render.variable('offset',  (current - 1) * pageSize );
            render.variable('profile', this.profile );
            render.variable('url', url );
            render.variable('current', current);
            render.variable('first', 1);
            render.variable('prev', Math.max(current - 1, 1));
            render.variable('next', Math.min(current + 1, totalPage));
            render.variable('last', totalPage);
            render.variable('link', System.range( Math.max(1 + offset, 1 ), link + offset, 1) );
            super.skinInstaller();
        }

        /**
         * @private
         */
        private var _wheelTarget;

        /**
         * 获取侦听鼠标滚轮事件的目标对象
         * @returns {Element};
         */
        public function get wheelTarget():Display
        {
            return this._wheelTarget;
        }

        /**
         * 设置侦听鼠标滚轮事件的目标对象
         */
        public function set wheelTarget( value:Display )
        {
            var old = this._wheelTarget;
            if( old  !== value )
            {
                this._wheelTarget = value;
                if (old)old.removeEventListener(MouseEvent.MOUSE_WHEEL);
                if( value )
                {
                    value.addEventListener(MouseEvent.MOUSE_WHEEL, function (e) {
                        e.preventDefault();
                        var page = this.current;
                        this.current = e.wheelDelta > 0 ? page + 1 : page - 1;
                    }, false, 0, this);
                }
            }
        }

        private var _radius=0;
        public function set radius( val:Number ):void
        {
            if( _radius !== val )
            {
                _radius=val;
                commitPropertyAndUpdateSkin();
            }
        }

        public function get radius():Number
        {
            return _radius;
        }

        /**
         * @inherit
         */
        override protected function initializing()
        {
            if( super.initializing() )
            {
                var dataSource:DataSource = _dataSource;
                if( !dataSource )throw new ReferenceError('dataSource is not defined');
                var size = pageSize;
                if( !isNaN(size) )
                {
                    dataSource.pageSize(size);
                }
                var profile = new RegExp( this.profile+'\\s*=\\s*(\\d+)');
                var self = this;
                this.skin.addEventListener(MouseEvent.CLICK, function (e:MouseEvent)
                {
                    if (Element.getNodeName(e.target) === 'a')
                    {
                        e.preventDefault();
                        var url:String = Element(e.target).property('href');
                        var _profile:Array = url.match(profile);
                        var page:Number = parseInt(_profile ? _profile[1] : 0);
                        if (page > 0)
                        {
                            self.current = page;
                        }
                    }
                });
                return true;
            }
            return false;
        }

        override public function display()
        {
            if( !super.display() )
            {
                this.dataSource.select( this.current );
            }
        }
    }
}