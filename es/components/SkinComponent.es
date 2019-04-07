/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.components
{
    import es.components.Component;
    import es.components.SkinComponent;
    import es.events.ComponentEvent;
    import es.core.Skin;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.core.Interaction;
    import es.core.Position;
    import es.core.es_internal; 

    public class SkinComponent extends Component implements IDisplay,IContainer
    {
        private static var componentIdHash:Object={};
        private var _componentId:String;
        public function SkinComponent( componentId:String )
        {
            super();
            if( System.isDefined( componentIdHash[ componentId ] ) )
            {
               // throw new TypeError("Component id already exists. for '"+componentId+"'");
            }
            componentIdHash[ componentId ] = true;
            _componentId = componentId;
        }

        /**
         * 获取此组件的唯一ID
         * @returns {String}
         */
        public function getComponentId( prefix:String="" ):String
        {
            return prefix ? prefix+'-'+_componentId : _componentId;
        }

        /**
         * @private
         */
        private var _async:Boolean = Syntax(origin,javascript);

        /**
         * 标记此组件的运行行为。是否异步(前端/后端)执行
         * 此标记只对编译在服务端的组件有用。否则在编译为客户端(javascript)的时候始终返回true
         * @param flag
         */
        public function set async(flag:Boolean):void
        {
            _async = flag;
        }

        /**
         * 获取此组件的运行行为。是否异步(前端/后端)执行
         * 此标记只对编译在服务端的组件有用。否则在编译为客户端(javascript)的时候始终返回true
         * @returns {Boolean}
         */
        public function get async():Boolean
        {
            when( Syntax(origin,javascript) ){
               return true;
            }then{
               return _async;
            }
        }

        /**
         * 判断此组件是否需要渲染皮肤
         * 对于指定为javascript的语法或者指定为异步的方式来运行组件是需要渲染皮肤的。
         * 此属性适应于组件开发人员，来指定在异步和同步方式的情况下如何来渲染皮肤或者加载数据等。
         * 皮肤的渲染有两种方式：
         * 1、直接通过服务端渲染
         * 2、由客户端根据组件指定的数据实时渲染
         * @returns {Boolean}
         */
        public function isNeedCreateSkin()
        {
            when( Syntax(origin,javascript) ){
                return true;
            }then{
                return  Syntax(javascript) ? this.async : !this.async;
            }
        }

        /**
         * @private
         */
        private var _skin:Skin = null;

        /**
         * 获取皮肤对象
         * @returns {Object}
         */
        public function get skin():Skin
        {
            if (this._skin === null)
            {
                var skinClass:Class = this.skinClass;
                if( skinClass===null )
                {
                    throw new TypeError( "the \""+ __CLASS__ + "\" skinClass is not defined." );
                }
                var skin:Skin = (Skin)new skinClass( this );
                this._skin = skin;
            }
            return this._skin;
        };

        /**
         * 设置皮肤对象
         * @param Skin skinObj
         * @returns {Object}
         */
        public function set skin( skinObj:Skin ):void
        {
            var old:Skin = this._skin;
            this._skin = skinObj;
            if( this.initialized && old && skinObj !== old )
            {
                if( this.hasEventListener(PropertyEvent.CHANGE) )
                {
                    var event:PropertyEvent = new PropertyEvent(PropertyEvent.CHANGE);
                    event.oldValue = old;
                    event.newValue = skinObj;
                    event.property = 'skin';
                    this.dispatchEvent(event);
                }
                this.installChildren();
                this.commitProperty();
                this.commitPropertyAndUpdateSkin();
            }
        }

        /**
         * @protected
         */
        private var _skinClass:Class=null;

        /**
         * 获取皮肤类
         */
        public function get skinClass():Class
        {
            return this._skinClass;
        }

        /**
         * 设置一个皮肤类
         * @param value
         */
        public function set skinClass(value:Class):void
        {
            var old:Class = this._skinClass;
            if( old !== value )
            {
                this._skinClass = value;
                if( this.initialized )
                {
                    var skin:Skin = (Skin)new value( this );
                    this._skin = skin;
                    this.installChildren();
                    this.commitProperty();
                    this.commitPropertyAndUpdateSkin();
                    if( this.hasEventListener(PropertyEvent.CHANGE) )
                    {
                        var event:PropertyEvent = new PropertyEvent(PropertyEvent.CHANGE);
                        event.oldValue = old;
                        event.newValue = value;
                        event.property = 'skinClass';
                        this.dispatchEvent(event);
                    }
                }
            }
        }

        /**
         * 此组件的属性集
         * @protected
         */
        protected var properties:Object={};

        /**
         * 获取此对象的高度
         */
        public function get height():uint
        {
            if( this.initialized )
            {
                return this.skin.height;
            }
            return properties.height;
        }

        /**
         * 设置此对象的高度
         */
        public function set height(value:uint):void
        {
            if( this.initialized )
            {
                this.skin.height = value;
            }
            properties.height = value;
        }

        /**
         * 获取此对象的高度
         */
        public function get width():uint
        {
            if( this.initialized )
            {
                return this.skin.width;
            }
            return properties.width;
        }

        /**
         * 设置此对象的高度
         */
        public function set width(value:uint):void
        {
            if( this.initialized ) {
                this.skin.width = value;
            }
            properties.width=value;
        }

        /**
         * 获取元素对象
         * @returns {Element}
         */
        public function get element():Element
        {
            if( this.initialized )
            {
               return this.skin.element;
            }
            return null;
        }

        /**
         * 标记此显示对象是否可见
         * @param flag
         */
        public function set visible( flag:Boolean ):void
        {
            if( this.initialized )
            {
                this.skin.visible = flag;
            }
            properties.visible=flag;
        };

        /**
         * 获取此显示对象的可见状态
         * @returns {Boolean}
         */
        public function get visible():Boolean
        {
            if( this.initialized ) {
                return this.skin.visible;
            }
            return properties.visible;
        };

        /**
         * 获取元素相对父元素的左边距
         * @returns {Number}
         */
        public function get left():int
        {
            if( this.initialized ) {
                return this.skin.left;
            }
            return properties.left;
        };

        /**
         * 设置元素相对父元素的左边距
         * @returns {Number}
         */
        public function set left( value:int ):void
        {
            if( this.initialized )
            {
                this.skin.left = value;
            }
            properties.left=value;
        };

        /**
         * 获取元素相对父元素的上边距
         * @returns {Number}
         */
        public function get top():int
        {
            if( this.initialized ) {
                return this.skin.top;
            }
            return properties.top;
        };

        /**
         * 设置元素相对父元素的上边距
         * @returns {Number}
         */
        public function set top( value:int ):void
        {
            if( this.initialized )
            {
                this.skin.top = value;
            }
            properties.top=value;
        };

        /**
         * 获取元素相对父元素的右边距
         * @returns {Number}
         */
        public function get right():int
        {
            if( this.initialized ) {
                return this.skin.right;
            }
            return properties.right;
        };

        /**
         * 设置元素相对父元素的右边距
         * @returns {Number}
         */
        public function set right( value:int ):void
        {
            if( this.initialized )
            {
                this.skin.right = value;
            }
            properties.right=value;
        };

        /**
         * 获取元素相对父元素的下边距
         * @returns {Number}
         */
        public function get bottom():int
        {
            if( this.initialized )
            {
                return this.skin.bottom;
            }
            return properties.bottom;
        };

        /**
         * 设置元素相对父元素的下边距
         * @returns {Number}
         */
        public function set bottom( value:int ):void
        {
            if( this.initialized )
            {
                this.skin.bottom = value;
            }
            properties.bottom=value;
        };

        /**
        * @private
        */
        private var _parent:IDisplay=null;

        /**
        * @es_internal
        */
        es_internal function setParentDisplay(value:IDisplay=null):void
        {
            if( this.initialized )
            {
                this.skin.es_internal::setParentDisplay(value);
            }
            _parent = value;
        }

        /**
         * 获取父级皮肤元素
         * 只有已经添加到父级元素中才会返回父级皮肤元素，否则返回 null
         * @returns {Display}
         */
        public function get parent():IDisplay
        {
            if( this.initialized )
            {
                return this.skin.parent;
            }
            return _parent;
        }

        /**
         * @private
         */
        private var childrenItems:Array=[];

        /**
         * 获取所有的子级元素
         * @returns {Array}
         */
        public function get children():Array
        {
            if( this.initialized )
            {
                return this.skin.children;
            }else{
                return childrenItems.slice(0);
            }
        }

        /**
         * 设置子级元素
         * @returns {Array}
         */
        public function set children( value:Array ):void
        {
            if( this.initialized )
            {
                this.skin.children=value;
            }else{
               childrenItems = value.slice(0);
            }
        }

        /**
         * 获取指定索引处的子级元素
         * @param index
         * @returns {IDisplay}
         */
        public function getChildAt( index:Number ):IDisplay
        {
            if( this.initialized ){
                return this.skin.getChildAt(index);
            }else
            {
                if( index < 0 ){
                    index = index+childrenItems.length;
                }
                return childrenItems[ index ] as IDisplay;
            }
        }

        /**
         * 根据子级皮肤返回索引
         * @param child
         * @returns {Number}Number
         */
        public function getChildIndex( child:IDisplay ):Number
        {
            if( this.initialized ){
                return this.skin.getChildIndex(child);
            }else{
                return childrenItems.indexOf(child);
            }
        }

        /**
         * 添加一个子级元素
         * @param child
         * @returns {Display}
         */
        public function addChild( child:IDisplay ):IDisplay
        {
            if( this.initialized )
            {
                return this.skin.addChild(child);
            }else{
                childrenItems.push( child );
                return child;
            }
        }
        
        /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         * @returns {Display}
         */
        public function addChildAt( child:IDisplay, index:Number ):IDisplay
        {
            if( this.initialized )
            {
                return this.skin.addChildAt(child,index);
            }else
            {
                if( index < 0 ){
                    index = index+childrenItems.length;
                }
                childrenItems.splice(index,0,child);
                return child;
            }
        }

        /**
         * 移除指定的子级元素
         * @param child
         * @returns {Display}
         */
        public function removeChild( child:IDisplay ):IDisplay
        {
            if( this.initialized )
            {
                return this.skin.removeChild(child);

            }else
            {
                var index:int = this.childrenItems.indexOf(child);
                if( index >= 0 ){
                    this.removeChildAt( index );
                }else{
                    throw new ReferenceError("child is not exists.");
                }
            }
        }

        /**
         * 移除指定索引的子级元素
         * @param index
         * @returns {Display}
         */
        public function removeChildAt( index:Number ):IDisplay
        {
            if( this.initialized )
            {
                return this.skin.removeChildAt(index);
            }else
            {
                if( index < 0 ){
                    index = index+childrenItems.length;
                }
                if( childrenItems[index] ){
                    return childrenItems.splice(index,1) as IDisplay;
                }
                throw new ReferenceError("Index is out of range");
            }
        }

        /**
         * 移除所有的子级元素
         *  @returns {void}
         */
        public function removeAllChild():void
        {
            if( this.initialized )
            {
                this.skin.removeAllChild();
            }else{
                childrenItems = [];
            }
        }

        /**
         * 测是是否包括指定的子级（包括孙级）元素，在没有初始时此方法始终返回false。
         * 此操作与Element.contains()一致
         * @param child
         * @return Boolean
         */
        public function contains( child:IDisplay ):Boolean
        {
            if( !this.initialized ){
                return false;
            }else{
                return this.skin.contains(child);
            }
        }

        //@private
        private var events:Object={};

       /**
        * 添加侦听器
        * @param type
        * @param listener
        * @param priority
        * @param reference
        * @returns {EventDispatcher}
        */
        override public function addEventListener(type:String,callback:Function,useCapture:Boolean,priority:int,reference:Object):EventDispatcher
        {
            if( this.initialized ){
                this.skin.addEventListener(type,callback,useCapture,priority,reference);
            }else{
                super.addEventListener(type,callback,useCapture,priority,reference);
            }

            if( !events.hasOwnProperty(type) )
            {
                events[ type ] = [];
            }

            events[type].push({
                "callback":callback,
                "useCapture":useCapture,
                "priority":priority,
                "reference":reference
            });
            return this;
        }

        /**
        * 移除指定类型的侦听器
        * @param type
        * @param listener
        * @returns {boolean}
        */
        override public function removeEventListener(type:String,listener:Function=null):Boolean
        {
             if( this.initialized )
             {
                 return this.skin.removeEventListener(type,listener);
             }else
             {
                 super.removeEventListener(type,listener);
             }

            if( !events.hasOwnProperty(type) )
            {
                return false;
            }

            if( !listener )
            {
                delete events[type];
                return true;
            }

            var map:Array = events[type] as Array;
            var len:int = map.length;
            for(;len>0;)
            {
                if( map[--len].callback===listener )
                {
                    map.splice(len,1);
                    return true;
                }
            }
            return false;
        }

        /**
        * 调度指定事件
        * @param event
        * @returns {boolean}
        */
        override public function dispatchEvent( event:Event ):Boolean
        {
            if( this.initialized )
            {
                return this.skin.dispatchEvent(event);
            }else{
                return super.dispatchEvent(event);
            }
        }

        /**
        * 判断是否有指定类型的侦听器
        * @param type
        * @param listener
        * @returns {boolean}
        */
        override public function hasEventListener( type:String , listener:Function=null):Boolean
        {
            if( this.initialized )
            {
               return this.skin.hasEventListener(type,listener);
            }else{
               return super.hasEventListener(type,listener);
            }
        }

        /**
         * 渲染显示皮肤对象。
         * 此方法主要是用来初始化并安装组件时使用。
         * 如果有属性更新并期望应用到皮肤时请使用 nowUpdateSkin 方法。
         */
        public function display():Element
        {
            if( !this.initialized )
            {
                this.initializing();
                this.commitPropertyAndUpdateSkin();
            }
            return this.skin.element;
        };

        /**
         * @override
         * 初始化组件
         * 此方法只会在初始化时调用一次且由内部调用，无需手动调用。
         * 如果需要判断是否已初始化请使用 initialized 属性
         */
        override protected function initializing()
        {
            super.initializing();
            this.installChildren();
            this.commitProperty();
        }

        /**
         * 安装子级元素
         * 对于新添加到组件的元素都要添加到皮肤对象上。
         */
        private function installChildren()
        {
            this.skin.children = childrenItems;
            
            /*var len:int = childrenItems.length;
            var index:int=0;
            var container:IContainer=this.skin;
            for(;index<len;index++)
            {
                container.addChild( childrenItems[index] as IDisplay );
            }*/
        }

        /**
         * 将组件属性提交到皮肤。
         * 对于一个在初始化之前的组件有可能是没有指定皮肤对象的。所以需要把指定的属性统一管理起来稍后在初始化时统一提交到皮肤。
         */
        protected function commitProperty()
        {
            var skin:Skin = this.skin;
            Object.forEach(this.properties, function (value:*, name:String){
                if( name in skin ) {
                    skin[name] = value;
                }
            });

            Object.forEach(this.events,function(listener:Array,type:String)
            {
                var len:int = listener.length;
                var index:int = 0;
                for(;index<len;index++)
                {
                    var item:Object= listener[index] as Object;
                    skin.removeEventListener(type, item.callback);
                    skin.addEventListener(type, item.callback, item.useCapture, item.priority, item.reference);
                    super.removeEventListener(type, item.callback);
                }
            },this);

            skin.es_internal::setParentDisplay(_parent);
        }

        /**
         * 提交属性并且立即刷新视图
         * 此方法只对使用模板渲染的皮肤对象才管用。
         * 并且要在调用方法之前有重新分配过数据,才会重新创建视图。
         * 调用此方法可能会消耗较多资源，请谨慎使用。
         */
        protected function commitPropertyAndUpdateSkin()
        {
            if( this.initialized  )
            {
                this.nowUpdateSkin();
            }
        }

        /**
         * 立即刷新皮肤
         * 此方法只对使用模板渲染的皮肤对象才有效，并且要在调用该方法之前有重新为皮肤对象分配过数据。
         * 调用此方法可能会消耗较多资源，请谨慎使用。
         */
        protected function nowUpdateSkin()
        {
            var skin:Skin = this.skin;
            when( RunPlatform(server) )
            {
                if( this.async === false ){
                    skin.display();
                }
            }then
            {
                skin.display();
            }
        }

        /**
         * 将属性推送到共享池(前后端互相访问)
         * @param name
         * @param value
         * @returns {*}
         */
        protected function push(name:String, value:*):void
        {
            properties[name] = value;
        }

        /**
         * 从共享池中拉取指定的属性值(前后端互相访问)
         * @param name
         * @returns {*}
         */
        protected function pull(name:String):*
        {
            return properties[name];
        }

        /**
        * @private
        */
        private var _owner:IContainer=null;

        /**
        * 获取一个承载此元素的容器
        * 默认返回null在当前节点中添加
        */
        public function get owner():IContainer
        {
            return _owner;
        }

        /**
        * 设置一个承载此元素的容器
        * 可以是任何元素节点对象
        */
        public function set owner(value:IContainer):void
        {
            _owner = value;
        }
    }
}
