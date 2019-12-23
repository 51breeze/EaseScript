/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

package es.core
{
    import es.core.Component;
    import es.events.DataSourceEvent;
    import es.core.Interaction;
    import es.core.Service;
    import es.events.PipelineEvent;

    public class DataSource extends Component
    {
        private var _method:String = Http.METHOD_GET;
        private var _dataType:String = Http.TYPE_JSON;
        private var _timeout:int = 30;
        private var _param:Object = {};
        private var _url:String = '';
        private var _queues:Array=[];
        private var _lastSegments:int=NaN;
        private var _loadSegments:Array=[];
        private var _nowNotify:Boolean=false;
        private var _loading:Boolean=false;
        private var _loadCompleted:Boolean=false;
        private var _dataItems:Array=[];
        private var _source:* = null;
        private var _originSource:* = null;
        private var _pageSize:int = 20;
        private var _current:int = 1;
        private var _buffer:int = 3;
        private var _totalSize:int = NaN;
        private var _grep:DataGrep = null;
        private var _responseProfile:Object=null;
        private var _isRemote:Boolean = false;
        private var _successCode:int = 200;
        private var _selected:Boolean = false;

        public DataSource()
        {
            super();
            this._responseProfile = {
                "data":"data",
                "total":"total",
                "error":"error",
                "code":"status",
                "offset":"offset",
                "rows":"rows",
            };
        }

        public function set dataType( value:String ):void
        {
            this._dataType = value;
        }

        public function get dataType():String
        {
            return this._dataType;
        }

        public function set successCode( value:int ):void
        {
            this._successCode = value;
        }

        public function get successCode():int
        {
            return this._successCode;
        }

        public function set dataProfile(value:String):void
        {
            this._responseProfile.data = value;
        }

        public function get dataProfile():String
        {
            return this._responseProfile.data as String;
        }

        public function set totalProfile(value:String):void
        {
            this._responseProfile.total = value;
        }

        public function get totalProfile():String
        {
            return this._responseProfile.total as String;
        }

        public function set errorProfile(value:String):void
        {
            this._responseProfile.error = value;
        }

        public function get errorProfile():String
        {
            return this._responseProfile.error as String;
        }

        public function set codeProfile(value:String):void
        {
            this._responseProfile.code = value;
        }

        public function get codeProfile():String
        {
            return this._responseProfile.code as String;
        }

        public function set offsetProfile(value:String):void
        {
            this._responseProfile.offset = value;
        }

        public function get offsetProfile():String
        {
            return this._responseProfile.offset as String;
        }

        public function set rowsProfile(value:String):void
        {
            this._responseProfile.rows = value;
        }

        public function get rowsProfile():String
        {
            return this._responseProfile.rows as String;
        }

        public isRemote():Boolean
        {
            return this._isRemote;
        }

        private var _httpOption:Object = null;
        public set httpOption( value:Object ):void
        {
            this._httpOption = value;
        }
        public get httpOption():Object
        {
            return this._httpOption;
        }

        /**
        * @private
        * 数据加载成功时的回调
        * @param event
        */
        protected success(event:HttpEvent):void
        {
            var data:Array = [];
            var total:int = 0;
            var dataProfile:String  = this.dataProfile;
            var totalProfile:String = this.totalProfile;
            var codeProfile:String  = this.codeProfile;
            var successCode:int     = this.successCode;
            var errorProfile:String = this.errorProfile;

            if (event.data[ codeProfile ] != successCode )
            {
                throw new Error('Loading data failed. current status:' + event.data[ codeProfile ] + ' errorMsg:'+(event.data[ errorProfile ] || "Unknow error.") );
            }

            if( !( event.data instanceof Array ) )
            {
                if ( ( typeof event.data[dataProfile] === 'undefined') || ( event.data[totalProfile] === 'undefined') )
                {
                    throw new Error('Response data profile fields is not correct.');
                }

                total = totalProfile ? event.data[totalProfile] >> 0 : 0;
                data = event.data[ dataProfile ] as Array;

                if (total === 0 && data )
                {
                    total = data.length >> 0;
                }

            } else
            {
                data = event.data as Array;
                total = data.length >> 0;
            }
            
            //必须是返回一个数组
            if( !(data instanceof Array) )
            {
                throw new Error('Response data set must be an array');
            }

            //当前获取到数据的长度
            var len:int = data.length >> 0;
            total = Math.max( total, len );

            //先标记为没有数据可加载了
            this._loadCompleted= true;

            //标没有在加载
            this._loading = false;

            //预计总数据量
            this._totalSize = total;
        
            var rows:int = this.pageSize;
            var items:Array = this._dataItems;
            var current:int = this.current;

            //当前加载分页数的偏移量
            var offset:int =  this._loadSegments.indexOf( this._lastSegments ) * rows;

            //合并数据项
            Reflect.apply( items.splice, items, [offset, 0, ...data] );

            //记录请求的数据
            Interaction.push( this.getUniqueKey(event.url, event.param, event.method), event.data );

            //发送数据
            if( this._nowNotify && this._loadSegments.indexOf(current) >=0 )
            {
                this.nowNotify(current,offset, rows);
            }

            //还有数据需要加载
            if( items.length < total )
            {
                this._loadCompleted=false;

                //继续载数据
                this.doload();
            }
        }

        private isload( page:int ):Boolean
        {
            var lastSegments:int = this._lastSegments;
            var loadSegments:Array = this._loadSegments;
            var queues:Array = this._queues;
            return lastSegments != page && loadSegments.indexOf(page) < 0 && queues.indexOf(page) < 0;
        }

        /**
        * 向远程服务器开始加载数据
        */
        protected function doload()
        {
            var loading:Boolean = this._loading;
            var isRemote:Boolean = this.isRemote();
            var loadCompleted:Boolean = this._loadCompleted;
            if( !isRemote || loadCompleted )return;

            var page:int = this.current;
            var queue:Array = this._queues;
            var rows:int = this.pageSize;
            var buffer:int = this.maxBuffer;

            if( isload( page ) )
            {
                queue.unshift( page );

            }else if( queue.length === 0 )
            {
                var p:int = 1;
                var t:int = this.totalPage;

                while( buffer > p )
                {
                    var next:int = page+p;
                    var prev:int = page-p;
                    if( next <= t && isload( next ) )
                    {
                        queue.push( next );
                    }
                    if(  prev > 0 && isload( prev ) )
                    {
                        queue.push( prev );
                    }
                    p++;
                }
            }

            if( !loading && queue.length > 0 )
            {
                this._loading=true;
                page = queue.shift() as int;
                this._lastSegments = page;
                this._loadSegments.push(page);
                if (this._loadSegments.length > 1)
                {
                    this._loadSegments.sort(function (a:int, b:int) 
                    {
                        return a - b;
                    });
                }

                var start:int = ( page - 1 ) * rows;
                var source:Http = this._source as Http;
                var param:Object = Object.merge({}, this.param);

                param[ this.offsetProfile ] = start;
                param[ this.rowsProfile ] = rows;

                var option:Object = this.httpOption;
                var defaultOption:Object = {
                    "dataType":this.dataType,
                    "timeout":this.timeout,
                };

                if( option )
                {
                    defaultOption = Object.merge(defaultOption,option);
                }

                var result:Object = Interaction.pull( this.getUniqueKey(this._url, param, this.method) );
                if( result )
                {
                    var e:HttpEvent = new HttpEvent( HttpEvent.SUCCESS );
                    e.data = result;
                    e.method = this.method;
                    e.param = param;
                    e.url = this._url;
                    source.dispatchEvent(e);

                }else
                {
                    when( RunPlatform(server) )
                    {
                        var routes:Object =  System.environments("HTTP_ROUTES");
                        if( routes )
                        {
                            var method:String = this.method.toLowerCase();
                            var route:Object = routes[ method ];
                            if( route && route[  this._url  ] )
                            {
                                var provider:Array = (route[  this._url  ] as String).split("@");
                                var classModule:Class = System.getDefinitionByName( provider[0] as String ) as Class;
                                var target:Service = new classModule() as Service;
                                var BOOT_APP:Object = System.environments("BOOT_APP");
                                BOOT_APP.bindPipeline( target );

                                target.addEventListener( PipelineEvent.RESPONSE_BEFORE , (event:PipelineEvent)=>{
                                    event.stopImmediatePropagation();
                                    var e:HttpEvent = new HttpEvent( HttpEvent.SUCCESS );
                                    e.data = event.data as Object;
                                    e.method = this.method;
                                    e.param = param;
                                    e.url = this._url;
                                    source.dispatchEvent(e);
                                });

                                Reflect.apply( target[ provider[1] ] as Function, target, Object.values(param) );
                                return;
                            }
                        }
                    }

                    source.option( defaultOption );
                    source.load( this._url, param, this.method );
                }
            }
        }

        protected function getUniqueKey(url:String,param:Object, method:String):String
        {
            return url;
        }

        /**
        * 发送数据通知
        * @private
        */
        protected function nowNotify(current:int, start:int, rows:int )
        {
            if( this._nowNotify !==true )return;
            this._nowNotify=false;
            var result:Array = this.grep.execute();
            var end:int = Math.min(start + rows, this.realSize );
            var data:Array  = result.slice(start, end);
            var event:DataSourceEvent = new DataSourceEvent( DataSourceEvent.SELECT );

            event.current = current;
            event.offset = start;
            event.data = data;
            event.waiting = false;
            event.pageSize = this.pageSize;
            event.totalSize = this.totalSize;
            this.dispatchEvent(event);
        }

        /**
        * 设置数据的请求方法
        * @param value
        * @returns {*}
        */
        public function set method( value:String ):void
        {
            this._method = value;
        }

        public function get method():String
        {
            return this._method;
        }

        /**
        * 设置请求超时
        * @param value
        * @returns {*}
        */
        public function set timeout( value:int ):void
        {
            this._timeout=value;
        }

        public function get timeout():int
        {
            return this._timeout;
        }


        /**
        * 设置请求的参数对象
        * @param value
        * @returns {*}
        */
        public set param( value:Object ):void
        {
            this._param = value;
        }

        public get param():Object
        {
            return this._param;
        }


        /**
        * 设置获取数据源
        * 允许是一个数据数组或者是一个远程请求源
        * @param Array source | String url | Http httpObject
        * @returns {DataSource}
        */
        public set source( resource:* ):void
        {
            if( this._originSource === resource )
            {
                return;
            }

            this._originSource= resource;

            //本地数据源数组
            if( resource instanceof Array )
            {
                this._dataItems = (resource as Array).slice(0);
                this._isRemote = false;
            }
            //远程数据源
            else if( resource )
            {
                if( typeof resource === 'string' )
                {
                    this._url = resource as String;
                    resource = new Http();
                }

                if ( resource instanceof Http )
                {
                    this._source= resource;
                    this._isRemote = true;

                    //请求远程数据源侦听器
                    resource.addEventListener( HttpEvent.SUCCESS, this.success , false,0, this);

                }else
                {
                    throw new TypeError("Invalid data source. optional: Array, Http, URL");
                }
            }

            //清空数据源
            if( resource === null )
            {
                var items:Array = this._dataItems;
                items.splice(0, items.length);
                this._lastSegments=null;
                this._loadSegments=[];
                this._queues      =[];
                this._nowNotify=false;
                this._loadCompleted=false;
            }

            //移除加载远程数据侦听事件
            if ( !this._isRemote && this._source instanceof Http )
            {
                this._source.removeEventListener(HttpEvent.SUCCESS, this.success);
            }

            if( this._selected===true )
            {
                this._grep=null;
                this.select();
            }
        }

        public get source():*
        {
            return this._originSource;
        }


        /**
        * 每页需要显示数据的行数
        * @param number rows
        * @returns {DataSource}
        */
        public set pageSize( size:int ):void
        {
            var old:int = this._pageSize;
            if( size >= 0 && old !== size )
            {
                this._pageSize=size;

                var event:PropertyEvent = new PropertyEvent( PropertyEvent.CHANGE );
                event.property = 'pageSize';
                event.newValue = size;
                event.oldValue = old;

                this.dispatchEvent( event );
                if( this._selected  )
                {
                    var items:Array = this._dataItems;
                    items.splice(0, items.length);
                    this._lastSegments=NaN;
                    this._loadSegments=[];
                    this._queues      =[];
                    this._nowNotify=false;
                    this._loadCompleted=false;
                    this.select();
                }
            }
        }

        public get pageSize():int
        {
            return this._pageSize;
        }

        /**
        * 获取当前分页数
        * @param num
        * @returns {*}
        */
        public set current( num:int ):void
        {
            if( !isNaN(num) )
            {
                num =  Math.max( Math.min( num, this.totalPage ),1);
                if( _current !== num )
                {
                    this._current=num;
                }
            }
        }

        public get current():int
        {
            return this._current;
        }

        /**
        * 获取总分页数。
        * 如果是一个远程数据源需要等到请求响应后才能得到正确的结果,否则返回 NaN
        * @return number
        */
        public get totalPage():int
        {
            return this.totalSize > 0 ? Math.max( Math.ceil( this.totalSize / this.pageSize ) , 1) : 1;
        }

        /**
        * 最大缓冲几个分页数据。有效值为1-10
        * @param Number num
        * @returns {DataSource}
        */
        public set maxBuffer(num:int)
        {
            this._buffer=Math.min(10, num);
        }

        public get maxBuffer():int
        {
            return this._buffer;
        }

        /**
        * 获取实际数据源的总数
        * 如果是一个远程数据源，每请求成功后都会更新这个值。
        * 是否需要向远程数据源加载数据这个值非常关键。 if( 分段数 * 行数 < 总数 )do load...
        * @param number num
        * @returns {DataSource}
        */
        public get realSize():int
        {
            return this._dataItems.length;
        }


        /**
        * 预计数据源的总数
        * 如果是一个远程数据源，每请求成功后都会更新这个值。
        * 是否需要向远程数据源加载数据这个值非常关键。 if( 分段数 * 行数 < 预计总数 )do load...
        * @param number num
        * @returns {DataSource}
        */
        public get totalSize():int
        {
            return Math.max( isNaN(this._totalSize) ? 0 : this._totalSize, this.realSize );
        }

        /**
        * 获取数据检索对象
        * @returns {*|DataGrep}
        */ 
        public get grep():DataGrep
        {
            if( this._grep===null )
            {
                this._grep =  new DataGrep( this._dataItems );
            }
            return this._grep;
        }

        /**
        * 设置筛选数据的条件
        * @param condition
        * @returns {DataSource}
        */
        public set filter( value:* ):void
        {
            this.grep.filter( value );
        }

        public get filter():*
        {
            return this.grep.filter();
        }

        private var _orderMap:Object={};

        /**
        * 对数据进行排序。
        * 只有数据源全部加载完成的情况下调用此方法才有效（本地数据源除外）。
        * @param column 数据字段
        * @param type   排序类型
        */
        public set orderBy(orderObject:Object):void
        {
            if( this._orderMap !== orderObject )
            {
                this._orderMap = orderObject;
                var dataArray:DataArray = new DataArray( this._dataItems );
                dataArray.orderBy( orderObject );
            }
        }

        public get orderBy():Object
        {
            return this._orderMap;
        }

        /**
        * 当前页的索引值在当前数据源的位置
        * @param index 位于当前页的索引值
        * @returns {number}
        */
        public getOffsetAt( index:int ):int
        {
            return ( this.current-1 ) * this.pageSize + index;
        }

        /**
        * 添加数据项到指定的索引位置
        * @param item
        * @param index
        * @returns {int}
        */
        public append(item:Object,index:int=NaN ):int
        {
            this.initializing();

            index =  !isNaN(index) ? index : this.realSize;
            index = index < 0 ? index +this.realSize+1 : index;
            index = Math.min( this.realSize, Math.max( index, 0 ) );
            item = item instanceof Array ? item : [item];

            var ret:Array = [];
            var e:DataSourceEvent = null;
            for(var i:int=0;i<item.length;i++)
            {
                e = new DataSourceEvent( DataSourceEvent.CHANGED );
                e.index = index+i;
                e.newValue=item[i];

                if( this.dispatchEvent( e ) )
                {
                    this._dataItems.splice( e.index, 0, item[i] );
                    ret.push( item[i] );
                }
            }

            e = new DataSourceEvent( DataSourceEvent.APPEND );
            e.index = index;
            e.data  = ret;
            this.dispatchEvent( e );
            return ret.length;
        }

        /**
        * 移除指定索引下的数据项
        * @param condition
        * @returns {int}
        */
        public remove( condition:* ):int
        {
            this.initializing();

            var result:Array = this.grep.execute( condition );
            var e:DataSourceEvent;
            var data:Array=[];
            for (var i:int = 0; i < result.length; i++)
            {
                e = new DataSourceEvent( DataSourceEvent.CHANGED );
                e.index = i;
                e.oldValue=result[i];
                if( this.dispatchEvent( e ) )
                {
                    var res:Array = this._dataItems.splice(e.index, 1);
                    data.push( res[0] );
                }
            }

            if( data.length > 0 )
            {
                e = new DataSourceEvent(DataSourceEvent.REMOVE);
                e.condition = condition;
                e.data = data;
                this.dispatchEvent(e);
            }
            return data.length;
        }

        /**
        * 修改数据
        * @param value 数据列对象 {'column':'newValue'}
        * @param condition
        * @returns {int}
        */
        public update(value:Object, condition:*):int
        {
            this.initializing();
            
            var result:Array = this.grep.execute( condition );
            var data:Array=[];
            var flag:Boolean=false;
            var e:DataSourceEvent = null;

            for (var i:int = 0; i < result.length; i++)
            {
                flag=false;
                var newValue:Object = result[i] as Object;
                var oldValue:Object = Object.merge({},newValue);
                for(var c:String in value)
                {
                    if ( typeof newValue[c] !== "undefined" && newValue[c] != value[c] )
                    {
                        newValue[c] = value[c];
                        flag=true;
                    }
                }

                if( flag )
                {
                    e = new DataSourceEvent(DataSourceEvent.CHANGED);
                    e.newValue = newValue;
                    e.oldValue = oldValue;
                    if( this.dispatchEvent(e) )
                    {
                        data.push( result[i] );
                    }
                }
            }

            e = new DataSourceEvent( DataSourceEvent.UPDATE );
            e.data=data;
            e.condition = condition;
            e.newValue=value;
            this.dispatchEvent( e );
            return data.length;
        }

        /**
        * 获取指定索引的元素
        * @param index
        * @returns {*}
        */
        public getItemByIndex( index:int ):Object
        {
            if(  index < 0 || index >= this.realSize )return null;
            return  this._dataItems[ index ] || null;
        }

        /**
        * 获取指定元素的索引
        * 如果不存在则返回 -1
        * @param item
        * @returns {int}
        */
        public getIndexByItem( item:Object ):int
        {
            return this._dataItems.indexOf(item);
        }

        /**
        * 获取指定索引范围的元素
        * @param start 开始索引
        * @param end   结束索引
        * @returns {Array}
        */
        public range( start:int, end:int=-1):Array
        {
            return this._dataItems.slice(start, end);
        }

        /**
        * 判断是否有初始化数据
        * @returns {Boolean}}
        */
        public selected():Boolean
        {
            return this._selected;
        }

        /**
        * 选择数据集
        * @param Number segments 选择数据的段数, 默认是1
        * @returns {DataSource}
        */
        public select( page:int=NaN ):void
        {
            this.initializing();

            var total:int = this.totalPage;
            page = !isNaN(page) ? page : this.current;
            page = Math.min( page , isNaN(total)?page:total );
            this._current = page;

            var rows:int  = this.pageSize;
            var start:int=( page-1 ) * rows;
            var loadCompleted:Boolean = this._loadCompleted;
            var isRemote:Boolean = this.isRemote();
            var items:Array = this._dataItems;

            var index:int = !loadCompleted && isRemote ? this._loadSegments.indexOf(page) : page-1;
            var waiting:Boolean = index < 0 || ( items.length < (index*rows+rows) );

            //数据准备好后需要立即通知
            this._nowNotify=true;
            this._selected=true;

            //需要等待加载数据
            if( isRemote && waiting && !loadCompleted )
            {
                var event:DataSourceEvent = new DataSourceEvent( DataSourceEvent.SELECT );
                event.current = page;
                event.offset = start;
                event.data=null;
                event.waiting = true;
                this.dispatchEvent(event);

            }else
            {
                this.nowNotify(page,index*rows,rows);
            }
            //加载数据
            if( isRemote )
            {
                this.doload();
            }
        }
    }
}