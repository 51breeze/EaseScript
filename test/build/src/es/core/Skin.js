define(["es.core.Skin","es.core.Container","es.core.Display","ns:es.core.es_internal","es.components.Component","es.events.SkinEvent","es.core.State","if:es.interfaces.IDisplay"],function(Skin,Container,Display,es_internal,Component,SkinEvent,State,IDisplay){
var _private=this._private;
var method={"W7_parseSkinObject":{"value":function parseSkinObject(skin,hash){
	if(skin == null ){skin={};}
	if(hash == null ){hash={};}
	var v;
	var p;
	var tag=skin.name||'div';
	var children=Reflect.type(skin.children,Array);
	var content='';
	var len=children.length;
	var i=0;
	for(;i<len;i++){
		content+=System.typeOf(children[i])==="string"?children[i]:Skin.W7_parseSkinObject(children[i],hash);
	}
	if(tag==='text')return content;
	var str='<'+tag;
	var attr=Reflect.type((skin.attr||{}),JSON);
	for(var __$0__ = Iterator(attr);__$0__.seek() && (p=__$0__.key)!==false;){
		v=attr[p];
		v=p==='id'&&hash.hasOwnProperty(v)?hash[v]:v;
		str+=" "+p+'="'+v+'"';
	}
	str+='>'+content+'</'+tag+'>';
	return str;
}}
};
for(var prop in method){
	Object.defineProperty(Skin, prop, method[prop]);
}
var proto={"constructor":{"value":Skin},"N6__hash":{"writable":true,"value":null}
,"N6__skinChildren":{"writable":true,"value":null}
,"N6__name":{"writable":true,"value":null}
,"N6__attr":{"writable":true,"value":null}
,"Get_W7_skinChildren":{"value":function skinChildren(){
	return Reflect.type(this[_private]._skinChildren,Array);
}},"Get__name":{"value":function name(){
	return this[_private]._name;
}},"Set__name":{"value":function name(value){
	if( value && !System.is(value, String))throw new TypeError("type does not match. must be String");
	this[_private]._name=value;
}},"Get__attr":{"value":function attr(){
	return this[_private]._attr;
}},"Set__attr":{"value":function attr(value){
	Object.merge(this[_private]._attr,value);
	this._property(value);
}},"_getChildById":{"value":function getChildById(id){
	if(this[_private]._hash.hasOwnProperty(id)){
		return Reflect.get(Skin,this[_private]._hash,id);
	}
	return null;
}}
,"N6_stateGroup":{"writable":true,"value":{}}
,"Set__states":{"value":function states(value){
	if( value && !System.is(value, Array))throw new TypeError("type does not match. must be Array");
	var name;
	var stateObj;
	var len=value.length;
	var i=0;
	var stateGroup=this[_private].stateGroup;
	for(;i<len;i++){
		stateObj=Reflect.type(value[i],State);
		name=stateObj.Get__name();
		if(!name)throw new TypeError('name is not define in Skin.prototype.states',"E:/EaseScript/es/core/Skin.es","122:92");
		if(stateGroup.hasOwnProperty(name)){
			throw new TypeError('"'+name+'" has already been declared in Skin.prototype.states',"E:/EaseScript/es/core/Skin.es","125:103");
		}
		stateGroup[name]=stateObj;
	}
}},"N6__currentState":{"writable":true,"value":null}
,"Get__currentState":{"value":function currentState(){
	return this[_private]._currentState;
}},"Set__currentState":{"value":function currentState(name){
	if( name && !System.is(name, String))throw new TypeError("type does not match. must be String");
	var current=this[_private]._currentState;
	if(current!==name){
		this[_private]._currentState=name;
		this.W7_updateDisplayList();
	}
}},"N6__layout":{"writable":true,"value":null}
,"Get__layout":{"value":function layout(){
	return this[_private]._layout;
}},"Set__layout":{"value":function layout(layoutObject){
	var current=this[_private]._layout;
	if(current!==layoutObject){
		this[_private]._layout=layoutObject;
	}
}},"W7_initializing":{"value":function initializing(){
}}
,"N6__hostComponent":{"writable":true,"value":null}
,"Set_J3_hostComponent":{"value":function hostComponent(host){
	if( host && !System.is(host, Component))throw new TypeError("type does not match. must be Component");
	if(host==null)throw new ReferenceError("hostComponent is null","E:/EaseScript/es/core/Skin.es","202:78");
	this[_private]._hostComponent=host;
	this.W7_initializing();
}},"Get_W7_hostComponent":{"value":function hostComponent(){
	return this[_private]._hostComponent;
}},"N6__render":{"writable":true,"value":null}
,"Get__render":{"value":function render(){
	var obj=this[_private]._render;
	if(!obj)obj=new Render();
	this[_private]._render=obj;
	return obj;
}},"Set__render":{"value":function render(value){
	if( value && !System.is(value, Render))throw new TypeError("type does not match. must be Render");
	this[_private]._render=value;
}},"Get__template":{"value":function template(){
	return this.Get__render().template(null);
}},"Set__template":{"value":function template(value){
	if( value && !System.is(value, String))throw new TypeError("type does not match. must be String");
	this.Get__render().template(value);
}},"_variable":{"value":function variable(name,value){
	return this.Get__render().variable(name,value);
}}
,"_skinInstaller":{"value":function skinInstaller(){
	this.W7_createChildren();
}}
,"W7_createChildren":{"value":function createChildren(){
	var e;
	var elem;
	var rd;
	var children=this.Get_W7_skinChildren();
	var hash=this[_private]._hash;
	var len=children.length;
	var c=0;
	var child;
	var render=this[_private]._render;
	var parent=this.Get_W7_displayParent();
	this._removeAllChild();
	if(render){
		child=render.fetch();
		if(child){
			this._addChildAt(new Display.constructor(new Element(Element.createElement(child))),-1);
		}
	}
	for(;c<len;c++){
		child=children[c];
		if(System.isObject(child)){
			child=Skin.W7_parseSkinObject(child,hash);
		}
		else if(System.instanceOf(child,Render)){
			rd=Reflect.type(child,Render);
			child=rd.fetch();
		}
		if(child){
			if(System.isString(child)){
				child=System.trim(child);
				elem=new Element(Element.createElement(child,true));
				this._addChildAt(new Display.constructor(elem),-1);
			}
			else if(System.instanceOf(child,Skin)){
				(child).W7_createChildren();
				this._addChild(Reflect.type(child,Display));
			}
		}
	}
	if(this.hasEventListener(SkinEvent._CREATE_CHILDREN_COMPLETED)){
		e=new SkinEvent.constructor(SkinEvent._CREATE_CHILDREN_COMPLETED);
		e.Set__parent(parent);
		e.Set__child(this);
		this.dispatchEvent(e);
	}
	this.W7_updateDisplayList();
}}
,"_toString":{"value":function toString(){
	this.W7_createChildren();
	return Container.prototype._toString.call(this);
}}
,"N6_getCurrentState":{"value":function getCurrentState(currentState){
	if( currentState && !System.is(currentState, String))throw new TypeError("type does not match. must be String");
	var state;
	var p;
	var stateGroup=this[_private].stateGroup;
	if(stateGroup.hasOwnProperty(currentState))return Reflect.type(stateGroup[currentState],State);
	for(var __$0__ = Iterator(stateGroup);__$0__.seek() && (p=__$0__.key)!==false;){
		state=Reflect.type(stateGroup[p],State);
		if(state._includeIn(currentState)){
			return state;
		}
	}
	return null;
}}
,"W7_updateDisplayList":{"value":function updateDisplayList(){
	var elems;
	var stateGroup;
	var currentState=this.Get__currentState();
	if(currentState){
		stateGroup=this.N6_getCurrentState(currentState);
		if(!stateGroup)throw new ReferenceError('"'+currentState+'"'+' is not define',"E:/EaseScript/es/core/Skin.es","373:95");
		elems=new Element('[includeIn],[excludeFrom]',this.Get__element());
		elems.forEach(function(){
			var includeIn=elems.property('includeIn');
			var excludeFrom=elems.property('excludeFrom');
			var _include=true;
			if(includeIn){
				_include=stateGroup._includeIn(includeIn);
			}
			if(excludeFrom){
				_include=!stateGroup._includeIn(excludeFrom);
			}
			_include?elems.show():elems.hide();
		});
	}
}}
};
Object.defineProperty(Skin,"constructor",{"value":function constructor(skinObject){
	Object.defineProperty(this,_private,{value:{"_hash":null,"_skinChildren":null,"_name":null,"_attr":null,"stateGroup":{},"_currentState":null,"_layout":null,"_hostComponent":null,"_render":null}});
	if(skinObject == null ){skinObject={};}
	var str;
	var h;
	var hash;
	var name;
	var attr;
	if(!(System.is(skinObject,Element))){
		attr=skinObject.attr||{};
		name=skinObject.name||'div';
		hash=skinObject.hash;
		if(hash){
			hash=hash;
			attr=Reflect.type(attr,JSON);
			for(var __$0__ = Iterator(hash);__$0__.seek() && (h=__$0__.key)!==false;){
				if(hash[h]==='@id'){
					hash[h]=System.uid();
					if(attr.id===h)attr.id=hash[h];
				}
			}
		}
		this[_private]._skinChildren=skinObject.children||new Array();
		this[_private]._hash=Reflect.type(skinObject.hash||{},Object);
		this[_private]._name=Reflect.type(name,String);
		this[_private]._attr=attr;
		str=System.serialize(attr,'attr');
		skinObject=new Element('<'+name+" "+str+'/>');
	}
	Container.constructor.call(this,skinObject);
}});
Skin.constructor.prototype=Object.create( Container.prototype , proto);
Object.defineProperty(Skin,"prototype",{value:Skin.constructor.prototype});
Object.defineProperty(Skin,"__T__",{value:{
	"extends":Container,
	"package":"es.core",
	"classname":"Skin",
	"_private":_private,
	"uri":["N6_","W7_","l21_","_"],
	"method":method,
	"proto":proto
}});
return Skin;
});
