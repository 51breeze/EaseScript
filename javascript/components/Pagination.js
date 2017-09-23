/*
* BreezeJS HttpRequest class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,PaginationEvent,SkinComponent,TypeError,Element,MouseEvent
*/

/**
 * 分页组件.
 * 此组件包含如下特性：
 * 皮肤元素：{info}{firstPage}{prevPage}{hiddenLeft}{links}{hiddenRight}{nextPage}{lastPage}{goto}
 * 动态变量：{totalPage}{totalRows}{rows}{current} （仅限用于info皮肤下）
 *
 * 这些皮肤元素可以自由组合位置和删减以满足各种需求。
 * 此组件支持鼠标单击和鼠标滚动事件，默认为鼠标单击事件
 * 如果同时需要支持两种事件 只需要在 options.eventType 中设置 [MouseEvent.CLICK,MouseEvent.MOUSE_WHEEL] 即可。
 * @param viewport
 * @param context
 * @returns {*}
 * @constructor
 */
function Pagination( viewport )
{
    if( !System.is(this,Pagination) )return new Pagination( viewport );
    SkinComponent.call(this,viewport);
}

Pagination.prototype= Object.create( SkinComponent.prototype );
Pagination.prototype.constructor = Pagination;

/**
 * @private
 */
function getUrl(page)
{
    return '?page='+page;
}

/**
 * @private
 */
Pagination.prototype.__url__=null;

/**
 * 设置返回一个回调函数,用来返回一个url地址
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.url=function url( callback )
{
   if( callback )
   {
       if( typeof callback !== "function" )throw new TypeError('Invalid callback');
       this.__url__ = callback;
   }
   return this.__url__ || getUrl;
};

Pagination.prototype.__attrName__='data-page';
Pagination.prototype.indexAttrName=function indexAttrName( name )
{
    if( name )
    {
        if(typeof name === "string")this.__attrName__ = name;
        return this;
    }
    return this.__attrName__;
}

/**
 * 设置总分页数
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.totalPage=function totalPage()
{
    return this.totalSize() >0 ? Math.ceil( this.totalSize() / this.pageSize() ) : 1;
};

/**
 * @private
 */
Pagination.prototype.__totalSize__=0;

/**
 * 设置获取总分页数
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.totalSize=function totalRows( num )
{
    if( typeof num === "undefined"  )return this.__totalSize__;
    this.__totalSize__ = num >> 0;
    return this;
};

/**
 * @private
 */
Pagination.prototype.__pageSize__=20;

/**
 * 每页显示多少行数据
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.pageSize=function pageSize( num )
{
    if( typeof num === "undefined" )return this.__pageSize__;
    this.__pageSize__ = num >> 0;
    return this;
};

/**
 * @returns {Number}
 */
Pagination.prototype.offset=function offset()
{
    return (this.current() - 1) * this.pageSize();
};

/**
 * @private
 */
Pagination.prototype.__current__=1;

/**
 * 设置获取总分页数
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.current=function current( num )
{
    if( typeof num === "undefined" )return this.__current__;
    num >>= 0;
    num =Math.min( Math.max(1, num ), this.totalPage() );
    if( num !== this.__current__ )
    {
        var old = this.__current__;
        this.__current__ = num;
        var event = new PaginationEvent( PaginationEvent.CHANGE );
        event.oldValue = old;
        event.newValue = num;
        this.dispatchEvent( event );
    }
    return this;
};

/**
 * @private
 */
Pagination.prototype.__link__=7;

/**
 * 设置获取分页的按扭数
 * @param num
 * @returns {*}
 */
Pagination.prototype.link=function link( num )
{
    if( typeof num === "undefined" )return this.__link__;
    this.__link__ = num >> 0;
    return this;
}

/**
 * 初始化皮肤
 * @returns {String}
 */
Pagination.prototype.skinInstaller=function skinInstaller( event )
{
    var render = this.getRender();
    var current = this.current();
    var totalPage = this.totalPage();
    var link = this.link();
    var offset =  Math.max( current - Math.ceil( link / 2 ), 0 );
    offset = offset+link > totalPage ? offset-( offset+link - totalPage ) : offset;
    render.variable('totalPage', totalPage );
    render.variable('rows', this.pageSize() );
    render.variable('offset', this.offset() );
    render.variable('url', this.url() );
    render.variable('current', current );
    render.variable('first', 1 );
    render.variable('prev', Math.max(current-1,1) );
    render.variable('next', Math.min(current+1,totalPage) );
    render.variable('last', totalPage );
    render.variable('link', offset>=0 ? System.range(1+offset, link+offset+1 , 1) : [1] );
    return render.fetch( SkinComponent.prototype.skinInstaller.call(this, event) );
}

Pagination.prototype.initializing=function initializing()
{
    if( SkinComponent.prototype.initializing.call(this) )
    {
        this.getViewport().addEventListener( MouseEvent.MOUSE_WHEEL , function (e) {
            var page = this.current();
            this.current( e.wheelDelta > 0 ? page+1 : page-1 );
        },false,0,this);
        return true;
    }
    return false;

}

/**
 * 渲染显示皮肤
 * @returns {Pagination}
 */
Pagination.prototype.display=function display()
{
    SkinComponent.prototype.display.call(this);
    var elem = new Element('a', this.getViewport() );
    var self = this;
    elem.addEventListener( MouseEvent.CLICK, function (e) {
        e.preventDefault();
        this.current( e.target )
        var page = this.property( self.indexAttrName() ) >> 0;
        if( page > 0 )
        {
            self.current( page );
        }
    })
    return this;
}

System.Pagination = Pagination;