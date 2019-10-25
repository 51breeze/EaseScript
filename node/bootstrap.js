const Internal= require("[CODE[REQUIRE_IDENTIFIER(Internal)]]");
const locator = require("[CODE[REQUIRE_IDENTIFIER(Locator)]]");
const Object  = require("[CODE[REQUIRE_IDENTIFIER(Object)]]");
const System  = require("[CODE[REQUIRE_IDENTIFIER(System)]]");
const Event   = require("[CODE[REQUIRE_IDENTIFIER(Event)]]");

const httpRoutes = [CODE[SERVICE_ROUTE_LIST]];
const defaultRoute = "[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]";

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



var global  = System.getGlobalEvent();
Object.merge(Internal.env, env);



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
