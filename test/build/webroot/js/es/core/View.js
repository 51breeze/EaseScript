var View=function View(){
constructor.apply(this,arguments);
};
module.exports=View;
var Application=require("es/core/Application.es");
var Skin=require("es/core/Skin.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Element=require("system/Element.es");
var Event=require("system/Event.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(context){
	Object.defineProperty(this,__PRIVATE__,{value:{"_context":undefined}});

	if(!System.is(context, Application))throw new TypeError("type does not match. must be Application","es.core.View",33);
	Skin.call(this,context.getContainer());
	this[__PRIVATE__]._context=context;
};
var __PRIVATE__=Symbol("es.core.View").valueOf();
var method={"CHARSET_GB2312":{"value":'GB2312',"type":16}
,"CHARSET_GBK":{"value":'GBK',"type":16}
,"CHARSET_UTF8":{"value":'UTF-8',"type":16}
};
for(var prop in method){
	Object.defineProperty(View, prop, method[prop]);
}
var proto={"constructor":{"value":View},"a14__context":{"writable":true,"value":undefined,"type":8}
,"getContext":{"value":function context(){
	return this[__PRIVATE__]._context;
},"type":2},"getTitle":{"value":function title(){
	return this[__PRIVATE__]._context.getTitle();
},"type":2},"setTitle":{"value":function title(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.core.View",58);
	this[__PRIVATE__]._context.setTitle(value);
},"type":4},"display":{"value":function display(){
	var init=this.L15_getInitialized();
	var elem=Skin.prototype.display.call(this);
	if(!init&&this.hasEventListener("INTERNAL_BEFORE_CHILDREN")){
		this.dispatchEvent(new Event("INTERNAL_BEFORE_CHILDREN"));
	}
	return elem;
},"type":1}
};
View.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/core/View.es",View,{
	"extends":Skin,
	"package":"es.core",
	"classname":"View",
	"uri":["a14","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
