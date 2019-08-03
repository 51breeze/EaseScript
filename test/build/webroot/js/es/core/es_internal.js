var es_internal=function es_internal(prefix,uri){
Namespace.call(this,prefix,uri);
};
module.exports=es_internal;
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var Namespace=require("system/Namespace.es");
Object.defineProperty(es_internal, "valueOf", {value:function valueOf(){
return "es.core/public:es_internal";
}});
Internal.defineClass("es/core/es_internal.es",es_internal,{
	"ns":"s3",
	"package":"es.core",
	"classname":"es_internal"
},3);
