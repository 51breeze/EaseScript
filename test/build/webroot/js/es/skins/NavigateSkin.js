var NavigateSkin=function NavigateSkin(){
constructor.apply(this,arguments);
};
module.exports=NavigateSkin;
var Skin=require("es/core/Skin.es");
var NavigateEvent=require("es/events/NavigateEvent.es");
var Navigate=require("es/components/Navigate.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Array=require("system/Array.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var MouseEvent=require("system/MouseEvent.es");
var Element=require("system/Element.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, Navigate))throw new TypeError("type does not match. must be Navigate","es.skins.NavigateSkin",15);
	this[__PRIVATE__]._hostComponent=hostComponent;
	Skin.call(this,"div");
	var attrs={"__var53__":{"role":"presentation","class":"active"},"__var57__":{"role":"presentation"},"__var59__":{"class":"nav nav-pills"},"__var60__":{"class":"navigate"}};
	this[__PRIVATE__].properties=attrs;
	this.attributes(this.getElement(),attrs.__var60__);
};
var __PRIVATE__=Symbol("es.skins.NavigateSkin").valueOf();
var method={};
var proto={"constructor":{"value":NavigateSkin},"Z47_properties":{"writable":true,"value":{},"type":8}
,"Z47__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var datalist=dataset.datalist||[],
	openTarget=dataset.openTarget||false,
	match=dataset.match;
	var attrs=this[__PRIVATE__].properties;
	var __FOR0__=0;
	var __var58__=this.L15_createElement(0,2,"ul",null,attrs.__var59__);
	var __var54__=[];
	Object.forEach(datalist,function(item,link){
		if(match(item,link)){
			__var54__.push(this.L15_createElement(__FOR0__,3,"li",[this.L15_createElement(__FOR0__,4,"a",Reflect.get(NavigateSkin,item,"label"),null,{"href":Reflect.get(NavigateSkin,item,"link"),"target":(openTarget?'_blank':'_self')},{"click":this.Z47_onClick})],attrs.__var53__));
		}
		else {
			__var54__.push(this.L15_createElement(__FOR0__,5,"li",[this.L15_createElement(__FOR0__,6,"a",Reflect.get(NavigateSkin,item,"label"),null,{"href":Reflect.get(NavigateSkin,item,"link"),"target":(openTarget?'_blank':'_self')},{"click":this.Z47_onClick})],attrs.__var57__));
		}
		__FOR0__++;
	},this);
	this.L15_updateChildren(__var58__,__var54__);
	return [__var58__];
},"type":1}
,"Z47_onClick":{"value":function onClick(e){
	if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","es.skins.NavigateSkin",48);
	var i;
	var hostComponent=this.L15_getHostComponent();
	var target=new Element(e.target);
	var href=target.property("href");
	if(href===hostComponent.getCurrent()){
		e.preventDefault();
		return false;
	}
	var dataProfile=hostComponent.getDataProfile();
	var event=new NavigateEvent(NavigateEvent.URL_JUMP_BEFORE);
	event.setContent(href);
	event.originalEvent=e;
	var datalist=Reflect.type(this.assign(dataProfile),Array);
	if(datalist){
		for(i in datalist){
			if(Reflect.get(NavigateSkin,datalist[i],"link")===event.getContent()){
				event.setItem(datalist[i]);
				break ;
			}
		}
	}
	hostComponent.dispatchEvent(event);
},"type":1}
};
NavigateSkin.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/skins/NavigateSkin.es",NavigateSkin,{
	"extends":Skin,
	"package":"es.skins",
	"classname":"NavigateSkin",
	"uri":["Z47","L15","J48"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
