var PopUpManage=function PopUpManage(){
constructor.apply(this,arguments);
};
module.exports=PopUpManage;
var IContainer=require("es/interfaces/IContainer.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var SystemManage=require("es/core/SystemManage.es");
var BasePopUp=require("es/core/BasePopUp.es");
var Display=require("es/core/Display.es");
var Array=require("system/Array.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var Element=require("system/Element.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function(){
Object.defineProperty(this,__PRIVATE__,{value:{}});
};
var __PRIVATE__=Symbol("es.core.PopUpManage").valueOf();
var method={"MASK_LEVEL":{"value":99900,"type":16}
,"WINDOW_LEVEL":{"value":99910,"type":16}
,"TOP_LEVEL":{"value":99999,"type":16}
,"defaultOptions":{"writable":true,"value":{"profile":{"titleText":"提示","currentState":"modality"},"disableScroll":false,"isModalWindow":true,"mask":true,"callback":null,"timeout":0,"maskStyle":null,"clickOutsideClose":false,"animation":{"enabled":true,"fadeIn":{"name":"fadeInDown","duration":0.2,"timing":"linear","delay":0,"fillMode":"forwards"},"fadeOut":{"name":"fadeOutUp","duration":0.2,"timing":"linear","delay":0,"fillMode":"forwards"}},"horizontal":"center","vertical":"middle","offsetX":0,"offsetY":0,"x":NaN,"y":NaN},"type":8}
,"i53_count":{"writable":true,"value":0,"type":8}
,"i53_maskInstance":{"writable":true,"value":null,"type":8}
,"i53_systemPopUpInstance":{"writable":true,"value":null,"type":8}
,"i53_modalityInstances":{"writable":true,"value":[],"type":8}
,"i53_maskActiveCount":{"writable":true,"value":0,"type":8}
,"mask":{"value":function mask(target,options){
	if(options === undefined ){options=null;}
	if(target === undefined ){target=null;}
	if(target!==null && !System.is(target, Display))throw new TypeError("type does not match. must be Display","es.core.PopUpManage",96);
	if(options!==null && !System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUpManage",96);
	if(target){
		Reflect.decre(PopUpManage,PopUpManage,"maskActiveCount");
		if(PopUpManage.i53_maskActiveCount<1){
			Reflect.type(target,MaskDisplay).fadeOut();
			PopUpManage.i53_maskActiveCount=0;
		}
		return target;
	}
	var obj=PopUpManage.i53_maskInstance;
	if(obj==null){
		obj=new MaskDisplay(SystemManage.getBody());
		obj.style("zIndex",PopUpManage.MASK_LEVEL);
		PopUpManage.i53_maskInstance=obj;
	}
	if(options){
		obj.options(options);
	}
	Reflect.incre(PopUpManage,PopUpManage,"maskActiveCount");
	obj.fadeIn();
	return obj;
},"type":1}
,"show":{"value":function show(target,isModalWindow,viewport){
	if(viewport === undefined ){viewport=null;}
	if(isModalWindow === undefined ){isModalWindow=false;}
	if(!System.is(target, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.PopUpManage",130);
	if(!System.is(isModalWindow, Boolean))throw new TypeError("type does not match. must be Boolean","es.core.PopUpManage",130);
	if(viewport!==null && !System.is(viewport, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.PopUpManage",130);
	var elem;
	Reflect.incre(PopUpManage,PopUpManage,"count");
	var level=PopUpManage.WINDOW_LEVEL;
	if(isModalWindow===true){
		if(PopUpManage.i53_modalityInstances.indexOf(target)<0){
			PopUpManage.i53_modalityInstances.push(target);
		}
		PopUpManage.active(target);
	}
	else {
		if(PopUpManage.i53_systemPopUpInstance&&target!==PopUpManage.i53_systemPopUpInstance){
			elem=PopUpManage.i53_systemPopUpInstance.getElement();
			if(PopUpManage.i53_systemPopUpInstance.getParent()){
				PopUpManage.i53_systemPopUpInstance.getParent().removeChild(PopUpManage.i53_systemPopUpInstance);
			}
		}
		PopUpManage.i53_systemPopUpInstance=target;
		level=PopUpManage.TOP_LEVEL;
	}
	target.getElement().style("zIndex",level);
	if(target.getElement().parent().isEmpty()){
		viewport.addChild(target);
	}
},"type":1}
,"active":{"value":function active(target){
	if(!System.is(target, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.PopUpManage",173);
	var skin;
	var obj;
	var index=0;
	var len=PopUpManage.i53_modalityInstances.length;
	var at=0;
	for(;index<len;index++){
		obj=Reflect.type(PopUpManage.i53_modalityInstances[index],BasePopUp);
		skin=target.getSkin();
		if(target===obj){
			at=index;
			skin.getElement().style('zIndex',PopUpManage.WINDOW_LEVEL);
			skin.getElement().addClass("active");
		}
		else {
			skin.getElement().style('zIndex',PopUpManage.WINDOW_LEVEL-1);
			skin.getElement().removeClass("active");
		}
	}
	if(at>0){
		PopUpManage.i53_modalityInstances.splice(at,1);
		PopUpManage.i53_modalityInstances.push(target);
	}
},"type":1}
,"close":{"value":function close(target){
	if(!System.is(target, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.PopUpManage",207);
	var parent;
	if(PopUpManage.i53_count>0){
		Reflect.decre(PopUpManage,PopUpManage,"count");
	}
	var index=PopUpManage.i53_modalityInstances.indexOf(target);
	if(index>=0){
		parent=target.getParent();
		if(parent){
			parent.removeChild(target);
		}
		PopUpManage.i53_modalityInstances.splice(index,1);
		if(PopUpManage.i53_modalityInstances.length>0){
			PopUpManage.active(Reflect.type(PopUpManage.i53_modalityInstances[PopUpManage.i53_modalityInstances.length-1],BasePopUp));
		}
		return target;
	}
	return null;
},"type":1}
};
for(var prop in method){
	Object.defineProperty(PopUpManage, prop, method[prop]);
}
var proto={"constructor":{"value":PopUpManage}};
PopUpManage.prototype=Object.create( Object.prototype , proto);
Internal.defineClass("es/core/PopUpManage.es",PopUpManage,{
	"package":"es.core",
	"classname":"PopUpManage",
	"uri":["i53","d55","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
var MaskDisplay = (function(){var MaskDisplay=function MaskDisplay(){
constructor.apply(this,arguments);
};
var Display=require("es/core/Display.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Element=require("system/Element.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(viewport){
	Object.defineProperty(this,__PRIVATE__,{value:{"_options":null,"_state":false,"timeoutId":NaN}});

	if(!System.is(viewport, Element))throw new TypeError("type does not match. must be Element","MaskDisplay",267);
	Display.call(this,new Element('<div tabIndex="-1" />'));
	this[__PRIVATE__]._options=MaskDisplay.y54_defaultOptions;
	this.style("cssText",System.serialize(MaskDisplay.y54_defaultOptions.style,"style"));
	this.setVisible(false);
	viewport.addChild(this.getElement());
};
var __PRIVATE__=Symbol("MaskDisplay").valueOf();
var method={"y54_defaultOptions":{"writable":true,"value":{"animation":{"enabled":true,"fadeIn":0.2,"fadeOut":0.2},"style":{"backgroundColor":"#000000","opacity":0.7,"position":"fixed","left":"0px","top":"0px","right":"0px","bottom":"0px"}},"type":8}
};
for(var prop in method){
	Object.defineProperty(MaskDisplay, prop, method[prop]);
}
var proto={"constructor":{"value":MaskDisplay},"y54__options":{"writable":true,"value":null,"type":8}
,"y54__state":{"writable":true,"value":false,"type":8}
,"options":{"value":function options(option){
	if(!System.is(option, Object))throw new TypeError("type does not match. must be Object","MaskDisplay",277);
	this[__PRIVATE__]._options=Object.merge(true,{},MaskDisplay.y54_defaultOptions,option);
},"type":1}
,"fadeIn":{"value":function fadeIn(){
	var animation;
	if(!System.isNaN(this[__PRIVATE__].timeoutId)){
		System.clearTimeout(this[__PRIVATE__].timeoutId);
		this[__PRIVATE__].timeoutId=NaN;
	}
	else if(!this[__PRIVATE__]._state){
		animation=Reflect.type(MaskDisplay.y54_defaultOptions.animation,Object);
		if(animation.fadeIn>0){
			this.getElement().fadeIn(animation.fadeIn,Reflect.type(this[__PRIVATE__]._options.style.opacity,Number));
		}
	}
	else {
		this.getElement().style("opacity",this[__PRIVATE__]._options.style.opacity);
		this.getElement().style("animation","none");
	}
	this[__PRIVATE__]._state=true;
	this.setVisible(true);
},"type":1}
,"y54_timeoutId":{"writable":true,"value":NaN,"type":8}
,"fadeOut":{"value":function fadeOut(){
	if(this[__PRIVATE__]._state){
		this[__PRIVATE__]._state=false;
		this[__PRIVATE__].timeoutId=System.setTimeout(function(target){
			if(!System.is(target, MaskDisplay))throw new TypeError("type does not match. must be MaskDisplay","MaskDisplay",315);
			var animation=Reflect.type(MaskDisplay.y54_defaultOptions.animation,Object);
			var fadeOut=Reflect.type(animation.fadeOut,Number);
			if(animation.fadeOut>0){
				target.getElement().fadeOut(Reflect.type(animation.fadeOut,Number),Reflect.type(target[__PRIVATE__]._options.style.opacity,Number));
			}
			System.setTimeout(function(){
				target.setVisible(false);
				target.getElement().style("animation","none");
			},(fadeOut)*1000);
			System.clearTimeout(target[__PRIVATE__].timeoutId);
		},100,this);
	}
},"type":1}
};
MaskDisplay.prototype=Object.create( Display.prototype , proto);
Internal.defineClass("MaskDisplay.es",MaskDisplay,{
	"ns":"Y7",
	"extends":Display,
	"package":"es.core",
	"classname":"MaskDisplay",
	"uri":["y54","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
return MaskDisplay;
}());
