var Component=function Component(){
constructor.apply(this,arguments);
};
module.exports=Component;
var ComponentEvent=require("es/events/ComponentEvent.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{"initialized":false}});

	EventDispatcher.call(this);
};
var __PRIVATE__=Symbol("es.components.Component").valueOf();
var method={};
var proto={"constructor":{"value":Component},"k30_getInitialized":{"value":function(){
	return this[__PRIVATE__].initialized;
},"type":2},"k30_setInitialized":{"value":function(val){
	return this[__PRIVATE__].initialized=val;
},"type":2},"k30_initializing":{"value":function initializing(){
	if(this.k30_getInitialized()===false){
		this.k30_setInitialized(true);
		if(this.hasEventListener(ComponentEvent.INITIALIZING)){
			this.dispatchEvent(new ComponentEvent(ComponentEvent.INITIALIZING));
		}
	}
},"type":1}
};
Component.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/components/Component.es",Component,{
	"extends":null,
	"package":"es.components",
	"classname":"Component",
	"uri":["s32","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
