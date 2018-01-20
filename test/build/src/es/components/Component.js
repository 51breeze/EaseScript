define(["es.components.Component","es.events.ComponentEvent"],function(Component,ComponentEvent){
var _private=this._private;
var proto={"constructor":{"value":Component},"R5___initialized__":{"writable":true,"value":false}
,"L2_initialized":{"value":function initialized(){
	var val=this[_private].__initialized__;
	if(val===false){
		this[_private].__initialized__=true;
		if(this.hasEventListener(ComponentEvent._INITIALIZED)){
			this.dispatchEvent(new ComponentEvent.constructor(ComponentEvent._INITIALIZED));
		}
	}
	return val;
}}
,"R5___initializing__":{"writable":true,"value":true}
,"L2_initializing":{"value":function initializing(){
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
	"extends":EventDispatcher,
	"package":"es.components",
	"classname":"Component",
	"_private":_private,
	"uri":["R5_","L2_","m17_","_"],
	"proto":proto
}});
return Component;
});
