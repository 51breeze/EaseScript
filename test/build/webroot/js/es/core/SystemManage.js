var SystemManage=function SystemManage(){
constructor.apply(this,arguments);
};
module.exports=SystemManage;
var EventDispatcher=require("system/EventDispatcher.es");
var Element=require("system/Element.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function(){
Object.defineProperty(this,__PRIVATE__,{value:{}});
EventDispatcher.apply(this,arguments);
};
var __PRIVATE__=Symbol("es.core.SystemManage").valueOf();
var method={"X56__window":{"writable":true,"value":undefined,"type":8}
,"getWindow":{"value":function getWindow(){
	if(!SystemManage.X56__window)SystemManage.X56__window=new Element(window);
	return SystemManage.X56__window;
},"type":1}
,"X56__document":{"writable":true,"value":undefined,"type":8}
,"getDocument":{"value":function getDocument(){
	if(!SystemManage.X56__document)SystemManage.X56__document=new Element(document);
	return SystemManage.X56__document;
},"type":1}
,"X56__body":{"writable":true,"value":undefined,"type":8}
,"getBody":{"value":function getBody(){
	if(!SystemManage.X56__body)SystemManage.X56__body=new Element(document.body);
	return SystemManage.X56__body;
},"type":1}
,"X56__disableScroll":{"writable":true,"value":false,"type":8}
,"disableScroll":{"value":function disableScroll(){
	var body;
	if(!SystemManage.X56__disableScroll){
		SystemManage.X56__disableScroll=true;
		body=SystemManage.getBody();
		body.style("overflowX","hidden");
		body.style("overflowY","hidden");
	}
},"type":1}
,"enableScroll":{"value":function enableScroll(){
	var body;
	if(SystemManage.X56__disableScroll===true){
		SystemManage.X56__disableScroll=false;
		body=SystemManage.getBody();
		body.style("overflowX","auto");
		body.style("overflowY","auto");
	}
},"type":1}
};
for(var prop in method){
	Object.defineProperty(SystemManage, prop, method[prop]);
}
var proto={"constructor":{"value":SystemManage}};
SystemManage.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/SystemManage.es",SystemManage,{
	"extends":null,
	"package":"es.core",
	"classname":"SystemManage",
	"uri":["X56","W57","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
