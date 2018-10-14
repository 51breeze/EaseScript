/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

package es.components
{
    import es.components.SkinComponent;
    import es.events.NavigateEvent;
    import es.core.Skin;
    import es.core.Display;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;

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
        public function set dataProfile(profile:String):void
        {
            this._dataProfile = profile;
        };

        public function get dataProfile():String
        {
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

        private var _current:*=null;
        public function get current():*
        {
            if( _current===null )
            {
                return System.getEnvironment("RoutePath")||0;
            }
            return _current;
        }

        public function set current(value:*):void
        {
            if(  _current != value  )
            {
                _current = value;
                if( this.initialized )
                {
                    commitPropertyAndUpdateSkin();
                }
            }
        }

        /**
         * 加载当前匹配项的内容
         * @param item
         */
        protected function loadContent(item:Object)
        {
            var event:NavigateEvent = new NavigateEvent( NavigateEvent.LOAD_CONTENT_BEFORE );
            event.item = item;
            event.viewport = this.viewport;
            event.content = item.content;
            if( !this.dispatchEvent(event) || !(event.viewport && event.content) )return;

            var viewport:IContainer = event.viewport;
            var content:* = event.content;
            var child:IDisplay=null;
            if( content instanceof Class  )
            {
                child = new (content as Class)( this ) as IDisplay;
            }
            else if( System.isFunction(content) )
            {
                child = content() as IDisplay;
            }
            else if( System.isString(content) )
            {
                content = System.trim( content );
                if( /^https?/i.test(content) )
                {
                    var http:Http = new Http();
                    http.addEventListener(HttpEvent.SUCCESS,function (e:HttpEvent) {
                        child = new Display( new Element( Element.createElement(e.data as String) ) ) as IDisplay;
                        viewport.removeAllChild();
                        viewport.addChild( child );
                    });
                   http.load(content);
                   return;
                }else{
                    child = new Display( new Element( Element.createElement(content) ) ) as IDisplay;
                }
            }
            viewport.removeAllChild();
            viewport.addChild( child );
        }

        override protected function initializing()
        {
            super.initializing();
            var hostComponent:Navigate = this;
            var dataProfile:String =  hostComponent.dataProfile;
            var container:Skin = this.skin["container"] as Skin;
            if( container )
            {
                container.variable(dataProfile, []);
                container.variable("match", function (item: Object, key: *) {
                    var matched: Boolean = false;
                    var current: * = hostComponent.current;
                    if (typeof current === "function") {
                        matched = current(item, key) as Boolean;
                    } else if (current == key) {
                        matched = true;
                    } else if (item["link"] === current || item["label"] === current) {
                        matched = true;
                    } else if (current) {
                        matched = new RegExp( current ).test( (String)item.link );
                    }
                    if (matched) {
                        hostComponent.loadContent(item);
                    }
                    return matched;
                });
            }
        }


        override protected function commitPropertyAndUpdateSkin()
        {
            super.commitPropertyAndUpdateSkin();
        }

        private var _viewport:IContainer=null;
        public function set viewport( value:IContainer ):void
        {
            _viewport = value;
        }

        public function get viewport():IContainer
        {
            return _viewport;
        }
    }
}