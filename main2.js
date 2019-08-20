import Index from './test/src/PersonApplication.es';
import Event from 'system/Event.js';
import System from 'system/System.js';


var obj = new Index();
var global = System.getGlobalEvent();
global.addEventListener(Event.READY,function (e) {
   
    console.log(  obj.index()+""  );

},false,-500);


console.log("==PersonApplication===66666")