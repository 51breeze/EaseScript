var Interaction=function Interaction(){
throw new TypeError("\"es.core.Interaction\" is not constructor.");
};
module.exports=Interaction;
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var Object=require("system/Object.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var __PRIVATE__=Symbol("es.core.Interaction").valueOf();
var method={"key":{"writable":true,"value":"FJH9-H3EW-8WI0-YT2D","type":8}
,"D35_properties":{"writable":true,"value":{},"type":8}
,"getProperties":{"value":function getProperties(){
	return Interaction.D35_properties;
},"type":1}
,"D35_initialized":{"writable":true,"value":false,"type":8}
,"pull":{"value":function pull(key){
	if(!System.is(key, String))throw new TypeError("type does not match. must be String","es.core.Interaction",46);
	if(Interaction.D35_initialized===false){
		Interaction.D35_initialized=true;
		if(System.isObject(Reflect.get(Interaction,window,Interaction.key))){
			Interaction.D35_properties=Reflect.type(Reflect.get(Interaction,window,Interaction.key),Object);
		}
	}
	return System.isDefined(Interaction.D35_properties[key])?Interaction.D35_properties[key]:null;
},"type":1}
,"push":{"value":function push(key,data){
	if(!System.is(key, String))throw new TypeError("type does not match. must be String","es.core.Interaction",66);
	if(!System.is(data, Object))throw new TypeError("type does not match. must be Object","es.core.Interaction",66);
	if(System.isDefined(Interaction.D35_properties[key])){
		Interaction.D35_properties[key]=Object.merge(Interaction.D35_properties[key],data);
	}
	else {
		Interaction.D35_properties[key]=data;
	}
},"type":1}
};
for(var prop in method){
	Object.defineProperty(Interaction, prop, method[prop]);
}
var proto={};
Object.defineProperty(Interaction,"prototype",{value:{}});
Internal.defineClass("es/core/Interaction.es",Interaction,{
	"package":"es.core",
	"classname":"Interaction",
	"uri":["D35","K36","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
