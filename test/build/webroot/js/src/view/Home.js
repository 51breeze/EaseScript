var Home=function Home(){
constructor.apply(this,arguments);
};
module.exports=Home;
var View=require("es/core/View.es");
var Display=require("es/core/Display.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var State=require("es/core/State.es");
var IndexApplication=require("IndexApplication.es");
var DataGrid=require("es/components/DataGrid.es");
var PopUp=require("es/core/PopUp.es");
var Container=require("es/core/Container.es");
var PopUpSkin=require("es/skins/PopUpSkin.es");
var DataGridSkin=require("es/skins/DataGridSkin.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Array=require("system/Array.es");
var Reflect=require("system/Reflect.es");
var Object=require("system/Object.es");
var DataSource=require("system/DataSource.es");
var Http=require("system/Http.es");
var Element=require("system/Element.es");
var console=require("system/Console.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"popup":null,"dataGrid":null,"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, IndexApplication))throw new TypeError("type does not match. must be IndexApplication","view.Home",19);
	this[__PRIVATE__]._hostComponent=hostComponent;
	View.call(this,hostComponent);
	var __var135__=new State();
	__var135__.setName("show");
	__var135__.setStateGroup(["fail","success"]);
	var __var136__=new State();
	__var136__.setName("hide");
	__var136__.setStateGroup(["hide"]);
	this.setStates([__var135__,__var136__]);
	this.setCurrentState("show");
	var attrs={"__var134__":{"dd":"sssss"}};
	this[__PRIVATE__].properties=attrs;
	var popup=this.L15_createElement(0,7,"button","PopUp");
	this.setPopup(popup);
	var dataGrid=Reflect.type((this.L15_createComponent(0,17,DataGrid)),DataGrid);
	this.setDataGrid(dataGrid);
};
var __PRIVATE__=Symbol("view.Home").valueOf();
var method={};
var proto={"constructor":{"value":Home},"g49_properties":{"writable":true,"value":{},"type":8}
,"getPopup":{"value":function(){
	return this[__PRIVATE__].popup;
},"type":2},"setPopup":{"value":function(val){
	return this[__PRIVATE__].popup=val;
},"type":2},"getDataGrid":{"value":function(){
	return this[__PRIVATE__].dataGrid;
},"type":2},"setDataGrid":{"value":function(val){
	return this[__PRIVATE__].dataGrid=val;
},"type":2},"g49__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var stateGroup=this.L15_getCurrentStateGroup();
	if(!stateGroup){
		throw new TypeError("State group is not defined for 'stateGroup'","view.Home","41:66");
	}
	var attrs=this[__PRIVATE__].properties;
	var __var122__=Reflect.type((stateGroup.includeIn("success")?this.L15_createComponent(0,6,PopUp,null,this.getChildren()):null),PopUp);
	var popup=this.getPopup();
	var __var127__=Reflect.type((this.L15_createComponent(0,13,Container,"div",[this.L15_createElement(0,14,"div","ssssss"),this.L15_createElement(0,15,"div",666666),this.getChildren()])),Container);
	var __var131__=Reflect.type((this.L15_createComponent(0,18,Container,"ul",[this.L15_createElement(0,19,"div","========columns========")])),Container);
	var dataGrid=Reflect.type((stateGroup.includeIn("success")?this.getDataGrid():null),DataGrid);
	this.L15_getHostComponent().setTitle(this.getTitle());
	if(__var122__){
		__var122__.setTitle("dfdsf");
		__var122__.setSkinClass(PopUpSkin);
	}
	if(dataGrid){
		dataGrid.setSource("http://local.working.com/json.php");
		dataGrid.getDataSource().dataType(Http.TYPE_JSONP);
		dataGrid.setColumns({"id":"ID","name":"名称","phone":"电话"});
		dataGrid.setSkinClass(DataGridSkin);
		this.L15_bindEvent(0,17,dataGrid,{"click":this.g49_click});
		dataGrid.setChildren([__var131__]);
	}
	return [this.L15_createElement(0,4,"div","sssss"),this.L15_createElement(0,5,"div","====== the ===dsfsdf==999999 =======dsfdsfds====666=="),__var122__,popup,this.L15_createElement(0,8,"div",this.getChild()),this.getChild(),this.L15_createElement(0,10,"div",[this.L15_createElement(0,11,"h1","the is "+dataset.message),this.L15_createElement(0,12,"h1","这里是内容 Person "+dataset.uuuu),__var127__,dataGrid],attrs.__var134__)];
},"type":1}
,"getChild":{"value":function child(){
	return [new Display(new Element(Element.createElement("div")),{"jjj":999,"innerHTML":"=======createElement======="}),new Display(new Element(Element.createElement("div")),{"jjj":7777,"innerHTML":"<span style='color:red;'>=======createElement===66666666====</span>"})];
},"type":2},"g49_click":{"value":function click(){
	console.log("=====");
},"type":1}
};
Home.prototype=Object.create( View.prototype , proto);
Internal.defineClass("view/Home.es",Home,{
	"extends":View,
	"package":"view",
	"classname":"Home",
	"uri":["g49","L15","t43"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
