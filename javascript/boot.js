var global = System.getGlobalEvent();
var EaseScript = {
    "System":System,
    "Internal":Internal,
    "Requirements":[CODE[LOAD_REQUIREMENTS]],
    "Load":{},
    "Environments":System.environmentMap
};

/**
 * 文档加载就绪
 */
global.addEventListener(Event.READY,function (e) {
    try{
        var bootstrapClass = System.getDefinitionByName("[CODE[BOOTSTRAP_CLASS_FILE_NAME]]");
        System.Reflect.construct(null, bootstrapClass);
    }catch(e)
    {
        window.console.log(e);
        throw new Error( e.message );
    }
},false,-500);
window["[CODE[HANDLE]]"]=EaseScript;