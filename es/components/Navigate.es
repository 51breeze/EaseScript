/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

package es.components
{
    import es.core.SkinComponent;
    import es.events.NavigateEvent;
    import es.core.Skin;
    import es.core.View;
    import es.core.Display;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.events.ApplicationEvent;
    import es.events.DataSourceEvent;
    import es.core.DataSource;

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
         * 设置表格的圆角值
         * @param value
         */
        public function set rowHeight(value:Number):void
        {
            this.assign("rowHeight", value);
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get rowHeight():Number
        {
            return this.assign("rowHeight") || 25;
        }

        /**
         * 获取当前匹配的导航项值
         * @return {*}
         */
        public function get current():*
        {
            return this.assign("current") || Locator.query("current", 0);
        }

        /**
         * 设置并激活指定的导航项值
         * @param value
         */
        public function set current(value:*):void
        {
            this.assign("current", value);
        }

        /**
         * 设置链接的跳转动作。
         * 当值为true时新打开窗口否则为当前窗口。默认为true
         * @param value
         */
        public function set target(value:Boolean):void
        {
           this.assign("target", value);
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
         * 获取链接的跳转动作。
         * @param value
         */
        public function get target():Boolean
        {
            return this.assign("target") || true;
        }

        /**
         * 设置加载内容的过渡效果
         * @param value
         */
        public function set transition(value:String):void
        {
            this.assign("transition",value);
        }

        /**
         * 获取加载内容的过渡效果
         * @return {String}
         */
        public function get transition():String
        {
            return this.assign("transition") as String;
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

            if( !this.dispatchEvent(event) || !(event.viewport && event.content) )
            {
                return false;
            }

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
                content = System.trim( content as String );
                var isUrl:Boolean = /^https?/i.test(content as String );
                var segment:Object = Locator.create( content as String );
                var provider:String = Locator.match( segment );

                if( isUrl && !provider )
                {
                    return false;
                }

                if( provider )
                {
                    if( !loadContentMap[ provider ] )
                    {
                        var doc:EventDispatcher = new EventDispatcher(document);

                        //阻止替换根容器
                        var fn:Function = function(e:ApplicationEvent) {
                            e.preventDefault();
                            e.container = viewport;
                            doc.removeEventListener(ApplicationEvent.FETCH_ROOT_CONTAINER, fn);
                        };
                        doc.addEventListener(ApplicationEvent.FETCH_ROOT_CONTAINER, fn);

                        //阻止直接响应
                        var before:Function = function(e:ApplicationEvent) {
                            loadContentMap[ provider ] = e.container;
                            e.preventDefault();
                            doc.removeEventListener(ApplicationEvent.RESPONSE_BEFORE,before);
                        };
                        doc.addEventListener(ApplicationEvent.RESPONSE_BEFORE, before);

                        var HTTP_DISPATCHER:Function = System.environments("HTTP_DISPATCHER") as Function;
                        if( HTTP_DISPATCHER  )
                        {
                            var controller:Array = provider.split("@");
                            HTTP_DISPATCHER(controller[0], controller[1]);
                            return true;
                        }

                    }else
                    {
                       child = loadContentMap[ provider ] as IDisplay;
                       if( child instanceof View )
                       {
                           child.display();
                           return true;
                       }
                    }
                   
                }else
                {
                    child = new Display( new Element( Element.createElement(content) ) ) as IDisplay;
                }
            }
            viewport.children= [ child ];
            return true;
        }

        /**
        * 判断当前指定的值是否需要加载内容到指定的视口中
        * @param item
        * @param key
        * @return {Boolean}
        */
        public function match(item:Object,key:*):Boolean
        {
            var matched: Boolean = false;
            var current: * = this.current;
            if (typeof current === "function")
            {
                matched = current(item, key) as Boolean;

            } else if (current == key || current===item.link || item["label"] === current )
            {
                matched = true;

            } else if (current)
            {
                var str:String = (String)current;
                matched = new RegExp( str.replace(/([\/\?\:\.])/g,'\\$1') ).test( (String)item.link );
            };

            if( matched && item.content )
            {
                this.loadContent( item.content );
            }
            return matched;
        }

        /**
         * @override
         */
        override protected function initializing()
        {
            super.initializing();
            if( !this.dataSource.selected() )
            {
                this.dataSource.select(1);
            }
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
                this.addEventListener(NavigateEvent.URL_JUMP_BEFORE, function(e:NavigateEvent)
                {
                    var content:*= e.content || (e.item && e.item.link);
                    if( typeof content === "string" )
                    {
                        var isUrl:Boolean = /^https?/i.test(content as String);
                        var segment:Object = Locator.create(content as String);
                        var provider:String = Locator.match(segment);
                        if( isUrl && !provider ){
                            return;
                        }
                    }
                    if(e.item && e.item.content )
                    {
                        e.preventDefault();
                        this.current = content;
                    }

                },false,0,this);
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