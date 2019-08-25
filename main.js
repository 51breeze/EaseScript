
import "./style/less/main.less";
import Index from './test/src/IndexApplication.es';
import Event from 'system/Event.js';
import System from 'system/System.js';


// require("./es/skins/DataGridStyle.less");
// require("./es/skins/NavigateStyle.less");
// require("./es/skins/PaginationStyle.less");
// require("./es/skins/PopUpStyle.less");


var obj = new Index();
var global = System.getGlobalEvent();
global.addEventListener(Event.READY,function (e) {
   
    console.log(  obj.home()+""  );

},false,-500);

if( module.hot ){

    module.hot.accept('./test/src/IndexApplication.es', function() {
         

        var obj = new Index();
        obj.home();
        console.log("./test/src/IndexApplication.es===============")

    });


}

