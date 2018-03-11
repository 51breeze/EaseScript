define(["es.core.Container","es.core.Display","if:es.interfaces.IDisplay","if:es.interfaces.IContainer"],function(Container,Display,IDisplay,IContainer){
var _private=this._private;
var proto={"constructor":{"value":Container},"p8__children":{"writable":true,"value":new Array()}
,"Get__children":{"value":function children(){
	return this[_private]._children.slice(0);
}},"_getChildAt":{"value":function getChildAt(index){
	if( !System.is(index, Number))throw new TypeError("type does not match. must be Number");
	var children=this[_private]._children;
	index=Reflect.type(index<0?index+children.length:index,Number);
	var result=Reflect.type(children[index],IDisplay);
	if(result==null){
		throw new RangeError('The index out of range',"E:/EaseScript/es/core/Container.es","55:61");
	}
	return result;
}}
,"_getChildIndex":{"value":function getChildIndex(child){
	if( !System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay");
	var children=this[_private]._children;
	return children.indexOf(child);
}}
,"_addChild":{"value":function addChild(child){
	if( !System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay");
	return this._addChildAt(child,-1);
}}
,"_addChildAt":{"value":function addChildAt(child,index){
	if( !System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay");
	var parent=child.Get__parent();
	if(parent){
		(parent)._removeChild(child);
	}
	var children=this[_private]._children;
	var indexAt=index<0?index+children.length:index;
	this.Get__element().addChildAt(child.Get__element(),index);
	children.splice(indexAt,0,child);
	(Reflect.type(child,Display)).Set_Q7_displayParent(this);
	return child;
}}
,"_removeChild":{"value":function removeChild(child){
	if( !System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay");
	var index;
	var children;
	if(child){
		children=this[_private]._children;
		index=children.indexOf(child);
		(Reflect.type(child,Display)).Set_Q7_displayParent(null);
		this.Get__element().removeChild(child.Get__element());
		this[_private]._children.splice(index,1);
		return child;
	}
	throw new ReferenceError('The child is null or undefined',"E:/EaseScript/es/core/Container.es","118:69");
}}
,"_removeChildAt":{"value":function removeChildAt(index){
	if( !System.is(index, Number))throw new TypeError("type does not match. must be Number");
	return this._removeChild(this._getChildAt(index));
}}
,"_removeAllChild":{"value":function removeAllChild(){
	var children=this[_private]._children;
	var len=children.length;
	while(len>0){
		this._removeChild(Reflect.type(children[--len],IDisplay));
	}
	this[_private]._children=new Array();
}}
,"_contains":{"value":function contains(child){
	if( !System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay");
	return this.Get__element().contains(child.Get__element());
}}
};
Object.defineProperty(Container,"constructor",{"value":function constructor(element){
	Object.defineProperty(this,_private,{value:{"_children":new Array()}});
	if( !System.is(element, Element))throw new TypeError("type does not match. must be Element");
	if(!Element.isHTMLContainer(element[0])){
		throw new TypeError("Invalid container element","E:/EaseScript/es/core/Container.es","22:63");
	}
	Display.constructor.call(this,element);
}});
Container.constructor.prototype=Object.create( Display.prototype , proto);
Object.defineProperty(Container,"prototype",{value:Container.constructor.prototype});
Object.defineProperty(Container,"__T__",{value:{
	"extends":Display,
	"package":"es.core",
	"classname":"Container",
	"implements":[IContainer],
	"_private":_private,
	"uri":["p8_","Q7_","E19_","_"],
	"proto":proto
}});
return Container;
});