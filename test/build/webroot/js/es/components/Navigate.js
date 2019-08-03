var Navigate=function Navigate(){
constructor.apply(this,arguments);
};
module.exports=Navigate;
var SkinComponent=require("es/components/SkinComponent.es");
var NavigateEvent=require("es/events/NavigateEvent.es");
var Skin=require("es/core/Skin.es");
var Display=require("es/core/Display.es");
var IContainer=require("es/interfaces/IContainer.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var ApplicationEvent=require("es/events/ApplicationEvent.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var DataSource=require("system/DataSource.es");
var Element=require("system/Element.es");
var Reflect=require("system/Reflect.es");
var Locator=require("system/Locator.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Function=require("system/Function.es");
var Object=require("system/Object.es");
var Array=require("system/Array.es");
var DataSourceEvent=require("system/DataSourceEvent.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{"_dataSource":null,"_dataProfile":'datalist',"_radius":5,"_rowHeight":25,"_current":null,"_target":true,"_transition":null,"frameHash":{},"_viewport":null}});

	if(componentId === undefined ){componentId="10";}
	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.components.Navigate",22);
	SkinComponent.call(this,componentId);
};
var __PRIVATE__=Symbol("es.components.Navigate").valueOf();
var method={"d44_loadContentMap":{"writable":true,"value":{},"type":8}
};
for(var prop in method){
	Object.defineProperty(Navigate, prop, method[prop]);
}
var proto={"constructor":{"value":Navigate},"d44__dataSource":{"writable":true,"value":null,"type":8}
,"getDataSource":{"value":function dataSource(){
	var dataSource=this[__PRIVATE__]._dataSource;
	if(dataSource===null){
		dataSource=new DataSource();
		this[__PRIVATE__]._dataSource=dataSource;
	}
	return dataSource;
},"type":2},"setDataSource":{"value":function dataSource(value){
	if(!System.is(value, DataSource))throw new TypeError("type does not match. must be DataSource","es.components.Navigate",47);
	this[__PRIVATE__]._dataSource=value;
},"type":4},"getSource":{"value":function source(){
	return this.getDataSource().source();
},"type":2},"setSource":{"value":function source(data){
	this.getDataSource().source(data);
},"type":4},"d44__dataProfile":{"writable":true,"value":'datalist',"type":8}
,"getDataProfile":{"value":function dataProfile(){
	return this[__PRIVATE__]._dataProfile;
},"type":2},"setDataProfile":{"value":function dataProfile(profile){
	if(!System.is(profile, String))throw new TypeError("type does not match. must be String","es.components.Navigate",82);
	this[__PRIVATE__]._dataProfile=profile;
},"type":4},"d44__radius":{"writable":true,"value":5,"type":8}
,"getRadius":{"value":function radius(){
	return this[__PRIVATE__]._radius;
},"type":2},"setRadius":{"value":function radius(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.Navigate",101);
	this[__PRIVATE__]._radius=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"d44__rowHeight":{"writable":true,"value":25,"type":8}
,"getRowHeight":{"value":function rowHeight(){
	return this[__PRIVATE__]._rowHeight;
},"type":2},"setRowHeight":{"value":function rowHeight(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.Navigate",125);
	this[__PRIVATE__]._rowHeight=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"d44__current":{"writable":true,"value":null,"type":8}
,"getCurrent":{"value":function current(){
	if(this[__PRIVATE__]._current===null){
		return System.environments("HTTP_ROUTE_PATH")||0;
	}
	return this[__PRIVATE__]._current;
},"type":2},"setCurrent":{"value":function current(value){
	if(this[__PRIVATE__]._current!=value){
		this[__PRIVATE__]._current=value;
		if(this.k30_getInitialized()){
			this.k30_commitPropertyAndUpdateSkin();
		}
	}
},"type":4},"d44__target":{"writable":true,"value":true,"type":8}
,"getTarget":{"value":function target(){
	return this[__PRIVATE__]._target;
},"type":2},"setTarget":{"value":function target(value){
	if(!System.is(value, Boolean))throw new TypeError("type does not match. must be Boolean","es.components.Navigate",184);
	this[__PRIVATE__]._target=value;
},"type":4},"d44__transition":{"writable":true,"value":null,"type":8}
,"getTransition":{"value":function transition(){
	return this[__PRIVATE__]._transition;
},"type":2},"setTransition":{"value":function transition(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.components.Navigate",207);
	this[__PRIVATE__]._transition=value;
},"type":4},"d44_frameHash":{"writable":true,"value":{},"type":8}
,"k30_createFrame":{"value":function createFrame(url){
	if(!System.is(url, String))throw new TypeError("type does not match. must be String","es.components.Navigate",222);
	var elem;
	if(System.typeOf(this[__PRIVATE__].frameHash[url])==="undefined"){
		elem=new Element("<iframe />");
		elem.property("src",url);
		elem.style("width","100%");
		this[__PRIVATE__].frameHash[url]=elem;
	}
	return this[__PRIVATE__].frameHash[url];
},"type":1}
,"k30_loadContent":{"value":function loadContent(content){
	var controller;
	var HTTP_DISPATCHER;
	var fn;
	var doc;
	var provider;
	var segment;
	var isUrl;
	var event=new NavigateEvent(NavigateEvent.LOAD_CONTENT_BEFORE);
	event.setViewport(this.getViewport());
	event.setContent(content);
	if(!this.dispatchEvent(event)||!(event.getViewport()&&event.getContent()))return false;
	var viewport=event.getViewport();
	var child=null;
	content=event.getContent();
	if(System.instanceOf(content, "class")){
		child=Reflect.type(new Reflect.type(content,"class")(this),IDisplay);
	}
	else if(System.isFunction(content)){
		child=Reflect.type(content(),IDisplay);
	}
	else if(System.isString(content)){
		content=System.trim(content);
		isUrl=/^https?/i.test(content);
		segment=Locator.create(content);
		provider=Locator.match(segment);
		if(isUrl&&!provider){
			return false;
		}
		if(provider){
			if(!Navigate.d44_loadContentMap[provider]){
				doc=new EventDispatcher(document);
				fn=function(e){
					if(!System.is(e, ApplicationEvent))throw new TypeError("type does not match. must be ApplicationEvent","es.components.Navigate",273);
					e.preventDefault();
					e.setContainer(viewport);
					doc.removeEventListener(ApplicationEvent.FETCH_ROOT_CONTAINER,fn);
				};
				doc.addEventListener(ApplicationEvent.FETCH_ROOT_CONTAINER,fn);
				Navigate.d44_loadContentMap[provider]=child;
				HTTP_DISPATCHER=Reflect.type(System.environments("HTTP_DISPATCHER"),Function);
				controller=provider.split("@");
				HTTP_DISPATCHER(controller[0],controller[1]);
				return true;
			}
			else {
				child=Reflect.type(Navigate.d44_loadContentMap[provider],IDisplay);
			}
		}
		else {
			child=new Display(new Element(Element.createElement(content)));
		}
	}
	viewport.setChildren([child]);
	return true;
},"type":1}
,"k30_initializing":{"value":function initializing(){
	SkinComponent.prototype.k30_initializing.call(this);
	var hostComponent=this;
	var dataProfile=this.getDataProfile();
	var container=this.getSkin();
	container.assign(dataProfile,[]);
	container.assign("openTarget",this.getTarget());
	container.assign("match",function(item,key){
		if(!System.is(item, Object))throw new TypeError("type does not match. must be Object","es.components.Navigate",312);
		var str;
		var matched=false;
		var current=hostComponent.getCurrent();
		if(System.typeOf(current)==="function"){
			matched=!!current(item,key);
		}
		else if(current==key||current===item.link||item["label"]===current){
			matched=true;
		}
		else if(current){
			str=Reflect.type(current,String);
			matched=(new RegExp(str.replace(/([\/\?\:\.])/g,'\\$1'))).test(Reflect.type(item.link,String));
		}
		;
		if(matched&&System.isDefined(item.content)){
			hostComponent.k30_loadContent(item.content);
		}
		return matched;
	});
	this.getDataSource().addEventListener(DataSourceEvent.SELECT,function(event){
		if(!System.is(event, DataSourceEvent))throw new TypeError("type does not match. must be DataSourceEvent","es.components.Navigate",329);
		if(!event.waiting){
			container.assign(dataProfile,event.data);
		}
	});
	this.getDataSource().select(1);
},"type":1}
,"d44__viewport":{"writable":true,"value":null,"type":8}
,"getViewport":{"value":function viewport(){
	return this[__PRIVATE__]._viewport;
},"type":2},"setViewport":{"value":function viewport(value){
	if(!System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.components.Navigate",348);
	if(this[__PRIVATE__]._viewport===null){
		this.addEventListener(NavigateEvent.URL_JUMP_BEFORE,function(e){
			if(!System.is(e, NavigateEvent))throw new TypeError("type does not match. must be NavigateEvent","es.components.Navigate",352);
			var provider;
			var segment;
			var isUrl;
			var content=e.getContent()||(e.getItem()&&e.getItem().link);
			if(System.typeOf(content)==="string"){
				isUrl=/^https?/i.test(Reflect.type(content,String));
				segment=Locator.create(Reflect.type(content,String));
				provider=Locator.match(segment);
				if(isUrl&&!provider){
					return ;
				}
			}
			if(e.getItem()&&e.getItem().content){
				e.preventDefault();
				Reflect.set(Navigate,this,"current",content);
			}
		},false,0,this);
	}
	this[__PRIVATE__]._viewport=value;
},"type":4}};
Navigate.prototype=Object.create( SkinComponent.prototype , proto);
Internal.defineClass("es/components/Navigate.es",Navigate,{
	"extends":SkinComponent,
	"package":"es.components",
	"classname":"Navigate",
	"uri":["d44","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
