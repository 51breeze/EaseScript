/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.HorizontalAlign;
    import es.core.VerticalAlign;
    public class Layout extends EventDispatcher
    {
        /**
         * @constructor
         */
        public function Layout()
        {
            super();
        }

        /**
         * @private
         */
        private var _target:Element=null;

        /**
         * 获取一个需要设置位置的目标元素
         * @return {Element}
         */
        public function get target():Element
        {
            return _target;
        }

        /**
         * 指定一个需要设置位置的目标元素
         * @param value
         */
        public function set target(value:Element)
        {
            _target = value;
            System.getGlobalEvent().addEventListener(Event.INITIALIZE_COMPLETED,this.start,false,0,this);
        }

        /**
         * @private
         */
        private var _horizontalAlign:String = HorizontalAlign.CENTER;

        /**
         * 指定相对于视口的水平对齐属性
         * @return {String}
         */
        public function set horizontalAlign(value:String):void
        {
            if( [HorizontalAlign.LEFT,HorizontalAlign.CENTER,HorizontalAlign.RIGHT, HorizontalAlign.JUSTIFY,HorizontalAlign.CONTENT_JUSTIFY].indexOf(value)<0 )
            {
                throw new ReferenceError("Invalid horizontalAlign value the '"+value+"'");
            }
            _horizontal = value;
        }

        /**
         * 获取相对于视口的水平对齐属性
         * @return {String}
         */
        public function get horizontalAlign():String
        {
           return _horizontalAlign;
        }

        /**
         * @private
         */
        private var _verticalAlign:String = VerticalAlign.MIDDLE;

        /**
         * 获取相对于视口的垂直对齐属性
         * @return {String}
         */
        public function set verticalAlign(value:String):void
        {
            if( [VerticalAlign.TOP,VerticalAlign.MIDDLE,VerticalAlign.BOTTOM,VerticalAlign.JUSTIFY,VerticalAlign.CONTENT_JUSTIFY].indexOf(value)<0 )
            {
                throw new ReferenceError("Invalid vertical value the '"+value+"'");
            }
            _verticalAlign = value;
        }

        /**
         * 指定相对于视口的垂直对齐属性
         * @return {String}
         */
        public function get verticalAlign():String
        {
           return _verticalAlign;
        }

        /**
         * @private
         */
        private var _gap:int = 0;

        /**
         * 指定水平的偏移量
         * @param value
         */
        public function set gap(value:int):void{
            _gap = value;
        }

        /**
         * 获取水平的偏移量
         * @param value
         */
        public function get gap():int{
            return _gap ;
        }

        /**
         * 开始调整位置
         */
        protected function start()
        {
            _fixed = Element.isWindow( viewport[0] );
            if( _fixed ){
                this.target.style("position","fixed");
            }else{
                var win:Element = Element(window);
                if( !win.hasEventListener(Event.RESIZE, this.onResize) )
                {
                    win.addEventListener(Event.RESIZE, this.onResize, false, 0, this);
                }
                var parent:Element = this.target.parent();
                if( Element.contains(this.viewport, this.target) )
                {
                    if( parent.style("position") ==="static" )
                    {
                        parent.style("position","relative");
                    }
                    if( this.target.style("position") ==="static" )
                    {
                        this.target.style("position","relative");
                    }

                }else if( this.target.style("position") ==="static" )
                {
                    this.target.style("position","absolute");
                }
            }
            var v:String=this.target.style("zIndex") as String;
            if( !v || v.toLowerCase()==="auto" )
            {
                this.target.style("zIndex",1);
            }
            this.reposition();
        }

        /**
         * 当前窗口调整时调度
         * @param e
         */
        protected function onResize(e:Event)
        {
            this.reposition();
        }

        /**
         * 调整目标元素相对于视口的位置
         */
        protected function reposition():void
        {
            var target:Element = this.target;
            var viewportWidth:int    = target.width() +  target.scrollLeft();
            var viewportHeight:int   = target.height() + target.scrollTop();
            var paddingLeft  = parseInt( target.style('paddingLeft') )  || 0;
            var paddingRight = parseInt( target.style('paddingRight') ) || 0;
            var paddingTop   = parseInt( target.style('paddingTop') )   || 0;
            var paddingBottom= parseInt( target.style('paddingBottom') )|| 0;

            var hValue = 0;
            var vValue = 0;
            var gap:int = this.gap;
            var x:int = gap+paddingLeft;
            var y:int = gap+paddingTop;
            var maxRowHeight:int = 0;
            var children:Array=[];
            var countHeight:int = 0;
            var countWidth:int = 0;

            switch ( this.horizontalAlign )
            {
                case "right" :
                    hValue = 1;
                    break;
                case "center" :
                    hValue = 0.5;
                    break;
            }

            switch ( this.verticalAlign )
            {
                case "bottom" :
                    vValue = 1;
                    break;
                case "middle" :
                    vValue = 0.5;
                    break;
            }

            this.target.children(":not([includeLayout=false])").forEach(function(elem:Node,index){

                this.style('position','absolute');
                var childWidth = this.width();
                var childHeight= this.height();
                var marginLeft =  parseInt( this.style('marginLeft') ) || 0;
                var marginRight =  parseInt( this.style('marginRight') ) || 0;
                var marginTop = parseInt( this.style('marginTop') ) || 0;
                var marginBottom = parseInt( this.style('marginBottom') ) || 0;

                //从第二个子级元素开始，如大于了容器宽度则换行
                if( x+childWidth+gap+marginLeft+marginRight+paddingRight > viewportWidth && index > 0)
                {
                    y += maxRowHeight;
                    x = gap+paddingLeft;
                    maxRowHeight = 0;
                }

                children.push({
                    "target": elem,
                    'left': x + marginLeft,
                    'top': y + marginTop,
                    'width':childWidth,
                    'height':childHeight
                });

                x += childWidth+gap+marginRight;
                maxRowHeight = Math.max(maxRowHeight, childHeight+marginTop+marginBottom+gap );
                countHeight = maxRowHeight + y;
                countWidth = Math.max(countWidth, x + paddingRight);
            });

            if( children.length > 0 )
            {
                 var xOffset:int=Math.floor( (viewportWidth-countWidth) * hValue);
                 var yOffset:int=Math.floor( (viewportHeight - countHeight) * vValue);
                 var index:int=0;
                 for( ; index < children.length ; index++ )
                 {
                     var child = children[index];
                     Element(child.target).left( child.left + xOffset ).top( child.top + yOffset );
                 }
            }
        }
    }
}