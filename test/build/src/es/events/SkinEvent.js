define(["es.events.SkinEvent"],function(SkinEvent){
var _private=this._private;
var method={"_CREATE_CHILDREN_COMPLETED":{"value":'createChildrenCompleted'}
};
for(var prop in method){
	Object.defineProperty(SkinEvent, prop, method[prop]);
}
var proto={"constructor":{"value":SkinEvent},"Get__parent":{"value":function(){
	return this[_private].parent;
}},"Set__parent":{"value":function(val){
	return this[_private].parent=val;
}},"Get__child":{"value":function(){
	return this[_private].child;
}},"Set__child":{"value":function(val){
	return this[_private].child=val;
}}};
Object.defineProperty(SkinEvent,"constructor",{"value":function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,_private,{value:{"parent":null,"child":null}});
	if(bubbles == null ){bubbles=true;}
	if(cancelable == null ){cancelable=true;}
	Event.call(this,type,bubbles,cancelable);
}});
SkinEvent.constructor.prototype=Object.create( Event.prototype , proto);
Object.defineProperty(SkinEvent,"prototype",{value:SkinEvent.constructor.prototype});
Object.defineProperty(SkinEvent,"__T__",{value:{
	"extends":Event,
	"package":"es.events",
	"classname":"SkinEvent",
	"_private":_private,
	"uri":["G27_","j28_","l20_","_"],
	"method":method,
	"proto":proto
}});
return SkinEvent;
});
