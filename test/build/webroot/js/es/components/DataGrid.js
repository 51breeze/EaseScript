var DataGrid=function DataGrid(){
constructor.apply(this,arguments);
};
module.exports=DataGrid;
var SkinComponent=require("es/components/SkinComponent.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var DataSource=require("system/DataSource.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{"_dataSource":null,"_columns":{},"_columnProfile":'columns',"_dataProfile":'datalist',"_radius":5,"_rowHeight":25,"_headHeight":30,"_footHeight":30}});

	if(componentId === undefined ){componentId="11";}
	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.components.DataGrid",17);
	SkinComponent.call(this,componentId);
};
var __PRIVATE__=Symbol("es.components.DataGrid").valueOf();
var method={};
var proto={"constructor":{"value":DataGrid},"B50__dataSource":{"writable":true,"value":null,"type":8}
,"getDataSource":{"value":function dataSource(){
	var dataSource=this[__PRIVATE__]._dataSource;
	if(dataSource===null){
		dataSource=new DataSource();
		this[__PRIVATE__]._dataSource=dataSource;
	}
	return dataSource;
},"type":2},"getSource":{"value":function source(){
	return this.getDataSource().source();
},"type":2},"setSource":{"value":function source(data){
	this.getDataSource().source(data);
},"type":4},"B50__columns":{"writable":true,"value":{},"type":8}
,"getColumns":{"value":function columns(){
	return this[__PRIVATE__]._columns;
},"type":2},"setColumns":{"value":function columns(columns){
	if(!System.is(columns, Object))throw new TypeError("type does not match. must be Object","es.components.DataGrid",78);
	this[__PRIVATE__]._columns=System.isString(columns)?Reflect.call(DataGrid,columns,"split",[',']):columns;
},"type":4},"getRows":{"value":function rows(){
	return this.getDataSource().pageSize();
},"type":2},"setRows":{"value":function rows(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",87);
	this.getDataSource().pageSize(value);
},"type":4},"B50__columnProfile":{"writable":true,"value":'columns',"type":8}
,"getColumnProfile":{"value":function columnProfile(){
	return this[__PRIVATE__]._columnProfile;
},"type":2},"setColumnProfile":{"value":function columnProfile(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.components.DataGrid",115);
	this[__PRIVATE__]._columnProfile=value;
},"type":4},"B50__dataProfile":{"writable":true,"value":'datalist',"type":8}
,"getDataProfile":{"value":function dataProfile(){
	return this[__PRIVATE__]._dataProfile;
},"type":2},"setDataProfile":{"value":function dataProfile(profile){
	if(!System.is(profile, String))throw new TypeError("type does not match. must be String","es.components.DataGrid",130);
	this[__PRIVATE__]._dataProfile=profile;
},"type":4},"B50__radius":{"writable":true,"value":5,"type":8}
,"getRadius":{"value":function radius(){
	return this[__PRIVATE__]._radius;
},"type":2},"setRadius":{"value":function radius(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",153);
	this[__PRIVATE__]._radius=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"B50__rowHeight":{"writable":true,"value":25,"type":8}
,"getRowHeight":{"value":function rowHeight(){
	return this[__PRIVATE__]._rowHeight;
},"type":2},"setRowHeight":{"value":function rowHeight(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",177);
	this[__PRIVATE__]._rowHeight=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"B50__headHeight":{"writable":true,"value":30,"type":8}
,"getHeadHeight":{"value":function headHeight(){
	return this[__PRIVATE__]._headHeight;
},"type":2},"setHeadHeight":{"value":function headHeight(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",201);
	this[__PRIVATE__]._headHeight=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"B50__footHeight":{"writable":true,"value":30,"type":8}
,"getFootHeight":{"value":function footHeight(){
	return this[__PRIVATE__]._footHeight;
},"type":2},"setFootHeight":{"value":function footHeight(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",225);
	this[__PRIVATE__]._footHeight=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4}};
DataGrid.prototype=Object.create( SkinComponent.prototype , proto);
Internal.defineClass("es/components/DataGrid.es",DataGrid,{
	"extends":SkinComponent,
	"package":"es.components",
	"classname":"DataGrid",
	"uri":["B50","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
