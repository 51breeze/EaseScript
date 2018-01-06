define(["es.core.State"],function(State){
var _private=this._private;
var proto={"constructor":{"value":State},"q10__name":{"writable":true,"value":''}
,"q10__stateGroup":{"writable":true,"value":new Array()}
,"Get__name":{"value":function name(){
	return this[_private]._name;
}},"Set__name":{"value":function name(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String");
	this[_private]._name=value;
}},"Get__stateGroup":{"value":function stateGroup(){
	return this[_private]._stateGroup;
}},"Set__stateGroup":{"value":function stateGroup(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array");
	this[_private]._stateGroup=value;
}},"_includeIn":{"value":function includeIn(value){
	return value===this[_private]._name||this[_private]._stateGroup.indexOf(value)>=0;
}}
};
Object.defineProperty(State,"constructor",{"value":function constructor(name){
	Object.defineProperty(this,_private,{value:{"_name":'',"_stateGroup":new Array()}});
	this[_private]._name=Reflect.type(name,String);
}});
State.constructor.prototype=Object.create( Object.prototype , proto);
Object.defineProperty(State,"prototype",{value:State.constructor.prototype});
Object.defineProperty(State,"__T__",{value:{
	"ns":"_",
	"extends":null,
	"package":"es.core",
	"classname":"State",
	"implements":[],
	"_private":_private,
	"uri":["q10_","F29_","G21_","_"],
	"proto":proto
}});
return State;
});
