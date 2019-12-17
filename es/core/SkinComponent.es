/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.Component;
    import es.events.SkinEvent;
    import es.core.Skin;
    import es.interfaces.IContainer;
    import es.interfaces.IDisplay;
    import es.core.es_internal; 

    public class SkinComponent extends Component implements IContainer,IDisplay
    {
        private var _componentId:String;
        public function SkinComponent( componentId:String = UIDInstance() )
        {
            super();
            _componentId = componentId;
        }

        /**
         * 获取此组件的唯一ID
         * @returns {String}
         */
        public function getComponentId( uid:String="" ):String
        {
            return uid ? _componentId+''+uid : _componentId;
        }

        public function setComponentId( uid:String ):void
        {
            _componentId = uid;
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
                return Syntax(javascript) ? this.async : !this.async;
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
            if( skinObj !== old )
            {
                this._skin = skinObj;
                if( this.initialized )
                {
                    if( this.hasEventListener(PropertyEvent.CHANGE) )
                    {
                        var event:PropertyEvent = new PropertyEvent(PropertyEvent.CHANGE);
                        event.oldValue = old;
                        event.newValue = skinObj;
                        event.property = 'skin';
                        this.dispatchEvent(event);
                    }

                    if( old && old.hasEventListener( SkinEvent.UNINSTALL ) )
                    {
                        var uninstall:SkinEvent = new SkinEvent( SkinEvent.UNINSTALL );
                        uninstall.oldSkin = old;
                        uninstall.newSkin = skinObj;
                        old.dispatchEvent( uninstall );
                    }

                    this.commitProperties();
                    if( skinObj.hasEventListener( SkinEvent.INSTALL ) )
                    {
                        var install:SkinEvent = new SkinEvent( SkinEvent.INSTALL );
                        install.oldSkin = old;
                        install.newSkin = skinObj;
                        skinObj.dispatchEvent( install );
                    }
                    this.nowUpdateSkin();
                }
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
                    if( this.hasEventListener(PropertyEvent.CHANGE) )
                    {
                        var event:PropertyEvent = new PropertyEvent(PropertyEvent.CHANGE);
                        event.oldValue = old;
                        event.newValue = value;
                        event.property = 'skinClass';
                        this.dispatchEvent(event);
                    }

                    this.skin = (Skin)new value( this );
                }
            }
        }

        /**
         * 设置表格的圆角值
         * @param value
         */
        public function set radius(value:Number):void
        {
             this.setAssign("radius", value);
        }

        /**
         * 获取表格的圆角值
         * @param value
         */
        public function get radius():Number
        {
            return this.getAssign("radius", 5) as Number;
        }

        /**
         * 此组件的属性集
         * @protected
         */
        private var properties:Object={};

        /**
         * 获取此对象的高度
         */
        public function get height():uint
        {
            if( this.initialized )
            {
                return this.skin.height;
            }
            return properties.height as uint;
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
            return properties.width as uint;
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
            return properties.visible as Boolean;
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
            return properties.left as int;
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
            return properties.top as int;
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
            return properties.right as int;
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
            return properties.bottom as int;
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
        private var _parent:IContainer=null;

        /**
        * @es_internal
        */
        es_internal function setParentDisplay(value:IContainer=null):void
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
        public function get parent():IContainer
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
        private var _children:Array=[];

        /**
         * 获取所有的子级元素
         * @returns {Array}
         */
        public function get children():Array
        {
            if( this.initialized )
            {
                return this.skin.children.slice(0);
            }else{
                return _children.slice(0);
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
                this.skin.children=value.slice(0);
            }else{
               _children = value.slice(0);
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
                    index = index+_children.length;
                }
                return _children[ index ] as IDisplay;
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
                return _children.indexOf(child);
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
                _children.push( child );
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
                    index = index+_children.length;
                }
                _children.splice(index,0,child);
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
                var index:int = this._children.indexOf(child);
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
                    index = index+_children.length;
                }
                if( _children[index] ){
                    return _children.splice(index,1) as IDisplay;
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
                _children = [];
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
        override public function addEventListener(type:String,callback:Function,useCapture:Boolean=false,priority:int=0,reference:Object=null):EventDispatcher
        {
            super.addEventListener(type,callback,useCapture,priority,reference);
            if( this.initialized )
            {
                this.skin.addEventListener(type,callback,useCapture,priority,reference);

            }else
            {
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
            }
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
            var flag:Boolean = super.removeEventListener(type,listener);
            if( this.initialized )
            {
                return this.skin.removeEventListener(type,listener);

            }else if( events.hasOwnProperty(type) )
            {
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
            }
            return flag;
        }

        /**
        * 调度指定事件
        * @param event
        * @returns {boolean}
        */
        override public function dispatchEvent( event:Event ):Boolean
        {
            return super.dispatchEvent(event);
        }

        /**
        * 判断是否有指定类型的侦听器
        * @param type
        * @param listener
        * @returns {boolean}
        */
        override public function hasEventListener( type:String , listener:Function=null):Boolean
        {
            return super.hasEventListener(type,listener);
        }

        /**
         * 渲染显示皮肤对象。
         * 此方法主要是用来初始化并安装组件时使用。
         * 如果有属性更新并期望应用到皮肤时请使用 nowUpdateSkin 方法。
         */
        public function display():Element
        {
            when( RunPlatform(server) )
            {
                if( !this.initialized )
                {
                    this.initializing();
                    this.nowUpdateSkin();
                }
                return this.skin.element;

            }then
            {
                if( !this.initialized )
                {
                    this.initializing();
                    this.nowUpdateSkin();

                }else if( !this.skin.parent )
                {
                    this.nowUpdateSkin();
                }
                return this.skin.element;
            }
        };

        /**
         * @override
         * 初始化组件
         * 此方法只会在初始化时调用一次且由内部调用，无需手动调用。
         * 如果需要判断是否已初始化请使用 initialized 属性
         */
        override protected function initializing()
        {
            if( !this.initialized )
            {
                super.initializing();
                this.commitProperties();
            }
        }

        /**
        * @private
        */
        private var _dataset:Object= {};

        /**
        * 获取一个指定名称的值
        */
        protected function getAssign(name:String,defaultValue:*=null):*
        {
            var val:* = null;
            if( this.initialized )
            {
                val = this.skin.assign(name);
            }else{
                val = _dataset[ name ];
            }
            return val == null ? defaultValue : _dataset[ name ];
        }

        /**
        * 设置一个指定名称的值
        */
        protected function setAssign(name:String,value:*):void
        {
            if( this.initialized )
            {
                this.skin.assign(name,value);
            } 
            _dataset[ name ]=value;
        }

        /**
        * 在第一次安装皮肤对象时调用。主要用来向皮肤对象初始化数据。
        */
        protected function commitProperties()
        {
            var skin:Skin = this.skin;
            skin.dataset = _dataset;
            if( _children.length > 0 )
            {
                skin.children = _children;
            }

            Object.forEach(this.properties, function (value:*, name:String){
                if( name in skin )
                {
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
                    skin.removeEventListener(type, item.callback as Function);
                    skin.addEventListener(type, item.callback as Function, item.useCapture as Boolean, item.priority as int, item.reference as Object);
                }

            },this);

            if( _parent )
            {
                skin.es_internal::setParentDisplay(_parent);
            }
        }

        /**
        * 在更新皮肤对象之前调用此方法。主要实现向皮肤对象中更新需要的数据
        */
        protected function updateProperties()
        {
        }
       
        /**
         * 立即刷新皮肤
         * 此方法只对使用模板渲染的皮肤对象才有效，并且要在调用该方法之前有重新为皮肤对象分配过数据。
         * 调用此方法可能会消耗较多资源，请谨慎使用。
         */
        protected function nowUpdateSkin()
        {
            if( this.initialized  )
            {
                var skin:Skin = this.skin;
                this.updateProperties();
                when( RunPlatform(server) )
                {
                    if( this.async === false )
                    {
                        skin.display();
                    }

                }then
                {
                    skin.display();
                }
            }
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
