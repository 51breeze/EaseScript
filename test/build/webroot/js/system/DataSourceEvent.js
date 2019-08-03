/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event,Object
 */

function DataSourceEvent(type, bubbles,cancelable)
{
    if( !System.instanceOf(this,DataSourceEvent) )return new DataSourceEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}

module.exports = DataSourceEvent;
var System =require("system/System.es");
var Object =require("system/Object.es");
var Event =require("system/Event.es");


DataSourceEvent.prototype= Object.create(Event.prototype,{
    "constructor":{value:DataSourceEvent}
});
DataSourceEvent.prototype.condition=null;
DataSourceEvent.prototype.index=NaN;
DataSourceEvent.prototype.data=null;
DataSourceEvent.prototype.oldValue=null;
DataSourceEvent.prototype.newValue=null;
DataSourceEvent.prototype.current = NaN;
DataSourceEvent.prototype.offset = NaN;
DataSourceEvent.prototype.waiting=false;
DataSourceEvent.prototype.totalSize=NaN;
DataSourceEvent.prototype.pageSize=NaN;
DataSourceEvent.prototype.totalSize=NaN;

DataSourceEvent.APPEND='dataSourceAppend';
DataSourceEvent.REMOVE='dataSourceRemove';
DataSourceEvent.UPDATE='dataSourceUpdate';
DataSourceEvent.SELECT ='dataSourceSelect';
DataSourceEvent.CHANGED='dataSourceChanged';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof DataSourceEvent )return originalEvent;
    switch ( type ){
        case DataSourceEvent.APPEND :
        case DataSourceEvent.REMOVE :
        case DataSourceEvent.UPDATE :
        case DataSourceEvent.SELECT :
        case DataSourceEvent.CHANGED :
            return new DataSourceEvent( type );
    }
});