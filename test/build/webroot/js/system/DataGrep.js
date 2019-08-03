/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object,Array,Function,Error,Symbol
 */

/**
 * 筛选条件组合
 * @param column
 * @param value
 * @param operational
 * @param logic
 * @returns {DataGrep}
 */
function strainer( column , value, operational, logic ,type )
{
    logic = logic==='or' ? '||' : '&&';
    this[ this.length ]= {'logic':logic,'column':column,'value':value,'operational':operational,'type':type};
    this.length++;
    return this;
};

/**
 * 根据据指定的条件生成筛选器
 * @returns {Function|*}
 */
function createFilter()
{
    var i=0, item,type,value,refvalue,command=[];
    for( ; i < this.length ; i++ )
    {
        item =  this[i];
        command.length===0 || command.push(item.logic);
        type = typeof item.value;
        value = 'this[' + i + '].value';

        if( item.value instanceof DataGrep )
        {
            command.push( '!!this[' + i + '].value.filter().call(this[' + i + '].value,arguments[0])' );

        }else if( type === "function" )
        {
            command.push( 'this[' + i + '].value.call(this,arguments[0])' );

        }else if( item.operational=='index' || item.operational=='notindex')
        {
            var index= "arguments[1]";
            var flag = item.operational === 'notindex' ? '!' : '';
            value = value.split(',');
            command.push( flag+"("+value[0]+" >= "+index+" && "+value[1]+" <= "+index+")" );

        }else
        {
            refvalue= "arguments[0][\"" + item.column + "\"]";
            if( item.operational==='like' || item.operational==='notlike' )
            {
                var flag = item.operational === 'notlike' ? '!' : '';
                if( item.type === 'right' )
                {
                    command.push(flag+"new RegExp('^'+"+value+" ).test("+refvalue+")");
                }else if( item.type === 'left' )
                {
                    command.push(flag+"new RegExp("+value+"+'$' ).test("+refvalue+")");
                }else
                {
                    command.push(flag+"new RegExp( "+value+" ).test("+refvalue+")");
                }

            }else if( item.operational=='range' || item.operational=='notrange')
            {
                var flag = item.operational === 'notrange' ? '!' : '';
                value = value.split(',');
                command.push( flag+"("+value[0]+" >= "+refvalue+" && "+value[1]+" <= "+refvalue+")" );

            }else
            {
                command.push( refvalue + item.operational + value);
            }
        }
    }
    if( command.length === 0 )
    {
        return null;
    }
    return new Function('return ( '+command.join(' ')+' )' );
};


/**
 * @returns {DataGrep}
 * @constructor
 */
function DataGrep( dataItems )
{
    if( !(System.instanceOf(this,DataGrep)) )return new DataGrep( dataItems );
    if( !System.instanceOf( dataItems, Array ) )throw new Error('error','Invalid data list');
    storage(this,true,{
        'dataItems':dataItems,
        'filter':dataItems
    });
    Object.defineProperty(this,"length", {value:0,writable:true});
}

module.exports = DataGrep;
var System =require("system/System.es");
var Object =require("system/Object.es");
var Internal =require("system/Internal.es");
var Array =require("system/Array.es");
var Function =require("system/Function.es");
var Symbol =require("system/Symbol.es");
var Error =require("system/Error.es");
var storage=Internal.createSymbolStorage( Symbol('DataGrep') );

DataGrep.prototype = Object.create( Object.prototype,{
    "constructor":{value:DataGrep},
    
/**
 * 获取设置过滤器
 * @param condition
 * @returns {*}
 */
"filter":{value:function filter( condition )
{
    if( typeof condition === "undefined" )
    {
        storage(this,"filter", createFilter.call(this) );

    }else if( typeof condition === 'function' )
    {
        storage(this,"filter",condition);

    }else if ( typeof condition === 'string' && condition!='' )
    {
        var old = condition;
        condition = condition.replace(/(\w+)\s*([\>\<\=\!])/g,function(a, b, c)
        {
            c = c.length==1 && c=='=' ? '==' : c;
            return "arguments[0]['"+b+"']" + c;

        }).replace(/(not[\s]*)?(index)\(([\d\,\s]+)\)/ig,function(a,b,c,d)
        {
            var value = d.split(',');
            var start =value[0]>>0;
            var end = Math.max(value[1]>>0,1);
            var flag = typeof b=== "undefined" ? '' : '!';
            return flag+"( arguments[1] >= "+start+" && arguments[1] < "+end+") ";

        }).replace(/(\w+)\s+(not[\s]*)?(like|range|in)\(([^\)]*?)\)/ig,function(a,b,c,d,e)
        {
            var flag = typeof c=== "undefined" ? '' : '!';
            var refvalue = "arguments[0]['"+b+"']";
            if( /like/i.test(d) )
            {
                e= e.replace(/(%)?([^%]*?)(%)?/,function(a,b,c,d){
                    return typeof b==='undefined' ? '^'+c : typeof d==='undefined' ? c+'$' : c;
                });
                e = flag+"new RegExp('"+e+"').test("+refvalue+")";

            }else if( /in/i.test(d) )
            {
                e = flag+"( ["+e+"].indexOf("+refvalue+") >=0 )";

            }else
            {
                var value = e.split(',');
                e = flag+"("+refvalue+" >= "+value[0]+" && "+refvalue+" < "+value[1]+")";
            }
            return e;

        }).replace(/\s+(or|and)\s+/gi,function(a,b)
        {
            return b.toLowerCase()=='or' ? ' || ' : ' && ';
        });
        storage(this,"filter",new Function('try{ return !!('+condition+') }catch(e){ throw new SyntaxError("is not grep:'+old+'");}') );

    }else if( condition === null )
    {
        storage(this,"filter",null);
    }
    return storage(this,"filter");
}},

/**
 * @returns {DataGrep}
 */
"clean":{value:function clean()
{
    for(var i=0; i<this.length; i++)
    {
        delete this[i];
    }
    storage(this,"filter",null);
    this.length=0;
    return this;
}},

/**
 * 查询数据
 * @param data
 * @param filter
 * @returns {*}
 */
"execute":{value:function execute(filter)
{
    var data=storage(this,"dataItems");
    filter = this.filter( filter );
    if( !filter )return data;
    var result=[];
    for(var i=0; i<data.length; i++ ) if( !!filter.call(this, data[i], i) )
    {
        result.push( data[i] );
    }
    return result;
}},

/**
 * 指定范围
 * @param column
 * @param start
 * @param end
 * @param logic
 * @returns {*}
 */
"range":{value:function range(column, start, end, logic)
{
    if(  start >= 0 || end > 0 )
    {
        strainer.call(this,column,start+','+end,'range',logic);
    }
    return this;
}},


/**
 * 指定数据索引范围
 * @param column
 * @param start
 * @param end
 * @param logic
 * @returns {DataGrep}
 */
"index":{value:function index(start, end, logic)
{
    if( start >= 0 || end > 0 )
    {
        end =  parseInt(end) || 1 ;
        start =  parseInt(start) || 0;
        strainer.call(this,'index',start+','+start+end,'index',logic);
    }
    return this;
}},

/**
 * 筛选等于指定列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"eq":{value:function eq(column, value, logic)
{
    strainer.call(this,column,value,'==',logic);
    return this;
}},

/**
 * 筛选不等于指定列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"not":{value:function not(column, value, logic)
{
    strainer.call(this,column,value,'!=',logic);
    return this;
}},

/**
 * 筛选大于列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"gt":{value:function gt(column, value, logic)
{
    strainer.call(this,column,value,'>',logic);
    return this;
}},

/**
 * 筛选小于列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"lt":{value:function lt(column, value, logic)
{
    strainer.call(this,column,value,'<',logic);
    return this;
}},

/**
 * 筛选大于等于列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"egt":{value:function egt(column, value, logic)
{
    strainer.call(this,column,value,'>=',logic);
    return this;
}},

/**
 * 筛选小于等于列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"elt":{value:function elt(column, value, logic)
{
    strainer.call(this,column,value,'<=',logic);
    return this;
}},

/**
 * 筛选模糊匹配列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"like":{value:function like(column, value, type, logic)
{
    strainer.call(this,column,value,'like',logic,type);
    return this;
}},

/**
 * 筛选排除模糊匹配列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"notLike":{value:function notLike(column, value, type, logic)
{
    strainer.call(this,column,value,'notlike',logic,type);
    return this;
}}

});

DataGrep.LIKE_LEFT='left';
DataGrep.LIKE_RIGHT='right';
DataGrep.LIKE_BOTH='both';
