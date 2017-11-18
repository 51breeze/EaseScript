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
    import es.skins.PaginationSkin;
    import es.core.Display;

    public class Pagination extends SkinComponent
    {
        function Pagination()
        {
            super();
        }

        /**
         * 获取皮肤类
         * @returns Class
         */
        override public function get skinClass():Class
        {
            var value=super.skinClass;
            if( value===null )return PaginationSkin;
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
            return this.__dataSource__;
        }

        /**
         * @private
         */
        private var __profile__='page';

        /**
         * 获取分页在地址中的属性名
         * @returns String
         */
        public function get profile():String
        {
            return  this.__profile__;
        }

        /**
         * 设置分页在地址中的属性名
         * @returns String
         */
        public function set profile( value:String ):void
        {
            if( this.__profile__ !== value )
            {
                this.__profile__ = value;
                if( this.initializeCompleted )
                {
                    this.skinInstaller();
                }
            }
        }

        /**
         * @private
         */
        private var __url__='';
        private var __callback__=function (page,profile) {
            return '?'+profile+'='+page;
        };

        /**
         * 设置返回一个回调函数,用来返回一个url地址
         * @param callback
         * @returns {void}
         */
        public function set url( value ):void
        {
           if( this.__url__ !== value )
           {
               this.__url__ = value;
               this.__callback__ = value;
               if (typeof value !== "function")
               {
                   this.__callback__ = function (page, profile) {
                       return value.indexOf('?') >= 0 ? value + '&'+profile+'=' + page : value + '?'+profile+'=' + page;
                   };
               }
               this.commitPropertyAndUpdateSkin();
           }
        };

        /**
         * 获取一个返回url地址的回调函数
         * @returns {*}
         */
        public function get url()
        {
            return this.__url__;
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
        private var __pageSize__ = NaN;

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
            return this.__pageSize__;
        };

        public function set pageSize(num:Number):void
        {
            if( this.__pageSize__ !== num )
            {
                this.__pageSize__ = num;
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
        private var __current__:Number = 1;

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
            return this.__current__;
        };

        /**
         * 设置当前需要显示的分页
         * @param num
         */
        public function set current(num:Number):void
        {
            num = isNaN( this.totalSize ) ? num :  Math.min( Math.max(1, num), this.totalPage );
            var current = this.__current__;
            if( num !== current )
            {
                this.__current__ = num;
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
        private var __link__:Number = 7;

        /**
         * 获取分页的按扭数
         * @returns {Number}
         */
        public function get link():Number
        {
            return this.__link__;
        }

        /**
         * 设置分页的按扭数
         * @returns {void}
         */
        public function set link( num:Number ):void
        {
            if( this.__link__ !== num )
            {
                this.__link__ = num;
                if( this.initializeCompleted )
                {
                    this.skinInstaller();
                }
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
            offset = (offset + link) > totalPage ? offset - ( offset + link - totalPage ) : offset;
            render.variable('totalPage', totalPage);
            render.variable('pageSize', pageSize );
            render.variable('offset',  (current - 1) * pageSize );
            render.variable('profile', this.profile );
            render.variable('url', this.__callback__ );
            render.variable('current', current);
            render.variable('first', 1);
            render.variable('prev', Math.max(current - 1, 1));
            render.variable('next', Math.min(current + 1, totalPage));
            render.variable('last', totalPage);
            render.variable('link', System.range( Math.max(1 + offset, 1 ), link + offset + 1, 1) );
            super.skinInstaller();
        }

        /**
         * @private
         */
        private var __wheelTarget__;

        /**
         * 获取侦听鼠标滚轮事件的目标对象
         * @returns {Element};
         */
        public function get wheelTarget():Display
        {
            return this.__wheelTarget__;
        }

        /**
         * 设置侦听鼠标滚轮事件的目标对象
         */
        public function set wheelTarget( value:Display )
        {
            var old = this.__wheelTarget__;
            if( old  !== value )
            {
                this.__wheelTarget__ = value;
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
                this.commitPropertyAndUpdateSkin();
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
                 var dataSource = this.dataSource;
                 if( !dataSource )throw new ReferenceError('dataSource is not defined');
                 var profile = new RegExp( this.profile+'\\s*=\\s*(\\d+)');
                 var pageSize = this.__pageSize__;
                 if( !isNaN(pageSize) )
                 {
                     dataSource.pageSize(pageSize);
                 }
                  this.skin.addEventListener(MouseEvent.CLICK, function (e:MouseEvent)
                  {
                      if (Element.getNodeName(e.target) === 'a')
                      {
                          e.preventDefault();
                          var url:String = Element(e.target).property('href');
                          var _profile:Array = url.match(profile);
                          var page:Number = parseInt(_profile ? _profile[1] : 0);
                          if (page > 0) {
                              this.current = page;
                          }
                      }
                  }, false, 0, this);
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