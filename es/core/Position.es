/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    public class Position extends EventDispatcher
    {
        /**
         * 水平左边对齐
         */
        static public const HORIZONTAL_LEFT:String="left";

        /**
         * 水平中间对齐
         */
        static public const HORIZONTAL_CENTER:String="center";

        /**
         * 水平右边对齐
         */
        static public const HORIZONTAL_RIGHT:String="right";

        /**
         * 垂直顶端对齐
         */
        static public const VERTICAL_TOP:String="top";

        /**
         * 垂直中间对齐
         */
        static public const VERTICAL_MIDDLE:String="middle";

        /**
         * 垂直底部对齐
         */
        static public const VERTICAL_BOTTOM:String="bottom";

        /**
         * @constructor
         */
        public function Position()
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
         * 是否需要固定在相对于窗口的位置
         */
        private var _fixed:Boolean=false;

        /**
         * @private
         */
        private var _viewport:Element=null;

        /**
         * 获取一个需要对齐的视口
         * @param value
         */
        public function get viewport():Element
        {
            if( _viewport===null )
            {
                 return _target.parent();
            }
            return _viewport;
        }

        /**
         * 指定一个需要对齐的视口
         * 如果是一个window元素，则指定的目标元素会固定在相对于window的位置
         * @param value
         */
        public function set viewport(value:Element)
        {
            _viewport = value;
        }

        /**
         * @private
         */
        private var _horizontal:String = Position.HORIZONTAL_CENTER;

        /**
         * 指定相对于视口的水平对齐属性
         * @return {String}
         */
        public function set horizontal(value:String):void
        {
            if( [Position.HORIZONTAL_LEFT,Position.HORIZONTAL_CENTER,Position.HORIZONTAL_RIGHT].indexOf(value)<0 )
            {
                throw new ReferenceError("Invalid horizontal value the '"+value+"'");
            }
            _horizontal = value;
        }

        /**
         * 获取相对于视口的水平对齐属性
         * @return {String}
         */
        public function get horizontal():String
        {
           return _horizontal;
        }

        /**
         * @private
         */
        private var _vertical:String = Position.VERTICAL_MIDDLE;

        /**
         * 获取相对于视口的垂直对齐属性
         * @return {String}
         */
        public function set vertical(value:String):void
        {
            if( [Position.VERTICAL_TOP,Position.VERTICAL_MIDDLE,Position.VERTICAL_BOTTOM].indexOf(value)<0 )
            {
                throw new ReferenceError("Invalid vertical value the '"+value+"'");
            }
            _vertical = value;
        }

        /**
         * 指定相对于视口的垂直对齐属性
         * @return {String}
         */
        public function get vertical():String
        {
           return _vertical;
        }

        /**
         * @private
         */
        private var _offsetX:int = 0;

        /**
         * 指定水平的偏移量
         * @param value
         */
        public function set offsetX(value:int):void{
            _offsetX = value;
        }

        /**
         * 获取水平的偏移量
         * @param value
         */
        public function get offsetX():int{
            return _offsetX ;
        }

        /**
         * @private
         */
        private var _offsetY:int = 0;

        /**
         * 获取垂直的偏移量
         * @param value
         */
        public function set offsetY(value:int):void{
            _offsetY = value;
        }

        /**
         * 指定垂直的偏移量
         * @return {Number}
         */
        public function get offsetY():int
        {
            return _offsetY;
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
            var viewportWidth:int  = this.viewport.width();
            var viewportHeight:int = this.viewport.height();
            var targetWidth:int    = this.target.width();
            var targetHeight:int   = this.target.height();
            var x:int = 0;
            var y:int = 0;

            if( Element.contains(this.viewport, this.target) )
            {
                viewportWidth+=this.viewport.scrollLeft();
                viewportHeight+=this.viewport.scrollTop();
            }

            switch ( this.horizontal )
            {
                case "right" :
                    x= viewportWidth - targetWidth;
                    break;
                case "center" :
                    x=( viewportWidth - targetWidth ) / 2;
                    break;
            }

            switch ( this.vertical )
            {
                case "bottom" :
                    y=viewportHeight - targetHeight;
                    break;
                case "middle" :
                    y= ( viewportHeight - targetHeight ) / 2 ;
                    break;
            }
            this.target.left( x + this.offsetX );
            this.target.top(  y + this.offsetY );
        }
    }
}