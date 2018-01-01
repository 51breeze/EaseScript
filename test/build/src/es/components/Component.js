define(["es.components.Component","es.events.ComponentEvent"],function(Component,ComponentEvent){
var _private=this._private;
var proto={"constructor":{"value":Component},"T5___initialized__":{"writable":true,"value":false}
,"w2_initialized":{"value":function initialized(){
	var val=this[_private].__initialized__;
	if(val===false){
		this[_private].__initialized__=true;
		if(this.hasEventListener(ComponentEvent._INITIALIZED)){
			this.dispatchEvent(new ComponentEvent.constructor(ComponentEvent._INITIALIZED));
		}
	}
	return val;
}}
,"T5___initializing__":{"writable":true,"value":true}
,"w2_initializing":{"value":function initializing(){
	var val=this[_private].__initializing__;
	if(val===true){
		this[_private].__initializing__=false;
		if(this.hasEventListener(ComponentEvent._INITIALIZING)){
			this.dispatchEvent(new ComponentEvent.constructor(ComponentEvent._INITIALIZING));
		}
	}
	return val;
}}
};
Object.defineProperty(Component,"constructor",{"value":function constructor(){
	Object.defineProperty(this,_private,{value:{"__initialized__":false,"__initializing__":true}});
	EventDispatcher.call(this);
}});
Component.constructor.prototype=Object.create( EventDispatcher.prototype , proto);
Object.defineProperty(Component,"prototype",{value:Component.constructor.prototype});
Object.defineProperty(Component,"__T__",{value:{
	"ns":"_",
	"extends":EventDispatcher,
	"package":"es.components",
	"classname":"Component",
	"filename":"E:/EaseScript/es/components/Component.es",
	"implements":[],
	"_private":_private,
	"uri":["T5_","w2_","U17_","_"],
	"proto":proto
}});
return Component;
});
