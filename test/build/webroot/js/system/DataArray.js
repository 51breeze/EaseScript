/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Array,ReferenceError
 */
function DataArray()
{
    if( !System.instanceOf(this,DataArray) )
    {
        return Array.apply( Object.create( DataArray.prototype ), Array.prototype.slice.call(arguments,0) );
    }
    if( arguments.length === 1 && System.instanceOf(arguments[0],Array) )
    {
        Array.apply(this, arguments[0]);
    }else{
        Array.apply(this, Array.prototype.slice.call(arguments,0) );
    }
    return this;
}

module.exports = DataArray;
var System =require("system/System.es");
var Object =require("system/Object.es");
var Array =require("system/Array.es");
var ReferenceError =require("system/ReferenceError.es");

DataArray.DESC='desc';
DataArray.ASC='asc';
DataArray.prototype= Object.create( Array.prototype,{
    "constructor":{value:DataArray},
    /**
     * 返回此对象的字符串
     * @returns {*}
     */
    "toString":{value:function toString()
    {
        if( this.constructor === DataArray )
        {
            return "[object DataArray]";
        }
        return Array.prototype.toString.call(this);
    }},

    /**
     * 根据指定的列进行排序
     * @param column
     * @param type
     * @returns {DataArray}
     */
    "orderBy":{value:function orderBy(column,type)
    {
        if( this.length < 2 )return this;
        if( (column === DataArray.DESC || column === DataArray.ASC || column==null) && type==null )
        {
            if( typeof this[0] === "object" )
            {
                throw new ReferenceError('Missing column name.');
            }
            this.sort(function (a,b) {
                return column === DataArray.DESC ? System.compare(b,a) : System.compare(a,b);
            });
            return this;
        }

        var field=column,orderby=['var a=arguments[0],b=arguments[1],s=0,cp=arguments[2];'];
        if( typeof column !== "object" )
        {
            field={};
            field[ column ] = type;
        }
        for(var c in field )
        {
            type = DataArray.DESC === field[c].toLowerCase() ?  DataArray.DESC :  DataArray.ASC;
            orderby.push( type===DataArray.DESC ? "cp(b['"+c+"'],a['"+c+"']):s;" : "cp(a['"+c+"'],b['"+c+"']):s;");
        }
        orderby = orderby.join("s=s==0?");
        orderby+="return s;";
        var fn = new Function( orderby );
        this.sort(function (a,b) {
            return fn(a,b,System.compare);
        });
        return this;
    }},

    /**
     * 统计数组中所有值的和
     * @param function callback 回调函数，返回每个项的值。
     * @returns {number}
     * @public
     */
    "sum":{value:function sum( callback )
    {
        var result = 0;
        var type = typeof callback;
        var index=0,len=this.length >> 0;
        if( len===0 )return 0;
        if( type !== "function" ){
            if( type === "string" ){
                var field = callback;
                if( typeof this[0][ field ] === "undefined" )
                {
                    throw new ReferenceError('assign field does not define. for "'+type+'"');
                }
                callback = function( value ){return value[field]>>0;}
            }else
            {
                if( typeof this[0] === "object" )
                {
                    throw new ReferenceError('Missing field name.');
                }
                callback = function( value ){return System.isNaN(value) ? 0 : value>>0;}
            }
        }
        for(;index<len;index++)
        {
            result+=callback.call(this,this[index])>>0;
        }
        return result;
    }}
});


