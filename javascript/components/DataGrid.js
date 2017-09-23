/*
* BreezeJS HttpRequest class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,DataSource,DataSourceEvent,SkinComponent,PaginationEvent,Element,Skin
*/

/**
 * 数据渲染器
 * @returns {DataGrid}
 * @inherit Template
 * @constructor
 */
function DataGrid(viewport)
{
    if( !(this instanceof DataGrid) )return new DataGrid(viewport);
    SkinComponent.call(this,viewport);
}
DataGrid.prototype =  Object.create(SkinComponent.prototype);
DataGrid.prototype.constructor=DataGrid;

/**
 * @private
 */
DataGrid.prototype.__dataSource__=null;

/**
 * 获取数据源对象
 * @returns {DataSource}
 */
DataGrid.prototype.dataSource=function dataSource()
{
    if( this.__dataSource__ === null  )
    {
        var self = this;
        this.__dataSource__ = new DataSource().addEventListener(DataSourceEvent.SELECT,function(event)
        {
            if( !event.waiting )
            {
                self.variable( self.dataProfile(), event.data );
                var body = self.getSkin().body;
                body.buildMode( Skin.BUILD_CHILDREN_MODE );
                Element('#'+body.attr('id') ).html( self.getRender().fetch( body.toString() )  );
                var pagination = self.getSkin().pagination;
                if( pagination )
                {
                    pagination.pageSize( this.pageSize() );
                    pagination.totalSize( this.totalSize() )
                    pagination.display();
                }
            }
        });
    }
    return this.__dataSource__;
};

/**
 * 设置数据源
 * @param source
 * @returns {*}
 */
DataGrid.prototype.source=function source(data )
{
    if( data != null )this.dataSource().source( data );
    return this;
};

/**
 * @private
 */
DataGrid.prototype.__columns__=null;

/**
 * 设置指定的列名
 * @param columns {'column':'text',...} | "column1,column2,..."
 * @returns {DataGrid}
 */
DataGrid.prototype.columns=function( columns )
{
    if( typeof columns === 'undefined' )
    {
        return this.__columns__;
    }
    if ( System.isString(columns) )
    {
        this.__columns__ = columns.split(',')
    }else
    {
        this.__columns__ = columns;
    }
    return this;
};

/**
 * @type {string}
 * @private
 */
DataGrid.prototype.__columnProfile__='columns';

/**
 * @param profile
 * @returns {*}
 */
DataGrid.prototype.columnProfile=function columnProfile( profile )
{
    if( typeof profile === "string" )
    {
        this.__columnProfile__ = profile;
        return this;
    }
    return this.__columnProfile__;
};

/**
 * @type {string}
 * @private
 */
DataGrid.prototype.__dataProfile__='data';

/**
 * @param profile
 * @returns {*}
 */
DataGrid.prototype.dataProfile=function dataProfile(profile )
{
    if( typeof profile === "string" )
    {
        this.__dataProfile__ = profile;
        return this;
    }
    return this.__dataProfile__;
};

/**
 * 初始化皮肤使用渲染器
 * @returns {*}
 */
DataGrid.prototype.skinInstaller=function skinInstaller( event )
{
    this.getSkin().body.buildMode( System.Skin.BUILD_CONTAINER_MODE );
    
    var skin = SkinComponent.prototype.skinInstaller.call(this, event )
    return this.getRender().fetch( skin.toString() );
}

/**
 * @inherit
 * @returns {boolean}
 */
DataGrid.prototype.initializing=function initializing()
{
    if( SkinComponent.prototype.initializing.call(this) )
    {
        this.variable( this.columnProfile(), this.columns() );
        var pagination = this.getSkin().pagination;
        if ( pagination )
        {
            pagination.addEventListener(PaginationEvent.CHANGE, function (e){
                this.dataSource().select(e.newValue);
            }, false, 0, this);
        }
        return true;
    }
    return false;
}

/**
 * @param view
 * @returns {Boolean}
 */
DataGrid.prototype.display=function display()
{
    SkinComponent.prototype.display.call( this );
    this.dataSource().select();
    return this;
};

System.DataGrid = DataGrid;