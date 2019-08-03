var BaseLayout=function BaseLayout(){
constructor.apply(this,arguments);
};
module.exports=BaseLayout;
var IDisplay=require("es/interfaces/IDisplay.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Array=require("system/Array.es");
var System=require("system/System.es");
var Event=require("system/Event.es");
var Element=require("system/Element.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var ElementEvent=require("system/ElementEvent.es");
var StyleEvent=require("system/StyleEvent.es");
var Object=require("system/Object.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{"_target":null,"_children":[],"_parent":null,"_viewport":null,"_gap":0}});

	EventDispatcher.call(this);
};
var __PRIVATE__=Symbol("es.core.BaseLayout").valueOf();
var method={"a21_rootLayouts":{"writable":true,"value":[],"type":8}
,"a21_initialize":{"writable":true,"value":false,"type":8}
,"a21_initRootLayout":{"value":function initRootLayout(){
	if(BaseLayout.a21_initialize===false){
		BaseLayout.a21_initialize=true;
		System.getGlobalEvent().addEventListener(Event.INITIALIZE_COMPLETED,BaseLayout.a21_nowUpdateLayout);
		System.getGlobalEvent().addEventListener(Event.RESIZE,BaseLayout.a21_nowUpdateLayout);
	}
},"type":1}
,"a21_nowUpdateLayout":{"value":function nowUpdateLayout(){
	var layout;
	var len=BaseLayout.a21_rootLayouts.length;
	var index=0;
	for(;index<len;index++){
		layout=BaseLayout.a21_rootLayouts[index];
		layout.M22_nowUpdateChildren(parseInt(layout.getViewport().width()),parseInt(layout.getViewport().height()));
	}
},"type":1}
,"a21_findLayoutByTarget":{"value":function findLayoutByTarget(children,target){
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",55);
	var layout;
	var item;
	var len=children.length;
	var i=0;
	for(;i<len;i++){
		item=children[i];
		if(item.getTarget()===target){
			return item;
		}
		layout=BaseLayout.a21_findLayoutByTarget(item[__PRIVATE__]._children,target);
		if(layout){
			return layout;
		}
	}
	return null;
},"type":1}
,"a21_findParentLayout":{"value":function findParentLayout(children,elem){
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",80);
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",80);
	var parent;
	var item;
	var len=children.length;
	var i=0;
	for(;i<len;i++){
		item=children[i];
		parent=BaseLayout.a21_findParentLayout(item[__PRIVATE__]._children,elem);
		if(parent){
			return parent;
		}
		if(Element.contains(item.getTarget().getElement(),elem)){
			return item;
		}
	}
	return null;
},"type":1}
,"a21_findChildrenLayout":{"value":function findChildrenLayout(children,elem){
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",106);
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",106);
	var item;
	var len=children.length;
	var i=0;
	var results=[];
	for(;i<len;i++){
		item=children[i];
		if(Element.contains(elem,item.getTarget().getElement())){
			results.push(item);
		}
	}
	return results;
},"type":1}
,"a21_assignParentForLayoutChildren":{"value":function assignParentForLayoutChildren(layoutChildren,parent){
	if(!System.is(layoutChildren, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",128);
	if(!System.is(parent, BaseLayout))throw new TypeError("type does not match. must be BaseLayout","es.core.BaseLayout",128);
	var i;
	var children=BaseLayout.a21_findChildrenLayout(layoutChildren,parent.getTarget().getElement());
	if(children.length>0){
		for(i=0;i<children.length;i++){
			layoutChildren.splice(layoutChildren.indexOf(children[i]),1);
			parent[__PRIVATE__]._children.push(children[i]);
			children[i][__PRIVATE__]._parent=parent;
		}
		return true;
	}
	return false;
},"type":1}
,"a21_addLayout":{"value":function addLayout(layout){
	if(!System.is(layout, BaseLayout))throw new TypeError("type does not match. must be BaseLayout","es.core.BaseLayout",148);
	var parent=BaseLayout.a21_findParentLayout(BaseLayout.a21_rootLayouts,layout.getTarget().getElement());
	if(parent){
		BaseLayout.a21_assignParentForLayoutChildren(parent[__PRIVATE__]._children,layout);
		if(parent[__PRIVATE__]._children.indexOf(layout)<0){
			parent[__PRIVATE__]._children.push(layout);
			layout[__PRIVATE__]._parent=parent;
		}
	}
	else {
		BaseLayout.a21_assignParentForLayoutChildren(BaseLayout.a21_rootLayouts,layout);
		if(BaseLayout.a21_rootLayouts.indexOf(layout)<0){
			BaseLayout.a21_rootLayouts.push(layout);
		}
	}
	BaseLayout.a21_initRootLayout();
},"type":1}
,"a21_removeLayout":{"value":function removeLayout(layout){
	if(!System.is(layout, BaseLayout))throw new TypeError("type does not match. must be BaseLayout","es.core.BaseLayout",172);
	var layoutChildren=BaseLayout.a21_rootLayouts;
	if(layout[__PRIVATE__]._parent){
		layoutChildren=layout[__PRIVATE__]._parent[__PRIVATE__]._children;
	}
	var index=layoutChildren.indexOf(layout);
	if(index>=0){
		delete layoutChildren.splice;
	}
},"type":1}
,"a21_updateRootLayout":{"value":function updateRootLayout(children){
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",190);
	var bElement;
	var bLayout;
	var index;
	var aElement;
	var aLayout;
	var seek=0;
	while(children.length>1&&seek<children.length){
		aLayout=children[seek];
		aElement=aLayout[__PRIVATE__]._target.getElement();
		index=Reflect.type(seek+1,Number);
		for(;index<children.length;index++){
			bLayout=children[index];
			bElement=bLayout[__PRIVATE__]._target.getElement();
			if(Element.contains(aElement,bElement)){
				aLayout[__PRIVATE__]._children.push(bLayout);
				bLayout[__PRIVATE__]._parent=aLayout;
				children.splice(index,1);
				index--;
				BaseLayout.a21_updateRootLayout(aLayout[__PRIVATE__]._children);
			}
			else if(Element.contains(bElement,aElement)){
				bLayout[__PRIVATE__]._children.push(aLayout);
				aLayout[__PRIVATE__]._parent=bLayout;
				children.splice(seek,1);
				BaseLayout.a21_updateRootLayout(bLayout[__PRIVATE__]._children);
				break ;
			}
		}
		seek++;
	}
},"type":1}
,"a21_rectangle":{"writable":true,"value":["Top","Bottom","Left","Right"],"type":8}
};
for(var prop in method){
	Object.defineProperty(BaseLayout, prop, method[prop]);
}
var proto={"constructor":{"value":BaseLayout},"a21__target":{"writable":true,"value":null,"type":8}
,"a21__children":{"writable":true,"value":[],"type":8}
,"a21__parent":{"writable":true,"value":null,"type":8}
,"getTarget":{"value":function target(){
	return this[__PRIVATE__]._target;
},"type":2},"setTarget":{"value":function target(value){
	if(!System.is(value, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.BaseLayout",250);
	var self;
	var layoutTarget;
	if(value!==this[__PRIVATE__]._target){
		if(this[__PRIVATE__]._target){
			layoutTarget=BaseLayout.a21_findLayoutByTarget(BaseLayout.a21_rootLayouts,this[__PRIVATE__]._target);
			if(layoutTarget){
				BaseLayout.a21_removeLayout(layoutTarget);
			}
		}
		self=this;
		value.getElement().addEventListener(ElementEvent.ADD,function(e){
			if(!System.is(e, ElementEvent))throw new TypeError("type does not match. must be ElementEvent","es.core.BaseLayout",263);
			if(Reflect.call(BaseLayout,this,"style",['position'])==="static"){
				Reflect.call(BaseLayout,this,"style",['position','relative']);
			}
			BaseLayout.a21_addLayout(self);
		});
		value.getElement().removeEventListener(ElementEvent.REMOVE,function(e){
			if(!System.is(e, ElementEvent))throw new TypeError("type does not match. must be ElementEvent","es.core.BaseLayout",270);
			Reflect.call(BaseLayout,this,"removeEventListener",[ElementEvent.REMOVE]);
			BaseLayout.a21_removeLayout(self);
		});
		this[__PRIVATE__]._target=value;
	}
},"type":4},"a21__viewport":{"writable":true,"value":null,"type":8}
,"getViewport":{"value":function viewport(){
	if(this[__PRIVATE__]._viewport===null){
		this[__PRIVATE__]._viewport=this[__PRIVATE__]._target.getElement().parent();
		this.a21_styleChange(this[__PRIVATE__]._viewport);
	}
	return this[__PRIVATE__]._viewport;
},"type":2},"setViewport":{"value":function viewport(value){
	if(!System.is(value, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",297);
	this[__PRIVATE__]._viewport=value;
	this.a21_styleChange(this[__PRIVATE__]._viewport);
},"type":4},"a21_styleChange":{"value":function styleChange(target){
	if(!System.is(target, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",321);
	var self=this;
	var oldWidth=NaN;
	var oldHeight=NaN;
	target.addEventListener(StyleEvent.CHANGE,function(e){
		if(!System.is(e, StyleEvent))throw new TypeError("type does not match. must be StyleEvent","es.core.BaseLayout",326);
		var width=Reflect.type(target.width(),Number);
		var height=Reflect.type(target.height(),Number);
		if(oldWidth!==width||oldHeight!==height){
			oldWidth=width;
			oldHeight=height;
			self.M22_nowUpdateChildren(width,height);
		}
	});
},"type":1}
,"M22_getChildByNode":{"value":function getChildByNode(nodeElement){
	var item;
	var len=this[__PRIVATE__]._children.length;
	var i=0;
	for(;i<len;i++){
		item=this[__PRIVATE__]._children[i];
		if(Reflect.get(BaseLayout,item.getTarget().getElement(),0)===nodeElement){
			return item;
		}
	}
	return null;
},"type":1}
,"a21__gap":{"writable":true,"value":0,"type":8}
,"getGap":{"value":function gap(){
	return this[__PRIVATE__]._gap;
},"type":2},"setGap":{"value":function gap(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",367);
	this[__PRIVATE__]._gap=value;
},"type":4},"M22_calculateWidth":{"value":function calculateWidth(elem,baseWidth){
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",388);
	if(!System.is(baseWidth, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",388);
	var cssWidth;
	var currentElem;
	if(!elem.hasProperty("init-layout-width")){
		if(!elem.hasProperty("percentWidth")&&!elem.hasProperty("explicitWidth")){
			currentElem=elem.current();
			cssWidth=Reflect.type(Reflect.get(BaseLayout,(currentElem.currentStyle||currentElem.style),"width"),String);
			if(cssWidth&&cssWidth.charAt(cssWidth.length-1)==="%"){
				elem.property("percentWidth",parseInt(cssWidth));
			}
			else {
				elem.property("explicitWidth",parseInt(elem.width()));
			}
		}
		elem.property("init-layout-width",1);
	}
	var value=0;
	if(elem.hasProperty("explicitWidth")){
		value=parseInt(elem.property("explicitWidth"));
	}
	else if(elem.hasProperty("percentWidth")){
		value=Reflect.type(parseInt(elem.property("percentWidth")),Number);
		value=Reflect.type(value>0?value*baseWidth/100:0,Number);
	}
	var maxWidth=1000000;
	var minWidth=0;
	if(elem.hasProperty("maxWidth")){
		maxWidth=parseInt(elem.property("maxWidth"));
	}
	if(elem.hasProperty("minWidth")){
		minWidth=parseInt(elem.property("minWidth"));
	}
	return Math.max(Math.min(value,maxWidth),minWidth);
},"type":1}
,"M22_calculateHeight":{"value":function calculateHeight(elem,baseWidth){
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",438);
	if(!System.is(baseWidth, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",438);
	var cssHeight;
	var currentElem;
	if(!elem.hasProperty("init-layout-height")){
		if(!elem.hasProperty("percentHeight")&&!elem.hasProperty("explicitHeight")){
			currentElem=elem.current();
			cssHeight=Reflect.type(Reflect.get(BaseLayout,(currentElem.currentStyle||currentElem.style),"height"),String);
			if(cssHeight&&cssHeight.charAt(cssHeight.length-1)==="%"){
				elem.property("percentHeight",parseInt(cssHeight));
			}
			else {
				elem.property("explicitHeight",parseInt(elem.height()));
			}
		}
		elem.property("init-layout-height",1);
	}
	var value=0;
	if(elem.hasProperty("explicitHeight")){
		value=parseInt(elem.property("explicitHeight"));
	}
	else if(elem.hasProperty("percentHeight")){
		value=parseInt(elem.property("percentHeight"));
		value=Reflect.type(value>0?value*baseWidth/100:0,Number);
	}
	var maxHeight=1000000;
	var minHeight=0;
	if(elem.hasProperty("maxHeight")){
		maxHeight=parseInt(elem.property("maxHeight"));
	}
	if(elem.hasProperty("minHeight")){
		minHeight=parseInt(elem.property("minHeight"));
	}
	return Math.max(Math.min(value,maxHeight),minHeight);
},"type":1}
,"M22_getRectangleBox":{"value":function getRectangleBox(elem){
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",491);
	var lName;
	var uName;
	var value={};
	var i=0;
	for(;i<4;i++){
		uName=Reflect.type(BaseLayout.a21_rectangle[i],String);
		lName=uName.toLowerCase();
		value[lName]=parseInt(elem.property(lName));
		value['margin'+uName]=parseInt(elem.style('margin'+uName));
	}
	return value;
},"type":1}
,"M22_setLayoutSize":{"value":function setLayoutSize(width,height){
	if(!System.is(width, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",510);
	if(!System.is(height, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",510);
	this.getTarget().getElement().style('cssText',{"width":width,"height":height});
},"type":1}
,"M22_nowUpdateChildren":{"value":function nowUpdateChildren(width,height){
	if(!System.is(width, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",523);
	if(!System.is(height, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",523);
	var j;
	var isChild;
	var childNode;
	var layout;
	width=this.M22_calculateWidth(this.getTarget().getElement(),width);
	height=this.M22_calculateHeight(this.getTarget().getElement(),height);
	var len=this[__PRIVATE__]._children.length;
	var index=0;
	var parentNode=Reflect.type(this.getTarget().getElement().current(),Node);
	for(;index<len;index++){
		layout=this[__PRIVATE__]._children[index];
		childNode=Reflect.type(layout.getTarget().getElement().current(),Node);
		isChild=false;
		if(parentNode.hasChildNodes()){
			j=0;
			for(;j<parentNode.childNodes.length;j++){
				if(parentNode.childNodes.item(j)===childNode){
					isChild=true;
					break ;
				}
			}
		}
		if(isChild){
			layout.M22_nowUpdateChildren(width,height);
		}
		else {
			layout.M22_nowUpdateChildren(layout.getViewport().width(),layout.getViewport().height());
		}
	}
	this.M22_calculateChildren(width,height);
},"type":1}
,"M22_calculateChildren":{"value":function calculateChildren(parentWidth,parentHeight){
	if(!System.is(parentWidth, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",560);
	if(!System.is(parentHeight, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",560);
},"type":1}
};
BaseLayout.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/BaseLayout.es",BaseLayout,{
	"extends":null,
	"package":"es.core",
	"classname":"BaseLayout",
	"uri":["a21","M22","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
