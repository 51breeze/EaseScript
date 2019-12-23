const fs = require('fs');
const PATH = require('path');
const Utils = require('./utils.js');
const Maker = require('./maker.js');
const Compile = require('./compile.js');
const jsBuilder = require( '../javascript/builder.js')
//需要保护的关键字
const reserved=['let', 'of','System',"Context"];
//编译器的上下文对象
const compileContext={
    "public":"__PUBLIC__",
    "protected":"__PROTECTED__",
    "private":"__PRIVATE__",
    "internal":"__INTERNAL__",
    "defineModuleMethod":"define",
    "package":"Context",
};
//全局对象描述
var globals = Maker.globalDescriptions;
//全局配置
const defaultConfig = {
    //需要编译文件的后缀
    'suffix': '.es', 
    //是否需要开启调式
    'debug':false, 
    //是否启用块级域
    'blockScope':false,
    //指定编译器需要保护的关键字
    'reserved':[],
    //是否需要压缩
    'minify':true,
    //是否需要打包动画库
    'animate':true,
    //是否需要打包字体库
    'font':true,
    //指定主题文件名
    'theme':null,
    //需要使用的主题文件路径
    'theme_file_path':null,
    //是否需要输出编译后的原文件
    'source_file':false,
    //需要兼容浏览器的版本
    'compat_version':{ie:11},//要兼容的平台 {'ie':8,'chrome':32.5}
    //默认构建后输入的目录名
    'build_path':'./build',
    //默认的工程目录名
    'project_path':'./project',
    //工作根目录
    'workspace':'./src',
    //皮肤文件的后缀名
    'skin_file_suffix':'.html',
    //皮肤样式配置文件, 为每一个组件指定默认的皮肤类. 格式为 {"component.classname":"skin.path"}
    'skin_style_config':null,
    //工程文件的后缀，编译器只会编译指定这个后缀的文件
    'project_file_suffix':'.es',
    //是否支持浏览器
    'browser':true,
    //指定皮肤基类
    'baseSkinClass':'es.core.Skin',
    //实现迭代的接口
    'iterator_interface':'es.interfaces.IListIterator',
    //指定一个生成构建代码目录的配置
    'config_file':null,
    //指定需要编译的文件名（文件目录），多个传递数组
    'bootstrap':null,
    //指定默认加载的应用页面，通常为 类的全名称比如：test.Index 默认为 index 应用名（如果存在）， 否则为第一个应用类
    'default_bootstrap_class':null,
    //需要引用外部库的名称 , [jQuery,...]
    'library':null,
    //是否启用严格类型， true 在每个声明的后面必须指定类型， false 可以不指定
    'strictType':true,
    //服务提供者的运行语法
    'service_provider_syntax':"php",
    //在静态文件后面指定path 来切换页面的参数名称
    'static_url_path_name':"PATH",
    //是否在构建目录的 webroot 里面运行
    'enable_webroot':false,
    //针对编译器的切换指令
    'command_switch':0,
     //是否把每个应用页分开加载
    'script_part_load':true,
     //系统库路径名
    'system_lib_path_name':'es',
    //系统全局类路径名
    'system_global_path':PATH.join(__dirname,"../javascript/system"),
     //系统库路径
    'system_lib_path':PATH.join(__dirname,"../"),
    //系统样式路径名
    'system_style_name':'style',
    //系统样式路径
    'system_style_path':PATH.join(__dirname,"../"),
    //主库目录名
    'build_libaray_name':"es",
     //生成系统类目录
    'build_system_path':"es.system",
    //需要重新生成工程的配置文件
    'clean':false,
    //1 标准模式（开发时使用） 2 性能模式（生产环境使用）
    'mode': 1, 
    //是否只构建application应用入口的文件 all app
    'build_mode':"all",
    //当编译出错时退出程序
    "on_error_exit":false,
    //监听当前工作空间中的文件变化
    "watching":false,
    //指定监听文件的后缀
    "watchMatchSuffix":null,
    //是否启用服务
    "serverEnable":false,
    //使用模块导出格式,仅js
    "module_exports":false,
    //加载模块时的后缀
    "module_suffix":null,
    //是否需要打包文件
    "build_pack":true,
    //启用热替换
    "hot_replacement":true,
};

//构建目录配置
const buildConfig = {
    "build": {
        "path": "",
        "name": "",
        "child": {
            "assets":{
                "path": "@webroot",
                "name": "assets",
            },
            "js": {
                "path": "@webroot",
                "name": "js",
            },
            "img": {
                "path": "@assets",
                "name": "./",
            },
            "css": {
                "path": "@webroot",
                "name": "css",
            },
            "font": {
                "path": "@assets",
                "name": "./",
            },
            "view": {
                "path": "@application",
                "name": "view",
            },
            "html":{
                "path":"@webroot",
                "name":"html",
            },
            "webroot":{
                "path":"./",
                "name":"public",
            },
            "core":{
                "path":"@js",
                "name":"./",
            },
            "bootstrap":{
                "path":"@application",
                "name":"bootstrap",
            },
            "application":{
                "path":"./",
                "name":"server",
            }
        },
    },
    //工作的主目录结构配置
    "project":{
        "path": "./",
        "name": "project",
        "child": {
            "src": {
                "path": "./",
                "name": "src",
            },
            "image":{
                "path": "@src",
                "name": "image",
            },
            "style":{
                "path": "@src",
                "name": "style",
            },
            "theme":{
                "path": "@src",
                "name": "theme",
            },
            "app":{
                "path": "@src",
                "name": "app",
            },
            "view":{
                "path": "@src",
                "name": "view",
            },
            "component":{
                "path": "@src",
                "name": "component",
            },
            "skin":{
                "path": "@src",
                "name": "skin",
            },
        },
    },
};

const syntaxMap={
    'js':'javascript',
}
var globalConfig = defaultConfig;
var systemMainClassModules = [];

//目前支持的语法
const syntax_supported={
    'php':true,
    'node':true,
    'javascript':true
};

const syntax_module_requirements={
    "node":[
        'es.events.PipelineEvent'
    ],
    "php":[
        'es.events.PipelineEvent'
    ],
}

//语法构建器
const SyntaxBuilder={

    'javascript':function(config, descriptions, default_bootstrap_class, onlyClient, resovle, reject, doneCallback )
    {
        Utils.info("building javascript start...");

        var index = 0;
        const len = descriptions.length;
        const chunkFlag= config.script_part_load && descriptions.length > 1;
        const buildEach=function(index, callback, resovle, reject)
        {
            const bootstrap = descriptions[ index ];
            Compile("javascript", Maker.makeModuleByName( bootstrap.fullclassname ) , bootstrap, config);
            callback(resovle, reject);
        };

        //编译完成后执行
        const completed = function(resovle, reject)
        {
            const dependencies = Compile.getDependencies( config, descriptions, 'javascript' );
            const default_bootstrap = default_bootstrap_class ? Maker.localDescriptions[  default_bootstrap_class ] : null;
            const build = new jsBuilder( config, chunkFlag );
            const callback=(results,error)=>{

                if( error )
                {
                    doneCallback( null, error, build);

                }else
                {
                    if( onlyClient !== true )
                    {
                        doneCallback({
                            "client":dependencies,
                            "server":results,
                            "builder":build
                        });

                    }else
                    {
                        doneCallback( dependencies, null, build ); 
                    }
                }
            }

            const makeService = ()=>{

                if( onlyClient !== true )
                {
                    const providerModuleList = [];
                    const providers = {};

                    descriptions.forEach( (module)=>{
                        const modules = Compile.getAllModules( module, null, null, "javascript" );
                        const usedModules = Compile.getUsedModules( modules, "javascript" );
                        Object.assign(providers, getServiceProvider(config,usedModules).providers );
                    });

                    createServiceProvider(config, providers );
                    Utils.forEach(providers,(item,fullclassname)=>{
                        const module = Maker.loadModuleDescription(config.service_provider_syntax, fullclassname, config, null, null,true);
                        providerModuleList.push( module );
                    });

                    //编译服务类
                    if( providerModuleList.length > 0 )
                    {
                        SyntaxBuilder[config.service_provider_syntax](
                            config,
                            providerModuleList, 
                            default_bootstrap_class, 
                            true, 
                            resovle,
                            reject,
                            callback 
                        );

                    }else
                    {
                        resovle();
                        callback( [] );
                    }

                }else
                {
                    resovle();
                    callback( dependencies );
                }
            }

            if( config.build_pack )
            {
                build.start( dependencies, default_bootstrap, (err)=>{
                    if( err ){
                        reject(err);
                    }else{
                        makeService();
                    }
                });

            }else
            {
               makeService();
            }
        };

        if( len > 0 )
        {
            var done=function(resovle,reject)
            {
                if(index < len)
                {
                    resovle(function(resovle, reject)
                    {
                        buildEach(index++, done,resovle,reject);
                    });

                }else
                {
                    resovle( completed );
                }
            }
            buildEach(index++, done, resovle, reject);

        }else
        {
            resovle( completed );
        }
    },

    'php':function(config, descriptions, default_bootstrap_class, onlyServer, resovle, reject , doneCallback, clientDependencies )
    {
        Utils.info("building php start...");
        //加载js文件的路径
        var js_load_path = PATH.relative( Utils.getBuildPath(config, 'build.webroot') , Utils.getBuildPath(config, 'build.js') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
        //加载css文件的路径
        var css_load_path = PATH.relative( Utils.getBuildPath(config, 'build.webroot') , Utils.getBuildPath(config, 'build.css') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
        //所有引用模块
        var allModules = [];
        //已经使用的模块
        var usedModules = [];
        //以加载文件的哈希对象
        var hash = {};
        //命名空间映射关系
        var hashMap={};
        //编译模块
        Utils.forEach(descriptions, function (module) {
            Compile("php", Maker.makeModuleByName(module.fullclassname), module, config);
            Compile.getAllModules(module, allModules, hash, "php");
        });

        syntax_module_requirements.php.map( (name)=>{
            if( !Maker.getLoaclAndGlobalModuleDescription( name  ) )
            {
                const module = Maker.loadModuleDescription("php", name, config, name );
                Compile("php", Maker.makeModuleByName(module.fullclassname), module, config);
                Compile.getAllModules(module, allModules, hash, "php");
            }
        });

        //获取所有使用的模块
        usedModules = Compile.getUsedModules( allModules, "php" );

        //服务提供者的路由配置
        var routeMapping = Compile.getServiceRoutes( usedModules );

        //需要生成的本地模块
        var localModules = usedModules.filter(function (e)
        {
            if( e.nonglobal === true ){
               return Compile.isConformRunPlatform(e,"php");
            }
            return false;

        });

        //php构建器
        var phpBuilder = require( '../php/builder.js');

        //使用的全局类模块
        var requirements = usedModules.filter(function (a) {
             return !(a.nonglobal === true);
        });

        //全局类模块名
        requirements= requirements.map(function (a) {
              return a.type;
        });

        const callback=(results, error, clientBuild )=>{

            if( error )
            {
                doneCallback( null, error);

            }else
            {
                const dependencies = Compile.getDependencies( config, descriptions, 'php');
                const scripts = descriptions.map( (module)=>{
                    if( module.isApplication )
                    {
                        const output = clientBuild.outputMap.get( module ) || [];
                        const script = output.filter( (item)=>{ return item.suffix ===".js" });
                        const css = output.filter( (item)=>{ return item.suffix ===".css" });
                        const require = output.filter( (item)=>{ return item.require }).map((item)=>item.path);
                        return {
                            "scripts":require.concat( script, css ).map( item=>{
                                return Utils.getLoadFileRelativePath(config, item.path );
                            }),
                            "name":module.fullclassname
                        };
                    }
                }).filter( value=>!!value );

               const loadScripts = {};
               scripts.forEach( (item)=>{
                   loadScripts[ item.name ] = item.scripts;
               });

                //生成php文件
                phpBuilder( config.build_path, config, localModules, requirements,{
                    "NAMESPACE_HASH_MAP":hashMap,
                    "SERVICE_ROUTE_LIST": routeMapping,
                    "BOOTSTRAP_CLASS_FILE_NAME":"Bootstrap.php",
                    "VERSION":config.makeVersion,
                    "ORIGIN_SYNTAX":config.originMakeSyntax,
                    "JS_LOAD_PATH":js_load_path,
                    "CSS_LOAD_PATH":css_load_path,
                    "LOAD_SCRIPTS":JSON.stringify(loadScripts),
                    "COMMAND_SWITCH":config.command_switch,
                    "STATIC_URL_PATH_NAME":config.static_url_path_name,
                    "DEFAULT_BOOTSTRAP_ROUTER_PROVIDER":config.default_bootstrap_router_provider,
                    "BOOTSTRAP_CLASS_PATH":Utils.getRelativePath(
                        Utils.getBuildPath(config,"build.webroot"),
                        Utils.getBuildPath(config,"build.bootstrap")
                    ),
                    "EASESCRIPT_ROOT":Utils.getRelativePath(
                        Utils.getBuildPath(config,"build.bootstrap"),
                        config.build_path
                    ),
                });

                if( onlyServer !== true )
                {
                    doneCallback({
                        "client":results,
                        "server":dependencies
                    });

                }else
                {
                    doneCallback( dependencies );
                }
            }
        }

        //构建需要生成的js文件
        if( onlyServer !==true && descriptions.length > 0 )
        {
            SyntaxBuilder.javascript(config, descriptions, default_bootstrap_class, true, resovle, reject, callback );

        }else
        {
            resovle();
            callback();
        }
    },
    'node':function(config, descriptions, default_bootstrap_class, onlyServer, resovle, reject , doneCallback )
    {
        Utils.info("building node start...");
        //加载js文件的路径
        var js_load_path = PATH.relative( Utils.getBuildPath(config, 'build.webroot') , Utils.getBuildPath(config, 'build.js') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
        //加载css文件的路径
        var css_load_path = PATH.relative( Utils.getBuildPath(config, 'build.webroot') , Utils.getBuildPath(config, 'build.css') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
        //所有引用模块
        var allModules = [];
        //已经使用的模块
        var usedModules = [];
        //以加载文件的哈希对象
        var hash = {};
        //命名空间映射关系
        var hashMap={};
        //编译模块
        Utils.forEach(descriptions, function (module) {
            Compile("node", Maker.makeModuleByName(module.fullclassname), module, config);
            Compile.getAllModules(module, allModules, hash, "node");
        });

        syntax_module_requirements.node.map( (name)=>{
            if( !Maker.getLoaclAndGlobalModuleDescription( name  ) )
            {
                const module = Maker.loadModuleDescription("node", name, config, name );
                Compile("node", Maker.makeModuleByName(module.fullclassname), module, config);
                Compile.getAllModules(module, allModules, hash, "node");
            }
        });

        const dependencies = Compile.getDependencies( config, descriptions, 'node');

        //获取所有使用的模块
        usedModules = Compile.getUsedModules( allModules, "node" );

        if( !onlyServer )
        {
            makeServiceProvider(config, usedModules, hash, "node");
        }
        
        const callback=(results,error, clientBuild)=>{

            if( error )
            {
                doneCallback( null, error);

            }else
            {
                //路由配置
                var routeMapping = Compile.getServiceRoutes( usedModules );
                var builder = require( '../node/builder.js');

                const scripts = descriptions.map( (module)=>{
                    if( module.isApplication )
                    {
                        const output = clientBuild.outputMap.get( module ) || [];
                        const script = output.filter( (item)=>{ return item.suffix ===".js" });
                        const css = output.filter( (item)=>{ return item.suffix ===".css" });
                        const require = output.filter( (item)=>{ return item.require }).map((item)=>item.path);
                        return {
                            "scripts":require.concat( script, css ).map( item=>{
                                return Utils.getLoadFileRelativePath(config, item.path );
                            }),
                            "name":module.fullclassname
                        };
                    }
                }).filter( value=>!!value );

               const loadScripts = {};
               scripts.forEach( (item)=>{
                   loadScripts[ item.name ] = item.scripts;
               });

                builder(config, usedModules, {
                    "NAMESPACE_HASH_MAP":hashMap,
                    "SERVICE_ROUTE_LIST":routeMapping,
                    "BOOTSTRAP_CLASS_FILE_NAME":"index.js",
                    "VERSION":config.makeVersion,
                    "ORIGIN_SYNTAX":config.originMakeSyntax,
                    "JS_LOAD_PATH":js_load_path,
                    "CSS_LOAD_PATH":css_load_path,
                    "LOAD_SCRIPTS":JSON.stringify(loadScripts),
                    "COMMAND_SWITCH":config.command_switch,
                    "STATIC_URL_PATH_NAME":config.static_url_path_name,
                    "DEFAULT_BOOTSTRAP_ROUTER_PROVIDER":config.default_bootstrap_router_provider,
                    "BOOTSTRAP_CLASS_PATH":Utils.getRelativePath(
                        Utils.getBuildPath(config,"build.webroot"),
                        Utils.getBuildPath(config,"build.bootstrap")
                    ),
                    "EASESCRIPT_ROOT":Utils.getRelativePath(
                        Utils.getBuildPath(config,"build.bootstrap"),
                        config.build_path
                    ),
                });

                if( onlyServer !== true )
                {
                    doneCallback({
                        "client":results,
                        "server":dependencies
                    });

                }else
                {
                    doneCallback( dependencies ); 
                }
            }
        }

        //构建需要生成的js文件
        if( onlyServer !==true && descriptions.length > 0 )
        {
            SyntaxBuilder.javascript(config, descriptions, default_bootstrap_class, true, resovle, reject, callback );
        }else{
            resovle();
            callback();
        }
    }
};

/**
 * 获取服务提供者清单
 * @param config
 * @returns {Array}
 */
function getServiceProvider(config, allModules)
{
    var providers = {};
    var routes = {};
    var serviceProviderList = allModules.filter(function (e) {
        return !!e.serviceProviderList;
    }).map(function (e) {
        return e.serviceProviderList;
    });

    Utils.forEach(serviceProviderList, function (provider)
    {
        Utils.forEach(provider, function (item) {
            var key = item.provider;
            var provider = providers[key] || (providers[key] = {});
            var param = item.name.match(/\{(.*?)\}/g);
            if (!provider[item.action]) {
                provider[item.action] = {param: param, method: item.method};
            } else if (param && (!provider[item.action].param || provider[item.action].param.length < param.length)) {
                provider[item.action].param = param;
            }
            routes[item.method + ':' + item.bind] = {
                method: item.method,
                alias: item.bind,
                provider: item.provider + "@" + item.action
            };
           (provider[item.action].routes || (provider[item.action].routes = {}))[ item.method + ':' + item.bind ] = routes[item.method + ':' + item.bind];
        });
    });

    return {
        providers:providers,
        routes:routes
    };
}

/**
 * 生成服务提供者语法
 * @param config
 * @returns {Array}
 */
function makeServiceProvider(config, allModules, hash, syntax, hashMap )
{
    var service = getServiceProvider(config, allModules);

    //如果服务不存在则生成
    createServiceProvider(config, service.providers );

    Utils.forEach(service.providers,function (item,fullclassname)
    {
        var module = Maker.loadModuleDescription(syntax, fullclassname, config, null, null,true);
        Compile( syntax , Maker.makeModuleByName(module.fullclassname), module, config);
        Compile.getAllModules( module, allModules, hash );
    });
    return service.routes;
}

/**
 * 生成服务提供者
 * @param config
 * @param provider
 */
function createServiceProvider(config, provider )
{
    Utils.forEach(provider,function (item,name)
    {
        if( Maker.isClassFileExists(name,config) )
        {
            return;
        }

        var package = name.split(".");
        var className = package.pop();
        package = package.join(".");
        var code = ["package ", package, "{\n"];
        code.push( "\timport es.core.Service;\n" );
        code.push( "\tpublic class ", className, " extends Service{\n");
        for(var p in item)
        {
            var param = item[p].param;
            var paramName = [];
            if( param )
            {
                param = param.map(function (val) {
                    val = val.replace(/^\{|\}$/g,'');
                    if( val.indexOf(":") < 0 ){
                        val = val+":*";
                    }
                    paramName.push( val.substr(0, val.indexOf(":") ) );
                    return val;
                });
            }else{
                param = [];
            }

            Utils.forEach(item[p].routes,function (route) {
                code.push("\t\t[Router(method='"+route.method+"',alias='"+(route.alias||p)+"')]\n");
            });

            code.push("\t\tpublic function ", p, "(",param.join(","),"){\n");
            if( item[p].method ==="get" ){
                if( paramName.length > 0 ){
                    code.push("\t\t\tvar result:* = this.query('select * from "+className.toLowerCase()+"  where "+paramName.join("=? and")+" = ?', ["+paramName.join(",")+"]);\n");
                }else {
                    code.push("\t\t\tvar result:* = this.query('select * from " + className.toLowerCase() + " limit 100');\n");
                }
                code.push("\t\t\treturn this.success(result);\n");
            }else if(item[p].method ==="put" || item[p].method ==="post"){
                code.push("\t\t\tvar result:Boolean = true;\n");
                code.push("\t\t\treturn this.success(result);\n");
            }else if(item[p].method ==="delete" )
            {
                code.push("\t\t\tvar result:Boolean = true;\n");
                code.push("\t\t\treturn this.success(result);\n");
            }
            code.push("\t\t}\n");
        }
        code.push( "\t}\n");
        code.push( "}");

        var dir =  Utils.mkdir( PATH.resolve(config.project_path, package) );
        var filepath = PATH.resolve( dir, className + config.suffix );
        Utils.setContents(filepath, code.join(""));
    });
}

/**
 * 构建工程结构
 * @param dir
 * @param base
 */
function buildProject(dir, base)
{
    var dirpath = base;
    if( dir.__build !== true )
    {
        var dirpath = PATH.isAbsolute(dir.path) ? PATH.resolve(dir.path, dir.name) : PATH.resolve(base, dir.path, dir.name);
        if (!fs.existsSync(dirpath)) {
            //dirpath = Utils.mkdir(dirpath);
            if (typeof dir.bootstrap === "string" && dir.syntax) {
                //引用一个模板
                var file = PATH.resolve(config.root_path, dir.syntax, dir.bootstrap + dir.suffix);
                if (Utils.isFileExists(file)) {
                    fs.linkSync(file, PATH.resolve(dirpath, dir.bootstrap + dir.suffix));
                }
            }
        }
        dir.path = dirpath.replace(/\\/g, '/');
        dir.name = PATH.basename(dirpath);
        dir.__build = true;
    }

    if (dir.child)
    {
        for (var i in dir.child)
        {
            if( dir.child[i].path.charAt(0) === "@" )
            {
                var refName = dir.child[i].path.substr(1);
                if( !dir.child.hasOwnProperty( refName ) ){
                    throw new ReferenceError("Invalid reference path name for '"+refName+"'");
                }
                buildProject(dir.child[ refName ], dirpath);
                dir.child[i].path = dir.child[ refName ].path;
            }
            buildProject(dir.child[i], dirpath);
        }
    }
}

function configToJson( config , depth )
{
    var tab = new Array( depth+1 );
    tab = tab.join("\t");
    var type = config instanceof Array ? 'array' : typeof config;
    if( type ==="string" )return tab+config;
    var item = [];
    for( var p in config )
    {
        if( p==="__build" )continue;
       
        if( config[p]+""=="[object Object]" || config[p] instanceof Array )
        {
            item.push( tab+'"'+p+'":'+configToJson( config[p] , depth+1 ) );
        }else
        {
            var val = typeof config[p] === "string" ? config[p].replace(/\\/g, '/') : config[p];
            if (type === 'array') {
                item.push('"' + val + '"');
            } else if( typeof val ==="string" ) {
                item.push(tab + '"' + p + '":"'+val + '"');
            } else if(val != null ) {
                item.push(tab + '"' + p + '":'+val);
            }
        }
    }

    tab = new Array( depth-1 );
    tab = tab.join("\t");
    if( type ==='array' )
    {
        return '['+item.join(",")+']';
    }
    return '{\n'+item.join(",\n")+'\n'+tab+'}';
}


/**
 * 获取配置信息
 * @param config
 * @returns {*}
 */
function createConfigure(config)
{
    if( config.__$build__ )
    {
        return config;
    }

     //合并默认属性
    config = Object.assign(defaultConfig, config || {});

    //默认构建的语法
    config.syntax = syntaxMap[ config.syntax ] || config.syntax;

    var root_path = PATH.resolve(__dirname,'../');

     //工程目录
    var project_path = config.project_path;
    if( !PATH.isAbsolute( project_path ) )
    {
        project_path = PATH.resolve( config.project_path );
        if( !fs.existsSync(project_path) )
        {
            Utils.mkdir( project_path );
        }
    }

    //构建目录
    var build_path = config.build_path;

    //默认配置文件
    var makefile = PATH.resolve( project_path ,'.esconfig');
    if( !Utils.isFileExists( makefile ) || config.clean===true )
    {
        if( config.serverEnable )
        {
            config.enable_webroot = true;
        }

        //编译器的路径
        config.root_path = root_path;

        //合并默认配置文件
        if( config.config_file )
        {
            Utils.merge(config, buildConfig , require( config.config_file ) );
        }else {
            Utils.merge(config, buildConfig );
        }

        //当前工程项目路径
        config.project_path = project_path;
        config.project.path = project_path;
        config.project.name = PATH.basename(project_path);
        config.project.__build=true;
        buildProject(config.project,project_path);

        //构建输出目录
        config.build.path = build_path;
        config.build.name = "";
        buildProject(config.build, config.project_path );
        config.build_path = config.build.path;

        //主题配置文件路径
        if( config.theme_file_path && !PATH.isAbsolute( config.theme_file_path ) )
        {
            config.theme_file_path = PATH.resolve( config.workspace, config.theme_file_path );
        }

        //指定组件皮肤样式配置文件
        if( config.skin_style_config )
        {
            var dataitem={};
            Utils.forEach(  config.skin_style_config, function (item,key) {
                if( item.slice(-5)===".conf" )
                {
                    if( !PATH.isAbsolute( item ) )
                    {
                        item = PATH.resolve(config.workspace, item);
                    }
                    if( !Utils.isFileExists(item) )
                    {
                        throw new ReferenceError( item+" is not exists.");
                    }
                    var fileconfig = JSON.parse( Utils.getContents(item) );
                    if( fileconfig ){
                        dataitem = Utils.merge(true,dataitem,fileconfig);
                    }
                }else{
                    dataitem[key]=item;
                }
            });
            config.skin_style_config = dataitem;
        }

        //系统类库路径名
        //在加载类文件时发现是此路径名打头的都转到系统库路径中查找文件。
        //config.system_core_class={
           // "iteratorClass":"es.interfaces.IListIterator",
        //};

        //系统必需要加载的类
        //var system_main_class = [];
        //for( var scc in config.system_core_class )
        //{
            //system_main_class.push( config.system_core_class[scc] );
        //}
        //config.system_require_main_class = system_main_class;

        //构建应用的目录名
        config.build_application_name = Utils.getBuildPath(config,"build.application","name");

        delete config.globals;

        //生成一个默认的配置文件
        Utils.setContents(makefile, configToJson( config , 1 ) );

    }else
    {
        config = JSON.parse( Utils.getContents( makefile ) );
    }

    if( !config.workspace )
    {
        config.workspace = config.project.child.src.path;
    }

    //工作空间目录
    if( !PATH.isAbsolute(config.workspace) )
    {
        config.workspace = PATH.join(project_path, config.workspace);
    }

    if( !fs.existsSync( config.workspace ) )
    {
        Utils.mkdir( config.workspace );
    }

    //需要引用的全局类
    requirements = config.requirements || (config.requirements = {});

     //浏览器中的全局模块
     if( config.browser )
     {
         var browser = require('./browser.js');
         Utils.merge(globals,browser);
     }

    config.originMakeSyntax = config.syntax;
    
     config.globals=globals;
     config.debug = config.debug ? 'on' : 'off';
     //当前支持构建的语法
     config.syntax_supported = syntax_supported;
      //服务提供者
     config.ServiceProviderList = {};
     //编译版本号
     config.makeVersion = (new Date()).getTime();
     //使用外部的库类
     if( config.library )
     {
         Utils.forEach(config.library, function (name)
         {
             config.globals[ name ] = {
                 "id":"class",
                 "type":name,
                 "proto":"*",
                 "static":"*",
                 "notCheckType":true,
                 "notLoadFile":true
             };
         });
     }

    //是否支持指定的语法
    if( syntax_supported[ config.syntax ] !== true )
    {
        Utils.error("Syntax "+config.syntax +" is not supported.");
    }

    config.context = compileContext;
    if( config.reserved )
    {
        config.reserved = reserved.concat( config.reserved );
    }else{
        config.reserved = reserved;
    }

     //将上下文中引用的变量设为受保护的关键字
    for (var c in config.context )
    {
        if( c !=='defineModuleMethod' && config.reserved.indexOf( config.context[c] )<0 )
        {
            if( config.context[c] !== "Context" )
            {
               config.reserved.push( config.context[c] );
            }
        }
    }
    config.project_path = config.workspace;
    config.__$build__ = true;
    globalConfig = config;
    return config;
}

 //获取需要编译的文件,支持目录或者文件路径
function getMakeFiles( config, bootstraps)
{
    var makefiles = [];
     bootstraps.forEach(function(file)
     {
         file = (PATH.isAbsolute( file ) ? file : PATH.resolve( config.project_path , file.replace(".","/") ) ).replace(/\\/g,'/');
         //如果定要编译的目录下的文件
         if( Utils.isDir( file ) )
         {
             var basedir = file;
             makefiles = makefiles.concat( Utils.getDirectoryFiles( file ).filter(function (a) {
                 return PATH.extname(a) === config.suffix;
             }));
             makefiles = makefiles.map(function(file){
                 return basedir+"/"+file;
             });
 
         }else
         {
             //如果是指定文件
             if( !Utils.isFileExists( file ) )
             {
                 file+=config.suffix;
             }
             makefiles.push( file );
         }
    });
    return makefiles;
}


function pathToClassName( file, config )
{
    file = file.replace(/\\/g,'/');
    var classname = file;
    if( file.indexOf( config.workspace.replace(/\\/g,'/') )===0 )
    {
        classname = PATH.relative( config.workspace, file );

    }else if( file.indexOf( config.system_global_path.replace(/\\/g,'/') )===0 )
    {
        classname = PATH.relative( config.system_global_path, file );
    }
    else if( file.indexOf( config.system_lib_path.replace(/\\/g,'/') )===0 )
    {
        classname = PATH.relative( config.system_lib_path, file );
    }
    const info = PATH.parse( classname );
    const dir =  info.dir ? info.dir.replace(/\\/g,'/').split("/") : [];
    return {
        file:file,
        suffix:info.ext,
        name:dir.concat( info.name ).join(".")
    };
}

function makeClassModuleDescriptior(config, makefiles)
{
     //入口文件列表,获取源码信息
     var bootstrapClassList = config.bootstrap_class_list = [];
     var i = 0;
     var len = makefiles.length;
     var data={
         "inherits":[],
         "modules":[]
     };

     for(;i<len;i++)
     {
         var fileinfo = pathToClassName(makefiles[i], config)
         if( data.inherits.indexOf( fileinfo.name ) < 0 )
         {
            bootstrapClassList.push( fileinfo.name );
            var desc = Maker.loadModuleDescription(config.syntax,  fileinfo.name, config,  fileinfo.file );
            data.modules.push( desc );
            if(desc.nonglobal && desc.inherit )
            {
                data.inherits.push( desc.import.hasOwnProperty(desc.inherit) ? desc.import[ desc.inherit ] : desc.inherit );
            }
         }
     }
     return data;
}

function getApplicationModules(config, modules, inherits, bootstrap_class)
{
     //继承 es.core.Application 的属于入口文件
     return modules.filter(function (a)
     {
         //如果这个类被子类继承过证明也不是入口文件
         if( inherits.indexOf( a.fullclassname ) >=0 )
         {
             return false;
         }
         //是否属性于应用入口类
         var flag = Maker.checkInstanceOf(a,"es.core.Application");
         if( flag )
         {
             //默认指定第一个为入口类
             if( bootstrap_class[2] === null )
             {
                 bootstrap_class[2] = a.fullclassname;
             }
 
             //默认index为入口类
             if( a.classname.toLowerCase() ==="index" )
             {
                 bootstrap_class[1] = a.fullclassname;
             }

             //否则为指定的入口类
             if( a.fullclassname === config.default_bootstrap_class )
             {
                 bootstrap_class[0] = a.fullclassname;
             }
 
             //如果没有指定路由
             if( !a.defineMetaTypeList.Router )
             {
                 var defaultMethod = "index";
                 if( !(a.proto.hasOwnProperty("index") && a.proto.index.id === "function" && a.proto.index.privilege==="public")  )
                 {
                     defaultMethod = "";
                     for(var p in a.proto )
                     {
                         var item = a.proto[p];
                         if( item.id ==="function" && item.privilege==="public" )
                         {
                             defaultMethod = p;
                             break;
                         }
                     }
                 }
                 
                var metatype = a.defineMetaTypeList.Router={
                     'type':"Router",
                     'param':{
                         default:defaultMethod,
                         method:"get",
                         alias:"/"+a.fullclassname.replace(/\./g,'/'),
                         isModule:true,
                         provider:a.fullclassname + '@' + defaultMethod
                     }
                };
                a.moduleRouterProvider = a.defineMetaTypeList.Router.param;


                var controllerRouteList = a.controllerRouteList || (a.controllerRouteList={});
                var key =  "get:" +metatype.param.alias;

                //是否已经存在
                if( controllerRouteList[ key ] && !a.isModify )
                {
                    throw TypeError( 'The "'+metatype.param.alias+'" already bound to '+metatype.param.method+' request.');
                }

                //加入到全局哈希值中
                if( Compile.global_route_unique_hash[ key ] && !a.isModify )
                {
                    throw TypeError( 'The "'+metatype.param.alias+'" already bound to '+Compile.global_route_unique_hash[ key ] );
                }
                Compile.global_route_unique_hash[ key ] = metatype.param.provider;
                controllerRouteList[ key ] = Utils.merge({},metatype.param);
             }
         }
         a.isApplication = flag;
         return flag;
     });
}

function getDefaultBootstrapModule( config, assignBootstrapClass, optionBootstrapClass )
{
    //默认入口类
    if( !assignBootstrapClass )
    {
        assignBootstrapClass = optionBootstrapClass.filter(function (a) {
            return !!a;
        })[0];
    }

    //如果指定默认的入口类
    if( assignBootstrapClass && Maker.localDescriptions[  assignBootstrapClass ] )
    {
        var bootstrapClassModule = Maker.localDescriptions[  assignBootstrapClass ];
        //如果有继承Application就必须定义默认的路由方法
        if( Maker.checkInstanceOf(bootstrapClassModule,"es.core.Application") )
        {
            config.default_bootstrap_router_provider=assignBootstrapClass;
            if( bootstrapClassModule.defineMetaTypeList.Router && bootstrapClassModule.defineMetaTypeList.Router.param.default )
            {
                config.default_bootstrap_router_provider=assignBootstrapClass+"@"+bootstrapClassModule.defineMetaTypeList.Router.param.default;
            }
        }
    }
    return assignBootstrapClass;
}

function single(config, invoke, filename, syntax, output)
{
    try{

        minimal(config);
        var info =  pathToClassName(filename, config);
        var desc = Maker.loadModuleDescription(syntax, info.name, config, info.file);
        Compile(syntax, Maker.makeModuleByName( desc.fullclassname ) , desc, config);
        if( output  )
        {
            const suffix = {
                "node":".js",
                "php":".php", 
            }
            const builder = require( `../${syntax}/builder.js` );
            builder.output( config , [desc], suffix[syntax] );
        }
        Utils.info('Make done.');
        const dependencies = Compile.getDependencies( config, [desc], syntax );
        invoke( dependencies[0] );

    }catch(e)
    {
        onerror( config , e, false);
        invoke(null, e);
    } 
}

function completion(config, filename, syntax)
{
    minimal(config);
    if( PATH.isAbsolute(filename) )
    {
        var info =  pathToClassName(filename, config);
        var desc = Maker.loadModuleDescription(syntax, info.name, config, info.file);
        Compile(syntax || config.syntax, Maker.makeModuleByName( desc.fullclassname ) , desc, config);
        return desc;

    }else
    {
        var desc = Maker.loadModuleDescription(syntax, filename, config); 
        Compile(syntax || config.syntax, Maker.makeModuleByName( desc.fullclassname ) , desc, config);
        return desc;
    }
}


function rebuild(config ,filename, invoke)
{
    try{
        minimal(config);
        var info =  pathToClassName(filename, config);
        var old = Maker.localDescriptions[ info.name ];
        var desc = Maker.loadModuleDescription(config.syntax, info.name, config, info.file);
        if( desc )
        {
            if( old )
            {
                if( old.isApplication )
                {
                    desc.isApplication = true;
                }
            }
           
            var prom = new Promise(function (resovle, reject)
            {
                try{
                    SyntaxBuilder[ config.syntax ]( config , [desc], null, false, resovle, reject, invoke);
                }catch(e){
                    reject(e);
                }
    
            }).catch(function(e)
            {
                onerror(config, e);
                invoke(null, e)
            });
    
            var step = function( next )
            {
                if( next )
                {
                    return (new Promise(function(resovle, reject)
                    {
                        try{
                            next(resovle,reject);
                        }catch(e){
                            reject(e);
                        }
    
                    })).then( step ).catch(function(e)
                    {
                        onerror( config, e)
                    });
    
                }else
                {
                    Utils.info('Make done.');
                }
            }
            prom.then(step);
        }

    }catch(e)
    {
        onerror( config , e, false);
        invoke(null, e);
    } 
}

function getBootstrap(config)
{

    var project_path = config.project_path;
    var bootstrap_files= config.bootstrap ? config.bootstrap : project_path;
    if( typeof bootstrap_files === "string" )
    {
        bootstrap_files=[ bootstrap_files ];
    }

    const makefiles = getMakeFiles( config, bootstrap_files);

    //入口文件列表,获取源码信息
    const moduleDescriptions=makeClassModuleDescriptior(config, makefiles);
    var descriptions=moduleDescriptions.modules;
    var inheritClass=moduleDescriptions.inherits;

    //默认入口类优先级 ==> 手动指定，类文件名为index, 第一个类
    var options_bootstrap_class=[null,null,null];

    //继承 es.core.Application 的属于入口文件
    var app_descriptions = getApplicationModules(config, descriptions, inheritClass, options_bootstrap_class);

    //有指明构建应用程序
    if( config.build_mode === "app" && app_descriptions.length < 1 )
    {
        throw new ReferenceError("Not found bootstrap Application."); 
    }

    //至少有一个应用入口
    if( app_descriptions.length > 0  )
    {
        descriptions = app_descriptions;

    }else
    {
        //片段文件代码不能分开加载 
        config.script_part_load = false;
        if( descriptions.length > 1 )
        {
            if( !config.default_bootstrap_class )
            {
                throw new ReferenceError("Need to specify the default bootstrap class name."); 
            }
            descriptions=[ Maker.localDescriptions[ config.default_bootstrap_class ] ];
        }
    }
    
     //默认入口类
     const default_bootstrap_class = getDefaultBootstrapModule(config, config.default_bootstrap_class, options_bootstrap_class );

     descriptions.forEach(module=>{
         
         if( module.fullclassname === default_bootstrap_class )
         {
             module.isDefaultBootstrapModule = true;
         }
     });
     return descriptions;
}

/**
 * 开始生成代码片段
 */
function make( config , doneCallback)
{
    if( make.making ===true )
    {
        return;
    }

    //标记构建正在进行中
    make.making = true;

    minimal(config);

    //完成后回调
    const completed = function(results,error)
    {
        make.making = false;
        if( typeof doneCallback === 'function' )
        {
            doneCallback(results,error);

        }else if(error)
        {
            onerror(config ,error);
        }else
        {
            Utils.info('Make path : '+config.build_path );
        }
        Utils.info('Make completed.');
    };

    config = createConfigure( config );
    var descriptions = [];
    try
    {
        descriptions = getBootstrap(config);
    }catch(e)
    {
        return completed(null, e);
    }

    //默认入口类
    const default_bootstrap_class = descriptions.filter(module=>{
        return !!module.isDefaultBootstrapModule;
     }).map( (module)=>{
         return module.fullclassname;
     });

    //开始构建
    if( descriptions.length > 0 )
    {
        Utils.info('Making starting ...');
        var prom = new Promise(function (resovle, reject)
        {
            try{
                SyntaxBuilder[ config.syntax ]( config , descriptions, default_bootstrap_class[0], false, resovle, reject, completed);
            }catch(e){
                reject(e);
            }

        }).catch(function(e)
        {
            completed(null, e )
        });

        var step = function( next )
        {
            if( next )
            {
                return (new Promise(function(resovle, reject)
                {
                    try{
                        next(resovle,reject);
                    }catch(e){
                        reject(e);
                    }

                })).then( step ).catch(function(e)
                {
                    completed(null, e );
                });
            }
        }
        prom.then(step);

    }else
    {
        completed(null, new ReferenceError("Not found bootstrap files.") );
    }
}

function onerror( config , e, flag)
{
    if( config.debug )
    {
        console.error( e );
    }else{
        Utils.error( e.message );
    }
    if( config.on_error_exit && flag !== false )
    {
        process.exit(0);
    }
}

function minimal( config )
{
    if( config.minimal )
    {
        excludeSystemFiles([
            "Error",
            "SyntaxError",
            "ReferenceError",
            "URIError",
            "TypeError",
            "EvalError",
            "RangeError",
            "Function",
            "Console",
            "Symbol",
            "JSON"
        ]);
    }
}

function excludeSystemFiles(arrs)
{
    arrs.forEach( name=>{
        Utils.setExcludeLoadSystemFile( name, Utils.EXCLUDE_GLOBAL );
    });
    return mode;
}

module.exports = {
    single:single,
    build:make,
    rebuild:rebuild,
    createConfigure:createConfigure,
    excludeSystemFiles,
    loader:require.resolve("./loader.js"),
    getBootstrap: getBootstrap,
    compile:Compile,
    maker:Maker,
    completion:completion
};