const Utils  = require('../utils.js');
const path = require('path');
const compile = require("../compile.js");
const typeMap={
    "class":1,
    "interface":2,  
    "namespace":3,
}

const numberType = ["int","Integer","uint","float","double","number"];
const typeToStringMap = {"class":true,"int":"Number","integer":"Number","uint":"Number","float":"Number","double":"Number","boolean":"Boolean"};

const ATTR_TYPE={
    "function":1,
    "get":2,
    "set":4,
    "var":8,
    "const":16,
    "namespace":32
};

function getCanClassName( typeClassName )
{
    var value=null;
    if( (value=typeToStringMap[ typeClassName.toLowerCase() ]) )
    {
        if( value !==true )
        {
            return value;
        }
        return '"'+typeClassName.toLowerCase()+'"';
    }
    return typeClassName;
}

const excludeMap={
    "arguments":true,
    "Console":true,
    "console":true,
    "JSON":true,
    "Function":true,
    "Error":true,
    "SyntaxError":true,
    "ReferenceError":true,
    "URIError":true,
    "TypeError":true,
    "EvalError":true,
    "RangeError":true,
};


function makeExportModuleString( classname, classModule, inheritModule, importMap, propertiesAndMethod, externalCode, config, uri )
{
    var mapHash = {};
    var isInternal = classModule.isInternal;
    var requirements = {"Symbol":true,"Object":true,"Internal":true};
    var build_path = path.join( Utils.getBuildPath(config, "build.application"), classModule.package.replace(/\./g,"/") );

    if( classModule.id==="namespace" )
    {
        requirements.Namespace = true;
        requirements.Symbol = false;
    }

    for(var n in importMap )
    {
        if( classModule.fullclassname !== importMap[n].fullclassname && !importMap[n].isInternal )
        {
            var name = n;
            var idClass='';
            if( importMap[n].nonglobal )
            {
                idClass = Utils.getRequireIdentifier( config, importMap[n], 'node', build_path );

            }else if( importMap[n].type )
            {
                if( requirements.hasOwnProperty( importMap[n].type ) )
                {
                    requirements[ importMap[n].type  ] = false;
                }

                if( importMap[n].notLoadFile || Utils.excludeLoadSystemFile( importMap[n].type, excludeMap  ) )
                {
                    continue;
                }

                idClass = Utils.getRequireIdentifier( config, importMap[n], 'node', build_path );
            }
            mapHash[ idClass  ] = name;
        }
    }

    Utils.forEach(requirements,function(require,type)
    {
        if( require === true && !Utils.excludeLoadSystemFile( type, excludeMap ) )
        {
            var _type = Utils.getGlobalTypeMap( type );
            if( config.globals[ _type ] )
            {
               compile.setClassModuleUsed( config.globals[ _type ], classModule );
            }
            idClass = Utils.getRequireIdentifier( config, config.globals[ _type ] || {type:_type} , 'node', build_path );
            mapHash[ idClass  ] = _type;
        }
    });
    

    var str="";
    var moduleStatement = makeModuleStatement( classModule );
    str+= moduleStatement+';\n';

    if( !isInternal )
    {
        str += "module.exports="+classname+";\n";
    }

    Utils.forEach(mapHash,function(name,key)
    {
        str+="var "+name+"=require(\""+key+"\");\n";
    });

    if( classModule.id === "namespace" ) 
    {
        str += 'Object.defineProperty(' +classname+ ', "valueOf", {value:function valueOf(){\nreturn "' +propertiesAndMethod + '";\n}});\n';
    }
    
    if( classModule.id !== "namespace" )
    {
        str +='var '+config.context.private+"=Symbol(\""+classModule.fullclassname+"\").valueOf();\n";
        str += propertiesAndMethod||"";
    }

    var descriptor = makeModuleDescriptorString( config, classModule, inheritModule, uri );
    var identifier = Utils.getRequireIdentifier(config, classModule, 'node');
    str+='Internal.defineClass("'+identifier+'",'+classname+',{\n\t'+descriptor.join(',\n\t')+'\n},'+typeMap[ classModule.id ]+');\n';

    if( externalCode )
    {
        str += externalCode;
    }
    if( isInternal )
    {
        str += "return "+classname+";";
        str="(function(){\n"+str+"\n}());\n";
    }
    return str;
}


function makeModuleStatement(classModule)
{
    var moduleStatement = "";
    if( classModule.id ==='class' && !classModule.isStatic   )
    {
        moduleStatement= classModule.constructor.value;
        //moduleStatement= 'function '+classModule.classname+'(){\nconstructor.apply(this,arguments);\n}';
    }
    else if( classModule.id==="namespace" )
    {
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Namespace"), classModule );
        moduleStatement= 'function '+classModule.classname+'(prefix,uri){\nNamespace.call(this,prefix,uri);\n}';
    }
    else 
    {
        moduleStatement= 'function '+classModule.classname+'(){\nthrow new TypeError("\\"'+classModule.fullclassname+'\\" is not constructor.");\n}';
    }
    return moduleStatement;
}


function getRefClassName(classModule,fullclassname)
{
    for(var p in classModule.import)
    {
       if( classModule.import[p] === fullclassname )
       {
           return p;
       }
    }
    return null;
}


function makeModuleDescriptorString( config, classModule , inheritModule, uri )
{
    var descriptor = [];
    var privilege = classModule.privilege || "internal";
    if( privilege !== 'public')
    {
        descriptor.push('"ns":"' +classModule.nsUri+ '"');
    }
    if( inheritModule )
    {
        inheritNames = inheritModule.map(function(module){
            return classModule.import[ module.classname ] ? module.classname : getRefClassName(classModule, module.fullclassname);
        });

        if( classModule.id==="interface" ){
            descriptor.push('"extends":[' + inheritNames.join(",")+']')
        }else{
            descriptor.push('"extends":' + inheritNames[0] );
        }
    }
    if( classModule.package )
    {
        descriptor.push('"package":"'+classModule.package+'"');
    }

    descriptor.push('"classname":"' + classModule.classname + '"');

    if( classModule.implements && classModule.implements.length >0 )
    {
        descriptor.push('"implements":[' + classModule.implements.join(',') + ']');
    }

    if( classModule.id === "class")
    {
        if( classModule.isFinal )
        {
            descriptor.push('"final":' + !!classModule.isFinal);
        }

        if( classModule.isAbstract )
        {
            descriptor.push('"abstract":' + (!!classModule.isAbstract));
        }

        if( classModule.isDynamic )
        {
            descriptor.push('"dynamic":' + !!classModule.isDynamic);
        }

        descriptor.push('"uri":["'+uri.join('","')+'"]' );
        descriptor.push('"privateSymbol":'+config.context.private );
        descriptor.push('"method":method');
        descriptor.push('"proto":proto');
    }
    return descriptor;
}


var syntaxBuilder={

    "bulidNamespaceClassValueOf": function(classname, fullclassname, classModule, importMap, value , config )
    {
        return makeExportModuleString(classname, classModule, null, importMap , value, null, config );
    },

    "newInstanceNamespaceOf":function (name, value)
    {
        return 'var '+name+' = new Namespaces("'+value+'")';
    },

    "getWrapReference":function (classModule, type, thisArg) {
        return thisArg;
    },
    "newInstanceClassOf":function (className, classModule, param)
    {
        if( className==="JSON"){
            return param;
        }

        if( className==="Array")
        {
            return param;
        }

        if( className.indexOf(".")>0 )
        {
           compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("System"), classModule );
           return "Reflect.construct(null, System.getDefinitionByName('" + className + "'),[" + param + "])";
        }

        if( classModule.type==="Class" || classModule.nonglobal === true )
        {
            return 'new '+className+'('+param+')';
        }
        return 'new '+className+'('+param+')';
    },

    "getVariableBindableToAccessor":function (name, prop, type, ns,classmodule, config)
    {
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("PropertyEvent"), classmodule );
        var setter = [
            'function(val){\n',
            '\tvar old = this['+config.context.private+'].'+prop,';\n',
            '\tif(old!==val){\n',
            '\t\tthis['+config.context.private+'].'+prop+'=val;\n',
            '\t\tvar event = new PropertyEvent('+type.join(".")+');\n',
            '\t\tevent.property = "'+name+'";\n',
            '\t\tevent.oldValue = old;\n',
            '\t\tevent.newValue = val;\n',
            '\t\tthis.dispatchEvent(event);\n',
            '\t}',
            '\n}',
        ];
        var getter = [
            'function(){\n',
            '\treturn this['+config.context.private+'].'+prop,
            ';\n}',
        ];
        return {getter:getter.join(""),setter:setter.join("")};
    },

    "defineProperty":function (name, value )
    {
        return 'var '+name+' = '+value;
    },

    "definePropertiesClassOf":function (config, classProperties, classModule )
    {
        var props = [];
        for(var p in classProperties )
        {
           if( !classProperties[p].isStatic )
           {
               props.push('"' + p + '":' + classProperties[p].value);
           }
        }
        return 'Object.defineProperty(this,'+ config.context.private+',{value:{'+ props+'}});\n';
    },

    "getConstructorName":function (classModule)
    {
        return classModule.classname || "constructor";
    },

    "getDefaultConstructor":function (classModule, inheritClass )
    {
        if( classModule.inherit )
        {
            var superclass = inheritClass.nonglobal === true ? classModule.inherit + ".apply(this,arguments)" : classModule.inherit + ".apply(this,arguments)";
            return 'function '+classModule.classname+'(){\n####{props}####' + superclass + ';\n}';
        }else
        {
           return 'function '+classModule.classname+'(){\n####{props}####}';
        }
    },

    "formatImportClassPath":function ( classname , module )
    {
        return classname;
    },

    "buildPropertiesAndMethod":function ( describe, config , classModule , makeSyntax)
    {
        var code=[];
        for( var p in describe )
        {
            var desc = describe[p];

            //语法数据元, 编译当前指定的语法的内容
            if( desc.defineMetaTypeList && desc.defineMetaTypeList.Syntax )
            {
                var syntaxMetatype = desc.defineMetaTypeList.Syntax;
                var syntaxResult = syntaxMetatype.filter(function (item) {
                    return item.syntaxs.indexOf( makeSyntax ) >= 0;
                });

                if(  syntaxResult.length > 0  )
                {
                    desc = syntaxResult[0].desc;
                }else
                {
                    continue;
                }
            }

            var returnType = syntaxBuilder.getLoaclAndGlobalModuleDescription( desc.type );
            if( returnType )
            {
                syntaxBuilder.setClassModuleUsed(returnType,classModule);
            }

            Utils.forEach(desc.paramType,function (classname){
                var typeClass = syntaxBuilder.getLoaclAndGlobalModuleDescription(classname);
                if( typeClass ) {
                    syntaxBuilder.setClassModuleUsed(typeClass, classModule);
                }
            });

            //使用自定义命名空间
            if( classModule.use && classModule.use[p] === "namespace" && desc.id !=="namespace" )
            {
                code.push( syntaxBuilder.buildPropertiesAndMethod(desc,config,classModule) );
                continue;
            }
            var item = [];
            var nsuri = desc.nsUri;

            if( desc.varToBindable )
            {
               var accessor =  syntaxBuilder.getVariableBindableToAccessor(desc.accessorName, desc.accessorPropName, desc.eventType, desc.privilege, classModule, config);
                desc.value.get.value = accessor.getter;
                desc.value.set.value = accessor.setter;
            }

            if (typeof desc.value === "object")
            {
                if (desc.value.get)
                {
                    item=['"value":'+desc.value.get.value];
                    item.push('"type":'+ATTR_TYPE.get);
                    code.push('"' +Utils.getMethodName( p, 'get', nsuri ) + '":{' + item.join(',') + '}');
                }

                if (desc.value.set)
                {
                    item=['"value":'+desc.value.set.value];
                    item.push('"type":'+ATTR_TYPE.set);
                    code.push('"' +Utils.getMethodName( p, 'set', nsuri ) + '":{' + item.join(',') + '}');
                }

            }else
            {
                //将类中的属性用函数来替换( 如果是类成员可见不用生成函数来代替 )
                if( desc.id !== "function" && !desc.isStatic && desc.id !== "namespace" && desc.privilege!=="private" )
                {
                    var getter = 'function(){\n\treturn this['+config.context.private+'].'+p+';\n}';
                    code.push('"'+Utils.getMethodName( p, 'get', nsuri ) + '":{"value":'+getter+(',"type":'+ATTR_TYPE['get'])+'}');
                    if( !(desc.id ==="const") )
                    {
                        var setter = 'function(val){\n\treturn this['+config.context.private+'].'+p+'=val;\n}';
                        code.push('"'+ Utils.getMethodName( p, 'set', nsuri ) + '":{"value":'+setter+(',"type":'+ATTR_TYPE['get'])+'}');
                    }

                }else
                {
                    if( desc.id !=="function" && desc.id !=="const" && desc.id !== "namespace" )
                    {
                        item.push('"writable":true');
                    }
                    if( desc.id === "namespace" )
                    {
                        item.push('"value":' + p );
                    }else
                    {
                        item.push('"value":' + desc.value || "null");
                    }
                    item.push('"type":'+ATTR_TYPE[ desc.id ]);
                    code.push('"' +Utils.getMethodName( p, '', nsuri ) + '":{' + item.join(',') + '}\n');
                }
            }
        }
        return code.join(",");
    },

    "buildClassPropertiesAndMethod":function ( classModule, inheritModule, config, makeSyntax )
    {
        var code=[];
        if( classModule.id ==='class' )
        {
            //静态成员
            var s = syntaxBuilder.buildPropertiesAndMethod( classModule.static, config , classModule, makeSyntax );
            code.push("var method={"+s+"};\n");
            if( s )code.push('for(var prop in method){\n\tObject.defineProperty('+classModule.classname+', prop, method[prop]);\n}\n' );

            //构造函数
            if( !classModule.isStatic )
            {
                //实例成员
                s = syntaxBuilder.buildPropertiesAndMethod( classModule.proto, config , classModule , makeSyntax);
               // var constructor = '{"value":'+classModule.constructor.value+'}';
                var refConstruct = '"constructor":{"value":'+classModule.classname+'}';
                s = s ? refConstruct+','+s : refConstruct;
                code.push("var proto={"+s+"};\n");
                //code.push('Object.defineProperty(' + classModule.classname + ',"constructor",'+constructor+');\n');
                code.push(classModule.classname +'.prototype=Object.create( ' + (classModule.inherit || 'Object' ) + '.prototype , proto);\n');
               // code.push('Object.defineProperty(' + classModule.classname + ',"prototype",{value:' + classModule.classname + '.constructor.prototype});\n');

            }else
            {
                code.push("var proto={};\n");
                code.push('Object.defineProperty(' + classModule.classname + ',"prototype",{value:{}});\n');
            }

        }else if( classModule.id==="namespace" )
        {
            compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Namespace"), classModule );
            code.push(classModule.classname +'.prototype=Object.create(Namespace.prototype,{constructor:{value: '+classModule.classname+'}});\n');
        }
        return code.join("");
    },

    "buildClassStructure":function( classname, classModule, inheritModule, importMap, propertiesAndMethod, externalCode, config, uri )
    {
        return makeExportModuleString(classname, classModule, inheritModule, importMap, propertiesAndMethod, externalCode, config, uri); 
    },

    "buildExpressionGetOf":function (globalsConfig,classmodule, thisvrg, desc, props ,info, before,ns,useNs)
    {
        var checkRunning = desc.runningCheck || globalsConfig.mode==1;
        before = before || '';
        if( before && !Utils.isIncreaseAndDecreaseOperator(before) )before='';

        //checkRunning = (checkRunning || !desc.descriptor);
        if( before || desc.after )checkRunning = true;

        if( !globalsConfig.strictType )
        {
            checkRunning = false;
        }

        //引用变量
        if( props.length==0 )
        {
            return before + thisvrg + desc.after;
        }

        props = Utils.createReferenceProps( props,  checkRunning );
        if( !checkRunning )
        {
            if( desc.descriptor && desc.descriptor.isAccessor===true && !desc.descriptor.value.get )
            {
                throw new ReferenceError('"' + props.join(".") + '" getter does exists');
            }
            var map = [];
            if (desc.super)
            {
                map.push(desc.super);
                map.push("prototype");

            } else
            {
                map.push(thisvrg);
            }

            var owner = null;
            if( desc.descriptor && desc.descriptor.owner )
            {
                owner = syntaxBuilder.getLoaclAndGlobalModuleDescription( desc.descriptor.owner );
                if( !owner && desc.descriptor.owner === classmodule.fullclassname  )
                {
                    owner = classmodule;
                }
            }

            //对象属性
            if( ( !owner || owner.nonglobal !== true ) && !(desc.descriptor && desc.descriptor.isAccessor === true) )
            {
                map = map.concat( props[0] );
                return Utils.joinProperty( map );
            }

            //成员私有属性
            if( desc.descriptor && desc.descriptor.id !== 'function' )
            {
                //静态属性
                if( desc.descriptor.isStatic )
                {
                    map = map.concat( Utils.getMethodName( props[0], '', ns ) );
                    return Utils.joinProperty( map );
                }

                if( desc.descriptor.privilege === "private" )
                {
                    map = map.concat(props[0]);
                    if(  desc.isglobal !==true ){
                        map.splice(0, 1, map[0] + '[' + globalsConfig.context.private + ']');
                    }
                    return before+Utils.joinProperty(map)+desc.after;
                }
            }

            var param = [];
            //访问器或者非私有的属性都是一个访问器
            if( desc.descriptor && (desc.descriptor.isAccessor || ( desc.descriptor.id !== 'function' && desc.descriptor.privilege !== "private") ) )
            {
                map = map.concat(  Utils.getMethodName( props[0], 'get', ns ) );

            }else{
                map = map.concat( Utils.getMethodName( props[0], '', ns ) );
            }

            if(desc.descriptor && !desc.descriptor.isAccessor && !desc.descriptor.isFunAccessor && desc.descriptor.id !== 'function')
            {
                return Utils.joinProperty( map );
            }
            if(desc.super)
            {
                map.push("call");
                param.push( thisvrg );
            }
            return Utils.joinProperty( map )+'('+param.join(",")+')';
        }

        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );

        var method = globalsConfig.mode==1 ? 'Reflect._get' : 'Reflect.get';
        var param = [desc.super || thisvrg , props[0] ,'true','undefined'];
        var index = 2;
        if( desc.super )
        {
            param.splice(index++,1,thisvrg);
        }

        if( before || desc.after )
        {
            if( before ){
                index=3;
                param.splice(2,1,'false');
            }
            if( before==="++" || desc.after==="++" )
            {
                method = globalsConfig.mode==1 ? 'Reflect._incre' : 'Reflect.incre';

            }else if(  before==="--" || desc.after==="--" )
            {
                method = globalsConfig.mode==1 ?'Reflect._decre' : 'Reflect.decre';
            }
        }

        if( useNs && useNs.length > 0 )
        {
            index=4;
            param.splice(index++,1,'['+useNs.join(",")+']');
        }

        param.splice(index,2);
        Utils.pushInfo(param, info, desc, null , classmodule, globalsConfig );
        return method+'('+param.join(',')+')';
    },

    "buildExpressionSetOf": function(globalsConfig, classmodule, thisvrg, desc, props ,info, value, operator,ns,useNs )
    {
        //直接对引用变量进行操作
        if( props.length === 0 )
        {
            return thisvrg+(operator||'=')+value;
        }

        var _value = value;
        if( operator !=='=' && Utils.isMathAssignOperator(operator) )
        {
            value = syntaxBuilder.buildExpressionGetOf(globalsConfig, classmodule, thisvrg, desc, props ,info,"",ns,useNs)+operator.slice(0,-1)+value ;
        }

        var checkRunning = desc.runningCheck || globalsConfig.mode==1;
        if( !globalsConfig.strictType )
        {
            checkRunning = false;
        }

        props = Utils.createReferenceProps( props, checkRunning );

        if( !checkRunning )
        {
            if( desc.descriptor )
            {
                if( desc.descriptor.id === 'const' )
                {
                    throw new ReferenceError('"' + props.join(".") + '" is not writable');
                }
                if( desc.descriptor.isAccessor===true && !desc.descriptor.value.set )
                {
                    throw new ReferenceError('"' + props.join(".") + '" setter does exists');
                }
            }

            var map = [];
            if (desc.super)
            {
                map.push(desc.super);
                map.push("prototype");

            } else
            {
                map.push(thisvrg);
            }

            var owner = null;
            if( desc.descriptor && desc.descriptor.owner )
            {
                owner = syntaxBuilder.getLoaclAndGlobalModuleDescription( desc.descriptor.owner );
                if( !owner && desc.descriptor.owner === classmodule.fullclassname  )
                {
                    owner = classmodule;
                }
            }

            //对象属性
            if( ( !owner || owner.nonglobal !== true ) && !(desc.descriptor && desc.descriptor.isAccessor === true) )
            {
                map = map.concat( props[0] );
                return Utils.joinProperty( map )+operator+_value;
            }

            //成员私有属性
            if( desc.descriptor && desc.descriptor.id !== 'function' && desc.descriptor.isAccessor !== true && (desc.descriptor.isStatic || desc.descriptor.privilege === "private") )
            {
                //静态属性
                if( desc.descriptor.isStatic )
                {
                    map = map.concat( Utils.getMethodName( props[0], '', ns ) );
                    return Utils.joinProperty( map )+operator+_value;
                }

                //实例属性
                map = map.concat( props[0] );
                if( desc.isglobal !==true )
                {
                    map.splice(0, 1, map[0] + '[' + globalsConfig.context.private + ']');
                }
                return Utils.joinProperty( map )+operator+_value;
            }

            var param = [value];
            map = map.concat( Utils.getMethodName( props[0], 'set', ns ) );
            if(desc.super)
            {
                map.push("call");
                param.unshift( thisvrg );
            }
            return Utils.joinProperty( map )+'('+param.join(",")+')';
        }

        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );
        var method = globalsConfig.mode==1 ? 'Reflect._set' : 'Reflect.set';
        var param = [desc.super || thisvrg , props[0], value, 'undefined','undefined'];
        var index = 3;
        if( desc.super )
        {
            param.splice(index++,1,thisvrg);
        }

        //使用指定的命名空间
        if( useNs && useNs.length > 0 )
        {
            index=4;
            param.splice(index++,1,'['+useNs.join(",")+']');
        }

        param.splice(index,2);
        Utils.pushInfo(param, info, desc, null , classmodule, globalsConfig );
        return method+'('+param.join(',')+')';
    },

    "buildExpressionCallOf": function(globalsConfig, classmodule, superModule, thisvrg, desc, props ,info, ns , useNs )
    {
        //调用超类
        if( props.length===0 && globalsConfig.mode !=1 )
        {
            if( desc.super )
            {
                var code = superModule.nonglobal===true ? desc.super+'' : desc.super;
                return code+'.call('+[thisvrg].concat(desc.param || []).join(",")+')';
            }
            return thisvrg+"("+(desc && desc.param ? desc.param : []).join(",")+")";
        }

        var checkRunning = desc.runningCheck || globalsConfig.mode==1;
        if( !globalsConfig.strictType )
        {
            checkRunning = false;
        }
        //生成引用的属性
        props = Utils.createReferenceProps(props, checkRunning );

        //不需要运行时检查
        if( !checkRunning )
        {
            //直接调用全局函数
            if( Object.prototype.hasOwnProperty.call( globalsConfig.globals, thisvrg ) )
            {
                props.unshift( thisvrg );
                return props.join(".") + "(" + (desc.param || []).join(",") + ")";
            }

            var map = [];
            if (desc.super)
            {
                map.push(desc.super);
                map.push("prototype");

            } else
            {
                map.push(thisvrg);
            }

            var iscall = !!desc.super;

            //成员私有属性
            if( desc.descriptor && desc.descriptor.id !== 'function' && !desc.descriptor.isStatic )
            {
                if( desc.descriptor.privilege === "private" || desc.descriptor.owner === classmodule.fullclassname )
                {
                    map.splice(0, 1, map[0] + '[' + globalsConfig.context.private + ']');
                    map = map.concat( props[0] );
                    iscall = true;

                }else
                {
                    map = [ syntaxBuilder.buildExpressionGetOf(globalsConfig, classmodule, thisvrg, desc, props ,info, ns , useNs ) ];

                }

            }else
            {
                //指定属性调用
                map = map.concat(  Utils.getMethodName( props[0], '', ns ) );
            }

            var param = desc.param || [];
            if( iscall )
            {
                param = [thisvrg].concat(param);
                map.push("call");
            }
            return Utils.joinProperty( map )+'('+param.join(",")+')';
        }

        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );

        //运行时检查
        var method = globalsConfig.mode == 1 ? 'Reflect._call' : 'Reflect.call';
        var param = [desc.super || thisvrg, props[0]||'null', 'undefined', 'undefined', 'undefined'];
        var index = 2;

        if (desc.param && desc.param.length > 0)
        {
            index = 2;
            param.splice(index++, 1, '[' + desc.param.join(",") + ']');
        }

        if (desc.super)
        {
            index = 3;
            param.splice(index++, 1, thisvrg);
        }

        //使用指定的命名空间
        if (useNs && useNs.length > 0) {
            index = 4;
            param.splice(index++, 1, '[' + useNs.join(",") + ']');
        }

        param.splice(index, 4);
        Utils.pushInfo(param, info, desc, null, classmodule,globalsConfig);
        return method + '(' + param.join(',') + ')';
    },
    "buildExpressionNewOf":function(globalsConfig, classmodule, express, desc, info , newParam, instanceType )
    {
        //如果是实例化一个错误类，则把当前的信息添加上
        if( globalsConfig.runtime_error_debug && desc.descriptor && compile.checkInstanceType(classmodule, desc.descriptor, 'Error') )
        {
            //var p = newParam;
            //if (p.length === 0)p.push("");
            //if (p.length === 1)p.push('"' + classmodule.fullclassname + '"');
            //if (p.length === 2)p.push('"' + info + '"');
        }

        var checkRunning = desc.runningCheck || globalsConfig.mode==1;
        var ownerThisType = desc.ownerThisType;

        if( !globalsConfig.strictType )
        {
            checkRunning = false;
        }

        if( (!checkRunning && instanceType) || ownerThisType==="Class" )
        {
            return "new " + express + "(" + newParam.join(",") + ")";
        }

        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );

        var method = globalsConfig.mode==1 ? 'Reflect._construct' : 'Reflect.construct';
        var param = [express,'undefined'];
        if( newParam.length>0)
        {
            param.splice(1,1,'[' + newParam.join(",") + ']' );
        }else
        {
            param.splice(1,1);
        }
        Utils.pushInfo(param, info, desc, express, null, globalsConfig );
        return method+'('+param.join(',')+')';
    },

    "buildExpressionDeleteOf":function(globalsConfig,classmodule, thisvrg, desc, props ,info)
    {
        if( props.length === 0 )
        {
            return "delete "+thisvrg;
        }

        var checkRunning = desc.runningCheck || globalsConfig.mode==1;

        if( !globalsConfig.strictType )
        {
            checkRunning = false;
        }

        props = Utils.createReferenceProps( props,  checkRunning );
        if( !checkRunning )
        {
            if( desc.funScope )
            {
                var obj = desc.funScope.define( thisvrg );
                if( obj && obj.id==="class" )return 'false';
            }
            var owner = desc.descriptor && desc.descriptor.owner ? syntaxBuilder.getLoaclAndGlobalModuleDescription( desc.descriptor.owner ): null;
            if( owner && owner.nonglobal===true && ( !owner.isDynamic || owner.isStatic) )
            {
                return "false";
            }
            return "delete "+Utils.joinProperty( [thisvrg,props[0]] );
        }
        if( desc.super )
        {
            throw new SyntaxError("Unexpected super");
        }

        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );

        var method = globalsConfig.mode==1 ? 'Reflect._deleteProperty' : 'Reflect.deleteProperty';
        var param = [thisvrg,props[0]];
        Utils.pushInfo(param, info, desc, null, globalsConfig.mode==1 ? classmodule : null, globalsConfig );
        return method+'('+param.join(',')+')';
    },

    "buildExpressionHasOf": function(globalsConfig, classmodule,thisvrg, desc, props ,info)
    {
        var checkRunning = desc.runningCheck || globalsConfig.mode==1;
        if( !checkRunning )
        {
            if( desc.descriptor && !desc.descriptor.owner )return props+" in "+thisvrg;
            return desc.descriptor ? "true" : "false";
        }
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );
        var method = globalsConfig.mode==1 ? 'Reflect._has' : 'Reflect.has';
        var param = [thisvrg, props ];
        Utils.pushInfo(param, info, desc,null, classmodule,globalsConfig);
        return method+'('+param.join(',')+')';
    },
    "buildExpressionTypeOf":function(globalsConfig,classmodule,type,value, info )
    {
        if( type ==="Boolean" )return '!!'+value;

        if( !globalsConfig.runtime_type_check )
        {
            return value;
        }

        var typeClass = type;
        if( numberType.indexOf(type) >= 0  )
        {
            //如果是一个字面量就直接返回
            if( /^[-]?[\d\.]+$/.test(value) )
            {
                if (type === "uint" && /^\d+$/.test(value))return value;
                if (type === "int" && /^\d+$/.test(value))return value;
            }
        }
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );
        typeClass = getCanClassName( typeClass );
        if( globalsConfig.mode==1 )
        {
            return 'Reflect._type('+info+','+classmodule.classname+','+ typeClass + ',' + value+ ')';
        }
        return 'Reflect.type('+ value + ',' + typeClass+ ')';
    },
    "typeOf":function (classmodule,value)
    {
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("System"), classmodule );
        return 'System.typeOf('+value+')';
    },
    "instanceOf":function (classmodule,value, classType)
    {
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("System"), classmodule );
        return 'System.instanceOf('+value+', '+getCanClassName( classType )+')';
    },
    "isOf":function (classmodule,value, classType )
    {
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("System"), classmodule );
        return 'System.is('+value+', '+getCanClassName( classType )+')';
    },
    "getDefinitionByName":function (classname , desc, classmodule, isNew) {

        if(  !classmodule.import[classname] )
        {
            for (var name in classmodule.import) {
                if (classmodule.import[name] === classname) {
                    classname=name;
                    break;
                }
            }
        }
        return classname.replace(/\./g,"_");
    },
    "superClass":function ( moduleClass, inheritClass) {
        return moduleClass.inherit+'.call(this)';
    },
    "restArguments":function (classmodule, restName, index )
    {
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Array"), classmodule );
        return 'var '+restName+'=Array.prototype.slice.call(arguments, ' + index + ')';
    },
    "getVarKeyword":function(){
        return "var ";
    },
    "declarationDefaultVar":function( items )
    {
        if( items instanceof Array ){
            return "var "+items.join(",");
        }
        return "var "+items;
    },
    "getVarReference":function ( thisarg , isClass, isGlobal ) {
        return thisarg;
    },
    "getQualifiedObjectName":function ( classmodule, value )
    {
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("System"), classmodule );
        return "System.getQualifiedObjectName("+value+")";
    },
    "getCheckMethodParamTypeValue":function ( classmodule, globalsConfig, value, type, nullable, typeClass, filename, line )
    {
        if( !globalsConfig.runtime_type_check )
        {
            return "";
        }

        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("System"), classmodule );
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("TypeError"), classmodule );

        nullable = nullable===true ? value+'!==null && ' : '';
        var typeClass = type;
        if( numberType.indexOf(type) >=0 )
        {
            typeClass = "Number";
            if( type ==="uint" )
            {
                return 'if(' + nullable+'!('+value+'>=0) && !System.isNaN('+value+')'+')throw new TypeError("type does not match. must be ' + type + '","' + filename + '",' + line + ');\n';
            }
        }
        if ( type.indexOf(".") > 0 )
        {
            return 'if('+nullable+'!'+syntaxBuilder.isOf(classmodule, value, syntaxBuilder.getDefinitionByName( typeClass,null, classmodule) )+')throw new TypeError("type does not match. must be ' + type + '","' +filename + '",' + line + ');\n';
        } else {
            return 'if('+nullable+'!' +syntaxBuilder.isOf(classmodule, value, typeClass ) + ')throw new TypeError("type does not match. must be ' + type + '","' +filename + '",' +line + ');\n';
        }
        
    },
    "getMethodParamDefualtValue":function (classmodule, globalsConfig, name, value, type, target )
    {
        const prop = value ? value.split(/\s*\=\s*/,2) : null;
        const content = [];
        if( target )
        {
            compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );
            if( prop )
            {
                content.push( `var ${name} = Reflect.get(null,${target},"${name}") || ${prop[1]};`);
            }else{
                content.push( `var ${name} = Reflect.get(null,${target},"${name}");`);
            }

        }else if(value)
        {
            content.push(`if(${name} === void 0 ){\n\t${value};\n}`);
        }
        return content.join("\n");
    },
    "defineMethodParameter":function ( globalsConfig, paramMap , classModule )
    {
        var items=[];
        for (var n in paramMap)
        {
             items.push( n );
        }
        return items.join(",");
    },
    "getClosureFunctionCall":function(fn, call)
    {
        return fn+call;
    },
    "getForIn":function( value, name, internalName , classmodule, isIterator , isArrayOrObject )
    {
        if( isIterator )
        {
            return internalName+'='+value+','+internalName+'.rewind();'+internalName+'.next();';
        }
        if( isArrayOrObject )
        {
            return name+' in '+value; 
        }
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("ListIterator"), classmodule );
        return internalName+' = ListIterator('+value+');'+internalName+'.next();';
    }
    ,"getInternalVarForIn":function( name, internalName , classmodule, isIterator )
    {
        if( isIterator ){
            return name+'='+internalName+'.key()';
        }
        return name+'='+internalName+'.key()';
    },
    "getForInOf":function( value, name, internalName , classmodule, isIterator )
    {
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("ListIterator"), classmodule );
        if( isIterator )
        {
            return internalName+'='+value+','+internalName+'.rewind();'+internalName+'.next();';
        }
        return 'var '+internalName+' = ListIterator('+value+');'+internalName+'.next();';

    },"getInternalVarForInOf":function(name, internalName, classmodule, isIterator)
    {
        if( isIterator ){
            return name+'='+internalName+'.current()';
        }
        return name+'='+internalName+'.current()';

    },"getForeachKeyword":function (classmodule, isIterator)
    {
        return "";
    }
    ,"getForeachEnd":function (name, internalName, classmodule, isIterator)
    {
        return "";

    },"getForeachBefore":function (name, internalName, classmodule, isIterator)
    {
        if( isIterator && internalName)return "var "+internalName;
        return "";
    }
    ,"getKeyword":function (keyword)
    {
        return keyword;
        
    },"getJointOperator":function ( operator, left, right )
    {
        return operator;
    },
    "getWhenValue":function ( items ) 
    {
        return items.filter(function(val){
             return val !== "||";
        }).join("||");
    },
    "getClassModuleName":function ( classname, classmodule, isNew)
    {
        return classname;
    },
    "toForceTypeConvert":function ( value , type , desc, classmodule, globalsConfig )
    {
        if( type.toLowerCase() ==="boolean" )return '!!'+value;
        var index = numberType.indexOf( type.toLowerCase() );
        if( index >=0 )
        {
            if( globalsConfig.mode < 3 )
            {
                compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );
                return "Reflect.type(" + value + ",'" + type.toLowerCase() + "')";
            }
            return index > 3 ? "parseFloat("+value+")" : "parseInt("+value+")";
        }
        compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Reflect"), classmodule );
        return "Reflect.type(" + value + "," + getCanClassName( type ) + ")";
    },
    "getObjectKeyValueDelimiter":function (delimiter) {
        return ":";
    },
    "getPropsSpreadToTarget":function (classmodule, args, isArray )
    {
        if( isArray )
        {
            compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Array"), classmodule );
            return `Object.merge([],${args.join(",")})`;

        }else{
            compile.setClassModuleUsed( syntaxBuilder.getLoaclAndGlobalModuleDescription("Object"), classmodule );
            return `Object.merge({},${args.join(",")})`;
        }
    },
    "makeArrowFunction":function(classmodule,globalsConfig, paramMaps, body){

        const params = paramMaps.filter( item=>!item.isRest )
        const restParam = paramMaps.filter( item=>item.isRest );
        const names = params.map( item => item.name );
        const types = params.filter( item => item.type !=="*" ).map( item => {
            var nullable = item.value == 'null';
            return syntaxBuilder.getCheckMethodParamTypeValue( classmodule, globalsConfig, item.name, item.type, nullable, item.type, classmodule.filename, item.stack.line )
        });
        const defaultValue = params.filter( item => !!item.value ).map( item => {
            return syntaxBuilder.getMethodParamDefualtValue( classmodule, globalsConfig, item.name, item.name+"="+item.value, item.type)
        });
        var rest = '';
        if( restParam.length > 0 ){
            rest = restParam.map( item=> `var ${item.name}=Array.prototype.slice.call(arguments, ${params.length});\n`).join("");
        }
        return `function(${names.join(",")}){\n${rest}${defaultValue.join("")}${types.join("")}${body}\n}`
    },
    "parseArrowFunctionThisAndArgs":function(classmodule,config, paramName, value )
    {
        return `var ${paramName} = ${value};\n`;
    }
};

module.exports = syntaxBuilder;