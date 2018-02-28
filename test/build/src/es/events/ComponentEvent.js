define(["es.events.ComponentEvent"],function(ComponentEvent){
var _private=this._private;
var method={"_INITIALIZING":{"value":'componentInitializing'}
,"_INITIALIZED":{"value":'componentInitialized'}
,"_INSTALLING":{"value":'componentInstalling'}
,"_UPDATE_DISPLAY_LIST":{"value":'componentUpdateDisplayList'}
};
for(var prop in method){
	Object.defineProperty(ComponentEvent, prop, method[prop]);
}
var proto={"constructor":{"value":ComponentEvent},"Get__hostComponent":{"value":function(){
	return this[_private].hostComponent;
}},"Set__hostComponent":{"value":function(val){
	return this[_private].hostComponent=val;
}}};
Object.defineProperty(ComponentEvent,"constructor",{"value":function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,_private,{value:{"hostComponent":null}});
	if(bubbles == null ){bubbles=true;}
	if(cancelable == null ){cancelable=true;}
	Event.call(this,type,bubbles,cancelable);
}});
ComponentEvent.constructor.prototype=Object.create( Event.prototype , proto);
Object.defineProperty(ComponentEvent,"prototype",{value:ComponentEvent.constructor.prototype});
Object.defineProperty(ComponentEvent,"__T__",{value:{
	"extends":Event,
	"package":"es.events",
	"classname":"ComponentEvent",
	"_private":_private,
	"uri":["q18_","f19_","M20_","_"],
	"method":method,
	"proto":proto
}});
return ComponentEvent;
});
