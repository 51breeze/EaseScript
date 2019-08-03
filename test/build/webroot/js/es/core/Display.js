var Display=function Display(){
constructor.apply(this,arguments);
};
module.exports=Display;
var Element=require("system/Element.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var es_internal=require("es/core/es_internal.es");
var IContainer=require("es/interfaces/IContainer.es");
var EventDispatcher=require("system/EventDispatcher.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Object=require("system/Object.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(element,attr){
	Object.defineProperty(this,__PRIVATE__,{value:{"_element":undefined,"_width":NaN,"_height":NaN,"_visible":false,"_visibleFlag":false,"parentDisplay":null,"_owner":null}});

	if(attr === undefined ){attr=null;}
	if(!System.is(element, Element))throw new TypeError("type does not match. must be Element","es.core.Display",26);
	if(attr!==null && !System.is(attr, Object))throw new TypeError("type does not match. must be Object","es.core.Display",26);
	if(element==null||element.length!=1){
		throw new TypeError("The selector elements can only is a single element","es.core.Display","30:89");
	}
	if(!Element.isNodeElement(element[0])){
		throw new TypeError("Invalid node element","es.core.Display","34:58");
	}
	this[__PRIVATE__]._element=element;
	if(attr){
		if(attr.innerHTML){
			element.html(attr.innerHTML);
			delete attr.innerHTML;
		}
		else if(attr.content){
			element.text(attr.content);
			delete attr.content;
		}
		element.properties(attr);
	}
	EventDispatcher.call(this,element);
};
var __PRIVATE__=Symbol("es.core.Display").valueOf();
var method={};
var proto={"constructor":{"value":Display},"U18__element":{"writable":true,"value":undefined,"type":8}
,"getElement":{"value":function element(){
	return this[__PRIVATE__]._element;
},"type":2},"U18__width":{"writable":true,"value":NaN,"type":8}
,"getWidth":{"value":function width(){
	return System.isNaN(this[__PRIVATE__]._width)?this[__PRIVATE__]._element.width():this[__PRIVATE__]._width;
},"type":2},"setWidth":{"value":function width(value){
	if(!(value>=0) && !System.isNaN(value))throw new TypeError("type does not match. must be uint","es.core.Display",80);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._width=value;
		this[__PRIVATE__]._element.width(value);
	}
},"type":4},"U18__height":{"writable":true,"value":NaN,"type":8}
,"getHeight":{"value":function height(){
	return System.isNaN(this[__PRIVATE__]._height)?this[__PRIVATE__]._element.height():this[__PRIVATE__]._height;
},"type":2},"setHeight":{"value":function height(value){
	if(!(value>=0) && !System.isNaN(value))throw new TypeError("type does not match. must be uint","es.core.Display",107);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._height=value;
		this[__PRIVATE__]._element.height(value);
	}
},"type":4},"U18__visible":{"writable":true,"value":false,"type":8}
,"U18__visibleFlag":{"writable":true,"value":false,"type":8}
,"getVisible":{"value":function visible(){
	if(this[__PRIVATE__]._visibleFlag===false){
		return !(this[__PRIVATE__]._element.style("display")==="none");
	}
	return this[__PRIVATE__]._visible;
},"type":2},"setVisible":{"value":function visible(flag){
	if(!System.is(flag, Boolean))throw new TypeError("type does not match. must be Boolean","es.core.Display",126);
	this[__PRIVATE__]._visible=flag;
	this[__PRIVATE__]._visibleFlag=true;
	flag===false?this[__PRIVATE__]._element.hide():this[__PRIVATE__]._element.show();
},"type":4},"property":{"value":function property(name,value){
	if(value === undefined ){value=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Display",152);
	return this[__PRIVATE__]._element.property(name,value);
},"type":1}
,"style":{"value":function style(name,value){
	if(value === undefined ){value=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Display",163);
	return this[__PRIVATE__]._element.style(name,value);
},"type":1}
,"getScrollTop":{"value":function scrollTop(){
	return this[__PRIVATE__]._element.scrollTop();
},"type":2},"setScrollTop":{"value":function scrollTop(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",181);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.scrollTop(value);
	}
},"type":4},"getScrollLeft":{"value":function scrollLeft(){
	return this[__PRIVATE__]._element.scrollTop();
},"type":2},"setScrollLeft":{"value":function scrollLeft(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",202);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.scrollTop(value);
	}
},"type":4},"getScrollWidth":{"value":function scrollWidth(){
	return this[__PRIVATE__]._element.scrollWidth();
},"type":2},"getScrollHeight":{"value":function scrollHeight(){
	return this[__PRIVATE__]._element.scrollHeight();
},"type":2},"getBoundingRect":{"value":function getBoundingRect(global){
	if(global === undefined ){global=false;}
	if(!System.is(global, Boolean))throw new TypeError("type does not match. must be Boolean","es.core.Display",234);
	return this[__PRIVATE__]._element.getBoundingRect(global);
},"type":1}
,"getLeft":{"value":function left(){
	return this[__PRIVATE__]._element.left();
},"type":2},"setLeft":{"value":function left(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",252);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.left(value);
	}
},"type":4},"getTop":{"value":function top(){
	return this[__PRIVATE__]._element.top();
},"type":2},"setTop":{"value":function top(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",272);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.top(value);
	}
},"type":4},"getRight":{"value":function right(){
	return this[__PRIVATE__]._element.right();
},"type":2},"setRight":{"value":function right(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",292);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.right(value);
	}
},"type":4},"getBottom":{"value":function bottom(){
	return this[__PRIVATE__]._element.bottom();
},"type":2},"setBottom":{"value":function bottom(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",312);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.bottom(value);
	}
},"type":4},"localToGlobal":{"value":function localToGlobal(left,top){
	if(!System.is(left, Number))throw new TypeError("type does not match. must be int","es.core.Display",326);
	if(!System.is(top, Number))throw new TypeError("type does not match. must be int","es.core.Display",326);
	return this[__PRIVATE__]._element.localToGlobal(left,top);
},"type":1}
,"globalToLocal":{"value":function globalToLocal(left,top){
	if(!System.is(left, Number))throw new TypeError("type does not match. must be int","es.core.Display",337);
	if(!System.is(top, Number))throw new TypeError("type does not match. must be int","es.core.Display",337);
	return this[__PRIVATE__]._element.globalToLocal(left,top);
},"type":1}
,"U18_parentDisplay":{"writable":true,"value":null,"type":8}
,"s3_setParentDisplay":{"value":function setParentDisplay(value){
	if(value === undefined ){value=null;}
	if(value!==null && !System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.Display",350);
	this[__PRIVATE__].parentDisplay=value;
},"type":1}
,"getParent":{"value":function parent(){
	return this[__PRIVATE__].parentDisplay;
},"type":2},"inDocumentChain":{"value":function inDocumentChain(){
	return Element.contains(document,this[__PRIVATE__]._element[0]);
},"type":1}
,"display":{"value":function display(){
	return this[__PRIVATE__]._element;
},"type":1}
,"U18__owner":{"writable":true,"value":null,"type":8}
,"getOwner":{"value":function owner(){
	return this[__PRIVATE__]._owner;
},"type":2},"setOwner":{"value":function owner(value){
	if(!System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.Display",401);
	this[__PRIVATE__]._owner=value;
},"type":4}};
Display.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/Display.es",Display,{
	"extends":null,
	"package":"es.core",
	"classname":"Display",
	"implements":[IDisplay],
	"uri":["U18","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
