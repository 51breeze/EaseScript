import Index from './test/src/IndexApplication.es';
import Event from 'system/Event.js';
import System from 'system/System.js';


var obj = new Index();
var global = System.getGlobalEvent();
global.addEventListener(Event.READY,function (e) {
   
    console.log(  obj.home()+""  );

},false,-500);


console.log("==IndexApplication=======1111000")