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
