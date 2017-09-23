/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */


define('components/DataRender',['./Template','../compiler/javascript/modules/DataSource','../compiler/javascript/modules/DataSourceEvent','./Pagination'],
function(Template, DataSource, DataSourceEvent, Pagination)
{
    "use strict";

    /**
     * 数据渲染器
     * @param template
     * @returns {DataRender}
     * @constructor
     */
    function DataRender(viewport,option)
    {
        if( !(this instanceof DataRender) )
        {
            return new DataRender(viewport);
        }
        Template.call(this,option);
        this.viewport( viewport );
    }

    DataRender.prototype = new Template();
    DataRender.prototype.constructor=DataRender;
    DataRender.prototype.__dataSource__=null;

    /**
     * 获取设置数据源对象
     * @returns {DataSource}
     */
    DataRender.prototype.dataSource=function()
    {
        if( !(this.__dataSource__ instanceof DataSource) )
        {
            this.__dataSource__ = new DataSource()
            .addEventListener(DataSourceEvent.SELECT,function(event)
            {
                var data = event.data;
                var view = this.view();
                if( typeof view !== "string" )
                   throw new Error('invalid view');
                this.variable( this.dataProfile(), data ).getRender( view );

            },false,0,this);
        }
        return this.__dataSource__;
    };

    /**
     * 获取设置数据源
     * @param source
     * @returns {*}
     */
    DataRender.prototype.source=function( source )
    {
        if( typeof source === "undefined"  )
           return this.dataSource().source();
        this.dataSource().source(source);
        return this;
    };

    /**
     * 显示视图
     * @returns {DataRender}
     */
    DataRender.prototype.display=function( view )
    {
        this.view( view );
        this.dataSource().fetch();
        return this;
    };

    /**
     * @type {boolean}
     * @private
     */
    DataRender.prototype.__pagination__=null;

    /**
     * @param selector|NodeElement viewport
     * @param selector|NodeElement context
     * @returns {Pagination|DataRender}
     */
    DataRender.prototype.pagination=function( viewport, context )
    {
        if( typeof viewport !== "undefined" )
        {
            if( (typeof viewport === "string" || viewport instanceof Breeze) )
            {
                this.__pagination__ = new Pagination( viewport , context ).dataSource( this.dataSource() );
            }
            return this;
        }
        return this.__pagination__;
    };

    /**
     * @type {string}
     * @private
     */
    DataRender.prototype.__dataProfile__='data';

    /**
     * @param profile
     * @returns {*}
     */
    DataRender.prototype.dataProfile=function( profile )
    {
        if( typeof profile === "string" )
        {
            this.__dataProfile__ = profile;
            return this;
        }
        return this.__dataProfile__;
    };
    return DataRender;

});