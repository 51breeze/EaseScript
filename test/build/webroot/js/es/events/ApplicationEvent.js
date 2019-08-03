var ApplicationEvent=function ApplicationEvent(){
constructor.apply(this,arguments);
};
module.exports=ApplicationEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"container":undefined}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.ApplicationEvent",15);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.ApplicationEvent",15);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.ApplicationEvent",15);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.ApplicationEvent").valueOf();
var method={"FETCH_ROOT_CONTAINER":{"value":'applicationFetchRootContainer',"type":16}
};
for(var prop in method){
	Object.defineProperty(ApplicationEvent, prop, method[prop]);
}
var proto={"constructor":{"value":ApplicationEvent},"getContainer":{"value":function(){
	return this[__PRIVATE__].container;
},"type":2},"setContainer":{"value":function(val){
	return this[__PRIVATE__].container=val;
},"type":2}};
ApplicationEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/ApplicationEvent.es",ApplicationEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"ApplicationEvent",
	"uri":["o8","K9","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
