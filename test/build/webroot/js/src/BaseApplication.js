var BaseApplication=function BaseApplication(){
constructor.apply(this,arguments);
};
module.exports=BaseApplication;
var Application=require("es/core/Application.es");
var System=require("system/System.es");
var Array=require("system/Array.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{}});

	Application.call(this);
	var aa=1;
	System.is(aa, Number);
};
var __PRIVATE__=Symbol("BaseApplication").valueOf();
var method={};
var proto={"constructor":{"value":BaseApplication},"getMenus":{"value":function menus(){
	return [{"link":"?PATH=/MyIndex/home","label":"首页","content":"/MyIndex/home"},{"link":"?PATH=/Person","label":"个人","content":"/Person"}];
},"type":2}};
BaseApplication.prototype=Object.create( Application.prototype , proto);
Internal.defineClass("BaseApplication.es",BaseApplication,{
	"extends":Application,
	"classname":"BaseApplication",
	"uri":["H5","n2","O4"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
