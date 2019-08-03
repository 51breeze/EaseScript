var Skin=function Skin(){
constructor.apply(this,arguments);
};
module.exports=Skin;
var SkinComponent=require("es/components/SkinComponent.es");
var Container=require("es/core/Container.es");
var SkinEvent=require("es/events/SkinEvent.es");
var State=require("es/core/State.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var IContainer=require("es/interfaces/IContainer.es");
var IBindable=require("es/interfaces/IBindable.es");
var es_internal=require("es/core/es_internal.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Object=require("system/Object.es");
var Element=require("system/Element.es");
var Reflect=require("system/Reflect.es");
var Array=require("system/Array.es");
var Bindable=require("system/Bindable.es");
var ReferenceError=require("system/ReferenceError.es");
var EventDispatcher=require("system/EventDispatcher.es");
var ElementEvent=require("system/ElementEvent.es");
var Function=require("system/Function.es");
var Dictionary=require("system/Dictionary.es");
var RangeError=require("system/RangeError.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(name,attr){
	Object.defineProperty(this,__PRIVATE__,{value:{"_bindable":null,"_currentStateGroup":null,"initialized":false,"invalidate":false,"bindEventMaps":{},"elementMaps":{},"timeoutId":null,"callback":null,"_dataset":{},"_installer":null,"_dictionary":null,"_children":[],"statesGroup":{},"_currentState":null}});

	if(attr === undefined ){attr=null;}
	if(attr!==null && !System.is(attr, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",27);
	var elem=null;
	if(System.typeOf(name)==="string"){
		elem=new Element(document.createElement(name));
	}
	else if(System.instanceOf(name, Element)){
		elem=Reflect.type(name,Element);
	}
	else if(Element.isNodeElement(name)){
		elem=new Element(name);
	}
	else if(System.is(name, IDisplay)){
		elem=Reflect.type(name,IDisplay).getElement();
	}
	Container.call(this,elem,attr);
};
var __PRIVATE__=Symbol("es.core.Skin").valueOf();
var method={};
var proto={"constructor":{"value":Skin},"L15_render":{"value":function render(){
	return this.getChildren().slice(0);
},"type":1}
,"m16__bindable":{"writable":true,"value":null,"type":8}
,"L15_getBindable":{"value":function bindable(){
	var value=this[__PRIVATE__]._bindable;
	if(!value){
		value=new Bindable(this,"*");
		this[__PRIVATE__]._bindable=value;
	}
	return value;
},"type":2},"m16__currentStateGroup":{"writable":true,"value":null,"type":8}
,"L15_getCurrentStateGroup":{"value":function getCurrentStateGroup(){
	var p;
	var currentState=this[__PRIVATE__]._currentState;
	if(!currentState){
		throw new ReferenceError('State is not define.',"es.core.Skin","92:64");
	}
	if(this[__PRIVATE__]._currentStateGroup){
		return this[__PRIVATE__]._currentStateGroup;
	}
	var state=null;
	var statesGroup=this[__PRIVATE__].statesGroup;
	if(statesGroup.hasOwnProperty(currentState)){
		state=Reflect.type(statesGroup[currentState],State);
		this[__PRIVATE__]._currentStateGroup=state;
		return state;
	}
	for(p in statesGroup){
		state=Reflect.type(statesGroup[p],State);
		if(state.includeIn(currentState)){
			this[__PRIVATE__]._currentStateGroup=state;
			return state;
		}
	}
	throw new ReferenceError('"'+currentState+'"'+' is not define',"es.core.Skin","117:81");
},"type":1}
,"L15_initializing":{"value":function initializing(){
},"type":1}
,"L15_updateDisplayList":{"value":function updateDisplayList(){
},"type":1}
,"L15_getInitialized":{"value":function(){
	return this[__PRIVATE__].initialized;
},"type":2},"L15_setInitialized":{"value":function(val){
	return this[__PRIVATE__].initialized=val;
},"type":2},"m16_invalidate":{"writable":true,"value":false,"type":8}
,"L15_createChildren":{"value":function createChildren(){
	var e;
	var nodes;
	if(this[__PRIVATE__].invalidate===false){
		if(this[__PRIVATE__].timeoutId){
			System.clearTimeout(Reflect.type(this[__PRIVATE__].timeoutId,Number));
			this[__PRIVATE__].timeoutId=null;
		}
		this[__PRIVATE__].invalidate=true;
		nodes=this.L15_render();
		this.L15_updateChildren(this,nodes);
		this.m16_updateInstallState();
		this.L15_updateDisplayList();
		if(this.hasEventListener(SkinEvent.UPDATE_DISPLAY_LIST)){
			e=new SkinEvent(SkinEvent.UPDATE_DISPLAY_LIST);
			e.setChildren(nodes);
			this.dispatchEvent(e);
		}
	}
},"type":1}
,"m16_bindEventMaps":{"writable":true,"value":{},"type":8}
,"L15_bindEvent":{"value":function bindEvent(index,uniqueKey,target,events){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be int","es.core.Skin",184);
	if(!System.is(target, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",184);
	if(!System.is(events, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",184);
	var p;
	var uukey=Reflect.type((index+""+uniqueKey),String);
	var data=this[__PRIVATE__].bindEventMaps[uukey];
	if(!data){
		data={"items":{},"origin":target};
		this[__PRIVATE__].bindEventMaps[uukey]=data;
		if(System.instanceOf(target, EventDispatcher)){
			data.eventTarget=target;
		}
		else {
			data.eventTarget=new EventDispatcher(target);
		}
	}
	for(p in events){
		if(Reflect.get(Skin,data.items,p)!==events[p]){
			if(Reflect.get(Skin,data.items,p)){
				Reflect.call(Skin,data.eventTarget,"removeEventListener",[p,Reflect.get(Skin,data.items,p)]);
			}
			if(events[p]){
				Reflect.set(Skin,data.items,p,events[p]);
				Reflect.call(Skin,data.eventTarget,"addEventListener",[p,events[p],false,0,this]);
			}
		}
	}
},"type":1}
,"m16_elementMaps":{"writable":true,"value":{},"type":8}
,"L15_createElement":{"value":function createElement(index,uniqueKey,name,children,attrs,update,events){
	if(events === undefined ){events=null;}
	if(update === undefined ){update=null;}
	if(attrs === undefined ){attrs=null;}
	if(children === undefined ){children=null;}
	if(!System.is(index, Number))throw new TypeError("type does not match. must be int","es.core.Skin",232);
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",232);
	if(attrs!==null && !System.is(attrs, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",232);
	if(update!==null && !System.is(update, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",232);
	if(events!==null && !System.is(events, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",232);
	var uukey=Reflect.type((uniqueKey+''+index),String);
	var obj=Reflect.type(this[__PRIVATE__].elementMaps[uukey],Node);
	if(!obj){
		obj=document.createElement(name);
		this[__PRIVATE__].elementMaps[uukey]=obj;
		if(attrs){
			this.attributes(obj,attrs);
		}
	}
	if(children){
		if(System.typeOf(children)==="object"){
			if(!(System.instanceOf(children, Array))){
				children=[children];
			}
			this.L15_updateChildren(obj,children);
		}
		else {
			obj.textContent=children+"";
		}
	}
	if(update){
		this.attributes(obj,update);
	}
	if(events){
		this.L15_bindEvent(index,uniqueKey,obj,events);
	}
	return obj;
},"type":1}
,"L15_createComponent":{"value":function createComponent(index,uniqueKey,classTarget,tagName,children,attrs,update,events){
	if(events === undefined ){events=null;}
	if(update === undefined ){update=null;}
	if(attrs === undefined ){attrs=null;}
	if(children === undefined ){children=null;}
	if(tagName === undefined ){tagName=null;}
	if(!System.is(index, Number))throw new TypeError("type does not match. must be int","es.core.Skin",282);
	if(!System.is(classTarget, "class"))throw new TypeError("type does not match. must be Class","es.core.Skin",282);
	if(tagName!==null && !System.is(tagName, String))throw new TypeError("type does not match. must be String","es.core.Skin",282);
	if(attrs!==null && !System.is(attrs, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",282);
	if(update!==null && !System.is(update, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",282);
	if(events!==null && !System.is(events, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",282);
	var uukey=Reflect.type((uniqueKey+''+index),String);
	var obj=Reflect.type(this[__PRIVATE__].elementMaps[uukey],IDisplay);
	if(!obj){
		if(tagName){
			obj=Reflect.type(new classTarget(new Element(Element.createElement(tagName))),IDisplay);
		}
		else {
			obj=Reflect.type(new classTarget(uukey),IDisplay);
		}
		this[__PRIVATE__].elementMaps[uukey]=obj;
		if(attrs){
			this.attributes(obj.getElement(),attrs);
		}
	}
	if(children){
		if(!(System.instanceOf(children, Array))){
			children=[System.typeOf(children)==="object"?children:children+""];
		}
		if(System.instanceOf(obj, SkinComponent)){
			Reflect.type(obj,SkinComponent).setChildren(children);
		}
		else {
			this.L15_updateChildren(obj,children);
		}
	}
	if(update){
		this.attributes(obj.getElement(),update);
	}
	if(events){
		this.L15_bindEvent(index,uniqueKey,obj,events);
	}
	return obj;
},"type":1}
,"L15_updateChildren":{"value":function updateChildren(parentNode,children,index,total){
	if(total === undefined ){total=NaN;}
	if(index === undefined ){index=0;}
	if(!System.is(parentNode, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",338);
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.Skin",338);
	if(!System.is(index, Number))throw new TypeError("type does not match. must be int","es.core.Skin",338);
	if(!System.is(total, Number))throw new TypeError("type does not match. must be int","es.core.Skin",338);
	var e;
	var childDisplay;
	var childItems;
	var owner;
	var elem;
	var isDisplay;
	var childItem;
	var oldNode;
	var newNode;
	if(!parentNode)return ;
	var parentDisplay=null;
	if(System.instanceOf(parentNode, SkinComponent)){
		Reflect.type(parentNode,SkinComponent).setChildren(children);
		return ;
	}
	else if(System.is(parentNode, IDisplay)){
		parentDisplay=Reflect.type(parentNode,IDisplay);
		parentNode=Reflect.type(parentNode,IDisplay).getElement().current();
	}
	var parent=Reflect.type(parentNode,Node);
	var totalNodes=parent.childNodes.length;
	var totalChilds=children.length;
	var len=System.isNaN(total)?Math.max(totalChilds,totalNodes):total;
	var i=index;
	var offset=0;
	while(i<len&&(i-index<totalChilds||i<totalNodes)){
		newNode=null;
		oldNode=Reflect.type(Reflect.get(Skin,parent.childNodes,i-offset),Node);
		childItem=children[i-index];
		isDisplay=System.is(childItem, IDisplay);
		if(isDisplay){
			elem=Reflect.type(childItem,IDisplay).display();
			owner=Reflect.type(childItem,IDisplay).getOwner();
			if(owner){
				this.m16_installer(Reflect.type(childItem,IDisplay),owner);
				offset++;
				i++;
				continue ;
			}
			else {
				newNode=Reflect.type(elem.current(),Node);
			}
		}
		else {
			if(System.typeOf(childItem)==="string"){
				if(Element.getNodeName(oldNode)==="text"){
					if(oldNode.textContent!==childItem){
						oldNode.textContent=Reflect.type(childItem,String);
					}
					i++;
					continue ;
				}
				else {
					newNode=Element.createElement("text");
					newNode.textContent=Reflect.type(childItem,String);
				}
			}
			else if(System.instanceOf(childItem, Array)){
				childItems=childItem;
				this.L15_updateChildren(parentNode,childItems,i,childItems.length+len);
				i+=childItems.length;
				len+=childItems.length;
				index+=childItems.length;
				i++;
				continue ;
			}
			else {
				newNode=Reflect.type(childItem,Node);
			}
		}
		if(newNode!==oldNode){
			if(newNode&&oldNode){
				parent.replaceChild(newNode,oldNode);
				this.m16_removeEvent(parent,oldNode);
			}
			else {
				if(oldNode){
					parent.removeChild(oldNode);
					this.m16_removeEvent(parent,oldNode);
					i++;
					continue ;
				}
				if(newNode){
					parent.appendChild(newNode);
				}
			}
			if(newNode&&isDisplay){
				childDisplay=Reflect.type(childItem,IDisplay);
				if(parentDisplay){
					childDisplay.s3_setParentDisplay(Reflect.type(parentDisplay,IContainer));
				}
				e=new ElementEvent(ElementEvent.ADD);
				e.parent=parentDisplay||parent;
				e.child=newNode;
				childDisplay.getElement().dispatchEvent(e);
			}
		}
		i++;
	}
},"type":1}
,"m16_removeEvent":{"value":function removeEvent(parentNode,childNode){
	if(!System.is(parentNode, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",465);
	if(!System.is(childNode, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",465);
	var e=new ElementEvent(ElementEvent.REMOVE);
	e.parent=parentNode;
	e.child=childNode;
	(new EventDispatcher(childNode)).dispatchEvent(e);
},"type":1}
,"m16_timeoutId":{"writable":true,"value":null,"type":8}
,"m16_callback":{"writable":true,"value":null,"type":8}
,"L15_nowUpdate":{"value":function nowUpdate(delay){
	if(delay === undefined ){delay=200;}
	if(!System.is(delay, Number))throw new TypeError("type does not match. must be int","es.core.Skin",484);
	this[__PRIVATE__].invalidate=false;
	if(this[__PRIVATE__].timeoutId){
		System.clearTimeout(Reflect.type(this[__PRIVATE__].timeoutId,Number));
	}
	var callback=this[__PRIVATE__].callback;
	if(!callback){
		callback=this.L15_createChildren.bind(this);
		this[__PRIVATE__].callback=callback;
	}
	this[__PRIVATE__].timeoutId=System.setTimeout(callback,delay);
},"type":1}
,"assign":{"value":function assign(name,value){
	if(value === undefined ){value=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",506);
	var dataset=this[__PRIVATE__]._dataset;
	if(value===null){
		return dataset[name];
	}
	if(dataset[name]!==value){
		dataset[name]=value;
		if(this.L15_getInitialized()){
			this.L15_nowUpdate();
		}
	}
	return value;
},"type":1}
,"m16__dataset":{"writable":true,"value":{},"type":8}
,"getDataset":{"value":function dataset(){
	return this[__PRIVATE__]._dataset;
},"type":2},"setDataset":{"value":function dataset(value){
	if(!System.is(value, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",540);
	this[__PRIVATE__]._dataset=value;
	if(this.L15_getInitialized()){
		this.L15_nowUpdate();
	}
},"type":4},"attributes":{"value":function attributes(target,attrs){
	if(!System.is(target, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",554);
	if(!System.is(attrs, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",554);
	if(target==null)return ;
	var isElem=System.instanceOf(target, Element);
	Object.forEach(attrs,function(value,name){
		if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",558);
		var prop;
		var elem;
		if(isElem){
			elem=Reflect.type(target,Element);
			if(name==="content"&&elem.text()!==value){
				elem.text(value);
			}
			else if(name==="innerHTML"&&target.innerHTML!==value){
				elem.html(Reflect.type(value,String));
			}
			else if(elem.property(name)!=value){
				elem.property(name,value);
			}
		}
		else {
			if(name==="content"){
				prop=System.typeOf(target.textContent)==="string"?"textContent":"innerText";
				if(target[prop]!==value){
					target[prop]=value;
				}
			}
			else if(name==="innerHTML"&&target.innerHTML!==value){
				target.innerHTML=Reflect.type(value,String);
			}
			else if(name==="class"||name==="className"){
				if(target.className!==attrs[name]){
					target.className=attrs[name];
				}
			}
			else if(Reflect.call(Skin,target,"getAttribute",[name])!=attrs[name]){
				Reflect.call(Skin,target,"setAttribute",[name,attrs[name]]);
			}
		}
	});
},"type":1}
,"m16__installer":{"writable":true,"value":null,"type":8}
,"m16_installer":{"value":function installer(child,viewport){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Skin",613);
	if(!System.is(viewport, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.Skin",613);
	var map=this[__PRIVATE__]._installer;
	if(map===null){
		map=new Dictionary();
		this[__PRIVATE__]._installer=map;
	}
	var install=map.get(child);
	if(!install){
		install={"viewport":viewport};
		map.set(child,install);
	}
	if(!install.state){
		viewport.addChild(child);
	}
	install.state=true;
},"type":1}
,"m16_updateInstallState":{"value":function updateInstallState(){
	var map=this[__PRIVATE__]._installer;
	if(map){
		Object.forEach(map.getAll(),function(item){
			if(!System.is(item, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",643);
			if(Reflect.get(Skin,item.value,"state")!==true&&Reflect.type(item.key,IDisplay).getParent()){
				Reflect.type(Reflect.get(Skin,item.value,"viewport"),IContainer).removeChild(Reflect.type(item.key,IDisplay));
			}
			Reflect.set(Skin,item.value,"state",false);
		});
	}
},"type":1}
,"m16__dictionary":{"writable":true,"value":null,"type":8}
,"m16_getDictionary":{"value":function dictionary(){
	var dict=this[__PRIVATE__]._dictionary;
	if(dict===null){
		dict=new Dictionary();
		this[__PRIVATE__]._dictionary=dict;
	}
	return dict;
},"type":2},"watch":{"value":function watch(name,target,propName,sourceTarget){
	if(sourceTarget === undefined ){sourceTarget=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",680);
	if(!System.is(target, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",680);
	if(!System.is(propName, String))throw new TypeError("type does not match. must be String","es.core.Skin",680);
	if(sourceTarget!==null && !System.is(sourceTarget, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",680);
	var dict;
	var bindable=this.L15_getBindable();
	if(sourceTarget){
		dict=this.m16_getDictionary();
		bindable=Reflect.type(dict.get(sourceTarget),Bindable);
		if(!bindable){
			bindable=new Bindable(sourceTarget,"*");
			dict.set(sourceTarget,bindable);
		}
	}
	bindable.bind(target,propName,name);
},"type":1}
,"unwatch":{"value":function unwatch(target,propName,sourceTarget){
	if(sourceTarget === undefined ){sourceTarget=null;}
	if(propName === undefined ){propName=null;}
	if(!System.is(target, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",700);
	if(propName!==null && !System.is(propName, String))throw new TypeError("type does not match. must be String","es.core.Skin",700);
	if(sourceTarget!==null && !System.is(sourceTarget, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",700);
	var bindable;
	var bind;
	var dict;
	if(sourceTarget){
		dict=this.m16_getDictionary();
		bind=Reflect.type(dict.get(sourceTarget),Bindable);
		if(bind){
			bind.unbind(target,propName);
			dict.remove(sourceTarget);
		}
	}
	else {
		bindable=this.L15_getBindable();
		bindable.unbind(target,propName);
	}
},"type":1}
,"m16__children":{"writable":true,"value":[],"type":8}
,"getChildren":{"value":function children(){
	return this[__PRIVATE__]._children.slice(0);
},"type":2},"setChildren":{"value":function children(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.core.Skin",737);
	this[__PRIVATE__]._children=value.slice(0);
	if(this.L15_getInitialized()){
		this.L15_nowUpdate();
	}
},"type":4},"getChildAt":{"value":function getChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Skin",750);
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length:index;
	if(!children[index]){
		throw new RangeError('The index out of range',"es.core.Skin","756:62");
	}
	return Reflect.type(Reflect.get(Skin,children[index],"target"),IDisplay);
},"type":1}
,"getChildIndex":{"value":function getChildIndex(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Skin",766);
	var children=this[__PRIVATE__]._children;
	var len=children.length;
	var index=0;
	for(;index<len;index++){
		if(Reflect.get(Skin,children[index],"target")===child){
			return index;
		}
	}
	return -1;
},"type":1}
,"addChildAt":{"value":function addChildAt(child,index){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Skin",787);
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Skin",787);
	var parent=child.getParent();
	if(parent){
		parent.removeChild(child);
	}
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length+1:index;
	children.splice(index,0,child);
	child.s3_setParentDisplay(this);
	if(this.L15_getInitialized()){
		this.L15_nowUpdate();
	}
	return child;
},"type":1}
,"removeChild":{"value":function removeChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Skin",809);
	var children=this[__PRIVATE__]._children;
	var index=Reflect.type(this.getChildIndex(child),Number);
	if(index>=0){
		return this.removeChildAt(index);
	}
	else {
		throw new ReferenceError('The child is not added.',"es.core.Skin","817:67");
	}
},"type":1}
,"removeChildAt":{"value":function removeChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Skin",826);
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length:index;
	if(!(children.length>index)){
		throw new RangeError('The index out of range',"es.core.Skin","832:62");
	}
	var child=Reflect.type(children[index],IDisplay);
	children.splice(index,1);
	if(child.getParent()){
		child.getParent().removeChild(child);
	}
	child.s3_setParentDisplay(null);
	if(this.L15_getInitialized()){
		this.L15_nowUpdate();
	}
	return child;
},"type":1}
,"removeAllChild":{"value":function removeAllChild(){
	var len=this[__PRIVATE__]._children.length;
	while(len>0){
		this.removeChildAt(--len);
	}
},"type":1}
,"m16_statesGroup":{"writable":true,"value":{},"type":8}
,"setStates":{"value":function states(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.core.Skin",873);
	var name;
	var stateObj;
	var len=value.length;
	var i=0;
	var statesGroup=this[__PRIVATE__].statesGroup;
	for(;i<len;i++){
		stateObj=Reflect.type(value[i],State);
		name=stateObj.getName();
		if(!name)throw new TypeError('name is not define in Skin.states',"es.core.Skin","882:83");
		if(statesGroup.hasOwnProperty(name)){
			throw new TypeError('"'+name+'" has already been declared in Skin.states',"es.core.Skin","885:94");
		}
		statesGroup[name]=stateObj;
	}
},"type":4},"m16__currentState":{"writable":true,"value":null,"type":8}
,"getCurrentState":{"value":function currentState(){
	return this[__PRIVATE__]._currentState;
},"type":2},"setCurrentState":{"value":function currentState(name){
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",899);
	var current=this[__PRIVATE__]._currentState;
	if(current!==name){
		this[__PRIVATE__]._currentState=name;
		this[__PRIVATE__]._currentStateGroup=null;
		if(this.L15_getInitialized()){
			this.L15_nowUpdate();
		}
	}
},"type":4},"display":{"value":function display(){
	if(this.L15_getInitialized()===false){
		this.L15_setInitialized(true);
		this.L15_initializing();
	}
	Container.prototype.display.call(this);
	this.L15_nowUpdate(0);
	return this.getElement();
},"type":1}
};
Skin.prototype=Object.create( Container.prototype , proto);
Internal.defineClass("es/core/Skin.es",Skin,{
	"extends":Container,
	"package":"es.core",
	"classname":"Skin",
	"implements":[IBindable],
	"uri":["m16","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
