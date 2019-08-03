var NavigateEvent=function NavigateEvent(){
constructor.apply(this,arguments);
};
module.exports=NavigateEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"item":null,"viewport":null,"content":null}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.NavigateEvent",18);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.NavigateEvent",18);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.NavigateEvent",18);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.NavigateEvent").valueOf();
var method={"LOAD_CONTENT_BEFORE":{"value":'navigateLoadContentBefore',"type":16}
,"URL_JUMP_BEFORE":{"value":'navigateUrlJumpBefore',"type":16}
};
for(var prop in method){
	Object.defineProperty(NavigateEvent, prop, method[prop]);
}
var proto={"constructor":{"value":NavigateEvent},"getItem":{"value":function(){
	return this[__PRIVATE__].item;
},"type":2},"setItem":{"value":function(val){
	return this[__PRIVATE__].item=val;
},"type":2},"getViewport":{"value":function(){
	return this[__PRIVATE__].viewport;
},"type":2},"setViewport":{"value":function(val){
	return this[__PRIVATE__].viewport=val;
},"type":2},"getContent":{"value":function(){
	return this[__PRIVATE__].content;
},"type":2},"setContent":{"value":function(val){
	return this[__PRIVATE__].content=val;
},"type":2}};
NavigateEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/NavigateEvent.es",NavigateEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"NavigateEvent",
	"uri":["I45","M46","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
