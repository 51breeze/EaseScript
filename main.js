import Index from './test/src/IndexApplication.es';
import Event from '@Event.es';
import System from '@System.es';


var bb = () => 123;
var obj = new Index();

var global = System.getGlobalEvent();
global.addEventListener(Event.READY,function (e) {
   

    console.log(  bb(), obj.home()+""  );


},false,-500);


