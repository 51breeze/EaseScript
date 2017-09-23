/**
 * DataSourceEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 * @require Event,Object
 */
function DataSourceEvent(type, bubbles,cancelable)
{
    if( !System.instanceOf(this,DataSourceEvent) )return new DataSourceEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}
System.DataSourceEvent=DataSourceEvent;
DataSourceEvent.prototype= Object.create(Event.prototype);
DataSourceEvent.prototype.constructor=DataSourceEvent;
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



