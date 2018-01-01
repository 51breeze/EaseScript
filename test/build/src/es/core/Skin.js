define(["es.core.Skin","es.core.Container","es.core.Display","ns:es.core.es_internal","es.components.Component","es.events.SkinEvent","es.core.State"],function(Skin,Container,Display,es_internal,Component,SkinEvent,State){
var _private=this._private;
var method={"q7_parseSkinObject":{"value":function parseSkinObject(skin,hash){
	if(System.typeOf(hash) === "undefined"){hash=null;}
	var v;
	var p;
	var child;
	var tag=Reflect.get(Skin,skin,"name")||'div';
	var children=Reflect.type(System.is(skin,Skin)?Reflect.get(Skin,skin,"skinChildren"):Reflect.get(Skin,skin,"children"),Array);
	var attr=Reflect.get(Skin,skin,"attr")||{};
	var content='';
	var len=children.length;
	var i=0;
	for(;i<len;i++){
		child=children[i];
		if(System.isObject(child,true)){
			content+=Skin.q7_parseSkinObject(child,hash);
		}
		else {
			content+=System.typeOf(child)==="string"?child:Skin.q7_parseSkinObject(child,Reflect.get(Skin,child,"hash"));
		}
	}
	if(tag==='text')return Reflect.type(content,String);
	var str='<'+tag;
	for(var __$0__ = Iterator(attr);__$0__.seek() && (p=__$0__.key)!==false;){
		v=Reflect.get(Skin,attr,p);
		v=p==='id'&&Reflect.call(Skin,hash,"hasOwnProperty",[v])?Reflect.get(Skin,hash,v):v;
		str+=" "+p+'="'+v+'"';
	}
	str+='>'+content+'</'+tag+'>';
	return str;
}}
};
for(var prop in method){
	Object.defineProperty(Skin, prop, method[prop]);
}
var proto={"constructor":{"value":Skin},"o6__hash":{"writable":true,"value":null}
,"o6__skinChildren":{"writable":true,"value":null}
,"o6__name":{"writable":true,"value":null}
,"o6__attr":{"writable":true,"value":null}
,"Get_q7_skinChildren":{"value":function skinChildren(){
	return Reflect.type(this[_private]._skinChildren,Array);
}},"Get__name":{"value":function name(){
	return this[_private]._name;
}},"Set__name":{"value":function name(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String");
	this[_private]._name=value;
}},"Get__attr":{"value":function attr(){
	return this[_private]._attr;
}},"Set__attr":{"value":function attr(value){
	Reflect.call(Skin,Object,"merge",[this[_private]._attr,value]);
	this._property(value);
}},"_getChildById":{"value":function getChildById(id){
	if(Reflect.call(Skin,Reflect.get(Skin,this,"_hash"),"hasOwnProperty",[id])){
		return Reflect.get(Skin,this[_private]._hash,id);
	}
	return null;
}}
,"o6_stateGroup":{"writable":true,"value":{}}
,"Set__states":{"value":function states(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array");
	var name;
	var stateObj;
	var len=value.length;
	var i=0;
	var stateGroup=this[_private].stateGroup;
	for(;i<len;i++){
		stateObj=value[i];
		name=stateObj.Get__name();
		if(!name)throw new TypeError('name is not define in Skin.prototype.states',"E:/EaseScript/es/core/Skin.es","120:92");
		if(Reflect.call(Skin,stateGroup,"hasOwnProperty",[name])){
			throw new TypeError('"'+name+'" has already been declared in Skin.prototype.states',"E:/EaseScript/es/core/Skin.es","123:103");
		}
		Reflect.set(Skin,stateGroup,name,value[i]);
	}
}},"o6__currentState":{"writable":true,"value":null}
,"Get__currentState":{"value":function currentState(){
	return Reflect.type(this[_private]._currentState,String);
}},"Set__currentState":{"value":function currentState(name){
	if(!System.is(name, String))throw new TypeError("type does not match. must be String");
	var current=this[_private]._currentState;
	if(current!==name){
		this[_private]._currentState=name;
		this.q7_updateDisplayList();
	}
}},"o6__layout":{"writable":true,"value":null}
,"Get__layout":{"value":function layout(){
	return this[_private]._layout;
}},"Set__layout":{"value":function layout(layoutObject){
	var current=this[_private]._layout;
	if(current!==layoutObject){
		this[_private]._layout=layoutObject;
	}
}},"q7_initializing":{"value":function initializing(){
}}
,"o6__hostComponent":{"writable":true,"value":null}
,"Set_Q3_hostComponent":{"value":function hostComponent(host){
	if(!System.is(host, Component))throw new TypeError("type does not match. must be Component");
	if(host==null)throw new ReferenceError("hostComponent is null","E:/EaseScript/es/core/Skin.es","200:78");
	this[_private]._hostComponent=host;
	this.q7_initializing();
}},"Get_q7_hostComponent":{"value":function hostComponent(){
	return this[_private]._hostComponent;
}},"o6__render":{"writable":true,"value":null}
,"Get__render":{"value":function render(){
	var obj=this[_private]._render;
	if(!obj)obj=new Render();this[_private]._render=obj;
	return obj;
}},"Set__render":{"value":function render(value){
	if(!System.is(value, Render))throw new TypeError("type does not match. must be Render");
	this[_private]._render=value;
}},"Get__template":{"value":function template(){
	return this.Get__render().template(null);
}},"Set__template":{"value":function template(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String");
	this.Get__render().template(value);
}},"_variable":{"value":function variable(name,value){
	return this.Get__render().variable(name,value);
}}
,"_skinInstaller":{"value":function skinInstaller(){
	this.q7_createChildren();
}}
,"q7_createChildren":{"value":function createChildren(){
	var e;
	var elem;
	var rd;
	var children=this.Get_q7_skinChildren();
	var hash=this[_private]._hash;
	var len=children.length;
	var c=0;
	var child;
	var render=this[_private]._render;
	var parent=this.Get_q7_displayParent();
	this._removeAllChild();
	if(render){
		child=Reflect.call(Skin,render,"fetch");
		if(child){
			this._addChildAt(new Display.constructor(new Element(Element.createElement(child))),-1);
		}
	}
	for(;c<len;c++){
		child=children[c];
		if(System.isObject(child,true)){
			child=Skin.q7_parseSkinObject(child,hash);
		}
		if(System.instanceOf(child,Render)){
			rd=child;
			child=rd.fetch();
		}
		if(child){
			if(System.isString(child)){
				child=System.trim(child);
				elem=new Element(Element.createElement(child,true));
				this._addChildAt(new Display.constructor(elem),-1);
			}
			else if(System.instanceOf(child,Skin)){
				(child).q7_createChildren();
				this._addChild(child);
			}
		}
	}
	if(this.hasEventListener(SkinEvent._CREATE_CHILDREN_COMPLETED)){
		e=new SkinEvent.constructor(SkinEvent._CREATE_CHILDREN_COMPLETED);
		Reflect.set(Skin,e,"parent",parent);
		Reflect.set(Skin,e,"child",this);
		this.dispatchEvent(e);
	}
	this.q7_updateDisplayList();
}}
,"_toString":{"value":function toString(){
	this.q7_createChildren();
	return Container.prototype._toString.call(this);
}}
,"o6_getCurrentState":{"value":function getCurrentState(currentState){
	if(!System.is(currentState, String))throw new TypeError("type does not match. must be String");
	var p;
	var stateGroup=this[_private].stateGroup;
	if(Reflect.call(Skin,stateGroup,"hasOwnProperty",[currentState]))return Reflect.get(Skin,stateGroup,currentState);
	for(var __$0__ = Iterator(stateGroup);__$0__.seek() && (p=__$0__.key)!==false;){
		if(Reflect.call(Skin,Reflect.get(Skin,stateGroup,p),"includeIn",[currentState])){
			return currentState;
		}
	}
	return null;
}}
,"q7_updateDisplayList":{"value":function updateDisplayList(){
	var isGroup;
	var stateGroup;
	var currentState=this.Get__currentState();
	if(currentState){
		stateGroup=this.o6_getCurrentState(currentState);
		if(!stateGroup)throw new ReferenceError('"'+currentState+'"'+' is not define',"E:/EaseScript/es/core/Skin.es","368:95");
		isGroup=System.typeOf(stateGroup)!=="string";
		Element('[includeIn],[excludeFrom]',this.Get__element()).forEach(function(){
			var excludeFrom;
			var includeIn=Reflect.call(Skin,this,"property",['includeIn']);
			var _include=isGroup?Reflect.call(Skin,stateGroup,"includeIn",[includeIn]):includeIn===currentState;
			if(_include){
				excludeFrom=Reflect.call(Skin,this,"property",['excludeFrom']);
				if(excludeFrom){
					_include=!(isGroup?Reflect.call(Skin,stateGroup,"includeIn",[excludeFrom]):excludeFrom===currentState);
				}
			}
			if(_include){
				Reflect.call(Skin,this,"show");
			}
			else {
				Reflect.call(Skin,this,"hide");
			}
		});
	}
}}
};
Object.defineProperty(Skin,"constructor",{"value":function constructor(skinObject){
	Object.defineProperty(this,_private,{value:{"_hash":null,"_skinChildren":null,"_name":null,"_attr":null,"stateGroup":{},"_currentState":null,"_layout":null,"_hostComponent":null,"_render":null}});
	var str;
	var h;
	var hash;
	var name;
	var attr;
	if(!(System.is(skinObject,Element))){
		skinObject=Reflect.type(skinObject||{},Object);
		attr=Reflect.get(Skin,skinObject,"attr")||{};
		name=Reflect.get(Skin,skinObject,"name")||'div';
		hash=Reflect.get(Skin,skinObject,"hash");
		if(hash){
			for(var __$0__ = Iterator(hash);__$0__.seek() && (h=__$0__.key)!==false;){
				if(Reflect.get(Skin,hash,h)==='@id'){
					Reflect.set(Skin,hash,h,System.uid());
					if(Reflect.get(Skin,attr,"id")===h)Reflect.set(Skin,attr,"id",Reflect.get(Skin,hash,h));
				}
			}
		}
		this[_private]._skinChildren=Reflect.get(Skin,skinObject,"children")||new Array();
		this[_private]._hash=Reflect.type(Reflect.get(Skin,skinObject,"hash")||{},Object);
		this[_private]._name=Reflect.type(name,String);
		this[_private]._attr=Reflect.type(attr,Object);
		str=System.serialize(attr,'attr');
		skinObject=new Element('<'+name+" "+str+'/>');
	}
	Container.constructor.call(this,skinObject);
}});
Skin.constructor.prototype=Object.create( Container.prototype , proto);
Object.defineProperty(Skin,"prototype",{value:Skin.constructor.prototype});
Object.defineProperty(Skin,"__T__",{value:{
	"ns":"_",
	"extends":Container,
	"package":"es.core",
	"classname":"Skin",
	"filename":"E:/EaseScript/es/core/Skin.es",
	"implements":[],
	"_private":_private,
	"uri":["o6_","q7_","D21_","_"],
	"method":method,
	"proto":proto
}});
return Skin;
});
