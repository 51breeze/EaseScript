/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.BaseLayout;
    public class HorizontalLayout extends BaseLayout
    {
        public static const LEFT:String = "left";
        public static const CENTER:String = "center";
        public static const RIGHT:String = "right";
        public static const JUSTIFY:String = "justify";
        public static const CONTENT_JUSTIFY:String = "contentJustify";

        /**
         * @constructor
         */
        public function HorizontalLayout()
        {
            super();
        }

        /**
         * @private
         */
        private var _horizontalAlign:String = LEFT;

        /**
         * 指定相对于视口的水平对齐属性
         * @return {String}
         */
        public function set horizontalAlign(value:String):void
        {
            if( [HorizontalLayout.LEFT,HorizontalLayout.CENTER,HorizontalLayout.RIGHT, HorizontalLayout.JUSTIFY,HorizontalLayout.CONTENT_JUSTIFY].indexOf(value)<0 )
            {
                throw new ReferenceError("Invalid horizontalAlign value the '"+value+"'");
            }
            _horizontalAlign = value;
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
         * 调整目标元素相对于视口的位置
         */
        override protected function calculateChildren( parentWidth:int, parentHeight:int):void
        {
            var target:Element = this.target.element;
            var paddingLeft:int  = parseInt( target.style('paddingLeft') )  || 0;
            var paddingRight:int = parseInt( target.style('paddingRight') ) || 0;
            var paddingTop:int   = parseInt( target.style('paddingTop') )   || 0;
            var paddingBottom:int = parseInt( target.style('paddingBottom') )|| 0;
            var gap:int = this.gap;
            var x:int = gap;
            var y:int = gap;
            var maxRowHeight:int = 0;
            var countHeight:int = 0;
            var countWidth:int = 0;
            var self:HorizontalLayout = this;
            var children:Array=[];
            target.children(":not([includeLayout=false])").forEach(function(elem:Object,index:*)
            {
                var box:Object = self.getRectangleBox(this);
                var newValue:Object={target:elem,rect:box};
                newValue.height = self.calculateHeight(this,parentHeight);
                newValue.width = self.calculateWidth(this,parentWidth);

                if( !isNaN(box.top) && !isNaN(box.bottom) )
                {
                    newValue.height = parentHeight - box.top - box.bottom;

                }else if( isNaN(box.top) )
                {
                    newValue.top = y+box.marginTop;
                }

                if( !isNaN(box.left) && !isNaN(box.right) )
                {
                    newValue.width = parentWidth - box.top - box.bottom;

                }else if( isNaN(box.left) )
                {
                    newValue.left=x+box.marginLeft;
                }

                children.push(newValue);
                x += gap+newValue.width+box.marginRight+box.marginLeft;
                maxRowHeight = Math.max(maxRowHeight, gap+newValue.height+box.marginTop+box.marginBottom );
                countHeight = maxRowHeight;
                countWidth = Math.max(countWidth, x );
            });

            var xOffset:int=0;
            var widthOffset:int=0;
            var align:String = this.horizontalAlign;
            switch ( align )
            {
                case "right" :
                    xOffset = Math.floor( parentWidth-countWidth );
                    break;
                case "center" :
                    xOffset = Math.floor( (parentWidth-countWidth) * 0.5);
                    break;
                case "contentJustify" :
                    xOffset = Math.max( Math.round( ( parentWidth - countWidth - paddingLeft - paddingRight ) / (children.length -1) ), 0 );
                    break;
                case "justify" :
                    widthOffset = Math.max( Math.round( ( parentWidth - countWidth - paddingLeft - paddingRight ) / children.length ), 0 );
                    xOffset = widthOffset;
                    break;
            }

            children.forEach(function(item:Object,index:*){
                var childElement:Element = new Element(item.target);
                var left:int = (isNaN(item.rect.left) ? item.left : item.rect.left) as int;
                var top:int = (isNaN(item.rect.top) ? item.top : item.rect.top) as int;
                if( align === CONTENT_JUSTIFY  || align === JUSTIFY){
                    left+=xOffset * index;
                }else{
                   left +=xOffset;
                }
                childElement.style("cssText",{
                    left:left,
                    top:top,
                    width:item.width+widthOffset,
                    height:item.height,
                    position:'absolute'
                });
            });
            this.setLayoutSize( parentWidth, parentHeight );
        }
    }
}
