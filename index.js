const fs = require('fs');
const PATH = require('path');
const Ruler = require('./lib/ruler.js');
const Utils = require('./lib/utils.js');
const makeSkin = require('./lib/skin.js');
const globals=require('./lib/globals.js');
const uglify = require('uglify-js');

//全局配置
const defaultConfig = {
    'suffix': '.es',  //需要编译文件的后缀
    'debug':'on', //是否需要开启调式
    'blockScope':'enable',     //是否启用块级域
    'reserved':['let', 'of','System',"Context"],
    'minify':'off', //是否需要压缩
    'compat_version':'*',      //要兼容的平台 {'ie':8,'chrome':32.5}
    'build_path':'./build',
    'project_path':'./',
    'skin_file_suffix': '.html',
    'project_file_suffix':'.es',
    'browser':'enable',
    'baseSkinClass':'es.core.Skin',
    'config_file':'./configure.js',
    'bootstrap':'Index',
    'context':{
        "public":"_public",
        "protected":"_protected",
        "private":"_private",
        "internal":"_internal",
        "defineModuleMethod":"define",
        "package":"Context",
    },
    'mode': 1, //1 标准模式（开发时使用） 2 性能模式（生产环境使用）
};

var  descriptions={};
var  makeModules={};
var  styleContents=[];
var  requirements={};
var  clientScriptContents = [];

/**
 * 全局模块
 * @param classname
 * @returns {{}}
 */
function define(syntax, classname, module)
{
    classname = classname.replace(/\s+/g,'');
    var obj=descriptions.hasOwnProperty(syntax) ? descriptions[syntax] : descriptions[syntax]={};
    if( typeof module === 'object' )
    {
        obj[ classname ] = module;
        return module;
    }
    return obj.hasOwnProperty(classname) ? obj[classname] : null;
}

/**
 * 返回指定语法的类名描述信息包括全局类
 * @param syntax
 * @param classname
 * @returns {boolean}
 */
function getDescriptionAndGlobals(syntax, classname)
{
    if( descriptions.hasOwnProperty(syntax) && descriptions[syntax].hasOwnProperty(classname) )
    {
        return descriptions[syntax][classname];
    }
    //全局类不分语法
    return globals.hasOwnProperty( classname ) ? globals[classname] : null;
}

/**
 * 返回文件的路径
 * @param file
 * @param lib
 * @returns {*}
 */
function filepath(file, base )
{
    return PATH.resolve( base, file.replace(/\./g,'/') ).replace(/\\/g,'/');
}

/**
 * 获取类型
 * @param type
 * @returns {string}
 */
function getType( type )
{
    if(type==='*' || type==='void')return type;
    return typeof type=== "string" ? type.replace(/^\(|\)$/g,'') : '';
}

/**
 * 创建属性的描述
 * @param stack
 * @returns {string}
 */
function createDescription( syntax, stack , owner , moduleClass )
{
    var desc = {};
    desc.__stack__ = stack;
    desc['id'] =stack.keyword();
    desc['type'] = getType( stack.type() );
    desc['type'] = getImportType(syntax, moduleClass, getType( stack.type() ) );

    if( stack.returnType && desc['id']==='function' )
    {
        stack.returnType = getImportType(syntax, moduleClass, stack.returnType );
        desc['type'] = stack.returnType;
    }

    var scope2 = stack.getScopeOf().define(  stack.name() )
    if(  scope2 && scope2.value )
    {
        var content = scope2.value.content();
        var reftype = "";
        if( content[2] instanceof Ruler.STACK )
        {
            reftype = content[2].type();
            switch ( reftype )
            {
                case "(JSON)" : reftype = "JSON"; break;
                case "(Array)" : reftype = "Array"; break;
            }
        }else{
            reftype = Utils.getConstantType( content[2].value ) || Utils.getValueTypeof( content[2].type );
        }
        desc.referenceType = reftype;
    }

    if( moduleClass['id'] === 'interface'){
       desc['isInterface'] =true;
    }

    desc['origintype'] = desc['type'];
    desc['privilege'] =stack.qualifier() || "internal";
    desc['static'] = !!stack.static();
    desc['isStatic'] = desc['static'];
    desc['owner'] = owner;
    if( stack.final() )
    {
        desc['final'] =stack.final();
    }
    if( stack.override() )
    {
        desc['override'] =stack.override();
    }
    if( stack.keyword() === 'function' )
    {
        desc['param'] = stack.param();
        desc['paramType'] = [];
        desc['type']=stack.returnType;

        for(var i in desc['param'] )
        {
            if( desc['param'][i] ==='...')
            {
                desc['paramType'].push('*');
            }else{
                var obj = stack.define( desc['param'][i] );
                obj.type = getImportType(syntax, moduleClass, getType(obj.type) );
                desc['paramType'].push( obj.type );
            }
        }
    }
    return desc;
}

function getImportType(syntax, moduleClass,  type )
{
    if( !type )return '*';
    if( type && type !=='*' && type !=='void' )
    {
        if( moduleClass.import.hasOwnProperty(type) )
        {
            return moduleClass.import[ type ];
        }else if( moduleClass.classname===type )
        {
            return moduleClass.fullclassname;
        }
        return type;
    }
    return type || '*';
}

/**
 * 将元类型转字符串
 * @param stack
 * @param type
 * @returns {string}
 */
function metaTypeToString( stack , type )
{
    var content  = stack.content();
    if( stack.keyword()==='metatype'){
        content = content[1].content();
        if( Ruler.META_TYPE.indexOf( content[0].value ) < 0 )
        {
            throw new SyntaxError("Invaild metatype '"+content[0].value+"'");
        }
        type = content[0].value;
    }

    if( (type==='Embed') && stack.type()==='(expression)')
    {
        if( content[1].previous(0).value !=='source' )
        {
            //console.log( content[1].previous(0).value )
            //throw new SyntaxError("Missing identifier source");
        }
    }

    var len = content.length;
    var str=[];
    for(var i=0; i<len; i++)
    {
        if ( content[i] instanceof Ruler.STACK)
        {
            str.push( metaTypeToString( content[i], type ) );

        } else if( content[i].value != null )
        {
            str.push( content[i].value  );
        }else if( typeof content[i] === "string" )
        {
            str.push( content[i]  );
        }
    }
    return str.join('');
}

function parseMetaEmbed(metatype, config )
{
    var source = metatype.param.source;
    var filepath = PATH.resolve(config.project_path, source);
    if( fs.existsSync(filepath) )
    {
        var rootImg  = Utils.getBuildPath(config, 'build.img');
        var directory= PATH.relative(filepath, source );
        var filename = PATH.basename( directory );
        directory = PATH.dirname(directory).replace(/\\/g,'/').split('/');
        directory = directory.filter(function (a) {
            return a !== '..';
        });
        var dest =  PATH.resolve( rootImg, directory.join('/'), filename ).replace(/\\/g,'/');
        fs.writeFileSync(dest, fs.readFileSync(filepath) );
        return dest;

    }else
    {
        throw new ReferenceError("file is not exists '"+source+"'");
    }
}

/**
 * 解析元类型模块
 * @param stack
 * @param config
 * @returns {string}
 */
function parseMetaType( describe, currentStack, metaTypeStack , config, project, syntax , list )
{
    var metatype = metaTypeToString( metaTypeStack );
    metatype = Utils.executeMetaType(metatype);
    switch ( metatype.type )
    {
        case 'Skin' :
            var source = metatype.param.source;
            var modules = makeSkin( metatype.param.source , config , project, syntax, loadModuleDescription );
            styleContents = styleContents.concat( modules.styleContents);
            modules = modules.moduleContents;
            for( var index in modules )
            {
                loadFragmentModuleDescription(syntax, modules[ index ], config, project);
            }
            describe[ currentStack.name() ].value = ' System.getDefinitionByName("'+source+'")';
        break;
        case 'Embed' :
            var dest = parseMetaEmbed(metatype, config );
            dest= PATH.relative(config.build_path,dest ).replace(/\\/g,'/');
            describe[ currentStack.name() ].value = '"./'+dest+'"';
        break;
        case 'Bindable' :
            var name = currentStack.name();
            var item = describe[ name ];
            if( item.bindable===true )return;
            var eventType = "PropertyEvent.CHANGE";
            if( metatype.param.eventType )
            {
                if( metatype.param.eventType.lastIndexOf('.')>0 )
                {
                    eventType =  metatype.param.eventType;
                }else{
                    eventType = '"'+ metatype.param.eventType+'"';
                }
            }
            if( item.id==='var' )
            {
                var private_var = name;
                var privilege = item.privilege;
                var type = item.type;
                var setter = [
                    'function(val){\n',
                    '\tvar old = this['+config.context.private+'].'+private_var,';\n',
                    '\tif(old!==val){\n',
                    '\t\tthis['+config.context.private+'].'+private_var+'=val;\n',
                    '\t\tvar event = new PropertyEvent('+eventType+');\n',
                    '\t\tevent.property = "'+name+'";\n',
                    '\t\tevent.oldValue = old;\n',
                    '\t\tevent.newValue = val;\n',
                    '\t\tthis.dispatchEvent(event);\n',
                    '\t}',
                    '\n}',
                ];
                var getter = [
                    'function(val){\n',
                    '\treturn this['+config.context.private+'].'+private_var,
                    ';\n}',
                ];
                describe[ name ]={
                    'id':'function', "privilege":privilege,"bindable":true,"type":type,'isAccessor':true,'varToBindable':true,
                    "value":{"set":setter.join(""),"get":getter.join("")}
                }
            }
            item.bindable = true;
            break;
    }
}

function mergeImportClass(target, scope)
{
    for (var i in scope)
    {
       if( scope[i].id==="class" && scope[i]['import']===true )
       {
           target[i] = scope[i].fullclassname;
       }
    }
}

function getDeclareClassDescription( stack , isInternal, config, project , syntax )
{
    var list = {'static':{},'proto':{},'import':{},'constructor':{},'attachContent':{} ,'use':{},'namespaces':{},
        'isInternal': isInternal,"privilege":"internal",'requirements':{},'hasUsed':false};
    var isstatic = stack.static();
    var type = stack.fullclassname();
    var prev = null;
    var data = stack.content();
    var i = 0;
    var len = data.length;
    var item;

    list['inherit'] = stack.extends() ? stack.extends() : null;
    list['package'] = stack.parent().keyword()==="package" ? stack.parent().name() : "";
    list['type'] = stack.fullclassname();
    list['nonglobal'] = true;
    list['fullclassname'] = stack.fullclassname();
    list['classname'] = stack.name();

    if (stack.keyword() === 'interface')
    {
        list['implements'] = [];
        list['isDynamic'] = false;
        list['isStatic'] = false;
        list['isFinal'] = false;
        list['id'] = 'interface';

    } else
    {
        list['implements'] = stack.implements();
        list['isDynamic'] = stack.dynamic();
        list['isStatic'] = stack.static();
        list['isFinal'] = stack.final();
        list['isAbstract'] = stack.abstract();
        list['id'] = 'class';
    }

    if( stack.qualifier() )
    {
        list.privilege = stack.qualifier();
    }

    mergeImportClass( list.import, stack.scope().define() );

    for (; i < len; i++)
    {
        item = data[i];
        if (item instanceof Ruler.STACK)
        {
            var ref = item.static() || isstatic ? list.static : list.proto;
            var ns = item.qualifier() || 'internal';
            if( "private,protected,public,internal".indexOf(ns) > -1 )
            {
                ns='';
            }
            if( ns )
            {
                ref = ref[ ns ] || (ref[ ns ]={});
                list.use[ ns ] = "namespace";
            }

            //跳过构造函数
            if (item.keyword() === 'function' && item.name() === stack.name() && !isstatic)
            {
                list.constructor = createDescription(syntax, item, null, list );
                continue;

            } else if ( item.keyword() === "use" )
            {
                list.use[ item.name() ] = "namespace";
                continue;
            }

            //访问器
            if (item instanceof Ruler.SCOPE && item.accessor())
            {
                var refObj = ref[item.name()];
                if (!refObj) {
                    ref[item.name()] = refObj = createDescription(syntax,item, type, list );
                    refObj.value = {};
                }
                refObj.value[item.accessor()] = createDescription(syntax,item, type, list);
                refObj.isAccessor = true;
                if (item.accessor() === 'get') {
                    refObj.type = refObj.value[item.accessor()].type;
                }
                if (item.accessor() === 'set') {
                    refObj.paramType = refObj.value[item.accessor()].paramType;
                    refObj.param = refObj.paramType;
                }

            }else if (item.keyword() !== 'metatype')
            {
                ref[item.name()] = createDescription(syntax,item, type, list);
            }

            //为当前的成员绑定一个数据元
            if (prev && prev.keyword() === 'metatype')
            {
                parseMetaType(ref, item, prev, config, project, syntax, list);
                prev = null;
            }
            prev = item;
        }
    }
    return list;
}


function getNamespaceValue( stack, classModule )
{
    var express = stack.content();
    express.shift();
    express = express[0].content()[0].content();
    express.splice(0, 2);
    var scope = stack.getScopeOf();
    var id = scope.keyword();
    var ret;
    if( id==="package" )
    {
        ret = classModule.package+"/"+stack.qualifier()+":"+stack.name();

    }else if( id==="class" )
    {
        ret = classModule.package+"."+classModule.classname+"/"+stack.qualifier()+":"+stack.name();

    }else if( id==="function" )
    {
        ret = classModule.package+"."+classModule.classname+"/"+stack.qualifier()+":"+scope.name()+"/"+classModule.package+":"+stack.name();
    }
    if (express.length === 1)
    {
        ret = express[0].value.replace(/[\"\']/g,'');
    }
    return ret;
}

var root_block_declared=['class','interface','const','var','let','use','function','namespace'];

/**
 * 获取类的成员信息
 */
function getPropertyDescription( stack , config , project , syntax )
{
    var moduleClass = {'static':{},'proto':{},'import':{},'constructor':{},'attachContent':{},"rootContent":[],
        "namespaces":{}, "use":{},"declared":{},"nonglobal":true,"type":'' ,"privilege":"internal",'requirements':{},'hasUsed':false};
    moduleClass.fullclassname = stack.fullclassname;
    var fullclassname = stack.fullclassname.split('.');
    moduleClass.classname = fullclassname.pop();
    moduleClass.package = fullclassname.join(".");
    moduleClass.rootStack=stack;

    var has = false;
    var data = stack.content();
    var i = 0;
    var item;
    var len = data.length;
    var count = 0;

    for( ;i<len ;i++ )
    {
        item = data[i];
        if( !(item instanceof Ruler.STACK) )
        {
            continue;
        }

        var id = item.keyword();
        if( id ==="package" )
        {
            if( has )Utils.error("package cannot have more than one");
            has = true;
            var datalist = item.content();
            var value;
            for(var b=0; b< datalist.length; b++ )
            {
                value = datalist[b];
                if( value instanceof Ruler.STACK )
                {
                    if (value.keyword() === "class" || value.keyword() === "interface")
                    {
                        Utils.merge(moduleClass, getDeclareClassDescription(value, false, config, project, syntax ) );

                    } else if ( value.keyword() === "namespace" )
                    {
                        if( moduleClass.namespaces.hasOwnProperty( value.name() ) )
                        {
                            Utils.error('"'+value.name()+'" is already been declared');
                        }
                        mergeImportClass( moduleClass.import, item.scope().define() );
                        moduleClass.namespaces[ value.name() ] = createDescription(syntax, value, null,  moduleClass);
                        moduleClass.package = item.name();
                        moduleClass.fullclassname =  moduleClass.package ? moduleClass.package+"."+value.name() : value.name();
                        //moduleClass.namespaces[ value.name() ].value = getNamespaceValue( value, moduleClass);
                        moduleClass.classname = value.name();
                        moduleClass.id="namespace";
                        moduleClass.type=value.name();
                        count++;
                    }
                    else if ( value.keyword() === "use" )
                    {
                        moduleClass.use[ value.name() ] = "namespace";
                    }
                }
            }

        }else if( root_block_declared.indexOf(id) >= 0 )
        {
            if ( id === "use" )
            {
                moduleClass.use[ item.name() ] = "namespace";

            }else
            {
                if (moduleClass.declared.hasOwnProperty(item.name())) {
                    Utils.error('"' + item.name() + '" is already been declared');
                }

                if (id === "namespace")
                {
                    if (moduleClass.namespaces.hasOwnProperty(item.name()))
                    {
                        Utils.error('"' + item.name() + '" is already been declared');
                    }
                    moduleClass.namespaces[item.name()] = createDescription(syntax,item,null,  moduleClass);
                    //moduleClass.namespaces[item.name()].value = getNamespaceValue(item, moduleClass);

                } else if (id === "class" || id === "interface")
                {
                    moduleClass.declared[item.name()] = getDeclareClassDescription(item, true, config, project, syntax );
                    moduleClass.declared[item.name()].rootStack=item;
                    moduleClass.declared[item.name()].namespaces = Utils.merge( moduleClass.declared[item.name()] ,moduleClass.namespaces);

                } else if (item.name())
                {
                    moduleClass.declared[item.name()] = createDescription(syntax,item,null,  moduleClass);
                }
            }

        }else
        {
            Utils.error('Unexpected expression');
        }
    }

    if( moduleClass.id==="namespace" && count > 1 )
    {
        throw new Error('The content of the namespace is defined not greater than one');
    }
    //root block
    mergeImportClass( moduleClass.import, stack.scope().define() );
    return moduleClass;
}

//构建代码描述
function makeCodeDescription( content ,config )
{
    //获取代码描述
    var R= new Ruler( content, config );

    //侦听块级域
    if( config.blockScope==='enable' )
    {
        R.addListener("(statement)", function (e) {
            if( e.desc.id !=='var' )e.desc.scope =this.scope().getScopeOf();
        });
    }

    //解析代码语法
    var scope = R.start();
    return scope;
}

/**
 * 加载并解析模块的描述信息
 * @returns
 */
function loadModuleDescription( syntax , file , config , project , resource , suffix , isComponent )
{
    suffix= suffix || config.suffix;

    //获取源文件的路径
    var sourcefile = filepath(file, config.project_path ).replace(/\\/g,'/');

    //获取对应的包和类名
    var fullclassname = PATH.relative( config.project_path, sourcefile ).replace(/\\/g,'/').replace(/\//g,'.');
    fullclassname=fullclassname.replace(/^[\.]+/g,'');

    //是否加载系统库中的文件
    if( fullclassname.indexOf( config.system_lib_path_name+'.' )===0 )
    {
        sourcefile = filepath( fullclassname, config.system_lib_path ).replace(/\\/g,'/');
    }

    //如果已存在就返回
    var description = getDescriptionAndGlobals(syntax, fullclassname);
    if( description )return description;

    if( !fs.existsSync(sourcefile+suffix) )
    {
        //是否为一个皮肤文件
        if( isComponent===true || !fs.existsSync(sourcefile+config.skin_file_suffix) )
        {
            Utils.error(resource || sourcefile);
            throw new Error('Not found '+sourcefile+suffix);
        }

        //加载皮肤
        var modules = makeSkin( fullclassname , config , project, syntax, loadModuleDescription );

        //构建客户端运行的脚本
        if( modules.clientScriptContents )
        {
            loadFragmentModuleDescription('javascript',  modules.clientScriptContents , modules.clientScriptContents.config || config , project);
        }

        styleContents = styleContents.concat( modules.styleContents );
        modules = modules.moduleContents;
        for( var index in modules )
        {
            var _module = modules[ index ];
            loadFragmentModuleDescription(syntax, _module, config, project);
        }
        return define(syntax, fullclassname);
    }
    sourcefile+=suffix;

    //先占个位
    define(syntax, fullclassname, {} );

    //检查源文件的状态
    var stat = fs.statSync( sourcefile );

    //源文件修改过的时间
    var id = new Date(stat.mtime).getTime();

    //编译源文件
    Utils.info('Checking file '+sourcefile+'...');

    //解析代码语法
    var scope = makeCodeDescription(fs.readFileSync( sourcefile , 'utf-8'), config );

    //需要编译的模块
    var module = makeModules[syntax] || (makeModules[syntax]={});
    module[fullclassname]=scope;

    //获取模块的描述
    scope.fullclassname = fullclassname;
    description = getPropertyDescription( scope, config, project , syntax );
    description.uid= id;
    description.filename = sourcefile.replace(/\\/g,'/');
    scope.filename = description.filename;
    scope.description = description;

    if( fullclassname !== description.fullclassname )
    {
        Utils.error("the file path with the package path inconformity");
        throw new SyntaxError( "the file path with the package path inconformity" );
    }

    for( var p in description.declared )
    {
        if( description.declared[p].id==="class" )
        {
            var pkg = fullclassname.split('.').slice(0,-1);
            description.declared[p].package = pkg.join('.');
            pkg.push( description.declared[p].classname );
            description.declared[p].fullclassname = pkg.join(".");
            define(syntax, description.declared[p].fullclassname , description.declared[p] );
        }
    }

    //加载导入模块的描述
    for (var i in description.import)
    {
        var file =  description.import[i];
        if( description.package && !globals.hasOwnProperty(file) && file.indexOf('.') < 0 )
        {
            if( !fs.existsSync(file+suffix) )
            {
                file = description.package +'.'+file;
                description.import[i] = file;
            }
        }
        loadModuleDescription(syntax, file, config, project, description.filename );
    }
    define(syntax, description.fullclassname, description );
    return description;
}

//目前支持的语法
const syntax_supported={
    'php':true,
    'javascript':true
};

//构建器
const builder={

    'javascript':function(config,project)
     {
         var bootstrap = PATH.resolve(project.path, config.bootstrap );
         var fullclassname = PATH.relative( config.project.path, bootstrap ).replace(/\\/g,'/').replace(/\//g,'.');
         config.main = fullclassname;
         var jsSyntax = require('./lib/javascript.js');
         var script = jsSyntax(config, makeModules['javascript'], descriptions['javascript'], project );
         var filename;

         if( styleContents.length > 0  )
         {
             var less = require('less');
             var themes = require('./style/themes.js');
             var lessPath = PATH.resolve( config.root_path, './style/');
             var options =  {
                 paths: [ lessPath ],
                 globalVars:themes[ config.themes ] || themes.default,
                 compress: config.minify === 'enable' ,
             };
             var style = styleContents.map(function (e, i) {

                 var ownerModule = descriptions['javascript'][e.ownerModule];
                 if( ownerModule.hasUsed !==true )return '';
                 e = e.style;
                 e=e.replace(/@Embed\(.*?\)/g, function (a,b) {
                     var metatype = Utils.executeMetaType( a.substr(1) );
                     var dest = parseMetaEmbed(metatype, config);
                     return '"./'+ PATH.relative( Utils.getBuildPath(config,'build.css'), dest ).replace(/\\/g,'/')+'"';
                 });

                 e.replace(/\B@(\w+)\s*:/gi,function (a, b , c) {
                     e=e.replace( new RegExp('@'+b,"gi"),function (a){
                         return '@'+b+i;
                     });
                 });
                 return e;
             });

             style.unshift( "\n@import 'mixins.less';\n" );
             style.unshift( "\n@import 'main.less';\n" );
             if( config.animate ) {
                 style.unshift("\n@import 'animate.less';\n");
             }
             if( config.font )
             {
                 style.push("\n@import './less/glyphicons.less';\n");
             }
             less.render( style.join("\n") , options, function (err, output) {
                 if (err) {
                     Utils.error(err.message);
                     Utils.error(err.extract.join('\n'));
                 } else {
                     filename = PATH.resolve(Utils.getBuildPath(config, 'build.css'), config.bootstrap + '.css');
                     fs.writeFileSync(filename, output.css );
                 }
             });

             var fontPath = Utils.getBuildPath(config, 'build.font');
             var fontfiles =  Utils.getDirectoryFiles( lessPath+'/fonts');
             for( var i=0;i<fontfiles.length;i++)
             {
                 var source = fs.createReadStream(  lessPath+'/fonts/'+fontfiles[i] );
                 var tocopy   = fs.createWriteStream( fontPath+"/"+fontfiles[i] );
                 source.pipe( tocopy );
             }
         }

         if( script && config.minify ==='enable' )
         {
             script = uglify.minify(script,{ie8:true});
             if( script.error )throw script.error;
             script = script.code;
         }
         filename = PATH.resolve( Utils.getBuildPath(config, 'build.js'), config.bootstrap.toLowerCase().replace(/\./g,'/') + '.js');
         Utils.mkdir( PATH.dirname( filename ) );
         fs.writeFileSync(filename, script );
     },

     'php':function(config,project)
     {
         var bootstrap = PATH.resolve(project.path, config.bootstrap );
         var fullclassname = PATH.relative( config.project.path, bootstrap ).replace(/\\/g,'/').replace(/\//g,'.');
         config.main = fullclassname;
         var phpSyntax = require('./lib/php.js');
         var script = phpSyntax(config, makeModules['php'], descriptions['php'], project );
         var filename;

         if( styleContents.length > 0  )
         {
             var less = require('less');
             var themes = require('./style/themes.js');
             var lessPath = PATH.resolve( config.root_path, './style/');
             var options =  {
                 paths: [ lessPath ],
                 globalVars:themes[ config.themes ] || themes.default,
                 compress: config.minify ==='enable' ,
             };
             var style = styleContents.map(function (e, i) {
                 e.replace(/\B@(\w+)\s*:/gi,function (a, b , c) {
                     e=e.replace( new RegExp('@'+b,"gi"),function (a){
                         return '@'+b+i;
                     });
                 });
                 return e;
             });

             style.unshift( "\n@import 'mixins.less';\n" );
             style.unshift( "\n@import 'main.less';\n" );
             less.render( style.join("\n") , options, function (err, output) {
                 if (err) {
                     Utils.error(err.message);
                     Utils.error(err.extract.join('\n'));
                 } else {
                     filename = PATH.resolve(Utils.getBuildPath(config, 'build.webroot.static.css'), config.bootstrap + '.css');
                     fs.writeFileSync(filename, output.css );
                 }
             });
         }

         if( script && config.minify ==='enable' )
         {
             script = uglify.minify(script,{ie8:true});
             if( script.error )throw script.error;
             script = script.code;
         }
         filename = PATH.resolve(Utils.getBuildPath(config, 'build.webroot'), config.bootstrap + '.php');
         fs.writeFileSync(filename, script );
     }
};

/**
 * 构建工程结构
 * @param dir
 * @param base
 */
function buildProject(dir, base)
{
    var dirpath = PATH.isAbsolute(dir.path) ? dir.path : PATH.resolve(base, dir.path, dir.name);
    if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath);
        if (typeof dir.bootstrap === "string" && dir.syntax) {
            //引用一个模板
            var file = PATH.resolve(config.root_path, dir.syntax, dir.bootstrap + dir.suffix);
            if (Utils.isFileExists(file)) {
                fs.linkSync(file, PATH.resolve(dirpath, dir.bootstrap + dir.suffix));
            }
        }
    }

    dir.path = dirpath.replace(/\\/g,'/');
    dir.name = PATH.basename(dirpath);

    if (dir.child) {
        for (var i in dir.child) {
            buildProject(dir.child[i], dirpath);
        }
    }
}

function configToJson( config , depth )
{
    var tab = new Array( depth );
    tab = tab.join("\t");
    var type = config instanceof Array ? 'array' : typeof config;
    if( type ==="string" )return tab+config;
    var item = [];
    for( var p in config )
    {
        if( config[p]+""=="[object Object]" || config[p] instanceof Array )
        {
            item.push( tab+'"'+p+'":'+configToJson( config[p] , depth+1 ) );

        }else
        {
            var val = typeof config[p] === "string" ? config[p].replace(/\\/g, '/') : config[p];
            if (type === 'array') {
                item.push('"' + val + '"');
            } else {
                item.push(tab + '"' + p + '":"'+val + '"');
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
function getConfigure(config)
{
    root_path = config.root_path || process.cwd();
    //生产环境模式启用压缩文件
    if( config.mode===3 && config.minify == null )
    {
        config.minify = 'enable';
    }

    config.debug = config.debug==='enable' ? 'on' : 'off';

    //工作的目录
    var project_path = PATH.resolve( config.project_path );

    if( !fs.existsSync(project_path) )
    {
        fs.mkdirSync( project_path );
    }

    //默认配置文件
    var makefile = PATH.resolve(project_path,'project.conf');

    if( !Utils.isFileExists( makefile ) || config.clean===true )
    {
        //程序的路径
        config.root_path = root_path;
        
        //合并默认配置文件
        Utils.merge(config, require( config.config_file ) );

        //当前工程项目路径
        config.project_path = project_path;
        config.project.path = project_path;
        config.project.name = PATH.basename(project_path);

        //构建项目路径
        config.build_path = PATH.resolve(config.build_path);
        config.build.path = config.build_path;
        config.build.name = PATH.basename(config.build_path);
        if (!fs.existsSync(config.build_path)) {
            fs.mkdirSync(config.build_path);
        }

        //构建输出目录
        buildProject(config.build, config.build_path);

        //构建工程目录
        buildProject(config.project, config.project_path);

        //生成一个默认的配置文件
        Utils.setContents(makefile, configToJson( config , 1 ) );

    }else
    {
        config = JSON.parse( Utils.getContents(makefile) );
    }

    var bootstrap_file = PATH.resolve( config.project.path , config.bootstrap.replace(/\./g,"/")+config.suffix );
    Utils.mkdir( PATH.dirname( bootstrap_file ) );
    if( !Utils.isFileExists(bootstrap_file) )
    {
        var defaultFile = [
            'package\n{\n',
            '\tpublic class '+config.bootstrap,
            ' extends EventDispatcher\n\t{\n',
            '\t\tpublic function '+config.bootstrap,
            '()\n',
            '\t\t{\n',
            '\t\t\tsuper(document);\n',
            '\t\t\tthis.addEventListener(Event.READY,function (e){\n',
            '\t\t\t\tvar body = new Element("body");\n',
            '\t\t\t\tbody.addChildAt( Element.createElement("<h1>Hello world!</h1>"),0);\n',
            '\t\t\t});\n',
            '\t\t}\n',
            '\t}\n',
            '}',
        ];
        Utils.setContents(bootstrap_file, defaultFile.join("") );
    }

    //将上下文中引用的变量设为受保护的关键字
    for (var c in config.context )
    {
        if( c !=='defineModuleMethod' && config.reserved.indexOf( config.context[c] )<0 )
        {
            config.reserved.push( config.context[c] );
        }
    }
    if( config.reserved.indexOf('System')<0 )config.reserved.push('System');
    if( config.reserved.indexOf('Context')<0 )config.reserved.push('Context');
    if( config.reserved.indexOf('Reflect')<0 )config.reserved.push('Reflect');

    //系统类库路径名
    //在加载类文件时发现是此路径名打头的都转到系统库路径中查找文件。
    config.system_lib_path_name = 'es';
    config.system_lib_path = config.root_path;

    return config;
}

var syntaxMap={
    'js':'javascript',
    'php':'php'
}

var globalConfig = defaultConfig;

/**
 * 开始生成代码片段
 */
function make( config, isGlobalConfig )
{
    config = getConfigure( Utils.merge(globalConfig, config || {}) );
    if( isGlobalConfig===true )
    {
        globalConfig  = config;
    }
    makeModules = {};
    descriptions = {};
    requirements = config.requirements || (config.requirements = {});
    config.syntax = syntaxMap[ config.syntax ] || 'javascript';

    //浏览器中的全局模块
    if( config.browser === 'enable' )
    {
        var browser = require('./lib/browser.js');
        for(var b in browser){
            globals[b]=browser[b];
        }
    }
    config.globals=globals;
    config.$getDescriptionAndGlobals = getDescriptionAndGlobals;

    try
    {
        var project = config.project;
        project.config = Utils.merge({},config, project.config || {});
        if (typeof project.config.bootstrap === "string" && typeof project.config.syntax === "string")
        {
            if( syntax_supported[ project.config.syntax ] === true )
            {
                var classname = PATH.relative( project.path, filepath( project.config.bootstrap, project.path ) );
                var mainDescription = loadModuleDescription( project.config.syntax, classname,  project.config, project);
                mainDescription.hasUsed = true;
            }
        }

        for (var s in makeModules )
        {
            Utils.info('Making '+s+' starting ...');
            builder[s](project.config, project);
            Utils.info('Making '+s+' done ...');
        }

    }catch (e)
    {
        Utils.error(e.message);
        if( config.debug=='on')console.log( e );
    }
}

/**
 * 加载并解析模块的描述信息
 * @returns
 */
function loadFragmentModuleDescription( syntax, fragmentModule, config , project )
{
    //解析代码语法
    var scope = makeCodeDescription( fragmentModule.script , config);

    var file = fragmentModule.filepath.replace( new RegExp( config.skin_file_suffix+"$" ),"").replace(/\\/g,'/');

    //获取源文件的路径
    var sourcefile = filepath(file, config.project_path ).replace(/\\/g,'/');

    //获取对应的包和类名
    var fullclassname = PATH.relative( config.project_path, sourcefile ).replace(/\\/g,'/').replace(/\//g,'.');
    fullclassname=fullclassname.replace(/^[\.]+/g,'');
    scope.fullclassname = fullclassname;

    //需要编译的模块
    var module = makeModules[syntax] || (makeModules[syntax]={});
    module[fullclassname] = scope;
    scope.isFragmentModule = true;

    //获取模块的描述
    var description = getPropertyDescription( scope, config, project, syntax );
    description.isFragmentModule = true;
    description.uid= new Date().getTime();
    description.filename = file;
    scope.filename=description.filename;
    scope.description=description;

    //加载导入模块的描述
    for (var i in description.import)
    {
        loadModuleDescription(syntax, description.import[i], config, project, scope.filename );
    }

    define(syntax, description.fullclassname, description );
    return scope;
}

module.exports = make;