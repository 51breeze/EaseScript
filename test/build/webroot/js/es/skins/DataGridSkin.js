var DataGridSkin=function DataGridSkin(){
constructor.apply(this,arguments);
};
module.exports=DataGridSkin;
var Skin=require("es/core/Skin.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var DataGrid=require("es/components/DataGrid.es");
var Pagination=require("es/components/Pagination.es");
var PaginationSkin=require("es/skins/PaginationSkin.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var Array=require("system/Array.es");
var Object=require("system/Object.es");
var Element=require("system/Element.es");
var DataSource=require("system/DataSource.es");
var DataSourceEvent=require("system/DataSourceEvent.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"head":null,"body":null,"pagination":null,"foot":null,"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, DataGrid))throw new TypeError("type does not match. must be DataGrid","es.skins.DataGridSkin",20);
	this[__PRIVATE__]._hostComponent=hostComponent;
	Skin.call(this,"table");
	var attrs={"__var108__":{"style":"height: 25px;"},"__var115__":{"colspan":3},"__var117__":{"class":"table data-grid-skin"}};
	this[__PRIVATE__].properties=attrs;
	var head=this.L15_createElement(0,2,"thead");
	this.setHead(head);
	var body=this.L15_createElement(0,7,"tbody");
	this.setBody(body);
	var pagination=Reflect.type((this.L15_createComponent(0,15,Pagination)),Pagination);
	this.setPagination(pagination);
	var foot=this.L15_createElement(0,12,"tfoot");
	this.setFoot(foot);
	this.attributes(this.getElement(),attrs.__var117__);
};
var __PRIVATE__=Symbol("es.skins.DataGridSkin").valueOf();
var method={};
var proto={"constructor":{"value":DataGridSkin},"i59_properties":{"writable":true,"value":{},"type":8}
,"getHead":{"value":function(){
	return this[__PRIVATE__].head;
},"type":2},"setHead":{"value":function(val){
	return this[__PRIVATE__].head=val;
},"type":2},"getBody":{"value":function(){
	return this[__PRIVATE__].body;
},"type":2},"setBody":{"value":function(val){
	return this[__PRIVATE__].body=val;
},"type":2},"getPagination":{"value":function(){
	return this[__PRIVATE__].pagination;
},"type":2},"setPagination":{"value":function(val){
	return this[__PRIVATE__].pagination=val;
},"type":2},"getFoot":{"value":function(){
	return this[__PRIVATE__].foot;
},"type":2},"setFoot":{"value":function(val){
	return this[__PRIVATE__].foot=val;
},"type":2},"i59__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var attrs=this[__PRIVATE__].properties;
	var __FOR0__=0;
	var __var106__=this.L15_createElement(0,3,"tr");
	var head=this.getHead();
	var __FOR1__=0;
	var body=this.getBody();
	var pagination=this.getPagination();
	var foot=this.getFoot();
	var __var105__=[];
	Object.forEach(dataset.columns,function(name,key){
		__var105__.push(this.L15_createElement(__FOR0__,4,"th",[name,this.L15_createElement(__FOR0__,6,"span")],null,{"style":"height:"+dataset.headHeight+"px;line-height:"+dataset.headHeight+"px;"}));
		__FOR0__++;
	},this);
	this.L15_updateChildren(__var106__,__var105__);
	this.L15_updateChildren(head,[__var106__]);
	var __var113__=[];
	Object.forEach(dataset.datalist,function(item,key){
		var __var110__=[];
		Object.forEach(dataset.columns,function(val,field){
			switch(field){
				case "name":__var110__.push(this.L15_createElement(__FOR1__,9,"td",[this.L15_createElement(__FOR1__,10,"input",null,attrs.__var108__,{"value":(Reflect.get(DataGridSkin,item,field))})],null,{"data-column":field,"style":"height:"+dataset.rowHeight+"px;line-height:"+dataset.rowHeight+"px;"}));
				break ;
				default :__var110__.push(this.L15_createElement(__FOR1__,11,"td",(Reflect.get(DataGridSkin,item,field)),null,{"data-column":field,"style":"height:"+dataset.rowHeight+"px;line-height:"+dataset.rowHeight+"px;"}));
			}
			__FOR1__++;
		},this);
		var __var112__=this.L15_createElement(__FOR1__,8,"tr");
		this.L15_updateChildren(__var112__,__var110__);
		__var113__.push(__var112__);
		__FOR1__++;
	},this);
	this.L15_updateChildren(body,__var113__);
	pagination.setRadius(3);
	pagination.setAsync(true);
	pagination.setSkinClass(PaginationSkin);
	this.L15_updateChildren(foot,[this.L15_createElement(0,13,"tr",[this.L15_createElement(0,14,"td",[pagination],attrs.__var115__)])]);
	return [head,body,foot];
},"type":1}
,"L15_updateDisplayList":{"value":function updateDisplayList(){
	Skin.prototype.L15_updateDisplayList.call(this);
	var hostComponent=this.L15_getHostComponent();
	var radius=hostComponent.getRadius()+'px';
	var table=this.getElement();
	table.style('borderRadius',radius);
	Element('thead > tr:first-child >th:first-child',table).style('borderTopLeftRadius',radius);
	Element('thead > tr:first-child >th:last-child',table).style('borderTopRightRadius',radius);
	Element('tfoot > tr:last-child >td:first-child',table).style('borderBottomLeftRadius',radius);
	Element('tfoot > tr:last-child >td:last-child',table).style('borderBottomRightRadius',radius);
	Element('td',this.getFoot()).height(hostComponent.getFootHeight());
},"type":1}
,"L15_initializing":{"value":function initializing(){
	var dataProfile;
	var body;
	var dataSource;
	var hostComponent=this.L15_getHostComponent();
	if(hostComponent.isNeedCreateSkin()){
		dataSource=hostComponent.getDataSource();
		body=this;
		dataProfile=hostComponent.getDataProfile();
		this.getPagination().setDataSource(dataSource);
		body.assign('rowHeight',hostComponent.getRowHeight());
		body.assign('headHeight',hostComponent.getHeadHeight());
		body.assign(dataProfile,[]);
		body.assign(hostComponent.getColumnProfile(),hostComponent.getColumns());
		body.assign(hostComponent.getColumnProfile(),hostComponent.getColumns());
		dataSource.addEventListener(DataSourceEvent.SELECT,function(event){
			if(!System.is(event, DataSourceEvent))throw new TypeError("type does not match. must be DataSourceEvent","es.skins.DataGridSkin",117);
			if(!event.waiting){
				body.assign(dataProfile,event.data);
				body.display();
			}
		});
		dataSource.select(this.getPagination().getCurrent());
	}
	Skin.prototype.L15_initializing.call(this);
},"type":1}
};
DataGridSkin.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/skins/DataGridSkin.es",DataGridSkin,{
	"extends":Skin,
	"package":"es.skins",
	"classname":"DataGridSkin",
	"uri":["i59","L15","J48"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
