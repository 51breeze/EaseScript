const Utils  = require('../utils.js');

var syntax={

    "bulidNamespaceClassValueOf": function(classname, fullclassname, module, importMap, value , config )
    {
        var keys = [];
        var values = [];
        for(var n in importMap )
        {
            keys.push( n );
            values.push( importMap[n] )
        }
        keys.unshift(classname);
        values.unshift('ns:' +fullclassname );
        var v = 'function(' + keys.join(",") + '){\n';
        v += 'Object.defineProperty(' + classname + ', "valueOf", {value:function valueOf(){\nreturn "' +value + '";\n}});'
        v += '\n}';
        return config.context.defineModuleMethod + "(" + JSON.stringify(values) + ", " + v + ");\n";
    },

    "newInstanceNamespaceOf":function (name, value)
    {
        return 'var '+name+' = new Namespaces("'+value+'")';
    },

    "newInstanceClassOf":function (className, classModule, param)
    {
        if( className==="JSON"){
            return param;
        }
        if( classModule.type==="Class" || classModule.nonglobal === true )
        {
            return 'new '+className+'.constructor('+param+')';
        }
        return 'new '+className+'('+param+')';
    },

    "defineProperty":function (name, value )
    {
        return 'var '+name+' = '+value;
    },

    "definePropertiesClassOf":function (config, classProperties, classModule )
    {
        if( classModule.isAbstract )return "";
        var props = [];
        for(var p in classProperties )
        {
            props.push( '"'+p+'":'+classProperties[p].value);
        }
        return 'Object.defineProperty(this,'+ config.context.private+',{value:{'+ props+'}});';
    },

    "getConstructorName":function (classModule)
    {
          return "constructor";
    },

    "getDefaultConstructor":function (classModule, inheritClass )
    {
        if( classModule.inherit )
        {
            var superclass = inheritClass.nonglobal === true ? classModule.inherit + ".constructor.apply(this,arguments)" : classModule.inherit + ".apply(this,arguments)";
            return 'function(){\n####{props}####' + superclass + ';\n}';
        }else
        {
           return 'function(){\n####{props}####}';
        }
    },

    "formatImportClassPath":function ( classname , module )
    {
        if( module.id==="namespace" )
        {
            return 'ns:'+classname;
        }else if( module.id==="interface" )
        {
             return 'if:'+classname;
        }
        return classname;
    },

    "buildPropertiesAndMethod":function ( describe, config , classModule )
    {
        var code=[];
        for( var p in describe )
        {
            var desc = describe[p];

            //使用自定义命名空间
            if( classModule.use && classModule.use[p] === "namespace" && desc.id !=="namespace" )
            {
                code.push( syntax.buildPropertiesAndMethod(desc,config,classModule) );
                continue;
            }
            var item = [];
            var nsuri = desc.nsUri;
            if (typeof desc.value === "object")
            {
                if (desc.value.get)
                {
                    item=['"value":'+ (desc.varToBindable ?  desc.value.get : desc.value.get.value) ];
                    code.push('"Get_' + nsuri+p + '":{' + item.join(',') + '}');
                }

                if (desc.value.set)
                {
                    item=['"value":'+(desc.varToBindable ? desc.value.set : desc.value.set.value) ];
                    code.push('"Set_' + nsuri+p + '":{' + item.join(',') + '}');
                }

            }else
            {
                //如果是类成员可见不用生成函数来代替
                if( desc.id !== "function" && !desc.isStatic && desc.id !== "namespace" && desc.privilege!=="private" )
                {
                    var getter = 'function(){\n\treturn this['+config.context.private+'].'+p+';\n}';
                    code.push('"Get_'+ nsuri+p + '":{"value":'+getter+'}');
                    if( !(desc.id ==="const") )
                    {
                        var setter = 'function(val){\n\treturn this['+config.context.private+'].'+p+'=val;\n}';
                        code.push('"Set_'+ nsuri+p + '":{"value":'+setter+'}');
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
                    code.push('"' + nsuri+p + '":{' + item.join(',') + '}\n');
                }
            }
        }
        return code.join(",");
    },

    "buildClassPropertiesAndMethod":function ( classModule, inheritModule, config )
    {
        var code=[];
        if( classModule.id ==='class' )
        {
            //静态成员
            var s = syntax.buildPropertiesAndMethod( classModule.static, config , classModule );
            code.push("var method={"+s+"};\n");
            if( s )code.push('for(var prop in method){\n\tObject.defineProperty('+classModule.classname+', prop, method[prop]);\n}\n' );

            //构造函数
            if( !classModule.isStatic )
            {
                //实例成员
                s = syntax.buildPropertiesAndMethod( classModule.proto, config , classModule );
                var constructor = '{"value":'+classModule.constructor.value+'}';
                var refConstruct = '"constructor":{"value":'+classModule.classname+'}';
                s = s ? refConstruct+','+s : refConstruct;
                code.push("var proto={"+s+"};\n");
                code.push('Object.defineProperty(' + classModule.classname + ',"constructor",'+constructor+');\n');
                code.push(classModule.classname + '.constructor.prototype=Object.create( ' + (classModule.inherit || 'Object' ) + '.prototype , proto);\n');
                code.push('Object.defineProperty(' + classModule.classname + ',"prototype",{value:' + classModule.classname + '.constructor.prototype});\n');

            }else
            {
                code.push('Object.defineProperty(' + classModule.classname + ',"prototype",{value:{}});\n');
            }
        }
        return code.join("");
    },

    "buildClassStructure":function makeClassModule( classname, classModule, inheritModule, importMap, propertiesAndMethod, externalCode, config, uri )
    {
        var keys = [ classModule.classname ];
        var values = [ syntax.formatImportClassPath(classModule.fullclassname, classModule) ];
        for(var n in importMap )
        {
            keys.push( n );
            values.push( importMap[n] );
        }

        var str="";
        str += 'function('+keys.join(",")+'){\n';
        str += "var _private=this._private;\n";
        if( externalCode )
        {
            str += externalCode;
        }
        str += propertiesAndMethod||"";
        var descriptor = [];
        var privilege = classModule.privilege || "internal";
        if( privilege !== 'public')
        {
            descriptor.push('"ns":"' +classModule.nsUri+ '"');
        }
        if( inheritModule )
        {
            descriptor.push('"extends":' + classModule.inherit);
        }
        if( classModule.package )
        {
            descriptor.push('"package":"'+classModule.package+'"');
        }

        descriptor.push('"classname":"' + classModule.classname + '"');
        if( config.mode == 1 ) {
            descriptor.push('"filename":"' + classModule.filename + '"');
        }

        if( classModule.isAbstract )
        {
            descriptor.push('"abstract":' + (!!classModule.isAbstract));
        }

        if( classModule.implements && classModule.implements.length >0 )
        {
            descriptor.push('"implements":[' + classModule.implements.join(',') + ']');
        }
        if( classModule.isFinal ) {
            descriptor.push('"final":' + !!classModule.isFinal);
        }
        if( classModule.isDynamic ) {
            descriptor.push('"dynamic":' + !!classModule.isDynamic);
        }
        descriptor.push('"_private":'+ config.context.private);
        descriptor.push('"uri":["'+uri.join('","')+'"]' );

        if( classModule.id !=="interface")
        {
            descriptor.push('"method":method');
            descriptor.push('"proto":proto');
        }

        str+='Object.defineProperty('+classname+',"__T__",{value:{\n\t'+descriptor.join(',\n\t')+'\n}});\n';
        str += "return "+classname+";\n";
        str += '}';
        return config.context.defineModuleMethod+"("+JSON.stringify(values)+","+str+");\n";
    },

    "buildExpressionGetOf":function (globalsConfig,classmodule, thisvrg, desc, props ,info, before,ns,useNs)
    {
        var checkRunning = desc.runningCheck || globalsConfig.mode==1;
        before = before || '';
        if( before && !Utils.isIncreaseAndDecreaseOperator(before) )before='';

        checkRunning = (checkRunning || !desc.descriptor);
        if( before || desc.after )checkRunning = true;

        //引用变量
        if( props.length==0 )
        {
            return before + thisvrg + desc.after;
        }

        props = Utils.createReferenceProps( props,  checkRunning );
        if( !checkRunning )
        {
            if( desc.descriptor.isAccessor===true && !desc.descriptor.value.get )
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

            var owner = desc.descriptor.owner ?  globalsConfig.$getDescriptionAndGlobals("javascript", desc.descriptor.owner ) : null;

            //对象属性
            if( !owner || owner.nonglobal !== true )
            {
                map = map.concat( props[0] );
                return Utils.joinProperty( map );
            }

            //成员私有属性
            if( desc.descriptor.id !== 'function' )
            {
                //静态属性
                if( desc.descriptor.isStatic )
                {
                    map = map.concat( ns+props[0] );
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
            if( desc.descriptor.isAccessor || ( desc.descriptor.id !== 'function' && desc.descriptor.privilege !== "private") )
            {
                map = map.concat( 'Get_'+ns+props[0] );

            }else{
                map = map.concat( ns+props[0] );
            }

            if( !desc.descriptor.isAccessor &&  desc.descriptor.id === 'function')
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
            value = syntax.buildExpressionGetOf(globalsConfig, classmodule, thisvrg, desc, props ,info,"",ns,useNs)+operator.slice(0,-1)+value ;
        }

        var checkRunning = desc.runningCheck || globalsConfig.mode==1;
        checkRunning =  (checkRunning || !desc.descriptor);
        props = Utils.createReferenceProps( props, checkRunning );

        if( !checkRunning )
        {
            if( desc.descriptor.id === 'const' )
            {
                throw new ReferenceError('"' + props.join(".") + '" is not writable');
            }
            if( desc.descriptor.isAccessor===true && !desc.descriptor.value.set )
            {
                throw new ReferenceError('"' + props.join(".") + '" setter does exists');
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

            var owner = desc.descriptor.owner ?  globalsConfig.$getDescriptionAndGlobals("javascript", desc.descriptor.owner ) : null;

            //对象属性
            if( (!owner || owner.nonglobal !== true) && desc.descriptor.isAccessor !== true )
            {
                map = map.concat( props[0] );
                return Utils.joinProperty( map )+operator+_value;
            }

            //成员私有属性
            if( desc.descriptor.id !== 'function' && desc.descriptor.isAccessor !== true && (desc.descriptor.isStatic || desc.descriptor.privilege === "private") )
            {
                //静态属性
                if( desc.descriptor.isStatic )
                {
                    map = map.concat( ns+props[0] );
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
            map = map.concat('Set_' + ns + props[0]);
            if(desc.super)
            {
                map.push("call");
                param.unshift( thisvrg );
            }
            return Utils.joinProperty( map )+'('+param.join(",")+')';
        }

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
                var code = superModule.nonglobal===true ? desc.super+'.constructor' : desc.super;
                return code+'.call('+[thisvrg].concat(desc.param || []).join(",")+')';
            }
            return thisvrg+"("+(desc && desc.param ? desc.param : []).join(",")+")";
        }

        var checkRunning = desc.runningCheck || globalsConfig.mode==1;
        checkRunning = checkRunning || !desc.descriptor;

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
            if( desc.descriptor.id !== 'function' && !desc.descriptor.isStatic )
            {
                if( desc.descriptor.privilege === "private" || desc.descriptor.owner === classmodule.fullclassname )
                {
                    map.splice(0, 1, map[0] + '[' + globalsConfig.context.private + ']');
                    map = map.concat( props[0] );
                    iscall = true;

                }else
                {
                    map = [ syntax.buildExpressionGetOf(globalsConfig, classmodule, thisvrg, desc, props ,info, ns , useNs ) ];
                    iscall = true;
                }

            }else
            {
                //指定属性调用
                map = map.concat( ns+props[0] );
            }

            var param = desc.param || [];
            if( iscall )
            {
                param = [thisvrg].concat(param);
                map.push("call");
            }
            return Utils.joinProperty( map )+'('+param.join(",")+')';
        }

        //运行时检查
        var method = globalsConfig.mode == 1 ? 'Reflect._call' : 'Reflect.call';
        var param = [desc.super || thisvrg, props[0], 'undefined', 'undefined', 'undefined'];
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
        var checkRunning = desc.runningCheck || globalsConfig.mode==1;
        checkRunning = checkRunning || !desc.descriptor;
        if( !checkRunning && instanceType )
        {
            if( instanceType.type==="Class" || instanceType.nonglobal===true )
            {
                express+=".constructor";
            }
            return "new " + express + "(" + newParam.join(",") + ")";
        }

        var method = globalsConfig.mode==1 ? 'Reflect._construct' : 'Reflect.construct';
        var param = [express,'undefined'];
        if( newParam.length>0)
        {
            param.splice(1,1,'[' + newParam.join(",") + ']' );
        }else
        {
            param.splice(1,1);
        }
        Utils.pushInfo(param, info, desc, express, classmodule, globalsConfig );
        return method+'('+param.join(',')+')';
    },

    "buildExpressionDeleteOf":function(globalsConfig,classmodule, thisvrg, desc, props ,info)
    {
        if( props.length === 0 )
        {
            return "delete "+thisvrg;
        }

        var checkRunning = desc.runningCheck || globalsConfig.mode==1 || !desc.descriptor;
        props = Utils.createReferenceProps( props,  checkRunning );
        if( !checkRunning )
        {
            if( desc.funScope )
            {
                var obj = desc.funScope.define( thisvrg );
                if( obj && obj.id==="class" )return 'false';
            }
            var owner = desc.descriptor.owner ? globalsConfig.$getDescriptionAndGlobals("javascript", desc.descriptor.owner ): null;
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

        var method = globalsConfig.mode==1 ? 'Reflect._deleteProperty' : 'Reflect.deleteProperty';
        var param = [thisvrg,props[0]];
        Utils.pushInfo(param, info, desc, null, globalsConfig.mode==1 ? classmodule : null, globalsConfig );
        return method+'('+param.join(',')+')';
    },

    "buildExpressionHasOf": function(globalsConfig, classmodule,thisvrg, desc, props ,info)
    {
        var checkRunning = desc.runningCheck || globalsConfig.mode==1 || !desc.descriptor;
        if( !checkRunning )
        {
            if( !desc.descriptor.owner )return props+" in "+thisvrg;
            return desc.descriptor ? "true" : "false";
        }
        var method = globalsConfig.mode==1 ? 'Reflect._has' : 'Reflect.has';
        var param = [thisvrg, props ];
        Utils.pushInfo(param, info, desc,null, classmodule,globalsConfig);
        return method+'('+param.join(',')+')';
    },
    "buildExpressionTypeOf":function(globalsConfig,classmodule,type,value, info )
    {
        if( globalsConfig.mode==1 )
        {
            return 'Reflect._type('+info+','+classmodule.classname+','+ type + ',' + value+ ')';
        }
        return globalsConfig.mode==3 ? value : 'Reflect.type('+ value + ',' + type+ ')';
    },
    "typeOf":function (value)
    {
        return 'System.typeOf('+value+')';
    },
    "instanceOf":function (value, classType)
    {
        return 'System.instanceOf('+value+', '+classType+')';
    },
    "isOf":function (value, classType )
    {
        return 'System.is('+value+', '+classType+')';
    },
    "getDefinitionByName":function (classname) {
        return "System.getDefinitionByName('" + classname + "')";
    },
    "superClass":function ( moduleClass, inheritClass) {
        if( inheritClass.nonglobal===true )
        {
            return moduleClass.inherit+'.constructor.call(this)';
        }
        return moduleClass.inherit+'.call(this)';
    },
    "restArguments":function ( restName, index )
    {
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
    "getQualifiedObjectName":function (  value )
    {
        return "System::getQualifiedObjectName("+value+")";
    },
    "getCheckMethodParamTypeValue":function ( globalsConfig, value, type, filename, line )
    {
        if( globalsConfig.mode !== 3 )
        {
            if ( type.indexOf(".") > 0 )
            {
                return 'if( !'+syntax.isOf( value, syntax.getDefinitionByName( type ) )+')throw new TypeError("type does not match. must be ' + type + '","' +filename + '",' + line + ')';
            } else {
                return 'if( !' +syntax.isOf( value, type ) + ')throw new TypeError("type does not match. must be ' + type + '","' +filename + '",' +line + ')';
            }
        }
    },
    "getMethodParamDefualtValue":function ( globalsConfig, name, value,type )
    {
        return 'if('+name+' == null ){'+value+';}';
    },
    "defineMethodParameter":function ( globalsConfig, paramMap )
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
    "getForIn":function( value, name, internalName )
    {
        return 'var '+internalName+' = Iterator('+value+');'+internalName+'.seek();';
    }
    ,"getInternalVarForIn":function( name, internalName )
    {
        return name+'='+internalName+'.key';
    },
    "getForInOf":function( value, name, internalName )
    {
       return 'var '+internalName+' = Iterator('+value+'); '+internalName+'.seek();';

    },"getInternalVarForInOf":function(name, internalName)
    {
        return name+'='+internalName+'.value';
    },"getForeachKeyword":function () 
    {
        return "";
    }
    ,"getKeyword":function (keyword)
    {
        return keyword;
    },"getJointOperator":function ( operator, leftType, rightType )
    {
        return operator;
    }
};

module.exports = syntax;