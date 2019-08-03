var IndexApplication=function IndexApplication(){
constructor.apply(this,arguments);
};
module.exports=IndexApplication;
var BaseApplication=require("BaseApplication.es");
var Index=require("view/Index.es");
var Viewport=require("view/Viewport.es");
var es_internal=require("es/core/es_internal.es");
var IListIterator=require("es/interfaces/IListIterator.es");
var PopUp=require("es/core/PopUp.es");
var Display=require("es/core/Display.es");
var Container=require("es/core/Container.es");
var View=require("es/core/View.es");
var Home=require("view/Home.es");
var DataGrid=require("es/components/DataGrid.es");
var DataGridSkin=require("es/skins/DataGridSkin.es");
var Database=require("app/Database.es");
var console=require("system/Console.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Element=require("system/Element.es");
var DataSource=require("system/DataSource.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var EventDispatcher=require("system/EventDispatcher.es");
var MouseEvent=require("system/MouseEvent.es");
var Array=require("system/Array.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{"cursor":-1,"items":[{"key":"6666","value":"yejun"},{"key":"tttt","value":"最后"}]}});

	BaseApplication.call(this);
	this.assign("message","Hello word!");
	this.setTitle("Index page");
	new Database();
	console.log("===index==123");
};
var __PRIVATE__=Symbol("IndexApplication").valueOf();
var method={};
var proto={"constructor":{"value":IndexApplication},"I1_window":{"value":function window(container){
	if(!System.is(container, View))throw new TypeError("type does not match. must be View","IndexApplication",38);
	console.log(container);
	console.log(this,1,true,Viewport);
},"type":1}
,"viewport":{"value":function viewport(){
	var view=new Viewport(this);
	return this.n2_render(view);
},"type":1}
,"list":{"value":function list(){
	console.log(" ====enter list====");
	var view=new Viewport(this);
	return this.n2_render(view);
},"type":1}
,"home":{"value":function home(){
	var name,address;
	var object;
	var view=new Home(this);
	this.setTitle("the is home page");
	var container=new Container(new Element(Element.createElement("div")),{"innerHTML":"=======home========="});
	view.addChild(container);
	if(this){
		object={"names":"ppppp","address":"sssss"};
		name=object.name||"1232||ssss",
		address=object.address;
	}
	var grid=new DataGrid();
	grid.setSource("/match");
	grid.getDataSource().options({"responseProfile":function(response,name){
		if(!System.is(response, Object))throw new TypeError("type does not match. must be Object","IndexApplication",89);
		if(!System.is(name, String))throw new TypeError("type does not match. must be String","IndexApplication",89);
		switch(name){
			case "data":return response["data"];
			break ;
			case "total":return Reflect.get(IndexApplication,response["data"],'length');
			break ;
			case "status":return response["status"];
			break ;
			case "successCode":return 200;
			break ;
		}
	}});
	grid.setWidth(400);
	grid.setSkinClass(DataGridSkin);
	grid.setColumns({"id":"ID","title":"名称","content":"内容"});
	var gridSkin=Reflect.type(grid.getSkin(),DataGridSkin);
	gridSkin.getPagination().setWheelTarget(new Display(new Element(gridSkin.getFoot())));
	view.addChild(grid);
	(new EventDispatcher(view.getPopup())).addEventListener(MouseEvent.CLICK,function(e){
		if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","IndexApplication",116);
		PopUp.confirm("您有3条信息未处理2",function(type){
			if(!System.is(type, String))throw new TypeError("type does not match. must be String","IndexApplication",118);
			view.assign("uuuu",6666);
			view.assign("yy",555);
			view.assign("kk",666);
			view.assign("rr",444);
			view.assign("www",888);
			view.assign("qqq",999);
			view.setCurrentState("show");
		});
	});
	var iis=" the is template";
	var bb=99999;
	var tem='ssss ' + iis + ' ===== {' + bb + '} 66666=====33333 ';
	console.log(tem);
	console.log((new Date()).getTime());
	this.s3_test();
	var tt=PopUp;
	new tt('dfdsf');
	return this.n2_render(view);
},"type":1}
,"index":{"value":function index(){
	var i;
	console.log(" ====enter index====");
	this.setTitle("the is index page");
	var view=new Index(this);
	view.assign("address","<span style='color:red'>sssssss</span>");
	view.assign("rowHeight",40);
	view.assign("maxHeight",40);
	view.assign("title","Hello world!!");
	view.assign("name","Hello world!!");
	var datalist=[];
	var len=Reflect.type(Math.abs(Math.random()*100),Number);
	len=100;
	for(i=0;i<len;i++){
		datalist.push({"name":i,"id":i,"address":i});
	}
	view.assign("datalist",datalist);
	"/Person/list";
	"/getNews";
	return this.n2_render(view);
},"type":1}
,"add":{"value":function add(){
},"type":1}
,"s3_test":{"value":function test(){
	var n;
	console.log("<br/>");
	console.log(es_internal.valueOf());
	Object.forEach(this,function(val,key){
		if(!System.is(key, String))throw new TypeError("type does not match. must be String","IndexApplication",239);
		console.log("<br/>");
		console.log(val,key);
	});
	console.log("<br/>===================");
	var __0__;
		for(__0__=this,__0__.rewind();__0__.next();){
		n=__0__.key();
		console.log("<br/>");
		console.log(n,this.current());
	}
},"type":1}
,"I1_cursor":{"writable":true,"value":-1,"type":8}
,"I1_items":{"writable":true,"value":[{"key":"6666","value":"yejun"},{"key":"tttt","value":"最后"}],"type":8}
,"next":{"value":function next(){
	return this[__PRIVATE__].items.length>Reflect.incre(IndexApplication,this,"cursor",false);
},"type":1}
,"current":{"value":function current(){
	var item=this[__PRIVATE__].items[this[__PRIVATE__].cursor];
	return item.value;
},"type":1}
,"key":{"value":function key(){
	var item=this[__PRIVATE__].items[this[__PRIVATE__].cursor];
	return item.key;
},"type":1}
,"rewind":{"value":function rewind(){
	this[__PRIVATE__].cursor=-1;
},"type":1}
};
IndexApplication.prototype=Object.create( BaseApplication.prototype , proto);
Internal.defineClass("IndexApplication.es",IndexApplication,{
	"extends":BaseApplication,
	"classname":"IndexApplication",
	"implements":[IListIterator],
	"uri":["I1","n2","O4"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
