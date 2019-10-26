const utils = require('../lib/utils.js');
const globals=utils.globals;
const rootPath =  utils.getResolvePath( __dirname );
const path = require("path");
const fs = require("fs");
const url = require('url');
const Less = require('less');
const Maker = require('../lib/maker.js');
const Compile = require('../lib/compile.js');
const uglify = require('uglify-js');

/**
 * 在特定的版本下需要加载的库文件
 */
const library={
    'ie-9':{'Element':'Sizzle.js'}
};

/**
 * 已经构建的系统模块
 */
const makedSystemModules={};

/**
 * 根据指定的版本加载对应的策略文件
 * @type {Array}
 */
function polyfill( config )
{
    var files = utils.getDirectoryFiles( rootPath+'/fix/' );
    var items={};
    for(var i in files )
    {
        var is=true;
        var path = rootPath + '/fix/' + files[i];
        var info = utils.getFilenameByPath(path).split('-', 3);
        if( config.compat_version && typeof config.compat_version === 'object' && config.compat_version.hasOwnProperty( info[1] ) )
        {
            is = info[2].toLowerCase()==="all" || parseFloat( info[2] ) >= parseFloat( config.compat_version[ info[1] ] );
        }
        if(is)
        {
            if( !(items[ info[0] ] instanceof Array) )items[ info[0] ]=[];
            items[ info[0] ].push(path);
        }
    }
    return items;
}


/**
 * 获取指定的文件模块
 * @param filepath
 */
function include(contents, name , filepath, fix, libs, config )
{
    name = utils.getGlobalTypeMap(name)
    if( makedSystemModules[ name ] )
    {
        contents[ name ] = makedSystemModules[ name ];
        return;
    }

    if( utils.excludeLoadSystemFile( name ) || ( config.globals.hasOwnProperty(name) && config.globals[name].notLoadFile===true ) )
    {
        return;
    }

    makedSystemModules[ name ] = {};

    if( !filepath )
    {
        filepath = rootPath + '/system/' + name + '.js';
    }

    var str = '';

    //加载的模块有依赖的第三方库
    if( libs && libs[name] )
    {
        str+= utils.getContents( rootPath+'/vendor/'+libs[name] ) +"\n";
    }

    if( utils.isFileExists(filepath) )
    {     
        var dependencies = [];
        str += utils.getContents( filepath );
        str = str.replace(/\=\s*require\s*\(\s*([\"\'])(.*?)\1\s*\)/g,function(a,b,c){

             var info = path.parse(c);
             include(contents, info.name , null, fix, libs, config );
             dependencies.push( info.name );
             return '=require("'+utils.getRequireIdentifier( config, config.globals[ info.name ] || {type:info.name}, '.js' )+'")';
        });

        if( name ==="Internal" )
        {
            str = str.replace(/\[CODE\[(.*?)\]\]/ig, function (a, b) {
                switch(b){
                    case "ITERATOR_INTERFACE" :
                        return config.iterator_interface;
                }
                return '';
            });
        }

        //加载对应模块的兼容策略文件
        if( fix && fix[name] )
        {
            for( var f in fix[name] )
            {
                str+='\n'+utils.getContents( fix[name][f] );
            }
        }
        
        makedSystemModules[ name ].content = str;
        makedSystemModules[ name ].path = filepath;
        makedSystemModules[ name ].deps = dependencies;
        contents[ name ]=makedSystemModules[ name ];
        return true;

    }else if( globals.indexOf(name) >=0 )
    {
        return true;
    }

    throw new Error(name+' does exists ('+filepath+')');
}


/**
 * 加载系统模板所有需要的类
 * @param config
 * @returns {string}
 */
function loadRequireSystemModuleContents(config,requirements,flag)
{
    var contents = {};
    var fix = polyfill( config );

    /**
     * 需要支持的第三方库文件
     */
    var libs={};
    for(var prop in library)
    {
        var is=config.compat_version==='*' || prop==='*';
        var info = prop.split('-', 2);
        if( !is && config.compat_version && typeof config.compat_version === 'object' && config.compat_version.hasOwnProperty( info[0] ) )
        {
            is = parseFloat( info[1] ) > parseFloat( config.compat_version[ info[0] ] );
        }
        if(is)utils.merge(libs, library[prop]);
    }

    for(var prop in requirements)
    {
        if( flag === true )
        {
            makedSystemModules[ requirements[prop] ] = undefined;
        }
        include(contents, requirements[prop], null, fix, libs, config );
    }
    return contents;

}

/**
 * 加载系统模块内容
 * @param {*} config 
 * @param {*} name 
 */
function loadSystemModuleContentByName(config,name,flag)
{
   name =  utils.getGlobalTypeMap( name );

   if( !makedSystemModules[name] || flag===true )
   {
       loadRequireSystemModuleContents(config,[name], flag );
   }
   return makedSystemModules[name];
}

/**
 * 替换入口模板内容
 * @param {*} content 
 * @param {*} data 
 * @param {*} config 
 */
function replaceContent(content, data, config)
{
    data = data||{};
    content = content.replace(/\[CODE\[(.*?)\]\]/ig, function (a, b) {

        var requireex = b.match(/^REQUIRE_IDENTIFIER\((.*?)\)$/i);
        if( requireex  )
        {
            var m = config.globals[ requireex[1] ];
            if( !m && requireex[1] ==="Internal" ){
                m = {
                    type:requireex[1]
                };
            }
            return utils.getRequireIdentifier(config, m || {type:requireex[1]} , m ? '.js' : '.es' )
        }

        switch ( b )
        {
            case "SERVICE_ROUTE_LIST" :
                return makeServiceRouteList( data["SERVICE_ROUTE_LIST"]||{});
            case "VIEW_HTML" :

                var html = [];

                if( data.BASE_STYLE_FILE ){
                    html.push(`<link rel="stylesheet" href="${data.BASE_STYLE_FILE}"></link>`);
                }

                if( data.APP_STYLE_FILE ){
                    html.push(`<link rel="stylesheet" href="${data.APP_STYLE_FILE}"></link>`);
                }

               if( data.REQUIREMENTS )
               {
                    data.REQUIREMENTS.sort( (item)=>item.suffix ===".css" ? -1 : 0 ).forEach( (item)=>{
                        switch( item.suffix )
                        {
                            case '.css' :
                                html.push(`<link rel="stylesheet" href="${item.path}"></link>`);
                            break;
                            case '.js' :
                                html.push(`<script type="text/javascript" src="${item.path}"></script>`);
                            break;
                        }
                    });
               }

               if( data.BASE_SCRIPT_FILE )
               {
                   html.push(`<script type="text/javascript" src="${data.BASE_SCRIPT_FILE}"></script>`);
               }

               if( data.APP_SCRIPT_FILE )
               {
                   html.push(`<script type="text/javascript" src="${data.APP_SCRIPT_FILE}"></script>`);
               }

               if( data.DEFAULT_ROUTER )
               {
                   html.push(`<script>window["${data.HANDLE}_HTTP_DEFAULT_ROUTE"]="${data.DEFAULT_ROUTER}";</script>`);
               }

               return html.join("\n\t");

            break;
        }
        return typeof data[b] !== "undefined" ? data[b] : "null";
    });
    return content;
}

/**
 * 生成服务路由清单
 * @param {*} serviceRouteList 
 */
function makeServiceRouteList( serviceRouteList )
{
    var items = {};
    utils.forEach(serviceRouteList,function (item) {
        var obj = items[ item.method ] || (items[ item.method ] = []);
        var name = item.alias;
        obj.push("\t\t\""+name.replace(/^\//,'').toLowerCase()+"\":\""+item.provider+"\"");
    });

    var bind=[];
    utils.forEach(items,function (item,method) {
        bind.push( "\n\t\""+method+"\":{\n"+item.join(",\n")+'\n\t}' );
    });
    return '{' + bind.join(",") +'\n}';
}

/**
 * 构建模板内容为json数据格式
 * @param {*} modules 
 * @param {*} config 
 */
function buildModuleToJsonString(config, modules)
{
    const loaded = {};
    const loadSystemModuleFactory = function(name)
    {
        return loadSystemModuleContentByName(config, name);
    }
    const getModuleIdentifier=function( module, suffix )
    {
        return utils.getRequireIdentifier(config, module, suffix );
    }
    const make = function( modules )
    {
        return modules.map(function (e) 
        {
            var name = getModuleIdentifier(e, e.nonglobal ? '.es' : '.js');
            if( loaded[ name ] ){
                return null;
            }
            loaded[ name ] = true;
            if( e.nonglobal )
            {
                return '\n\n/***** Class '+name+' *****/\n\n"'+name+"\": function(module,require){\n"+e.makeContent['javascript']+"\n}";

            }else if( e.type )
            {
                if( e.isImportMetatype )
                {
                    if( e.path && fs.existsSync(e.path) )
                    {
                        return '\n\n/***** external '+name+' *****/\n\n"'+name+"\": function(module,require){\nvar exports = module.exports;\n"+(fs.readFileSync( e.path ))+"\n}";
                    }

                }else
                {
                    var data = loadSystemModuleFactory( e.type )
                    if( data )
                    {
                        var deps = [];
                        data.deps.forEach(function(name){
                            if( !loaded[name] ){
                                deps.push( {type:name} );
                            }
                        });

                        var content = [];
                        if( deps.length > 0 )
                        {
                            content = make(deps);
                        }

                        content.push( '\n\n/***** System '+name+' *****/\n\n"'+name+"\": function(module,require){\n"+data.content+"\n}" );
                        return content.join(",");
                    }
                    return null;
                }
            }
            return '\n\n/***** Not found '+name+' *****/\n\n"'+name+"\": function(module,require){\nthrow new Error('Not found "+name+"');\n}";
        }).filter(function(content){ return !!content; });
    }

    return "{"+make(modules).join(",")+"}";
}

/**
 * 生成文件内容
 * @param {*} config 
 * @param {*} classModules 
 * @param {*} loadSystemModuleFactory 
 * @param {*} suffix 
 */
function outputFiles(config, classModules, suffix )
{
    const loadSystemModuleFactory = function(name)
    {
        return loadSystemModuleContentByName(config, name);
    }

    var bulid_path = utils.getBuildPath(config, 'build.js');
    const system_path = utils.mkdir( path.resolve(bulid_path, "system") );
    const corename = config.system_lib_path_name+'.';
    const core_path = utils.getBuildPath(config, 'core');
    const base = path.relative( config.project.path, config.workspace ).replace(/\\/g,'/').replace(/\.\.\//g,'');
    const hash = {};
    const workspace_path = path.resolve(bulid_path, base);
    const emitFile = function(file, content )
    {
        if( !hash[file] )
        {
            hash[file] = true;
            if( content )
            {
                utils.setContents(file, content);
            }
        }
    }
    const emitSystemFile = function( name )
    {
        name = utils.getGlobalTypeMap( name );
        var file = path.join(system_path,name+suffix);
        if( !hash[file] )
        {
            var data = loadSystemModuleFactory( name );
            if( data )
            {
                var deps = data.deps;
                emitFile(file, data.content);
                deps.forEach(function(name)
                {
                    emitSystemFile(name);
                });
            }
        }
    }

    for (var m in classModules)
    {
        var localModule = classModules[m];
        if( localModule.nonglobal  )
        {
            var content = localModule.makeContent ? localModule.makeContent[ 'javascript' ] : '';
            if ( content )
            {
                var file = utils.getResolvePath( localModule.fullclassname.slice(0, corename.length )===corename ?  core_path : workspace_path , localModule.fullclassname );
                utils.mkdir( file.substr(0, file.lastIndexOf("/") ) );
              
                emitFile(file+suffix, content);
            }
        }else if( localModule.type )
        {
            if( localModule.isImportMetatype )
            {
                if( localModule.path )
                {
                    if( localModule.path.replace(/\\/g,'/').indexOf(config.project.path.replace(/\\/g,'/') )===0 )
                    {
                        var file = path.join(bulid_path,path.relative(config.project.path, localModule.path));
                        utils.mkdir( path.dirname(file) );
                        utils.copyfile( localModule.path, file );
                    }else{
                        var info = path.parse(localModule.path);
                        utils.copyfile( localModule.path, path.join(bulid_path,info.name+info.ext));
                    }
                }

            }else
            {
               emitSystemFile( localModule.type );
            }
        }
    }
}

/**
 * 获取默认的样式文件路径
 * @param lessPath
 * @param config
 */
function getCoreStyleFilePath(config)
{
    const lesspath = path.resolve(config.system_style_path, config.system_style_name );
    var loaded = {};
    var files = [
        path.resolve(lesspath,'less',"main.less"),
    ];

    return files.map(function(file)
    {
        file = path.isAbsolute( file ) ? file : path.resolve(lesspath, file);
        if( loaded[file] !==true  )
        {
            loaded[file] = true;
            return file.replace(/\\/g,'/');
        }
        return '';

    }).filter(function(val){
        return !!val;
    });
}

/**
 * 查找指定主题名的样式对象
 * @param styleObject
 * @param name
 * @returns {*}
 */
function findThemeStyleByName(styles, name )
{
    return styles.filter(function (a) {
        var themeName = a.attr.theme || "default";
        return themeName === name;
    });
}

/**
 * 合并样式对象
 * @param styles
 * @param styleObjectAll
 * @returns {string}
 */
function combineThemeStyle( themes, styles, config )
{
    return themes.map(function (a) {

        var content = a.content;
        var file = a.file;
        if( !content && a.attr.file )
        {
            content = utils.trim( utils.getContents( a.attr.file ) );
            file = a.attr.file;
        }

        if( a.attr.combine )
        {
           var results = findThemeStyleByName( styles, a.attr.combine ).map(function (a) {
               return combineThemeStyle( [a], styles, config );
           });
           return content +"\n"+ results.join("\n");

        }else
        {
            return content;
        }

    }).join("\n");
}

const itemRegExp = /@([\w\-]+)\s*:\s*([^;]+)\s*;/;

/**
 * 解析主题配置文件
 * @param content
 * @returns {{}}
 */
function parseConfigFile( content )
{
    var items = {};
    var result;
    while ( result = itemRegExp.exec(content) )
    {
        items[ result[1] ] = result[2];
        content = content.substr( result.index + result[2].length );
    }
    return items;
}

//主题基本配置文件
var theme_base_config = null;

/**
 * 合并主题配置文件
 * @param lesspath
 * @param file
 * @param config
 * @returns {*}
 */
function getThemeConfig( config )
{
    const theme = config.theme;
    const lesspath = path.resolve(config.system_style_path, config.system_style_name );
    var base = theme_base_config;
    if( base===null )
    {
        base = path.resolve(lesspath, './less/variables.less');
        if( !utils.isFileExists(base) )
        {
            throw new ReferenceError("Missing less theme file for '"+base+"'");
        }
        base = parseConfigFile( utils.getContents( base ) );
        base.theme = theme;
        theme_base_config = base;
    }

    //如果有指定主题
    if( theme )
    {
         var file = config.theme_file_path;
         if( file && !path.isAbsolute(file) )
         {
             file = path.resolve( config.project_path, file);
         }

         if( utils.isFileExists(file) )
         {
             var stat = fs.statSync( file );
             if( stat.isDirectory() )
             {
                 //以文件名来区分
                 file = path.resolve( file, theme+".less");
                 if( utils.isFileExists(file)  )
                 {
                    Object.assign( base, parseConfigFile( utils.getContents( file ) ) );
                 }else{
                    utils.warn( " Not found theme file for '"+ file +"'" );
                 }

             }else
             {
                 Object.assign( base, parseConfigFile( utils.getContents( file ) ) )
             }

         }else
         {
             utils.warn( " Not found theme file for '"+ file +"'" );
         }
     }
     return base;
}


/**
 * 获取指定皮肤模块的所有样式内容
 * @param modules
 * @param config
 * @returns {*|{type, id, param}|{}|Array}
 */
function makeAllModuleStyleContent(config,modules)
{
    var style = modules.map(function (m)
    {
        var e = "";
        //是否有指定样式文件
        if( config.skin_style_config && config.skin_style_config.hasOwnProperty(m.fullclassname) )
        {
            var stylefile = config.skin_style_config[ m.fullclassname ];
            if( !path.isAbsolute(stylefile) )
            {
                stylefile = path.resolve( config.project_path, stylefile );
            }
           
            e = utils.getContents(stylefile);
            //e = correction( config, e , [path.dirname(stylefile)] );
        }
        //模块中的样式内容
        else if( m.ownerFragmentModule && m.isSkinModule )
        {
            var styles = m.ownerFragmentModule.moduleContext.style;
            var themes = findThemeStyleByName(styles, config.theme);
            if( themes.length === 0  ){
                themes = findThemeStyleByName(styles, "default" );
            }
            e = combineThemeStyle(themes, styles ,config );
        }
        if( !e )return "";
        //设置每一个样式表的作用域
        var scope = "#"+m.fullclassname.replace(/\./g,"_");
        return [scope,"(){\n",e,"\n}\n",scope,";\n"].join("");
    }).filter(function(val){
        return !!val;
    });
    return style;
}

function makeLessStyleContent(config, modules, isApp )
{
    var content = '';
    if( isApp )
    {
        var imports = getCoreStyleFilePath( config ).join( `";\n@import "` );
        if( imports ){
        content+=`@import "${imports}";`;
        }
    }

    //需要处理样内容
    var style = makeAllModuleStyleContent(config, modules).join("\n");
    if( style )
    {
        content+=`\n${style}`;
    }
    return content;
}


class Builder
{
    static getLessVariables( config )
    {
        return getThemeConfig( config );
    }

    static routerListToJsonString( routerObject )
    {
        return makeServiceRouteList( routerObject );
    }
   
    static makeStyleContentAssets(config, content, context )
    {
        const assets  ={};
        const formpath   = config.workspace;
        //修正图片地址
        content = content.replace(/((\:|\,)\s*)url\s*\(\s*([\'\"])?([^\3]*?)\3?\)/ig, function (a,c,e,f,b) 
        {
            b = utils.trim(b);
            if( b.substr(0,5) === "http:" || b.substr(0,6) === "https:" )
            {
                return a;
            }
            var info = url.parse( b );
            var suffix = [info.search,info.hash].filter(function(val){return !!val;}).join("");
            var dest = utils.makeAssetsFile( config, formpath, utils.resolvePath( b, context) );
            var u =  utils.getRequestRelativePath(config, utils.getBuildPath(config,'css'), dest)+suffix;
            assets[ b ]= dest;
            return `${c}url("${u}")`;
        });

        return {
            content:content,
            assets:assets,
        };
    }

    static makeModuleStyleContentExcludeFile(config,module)
    {
       var e = "";
       if( module.ownerFragmentModule && module.isSkinModule )
       {
           var styles = module.ownerFragmentModule.moduleContext.style;
           var themes = findThemeStyleByName(styles, config.theme);
           if( themes.length === 0  ){
               themes = findThemeStyleByName(styles, "default" );
           }
           e = combineThemeStyle( themes.filter(function(item){
               return !(item.attr && item.attr.file);
           }), styles ,config );

            var regexp = /@import\s+([\'\"])([^\1]+?)\1/gi;
            e = e.replace(regexp, function(a,b,c){
                if( c.charAt(0) === "@" )
                {
                    c = utils.resolvePath( c.substr(1) , [config.system_style_path] );
                }else
                {
                   c = utils.resolvePath( c,  [ path.dirname( module.filename ) ] );
                }
                return `@import "${c}"`;
            });
           
       }
       return e;
    }

    static makeModuleStyleExcludeContent(config,module)
    {
        const files = [];

        //是否有指定样式文件
        if( config.skin_style_config && config.skin_style_config.hasOwnProperty(module.fullclassname) )
        {
            var stylefile = config.skin_style_config[ module.fullclassname ];
            if( !path.isAbsolute(stylefile) )
            {
                stylefile = path.resolve( config.project_path, stylefile );
            }
            files.push( stylefile );
        }
        //模块中的样式内容
        else if(  module.isSkinModule )
        {
            var styles = module.ownerFragmentModule.moduleContext.style;
            var themes = findThemeStyleByName(styles, config.theme);
            if( themes.length === 0  ){
                themes = findThemeStyleByName(styles, "default" );
            }
            themes.map(function(a){
                if( !a.content && a.attr.file )
                {
                    if( !path.isAbsolute(a.attr.file) )
                    {
                        a.attr.file = path.resolve( config.project_path, a.attr.file );
                    }
                    files.push( a.attr.file );
                }
            })
        }

        return files;
    }

    static getSystemModule( config , module , flag)
    {
        if( typeof module === "string" )
        {
            var type = module;
            module = Maker.getLoaclAndGlobalModuleDescription( type );
            if( !module )
            {
                module = loadSystemModuleContentByName(config, type, flag );
                if( module ){
                    module.makeContent={'javascript':module.content};
                }else{
                    return null;
                }
            }
        }

        if( !module.makeContent )
        {
            module.makeContent={};
        }

        if( !module.makeContent['javascript'] )
        {
            const data = loadSystemModuleContentByName(config, module.type, flag );
            if( data )
            {
                module.makeContent[ 'javascript' ] = data.content;
                module.path = data.path;
                module.deps=data.deps;
            }
        }
        return module;
    }

    static getBootstrapView( config, replacements )
    {
        return replaceContent( utils.getContents( config.view_template_path || (rootPath+'/index.html') ), replacements, config).replace(/(\n[\s\t]*\r*\n)/g, '\n')
    }
   
    constructor(config, chunkFlag)
    {
        this._config = config;
        this.fs = fs;
        this.assets ={};
        this.modules={};
        this.routes ={};
        this.outputMap = new WeakMap();
        this.dependentsTreeMap = new WeakMap();
        this.chunkFlag = chunkFlag;
        const stylePath = path.resolve(config.system_style_path, config.system_style_name );
        this.lessOptions = {
            paths: [config.workspace,path.resolve(stylePath,"less"), stylePath],
            globalVars:getThemeConfig( config ),
            compress: config.minify,
        };
        this.id = utils.MD5( (new Date()).getTime() +'_'+ Math.random() , 16);
    }

    getMainPath(outputname,suffix)
    {
        const config = this._config;
        return path.resolve( utils.getBuildPath(config, `build${suffix}`), outputname + `${suffix}`);
    }

    emit(file, content)
    {
        this.fs.writeFileSync(file, content);
    }

    getViewOptions( config, options )
    {
       return Object.assign({
            META_CHARSET:"UTF-8",
            META_HTTP_EQUIV:"X-UA-Compatible",
            META_CONTENT:"IE=edge",
            META_KEYWORD_HTTP_EQUIV:"es,easescript,web",
            BASE_STYLE_FILE:"",
            COMMAND_SWITCH:config.command_switch,
            VERSION:config.makeVersion,
            VIEW_TITLE:"easescript",
            APP_STYLE_FILE:null,
            BASE_SCRIPT_FILE:null,
            APP_SCRIPT_FILE:null,
        }, options);
    }

    getAllDependents( enterModules )
    {
        const config = this._config;
        const result = [];
        const hash   ={};
        const requirements = utils.globals.concat(["Internal",'System','Locator','Event']);
        requirements.forEach( (name)=>{
            var module = Maker.getLoaclAndGlobalModuleDescription( name ) || {type:'Internal'};
            if( result.indexOf( module ) < 0 )
            {
                result.push( module );
            }
        });

        enterModules.forEach( ({module,dependencies})=>{
            Compile.getAllModules( module, result, hash, 'javascript' )
            dependencies.forEach( ( module )=>Compile.getAllModules( module, result, hash, 'javascript' ) )
        });

        return result;
    }

    start(enterModules,bootstrap,callback)
    {
        var index = 0;
        const config = this._config;
        const completed = ( err )=>{

            if( err )
            {
                callback(err);

            }else
            {
                const dependencies = this.getAllDependents( enterModules );
                const base = this.getMainPath('easescript','.js');

                if( config.source_file )
                {
                    outputFiles( config, dependencies,  config.module_suffix );
                }

                new Promise((resovle, reject) =>{

                    if( this.chunkFlag )
                    {
                        const buildModules = Compile.getModulesWithPolicy( dependencies , Compile.MODULE_POLICY_CORE | Compile.MODULE_POLICY_GLOBAL | Compile.MODULE_POLICY_EXTERNAL  );
                        const requiremnets={};
                        enterModules.forEach( ({module})=>{
                            if( module.isApplication )
                            {
                                const identifier = utils.getRequireIdentifier(config, module, '.es');
                                const output = this.outputMap.get( module ) || [];
                                const script = output.filter( (item)=>{ return item.suffix ===".js" });
                                const css = output.filter( (item)=>{ return item.suffix ===".css" });
                                const require = output.filter( (item)=>{ return item.require }).map((item)=>item.path);
                                requiremnets[ identifier ] = {
                                    script:script[0] ? utils.getLoadFileRelativePath(config, script[0].path+'?v='+config.makeVersion ) : null,
                                    css: css[0] ? utils.getLoadFileRelativePath(config, css[0].path+'?v='+config.makeVersion ) : null,
                                    require:require
                                };
                            }
                        });

                        const scriptContent = this.runtime(config, bootstrap , buildModules, this.routes, requiremnets );
                        this.emit( base, scriptContent );

                        const styleContent = makeLessStyleContent(config, Compile.getSkinModules( buildModules ), true );
                        if( styleContent )
                        {
                            Less.render(styleContent, this.lessOptions, function(err, output){
                                if (err) 
                                {
                                    reject( err );
                                
                                } else if(output)
                                {
                                    resovle( output.css );
                                }
                            });

                            return;
                        }
                    }

                    resovle();
        
                }).then( (content)=>{
        
                    if( content )
                    {
                        const styles = Builder.makeStyleContentAssets(config, content, this.lessOptions.paths);
                        this.emit( this.getMainPath('common','.css') , styles.content);
                    }

                    if( bootstrap && this.chunkFlag )
                    {
                        this.emit(
                            path.resolve( utils.getBuildPath(config, 'build.webroot'), 'index.html' ),
                            Builder.getBootstrapView(config,this.getViewOptions(config,{
                                VIEW_TITLE:bootstrap.classname,
                                HANDLE:this.id,
                                VERSION:config.makeVersion,
                                BASE_SCRIPT_FILE:utils.getLoadFileRelativePath(config, base ),
                                BASE_STYLE_FILE:content ? utils.getLoadFileRelativePath(config, this.getMainPath('common','.css') ) : null,
                            }))
                        );

                    }else
                    {
                        enterModules.forEach( ({module})=>{
                            if( module.isApplication )
                            {
                                const output = this.outputMap.get( module ) || [];
                                const script = output.filter( (item)=>{ return item.suffix ===".js" });
                                const css = output.filter( (item)=>{ return item.suffix ===".css" });
                                const require = output.filter( (item)=>{ return item.require });
                                this.emit(
                                    path.resolve( utils.getBuildPath(config, 'build.webroot'), module.classname.toLowerCase()  +'.html' ),
                                    Builder.getBootstrapView(config,this.getViewOptions(config,{
                                        VIEW_TITLE:module.classname,
                                        REQUIREMENTS:require,
                                        HANDLE:this.id,
                                        VERSION:config.makeVersion,
                                        DEFAULT_ROUTER:this.chunkFlag && module.defineMetaTypeList && module.defineMetaTypeList.Router ? module.fullclassname + "@" + module.defineMetaTypeList.Router.param.default : null,
                                        APP_STYLE_FILE:css[0] ? utils.getLoadFileRelativePath(config, css[0].path ) : null,
                                        BASE_STYLE_FILE:content ? utils.getLoadFileRelativePath(config, this.getMainPath('common','.css') ) : null,
                                        BASE_SCRIPT_FILE:this.chunkFlag ? utils.getLoadFileRelativePath(config, base ) : null,
                                        APP_SCRIPT_FILE:script[0] ? utils.getLoadFileRelativePath(config,script[0].path) : null
                                    }))
                                );
                            }
                        });
                    }

                    callback();

                }).catch( callback );
            }
        };

        const process = ()=>{

            return new Promise((resovle, reject) =>{

               const module = enterModules[ index++ ];
               if( module )
               {
                    this.build( module, (err)=>{
                        if( err ){
                            reject(err);
                        }else{
                            resovle( false );
                        }
                    });

               }else
               {
                   resovle( true );
               }

            }).then( ( done )=>{

                if( !done )
                {
                    return process();
                }else{
                    completed();
                }

            }).catch( completed );

        };
        process();

    }

    runtime(config, bootstrap, modules, routes, requirements)
    {
        const workspace = path.relative( config.project.path, config.workspace ).replace(/\\/g,'/').replace(/\.\.\//g,'').replace(/^\/|\/$/g,'');
        const js_load_path = path.relative( utils.getBuildPath(config, 'build.webroot') , utils.getBuildPath(config, 'build.js') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
        const css_load_path = path.relative( utils.getBuildPath(config, 'build.webroot') , utils.getBuildPath(config, 'build.css') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
        const runTemplate = rootPath+'/bootstrap.js';
        var router_provider = bootstrap && bootstrap.defineMetaTypeList && bootstrap.defineMetaTypeList.Router ? bootstrap.fullclassname + "@" + bootstrap.defineMetaTypeList.Router.param.default : null
        if( !router_provider && bootstrap )
        {
            router_provider = bootstrap.fullclassname;
        }

        return replaceContent( utils.getContents( runTemplate ) , {
            "namespace": '',
            "MODULES":buildModuleToJsonString(config, modules),
            "MODE":config.mode,
            "HANDLE":this.id,
            "VERSION":config.makeVersion,
            "JS_LOAD_PATH":js_load_path,
            "CSS_LOAD_PATH":css_load_path,
            "NAMESPACE_HASH_MAP": '',
            "MODULE_SUFFIX":config.suffix,
            "WORKSPACE":workspace ? workspace+'/' : '',
            "SERVICE_ROUTE_LIST": routes,
            "BOOTSTRAP_CLASS_FILE_NAME": bootstrap && bootstrap.fullclassname,
            "COMMAND_SWITCH":config.command_switch,
            "LOAD_REQUIREMENTS":JSON.stringify(requirements),
            "ORIGIN_SYNTAX": config.originMakeSyntax,
            "STATIC_URL_PATH_NAME": config.static_url_path_name,
            "DEFAULT_BOOTSTRAP_ROUTER_PROVIDER": router_provider,
            "BOOTSTRAP_CLASS_PATH": utils.getRelativePath(
                utils.getBuildPath(config, "build.webroot"),
                utils.getBuildPath(config, "build.bootstrap")
            )
         }, config);
    }

    chunk(config, module, modules)
    {
        const identifier  = utils.getRequireIdentifier(config, module, '.es');      
        return replaceContent(utils.getContents( rootPath+'/chunk.js' ), {
            "MODULES":buildModuleToJsonString(config, modules ),
            "MODE":config.mode,
            "FILENAME":identifier,
            "HANDLE":this.id,
            "VERSION":config.makeVersion,
        }, config);
    }

    addDependents( modules )
    {
        modules.forEach( (module)=>{
            if( module && !this.modules[ module.type ] )
            {
                this.modules[ module.type ] = module;
                if( !module.nonglobal )
                {
                    module = Builder.getSystemModule(this._config, module);
                    if( module && module.deps instanceof Array )
                    {
                        this.addDependents( module.deps.map( (name)=>{
                            return Maker.getLoaclAndGlobalModuleDescription( name );
                        }));
                    }
                }
            }
        });
    }

    build({module,dependencies,assets,routes}, callback )
    {
        const config = this._config;
        const outputname = module.fullclassname.toLowerCase();
        const requires = assets.filter(function(file){
            return path.parse(file).ext ===".js";
        });
        const map = [];
        this.outputMap.set(module, map);

        if( routes )
        {
           Object.assign(this.routes,routes);
        }
       
        var buildModules = null;
        var scriptContent = '';
        const deps =  dependencies.concat( module );
        if( this.chunkFlag )
        {
            buildModules = Compile.getModulesWithPolicy(deps, Compile.MODULE_POLICY_LOCAL );
            scriptContent = this.chunk(config, module, buildModules);

        }else
        {
            buildModules = this.getAllDependents( [{module,dependencies,assets,routes}] );
            scriptContent= this.runtime(config, module, buildModules, routes, requires);
        }

        const skinModules = Compile.getSkinModules( buildModules );
        this.addDependents( buildModules );
        new Promise((resovle, reject) =>{

            const styleContent = makeLessStyleContent(config, skinModules, module.isApplication && !this.chunkFlag );
            if( styleContent )
            {
                Less.render(styleContent, this.lessOptions, function(err, output){
        
                    if (err) 
                    {
                        reject( err );
                    
                    } else if(output)
                    {
                        resovle( output.css );
                    }
                });

            }else
            {
                resovle();
            }


        }).then( (content)=>{

            if( content )
            {
                const styles = Builder.makeStyleContentAssets(config, content, this.lessOptions.paths);
                Object.assign(this.assets,styles.assets);
                map.push({
                    path:this.getMainPath(outputname,'.css'),
                    name:outputname,
                    main:true,
                    app:module.isApplication,
                    require:false,
                    suffix:".css"
                });
                this.emit( this.getMainPath(outputname,'.css') , styles.content);
            }

            if ( config.minify )
            {
                var script = uglify.minify(scriptContent, {ie8: true});
                if (script.error)
                {
                    throw script.error;
                }
                scriptContent = script.code;
            }

            map.push({
                path:this.getMainPath(outputname,'.js'),
                name:outputname,
                main:true,
                app:module.isApplication,
                require:false,
                suffix:".js"
            });

            requires.forEach( (file)=>{
                var info = path.parse(file);
                map.push({
                    path:file,
                    name:info.name,
                    main:false,
                    app:module.isApplication,
                    require:true,
                    suffix:info.ext
                });
            });

            this.emit( this.getMainPath(outputname,'.js') , scriptContent);
            callback();
            
        }).catch( callback );
    }

}

module.exports = Builder;