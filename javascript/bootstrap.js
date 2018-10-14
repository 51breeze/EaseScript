var routeMap = [CODE[SERVICE_ROUTE_LIST]];
var defaultRoute = "[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]";
var global = System.getGlobalEvent();
var EaseScript = {
    "System":System,
    "Internal":Internal,
    "DefaultRoute":defaultRoute,
    "RouteMap":routeMap,
    "URL_PATH_NAME":"[CODE[STATIC_URL_PATH_NAME]]",
    "Version":[CODE[VERSION]],
    "JsLoadPath":"[CODE[JS_LOAD_PATH]]",
    "CssLoadPath":"[CODE[CSS_LOAD_PATH]]",
    "Requirements":[CODE[LOAD_REQUIREMENTS]],
    "Load":{}
};

/**
 * 运行环境相关信息
 */
System.environmentObject={
    "DefaultRoute":EaseScript.DefaultRoute,
    "RouteMap":EaseScript.RouteMap,
    "URL_PATH_NAME":EaseScript.URL_PATH_NAME,
    "Version":EaseScript.Version,
    "JsLoadPath":EaseScript.JsLoadPath,
    "CssLoadPath":EaseScript.CssLoadPath,
    "Requirements":EaseScript.Requirements,
};

/**
 * 加载指定的脚本文件
 * @param filename
 * @param callback
 * @param classname
 * @return {HTMLScriptElement}
 */
function loadScript(filename,callback){

    var script = null;
    var match = filename.match(/\.(css|js)$/i);
    switch ( match[1].toLowerCase() ){
        case "js" :
            script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', filename );
            break;
        case "css":
            script = document.createElement('link');
            script.setAttribute('rel', 'stylesheet');
            script.setAttribute('href', filename );
            break;
    }

    if( !script )
    {
        throw new TypeError("Invalid script file. only support css or js for the '"+filename+"'");
    }

    if( callback )
    {
        var loaded = false;
        script.onreadystatechange = script.onload = function (e) {
            if ((script.readyState == 'loaded' || script.readyState == 'complete' || script.readyState == 4) || (e && e.type === "load")) {
                script.onreadystatechange  = script.onload = null;
                if(loaded===false){
                    callback(e);
                    loaded = true;
                }
            }
        }
    }
    var headElement = document.head || document.getElementsByTagName("head")[0];
    if( !headElement || !headElement.parentNode )
    {
        throw new ReferenceError("Head element is not exist.");
    }
    headElement.appendChild(script);
    return script;
}

/**
 * 开始执行应该模块
 * @param module
 * @param method
 */
function start(module, method)
{
    try {
        var main = System.getDefinitionByName(module);
        var obj = Reflect.construct(null, main);
        var Event = System.Event;
        Reflect.call(main, obj, method);
        if (global.hasEventListener(Event.INITIALIZE_COMPLETED)) {
            global.dispatchEvent(new Event(Event.INITIALIZE_COMPLETED));
        }

    }catch(e)
    {
        window.console.log(e);
        throw new Error( e.message );
    }
}

/**
 * 加载器
 * @param requirements
 * @param then
 */
function loader(requirements, then)
{
    if( !requirements || !(requirements.length > 0) )return then();
    requirements = requirements.slice(0);
    (function load() {
       requirements.length > 0 ? loadScript(requirements.shift(), load) :  then();
    }());
}

function initModule(module)
{
    if( typeof EaseScript.Load[module] === "function" && EaseScript.Load[module].init !==true )
    {
        EaseScript.Load[module].init = true;
        EaseScript.Load[module](Internal, System);
    }
}

/**
 * 文档加载就绪
 */
global.addEventListener(Event.READY,function (e) {
    try{

        var locator = System.Locator;
        var router = routeMap.get || {};
        var path = locator.query("[CODE[STATIC_URL_PATH_NAME]]");
        if( !path ){
            path = '/'+locator.path().join("/");
        }
        //指定需要执行的模块
        router = router[ path ] || defaultRoute;
        var controller = router.split("@");
        var module = controller[0];
        var method = controller[1];
        System.environmentObject.RouteController=router;
        if( typeof routeMap.get[ path ] !== "undefined"){
            System.environmentObject.RoutePath=  path ;
        }else{
            System.Object.forEach(routeMap.get,function (provider,name) {
                if( provider === router ){
                    System.environmentObject.RoutePath = name;
                    return false;
                }
            });
        }

        //如果存在先初始化
        initModule(module);

        //如果模块类已经加载
        if( System.hasClass( module ) )
        {
            start(module, method);
        }
        //需要加载模块及模块相关脚本
        else
        {
            //如果没有配置指定的模块
            var moduleInfo = EaseScript.Requirements[ module ]
            if( !moduleInfo || !moduleInfo.script )
            {
                throw new ReferenceError("Not found the '"+module+"'." );
            }

            //加载模块样式
            if( moduleInfo.css )
            {
                loadScript( moduleInfo.css );
            }

            //加载模块依赖文件
            loader(moduleInfo.require, function () {
                //加载主模块
                loadScript(moduleInfo.script, function () {
                    //初始化模块
                    initModule(module);
                    start(module, method);
                },module);
            });
        }

    }catch(e)
    {
        window.console.log(e);
        throw new Error( e.message );
    }
},false,-500);
window["[CODE[HANDLE]]"]=EaseScript;