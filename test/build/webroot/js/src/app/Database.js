var Database=function Database(){
constructor.apply(this,arguments);
};
module.exports=Database;
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function(){
Object.defineProperty(this,__PRIVATE__,{value:{}});
};
var __PRIVATE__=Symbol("app.Database").valueOf();
var method={};
var proto={"constructor":{"value":Database}};
Database.prototype=Object.create( Object.prototype , proto);
Internal.defineClass("app/Database.es",Database,{
	"package":"app",
	"classname":"Database",
	"uri":["p39","Q40","S41"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
