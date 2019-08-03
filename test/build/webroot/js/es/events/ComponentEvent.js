var ComponentEvent=function ComponentEvent(){
constructor.apply(this,arguments);
};
module.exports=ComponentEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"hostComponent":null}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.ComponentEvent",15);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.ComponentEvent",15);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.ComponentEvent",15);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.ComponentEvent").valueOf();
var method={"INITIALIZING":{"value":'componentInitializing',"type":16}
,"INITIALIZED":{"value":'componentInitialized',"type":16}
};
for(var prop in method){
	Object.defineProperty(ComponentEvent, prop, method[prop]);
}
var proto={"constructor":{"value":ComponentEvent},"getHostComponent":{"value":function(){
	return this[__PRIVATE__].hostComponent;
},"type":2},"setHostComponent":{"value":function(val){
	return this[__PRIVATE__].hostComponent=val;
},"type":2}};
ComponentEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/ComponentEvent.es",ComponentEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"ComponentEvent",
	"uri":["V33","I34","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
