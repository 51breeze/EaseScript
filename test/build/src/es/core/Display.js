define(["es.core.Display","if:es.interfaces.IDisplay"],function(Display,IDisplay){
var _private=this._private;
var proto={"constructor":{"value":Display},"V9__element":{"writable":true,"value":null}
,"Get__element":{"value":function element(){
	return this[_private]._element;
}},"V9__width":{"writable":true,"value":NaN}
,"Get__width":{"value":function width(){
	return Reflect.type(System.isNaN(this[_private]._width)?this[_private]._element.width():this[_private]._width,Number);
}},"Set__width":{"value":function width(value){
	if( value && !System.is(value, Number))throw new TypeError("type does not match. must be Number");
	this[_private]._width=value;
	this[_private]._element.width(value);
}},"V9__height":{"writable":true,"value":NaN}
,"Get__height":{"value":function height(){
	return Reflect.type(System.isNaN(this[_private]._height)?this[_private]._element.height():this[_private]._height,Number);
}},"Set__height":{"value":function height(value){
	if( value && !System.is(value, Number))throw new TypeError("type does not match. must be Number");
	this[_private]._height=value;
	this[_private]._element.height(value);
}},"V9__visible":{"writable":true,"value":null}
,"Get__visible":{"value":function visible(){
	if(this[_private]._visible===null){
		return Reflect.type(!(this[_private]._element.style("display")==="none"||this[_private]._element.style("visibility")==="hidden"),Boolean);
	}
	return this[_private]._visible;
}},"Set__visible":{"value":function visible(flag){
	if( flag && !System.is(flag, Boolean))throw new TypeError("type does not match. must be Boolean");
	this[_private]._visible=flag;
	flag===false?this[_private]._element.hide():this[_private]._element.show();
}},"_property":{"value":function property(name,value){
	if(value == null ){value=null;}
	if(value==null){
		if(System.isObject(name)){
			this[_private]._element.property(name);
			return this;
		}
		return this[_private]._element.property(name);
	}
	this[_private]._element.property(name,value);
	return this;
}}
,"_style":{"value":function style(name,value){
	var obj=this[_private]._element.style(name,value);
	return this[_private]._element===obj?this:obj;
}}
,"Get__scrollTop":{"value":function scrollTop(){
	return this[_private]._element.scrollTop();
}},"Set__scrollTop":{"value":function scrollTop(value){
	if( value && !System.is(value, Number))throw new TypeError("type does not match. must be Number");
	this[_private]._element.scrollTop(value);
}},"Get__scrollLeft":{"value":function scrollLeft(){
	return this[_private]._element.scrollTop();
}},"Set__scrollLeft":{"value":function scrollLeft(value){
	if( value && !System.is(value, Number))throw new TypeError("type does not match. must be Number");
	this[_private]._element.scrollTop(value);
}},"Get__scrollWidth":{"value":function scrollWidth(){
	return this[_private]._element.scrollWidth();
}},"Get__scrollHeight":{"value":function scrollHeight(){
	return this[_private]._element.scrollHeight();
}},"_getBoundingRect":{"value":function getBoundingRect(global){
	return this[_private]._element.getBoundingRect(global);
}}
,"Get__left":{"value":function left(){
	return this[_private]._element.left();
}},"Set__left":{"value":function left(value){
	if( value && !System.is(value, Number))throw new TypeError("type does not match. must be Number");
	this[_private]._element.left(value);
}},"Get__top":{"value":function top(){
	return this[_private]._element.top();
}},"Set__top":{"value":function top(value){
	if( value && !System.is(value, Number))throw new TypeError("type does not match. must be Number");
	this[_private]._element.top(value);
}},"Get__right":{"value":function right(){
	return this[_private]._element.right();
}},"Set__right":{"value":function right(value){
	if( value && !System.is(value, Number))throw new TypeError("type does not match. must be Number");
	this[_private]._element.right(value);
}},"Get__bottom":{"value":function bottom(){
	return this[_private]._element.bottom();
}},"Set__bottom":{"value":function bottom(value){
	if( value && !System.is(value, Number))throw new TypeError("type does not match. must be Number");
	this[_private]._element.bottom(value);
}},"_localToGlobal":{"value":function localToGlobal(left,top){
	if( left && !System.is(left, Number))throw new TypeError("type does not match. must be Number");
	if( top && !System.is(top, Number))throw new TypeError("type does not match. must be Number");
	return this[_private]._element.localToGlobal(left,top);
}}
,"_globalToLocal":{"value":function globalToLocal(left,top){
	if( left && !System.is(left, Number))throw new TypeError("type does not match. must be Number");
	if( top && !System.is(top, Number))throw new TypeError("type does not match. must be Number");
	return this[_private]._element.globalToLocal(left,top);
}}
,"_contains":{"value":function contains(child){
	if( child && !System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay");
	return this[_private]._element.contains(child.Get__element());
}}
,"Get_E7_displayParent":{"value":function(){
	return this[_private].displayParent;
}},"Set_E7_displayParent":{"value":function(val){
	return this[_private].displayParent=val;
}},"Get__parent":{"value":function parent(){
	return this.Get_E7_displayParent();
}},"_toString":{"value":function toString(){
	return this[_private]._element.html(true);
}}
};
Object.defineProperty(Display,"constructor",{"value":function constructor(element){
	Object.defineProperty(this,_private,{value:{"_element":null,"_width":NaN,"_height":NaN,"_visible":null,"displayParent":null}});
	if( element && !System.is(element, Element))throw new TypeError("type does not match. must be Element");
	if(element==null||element.length!=1){
		throw new TypeError("The selector elements can only is a single element","E:/EaseScript/es/core/Display.es","28:88");
	}
	if(!Element.isNodeElement(element[0])){
		throw new TypeError("Invalid node element","E:/EaseScript/es/core/Display.es","32:57");
	}
	this[_private]._element=element;
	EventDispatcher.call(this,element);
}});
Display.constructor.prototype=Object.create( EventDispatcher.prototype , proto);
Object.defineProperty(Display,"prototype",{value:Display.constructor.prototype});
Object.defineProperty(Display,"__T__",{value:{
	"extends":EventDispatcher,
	"package":"es.core",
	"classname":"Display",
	"implements":[IDisplay],
	"_private":_private,
	"uri":["V9_","E7_","s21_","_"],
	"proto":proto
}});
return Display;
});
