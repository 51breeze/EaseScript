var State=function State(){
constructor.apply(this,arguments);
};
module.exports=State;
var EventDispatcher=require("system/EventDispatcher.es");
var Array=require("system/Array.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(name){
	Object.defineProperty(this,__PRIVATE__,{value:{"_name":'',"_stateGroup":[]}});

	EventDispatcher.call(this);
	if(name === undefined ){name='';}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.State",14);
	this[__PRIVATE__]._name=name;
};
var __PRIVATE__=Symbol("es.core.State").valueOf();
var method={};
var proto={"constructor":{"value":State},"R25__name":{"writable":true,"value":'',"type":8}
,"R25__stateGroup":{"writable":true,"value":[],"type":8}
,"getName":{"value":function name(){
	return this[__PRIVATE__]._name;
},"type":2},"setName":{"value":function name(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.core.State",18);
	this[__PRIVATE__]._name=value;
},"type":4},"getStateGroup":{"value":function stateGroup(){
	return this[__PRIVATE__]._stateGroup;
},"type":2},"setStateGroup":{"value":function stateGroup(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.core.State",26);
	this[__PRIVATE__]._stateGroup=value;
},"type":4},"includeIn":{"value":function includeIn(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.core.State",34);
	return value===this[__PRIVATE__]._name||this[__PRIVATE__]._stateGroup.indexOf(value)>=0;
},"type":1}
};
State.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/State.es",State,{
	"extends":null,
	"package":"es.core",
	"classname":"State",
	"uri":["R25","f26","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
