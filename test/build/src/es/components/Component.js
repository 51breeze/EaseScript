define(["es.components.Component","es.events.ComponentEvent"],function(Component,ComponentEvent){
var _private=this._private;
var proto={"constructor":{"value":Component},"X5__initialized":{"writable":true,"value":false}
,"D2_initialized":{"value":function initialized(){
	var val=this[_private]._initialized;
	if(val===false){
		this[_private]._initialized=true;
		this.hasEventListener(ComponentEvent._INITIALIZED)&&this.dispatchEvent(new ComponentEvent.constructor(ComponentEvent._INITIALIZED));
	}
	return val;
}}
,"D2_initializing":{"value":function initializing(){
	var val=this[_private]._initialized===false;
	if(val===true&&this.hasEventListener(ComponentEvent._INITIALIZING)){
		this.dispatchEvent(new ComponentEvent.constructor(ComponentEvent._INITIALIZING));
	}
	return val;
}}
};
Object.defineProperty(Component,"constructor",{"value":function constructor(){
	Object.defineProperty(this,_private,{value:{"_initialized":false}});
	EventDispatcher.call(this);
}});
Component.constructor.prototype=Object.create( EventDispatcher.prototype , proto);
Object.defineProperty(Component,"prototype",{value:Component.constructor.prototype});
Object.defineProperty(Component,"__T__",{value:{
	"extends":EventDispatcher,
	"package":"es.components",
	"classname":"Component",
	"_private":_private,
	"uri":["X5_","D2_","Z17_","_"],
	"proto":proto
}});
return Component;
});
