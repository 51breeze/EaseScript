(function(id,filename,undefined)
{
    "use strict";
    var Load = (window[id] || (window[id]={Load:{}})).Load;
    Load[filename]=function(){
        return [CODE[MODULES]];
    }
}("[CODE[HANDLE]]","[CODE[FILENAME]]"));