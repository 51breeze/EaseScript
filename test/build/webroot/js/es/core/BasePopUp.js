var BasePopUp=function BasePopUp(){
constructor.apply(this,arguments);
};
module.exports=BasePopUp;
var SkinComponent=require("es/components/SkinComponent.es");
var Container=require("es/core/Container.es");
var Display=require("es/core/Display.es");
var Skin=require("es/core/Skin.es");
var IContainer=require("es/interfaces/IContainer.es");
var SystemManage=require("es/core/SystemManage.es");
var PopUpManage=require("es/core/PopUpManage.es");
var Object=require("system/Object.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Function=require("system/Function.es");
var Reflect=require("system/Reflect.es");
var Element=require("system/Element.es");
var Array=require("system/Array.es");
var Event=require("system/Event.es");
var ElementEvent=require("system/ElementEvent.es");
var MouseEvent=require("system/MouseEvent.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function(){
Object.defineProperty(this,__PRIVATE__,{value:{"timeoutId":NaN,"_option":null,"state":false,"maskIntance":null,"animationEnd":true,"actionButtons":["cancel","submit","close"],"_owner":null,"_title":null}});
SkinComponent.apply(this,arguments);
};
var __PRIVATE__=Symbol("es.core.BasePopUp").valueOf();
var method={};
var proto={"constructor":{"value":BasePopUp},"k30_getTimeoutId":{"value":function(){
	return this[__PRIVATE__].timeoutId;
},"type":2},"k30_setTimeoutId":{"value":function(val){
	return this[__PRIVATE__].timeoutId=val;
},"type":2},"u52__option":{"writable":true,"value":null,"type":8}
,"getOption":{"value":function option(){
	if(this[__PRIVATE__]._option===null){
		this[__PRIVATE__]._option=Object.merge(true,{},PopUpManage.defaultOptions);
	}
	return this[__PRIVATE__]._option;
},"type":2},"setOption":{"value":function option(value){
	if(!System.is(value, Object))throw new TypeError("type does not match. must be Object","es.core.BasePopUp",47);
	this[__PRIVATE__]._option=Object.merge(true,{},PopUpManage.defaultOptions,value);
},"type":4},"k30_getState":{"value":function(){
	return this[__PRIVATE__].state;
},"type":2},"k30_setState":{"value":function(val){
	return this[__PRIVATE__].state=val;
},"type":2},"k30_getMaskIntance":{"value":function(){
	return this[__PRIVATE__].maskIntance;
},"type":2},"k30_setMaskIntance":{"value":function(val){
	return this[__PRIVATE__].maskIntance=val;
},"type":2},"k30_getAnimationEnd":{"value":function(){
	return this[__PRIVATE__].animationEnd;
},"type":2},"k30_setAnimationEnd":{"value":function(val){
	return this[__PRIVATE__].animationEnd=val;
},"type":2},"action":{"value":function action(type){
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.core.BasePopUp",70);
	var fadeOut;
	var container;
	var fn;
	var options=this.getOption();
	if(System.typeOf(options["on"+type])==="function"){
		fn=Reflect.type(options["on"+type],Function);
		if(fn()===false){
			return false;
		}
	}
	if(options.callback){
		if(Reflect.call(BasePopUp,options,"callback",[type])===false){
			return false;
		}
	}
	if(this.k30_getMaskIntance()){
		PopUpManage.mask(this.k30_getMaskIntance());
	}
	if(!System.isNaN(this.k30_getTimeoutId())){
		System.clearTimeout(this.k30_getTimeoutId());
		this.k30_setTimeoutId(NaN);
	}
	if(options.disableScroll){
		SystemManage.enableScroll();
	}
	var animation=Reflect.type(options.animation,Object);
	var skin=this.getSkin();
	if(this.k30_getState()&&animation&&animation.enabled){
		container=this.k30_getContainer();
		fadeOut=Reflect.type(animation.fadeOut,Object);
		this.k30_setAnimationEnd(false);
		container.style("animation",fadeOut.name+" "+fadeOut.duration+"s "+fadeOut.timing+" "+fadeOut.delay+"s "+fadeOut.fillMode);
		System.setTimeout(function(obj){
			if(!System.is(obj, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.BasePopUp",115);
			skin.setVisible(false);
			obj.k30_setState(false);
			obj.k30_setAnimationEnd(true);
			PopUpManage.close(obj);
		},(fadeOut.delay+fadeOut.duration)*1000,this);
	}
	else {
		this.k30_setState(false);
		skin.setVisible(false);
		PopUpManage.close(this);
	}
	return true;
},"type":1}
,"k30_getContainer":{"value":function getContainer(){
	return this.getSkin();
},"type":1}
,"k30_position":{"value":function position(){
	var opt=this.getOption();
	var horizontal=Reflect.type(opt.horizontal,String);
	var vertical=Reflect.type(opt.vertical,String);
	var skin=this.k30_getContainer();
	if(System.typeOf(opt.x)==="string"&&Reflect.call(BasePopUp,opt.x,"slice",[-1])==="%"||!System.isNaN(opt.x)){
		skin.style("left",opt.x);
		horizontal='';
	}
	if(System.typeOf(opt.y)==="string"&&Reflect.call(BasePopUp,opt.y,"slice",[-1])==="%"||!System.isNaN(opt.y)){
		skin.style("top",opt.y);
		vertical='';
	}
	var offsetX=parseInt(opt.offsetX);
	var offsetY=parseInt(opt.offsetY);
	var win=SystemManage.getWindow();
	var winX=Reflect.type(win.width(),Number);
	var winY=Reflect.type(win.height(),Number);
	switch(horizontal){
		case "left":skin.setLeft(Reflect.type(Math.max(offsetX,0),Number));
		break ;
		case "right":skin.setLeft(this.u52_getMaxAndMin(offsetX+(winX-skin.getWidth()),winX,skin.getWidth()));
		break ;
		case "center":skin.setLeft(this.u52_getMaxAndMin(offsetX+(winX-skin.getWidth())/2,winX,skin.getWidth()));
		break ;
	}
	switch(vertical){
		case "top":skin.setTop(Reflect.type(Math.max(offsetY,0),Number));
		break ;
		case "bottom":skin.setTop(this.u52_getMaxAndMin(offsetY+(winY-skin.getHeight()),winY,skin.getHeight()));
		break ;
		case "middle":skin.setTop(this.u52_getMaxAndMin(offsetY+(winY-skin.getHeight())/2,winY,skin.getHeight()));
		break ;
	}
},"type":1}
,"u52_getMaxAndMin":{"value":function getMaxAndMin(val,winSize,skinSize){
	if(!System.is(val, Number))throw new TypeError("type does not match. must be int","es.core.BasePopUp",197);
	if(!System.is(winSize, Number))throw new TypeError("type does not match. must be int","es.core.BasePopUp",197);
	if(!System.is(skinSize, Number))throw new TypeError("type does not match. must be int","es.core.BasePopUp",197);
	return Math.max(Math.max(val,0),Math.min(val,winSize-skinSize));
},"type":1}
,"u52_actionButtons":{"writable":true,"value":["cancel","submit","close"],"type":8}
,"k30_initializing":{"value":function initializing(){
	SkinComponent.prototype.k30_initializing.call(this);
	var skin=this.getSkin();
	SystemManage.getWindow().addEventListener(Event.RESIZE,this.k30_position,false,0,this);
	this.k30_getContainer().addEventListener(ElementEvent.ADD,this.k30_position,false,0,this);
	var main=this.k30_getContainer();
	var opt=this.getOption();
	main.removeEventListener(MouseEvent.MOUSE_OUTSIDE);
	main.addEventListener(MouseEvent.MOUSE_OUTSIDE,function(e){
		if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","es.core.BasePopUp",223);
		if(this.k30_getState()){
			if(opt.isModalWindow){
				if(opt.clickOutsideClose===true){
					this.close();
				}
			}
			else if(this.k30_getAnimationEnd()){
				this.k30_setAnimationEnd(false);
				main.getElement().animation("shake",0.2);
				System.setTimeout(function(target){
					if(!System.is(target, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.BasePopUp",238);
					target.k30_setAnimationEnd(true);
				},300,this);
			}
		}
	},false,0,this);
},"type":1}
,"k30_show":{"value":function show(options){
	if(options === undefined ){options={};}
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.BasePopUp",252);
	this.k30_setState(true);
	if(options.disableScroll){
		SystemManage.disableScroll();
	}
	if(options.mask===true){
		this.k30_setMaskIntance(PopUpManage.mask(null,options.maskStyle));
	}
	return this;
},"type":1}
,"u52__owner":{"writable":true,"value":null,"type":8}
,"getOwner":{"value":function owner(){
	if(this[__PRIVATE__]._owner===null){
		this[__PRIVATE__]._owner=new Container(SystemManage.getBody());
	}
	return this[__PRIVATE__]._owner;
},"type":2},"setOwner":{"value":function owner(value){
	if(!System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.BasePopUp",292);
	this[__PRIVATE__]._owner=value;
},"type":4},"u52__title":{"writable":true,"value":null,"type":8}
,"getTitle":{"value":function title(){
	return this[__PRIVATE__]._title;
},"type":2},"setTitle":{"value":function title(value){
	this[__PRIVATE__]._title=value;
},"type":4},"getOnSubmit":{"value":function onSubmit(){
	return Reflect.type(this.getOption().onsubmit,Function);
},"type":2},"setOnSubmit":{"value":function onSubmit(value){
	if(!System.is(value, Function))throw new TypeError("type does not match. must be Function","es.core.BasePopUp",322);
	this.getOption().onsubmit=value;
},"type":4},"getOnCancel":{"value":function onCancel(){
	return Reflect.type(this.getOption().oncancel,Function);
},"type":2},"setOnCancel":{"value":function onCancel(value){
	if(!System.is(value, Function))throw new TypeError("type does not match. must be Function","es.core.BasePopUp",338);
	this.getOption().oncancel=value;
},"type":4},"getOnClose":{"value":function onClose(){
	return Reflect.type(this.getOption().onclose,Function);
},"type":2},"setOnClose":{"value":function onClose(value){
	if(!System.is(value, Function))throw new TypeError("type does not match. must be Function","es.core.BasePopUp",354);
	this.getOption().onclose=value;
},"type":4},"display":{"value":function display(){
	var fadeIn;
	var skin=this.getSkin();
	var options=this.getOption();
	var profile=Reflect.type(options.profile,Object);
	if(System.env.platform('IE',8)){
		skin.style('position','absolute');
	}
	if(this[__PRIVATE__]._title!=null){
		profile.titleText=this[__PRIVATE__]._title;
	}
	Object.forEach(profile,function(value,prop){
		if(!System.is(prop, String))throw new TypeError("type does not match. must be String","es.core.BasePopUp",387);
		switch(prop){
			case "currentState":skin.setCurrentState(Reflect.type(value,String));
			break ;
			case "content":if(value){
				skin.setChildren(System.instanceOf(value, Array)?value:[value]);
			}
			default :skin.assign(prop,value);
		}
	},this);
	if(options.width>0){
		skin.setWidth(Reflect.type(options.width,Number));
	}
	if(options.height>0){
		skin.setHeight(Reflect.type(options.height,Number));
	}
	var elem=SkinComponent.prototype.display.call(this);
	elem.show();
	var container=this.k30_getContainer();
	var animation=Reflect.type(options.animation,Object);
	var timeout=options.timeout*1000;
	if(animation.enabled&&!animation.running){
		this.k30_setAnimationEnd(false);
		fadeIn=Reflect.type(animation.fadeIn,Object);
		container.style("animation",fadeIn.name+" "+fadeIn.duration+"s "+fadeIn.timing+" "+fadeIn.delay+"s "+fadeIn.fillMode);
		timeout=(options.timeout+fadeIn.delay+fadeIn.duration)*1000;
		System.setTimeout(function(obj){
			if(!System.is(obj, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.BasePopUp",427);
			obj.k30_setAnimationEnd(true);
		},timeout,this);
	}
	if(options.timeout>0){
		this.k30_setTimeoutId(System.setTimeout(function(obj){
			if(!System.is(obj, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.BasePopUp",435);
			obj.action("close");
		},timeout,this));
	}
	return elem;
},"type":1}
,"close":{"value":function close(){
	this.action("close");
},"type":1}
};
BasePopUp.prototype=Object.create( SkinComponent.prototype , proto);
Internal.defineClass("es/core/BasePopUp.es",BasePopUp,{
	"extends":SkinComponent,
	"package":"es.core",
	"classname":"BasePopUp",
	"abstract":true,
	"uri":["u52","k30","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
