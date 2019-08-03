var PaginationSkin=function PaginationSkin(){
constructor.apply(this,arguments);
};
module.exports=PaginationSkin;
var Skin=require("es/core/Skin.es");
var Pagination=require("es/components/Pagination.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Array=require("system/Array.es");
var Function=require("system/Function.es");
var Object=require("system/Object.es");
var MouseEvent=require("system/MouseEvent.es");
var Element=require("system/Element.es");
var Reflect=require("system/Reflect.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, Pagination))throw new TypeError("type does not match. must be Pagination","es.skins.PaginationSkin",15);
	this[__PRIVATE__]._hostComponent=hostComponent;
	Skin.call(this,"div");
	var attrs={"__var88__":{"class":"first"},"__var92__":{"class":"prev"},"__var97__":{"class":"next"},"__var100__":{"class":"last"},"__var101__":{"class":"pagination"}};
	this[__PRIVATE__].properties=attrs;
	this.attributes(this.getElement(),attrs.__var101__);
};
var __PRIVATE__=Symbol("es.skins.PaginationSkin").valueOf();
var method={};
var proto={"constructor":{"value":PaginationSkin},"d63_properties":{"writable":true,"value":{},"type":8}
,"d63__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var url=dataset.url,
	first=dataset.first,
	prev=dataset.prev,
	next=dataset.next,
	last=dataset.last,
	profile=dataset.profile,
	current=dataset.current||1,
	link=dataset.link;
	var attrs=this[__PRIVATE__].properties;
	var __FOR0__=0;
	var __var89__=[];
	__var89__.push(this.L15_createElement(0,2,"li",[this.L15_createElement(0,3,"a","第一页",null,{"href":(url(first,profile))})],attrs.__var88__));
	__var89__.push(this.L15_createElement(0,4,"li",[this.L15_createElement(0,5,"a","上一页",null,{"href":(url(prev,profile)),"class":(current===1?"disabled":"")})],attrs.__var92__));
	Object.forEach(link,function(val,key){
		__var89__.push(this.L15_createElement(__FOR0__,6,"li",[this.L15_createElement(__FOR0__,7,"a",val,null,{"href":(url(val,profile))})],null,{"class":"link "+(val==current?'current':'')}));
		__FOR0__++;
	},this);
	__var89__.push(this.L15_createElement(0,8,"li",[this.L15_createElement(0,9,"a","下一页",null,{"href":(url(next,profile))})],attrs.__var97__));
	__var89__.push(this.L15_createElement(0,10,"li",[this.L15_createElement(0,11,"a","最后页",null,{"href":(url(last,profile))})],attrs.__var100__));
	return __var89__;
},"type":1}
,"L15_initializing":{"value":function initializing(){
	var host=this.L15_getHostComponent();
	var profile=new RegExp(host.getProfile()+'\\s*=\\s*(\\d+)');
	this.addEventListener(MouseEvent.CLICK,function(e){
		if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","es.skins.PaginationSkin",45);
		var page;
		var _profile;
		var url;
		if(host.getAsync()&&Element.getNodeName(e.target)==='a'){
			e.preventDefault();
			url=Element(e.target).property('href');
			_profile=url.match(profile);
			page=System.parseInt(_profile?_profile[1]:0);
			if(page>0){
				host.setCurrent(Reflect.type(page,Number));
			}
		}
	});
},"type":1}
,"L15_updateDisplayList":{"value":function updateDisplayList(){
	Skin.prototype.L15_updateDisplayList.call(this);
	var hostComponent=this.L15_getHostComponent();
	var _radius=hostComponent.getRadius();
	if(_radius>0){
		Element('.link',this.getElement()).style('borderRadius',_radius+'px');
	}
},"type":1}
};
PaginationSkin.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/skins/PaginationSkin.es",PaginationSkin,{
	"extends":Skin,
	"package":"es.skins",
	"classname":"PaginationSkin",
	"uri":["d63","L15","J48"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
