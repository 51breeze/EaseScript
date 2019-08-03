var Container=function Container(){
constructor.apply(this,arguments);
};
module.exports=Container;
var Display=require("es/core/Display.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var IContainer=require("es/interfaces/IContainer.es");
var es_internal=require("es/core/es_internal.es");
var BaseLayout=require("es/core/BaseLayout.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Element=require("system/Element.es");
var Object=require("system/Object.es");
var Array=require("system/Array.es");
var Reflect=require("system/Reflect.es");
var RangeError=require("system/RangeError.es");
var ReferenceError=require("system/ReferenceError.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(element,attr){
	Object.defineProperty(this,__PRIVATE__,{value:{"_children":[],"_layout":null}});

	if(attr === undefined ){attr=null;}
	if(!System.is(element, Element))throw new TypeError("type does not match. must be Element","es.core.Container",22);
	if(attr!==null && !System.is(attr, Object))throw new TypeError("type does not match. must be Object","es.core.Container",22);
	if(!Element.isHTMLContainer(element[0])){
		throw new TypeError("Invalid container element","es.core.Container","26:64");
	}
	Display.call(this,element,attr);
};
var __PRIVATE__=Symbol("es.core.Container").valueOf();
var method={};
var proto={"constructor":{"value":Container},"z17__children":{"writable":true,"value":[],"type":8}
,"getChildren":{"value":function children(){
	return this[__PRIVATE__]._children.slice(0);
},"type":2},"setChildren":{"value":function children(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.core.Container",51);
	this.removeAllChild();
	var len=value.length;
	var index=0;
	for(;index<len;index++){
		if(System.is(value[0], IDisplay)){
			this.addChild(Reflect.type(value[0],IDisplay));
		}
	}
},"type":4},"getChildAt":{"value":function getChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Container",70);
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length:index;
	var result=Reflect.type(children[index],IDisplay);
	if(result==null){
		throw new RangeError('The index out of range',"es.core.Container","77:62");
	}
	return result;
},"type":1}
,"getChildIndex":{"value":function getChildIndex(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",87);
	var children=this[__PRIVATE__]._children;
	return children.indexOf(child);
},"type":1}
,"addChild":{"value":function addChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",98);
	return this.addChildAt(child,-1);
},"type":1}
,"addChildAt":{"value":function addChildAt(child,index){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",109);
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Container",109);
	var parent=child.getParent();
	if(parent){
		parent.removeChild(child);
	}
	var children=this[__PRIVATE__]._children;
	var at=index<0?index+children.length+1:index;
	children.splice(at,0,child);
	child.s3_setParentDisplay(this);
	this.getElement().addChildAt(child.getElement(),index);
	return child;
},"type":1}
,"removeChild":{"value":function removeChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",129);
	var index=Reflect.type(this.getChildIndex(child),Number);
	if(index>=0){
		return this.removeChildAt(index);
	}
	else {
		throw new ReferenceError('The child is not added.',"es.core.Container","136:67");
	}
},"type":1}
,"removeChildAt":{"value":function removeChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Container",145);
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length:index;
	if(!(children.length>index)){
		throw new RangeError('The index out of range',"es.core.Container","151:62");
	}
	var child=Reflect.type(children[index],IDisplay);
	children.splice(index,1);
	this.getElement().removeChild(child.getElement());
	child.s3_setParentDisplay(null);
	return child;
},"type":1}
,"removeAllChild":{"value":function removeAllChild(){
	var len=this[__PRIVATE__]._children.length;
	while(len>0){
		this.removeChildAt(--len);
	}
	this.getElement().html('');
},"type":1}
,"contains":{"value":function contains(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",179);
	return Element.contains(this.getElement(),child.getElement());
},"type":1}
,"z17__layout":{"writable":true,"value":null,"type":8}
,"getLayout":{"value":function layout(){
	return this[__PRIVATE__]._layout;
},"type":2},"setLayout":{"value":function layout(value){
	if(!System.is(value, BaseLayout))throw new TypeError("type does not match. must be BaseLayout","es.core.Container",194);
	value.setTarget(this);
	this[__PRIVATE__]._layout=value;
},"type":4}};
Container.prototype=Object.create( Display.prototype , proto);
Internal.defineClass("es/core/Container.es",Container,{
	"extends":Display,
	"package":"es.core",
	"classname":"Container",
	"implements":[IContainer],
	"uri":["z17","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
