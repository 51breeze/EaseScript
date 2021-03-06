const fs = require('fs');
const PATH = require('path');
const Utils = require('./utils.js');
const Skin = require('./skin.js');
const Ruler = require('./ruler.js');
const Compile = require('./compile.js');
const globals=require('./globals.js');
const JS=require('./syntax/javascript.js');
const PHP=require('./syntax/php.js');
const NODEJS=require('./syntax/node.js');
const descriptions={};
const modules={};

var lastStack = null;

/**
 * 模块描述
 * @param classname
 * @returns {{}}
 */
function define(classname, desc )
{
    classname = classname.replace(/\s+/g,'');
    if( typeof desc === 'object' )
    {
        descriptions[ classname ] = desc;
        return desc;
    }
    return descriptions.hasOwnProperty(classname) ? descriptions[classname] : null;
}

/**
 * 代码模块
 * @param classname
 * @param module
 */
function makeModule(classname, module)
{
    classname = classname.replace(/\s+/g,'');
    if( typeof module === 'object' )
    {
        modules[ classname ] = module;
        return module;
    }
    return modules.hasOwnProperty(classname) ? modules[classname] : null;
}

/**
 * 返回指定类名的模块描述信息
 * @param syntax
 * @param classname
 * @returns {boolean}
 */
function getLoaclAndGlobalModuleDescription( classname)
{
    if( descriptions.hasOwnProperty(classname) )
    {
        return descriptions[classname];
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
function createDescription( stack , owner , moduleClass )
{
    var desc = {};
    desc.__stack__ = stack;
    desc['id'] =stack.keyword();
    desc['type'] = getType( stack.type() );
    desc['type'] = getImportType( moduleClass, getType( stack.type() ) );

    if( desc['id']==='function' )
    {
        if( stack.returnType )
        {
            stack.returnType = getImportType( moduleClass, stack.returnType);
            desc['type'] = stack.returnType;
        }
        desc.isReturn = !!stack.getScopeOf().isReturn;
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

    if( moduleClass['id'] === 'interface')
    {
        desc['isInterface'] =true;
    }

    desc['origintype'] = desc['type'];
    desc['privilege'] =stack.qualifier() || "internal";
    desc['static'] = !!stack.static();
    desc['nonglobal'] = true;
    desc['isStatic'] = desc['static'];
    desc['owner'] = owner;
    desc.hasCustomNs = false;
    if( "private,protected,public,internal".indexOf( desc['privilege'] )< 0 )
    {
        desc.hasCustomNs = true;
    }

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
                desc['paramType'].push('...');
            }else{
                var obj = stack.define( desc['param'][i] );
                obj.type = getImportType( moduleClass, getType(obj.type) );
                desc['paramType'].push( obj.type );
            }
        }
    }
    return desc;
}

function getImportType( moduleClass,  type )
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
 * 获取指定模块中引用类的全名
 * @param moduleClass
 * @param classname
 * @returns {*}
 */
function getImportClassnameFull( moduleClass, classname )
{
    if( moduleClass )
    {
        if (moduleClass.import && moduleClass.import.hasOwnProperty(classname))
        {
            return moduleClass.import[classname];
        } else if (moduleClass.classname === classname || moduleClass.fullclassname === classname)
        {
            return moduleClass.fullclassname;
        }
        if( moduleClass.import )
        {
            for (var name in moduleClass.import)
            {
                if (moduleClass.import[name] === classname)
                {
                    return classname;
                }
            }
        }
    }
    if( globals.hasOwnProperty( classname ) )
    {
        return classname;
    }
    return null;
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

function getSyntaxDescByStackName(describe, stack)
{
    if( !(describe.defineMetaTypeList && describe.defineMetaTypeList.Syntax && describe.defineMetaTypeList.Syntax.length > 0) )
    {
        return null;
    }
    var accessor = stack.accessor() === "get" ? "set" : "get";
    var result = describe.defineMetaTypeList.Syntax.filter(function (item) {
        return item.desc.__stack__.name() === stack.name() && item.desc.accessorSetAndGet !== true && !!item.desc.value[ accessor ] ;
    });
    return result[0] || null;
}

/**
 * 解析元类型模块
 * @param stack
 * @param config
 * @returns {string}
 */
function parseMetaType( describe, currentStack, metaTypeStack , config,  syntax , classModule )
{
    const metatype =Utils.executeMetaType(metaTypeToString( metaTypeStack ));
    const mulit={
        Syntax:true,
        Import:true
    };
    const defineMetaTypeList = describe.defineMetaTypeList || (describe.defineMetaTypeList={});

    metatype.metaTypeStack = metaTypeStack;
    lastStack = metaTypeStack;

    if( defineMetaTypeList[ metatype.type ] && mulit[metatype.type] !==true )
    {
        throw new Error('Metatype binding has already exists in same object for "'+metatype.type+'"');
    }

    switch ( metatype.type )
    {
        case "RunPlatform" :
        case "Syntax" :
            var source = metatype.param.value ? metatype.param.value : metatype.param.source;
            var syntaxs = source.toLowerCase().split(",");
            if( "RunPlatform" === metatype.type )
            {
                if( ["client","server"].indexOf(source) < 0 )
                {
                    throw new SyntaxError('Metatype keyword can only be client or server. for "RunPlatform"');
                }
                var serviceSyntax = Object.keys(config.syntax_supported).filter(function(name){
                    return name.toLowerCase() !== 'javascript';
                })
                syntaxs = source === "client" ? ["javascript"] : serviceSyntax;
            }
            else if( "Syntax" === metatype.type && source.toLowerCase() ==="origin" )
            {
                syntaxs = [ config.originMakeSyntax ];
            }

            var syntaxMetatype = defineMetaTypeList.Syntax || (defineMetaTypeList.Syntax=[]);
            syntaxMetatype.forEach(function (a)
            {
                syntaxs.forEach(function (b)
                {
                    if( a.syntaxs.indexOf( b ) >= 0 )
                    {
                        throw new Error('Metatype binding has already exists in same object for "'+metatype.type+'('+source+')"');
                    }
                });
            });

            var descObject =  createDescription( currentStack, classModule.type, classModule);
            if( currentStack instanceof Ruler.SCOPE && currentStack.accessor() )
            {
                descObject.value = {};
                descObject.value[ currentStack.accessor() ] = createDescription( currentStack, classModule.type, classModule)
                descObject.isAccessor = true;
                var accessorName = currentStack.accessor() === "get" ? "set" : "get";
                if( describe.value[ accessorName ] )
                {
                    descObject.value[ accessorName ] = createDescription(describe.value[ accessorName ].__stack__, classModule.type, classModule);
                    if( accessorName === 'get' )
                    {
                        descObject.type = descObject.value[ accessorName ].type;
                    }
                    if (accessorName === 'set')
                    {
                        descObject.paramType = descObject.value[ accessorName ].paramType;
                        descObject.param = descObject.paramType;
                    }
                }

                if( descObject.value.get && descObject.value.set )
                {
                    descObject.accessorSetAndGet = true;
                }

                if( currentStack.accessor() === 'get' )
                {
                    descObject.type = descObject.value[ currentStack.accessor() ].type;
                }
                if (currentStack.accessor() === 'set')
                {
                    descObject.paramType = descObject.value[ currentStack.accessor() ].paramType;
                    descObject.param = descObject.paramType;
                }
            }
            syntaxMetatype.push({"metatype":metatype, "desc":descObject, "syntaxs":syntaxs});
            break;
        case "Remove" :
            defineMetaTypeList.Remove = metatype;
            metatype.param.syntaxs = metatype.param.value.toLowerCase()==="origin" ? [ config.originMakeSyntax ] : metatype.param.value.toLowerCase().split(",");
            metatype.param.expect =  metatype.param.expect.toLowerCase() !== "false";
            break;
        case "ArrayElementType" :
            defineMetaTypeList[metatype.type] = metatype;
            describe.arrayElementType = metatype.param.source;
            break;
        case 'Skin' :
            defineMetaTypeList[metatype.type] = metatype;
            var source = metatype.param.source;
            var _skinModule = loadSkinModuleDescription(syntax, source , config);
            describe.value = ' System.getDefinitionByName("'+source+'")';
            Compile.setClassModuleUsed( Compile.getLoaclAndGlobalModuleDescription("System"), classModule)
            Compile.setClassModuleUsed( _skinModule, classModule)
            break;
        case 'Embed' :
            defineMetaTypeList[metatype.type] = metatype;
            var dest = Utils.parseMetaEmbed(metatype, config, classModule.filename ? [ PATH.dirname(classModule.filename) ] : null );
            var build_path = Utils.getBuildPath( config ,"build.webroot");
            dest= PATH.relative(build_path, dest ).replace(/\\/g,'/');
            describe.value = '"'+dest+'"';
            break;
        case 'Import' :
            var importMetatype = defineMetaTypeList.Import || (defineMetaTypeList.Import=[]);

            if( !metatype.param.alias )
            {
                metatype.param.alias = PATH.parse( metatype.param.file ).name;
            }

            if( !/^[a-zA-Z_]+[a-zA-Z_\d]+?$/.test(metatype.param.alias) )
            {
               throw new ReferenceError(`Invalid alias param in Import metatype. for '${metatype.param.alias}'`);
            }

            if( !metatype.param.syntax )
            {
                metatype.param.syntax = "javascript";
            }

            metatype.param.syntax = metatype.param.syntax.split(",").map(function(val){
                return Utils.trim( val );
            });

            metatype.param.file = require.resolve( metatype.param.file, {paths:[config.workspace]} ).replace(/\\/g,'/');
            importMetatype.push(metatype);
            classModule.declared[ metatype.param.alias ] = {
                type:metatype.param.alias,
                id:"class",
                notCheckType:true,
                runningCheck:false,
                isImportMetatype:true,
                path:metatype.param.file,
                proto:'*',
                static:'*',
                defineMetaTypeList:{
                    Syntax:[{"metatype":{param:{}}, "desc":{}, "syntaxs":metatype.param.syntax }]
                }
            };
            
            break;
        case 'Bindable' :
            defineMetaTypeList[metatype.type] = metatype;
            var name = currentStack.name();
            var item = describe;
            if( item.bindable===true )return;
            var eventType = ["PropertyEvent","CHANGE"];
            if( metatype.param.eventType )
            {
                if( metatype.param.eventType.lastIndexOf('.')>0 )
                {
                    eventType =  metatype.param.eventType.split(".");
                }else{
                    eventType = ['"'+ metatype.param.eventType+'"'];
                }
            }

            if( eventType[0]==="PropertyEvent" )
            {
                Compile.setClassModuleUsed( Compile.getLoaclAndGlobalModuleDescription("PropertyEvent"), classModule)
                if( !classModule.import.hasOwnProperty("PropertyEvent") )
                {
                    classModule.import["PropertyEvent"] = "PropertyEvent";
                }
            }

            if( item.id==='var' )
            {
                var type = item.type;
                var privatePropName = "_"+name;
                var ii = 1;
                while ( currentStack.getScopeOf().define( privatePropName ) )
                {
                    privatePropName = "_"+name+ii++;
                }
                item.id="function";
                item.varToBindable = true;
                item.isAccessor    = true;
                item.accessorName = name;
                item.accessorPropName = privatePropName;
                item.eventType = eventType;
                item.value = {
                    "set":{
                        'id':'function',"privilege":"public","bindable":true,"accessorPropName":privatePropName,"accessorName":name,"eventType":eventType,
                        "type":"void",'isAccessor':true,'varToBindable':true, "value":null},
                    "get":{
                        'id':'function',"privilege":"public","bindable":true,"accessorPropName":privatePropName,"accessorName":name,"eventType":eventType,
                        "type":type,'isAccessor':true,'varToBindable':true, "value":null}
                }
            }
            item.bindable = true;
            break;
        case 'Injection' :
            var obj = currentStack.parent().scope().define( currentStack.name() );
            if( describe.privilege !== "public" || !describe.isAccessor || !obj.get || !obj.set )
            {
                throw new ReferenceError('Injection can only be bound to a public accessor.');
            }

            var returnType = obj.reference.get.returnType;

            //加载需要的类型
            if( metatype.param.value )
            {
                loadModuleDescription(syntax, metatype.param.value , config , null , config.suffix , true , classModule );
            }
            //默认使用访问器的数据类型
            else
            {
                if( returnType==="*" )
                {
                    throw new ReferenceError('Injection data value cannot be generic type.');
                }
                returnType = getImportClassnameFull(classModule, returnType);
                metatype.param.value = returnType;
            }

            //注入数据的实例类型
            var instanceType =  getLoaclAndGlobalModuleDescription( metatype.param.value );

            //接口类型不能实例对象
            if( instanceType.id === "interface" )
            {
                throw new ReferenceError('Injection data value cannot be interface('+metatype.param.value+') type.');
            }

            //检查访问器的数据类型是否与注入的数据类型一致
            if( returnType !== "*" && metatype.param.value !== returnType )
            {
                returnType = getImportClassnameFull(classModule, returnType);
                if( !checkInstanceOf( instanceType, returnType ) )
                {
                    throw new ReferenceError('Injection the "'+metatype.param.value+'" data type cannot be converted to the "'+returnType+'" type of the accessor');
                }
            }
            defineMetaTypeList[ metatype.type ]= metatype;
            break;
        case 'View' :
            var viewModule = loadSkinModuleDescription(syntax, metatype.param.source, config );
            if( !classModule.import[ viewModule.classname ] ){
                classModule.import[ viewModule.classname ] = viewModule.fullclassname;
            }else
            {
                classModule.import[ viewModule.fullclassname ]=classModule.fullclassname;
            }
            defineMetaTypeList[ metatype.type ]= metatype;
            break;
        case "Router" :

            var _default ={
                "method": metatype.param.value||"get",
                "alias": currentStack.name(),
            };

            var action = currentStack;
            if( currentStack.keyword() === "function" )
            {
                _default.provider = classModule.fullclassname+'@'+currentStack.name();
                //方法必须为公开的
                if( describe.privilege !=="public" )
                {
                    throw ReferenceError('The "'+currentStack.name()+'" method qualifier must be public.');
                }

            }else if( currentStack.keyword() === "class" )
            {
                if( metatype.param.value )
                {
                    metatype.param.default = metatype.param.value;
                }
                classModule.moduleRouterProvider = _default;
                _default.isModule = true;
                //必须指定默认方法
                if( metatype.param.default ) {
                    _default.provider = classModule.fullclassname + '@' + metatype.param.default;
                }else{
                    throw SyntaxError('The default method is not specified.');
                }

                var scope = currentStack.getScopeOf();
                action = scope.define( metatype.param.default );
                if( action ){
                    action = action.reference;
                }

                if( metatype.param.default === classModule.classname )
                {
                    throw ReferenceError('Cannot bound to constructor');
                }

            }else
            {
                throw SyntaxError('Router metatype only can bound to the class or function.');
            }

            if( !action || action.keyword() !=="function" )
            {
                throw ReferenceError('Not found the specified method. for "'+metatype.param.default+'"');
            }

            //方法必须为公开的
            if( action.qualifier() !== "public" )
            {
                throw ReferenceError('The "'+metatype.param.default+'" method qualifier must be public. in Router metatype');
            }

            //合并参数
            metatype.param = Utils.merge( _default, metatype.param );
            //如果指定的参数没有指定默认值的必须在路由中绑定
            var requireBound = [];
            Utils.forEach( currentStack.param(), function (name) {
                if( !currentStack.define( name ).value ){
                    requireBound.push( name )
                }
            });
            //已经指定的绑定
            var bound = _default.alias.match(/\{.*?\}/g);
            //必须要在路由中绑定的参数
            if( requireBound.length > 0 )
            {
                //已经绑定的参数不能小于方法要求的参数
                if( bound && bound.length < requireBound.length )
                {
                    throw TypeError('The alias missing bound parameters. give "'+existBound.join(",")+'".');
                }
                //默认绑定全部参数
                else if( !bound )
                {
                    _default.alias = _default.alias.replace(/\/$/,'')+"/{"+requireBound.join("}/{")+"}";
                }
            }

            if( _default.isModule )
            {
                _default.alias = '/'+_default.alias.replace(/^\//,'');

            }else if( !_default.alias.match(/^\//) )
            {
                if( classModule.moduleRouterProvider )
                {
                    _default.alias = '/'+classModule.moduleRouterProvider.alias.replace(/^\/|\/$/g,'')+'/'+ _default.alias;
                }else{
                    _default.alias = '/'+classModule.fullclassname.replace(/\./g,'/')+'/'+_default.alias;
                }
            } 
        
            var controllerRouteList = classModule.controllerRouteList || (classModule.controllerRouteList={});
            var methods = metatype.param.method.split(",");
            var allowMethods = ["get","put","post","delete","option"];
            Utils.forEach(methods,function (method) {
                var key = method + ":" +metatype.param.alias;
                //是否已经存在
                if( controllerRouteList[ key ] && !classModule.isModify )
                {
                    throw TypeError( 'The "'+metatype.param.alias+'" already bound to '+metatype.param.method+' request.');
                }
                if( allowMethods.indexOf( method.toLowerCase() ) < 0 )
                {
                    throw SyntaxError( 'The "'+metatype.param.method+'" method of the specified request is invalid. optionals for "'+allowMethods.join(",")+'".');
                }

                //加入到全局哈希值中
                if( Compile.global_route_unique_hash[ key ] && !classModule.isModify )
                {
                    throw TypeError( 'The "'+metatype.param.alias+'" already bound to '+Compile.global_route_unique_hash[ key ] );
                }
                Compile.global_route_unique_hash[ key ] = metatype.param.provider;
                controllerRouteList[ key ] = Utils.merge({},metatype.param,{"method":method});
            });
            defineMetaTypeList[ metatype.type ]= metatype;
            break;
        default:
            defineMetaTypeList[ metatype.type ]= metatype;
    }
}

function mergeImportClass(classModule, scope, config)
{
    for (var i in scope)
    {
        if( scope[i].id==="class" && scope[i]['import']===true )
        {
            if( scope[i].fullclassname.slice(-2) ===".*" )
            {
                var stack = scope[i].stack;
                var namespace = scope[i].fullclassname.slice(0,-2);
                var basedir = PATH.join( config.project_path, namespace.replace(/\./g,'/') );
                var files = Utils.getDirectoryFiles( basedir );
                lastStack = stack;
                if( !files )
                {
                    throw new Error( 'The "'+basedir+'" path is not exists.');
                }
                files.forEach(function (filename) {
                    var classname = PATH.basename( filename, config.suffix );
                    var fullclassname = namespace ? namespace+"."+classname : classname;
                    if( classname === classModule.classname ){
                        classname = fullclassname;
                    }
                    classModule.import[ classname ] = fullclassname;
                    scope[ classname ] = {
                        type:"("+classname+")",
                        fullclassname:fullclassname,
                        classname:classname,
                        import:true,
                        stack:stack
                    }
                });

            }else
            {
               classModule.import[i] = scope[i].fullclassname;
            }
        }
    }
}

function getDeclareClassDescription(moduleClass, stack , isInternal, config, syntax )
{
    var list = moduleClass;
    var isstatic = stack.static();
    var type = stack.fullclassname();
    var data = stack.content();
    var i = 0;
    var len = data.length;
    var item;
    var metatypelist = [];
    list.isInternal = isInternal;
    list['inherit'] = stack.extends() ? stack.extends() : null;
    list['package'] = stack.parent().keyword()==="package" ? stack.parent().name() : "";
    list['type'] = stack.fullclassname();
    list['nonglobal'] = true;
    list['fullclassname'] = stack.fullclassname();
    list['classname'] = stack.name();

    if( isInternal )
    {
        var _content = stack.parent().content();
        var cIn = 0;
        var cLen = _content.length;
        for(;cIn<cLen;cIn++)
        {
            if( _content[cIn].keyword()==="package" )
            {
                list['package'] = _content[cIn].name();
                if( list['package'] )
                {
                    // list['fullclassname'] = list['package'] + "." + stack.name();
                    //list['type'] = list['fullclassname'];
                }
                break;
            }
        }
    }

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

    mergeImportClass( list, stack.scope().define() , config );
    if( list['inherit']  )
    {
        //继承的类名，在构建时需要保持引用
        list['inherit'].split(",").forEach(function(name)
        {
             if( !list.import.hasOwnProperty( name ) && !globals.hasOwnProperty( name ) )
             {
                 list.import[ name ] = list['package']+"."+name;
             }
        });
    }

    for (; i < len; i++)
    {
        item = data[i];
        lastStack = item;
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

            var isConstructor = false;

            //使用命名空间
            if ( item.keyword() === "use" )
            {
                list.use[ item.name() ] = "namespace";
                continue;
            }
            //先保存声明的数据元
            else if( item.keyword() === 'metatype' )
            {
                metatypelist.push( item );
            }
            //访问器
            else if (item instanceof Ruler.SCOPE && item.accessor())
            {
                var refObj = ref[item.name()];
                if (!refObj) {
                    ref[item.name()] = refObj = createDescription(item, type, list );
                    refObj.value = {};
                }
                if( refObj.value )
                {
                   refObj.value[item.accessor()] = createDescription(item, type, list);
                }
                refObj.isAccessor = true;
                if (item.accessor() === 'get' && refObj.value ) {
                    refObj.type = refObj.value[item.accessor()].type;
                }
                if (item.accessor() === 'set') {
                    refObj.paramType = refObj.value[item.accessor()].paramType;
                    refObj.param = refObj.paramType;
                }
                var syntaxMetatype = getSyntaxDescByStackName(refObj, item);
                if( syntaxMetatype )
                {
                    var descValue = syntaxMetatype.desc.value;
                    descValue[ item.accessor() ] = createDescription(item, type, list);
                    if( item.accessor() === 'get' )
                    {
                        syntaxMetatype.desc.type = descValue[item.accessor()].type;
                    }
                    if (item.accessor() === 'set')
                    {
                        syntaxMetatype.desc.paramType = descValue[item.accessor()].paramType;
                        syntaxMetatype.desc.param = syntaxMetatype.desc.paramType;
                    }
                    if( syntaxMetatype.desc.value.get &&  syntaxMetatype.desc.value.set )
                    {
                        syntaxMetatype.desc.accessorSetAndGet = true;
                    }
                }
            }
            else
            {
                //构造函数
                if (item.keyword() === 'function' && item.name() === stack.name() && !isstatic )
                {
                    isConstructor = true;
                }

                var descObject =  isConstructor ? list.constructor : ref.hasOwnProperty( item.name() ) ? ref[ item.name() ] : null;
                if( !descObject )
                {
                    descObject = createDescription( item, type, list);
                    if( isConstructor ){
                        list.constructor = descObject;
                        descObject.isConstructor = true;
                    }else{
                        ref[ item.name() ] = descObject;
                    }
                }
            }

            //为当前的成员绑定数据元
            if ( metatypelist.length > 0 && item.keyword() !== 'metatype')
            {
                var mLen = metatypelist.length;
                var mI = 0;
                var desc =  isConstructor ? list.constructor : ref[item.name()];
                for(;mI<mLen;mI++)
                {
                    parseMetaType(desc, item, metatypelist[mI], config, syntax, list );
                }
                metatypelist = [];
            }
        }
    }

    if( !list.constructor )
    {
        list.constructor = {};
    }
    return list;
}

function getClassDescriptionStructure() {
    return {
        'static':{},
        'proto':{},
        'import':{},
        'constructor':null,
        'attachContent':{},
        "rootContent":{},
        'defineMetaTypeList':{},
        'hasPackage':false,
        "isInternal":false,
        "namespaces":{},
        "use":{},
        "declared":{},
        "rootExpression":[],
        "nonglobal":true,
        "type":'' ,
        "privilege":"internal",
        'requirements':{},
        'hasUsed':false
    };
}

var root_block_declared=['class','interface','const','var','let','use','function','namespace'];

/**
 * 获取类的成员信息
 */
function getPropertyDescription( stack , config, syntax, sourceFile )
{
    var moduleClass = getClassDescriptionStructure();
    moduleClass.fullclassname = stack.fullclassname;
    var fullclassname = stack.fullclassname.split('.');
    moduleClass.classname = fullclassname.pop();
    moduleClass.package = fullclassname.join(".");
    moduleClass.rootStack=stack;
    moduleClass.isModify = stack.isModify;
    moduleClass.filename = sourceFile;

    var has = false;
    var data = stack.content();
    var i = 0;
    var item;
    var len = data.length;
    var count = 0;
    var metatypelist = [];
    for( ;i<len ;i++ )
    {
        item = data[i];
        lastStack = item;
        if( !(item instanceof Ruler.STACK) )
        {
            continue;
        }

        var id = item.keyword();
        if( id ==="package" )
        {
            moduleClass.hasPackage = true;
            if( has )Utils.error("package cannot have more than one");
            has = true;
            var datalist = item.content();
            var value;
            for(var b=0; b< datalist.length; b++ )
            {
                value = datalist[b];
                lastStack = value;
                if( value instanceof Ruler.STACK )
                {
                    if (value.keyword() === "class" || value.keyword() === "interface")
                    {
                        //为当前的成员绑定数据元
                        if ( metatypelist.length > 0 )
                        {
                            Utils.forEach(metatypelist,function (item) {
                                parseMetaType( moduleClass, value, item , config,  syntax , moduleClass );
                            })
                            metatypelist = [];
                        }
                       getDeclareClassDescription(moduleClass,  value, false, config, syntax ) ;

                    } else if ( value.keyword() === "namespace" )
                    {
                        if( moduleClass.namespaces.hasOwnProperty( value.name() ) )
                        {
                            Utils.error('"'+value.name()+'" is already been declared');
                        }
                        mergeImportClass( moduleClass, item.scope().define() , config );
                        moduleClass.namespaces[ value.name() ] = createDescription( value, null,  moduleClass);
                        moduleClass.package = item.name();
                        moduleClass.fullclassname =  moduleClass.package ? moduleClass.package+"."+value.name() : value.name();
                        //moduleClass.namespaces[ value.name() ].value = getNamespaceValue( value, moduleClass);
                        moduleClass.classname = value.name();
                        moduleClass.id="namespace";
                        moduleClass.type=moduleClass.fullclassname;
                        count++;
                    }
                    else if ( value.keyword() === "use" )
                    {
                        moduleClass.use[ value.name() ] = "namespace";

                    } else if ( value.keyword() === "metatype" )
                    {
                        metatypelist.push( value );
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
                if (moduleClass.declared.hasOwnProperty(item.name()))
                {
                    Utils.error('"' + item.name() + '" is already been declared');
                }

                if (id === "namespace")
                {
                    if (moduleClass.namespaces.hasOwnProperty(item.name()))
                    {
                        Utils.error('"' + item.name() + '" is already been declared');
                    }
                    moduleClass.namespaces[item.name()] = createDescription(item,null,  moduleClass);
                    //moduleClass.namespaces[item.name()].value = getNamespaceValue(item, moduleClass);
                }
                //不在包结构中的类
                else if (id === "class" || id === "interface")
                {
                    var hasPackage = moduleClass.hasPackage;
                    if( item.parent().keyword() ==="rootblock" && !hasPackage )
                    {
                        hasPackage = item.parent().content()[0].keyword() === "package";
                    }

                    var subClass = getClassDescriptionStructure();

                    //为当前的成员绑定数据元
                    if ( metatypelist.length > 0 )
                    {
                        Utils.forEach(metatypelist,function (item) {
                            parseMetaType(subClass, value, item , config,  syntax , subClass );
                        })
                        metatypelist = [];
                    }

                    getDeclareClassDescription(subClass, item, hasPackage , config, syntax );
                    subClass.nonPackageClass =  true;
                    if( hasPackage )
                    {
                        subClass.rootStack=item;
                        subClass.namespaces = Utils.merge( moduleClass.declared[item.name()] ,moduleClass.namespaces);
                        moduleClass.declared[item.name()] = subClass;

                    }else
                    {
                        Utils.merge( moduleClass , subClass);
                    }
                }
                else if ( id === "metatype" )
                {
                    metatypelist.push( item );
                }
                //全局函数
                else if ( item.name() )
                {
                    moduleClass.declared[ item.name() ] = createDescription(item,null,  moduleClass);
                }
            }

        }else
        {
            //other expression
        }
    }

    if( moduleClass.id==="namespace" && count > 1 )
    {
        throw new Error('The content of the namespace is defined not greater than one');
    }
    //root block
    mergeImportClass( moduleClass, stack.scope().define() , config );
    lastStack = null;
    return moduleClass;
}

//构建代码描述
function makeCodeDescription( content ,config )
{
    //获取代码描述
    var R= new Ruler( content, config );
    //侦听块级域
    if( config.blockScope )
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
 * 加载皮肤模块的描述信息
 * @returns
 */
function loadSkinModuleDescription(syntax, skinClassName , config, ownerModule )
{
    var module = Skin( skinClassName , config , syntax , ownerModule );
    //返回空表示不需要编译
    if( module )
    {
        loadFragmentModuleDescription(syntax, module, config);
    }
    return define(skinClassName);
}

/**
 * 加载并解析模块的描述信息
 * @returns
 */
function loadModuleDescription(syntax, file , config , resource , suffix , nonSkin , ownerModule )
{
    suffix= suffix || config.suffix;

    var absolute = PATH.isAbsolute(file) && fs.existsSync(file);

    //获取源文件的路径
    var sourcefile = !absolute ? filepath(file, config.project_path ).replace(/\\/g,'/') : file;

    //获取对应的包和类名
    var fullclassname = PATH.relative( config.project_path, sourcefile ).replace(/\\/g,'/').replace(/\//g,'.').replace(/^[\.]+/g,'');

    //是否加载系统库中的文件
    if( fullclassname.indexOf( config.system_lib_path_name+'.' )===0 )
    {
        sourcefile = filepath( fullclassname, config.system_lib_path ).replace(/\\/g,'/');
    }

    var modify = false;
    var orignSuffix = suffix;
    var ext = null;

    if( !absolute )
    {
        if( fs.existsSync(sourcefile+config.skin_file_suffix) )
        {
            orignSuffix = config.skin_file_suffix;
            sourcefile = sourcefile+config.skin_file_suffix;
            ext = orignSuffix;
        }else{
            sourcefile = sourcefile+suffix;
            ext = suffix;
        }
    }else
    {
        ext = PATH.parse( file ).ext;
        if( fullclassname.slice( -ext.length ) === ext )
        {
            fullclassname = fullclassname.slice(0,-ext.length);
        }
    }

    //判断文件是否规定的格式
    if( !(ext === config.skin_file_suffix || ext === config.suffix)  )
    {
        throw new Error('Invalid file for '+sourcefile );
    }

    //如果已存在就返回
    var description = getLoaclAndGlobalModuleDescription( fullclassname );
    if( description )
    {
        if( !description.nonglobal )
        {
            return description;
        }

        if( ( new Date( fs.statSync( sourcefile ).mtime ) ).getTime() === description.uid )
        {
            return description;
        }
        modify = true;
    }

    if( !fs.existsSync(sourcefile) )
    {
        throw new Error('Not found '+sourcefile);
    }

     //加载皮肤
    if( ext === config.skin_file_suffix && nonSkin !== true )
    {
         //加载皮肤
         return loadSkinModuleDescription( syntax, fullclassname , config , ownerModule );
    }

    var old_description = description;

    //先占个位
    define(fullclassname, {} );

    //检查源文件的状态
    var stat = fs.statSync( sourcefile );

    //源文件修改过的时间
    var id = new Date(stat.mtime).getTime();

    //编译源文件
    Utils.info('Checking file '+sourcefile+'...');

    if( description )
    {
        for( var _name in Compile.global_route_unique_hash )
        {
            var provider=Compile.global_route_unique_hash[ _name ];
           if( provider.substr(0,fullclassname.length) === fullclassname )
           {
                delete Compile.global_route_unique_hash[ _name ];
           }
        }
    }

    //解析代码语法
    var scope = null;
    try{
        var sourceContent = fs.readFileSync( sourcefile , 'utf-8');
        scope = makeCodeDescription(sourceContent, config );
        //需要编译的模块
        makeModule( fullclassname, scope );
        //获取模块的描述
        scope.fullclassname = fullclassname;
        scope.isModify = modify;
        description = getPropertyDescription( scope, config, syntax, sourcefile );

        if( old_description )
        {
            description.has_used_in_syntax=old_description.has_used_in_syntax;
            description.hasUsed = old_description.hasUsed;
        }

        description.uid= id;
        description.isModify = modify;
        description.filename = sourcefile.replace(/\\/g,'/');
        description.ownerModule = ownerModule;
        description.__sourceContent__=sourceContent;
        scope.filename = description.filename;
        scope.description = description;
        if( fullclassname !== description.fullclassname )
        {
            throw new SyntaxError( "Inconformity of file path. the '"+fullclassname+"' with the '"+ description.fullclassname+"' package" );
        }

        define( fullclassname, description );

        //加载导入模块的描述
        for (var i in description.import)
        {
            var file =  description.import[i];
            loadModuleDescription( syntax, file, config,  description.filename, suffix, false, description );
        }
        return description;


    }catch (e)
    {
        var info = "";
        if( lastStack )
        {
            var stack = Ruler.getStackItem(lastStack);
            if( stack ){
                info = " "+stack.line + ":"+stack.cursor ;
            }
        }
        define(fullclassname, null);
        console.log(e)
        throw new SyntaxError(  e.message +"\r\nfile: "+sourcefile+info );
    }
}


/**
 * 加载并解析皮肤和碎片模块的描述信息
 * @returns
 */
function loadFragmentModuleDescription( syntax, fragmentModule, config, isTemp )
{
    //获取源文件的路径
    var file = fragmentModule.filepath;

    //解析代码语法
    var scope=null;
    try{
        scope = makeCodeDescription( fragmentModule.script , config);
    }catch (e)
    {
        console.log(e)
        throw new SyntaxError( e.message +"\r\nfile: "+file );
    }

    //获取对应的包和类名
    var fullclassname = fragmentModule.fullclassname || "";
    scope.fullclassname = fullclassname;
    scope.isFragmentModule = true;

    //获取模块的描述
    var description = getPropertyDescription( scope, config , syntax, file );
    var old_description = define( fullclassname );
    if( old_description )
    {
        description.has_used_in_syntax=old_description.has_used_in_syntax;
        description.hasUsed = old_description.hasUsed;
    }
    description.__sourceContent__=fragmentModule.script;

    if( !isTemp )
    {
        //需要编译的模块
        makeModule(fullclassname, scope);
        description.isFragmentModule = true;
        description.uid = fragmentModule.uid;
        description.filename = file;
        description.isSkinModule = !!fragmentModule.isSkin;
        description.ownerFragmentModule = fragmentModule;
        define(description.fullclassname, description);
    }

    scope.filename=description.filename;
    scope.description=description;

    //加载导入模块的描述
    for (var i in description.import)
    {
        loadModuleDescription( syntax, description.import[i], config, scope.filename, null, false, description);
    }
    if( isTemp===true ){
        return scope;
    }
    return description;
}

/**
 * 执行模块的原型链，直到回调函数返回值或者已到达最上层为止
 * @param classModule
 * @param callback
 * @returns {*}
 */
function doPrototype(module, callback)
{
    while ( module )
    {
        var val = callback( module );
        if( val )return val;
        if( module.inherit )
        {
            module =  getLoaclAndGlobalModuleDescription( module.import ? module.import[ module.inherit ] : module.inherit )
        }else
        {
            return null;
        }
    }
    return null;
}

/**
 * 检查类型
 * @returns {*}
 */
function checkInstanceOf( classModule, classType, isInterface )
{
    return doPrototype(classModule, function (classModule)
    {
        if( (classModule.fullclassname || classModule.type) === classType )return true;
        if( isInterface && classModule.implements && classModule.implements.length > 0  )for( var i in classModule.implements )
        {
            var name = classModule.implements[i];
            if( doPrototype( getLoaclAndGlobalModuleDescription( classModule.import ? classModule.import[name] : name ) ,function (interfaceModule) {
                if( interfaceModule.fullclassname === classType )return true;
            })){
                return true;
            }
        }
    });
}

/**
 * 判断类文件是否存在
 * @param file
 * @param config
 * @param suffix
 * @returns {*}
 */
function isClassFileExists( file , config ,  suffix )
{
    if( globals.hasOwnProperty(file) )
    {
        return true;
    }

    suffix = suffix || config.suffix;

    //获取源文件的路径
    var sourcefile = filepath(file, config.project_path).replace(/\\/g, '/');

    //获取对应的包和类名
    var fullclassname = PATH.relative(config.project_path, sourcefile).replace(/\\/g, '/').replace(/\//g, '.');
    fullclassname = fullclassname.replace(/^[\.]+/g, '');

    //是否加载系统库中的文件
    if (fullclassname.indexOf(config.system_lib_path_name + '.') === 0) {
        sourcefile = filepath(fullclassname, config.system_lib_path).replace(/\\/g, '/');
    }
    return fs.existsSync(sourcefile + suffix);
}

var Maker = {
    "localDescriptions":descriptions,
    "localModules":modules,
    "globalDescriptions":globals,
    "descriptionByName":function ( fullclassname ) {
        return define( fullclassname );
    },
    "makeModuleByName":function (fullclassname) {
        return makeModule(fullclassname);
    },
    "loadModuleDescription":loadModuleDescription,
    "isClassFileExists":isClassFileExists,
    "loadFragmentModuleDescription":loadFragmentModuleDescription,
    "loadSkinModuleDescription":loadSkinModuleDescription,
    "getLoaclAndGlobalModuleDescription":getLoaclAndGlobalModuleDescription,
    "checkInstanceOf":checkInstanceOf,
    "getImportType":getImportType,
    "getImportClassnameFull":getImportClassnameFull,
    "setClassModuleUsed":Compile.setClassModuleUsed,
    "makeCodeDescription":makeCodeDescription,
    "getStackItem":Ruler.getStackItem
}

Object.assign(PHP,Maker);
Object.assign(JS,Maker);
Object.assign(NODEJS,Maker);
Object.assign(Compile,Maker);
Object.assign(Skin,Maker);
const syntaxBuilder={
    "php":PHP,
    "javascript":JS,
    "node":NODEJS,
};
Compile.syntaxBuilder=syntaxBuilder;
Skin.syntaxBuilder = syntaxBuilder;
Maker.Compile = Compile;
Maker.Skin = Skin;

PHP.Compile=Compile;
JS.Compile=Compile;
NODEJS.Compile=Compile;


module.exports = Maker;