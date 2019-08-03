var SkinEvent=function SkinEvent(){
constructor.apply(this,arguments);
};
module.exports=SkinEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"children":null}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.SkinEvent",13);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.SkinEvent",13);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.SkinEvent",13);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.SkinEvent").valueOf();
var method={"UPDATE_DISPLAY_LIST":{"value":'skinUpdateDisplayList',"type":16}
};
for(var prop in method){
	Object.defineProperty(SkinEvent, prop, method[prop]);
}
var proto={"constructor":{"value":SkinEvent},"getChildren":{"value":function(){
	return this[__PRIVATE__].children;
},"type":2},"setChildren":{"value":function(val){
	return this[__PRIVATE__].children=val;
},"type":2}};
SkinEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/SkinEvent.es",SkinEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"SkinEvent",
	"uri":["J27","V28","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
