(function(definedModules){

/**
 * 已加载的模块
 */
var installedModules = {};

/**
 * 加载并初始化模块
 * @param string 
 */
function require( identifier )
{
    if( installedModules[identifier] )
    {
        return installedModules[identifier].exports;
    }

    if( !definedModules.hasOwnProperty(identifier) )
    {
         throw new ReferenceError( identifier +" is not define.");
    }

    var module = installedModules[identifier] = {
        id: identifier,
        exports: {}
    };

	definedModules[identifier].call(module.exports, module, require);
	return module.exports;
}

require.has=function has( identifier )
{
    return definedModules.hasOwnProperty(identifier);
}

var Internal= require("[CODE[REQUIRE_IDENTIFIER(Internal)]]");
var Locator = require("[CODE[REQUIRE_IDENTIFIER(Locator)]]");
var Object  = require("[CODE[REQUIRE_IDENTIFIER(Object)]]");
var System  = require("[CODE[REQUIRE_IDENTIFIER(System)]]");
var Event   = require("[CODE[REQUIRE_IDENTIFIER(Event)]]");
var global  = System.getGlobalEvent();
var httpRoutes = [CODE[SERVICE_ROUTE_LIST]];
var handle = "[CODE[HANDLE]]";
var env={
    "HTTP_DEFAULT_ROUTE":"[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]",
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
Object.merge(Internal.env, env);
var EaseScript = window[ handle ] = {
    "Requirements":[CODE[LOAD_REQUIREMENTS]],
    "Load":{},
    "Environments":env
};
Internal.require = require;

if( typeof window[ handle ] === "object" )
{
    if( window[ handle ].Load )
    {
        EaseScript.Load = window[ handle ].Load;
    }
    if( window[ handle ].HTTP_DEFAULT_ROUTE )
    {
        env.HTTP_DEFAULT_ROUTE =  window[ handle ].HTTP_DEFAULT_ROUTE;
    }
}


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
    var main = require( module );
    var obj = new main();
    global.dispatchEvent(new Event(Event.INITIALIZING));
    if( method )
    {
        if( typeof obj[method] === "function" )
        {
            obj[method]();
        }else{
            throw new ReferenceError( method+" is not exist.");
        }
    }
    if (global.hasEventListener(Event.INITIALIZE_COMPLETED)) 
    {
        global.dispatchEvent(new Event(Event.INITIALIZE_COMPLETED));
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

function match(routes, pathName )
{
    if( !routes )
    {
        return null;
    }

    pathName = pathName.replace(/^\/|\/$/g,'');
    var pathArr = pathName.split('/');
    for(var p in routes )
    {
       var routeName = p.replace(/^\/|\/$/g,'').toLowerCase();
       var routeArr = routeName.split('/');
       if( routeArr.length === pathArr.length )
       {
           var args = [];
           var props = [];
           if( p.indexOf("{") >= 0 )
           {
                var index = 0;
                var len = routeArr.length;
                while( index < len )
                {
                    var name = routeArr[ index ];
                    if( name.charAt(0) ==="{" && name.charAt(name.length-1) ==="}" )
                    {
                       props.push( name.slice(1,-1) )
                       args.push( pathArr[index] );

                    }else if( name !== pathArr[index].toLowerCase() )
                    {
                       break;
                    }
                    index++;
                }

                if( index < len )
                {
                    continue;
                }

           }else if( routeName !== pathName.toLowerCase() )
           {
               continue;
           }
           return {
              provider:routes[ p ],
              props:props,
              args:args
           }
       }
    }
    return null;
}


/**
 * 文档加载就绪
 */
global.addEventListener(Event.READY,function (e) {
 
    var routeMap = env.HTTP_ROUTES && env.HTTP_ROUTES.get || {};
    var path = Locator.query( env.URL_PATH_NAME );
    if( !path )
    {
        path = Locator.path().join("/") ;
    }else{
        path = path.replace(/^\/|\/$/g,'');
    }

    path = path.toLowerCase();
    var matchRouter = path && match( routeMap, path );
    var router =  matchRouter || {
        provider:env.HTTP_DEFAULT_ROUTE,
        props:[],
        args:[]
    };

    var controller = router ? router.provider.split("@") : [];
    var module = controller[0];
    var method = controller[1];
    env.HTTP_ROUTE_CONTROLLER=router;

    if( typeof routeMap[ path ] !== "undefined"){
        env.HTTP_ROUTE_PATH = path ;
    }else{
        Object.forEach(routeMap,function (provider, name) {
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
        if( require.has( module ) )
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
    
},false,-500);

}([CODE[MODULES]]));