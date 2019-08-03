(function(id,filename,undefined)
{
    "use strict";
    var Load = (window[id] || (window[id]={Load:{}})).Load;
    Load[filename]=function(){
        return {

/***** Class IndexApplication.es *****/

"IndexApplication.es": function(module,require){
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

/***** Class app/Database.es *****/

"app/Database.es": function(module,require){
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

},

/***** Class view/Viewport.es *****/

"view/Viewport.es": function(module,require){
var Viewport=function Viewport(){
constructor.apply(this,arguments);
};
module.exports=Viewport;
var View=require("es/core/View.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var IndexApplication=require("IndexApplication.es");
var Navigate=require("es/components/Navigate.es");
var Container=require("es/core/Container.es");
var NavigateSkin=require("es/skins/NavigateSkin.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var Array=require("system/Array.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"navigate":null,"content":null,"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, IndexApplication))throw new TypeError("type does not match. must be IndexApplication","view.Viewport",18);
	this[__PRIVATE__]._hostComponent=hostComponent;
	View.call(this,hostComponent);
	var attrs={"__var65__":{"class":"content"},"__var66__":{"uu":"sss"}};
	this[__PRIVATE__].properties=attrs;
	var navigate=Reflect.type((this.L15_createComponent(0,6,Navigate)),Navigate);
	this.setNavigate(navigate);
	var content=Reflect.type((this.L15_createComponent(0,7,Container,"div",null,attrs.__var65__)),Container);
	this.setContent(content);
	this.attributes(this.getElement(),attrs.__var66__);
};
var __PRIVATE__=Symbol("view.Viewport").valueOf();
var method={};
var proto={"constructor":{"value":Viewport},"C42_properties":{"writable":true,"value":{},"type":8}
,"getNavigate":{"value":function(){
	return this[__PRIVATE__].navigate;
},"type":2},"setNavigate":{"value":function(val){
	return this[__PRIVATE__].navigate=val;
},"type":2},"getContent":{"value":function(){
	return this[__PRIVATE__].content;
},"type":2},"setContent":{"value":function(val){
	return this[__PRIVATE__].content=val;
},"type":2},"C42__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var attrs=this[__PRIVATE__].properties;
	var navigate=this.getNavigate();
	var content=this.getContent();
	navigate.setSource(this.L15_getHostComponent().getMenus());
	navigate.setWidth(120);
	navigate.setViewport(content);
	navigate.setCurrent("0");
	navigate.setSkinClass(NavigateSkin);
	return [navigate,content];
},"type":1}
};
Viewport.prototype=Object.create( View.prototype , proto);
Internal.defineClass("view/Viewport.es",Viewport,{
	"extends":View,
	"package":"view",
	"classname":"Viewport",
	"uri":["C42","L15","t43"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class view/Home.es *****/

"view/Home.es": function(module,require){
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

},

/***** Class view/Index.es *****/

"view/Index.es": function(module,require){
var Index=function Index(){
constructor.apply(this,arguments);
};
module.exports=Index;
var View=require("es/core/View.es");
var Display=require("es/core/Display.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var State=require("es/core/State.es");
var IndexApplication=require("IndexApplication.es");
var Container=require("es/core/Container.es");
var Array=require("system/Array.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var Object=require("system/Object.es");
var MouseEvent=require("system/MouseEvent.es");
var Element=require("system/Element.es");
var Event=require("system/Event.es");
var console=require("system/Console.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"button":null,"head":[],"table":null,"_hostComponent":undefined,"_change":"ssss","_address":"ssaddressss","statName":"ssssss"}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, IndexApplication))throw new TypeError("type does not match. must be IndexApplication","view.Index",20);
	this[__PRIVATE__]._hostComponent=hostComponent;
	View.call(this,hostComponent);
	var __var43__=new State();
	__var43__.setName("tips");
	__var43__.setStateGroup(["simple"]);
	var __var44__=new State();
	__var44__.setName("title");
	__var44__.setStateGroup(["simple"]);
	var __var45__=new State();
	__var45__.setName("alert");
	__var45__.setStateGroup(["normal"]);
	var __var46__=new State();
	__var46__.setName("confirm");
	__var46__.setStateGroup(["normal"]);
	var __var47__=new State();
	__var47__.setName("modality");
	__var47__.setStateGroup(["normal"]);
	this.setStates([__var43__,__var44__,__var45__,__var46__,__var47__]);
	this.setCurrentState("normal");
	this.setTitle("yejun 5555");
	var attrs={"__var8__":{"type":"button","class":"btn btn-success","style":"width: 100px;"},"__var13__":{"ooo":"ssss"},"__var18__":{"style":"height: 25px;"},"__var22__":{"style":"color:red;"},"__var27__":{"class":"uuuu","style":"margin: 10px;"},"__var29__":{"class":"popup-title"},"__var31__":{"type":"button","class":"close"},"__var33__":{"class":"popup-head"},"__var35__":{"class":"popup-body"},"__var37__":{"type":"button"},"__var40__":{"class":"popup-footer"},"__var42__":{"class":"popup-container fixed"}};
	this[__PRIVATE__].properties=attrs;
	var button=Reflect.type((this.L15_createComponent(0,7,Container,"button",null,attrs.__var8__)),Container);
	this.setButton(button);
	var table=this.L15_createElement(0,14,"table");
	this.setTable(table);
	this.watch("change",this,"uu");
};
var __PRIVATE__=Symbol("view.Index").valueOf();
var method={"t43_count":{"writable":true,"value":0,"type":8}
};
for(var prop in method){
	Object.defineProperty(Index, prop, method[prop]);
}
var proto={"constructor":{"value":Index},"C64_properties":{"writable":true,"value":{},"type":8}
,"getButton":{"value":function(){
	return this[__PRIVATE__].button;
},"type":2},"setButton":{"value":function(val){
	return this[__PRIVATE__].button=val;
},"type":2},"getHead":{"value":function(){
	return this[__PRIVATE__].head;
},"type":2},"setHead":{"value":function(val){
	return this[__PRIVATE__].head=val;
},"type":2},"getTable":{"value":function(){
	return this[__PRIVATE__].table;
},"type":2},"setTable":{"value":function(val){
	return this[__PRIVATE__].table=val;
},"type":2},"C64__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var stateGroup=this.L15_getCurrentStateGroup();
	if(!stateGroup){
		throw new TypeError("State group is not defined for 'stateGroup'","view.Index","53:66");
	}
	var name=dataset.name,
	change=dataset.change,
	datalist=dataset.datalist,
	rowHeight=dataset.rowHeight,
	statname=dataset.statname;
	var attrs=this[__PRIVATE__].properties;
	var button=this.getButton();
	var __var14__=this.L15_createElement(0,11,"input");
	var __head__=this.getHead();
	__head__.splice(0,__head__.length);
	var __FOR0__=0;
	var table=this.getTable();
	this.attributes(button.getElement(),{"value":this.getChange()});
	this.L15_bindEvent(0,7,button,{"onClick":stateGroup.includeIn("normal")?this.goto:null});
	this.L15_updateChildren(button,[this.L15_createElement(0,8,"span","点 我 "+name),stateGroup.includeIn("alert")?this.L15_createElement(0,9,"span","==="):null]);
	this.watch("change",__var14__,"value");
	var __var24__=[];
	Object.forEach(datalist,function(item,key){
		var __var20__=[];
		Object.forEach(item,function(val,ukey){
			switch(ukey){
				case "name":__var20__.push(this.L15_createElement(__FOR0__,16,"td",[this.L15_createElement(__FOR0__,17,"input",null,attrs.__var18__,{"value":val,"data-index":Reflect.get(Index,item,"id")})],null,{"data-column":key,"style":"height:"+rowHeight+"px;line-height:"+rowHeight+"px;"}));
				break ;
				default :__var20__.push(this.L15_createElement(__FOR0__,18,"td",[this.L15_createElement(__FOR0__,19,"span",val,attrs.__var22__)],null,{"data-column":ukey,"style":"height:"+rowHeight+"px;line-height:"+rowHeight+"px; width: 120px;"}));
			}
			__FOR0__++;
		},this);
		var head=this.L15_createElement(__FOR0__,15,"tr");
		this.L15_updateChildren(head,__var20__);
		__var24__.push(head);
		__head__.push(head);
		__FOR0__++;
	},this);
	this.L15_updateChildren(table,__var24__);
	return [this.L15_createElement(0,6,"div",[button],null,null,{"onClick":stateGroup.includeIn("normal")?this.goto:stateGroup.includeIn("tips")?this.C64_gototips:null}),!stateGroup.includeIn("normal")?this.L15_createElement(0,10,"div","dsfdsfdsfsdf",attrs.__var13__,{"class":stateGroup.includeIn("tips")?"navigate":"","data-api":name}):null,__var14__,this.L15_createElement(0,12,"br"),this.L15_createElement(0,13,"input",null,null,{"value":change}),table,this.L15_createElement(0,20,"div",[this.L15_createElement(0,21,"h1","这里是\\\"内容\\\"9999999999=9999")],attrs.__var27__),this.L15_createElement(0,22,"div",[!stateGroup.includeIn("tips")?this.L15_createElement(0,23,"div",[this.L15_createElement(0,24,"span","title",attrs.__var29__),this.L15_createElement(0,25,"button","×",attrs.__var31__)],attrs.__var33__):null,this.L15_createElement(0,26,"div","popup-body",attrs.__var35__),!stateGroup.includeIn("simple")?this.L15_createElement(0,27,"div",[!stateGroup.includeIn("alert")?this.L15_createElement(0,28,"button","取 消",attrs.__var37__,{"class":stateGroup.includeIn("modality")?statname:"btn btn-sm btn-default"}):null,this.L15_createElement(0,29,"button","确 定",attrs.__var37__,{"class":stateGroup.includeIn("modality")?"btn btn-default":"btn btn-sm btn-primary"})],attrs.__var40__):null],attrs.__var42__,{"addClass":stateGroup.includeIn("modality")?"popup-lg":""})];
},"type":1}
,"L15_updateDisplayList":{"value":function updateDisplayList(){
	if(!this.getButton()){
		return ;
	}
	var self=this;
	this.getButton().removeEventListener(MouseEvent.CLICK);
	this.getButton().addEventListener(MouseEvent.CLICK,function(e){
		if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","view.Index",110);
		var i;
		Reflect.incre(Index,Index,"count");
		this.addChildAt(new Display(new Element("<div>==== the add child "+Index.t43_count+"====</div>")),2);
		var datalist=[];
		var len=Reflect.type(Math.abs(Math.random()*100),Number);
		len=100;
		for(i=0;i<len;i++){
			datalist.push({"name":i,"id":i,"address":Math.abs(Math.random()*100000)});
		}
		this.assign("datalist",datalist);
		if(this.getCurrentState()==="tips"){
			this.setCurrentState("modality");
		}
		else {
			this.setCurrentState("tips");
		}
		self.setChange(this.getCurrentState());
	},false,0,this);
},"type":1}
,"goto":{"value":function goto(e){
	if(!System.is(e, Event))throw new TypeError("type does not match. must be Event","view.Index",142);
	console.log("===goto====",this);
},"type":1}
,"C64_gototips":{"value":function gototips(e){
	if(!System.is(e, Event))throw new TypeError("type does not match. must be Event","view.Index",149);
},"type":1}
,"getChange":{"value":function(){
	return this[__PRIVATE__]._change;
},"type":2},"setChange":{"value":function(val){
	var old = this[__PRIVATE__]._change;
	if(old!==val){
		this[__PRIVATE__]._change=val;
		var event = new PropertyEvent(PropertyEvent.CHANGE);
		event.property = "change";
		event.oldValue = old;
		event.newValue = val;
		this.dispatchEvent(event);
	}
},"type":4},"getAddress":{"value":function(){
	return this[__PRIVATE__]._address;
},"type":2},"setAddress":{"value":function(val){
	var old = this[__PRIVATE__]._address;
	if(old!==val){
		this[__PRIVATE__]._address=val;
		var event = new PropertyEvent(PropertyEvent.CHANGE);
		event.property = "address";
		event.oldValue = old;
		event.newValue = val;
		this.dispatchEvent(event);
	}
},"type":4},"getStatName":{"value":function(){
	return this[__PRIVATE__].statName;
},"type":2},"setStatName":{"value":function(val){
	return this[__PRIVATE__].statName=val;
},"type":2}};
Index.prototype=Object.create( View.prototype , proto);
Internal.defineClass("view/Index.es",Index,{
	"extends":View,
	"package":"view",
	"classname":"Index",
	"uri":["C64","L15","t43"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

}};
    }
}("8cf411d6e04e6ccb","IndexApplication.es"));