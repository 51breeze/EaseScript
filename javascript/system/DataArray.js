/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Array
 */
function DataArray()
{
    if( !System.instanceOf(this,DataArray) ){
        return Array.apply( Object.create( DataArray.prototype ), Array.prototype.slice.call(arguments,0) );
    }
    Array.apply(this, Array.prototype.slice.call(arguments,0) );
    return this;
}
System.DataArray=DataArray;

DataArray.DESC='desc';
DataArray.ASC='asc';
DataArray.prototype= Object.create( Array.prototype );
Object.defineProperty(DataArray.prototype,"constructor", {value:DataArray});

/**
 * 根据指定的列进行排序
 * @param column
 * @param type
 * @returns {DataArray}
 */
DataArray.prototype.orderBy=function(column,type)
{
    if( column === DataArray.DESC || column === DataArray.ASC || column==null )
    {
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
};

/**
 * 统计数组中所有值的和
 * @param function callback 回调函数，返回每个项的值。
 * @returns {number}
 * @public
 */
DataArray.prototype.sum=function( callback )
{
    var result = 0;
    if( typeof callback !== "function" )callback = function( value ){return System.isNaN(value) ? 0 : value>>0;}
    var index=0,
    len=this.length >> 0;
    for(;index<len;index++)
    {
        result+=callback.call(this,this[index])>>0;
    }
    return result;
};

