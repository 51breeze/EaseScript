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
