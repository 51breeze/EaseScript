/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.interfaces.IDisplay;
    public class BaseLayout extends EventDispatcher
    {
        /**
         * 布局子级对象
         */
        private static var rootLayouts:Array=[];

        /**
         * @private
         */
        private static var initialize:Boolean = false;

        /**
         * 初始化布局
         */
        static private function initRootLayout()
        {
            if( initialize===false )
            {
                initialize = true;
                System.getGlobalEvent().addEventListener( Event.INITIALIZE_COMPLETED ,nowUpdateLayout );
                System.getGlobalEvent().addEventListener( Event.RESIZE, nowUpdateLayout );
            }
        }

        /**
         * 更新所有的布局对象
         */
        static private function nowUpdateLayout()
        {
            var len:int = rootLayouts.length;
            var index:int = 0;
            for( ;index<len;index++ )
            {
                var layout:BaseLayout = rootLayouts[index] as BaseLayout;
                layout.nowUpdateChildren( (int)layout.viewport.width(), (int)layout.viewport.height() );
            }
        }

        /**
         * 查找布局对象
         * @param children
         * @param elem
         * @return {*}
         */
        static private function findLayoutByTarget(children:Array, target:* ):BaseLayout
        {
            var len:int = children.length;
            var i:int = 0;
            for(;i<len;i++)
            {
                var item:BaseLayout = children[i] as BaseLayout;
                if( item.target === target )
                {
                    return item;
                }
                var layout:BaseLayout = findLayoutByTarget(item._children, target);
                if( layout ){
                    return layout;
                }
            }
            return null;
        }

        /**
         * 查找当前布局的父对象
         * @param children
         * @param elem
         * @return {*}
         */
        static private function findParentLayout(children:Array, elem:Element ):BaseLayout
        {
            var len:int = children.length;
            var i:int = 0;
            for(;i<len;i++)
            {
                var item:BaseLayout = children[i] as BaseLayout;
                var parent:BaseLayout = findParentLayout(item._children, elem);
                if( parent )
                {
                    return parent;
                }
                if( Element.contains( item.target.element, elem ) )
                {
                    return item;
                }
            }
            return null;
        }

        /**
         * 查找当前元素下的子级布局对象
         * @param children
         * @param elem
         * @return {Array}
         */
        static private function findChildrenLayout(children:Array, elem:Element ):Array
        {
            var len:int = children.length;
            var i:int = 0;
            var results:Array=[];
            for(;i<len;i++)
            {
                var item:BaseLayout = children[i] as BaseLayout;
                if( Element.contains(elem,item.target.element) )
                {
                    results.push(item);
                }
            }
            return results;
        }

        /**
         * 当指定的 layoutChildren 中有一个或者多个属于 parent 布局对象时则移动到 parent 子级中
         * @param parent
         * @param replaceParent
         * @return {Boolean}
         */
        static private function assignParentForLayoutChildren( layoutChildren:Array, parent:BaseLayout ):Boolean
        {
            var children:Array = findChildrenLayout( layoutChildren , parent.target.element );
            if( children.length > 0 )
            {
                for(var i:int = 0;i<children.length;i++)
                {
                    layoutChildren.splice( layoutChildren.indexOf( children[i] ),1 );
                    parent._children.push( children[i] );
                    (children[i] as BaseLayout)._parent = parent;
                }
                return true;
            }
            return false;
        }

        /**
         * 添加布局对象到布局流中
         * @param layout
         */
        static private function addLayout( layout:BaseLayout )
        {
            var parent:BaseLayout = findParentLayout(rootLayouts, layout.target.element );
            if( parent ){
                assignParentForLayoutChildren(parent._children,layout);
                if(  parent._children.indexOf(layout)<0 )
                {
                    parent._children.push( layout );
                    layout._parent = parent;
                }
            }else
            {
                assignParentForLayoutChildren(rootLayouts , layout );
                if( rootLayouts.indexOf(layout) < 0 ){
                    rootLayouts.push( layout );
                }
            }
            initRootLayout();
        }

        /**
         * 移除指定的布局对象
         * @param layout
         */
        static private function removeLayout( layout:BaseLayout )
        {
            var layoutChildren:Array= rootLayouts;
            if( layout._parent )
            {
                layoutChildren = layout._parent._children;
            }
            var index:int =  layoutChildren.indexOf( layout );
            if( index >= 0 )
            {
                delete layoutChildren.splice( index, 1 );
            }
        }

        /**
         * @private
         * @param children
         */
        private static function updateRootLayout( children:Array )
        {
            var seek:int = 0;
            while( children.length > 1 && seek < children.length )
            {
                 var aLayout:BaseLayout = children[ seek ] as BaseLayout;
                 var aElement: Element = aLayout._target.element;
                 var index:int = seek+1;
                 for( ;index<children.length;index++)
                 {
                     var bLayout:BaseLayout = children[index] as BaseLayout;
                     var bElement:Element = bLayout._target.element;
                     if( Element.contains(aElement, bElement) )
                     {
                         aLayout._children.push( bLayout );
                         bLayout._parent = aLayout;
                         children.splice(index,1);
                         index--;
                         updateRootLayout( aLayout._children );

                     }else if( Element.contains(bElement,aElement) )
                     {
                         bLayout._children.push( aLayout );
                         aLayout._parent = bLayout;
                         children.splice(seek,1);
                         updateRootLayout( bLayout._children );
                         break;
                     }
                 }
                 seek++;
            }
        }

        /**
         * @private
         */
        private var _target:IDisplay=null;

        /**
         * @private
         */
        private var _children:Array=[];

        /**
         * @private
         */
        private var _parent:BaseLayout=null;

        /**
         * @constructor
         */
        public function BaseLayout()
        {
            super();
        }

        /**
         * 设置需要布局的目录对象
         * @param value
         */
        public function set target(value:IDisplay):void
        {
            if( value !== _target )
            {
                if( _target )
                {
                    var layoutTarget:BaseLayout = findLayoutByTarget(rootLayouts, _target);
                    if( layoutTarget )
                    {
                        removeLayout( layoutTarget );
                    }
                }
                var self:BaseLayout = this;
                value.element.addEventListener( ElementEvent.ADD , function (e:ElementEvent) {
                     if( this.style('position') === "static" )
                     {
                        this.style('position','relative');
                     }
                     addLayout(self);
                });
                value.element.removeEventListener( ElementEvent.REMOVE , function (e:ElementEvent) {
                     this.removeEventListener(ElementEvent.REMOVE);
                     removeLayout(self);
                });
               // styleChange( value.element );
                _target = value;
            }
        }

        /**
         * 获取需要布局的目录对象
         * @return {IDisplay}
         */
        public function get target():IDisplay
        {
            return _target;
        }

        /**
         * @private
         */
        private var _viewport:Element=null;

        /**
         * 设置布局对象的目标视口
         * @param value
         */
        public function set viewport(value:Element)
        {
            _viewport = value;
            styleChange( _viewport );
        }

        /**
         * 获取布局对象的目标视口,默认为目标对象的父级显示对象
         * @return {Element}
         */
        public function get viewport():Element
        {
            if( _viewport === null )
            {
                _viewport = this._target.element.parent();
                styleChange( _viewport );
            }
            return _viewport;
        }

        /**
         * @private
         * @param target
         */
        private function styleChange(target:Element)
        {
            var self:BaseLayout = this;
            var oldWidth:int=NaN;
            var oldHeight:int=NaN;
            target.addEventListener( StyleEvent.CHANGE , function(e:StyleEvent) {
                var width:int = target.width();
                var height:int = target.height();
                if( oldWidth !== width || oldHeight !== height )
                {
                    oldWidth = width;
                    oldHeight = height;
                    self.nowUpdateChildren( width, height );
                }
            });
        }

        /**
         * 查找子级布局
         * @param nodeElement
         * @return {BaseLayout}
         */
        protected function getChildByNode( nodeElement:* ):BaseLayout
        {
            var len:int = _children.length;
            var i:int = 0;
            for(;i<len;i++)
            {
                var item:BaseLayout = _children[i] as BaseLayout;
                if( item.target.element[0] === nodeElement )
                {
                    return item;
                }
            }
            return null;
        }

        /**
         * @private
         */
        private var _gap:int = 0;

        /**
         * 指定水平的偏移量
         * @param value
         */
        public function set gap(value:int):void
        {
            _gap = value;
        }

        /**
         * 获取水平的偏移量
         * @param value
         */
        public function get gap():int
        {
            return _gap;
        }

        /**
         * 获取元素的宽度，返回的值的优先级为 explicitWidth, percentWidth / baseWidth * 100, 实际宽度
         * 如果有设置 maxWidth or minWidth 则会返回不大于和不小于指定的值
         * @param elem
         * @param baseWidth
         * @return {*}
         */
        protected function calculateWidth(elem:Element, baseWidth:int ):int
        {
            if( !elem.hasProperty("init-layout-width") )
            {
                if( !elem.hasProperty("percentWidth") && !elem.hasProperty("explicitWidth") )
                {
                    var currentElem:Object = elem.current();
                    var cssWidth:String = (currentElem.currentStyle || currentElem.style)["width"] as String;
                    if( cssWidth && cssWidth.charAt(cssWidth.length - 1) === "%" )
                    {
                        elem.property("percentWidth", (float)cssWidth );
                    }else
                    {
                        elem.property("explicitWidth", (int)elem.width() );
                    }
                }
                elem.property("init-layout-width", 1);
            }

            var value:int=0;
            if( elem.hasProperty("explicitWidth") )
            {
                value= (int)elem.property("explicitWidth");

            }else if( elem.hasProperty("percentWidth") )
            {
                value = (float)elem.property("percentWidth");
                value = value > 0 ? value * baseWidth / 100 : 0;
            }

            var maxWidth:int = 1000000;
            var minWidth:int= 0;
            if( elem.hasProperty("maxWidth") )
            {
                maxWidth =  (int)elem.property("maxWidth");
            }
            if( elem.hasProperty("minWidth") )
            {
                minWidth =  (int)elem.property("minWidth");
            }
            return Math.max( Math.min( value, maxWidth ), minWidth );
        }

        /**
         * 获取元素的高度，返回的值的优先级为 explicitHeight, percentHeight / baseHeight * 100, 实际高度
         * 如果有设置 maxHeight or minHeight 则会返回不大于和不小于指定的值
         * @param elem
         * @param baseWidth
         * @return {*}
         */
        protected function calculateHeight(elem:Element, baseWidth:int ):int
        {
            if( !elem.hasProperty("init-layout-height") )
            {
                if( !elem.hasProperty("percentHeight") && !elem.hasProperty("explicitHeight") )
                {
                    var currentElem:Object = elem.current();
                    var cssHeight:String = (currentElem.currentStyle || currentElem.style)["height"] as String;
                    if( cssHeight && cssHeight.charAt(cssHeight.length - 1) === "%" )
                    {
                        elem.property("percentHeight", (float)cssHeight );
                    }else
                    {
                        elem.property("explicitHeight", (int)elem.height() );
                    }
                }
                elem.property("init-layout-height", 1);
            }

            var value:int=0;
            if( elem.hasProperty("explicitHeight") )
            {
                value = (int)elem.property("explicitHeight");

            }else if( elem.hasProperty("percentHeight") )
            {
                value = (int)elem.property("percentHeight");
                value = value > 0 ? value * baseWidth / 100 : 0;
            }

            var maxHeight:int = 1000000;
            var minHeight:int= 0;
            if( elem.hasProperty("maxHeight") )
            {
                maxHeight =  (int)elem.property("maxHeight");
            }
            if( elem.hasProperty("minHeight") )
            {
                minHeight =  (int)elem.property("minHeight");
            }
            return Math.max( Math.min( value, maxHeight ), minHeight );
        }

        /**
         * @private
         */
        private static var rectangle:Array=["Top","Bottom","Left","Right"];

        /**
         * 获取一个元素已指定的矩形边距
         * @param elem
         * @return {Object}
         */
        protected function getRectangleBox(elem:Element):Object
        {
            var value:Object={};
            var i:int=0;
            for(;i<4;i++)
            {
                var uName:String = rectangle[i] as String;
                var lName:String = uName.toLowerCase();
                value[lName] = (int)elem.property(lName);
                value['margin'+uName] = (int)elem.style('margin'+uName);
            }
            return value;
        }

        /**
         * 设置布局元素大小
         * @param width
         * @param height
         */
        protected function setLayoutSize(width:int,height:int)
        {
            this.target.element.style('cssText',{
                width:width,
                height:height,
            });
        }

        /**
         * 立即更新子级
         * @param width
         * @param height
         */
        protected function nowUpdateChildren( width:int, height:int ):void
        {
            width = this.calculateWidth( this.target.element, width );
            height = this.calculateHeight( this.target.element, height );
            var len:int = this._children.length;
            var index:int = 0;
            var parentNode:Node = this.target.element.current() as Node;
            for(;index<len;index++)
            {
                var layout:BaseLayout = this._children[index] as BaseLayout;
                var childNode:Node = layout.target.element.current() as Node;
                var isChild:Boolean = false;
                if( parentNode.hasChildNodes() )
                {
                    var j:int=0;
                    for( ;j<parentNode.childNodes.length;j++ )
                    {
                        if( parentNode.childNodes.item(j)===childNode )
                        {
                            isChild = true;
                            break;
                        }
                    }
                }
                if( isChild ){
                    layout.nowUpdateChildren( width, height );
                }else{
                    layout.nowUpdateChildren( layout.viewport.width(), layout.viewport.height() );
                }
            }
            this.calculateChildren( width , height );
        }

        /**
         * 调整目标元素相对于视口的位置
         * 子级布局位置由子类中实现
         */
        protected function calculateChildren(parentWidth:int, parentHeight:int):void
        {
            //this.setLayoutSize(parentWidth,parentHeight);
        }
    }
}