import Utils from './utils.js';
import builder from'../javascript/builder.js';
const Less = require('less');
const PATH = require('path');
const fs = require('fs');

export default class Packer
{
    constructor(config, builder)
    {
        this._config = config;
        this._builder = builder;
        this.fs = fs;
    }

    emitFiles( dependencies )
    {
        var config = this._config;
        var builder = this._builder;
        if( config.source_file ==="enable" )
        {
            builder.outputFiles( config, dependencies,  config.module_suffix );
        }
    }

    getWebrootPath(file)
    {
        var config = this._config;
        var root = Utils.getBuildPath(config,"build.webroot");
        var prefix = config.originMakeSyntax !=="javascript" || config.enable_webroot ? "/" : "";
        if( !config.enable_webroot && config.originMakeSyntax !=="javascript" )
        {
            root = Utils.getBuildPath(config,"build");
        }
        return prefix+PATH.relative( root, file ).replace(/\\/g,"/");
    }

    getMainPath(outputname,version,suffix)
    {
        const config = this._config;
        return PATH.resolve( Utils.getBuildPath(config, `build${suffix}`), outputname + `${suffix}?v=${version}`);
    }

    emitMainCss(file, content)
    {
        const builder = this._builder;
        const options = this._options;
        var styles = builder.makeStyleContentAssets(config, content, options.paths);
        this._styleAssets = styles.assets;
        this.fs.writeFileSync(file, styles.content);
    }

    emitMainJs(file, scriptContent)
    {
         const config = this._config;
         //构建入口文件
         const buildBaseScript = function (config, scriptContent, hashMap , serverRoutes, bootstrap, loadRequirements )
         {
             const workspace = PATH.relative( config.project.path, config.workspace ).replace(/\\/g,'/').replace(/\.\.\//g,'').replace(/^\/|\/$/g,'');
             return builder(config,{
                 "namespace": function (content) {
                     return content.replace(/var\s+codeMap=\{\};/, "var codeMap=" + JSON.stringify(hashMap) + ";");
                 },
                 "MODULES":scriptContent,
                 "MODE":config.mode,
                 "HANDLE":handle,
                 "VERSION":config.makeVersion,
                 "JS_LOAD_PATH":js_load_path,
                 "CSS_LOAD_PATH":css_load_path,
                 "NAMESPACE_HASH_MAP": hashMap,
                 "MODULE_SUFFIX": bootstrap.nonglobal ? config.suffix : '.js',
                 "WORKSPACE":workspace ? workspace+'/' : '',
                 "SERVICE_ROUTE_LIST": serverRoutes,
                 "BOOTSTRAP_CLASS_FILE_NAME": bootstrap.fullclassname,
                 "COMMAND_SWITCH":config.command_switch,
                 "LOAD_REQUIREMENTS":loadRequirements||"{}",
                 "ORIGIN_SYNTAX": config.originMakeSyntax,
                 "STATIC_URL_PATH_NAME": config.static_url_path_name,
                 "DEFAULT_BOOTSTRAP_ROUTER_PROVIDER": bootstrap && bootstrap.defineMetaTypeList && bootstrap.defineMetaTypeList.Router ? bootstrap.fullclassname + "@" + bootstrap.defineMetaTypeList.Router.param.default : null,
                 "BOOTSTRAP_CLASS_PATH": Utils.getRelativePath(
                     Utils.getBuildPath(config, "build.webroot"),
                     Utils.getBuildPath(config, "build.bootstrap")
                 )
             });
         }

        this.fs.writeFileSync(file, content);
    }

    buildBefore()
    {

    }


    start(modules,bootstrap,chunkFlag,callback)
    {
        const config = this._config;
        const treeMap = {};
        const mainTree = function(type, dependencies){
            dependencies.forEach(function(module){
                const map = treeMap[ type ] || (treeMap[ type ]={});
                if( !map[ module.type ] ){
                    map[ module.type ] = 0;
                }
                map[ module.type ]++;
            });
        }

        const mainModules=[];
        const loadModules={};
        const buildModules={};
        const routes = {};
        modules.forEach(function(module){
            mainTree(module.type,module.dependencies);
        });

        modules.forEach(function(module){

            const type = module.type;
            buildModules[ type ] = {module:module,dependencies:[],routes:module.routes,assets:module.assets};
            Object.assign(routes,module.routes);
            module.dependencies.forEach(function(module){

                if( !loadModules[ module.type ] && !buildModules[  module.type ] )
                {
                    loadModules[ module.type ] = true;
                    if( !chunkFlag || !module.nonglobal || treeMap[ type ][ module.type ] > 1 )
                    {
                        mainModules.push( module );
                    }else{
                        buildModules[ type ].dependencies.push( module );
                    }
                }
                
            });

        });










    }


    build(module,dependencies,assets)
    {

        const config = this._config;
        const identifier  = Utils.getRequireIdentifier(config, module, '.es');
        const outputname = module.fullclassname;
        const filepath = PATH.resolve( Utils.getBuildPath(config, 'build.js'), outputname + '.js' );
        const requires = assets.filter(function(file){
            return PATH.parse(file).ext ===".js";
        });
       
        const css = this.getMainPath(outputname,version,'.css');
        const js = this.getMainPath(outputname,version,'.js');
        const emitMainCss = this.emitMainCss.bind(this);
        const emitMainJs = this.emitMainJs.bind(this);

        emitMainJs( js, 
            builder.buildModuleToJsonString(config, dependencies.concat(module) ),
            routes,
            module,
        );

        this.emitFiles( dependencies );

        new Promise(function (resovle, reject)
        {
            const styleContent = builder.makeLessStyleContent(config, dependencies);
            if( styleContent )
            {
                Less.render(styleContent, options, function(err, output){
        
                    if (err) 
                    {
                        reject( err );
                    
                    } else if(output)
                    {
                        emitMainCss( css, output.css );
                    }
                    resovle();
                });

            }else
            {
                resovle();
            }

        }).catch(function(err)
        {
            Utils.error(err.message);
            Utils.error(err.extract.join('\n'));

        }).then(function()
        {

            
        });







        //应用模块需要的依赖文件
        this._loadRequiremnets[ identifier ] = {
            script:getLoadFileRelativePath(config,PATH.resolve(Utils.getBuildPath(config, 'build.js'), outputname + '.js?v='+handle )),
            css:getLoadFileRelativePath(config, PATH.resolve( Utils.getBuildPath(config, 'build.css'), outputname + '.css?v='+handle )),
            require:requires
        };

        //拆分系统类与本地类
        if( doPart )
        {
            buildModules = getModulesWithPolicy(usedModules, MODULE_POLICY_LOCAL);
            getModulesWithPolicy(usedModules, MODULE_POLICY_GLOBAL | MODULE_POLICY_CORE ).forEach(function (item) 
            {
                if( baseModule.indexOf( item ) < 0 )
                {
                    baseModule.push( item );
                }
            });

            scriptContent = builder.chunk(config,{
                "MODULES":builder.buildModuleToJsonString(config, buildModules),
                "MODE":config.mode,
                "FILENAME":identifier,
                "HANDLE":handle,
            });

        }else
        {
            buildModules = usedModules;
            scriptContent = buildBaseScript(
                config,
                builder.buildModuleToJsonString(config, buildModules),
                hashMap ,
                serverRoutes,
                bootstrap,
                JSON.stringify( ({})[ identifier ]=loadRequiremnets[ identifier ] )
            );
        }

        //压缩脚本
        if ( config.minify === 'enable')
        {
            var script = uglify.minify(scriptContent, {ie8: true});
            if (script.error)
            {
                throw script.error;
            }
            scriptContent = script.code;
        }
        
        //生成已构建的代码文件
        Utils.setContents(
            filepath,
            scriptContent
        );

       
         

    }



}