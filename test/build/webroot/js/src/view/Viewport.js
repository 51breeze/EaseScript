var Viewport=function Viewport(){
constructor.apply(this,arguments);
};
module.exports=Viewport;
var View=require("es/core/View.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var IndexApplication=require("IndexApplication.es");
var Navigate=require("es/components/Navigate.es");
var Container=require("es/core/Container.es");
var NavigateSkin=require("es/skins/NavigateSkin.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var Array=require("system/Array.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"navigate":null,"content":null,"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, IndexApplication))throw new TypeError("type does not match. must be IndexApplication","view.Viewport",18);
	this[__PRIVATE__]._hostComponent=hostComponent;
	View.call(this,hostComponent);
	var attrs={"__var65__":{"class":"content"},"__var66__":{"uu":"sss"}};
	this[__PRIVATE__].properties=attrs;
	var navigate=Reflect.type((this.L15_createComponent(0,6,Navigate)),Navigate);
	this.setNavigate(navigate);
	var content=Reflect.type((this.L15_createComponent(0,7,Container,"div",null,attrs.__var65__)),Container);
	this.setContent(content);
	this.attributes(this.getElement(),attrs.__var66__);
};
var __PRIVATE__=Symbol("view.Viewport").valueOf();
var method={};
var proto={"constructor":{"value":Viewport},"C42_properties":{"writable":true,"value":{},"type":8}
,"getNavigate":{"value":function(){
	return this[__PRIVATE__].navigate;
},"type":2},"setNavigate":{"value":function(val){
	return this[__PRIVATE__].navigate=val;
},"type":2},"getContent":{"value":function(){
	return this[__PRIVATE__].content;
},"type":2},"setContent":{"value":function(val){
	return this[__PRIVATE__].content=val;
},"type":2},"C42__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var attrs=this[__PRIVATE__].properties;
	var navigate=this.getNavigate();
	var content=this.getContent();
	navigate.setSource(this.L15_getHostComponent().getMenus());
	navigate.setWidth(120);
	navigate.setViewport(content);
	navigate.setCurrent("0");
	navigate.setSkinClass(NavigateSkin);
	return [navigate,content];
},"type":1}
};
Viewport.prototype=Object.create( View.prototype , proto);
Internal.defineClass("view/Viewport.es",Viewport,{
	"extends":View,
	"package":"view",
	"classname":"Viewport",
	"uri":["C42","L15","t43"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
