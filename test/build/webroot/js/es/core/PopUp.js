var PopUp=function PopUp(){
constructor.apply(this,arguments);
};
module.exports=PopUp;
var Container=require("es/core/Container.es");
var BasePopUp=require("es/core/BasePopUp.es");
var Skin=require("es/core/Skin.es");
var IContainer=require("es/interfaces/IContainer.es");
var PopUpSkin=require("es/skins/PopUpSkin.es");
var PopUpManage=require("es/core/PopUpManage.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Object=require("system/Object.es");
var JSON=require("system/JSON.es");
var Function=require("system/Function.es");
var Reflect=require("system/Reflect.es");
var Element=require("system/Element.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{}});

	if(componentId === undefined ){componentId="12";}
	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.core.PopUp",25);
	BasePopUp.call(this,componentId);
};
var __PRIVATE__=Symbol("es.core.PopUp").valueOf();
var method={"T51__instance":{"writable":true,"value":null,"type":8}
,"skinClass":{"writable":true,"value":PopUpSkin,"type":8}
,"T51_getInstance":{"value":function getInstance(skinClass){
	if(skinClass === undefined ){skinClass=null;}
	if(skinClass!==null && !System.is(skinClass, "class"))throw new TypeError("type does not match. must be Class","es.core.PopUp",44);
	if(!PopUp.T51__instance){
		PopUp.T51__instance=new PopUp("12");
		PopUp.T51__instance.setSkinClass(PopUp.skinClass);
	}
	if(skinClass&&PopUp.T51__instance.getSkinClass()!==skinClass){
		PopUp.T51__instance.setSkinClass(skinClass);
	}
	return PopUp.T51__instance;
},"type":1}
,"T51_modalityInstance":{"writable":true,"value":null,"type":8}
,"T51_getModalityInstance":{"value":function getModalityInstance(skinClass){
	if(skinClass === undefined ){skinClass=null;}
	if(skinClass!==null && !System.is(skinClass, "class"))throw new TypeError("type does not match. must be Class","es.core.PopUp",68);
	if(!skinClass)skinClass=PopUp.skinClass;
	if(!PopUp.T51_modalityInstance){
		PopUp.T51_modalityInstance=new PopUp("12");
		PopUp.T51_modalityInstance.setSkinClass(skinClass);
	}
	if(skinClass&&PopUp.T51_modalityInstance.getSkinClass()!==skinClass){
		PopUp.T51_modalityInstance.setSkinClass(skinClass);
	}
	return PopUp.T51_modalityInstance;
},"type":1}
,"box":{"value":function box(message,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",90);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",90);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"mask":true,"disableScroll":false,"profile":{"currentState":"tips","content":message},"skinStyle":{"background":"none","borderRadius":"0px","boxShadow":"none","border":"none"}},options));
},"type":1}
,"tips":{"value":function tips(message,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",113);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",113);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"timeout":2,"vertical":"top","mask":false,"isModalWindow":false,"profile":{"currentState":"tips","content":message},"disableScroll":false},options));
},"type":1}
,"title":{"value":function title(message,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",133);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",133);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"timeout":2,"vertical":"top","mask":false,"isModalWindow":false,"profile":{"currentState":"title","content":message},"disableScroll":false},options));
},"type":1}
,"alert":{"value":function alert(message,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",153);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",153);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"mask":true,"isModalWindow":false,"vertical":"top","profile":{"currentState":"alert","content":message}},options));
},"type":1}
,"confirm":{"value":function confirm(message,callback,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",173);
	if(!System.is(callback, Function))throw new TypeError("type does not match. must be Function","es.core.PopUp",173);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",173);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"mask":true,"callback":callback,"vertical":"top","isModalWindow":false,"profile":{"currentState":"confirm","content":message},"offsetY":2},options));
},"type":1}
,"modality":{"value":function modality(title,content,options){
	if(options === undefined ){options={};}
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",194);
	return PopUp.T51_getModalityInstance(options.skinClass).k30_show(Object.merge(true,{"mask":true,"isModalWindow":true,"profile":{"currentState":"modality","titleText":title,"content":content},"animation":{"fadeIn":{"name":"fadeIn"},"fadeOut":{"name":"fadeOut"}}},options));
},"type":1}
};
for(var prop in method){
	Object.defineProperty(PopUp, prop, method[prop]);
}
var proto={"constructor":{"value":PopUp},"k30_show":{"value":function show(options){
	if(options === undefined ){options={};}
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",220);
	this.setOption(options);
	this.display();
	return this;
},"type":1}
,"k30_getContainer":{"value":function getContainer(){
	return Reflect.type(this.getSkin(),PopUpSkin).getPopupContainer();
},"type":1}
,"display":{"value":function display(){
	var opt;
	if(!this.k30_getState()){
		opt=this.getOption();
		BasePopUp.prototype.k30_show.call(this,opt);
		BasePopUp.prototype.display.call(this);
		PopUpManage.show(this,!!opt.isModalWindow,this.getOwner());
	}
	return this.getElement();
},"type":1}
};
PopUp.prototype=Object.create( BasePopUp.prototype , proto);
Internal.defineClass("es/core/PopUp.es",PopUp,{
	"extends":BasePopUp,
	"package":"es.core",
	"classname":"PopUp",
	"uri":["T51","k30","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
