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

/**
 * 判断是否有定义此标识符的模块
 */
require.has=function has( identifier )
{
    return definedModules.hasOwnProperty(identifier);
}

/**
 * 合并分块加载的模块
 * @param {*} modules 
 */
function loadModuleCallback( modules )
{
    for(var identifier in modules )
    {
        definedModules[identifier] = modules[ identifier ]; 
    }
}


/**
 * 查找一个指定属性名的节点
 * @param {*} scripts 
 * @param {*} attrname 
 * @param {*} value 
 */
function findScript( scripts, attrname, value )
{
    for(var i=0; i<scripts.length; i++)
    {
        if( (scripts[i].getAttribute && scripts[i].getAttribute( attrname ) === value) || scripts[i][attrname] === value )
        {
           return scripts[i];
        }
    }
    return null;
}

/**
 * 加载指定的脚本文件
 * @param filename
 * @param callback
 * @param classname
 * @return {HTMLScriptElement}
 */
var loadMap = {};
var loadQueues = [];
function loadScript(filename,callback){

    if( loadMap[filename] )
    {
        if(typeof callback === "function")
        {
            callback();
        }
        return loadMap[filename];
    }

    var script = null;
    var match = filename.match(/\.(css|js)($|\?)/i);
    var isJs = false;
    switch ( match && match[1].toLowerCase() ){
        case "js" :
            isJs = true;
            script = findScript( document.scripts,"src",filename);
            if( !script )
            {
                script = document.createElement('script');
                script.setAttribute('type', 'text/javascript');
                script.setAttribute('src', filename );
            }
            break;
        case "css":
            script = findScript( document.styleSheets,"href",filename);
            if( !script )
            {
                script = document.createElement('link');
                script.setAttribute('rel', 'stylesheet');
                script.setAttribute('href', filename );
            }
            break;
    }
    if( !script )
    {
        throw new TypeError("Invalid script file. only support css or js for the '"+filename+"'");
    }
    loadMap[filename] = script;

    if( callback )
    {
        loadQueues.push( callback );
    }

    (function ready(script,filename,callback){

        var loaded = false;
        var timeid = null;
        script.onreadystatechange = script.onload = function (e) {
            if ((script.readyState == 'loaded' || script.readyState == 'complete' || script.readyState == 4) || (e && e.type === "load"))
            {
                script.onreadystatechange  = script.onload = null;
                if(loaded===false)
                {
                    window.clearTimeout(timeid);
                    loaded = true;
                    if( callback )
                    {
                        loadQueues.splice( loadQueues.indexOf( callback ), 1 )[0]( loadQueues.length ===0 );
                    }
                }
            }
        }
        timeid = window.setTimeout( function(){
            throw new Error("Load script timeout in '"+filename+"'" );
        }, 120000 );

    }(script,filename,callback));

    var headElement = document.head || document.getElementsByTagName("head")[0];
    if( !headElement || !headElement.parentNode )
    {
        throw new ReferenceError("Head element is not exist.");
    }

    if( !script.parentNode )
    {
        headElement.appendChild(script);
    }
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
function loader(requirements, callback)
{
    if( !requirements || !(requirements.length > 0) )
    {
        return callback();
    }

    var success = function( done )
    {
        if( done )
        {
           callback();
        }
    }

    for(var i=0;i<requirements.length;i++)
    {
        loadScript(requirements[i], success );
    }
}

/**
 * 尝试匹配一个指定路径名的模块信息
 * @param {*} routes 
 * @param {*} pathName 
 */
function match(routes, pathName )
{
    if( !routes )
    {
        return null;
    }

    pathName = pathName.replace(/^\/|\/$/g,'');
    const pathArr = pathName.split('/');
    for(var p in routes )
    {
       const routeName = p.replace(/^\/|\/$/g,'').toLowerCase();
       const routeArr = routeName.split('/');
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
                       var rule = name.slice(1,-1);
                       if( rule.charAt(0) ===":" )
                       {
                            var regexp = rule.slice(1);
                            var flags = "";
                            var index = regexp.lastIndexOf("/");
                            if( index > 0 )
                            {
                                flags  = regexp.slice( index+1 );
                                regexp = regexp.slice(0, index);
                            }

                            var mathed = pathArr[index].match( new RegExp( regexp, flags) );
                            if( mathed )
                            {
                                props.push( name );
                                args.push( mathed[1] || pathArr[index] );

                            }else
                            {
                                break;
                            }

                       }else
                       {
                            props.push( rule );
                            args.push( pathArr[index] );
                       }

                    }else if( name !== pathArr[ index ].toLowerCase() )
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

var Internal= require("[CODE[REQUIRE_IDENTIFIER(Internal)]]");
var Locator = require("[CODE[REQUIRE_IDENTIFIER(Locator)]]");
var Object  = require("[CODE[REQUIRE_IDENTIFIER(Object)]]");
var System  = require("[CODE[REQUIRE_IDENTIFIER(System)]]");
var Event   = require("[CODE[REQUIRE_IDENTIFIER(Event)]]");
var global  = System.getGlobalEvent();
var handle = "[CODE[HANDLE]]";
var depModules = [CODE[LOAD_REQUIREMENTS]];
var env={
    "HTTP_DEFAULT_ROUTE":"[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]",
    "HTTP_ROUTES": [CODE[SERVICE_ROUTE_LIST]],
    "HTTP_ROUTE":null,
    "HTTP_PATH":null,
    "MODE":[CODE[MODE]],
    "ORIGIN_SYNTAX":"[CODE[ORIGIN_SYNTAX]]",
    "URL_PATH_NAME":"[CODE[STATIC_URL_PATH_NAME]]",
    "COMMAND_SWITCH":[CODE[COMMAND_SWITCH]],
    "VERSION":[CODE[VERSION]],
    "LOAD_JS_PATH":"[CODE[JS_LOAD_PATH]]",
    "LOAD_CSS_PATH":"[CODE[CSS_LOAD_PATH]]",
    "WORKSPACE":"[CODE[WORKSPACE]]",
    "MODULE_SUFFIX":"[CODE[MODULE_SUFFIX]]",
    "HTTP_DISPATCHER":function(module, method, callback)
    {
        identifier = env.WORKSPACE+module+env.MODULE_SUFFIX;

        //如果模块类已经加载
        if( require.has( identifier ) )
        {
            typeof callback === "function" ? callback( start(identifier, method) ) : start(identifier, method);
        }
        //需要加载模块及模块相关脚本
        else
        {
            //如果没有配置指定的模块
            var deps = depModules[ identifier ];
            if( !deps )
            {
                throw new ReferenceError("Not found the '"+module+"'." );
            }

            //加载模块依赖文件
            loader(deps, function (){
                typeof callback === "function" ? callback( start(identifier, method) ) : start(identifier, method);
            });
        }
    }
};

var loadArray = window[ handle ] || (window[ handle ]=[]);
loadArray.push = loadModuleCallback;

env = Object.merge(Internal.env, env);
Internal.require = require;

for(var i = 0; i < loadArray.length; i++)
{
    loadModuleCallback( loadArray[i] );
}

/**
 * 文档加载就绪
 */
global.addEventListener(Event.READY,function (e) {

    var requestMethod = window["HTTP_REQUEST_METHOD"] || "get";
    var routeMap = (env.HTTP_ROUTES && env.HTTP_ROUTES[ requestMethod.toLowerCase() ]) || {};
    var path = Locator.query( env.URL_PATH_NAME );
    if( !path )
    {
        path = Locator.path().join("/");
    }

    var router = match( routeMap, path );
    if( !router && env.HTTP_DEFAULT_ROUTE )
    {
        router = match( routeMap, env.HTTP_DEFAULT_ROUTE.split("@")[0] );
    }

    if( router )
    {
        var controller = router.provider.split("@");
        var module = controller[0];
        var method = controller[1];
        env.HTTP_ROUTE=router.provider;
        env.HTTP_PATH = path ;
        env.HTTP_DISPATCHER( module,  method);

    }else if( global.dispatchEvent( new Event("ROUTE_NOT_EXISTS") ) )
    {
        document.body.innerHTML = "<p style='text-align: center;margin-top: 50px;font-size: 18px;'>Access page does not exist.</p>";
    }
    
},false,-500);

}([CODE[MODULES]]));