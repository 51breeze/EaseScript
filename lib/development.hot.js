var System = require("system/System.js");
var Event = require("es/events/ComponentEvent.es");
module.exports=function hotUpdate( module )
{
    var global = System.getGlobalEvent();
    var e = new Event( Event.COMPONENT_HOT_UPDATE );
    e.setHotUpdateModule( module );
    global.dispatchEvent( e );
}