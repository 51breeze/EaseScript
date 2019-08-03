(function(id,filename,undefined)
{
    "use strict";
    var Load = (window[id] || (window[id]={Load:{}})).Load;
    Load[filename]=function(){
        return {

/***** Class PersonApplication.es *****/

"PersonApplication.es": function(module,require){
var PersonApplication=function PersonApplication(){
constructor.apply(this,arguments);
};
module.exports=PersonApplication;
var BaseApplication=require("BaseApplication.es");
var Person=require("view/Person.es");
var console=require("system/Console.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{}});

	BaseApplication.call(this);
	this.setTitle("Person page 9999");
	this.assign("message","Hello word! yejun 6666");
};
var __PRIVATE__=Symbol("PersonApplication").valueOf();
var method={};
var proto={"constructor":{"value":PersonApplication},"index":{"value":function index(){
	console.log("===========index===========");
	var view=new Person(this);
	return this.n2_render(view);
},"type":1}
};
PersonApplication.prototype=Object.create( BaseApplication.prototype , proto);
Internal.defineClass("PersonApplication.es",PersonApplication,{
	"extends":BaseApplication,
	"classname":"PersonApplication",
	"uri":["o65","n2","O4"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class BaseApplication.es *****/

"BaseApplication.es": function(module,require){
var BaseApplication=function BaseApplication(){
constructor.apply(this,arguments);
};
module.exports=BaseApplication;
var Application=require("es/core/Application.es");
var System=require("system/System.es");
var Array=require("system/Array.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{}});

	Application.call(this);
	var aa=1;
	System.is(aa, Number);
};
var __PRIVATE__=Symbol("BaseApplication").valueOf();
var method={};
var proto={"constructor":{"value":BaseApplication},"getMenus":{"value":function menus(){
	return [{"link":"?PATH=/MyIndex/home","label":"首页","content":"/MyIndex/home"},{"link":"?PATH=/Person","label":"个人","content":"/Person"}];
},"type":2}};
BaseApplication.prototype=Object.create( Application.prototype , proto);
Internal.defineClass("BaseApplication.es",BaseApplication,{
	"extends":Application,
	"classname":"BaseApplication",
	"uri":["H5","n2","O4"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class view/Person.es *****/

"view/Person.es": function(module,require){
var Person=function Person(){
constructor.apply(this,arguments);
};
module.exports=Person;
var View=require("es/core/View.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var PersonApplication=require("PersonApplication.es");
var DataGrid=require("es/components/DataGrid.es");
var DataGridSkin=require("es/skins/DataGridSkin.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var DataSource=require("system/DataSource.es");
var Http=require("system/Http.es");
var Array=require("system/Array.es");
var Object=require("system/Object.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, PersonApplication))throw new TypeError("type does not match. must be PersonApplication","view.Person",16);
	this[__PRIVATE__]._hostComponent=hostComponent;
	View.call(this,hostComponent);
};
var __PRIVATE__=Symbol("view.Person").valueOf();
var method={};
var proto={"constructor":{"value":Person},"H66__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var __var160__=this.L15_createElement(0,2,"input");
	var __var166__=Reflect.type((this.L15_createComponent(0,6,DataGrid)),DataGrid);
	this.watch("title",__var160__,"value");
	__var166__.getDataSource().dataType(Http.TYPE_JSONP);
	__var166__.setColumns({"id":"ID","name":"名称","phone":"电话"});
	__var166__.setSource(new Array(new Object({"id":"ID","name":"名称","phone":"电话"}),new Object({"id":"uuuu","name":"yyyyy","phone":"kkkkk"})));
	__var166__.setSkinClass(DataGridSkin);
	return [__var160__,this.L15_createElement(0,3,"div",[this.L15_createElement(0,4,"h1","the is "+dataset.message),this.L15_createElement(0,5,"h1","这里是内容 Person"),__var166__])];
},"type":1}
,"getTitle":{"value":function title(){
	return Reflect.type(this.assign("title"),String);
},"type":2},"setTitle":{"value":function title(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","view.Person",38);
	this.assign("title",value);
	document.title=value;
},"type":4}};
Person.prototype=Object.create( View.prototype , proto);
Internal.defineClass("view/Person.es",Person,{
	"extends":View,
	"package":"view",
	"classname":"Person",
	"uri":["H66","L15","t43"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

}};
    }
}("8cf411d6e04e6ccb","PersonApplication.es"));