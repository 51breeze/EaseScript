var SkinComponent=function SkinComponent(){
constructor.apply(this,arguments);
};
module.exports=SkinComponent;
var Component=require("es/components/Component.es");
var Skin=require("es/core/Skin.es");
var IContainer=require("es/interfaces/IContainer.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var es_internal=require("es/core/es_internal.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var PropertyEvent=require("system/PropertyEvent.es");
var Object=require("system/Object.es");
var Element=require("system/Element.es");
var Array=require("system/Array.es");
var ReferenceError=require("system/ReferenceError.es");
var Function=require("system/Function.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Event=require("system/Event.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{"_componentId":undefined,"_async":true,"_skin":null,"_skinClass":null,"properties":{},"_parent":null,"_children":[],"events":{},"_owner":null}});

	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",23);
	Component.call(this);
	if(System.isDefined(SkinComponent.L29_componentIdHash[componentId])){
	}
	SkinComponent.L29_componentIdHash[componentId]=true;
	this[__PRIVATE__]._componentId=componentId;
};
var __PRIVATE__=Symbol("es.components.SkinComponent").valueOf();
var method={"L29_componentIdHash":{"writable":true,"value":{},"type":8}
};
for(var prop in method){
	Object.defineProperty(SkinComponent, prop, method[prop]);
}
var proto={"constructor":{"value":SkinComponent},"L29__componentId":{"writable":true,"value":undefined,"type":8}
,"getComponentId":{"value":function getComponentId(prefix){
	if(prefix === undefined ){prefix="";}
	if(!System.is(prefix, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",38);
	return prefix?prefix+'-'+this[__PRIVATE__]._componentId:this[__PRIVATE__]._componentId;
},"type":1}
,"L29__async":{"writable":true,"value":true,"type":8}
,"getAsync":{"value":function async(){
	return true;
},"type":2},"setAsync":{"value":function async(flag){
	if(!System.is(flag, Boolean))throw new TypeError("type does not match. must be Boolean","es.components.SkinComponent",53);
	this[__PRIVATE__]._async=flag;
},"type":4},"isNeedCreateSkin":{"value":function isNeedCreateSkin(){
	return true;
},"type":1}
,"L29__skin":{"writable":true,"value":null,"type":8}
,"getSkin":{"value":function skin(){
	var skin;
	var skinClass;
	if(this[__PRIVATE__]._skin===null){
		skinClass=this.getSkinClass();
		if(skinClass===null){
			throw new TypeError("the \""+System.getQualifiedObjectName(this)+"\" skinClass is not defined.","es.components.SkinComponent","106:95");
		}
		skin=Reflect.type(new skinClass(this),Skin);
		this[__PRIVATE__]._skin=skin;
	}
	return this[__PRIVATE__]._skin;
},"type":2},"setSkin":{"value":function skin(skinObj){
	if(!System.is(skinObj, Skin))throw new TypeError("type does not match. must be Skin","es.components.SkinComponent",119);
	var event;
	var old=this[__PRIVATE__]._skin;
	this[__PRIVATE__]._skin=skinObj;
	if(this.k30_getInitialized()&&old&&skinObj!==old){
		if(this.hasEventListener(PropertyEvent.CHANGE)){
			event=new PropertyEvent(PropertyEvent.CHANGE);
			event.oldValue=old;
			event.newValue=skinObj;
			event.property='skin';
			this.dispatchEvent(event);
		}
		this.L29_installChildren();
		this.k30_commitProperty();
		this.k30_commitPropertyAndUpdateSkin();
	}
},"type":4},"L29__skinClass":{"writable":true,"value":null,"type":8}
,"getSkinClass":{"value":function skinClass(){
	return this[__PRIVATE__]._skinClass;
},"type":2},"setSkinClass":{"value":function skinClass(value){
	if(!System.is(value, "class"))throw new TypeError("type does not match. must be Class","es.components.SkinComponent",156);
	var event;
	var skin;
	var old=this[__PRIVATE__]._skinClass;
	if(old!==value){
		this[__PRIVATE__]._skinClass=value;
		if(this.k30_getInitialized()){
			skin=Reflect.type(new value(this),Skin);
			this[__PRIVATE__]._skin=skin;
			this.L29_installChildren();
			this.k30_commitProperty();
			this.k30_commitPropertyAndUpdateSkin();
			if(this.hasEventListener(PropertyEvent.CHANGE)){
				event=new PropertyEvent(PropertyEvent.CHANGE);
				event.oldValue=old;
				event.newValue=value;
				event.property='skinClass';
				this.dispatchEvent(event);
			}
		}
	}
},"type":4},"k30_getProperties":{"value":function(){
	return this[__PRIVATE__].properties;
},"type":2},"k30_setProperties":{"value":function(val){
	return this[__PRIVATE__].properties=val;
},"type":2},"getHeight":{"value":function height(){
	if(this.k30_getInitialized()){
		return this.getSkin().getHeight();
	}
	return Reflect.type(this.k30_getProperties().height,Number);
},"type":2},"setHeight":{"value":function height(value){
	if(!(value>=0) && !System.isNaN(value))throw new TypeError("type does not match. must be uint","es.components.SkinComponent",202);
	if(this.k30_getInitialized()){
		this.getSkin().setHeight(value);
	}
	this.k30_getProperties().height=value;
},"type":4},"getWidth":{"value":function width(){
	if(this.k30_getInitialized()){
		return this.getSkin().getWidth();
	}
	return Reflect.type(this.k30_getProperties().width,Number);
},"type":2},"setWidth":{"value":function width(value){
	if(!(value>=0) && !System.isNaN(value))throw new TypeError("type does not match. must be uint","es.components.SkinComponent",226);
	if(this.k30_getInitialized()){
		this.getSkin().setWidth(value);
	}
	this.k30_getProperties().width=value;
},"type":4},"getElement":{"value":function element(){
	if(this.k30_getInitialized()){
		return this.getSkin().getElement();
	}
	return null;
},"type":2},"getVisible":{"value":function visible(){
	if(this.k30_getInitialized()){
		return this.getSkin().getVisible();
	}
	return !!this.k30_getProperties().visible;
},"type":2},"setVisible":{"value":function visible(flag){
	if(!System.is(flag, Boolean))throw new TypeError("type does not match. must be Boolean","es.components.SkinComponent",251);
	if(this.k30_getInitialized()){
		this.getSkin().setVisible(flag);
	}
	this.k30_getProperties().visible=flag;
},"type":4},"getLeft":{"value":function left(){
	if(this.k30_getInitialized()){
		return this.getSkin().getLeft();
	}
	return Reflect.type(this.k30_getProperties().left,Number);
},"type":2},"setLeft":{"value":function left(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",288);
	if(this.k30_getInitialized()){
		this.getSkin().setLeft(value);
	}
	this.k30_getProperties().left=value;
},"type":4},"getTop":{"value":function top(){
	if(this.k30_getInitialized()){
		return this.getSkin().getTop();
	}
	return Reflect.type(this.k30_getProperties().top,Number);
},"type":2},"setTop":{"value":function top(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",313);
	if(this.k30_getInitialized()){
		this.getSkin().setTop(value);
	}
	this.k30_getProperties().top=value;
},"type":4},"getRight":{"value":function right(){
	if(this.k30_getInitialized()){
		return this.getSkin().getRight();
	}
	return Reflect.type(this.k30_getProperties().right,Number);
},"type":2},"setRight":{"value":function right(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",338);
	if(this.k30_getInitialized()){
		this.getSkin().setRight(value);
	}
	this.k30_getProperties().right=value;
},"type":4},"getBottom":{"value":function bottom(){
	if(this.k30_getInitialized()){
		return this.getSkin().getBottom();
	}
	return Reflect.type(this.k30_getProperties().bottom,Number);
},"type":2},"setBottom":{"value":function bottom(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",364);
	if(this.k30_getInitialized()){
		this.getSkin().setBottom(value);
	}
	this.k30_getProperties().bottom=value;
},"type":4},"L29__parent":{"writable":true,"value":null,"type":8}
,"s3_setParentDisplay":{"value":function setParentDisplay(value){
	if(value === undefined ){value=null;}
	if(value!==null && !System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.components.SkinComponent",381);
	if(this.k30_getInitialized()){
		this.getSkin().s3_setParentDisplay(value);
	}
	this[__PRIVATE__]._parent=value;
},"type":1}
,"getParent":{"value":function parent(){
	if(this.k30_getInitialized()){
		return this.getSkin().getParent();
	}
	return this[__PRIVATE__]._parent;
},"type":2},"L29__children":{"writable":true,"value":[],"type":8}
,"getChildren":{"value":function children(){
	if(this.k30_getInitialized()){
		return this.getSkin().getChildren();
	}
	else {
		return this[__PRIVATE__]._children.slice(0);
	}
},"type":2},"setChildren":{"value":function children(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.components.SkinComponent",427);
	if(this.k30_getInitialized()){
		this.getSkin().setChildren(value);
	}
	else {
		this[__PRIVATE__]._children=value.slice(0);
	}
},"type":4},"getChildAt":{"value":function getChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.components.SkinComponent",442);
	if(this.k30_getInitialized()){
		return this.getSkin().getChildAt(index);
	}
	else {
		if(index<0){
			index=index+this[__PRIVATE__]._children.length;
		}
		return Reflect.type(this[__PRIVATE__]._children[index],IDisplay);
	}
},"type":1}
,"getChildIndex":{"value":function getChildIndex(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",460);
	if(this.k30_getInitialized()){
		return this.getSkin().getChildIndex(child);
	}
	else {
		return this[__PRIVATE__]._children.indexOf(child);
	}
},"type":1}
,"addChild":{"value":function addChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",474);
	if(this.k30_getInitialized()){
		return this.getSkin().addChild(child);
	}
	else {
		this[__PRIVATE__]._children.push(child);
		return child;
	}
},"type":1}
,"addChildAt":{"value":function addChildAt(child,index){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",491);
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.components.SkinComponent",491);
	if(this.k30_getInitialized()){
		return this.getSkin().addChildAt(child,index);
	}
	else {
		if(index<0){
			index=index+this[__PRIVATE__]._children.length;
		}
		this[__PRIVATE__]._children.splice(index,0,child);
		return child;
	}
},"type":1}
,"removeChild":{"value":function removeChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",511);
	var index;
	if(this.k30_getInitialized()){
		return this.getSkin().removeChild(child);
	}
	else {
		index=this[__PRIVATE__]._children.indexOf(child);
		if(index>=0){
			this.removeChildAt(index);
		}
		else {
			throw new ReferenceError("child is not exists.","es.components.SkinComponent","523:68");
		}
	}
},"type":1}
,"removeChildAt":{"value":function removeChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.components.SkinComponent",533);
	if(this.k30_getInitialized()){
		return this.getSkin().removeChildAt(index);
	}
	else {
		if(index<0){
			index=index+this[__PRIVATE__]._children.length;
		}
		if(this[__PRIVATE__]._children[index]){
			return Reflect.type(this[__PRIVATE__]._children.splice(index,1),IDisplay);
		}
		throw new ReferenceError("Index is out of range","es.components.SkinComponent","546:65");
	}
},"type":1}
,"removeAllChild":{"value":function removeAllChild(){
	if(this.k30_getInitialized()){
		this.getSkin().removeAllChild();
	}
	else {
		this[__PRIVATE__]._children=[];
	}
},"type":1}
,"contains":{"value":function contains(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",570);
	if(!this.k30_getInitialized()){
		return false;
	}
	else {
		return this.getSkin().contains(child);
	}
},"type":1}
,"L29_events":{"writable":true,"value":{},"type":8}
,"addEventListener":{"value":function addEventListener(type,callback,useCapture,priority,reference){
	if(reference === undefined ){reference=null;}
	if(priority === undefined ){priority=0;}
	if(useCapture === undefined ){useCapture=false;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",590);
	if(!System.is(callback, Function))throw new TypeError("type does not match. must be Function","es.components.SkinComponent",590);
	if(!System.is(useCapture, Boolean))throw new TypeError("type does not match. must be Boolean","es.components.SkinComponent",590);
	if(!System.is(priority, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",590);
	if(reference!==null && !System.is(reference, Object))throw new TypeError("type does not match. must be Object","es.components.SkinComponent",590);
	if(this.k30_getInitialized()){
		this.getSkin().addEventListener(type,callback,useCapture,priority,reference);
	}
	else {
		Component.prototype.addEventListener.call(this,type,callback,useCapture,priority,reference);
	}
	if(!this[__PRIVATE__].events.hasOwnProperty(type)){
		this[__PRIVATE__].events[type]=[];
	}
	Reflect.call(SkinComponent,this[__PRIVATE__].events[type],"push",[{"callback":callback,"useCapture":useCapture,"priority":priority,"reference":reference}]);
	return this;
},"type":1}
,"removeEventListener":{"value":function removeEventListener(type,listener){
	if(listener === undefined ){listener=null;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",618);
	if(listener!==null && !System.is(listener, Function))throw new TypeError("type does not match. must be Function","es.components.SkinComponent",618);
	if(this.k30_getInitialized()){
		return this.getSkin().removeEventListener(type,listener);
	}
	else {
		Component.prototype.removeEventListener.call(this,type,listener);
	}
	if(!this[__PRIVATE__].events.hasOwnProperty(type)){
		return false;
	}
	if(!listener){
		delete this[__PRIVATE__].events[type];
		return true;
	}
	var map=Reflect.type(this[__PRIVATE__].events[type],Array);
	var len=map.length;
	for(;len>0;){
		if(Reflect.get(SkinComponent,map[--len],"callback")===listener){
			map.splice(len,1);
			return true;
		}
	}
	return false;
},"type":1}
,"dispatchEvent":{"value":function dispatchEvent(event){
	if(!System.is(event, Event))throw new TypeError("type does not match. must be Event","es.components.SkinComponent",657);
	if(this.k30_getInitialized()){
		return this.getSkin().dispatchEvent(event);
	}
	else {
		return Component.prototype.dispatchEvent.call(this,event);
	}
},"type":1}
,"hasEventListener":{"value":function hasEventListener(type,listener){
	if(listener === undefined ){listener=null;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",673);
	if(listener!==null && !System.is(listener, Function))throw new TypeError("type does not match. must be Function","es.components.SkinComponent",673);
	if(this.k30_getInitialized()){
		return this.getSkin().hasEventListener(type,listener);
	}
	else {
		return Component.prototype.hasEventListener.call(this,type,listener);
	}
},"type":1}
,"display":{"value":function display(){
	if(!this.k30_getInitialized()){
		this.k30_initializing();
		this.k30_commitPropertyAndUpdateSkin();
	}
	return this.getSkin().getElement();
},"type":1}
,"k30_initializing":{"value":function initializing(){
	Component.prototype.k30_initializing.call(this);
	this.L29_installChildren();
	this.k30_commitProperty();
},"type":1}
,"L29_installChildren":{"value":function installChildren(){
	if(this[__PRIVATE__]._children.length>0){
		this.getSkin().setChildren(this[__PRIVATE__]._children);
	}
},"type":1}
,"k30_commitProperty":{"value":function commitProperty(){
	var skin=this.getSkin();
	Object.forEach(this.k30_getProperties(),function(value,name){
		if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",730);
		if(Reflect.has(SkinComponent,skin,name)){
			Reflect.set(SkinComponent,skin,name,value);
		}
	});
	Object.forEach(this[__PRIVATE__].events,function(listener,type){
		if(!System.is(listener, Array))throw new TypeError("type does not match. must be Array","es.components.SkinComponent",736);
		if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",736);
		var item;
		var len=listener.length;
		var index=0;
		for(;index<len;index++){
			item=listener[index];
			skin.removeEventListener(type,item.callback);
			skin.addEventListener(type,item.callback,item.useCapture,item.priority,item.reference);
			Component.prototype.removeEventListener.call(this,type,item.callback);
		}
	},this);
	if(this[__PRIVATE__]._parent){
		skin.s3_setParentDisplay(this[__PRIVATE__]._parent);
	}
},"type":1}
,"k30_commitPropertyAndUpdateSkin":{"value":function commitPropertyAndUpdateSkin(){
	if(this.k30_getInitialized()){
		this.k30_nowUpdateSkin();
	}
},"type":1}
,"k30_nowUpdateSkin":{"value":function nowUpdateSkin(){
	var skin=this.getSkin();
	skin.display();
},"type":1}
,"k30_push":{"value":function push(name,value){
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",794);
	this.k30_getProperties()[name]=value;
},"type":1}
,"k30_pull":{"value":function pull(name){
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",804);
	return this.k30_getProperties()[name];
},"type":1}
,"L29__owner":{"writable":true,"value":null,"type":8}
,"getOwner":{"value":function owner(){
	return this[__PRIVATE__]._owner;
},"type":2},"setOwner":{"value":function owner(value){
	if(!System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.components.SkinComponent",827);
	this[__PRIVATE__]._owner=value;
},"type":4}};
SkinComponent.prototype=Object.create( Component.prototype , proto);
Internal.defineClass("es/components/SkinComponent.es",SkinComponent,{
	"extends":Component,
	"package":"es.components",
	"classname":"SkinComponent",
	"implements":[IDisplay,IContainer],
	"uri":["L29","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
