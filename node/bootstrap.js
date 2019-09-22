(function(definedModules, undefined){

var httpRoutes = [CODE[SERVICE_ROUTE_LIST]];
var defaultRoute = "[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]";

/**
 * 运行环境相关信息
 */
var env={
    "HTTP_DEFAULT_ROUTE":defaultRoute,
    "HTTP_ROUTES":httpRoutes,
    "HTTP_ROUTE_PATH":null,
    "MODE":[CODE[MODE]],
    "ORIGIN_SYNTAX":"[CODE[ORIGIN_SYNTAX]]",
    "URL_PATH_NAME":"[CODE[STATIC_URL_PATH_NAME]]",
    "HTTP_ROUTE_CONTROLLER":null,
    "COMMAND_SWITCH":[CODE[COMMAND_SWITCH]],
    "VERSION":[CODE[VERSION]],
    "LOAD_JS_PATH":"[CODE[JS_LOAD_PATH]]",
    "LOAD_CSS_PATH":"[CODE[CSS_LOAD_PATH]]",
    "WORKSPACE":"[CODE[WORKSPACE]]",
    "MODULE_SUFFIX":"[CODE[MODULE_SUFFIX]]"
};

/**
 * 框架信息
 */
var EaseScript = {
    "Requirements":[CODE[LOAD_REQUIREMENTS]],
    "Load":{},
    "Environments":env
};

/**
 * 已加载的模块
 */
var installedModules = {};

/**
 * 加载并初始化模块
 * @param string 
 */
function require( classname )
{
    if( installedModules[classname] )
    {
        return installedModules[classname].exports;
    }

    var module = installedModules[classname] = {
        id: classname,
        exports: {}
    };

	definedModules[classname].call(module.exports, module, require);
	return module.exports;
}

var Internal= require("[CODE[REQUIRE_IDENTIFIER(Internal)]]");
var locator = require("[CODE[REQUIRE_IDENTIFIER(Locator)]]");
var Object  = require("[CODE[REQUIRE_IDENTIFIER(Object)]]");
var System  = require("[CODE[REQUIRE_IDENTIFIER(System)]]");
var Event   = require("[CODE[REQUIRE_IDENTIFIER(Event)]]");
var global  = System.getGlobalEvent();
Object.merge(Internal.env, env);

/**
 * 加载指定的脚本文件
 * @param filename
 * @param callback
 * @param classname
 * @return {HTMLScriptElement}
 */
var loadMap = {};
function loadScript(filename,callback){

    if( loadMap[filename] )
    {
        if(typeof callback === "function"){
            callback();
        }
        return loadMap[filename];
    }
    var script = null;
    var match = filename.match(/\.(css|js)[$|\?]/i);
    switch ( match && match[1].toLowerCase() ){
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
    loadMap[filename] = script;
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
        var main = require( module );
        var obj = new main();
        global.dispatchEvent(new Event(Event.INITIALIZING));
        var response = obj[method]();
        if (global.hasEventListener(Event.INITIALIZE_COMPLETED)) {
            global.dispatchEvent(new Event(Event.INITIALIZE_COMPLETED));
        }
        return response;
    }catch(e)
    {
        throw e.valueOf();
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

/**
 * 初始化模块文件
 * @param {} module 
 */
function initModule(module)
{
    if( typeof EaseScript.Load[module] === "function" && EaseScript.Load[module].init !==true )
    {
        EaseScript.Load[module].init = true;
        var modules = EaseScript.Load[module].call( EaseScript, require );
        Object.forEach( modules, function(classModule,classname)
        {
            if( !definedModules.hasOwnProperty(classname) )
            {
                definedModules[ classname ] = classModule;
            }
        });
    }
}

var handle = "[CODE[HANDLE]]";
EaseScript.Load = (typeof window[ handle ] === "object" &&  window[ handle ].Load) || {};
window[ handle ]=EaseScript;

/**
 * 文档加载就绪
 */
global.addEventListener(Event.READY,function (e) {

    try{
       
        var router = httpRoutes.get || {};
        var path = locator.query( env.URL_PATH_NAME );
        if( !path ){
            path = '/'+locator.path().join("/");
        }
        //指定需要执行的模块
        router = router[ path ] || defaultRoute;
        var controller = router.split("@");
        var module = controller[0];
        var method = controller[1];
        env.HTTP_ROUTE_CONTROLLER=router;
        if( typeof httpRoutes.get[ path ] !== "undefined"){
            env.HTTP_ROUTE_PATH = path ;
        }else{
            Object.forEach(httpRoutes.get,function (provider, name) {
                if( provider === router ){
                    env.HTTP_ROUTE_PATH = name;
                    return false;
                }
            });
        }

        //调度指定模块中的方法
        (env.HTTP_DISPATCHER=function(module, method, callback)
        {
            module = env.WORKSPACE+module+env.MODULE_SUFFIX;
            //如果存在先初始化
            initModule(module);
            //如果模块类已经加载
            if( System.hasClass( module ) )
            {
                typeof callback === "function" ? callback( start(module, method) ) : start(module, method);
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
                        typeof callback === "function" ? callback( start(module, method) ) : start(module, method);
                    },module);
                });
            }
        })(module, method);

    }catch(e)
    {
        window.console.log(e);
        throw new Error( e.message );
    }
},false,-500);

}([CODE[MODULES]]));