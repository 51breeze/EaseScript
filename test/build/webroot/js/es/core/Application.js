var Application=function Application(){
constructor.apply(this,arguments);
};
module.exports=Application;
var View=require("es/core/View.es");
var Interaction=require("es/core/Interaction.es");
var ApplicationEvent=require("es/events/ApplicationEvent.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Element=require("system/Element.es");
var System=require("system/System.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{"appContainer":null,"initiated":false,"_dataset":{},"_async":true}});

	EventDispatcher.call(this,document);
	this[__PRIVATE__].appContainer=Element.createElement("div");
	this[__PRIVATE__].appContainer.className="application";
};
var __PRIVATE__=Symbol("es.core.Application").valueOf();
var method={"E6_lastApp":{"writable":true,"value":null,"type":8}
};
for(var prop in method){
	Object.defineProperty(Application, prop, method[prop]);
}
var proto={"constructor":{"value":Application},"E6_appContainer":{"writable":true,"value":null,"type":8}
,"E6_initiated":{"writable":true,"value":false,"type":8}
,"getContainer":{"value":function getContainer(){
	var event;
	var container=this[__PRIVATE__].appContainer;
	if(this[__PRIVATE__].initiated===false){
		event=new ApplicationEvent(ApplicationEvent.FETCH_ROOT_CONTAINER);
		event.setContainer(container);
		if(this.dispatchEvent(event)){
			if(System.is(event.getContainer(), IDisplay)){
				container=Reflect.type(Reflect.get(Application,Reflect.type(event.getContainer(),IDisplay).getElement(),0),Node);
			}
			else {
				container=Reflect.type(event.getContainer(),Node);
			}
			if(!event.defaultPrevented){
				if(Application.E6_lastApp){
					document.body.removeChild(Application.E6_lastApp);
				}
				document.body.appendChild(container);
				Application.E6_lastApp=container;
			}
		}
		this[__PRIVATE__].initiated=true;
		this[__PRIVATE__].appContainer=container;
	}
	return container;
},"type":1}
,"assign":{"value":function assign(name,value){
	if(value === undefined ){value=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Application",134);
	if(value==null){
		return this[__PRIVATE__]._dataset[name];
	}
	return this[__PRIVATE__]._dataset[name]=value;
},"type":1}
,"E6__dataset":{"writable":true,"value":{},"type":8}
,"getDataset":{"value":function dataset(){
	return this[__PRIVATE__]._dataset;
},"type":2},"setDataset":{"value":function dataset(value){
	if(!System.is(value, Object))throw new TypeError("type does not match. must be Object","es.core.Application",159);
	this[__PRIVATE__]._dataset=value;
},"type":4},"getTitle":{"value":function title(){
	return Reflect.type(this[__PRIVATE__]._dataset.title,String);
},"type":2},"setTitle":{"value":function title(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.core.Application",168);
	this[__PRIVATE__]._dataset.title=value;
	document.title=value;
},"type":4},"E6__async":{"writable":true,"value":true,"type":8}
,"getAsync":{"value":function async(){
	return true;
},"type":2},"setAsync":{"value":function async(flag){
	if(!System.is(flag, Boolean))throw new TypeError("type does not match. must be Boolean","es.core.Application",194);
	this[__PRIVATE__]._async=flag;
},"type":4},"getComponentId":{"value":function getComponentId(prefix){
	if(prefix === undefined ){prefix="";}
	if(!System.is(prefix, String))throw new TypeError("type does not match. must be String","es.core.Application",217);
	return "";
},"type":1}
,"n2_render":{"value":function render(view){
	if(!System.is(view, View))throw new TypeError("type does not match. must be View","es.core.Application",225);
	view.display();
	return view;
},"type":1}
};
Application.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/Application.es",Application,{
	"extends":null,
	"package":"es.core",
	"classname":"Application",
	"uri":["E6","n2","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
