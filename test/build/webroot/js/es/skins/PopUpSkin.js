var PopUpSkin=function PopUpSkin(){
constructor.apply(this,arguments);
};
module.exports=PopUpSkin;
var Skin=require("es/core/Skin.es");
var State=require("es/core/State.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var PopUp=require("es/core/PopUp.es");
var Container=require("es/core/Container.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Array=require("system/Array.es");
var Reflect=require("system/Reflect.es");
var Object=require("system/Object.es");
var Function=require("system/Function.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"head":null,"body":null,"footer":null,"popupContainer":null,"_hostComponent":undefined,"_makeMap":{},"hasSetHeight":false}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, PopUp))throw new TypeError("type does not match. must be PopUp","es.skins.PopUpSkin",18);
	this[__PRIVATE__]._hostComponent=hostComponent;
	Skin.call(this,"div");
	var __var77__=new State();
	__var77__.setName("tips");
	__var77__.setStateGroup(["simple"]);
	var __var78__=new State();
	__var78__.setName("title");
	__var78__.setStateGroup(["simple"]);
	var __var79__=new State();
	__var79__.setName("alert");
	__var79__.setStateGroup(["normal"]);
	var __var80__=new State();
	__var80__.setName("confirm");
	__var80__.setStateGroup(["normal"]);
	var __var81__=new State();
	__var81__.setName("modality");
	__var81__.setStateGroup(["normal"]);
	this.setStates([__var77__,__var78__,__var79__,__var80__,__var81__]);
	this.setCurrentState("alert");
	var attrs={"__var67__":{"class":"popup-head"},"__var69__":{"class":"popup-title"},"__var71__":{"type":"button","class":"close"},"__var72__":{"class":"popup-body"},"__var73__":{"class":"popup-footer"},"__var75__":{"type":"button"},"__var82__":{"class":"popup","tabindex":-1}};
	this[__PRIVATE__].properties=attrs;
	var head=Reflect.type((this.L15_createComponent(0,3,Container,"div",null,attrs.__var67__)),Container);
	this.setHead(head);
	var body=Reflect.type((this.L15_createComponent(0,6,Container,"div",null,attrs.__var72__)),Container);
	this.setBody(body);
	var footer=Reflect.type((this.L15_createComponent(0,7,Container,"div",null,attrs.__var73__)),Container);
	this.setFooter(footer);
	var popupContainer=Reflect.type((this.L15_createComponent(0,2,Container,"div")),Container);
	this.setPopupContainer(popupContainer);
	this.attributes(this.getElement(),attrs.__var82__);
};
var __PRIVATE__=Symbol("es.skins.PopUpSkin").valueOf();
var method={};
var proto={"constructor":{"value":PopUpSkin},"b58_properties":{"writable":true,"value":{},"type":8}
,"getHead":{"value":function(){
	return this[__PRIVATE__].head;
},"type":2},"setHead":{"value":function(val){
	return this[__PRIVATE__].head=val;
},"type":2},"getBody":{"value":function(){
	return this[__PRIVATE__].body;
},"type":2},"setBody":{"value":function(val){
	return this[__PRIVATE__].body=val;
},"type":2},"getFooter":{"value":function(){
	return this[__PRIVATE__].footer;
},"type":2},"setFooter":{"value":function(val){
	return this[__PRIVATE__].footer=val;
},"type":2},"getPopupContainer":{"value":function(){
	return this[__PRIVATE__].popupContainer;
},"type":2},"setPopupContainer":{"value":function(val){
	return this[__PRIVATE__].popupContainer=val;
},"type":2},"b58__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var stateGroup=this.L15_getCurrentStateGroup();
	if(!stateGroup){
		throw new TypeError("State group is not defined for 'stateGroup'","es.skins.PopUpSkin","54:66");
	}
	var titleText=dataset.titleText||"title",
	closeText=dataset.closeText||"×",
	submitText=dataset.submitText||"确 定",
	cancelText=dataset.cancelText||"取 消",
	headHeight=dataset.headHeight||NaN,
	footerHeight=dataset.footerHeight||NaN,
	left=dataset.left||NaN,
	top=dataset.top||NaN,
	right=dataset.right||NaN,
	bottom=dataset.bottom||NaN;
	var attrs=this[__PRIVATE__].properties;
	var head=Reflect.type((!stateGroup.includeIn("tips")?this.getHead():null),Container);
	var body=this.getBody();
	var footer=Reflect.type((!stateGroup.includeIn("simple")?this.getFooter():null),Container);
	var popupContainer=this.getPopupContainer();
	if(head){
		head.setHeight(headHeight);
		this.L15_updateChildren(head,[this.L15_createElement(0,4,"span",titleText,attrs.__var69__),!stateGroup.includeIn("title")?this.L15_createElement(0,5,"button",closeText,attrs.__var71__,null,{"click":(this.b58_makeAction('close'))}):null]);
	}
	this.L15_updateChildren(body,this.getChildren());
	if(footer){
		footer.setHeight(footerHeight);
		this.L15_updateChildren(footer,[!stateGroup.includeIn("alert")?this.L15_createElement(0,8,"button",cancelText,attrs.__var75__,{"class":stateGroup.includeIn("modality")?"btn btn-default":"btn btn-sm btn-default"},{"click":(this.b58_makeAction('cancel'))}):null,this.L15_createElement(0,9,"button",submitText,attrs.__var75__,{"class":stateGroup.includeIn("modality")?"btn btn-sm btn-primary":"btn btn-sm btn-primary"},{"click":(this.b58_makeAction('submit'))})]);
	}
	popupContainer.setLeft(Reflect.type(left,Number));
	popupContainer.setTop(Reflect.type(top,Number));
	popupContainer.setRight(Reflect.type(right,Number));
	popupContainer.setBottom(Reflect.type(bottom,Number));
	this.attributes(popupContainer.getElement(),{"class":stateGroup.includeIn("modality")?"popup-container fixed popup-lg":"popup-container fixed"});
	this.L15_updateChildren(popupContainer,[head,body,footer]);
	return [popupContainer];
},"type":1}
,"b58__makeMap":{"writable":true,"value":{},"type":8}
,"b58_makeAction":{"value":function makeAction(name){
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.skins.PopUpSkin",96);
	if(this[__PRIVATE__]._makeMap.hasOwnProperty(name)){
		return Reflect.type(this[__PRIVATE__]._makeMap[name],Function);
	}
	var fn=this.L15_getHostComponent().action.bind(this.L15_getHostComponent(),name);
	this[__PRIVATE__]._makeMap[name]=fn;
	return fn;
},"type":1}
,"getWidth":{"value":function width(){
	return this.getPopupContainer().getWidth();
},"type":2},"setWidth":{"value":function width(val){
	if(!(val>=0) && !System.isNaN(val))throw new TypeError("type does not match. must be uint","es.skins.PopUpSkin",107);
	this.getPopupContainer().setWidth(val);
},"type":4},"b58_hasSetHeight":{"writable":true,"value":false,"type":8}
,"getHeight":{"value":function height(){
	return this.getPopupContainer().getHeight();
},"type":2},"setHeight":{"value":function height(val){
	if(!(val>=0) && !System.isNaN(val))throw new TypeError("type does not match. must be uint","es.skins.PopUpSkin",118);
	this.getPopupContainer().setHeight(val);
	this[__PRIVATE__].hasSetHeight=true;
},"type":4},"L15_updateDisplayList":{"value":function updateDisplayList(){
	Skin.prototype.L15_updateDisplayList.call(this);
	var h=this.getPopupContainer().getHeight();
	var stateGroup=this.L15_getCurrentStateGroup();
	if(!stateGroup.includeIn("tips")){
		h-=this.getHead().getHeight();
	}
	if(!stateGroup.includeIn("simple")){
		h-=this.getFooter().getHeight();
	}
	this.getBody().setHeight(h);
},"type":1}
};
PopUpSkin.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/skins/PopUpSkin.es",PopUpSkin,{
	"extends":Skin,
	"package":"es.skins",
	"classname":"PopUpSkin",
	"uri":["b58","L15","J48"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
