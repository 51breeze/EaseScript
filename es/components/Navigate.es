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
    import es.events.ApplicationEvent;

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

        /**
         * @private
         */
        private var _current:*=null;

        /**
         * 获取当前匹配的导航项值
         * @return {*}
         */
        public function get current():*
        {
            if( _current===null )
            {
                return System.environments("HTTP_ROUTE_PATH")||0;
            }
            return _current;
        }

        /**
         * 设置并激活指定的导航项值
         * @param value
         */
        public function set current(value:*):void
        {
            if(  _current != value  )
            {
                _current = value;
                if( this.initialized )
                {
                    loadContent(value);
                    commitPropertyAndUpdateSkin();
                }
            }
        }

        /**
         * @private
         */
        private var _target:Boolean=true;

        /**
         * 设置链接的跳转动作。
         * 当值为true时新打开窗口否则为当前窗口。默认为true
         * @param value
         */
        public function set target(value:Boolean):void
        {
            _target = value;
        }

        /**
         * 获取链接的跳转动作。
         * @param value
         */
        public function get target():Boolean
        {
            return _target;
        }

        /**
         * @private
         */
        private var _transition:String=null;

        /**
         * 设置加载内容的过渡效果
         * @param value
         */
        public function set transition(value:String):void
        {
            _transition=value;
        }

        /**
         * 获取加载内容的过渡效果
         * @return {String}
         */
        public function get transition():String
        {
            return _transition;
        }

        private var frameHash:Object={};
        protected function createFrame( url:String )
        {
            if( typeof frameHash[ url ] === "undefined" )
            {
                var elem:Element = new Element("<iframe />");
                elem.property("src",url);
                elem.style("width","100%");
                frameHash[ url ] = elem;
            }
            return frameHash[ url ];
        }

        private static var loadContentMap:Object={};

        /**
         * 加载当前匹配项的内容
         * @param item
         */
        protected function loadContent( content:* )
        {
            var event:NavigateEvent = new NavigateEvent( NavigateEvent.LOAD_CONTENT_BEFORE );
            event.viewport = this.viewport;
            event.content = content;
            if( !this.dispatchEvent(event) || !(event.viewport && event.content) )return false;
            var viewport:IContainer = event.viewport;
            var child:IDisplay=null;
            content = event.content;
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
                var isUrl:Boolean = /^https?/i.test(content);
                var segment:Object = Locator.create( content );
                var provider:String = Locator.match( segment );
                if( isUrl && !provider )
                {
                    return false;
                }
                if( provider )
                {
                    if( !loadContentMap[ provider ] )
                    {
                        child = new Display(new Element("<div style='width:100%' />")) as IDisplay;
                        (new EventDispatcher(document)).addEventListener(ApplicationEvent.FETCH_ROOT_CONTAINER, function (e: ApplicationEvent) {
                            e.container = child;
                        });
                        loadContentMap[ provider ] = child;
                        var HTTP_DISPATCHER: Function = System.environments("HTTP_DISPATCHER") as Function;
                        var controller: Array = provider.split("@");
                        HTTP_DISPATCHER(controller[0], controller[1]);
                        viewport.addChild(child);
                    }
                    for( var p:String in loadContentMap)
                    {
                        (loadContentMap[p] as Display).visible=false;
                    }
                    (loadContentMap[provider] as Display).visible=true;
                    return true;

                }else{
                    child = new Display( new Element( Element.createElement(content) ) ) as IDisplay;
                }
            }
            viewport.removeAllChild();
            viewport.addChild( child );
            return true;
        }


        /**
         * @override
         */
        override protected function initializing()
        {
            super.initializing();
            var hostComponent:Navigate = this;
            var dataProfile:String =  this.dataProfile;
            var container:Skin = this.skin;
            container.assign(dataProfile, []);
            container.assign("openTarget",this.target);
            container.assign("match", function (item: Object, key: *) {
                var matched: Boolean = false;
                var current: * = hostComponent.current;
                if (typeof current === "function") {
                    matched = current(item, key) as Boolean;
                } else if (current == key || current===item.link || item["label"] === current ) {
                    matched = true;
                } else if (current) {
                    matched = new RegExp( current ).test( (String)item.link );
                }
                if (matched && System.isDefined(item.content) )
                {
                    hostComponent.loadContent( item.content );
                }
                return matched;
            });
            this.dataSource.addEventListener(DataSourceEvent.SELECT, function (event:DataSourceEvent)
            {
                if ( !event.waiting )
                {
                    container.assign( dataProfile , event.data );
                }
            });
            this.dataSource.select(1);
        }

        /**
         * @private
         */
        private var _viewport:IContainer=null;

        /**
         * 设置一个承载内容的视口
         * @param value
         */
        public function set viewport( value:IContainer ):void
        {
            if( _viewport===null )
            {
                var self:Navigate = this;
                console.log("=====");
                this.addEventListener(NavigateEvent.URL_JUMP_BEFORE, function (e:NavigateEvent)
                {
                    var content:*= e.item.content || e.content;
                    console.log(content);
                    if( typeof content === "string" )
                    {
                        var isUrl: Boolean = /^https?/i.test(content);
                        var segment: Object = Locator.create(content);
                        var provider: String = Locator.match(segment);

                          console.log(isUrl, provider, content );
                        if( isUrl && !provider ){

                            return;
                        }
                    }
                    e.preventDefault();
                    self.current = content;
                });
            }
            _viewport = value;
        }

        /**
         * 获取一个承载内容的视口
         * @return {IContainer}
         */
        public function get viewport():IContainer
        {
            return _viewport;
        }
    }
}