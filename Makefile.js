const fs = require('fs');
const PATH = require('path');
const Ruler = require('./lib/ruler.js');
const Utils = require('./lib/utils.js');
const makeSkin = require('./lib/skin.js');
const globals=require('./javascript/descriptions/globals.js');
const uglify = require('s');
const loadModuleDescriptionQueues=[];
var  descriptions={};
var  makeModules={};
var  skinContents=[];
var  styleContents=[];
var requirements={};

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
    return PATH.resolve( base, file.replace(/\./g,'/') );
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
function createDescription( stack , owner )
{
    var desc = {};
    desc.__stack__ = stack;
    desc['id'] =stack.keyword();
    desc['type'] = getType( stack.type() );
    desc['origintype'] = desc['type'];
    desc['privilege'] =stack.qualifier() || "internal";
    desc['static'] = !!stack.static();
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
                var obj = stack.define(desc['param'][i]);
                obj.type = getType(obj.type);
                desc['paramType'].push(obj.type);
            }
        }
    }
    return desc;
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
            error('Invaild Metatype label','syntax', content[0]);
        }
        type = content[0].value;
    }

    if( (type==='Embed') && stack.type()==='(expression)')
    {
        if( content[1].previous(0).value !=='source' )
        {
            error('Missing identifier source','syntax', content[1].previous(0) );
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

function defineProp(proto, name, value, qualifier, type)
{
    if( proto.hasOwnProperty(name) )
    {
        throw new Error('');
    }
    proto[name]={
        'id':'const',
        'type':'('+type+')' ,
        'privilege':qualifier,
        'static':false,
        'value':value,
    };
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
        case 'Bindable' :
            var name = currentStack.name();
            var item = describe[ name ];
            if( item.bindable===true )return;
            if( item.id==='var' )
            {
                var private_var = name;
                var privilege = item.privilege;
                var type = item.type;
                var setter = [
                    'function(val){\n',
                    'var old = this['+config.context.private+'].'+private_var,';\n',
                    'if(old!==val){\n',
                    'this['+config.context.private+'].'+private_var+'=val;\n',
                    'var event = new PropertyEvent(PropertyEvent.CHANGE);\n',
                    'event.property = "'+name+'";\n',
                    'event.oldValue = old;\n',
                    'event.newValue = val;\n',
                    'this.dispatchEvent(event);\n',
                    '}',
                    '}',
                ];
                var getter = [
                    'function(val){\n',
                    'return this['+config.context.private+'].'+private_var,
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
       if( scope[i].id==="class" )
       {
           target[i] = scope[i].fullclassname;
       }
    }
}

function getDeclareClassDescription( stack , isInternal, config, project , syntax )
{
    var list = {'static':{},'proto':{},'import':{},'constructor':{},'attachContent':{} ,'use':{},'namespaces':{},
        'isInternal': isInternal,"privilege":"internal" };
    var isstatic = stack.static();
    var type = stack.fullclassname();
    var prev = null;
    var data = stack.content();
    var i = 0;
    var len = data.length;
    var item;

    if( stack.qualifier() )
    {
        list.privilege = stack.qualifier();
    }

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
                list.constructor = createDescription(item);
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
                    ref[item.name()] = refObj = createDescription(item, type);
                    refObj.value = {};
                }
                refObj.value[item.accessor()] = createDescription(item, type);
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
                ref[item.name()] = createDescription(item, type);
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
    return list;
}


function getNamespaceValue( stack, classModule )
{
    var express = stack.content().slice();
    express.shift();
    express = express[0].content()[0].content().slice();
    express.splice(0, 2);
    var scope = stack.getScopeOf();
    var id = scope.keyword();
    var ret = classModule.package+':'+stack.name();
    if( id==="class" )
    {
        ret = classModule.package+":"+classModule.classname+"/"+stack.qualifier()+":"+stack.name();

    }else if( id==="function" )
    {
        ret = classModule.package+":"+classModule.classname+'/'+stack.qualifier()+":"+scope.name()+"/"+classModule.package+":"+stack.name();
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
        "namespaces":{}, "use":{},"declared":{},"nonglobal":true,"type":'' ,"privilege":"internal"};
    moduleClass.fullclassname = stack.fullclassname;
    var fullclassname = stack.fullclassname.split('.');
    moduleClass.classname = fullclassname.pop();
    moduleClass.package = fullclassname.join(".");

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
                        moduleClass.namespaces[ value.name() ] = createDescription( value );
                        moduleClass.package = item.name();
                        moduleClass.fullclassname =  moduleClass.package ? moduleClass.package+"."+value.name() : value.name();
                        moduleClass.namespaces[ value.name() ].value = getNamespaceValue( value, moduleClass);
                        moduleClass.classname = value.name();
                        moduleClass.id="namespace";
                        count++;

                    }
                    else if ( value.keyword() === "use" )
                    {
                        moduleClass.use[ value.name() ] = "namespace";
                    }
                }
            }
            mergeImportClass( moduleClass.import, item.scope().define() );

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
                    moduleClass.namespaces[item.name()] = createDescription(item);
                    moduleClass.namespaces[item.name()].value = getNamespaceValue(item, moduleClass);

                } else if (id === "class" || id === "interface")
                {
                    moduleClass.declared[item.name()] = getDeclareClassDescription(item, true, config, project, syntax );

                } else if (item.name())
                {
                    moduleClass.declared[item.name()] = createDescription(item);
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
        styleContents = styleContents.concat( modules.styleContents);
        modules = modules.moduleContents;
        for( var index in modules )
        {
            loadFragmentModuleDescription(syntax, modules[ index ], config, project);
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
    var module = makeModules[syntax] || (makeModules[syntax]=[]);
    module.push( scope );

    scope.fullclassname = fullclassname;

    //获取模块的描述
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
             var themes = require('./ColorThemes.js');
             var lessPath = PATH.resolve(config.root_path, './style/');
             var options =  {
                 paths: [ lessPath ],
                 globalVars:themes.default,
                 compress: config.minify ==='on' ,
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

         if( script )
         {
             filename = PATH.resolve(Utils.getBuildPath(config, 'build.webroot.static.js'), config.bootstrap + '.js');
             if( config.minify ==='on' )
             {
                 script = uglify.minify(script, {mangle: true, fromString: true}).code;
             }
             fs.writeFileSync(filename, script );
         }
     },

     'php':function(config,project){

     }
};

/**
 * 开始生成代码片段
 */
function make( config )
{
    makeModules = {};
    descriptions = {};
    requirements = config.requirements || (config.requirements = {});

    //浏览器中的全局模块
    if( config.browser === 'enable' )
    {
        var browser = require('./javascript/descriptions/browser.js');
        for(var b in browser){
            globals[b]=browser[b];
        }
    }
    config.globals=globals;
    config.$getDescriptionAndGlobals = getDescriptionAndGlobals;

    var build_project = config.project.child;
    var project_config;
    var p;
    try
    {
        for (p in build_project)
        {
            var project = build_project[p];
            project.config = project_config = Utils.merge({},config, project.config || {});
            if (typeof project_config.bootstrap === "string" && typeof project_config.syntax === "string")
            {
                if (syntax_supported[project_config.syntax] !== true)
                {
                    throw new Error('Syntax ' + project_config.syntax + ' is not be supported.');
                }
                var classname = PATH.relative( config.project_path, filepath(project_config.bootstrap, project.path ) );
                loadModuleDescription(project_config.syntax, classname, project_config, project);
            }
        }
        Utils.info('Making starting...');
        for (p in build_project)
        {
            var project = build_project[p];
            if (typeof project.config.bootstrap === "string" && typeof project.config.syntax === "string")
            {
                builder[ project.config.syntax ](project.config, project);
            }
        }
        Utils.info('Making done...');
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

    //需要编译的模块
    var module = makeModules[syntax] || (makeModules[syntax]=[]);
    module.push( scope );
    scope.isFragmentModule = true;

    var file = fragmentModule.filepath.replace( new RegExp( config.skin_file_suffix+"$" ),"").replace(/\\/g,'/');

    //获取源文件的路径
    var sourcefile = filepath(file, config.project_path ).replace(/\\/g,'/');

    //获取对应的包和类名
    var fullclassname = PATH.relative( config.project_path, sourcefile ).replace(/\\/g,'/').replace(/\//g,'.');
    scope.fullclassname = fullclassname;

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