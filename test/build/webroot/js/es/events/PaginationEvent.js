var PaginationEvent=function PaginationEvent(){
constructor.apply(this,arguments);
};
module.exports=PaginationEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"newValue":null,"oldValue":null,"url":null}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.PaginationEvent",16);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.PaginationEvent",16);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.PaginationEvent",16);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.PaginationEvent").valueOf();
var method={"CHANGE":{"value":'paginationChange',"type":16}
,"REFRESH":{"value":'paginationRefreshList',"type":16}
};
for(var prop in method){
	Object.defineProperty(PaginationEvent, prop, method[prop]);
}
var proto={"constructor":{"value":PaginationEvent},"getNewValue":{"value":function(){
	return this[__PRIVATE__].newValue;
},"type":2},"setNewValue":{"value":function(val){
	return this[__PRIVATE__].newValue=val;
},"type":2},"getOldValue":{"value":function(){
	return this[__PRIVATE__].oldValue;
},"type":2},"setOldValue":{"value":function(val){
	return this[__PRIVATE__].oldValue=val;
},"type":2},"getUrl":{"value":function(){
	return this[__PRIVATE__].url;
},"type":2},"setUrl":{"value":function(val){
	return this[__PRIVATE__].url=val;
},"type":2}};
PaginationEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/PaginationEvent.es",PaginationEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"PaginationEvent",
	"uri":["F61","J62","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
