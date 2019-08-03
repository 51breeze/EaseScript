var Pagination=function Pagination(){
constructor.apply(this,arguments);
};
module.exports=Pagination;
var SkinComponent=require("es/components/SkinComponent.es");
var Skin=require("es/core/Skin.es");
var PaginationEvent=require("es/events/PaginationEvent.es");
var Display=require("es/core/Display.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var DataSource=require("system/DataSource.es");
var DataSourceEvent=require("system/DataSourceEvent.es");
var Locator=require("system/Locator.es");
var Reflect=require("system/Reflect.es");
var MouseEvent=require("system/MouseEvent.es");
var ReferenceError=require("system/ReferenceError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{"_dataSource":null,"_profile":'page',"_url":'',"_pageSize":NaN,"_current":NaN,"_link":7,"_radius":0}});

	if(componentId === undefined ){componentId="13";}
	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.components.Pagination",40);
	SkinComponent.call(this,componentId);
};
var __PRIVATE__=Symbol("es.components.Pagination").valueOf();
var method={};
var proto={"constructor":{"value":Pagination},"K60__dataSource":{"writable":true,"value":null,"type":8}
,"getDataSource":{"value":function dataSource(){
	return this[__PRIVATE__]._dataSource;
},"type":2},"setDataSource":{"value":function dataSource(value){
	if(!System.is(value, DataSource))throw new TypeError("type does not match. must be DataSource","es.components.Pagination",54);
	var self;
	var old=this[__PRIVATE__]._dataSource;
	if(old!==value){
		this[__PRIVATE__]._dataSource=value;
		self=this;
		value.addEventListener(DataSourceEvent.SELECT,function(e){
			if(!System.is(e, DataSourceEvent))throw new TypeError("type does not match. must be DataSourceEvent","es.components.Pagination",61);
			if(!e.waiting&&self.k30_getInitialized()){
				self.k30_commitPropertyAndUpdateSkin();
			}
		});
		if(this.k30_getInitialized()){
			value.select(this.getCurrent());
		}
	}
},"type":4},"K60__profile":{"writable":true,"value":'page',"type":8}
,"getProfile":{"value":function profile(){
	return this[__PRIVATE__]._profile;
},"type":2},"setProfile":{"value":function profile(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.components.Pagination",102);
	var curr;
	if(this[__PRIVATE__]._profile!==value){
		this[__PRIVATE__]._profile=value;
		if(this.k30_getInitialized()){
			curr=parseInt(Locator.query(value,1));
			this.setCurrent(System.isNaN(curr)?1:curr);
		}
	}
},"type":4},"K60__url":{"writable":true,"value":'',"type":8}
,"getUrl":{"value":function url(){
	return this[__PRIVATE__]._url;
},"type":2},"setUrl":{"value":function url(value){
	if(this[__PRIVATE__]._url!==value){
		this[__PRIVATE__]._url=value;
		if(this.k30_getInitialized()){
			this.k30_commitPropertyAndUpdateSkin();
		}
	}
},"type":4},"getTotalPage":{"value":function totalPage(){
	var dataSource=this.getDataSource();
	if(dataSource){
		return dataSource.totalPage()||1;
	}
	return 1;
},"type":2},"getTotalSize":{"value":function totalSize(){
	var dataSource=this.getDataSource();
	if(dataSource){
		return dataSource.totalSize();
	}
	return NaN;
},"type":2},"K60__pageSize":{"writable":true,"value":NaN,"type":8}
,"getPageSize":{"value":function pageSize(){
	var dataSource=this.getDataSource();
	if(dataSource){
		return dataSource.pageSize();
	}
	return this[__PRIVATE__]._pageSize;
},"type":2},"setPageSize":{"value":function pageSize(num){
	if(!System.is(num, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",194);
	var dataSource;
	if(this[__PRIVATE__]._pageSize!==num){
		this[__PRIVATE__]._pageSize=num;
		dataSource=this.getDataSource();
		if(dataSource){
			dataSource.pageSize(num);
			if(this.k30_getInitialized()){
				dataSource.select(this.getCurrent());
			}
		}
	}
},"type":4},"K60__current":{"writable":true,"value":NaN,"type":8}
,"getCurrent":{"value":function current(){
	var curr;
	var dataSource=this.getDataSource();
	if(System.isNaN(this[__PRIVATE__]._current)){
		curr=parseInt(Locator.query(this[__PRIVATE__]._profile,1));
		this[__PRIVATE__]._current=System.isNaN(curr)?1:curr;
	}
	if(dataSource&&this.k30_getInitialized()){
		return this.getDataSource().current();
	}
	return this[__PRIVATE__]._current;
},"type":2},"setCurrent":{"value":function current(num){
	if(!System.is(num, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",239);
	var dataSource;
	var linkUrl;
	var createUrl;
	var profile;
	var event;
	num=Reflect.type(System.isNaN(this.getTotalSize())?num:Math.min(Math.max(1,num),this.getTotalPage()),Number);
	var current=this.getCurrent();
	if(num!==current){
		this[__PRIVATE__]._current=num;
		event=new PaginationEvent(PaginationEvent.CHANGE);
		event.setOldValue(current);
		event.setNewValue(num);
		profile=this.getProfile();
		createUrl=this.getUrl();
		if(System.typeOf(createUrl)!=="function"){
			linkUrl=this.getUrl();
			event.setUrl(Reflect.type((Reflect.get(Pagination,linkUrl,"length")>0?(Reflect.call(Pagination,linkUrl,"indexOf",['?'])>=0?linkUrl+'&'+profile+'='+num:linkUrl+'?'+profile+'='+num):('?'+this.getProfile()+'='+num)),String));
		}
		else {
			event.setUrl(Reflect.type(createUrl(num,profile),String));
		}
		if(this.dispatchEvent(event)){
			if(this.getAsync()){
				dataSource=this.getDataSource();
				if(dataSource)dataSource.select(num);
			}
		}
	}
},"type":4},"K60__link":{"writable":true,"value":7,"type":8}
,"getLink":{"value":function link(){
	return this[__PRIVATE__]._link;
},"type":2},"setLink":{"value":function link(num){
	if(!System.is(num, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",288);
	if(this[__PRIVATE__]._link!==num){
		this[__PRIVATE__]._link=num;
		if(this.k30_getInitialized()){
			this.k30_commitPropertyAndUpdateSkin();
		}
	}
},"type":4},"getWheelTarget":{"value":function wheelTarget(){
	return Reflect.type(this.k30_pull("wheelTarget"),Display);
},"type":2},"setWheelTarget":{"value":function wheelTarget(value){
	if(!System.is(value, Display))throw new TypeError("type does not match. must be Display","es.components.Pagination",315);
	var self;
	var old=Reflect.type(this.k30_pull("wheelTarget"),Display);
	if(old!==value&&value){
		this.k30_push("wheelTarget",value);
		if(old){
			old.removeEventListener(MouseEvent.MOUSE_WHEEL);
		}
		self=this;
		value.addEventListener(MouseEvent.MOUSE_WHEEL,function(e){
			if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","es.components.Pagination",327);
			var page;
			e.preventDefault();
			if(self.getAsync()){
				page=self.getCurrent();
				page=Reflect.type(e.wheelDelta>0?page+1:page-1,Number);
				self.setCurrent(page);
			}
		},false,0,this);
	}
},"type":4},"K60__radius":{"writable":true,"value":0,"type":8}
,"getRadius":{"value":function radius(){
	return this[__PRIVATE__]._radius;
},"type":2},"setRadius":{"value":function radius(val){
	if(!System.is(val, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",340);
	if(this[__PRIVATE__]._radius!==val){
		this[__PRIVATE__]._radius=val;
		if(this.k30_getInitialized()){
			this.k30_commitPropertyAndUpdateSkin();
		}
	}
},"type":4},"k30_initializing":{"value":function initializing(){
	var size;
	var dataSource;
	SkinComponent.prototype.k30_initializing.call(this);
	if(this.isNeedCreateSkin()){
		dataSource=this[__PRIVATE__]._dataSource;
		if(!dataSource)throw new ReferenceError('dataSource is not defined',"es.components.Pagination","365:86");
		size=this.getPageSize();
		if(!System.isNaN(size))dataSource.pageSize(size);
		dataSource.select(this.getCurrent());
	}
},"type":1}
,"k30_commitPropertyAndUpdateSkin":{"value":function commitPropertyAndUpdateSkin(){
	var linkUrl;
	if(!this.k30_getInitialized())return ;
	var skin=this.getSkin();
	var current=this.getCurrent();
	var totalPage=this.getTotalPage();
	var pageSize=this.getPageSize();
	var link=this.getLink();
	var url=this.getUrl();
	var offset=Math.max(current-Math.ceil(link/2),0);
	if(System.typeOf(url)!=="function"){
		linkUrl=url;
		url=Reflect.get(Pagination,linkUrl,"length")>0?function(page,profile){
			if(!System.is(page, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",388);
			if(!System.is(profile, String))throw new TypeError("type does not match. must be String","es.components.Pagination",388);
			return Reflect.call(Pagination,linkUrl,"indexOf",['?'])>=0?linkUrl+'&'+profile+'='+page:linkUrl+'?'+profile+'='+page;
		}:function(page,profile){
			if(!System.is(page, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",390);
			if(!System.is(profile, String))throw new TypeError("type does not match. must be String","es.components.Pagination",390);
			return '?'+profile+'='+page;
		};
	}
	offset=(offset+link)>totalPage?offset-(offset+link-totalPage):offset;
	skin.assign('totalPage',totalPage);
	skin.assign('pageSize',pageSize);
	skin.assign('offset',(current-1)*pageSize);
	skin.assign('profile',this.getProfile());
	skin.assign('url',url);
	skin.assign('current',current);
	skin.assign('first',1);
	skin.assign('prev',Math.max(current-1,1));
	skin.assign('next',Math.min(current+1,totalPage));
	skin.assign('last',totalPage);
	skin.assign('link',System.range(Math.max(1+offset,1),link+offset,1));
	SkinComponent.prototype.k30_commitPropertyAndUpdateSkin.call(this);
},"type":1}
};
Pagination.prototype=Object.create( SkinComponent.prototype , proto);
Internal.defineClass("es/components/Pagination.es",Pagination,{
	"extends":SkinComponent,
	"package":"es.components",
	"classname":"Pagination",
	"uri":["K60","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
