const Utils  = require('../utils.js');
const Maker  = require('../maker.js');

const fun_map={
    "Array":function (thisarg, name, value)
    {
        var param = value||[];
        value = (value || []).join(",");
        switch ( name ){
            case "slice" :
                return "array_slice("+ [ thisarg, value ].join(",")+")";
            case "indexOf" :
                return "array_search("+[value,thisarg].join(",")+")";
            case "splice" :
                if( param.length > 2 ){
                    value = param.slice(0,2).concat( 'array('+param.slice(2).join(",")+')' )
                }
                return "array_splice("+[ thisarg, value ].join(",")+")";
            case "push" :
                return "array_push("+[ thisarg, value ].join(",")+")";
            case "shift" :
                return "array_shift("+[ thisarg ].join(",")+")";
            case "unshift" :
                return "array_shift("+[ thisarg,value ].join(",")+")";
            case "pop" :
                return "array_pop("+[ thisarg ].join(",")+")";
            case "length" :
                return "count("+[ thisarg ].join(",")+")";
            case "concat" :
                return "array_concat("+[ thisarg , value].join(",")+")";
            case "fill" :
                return "array_fill("+[ thisarg , value].join(",")+")";
            case "filter" :
                return "array_filter("+[value].join(",")+")";
            case "forEach" :
                return "array_walk("+[thisarg, value].join(",")+")";
            case "join" :
                return "implode("+[value,thisarg].join(",")+")";
            case "unique" :
                return "array_unique("+[thisarg].join(",")+")";
            case "sort" :
                return "usort("+[thisarg, value].join(",")+")";
            case "map" :
                return "array_map("+[thisarg, value].join(",")+")";
            case "lastIndexOf" :
                return "array_search("+value+", array_reverse("+thisarg+") )";
            case "find" :
        }
        return "";
    },
    "String":function (thisarg, name, value)
    {
        switch ( name )
        {
            case "length" :
                return "mb_strlen("+thisarg+")";
            case "replace" :
                if( value[0].match(/^\//) ){
                    value[0] = "'"+value[0].replace(/\/.*$/,function (a) { return a.replace("g",""); }).replace(/\\/,'\\\\\\')+"'";
                    return "preg_replace(" + [value, thisarg].join(",") + ")";
                }else {
                    return "str_replace(" + [value, thisarg].join(",") + ")";
                }
            case "indexOf" :
                return "strpos("+[thisarg,value].join(",")+")";
            case "match" :
                return "";
            case "search" :
                return "strpos("+[thisarg,value].join(",")+")";
            case "charAt" :
                return thisarg+"["+value+"]";
            case "split" :
                return "explode("+[value, thisarg].join(",")+")";
            case "repeat" :
                return "str_repeat("+[thisarg,value].join(",")+")";
            case "slice" :
                return "substr("+[thisarg,value].join(",")+")";
            case "substring" :
                return "substr("+[thisarg,value].join(",")+")";
            case "substr" :
                return "substr("+[thisarg,value].join(",")+")";
            case "toLocaleLowerCase" :
            case "toLowerCase" :
                return "strtolower("+[thisarg].join(",")+")";
            case "toLocaleUpperCase" :
            case "toUpperCase" :
                return "strtoupper("+[thisarg].join(",")+")";
        }
        return "";
    } ,
    "RegExp":function (thisarg, name, value)
    {
        return "";
    },
    "Math":function (thisarg, name, value) {
        switch ( name )
        {
            case "random" :
                return "( mt_rand(1,2147483647) / 2147483647)";
            default :
                return name+"("+value+")";
        }
    }

}

const thisMap={
    'console':"\\Console",
    'document':"\\System::document()",
    'window':"\\System::window()",
}

const excludeUseMap= {
    'Array':true,
    'Number':true,
    'Boolean':true,
    'console':true,
    'Document':true,
    'String':true,
    'Function':true,
    'Class':true,
}

var syntax={

    "bulidNamespaceClassValueOf": function(classname, fullclassname, module, importMap, value , config)
    {
        var values = [];
        for(var n in importMap )
        {
            var  _cname= importMap[n].fullclassname || importMap[n].type;
            if( _cname !=="Class" && module.fullclassname !== _cname && importMap[n].package ) {
                values.push(syntax.formatImportClassPath(_cname, importMap[n]));
            }
        }

        var v =  module.package ? "namespace "+module.package.replace(".","\\")+";\n" : "";
        if( values.length > 0 )
        {
            v += "use "+values.join(";\n use ") + ';\n';
        }
        v += 'class '+classname+'\n{\n';
        v +='\tstatic public function valueOf()\n\t{\n \t\treturn "'+value+'";\n\t}';
        v += '\n}';
        return "<?php\n"+v;
    },
    "getVariableBindableToAccessor":function (name, prop, type, ns,classmodule, config)
    {
        var setter = [
            'public function Set_'+name+'($val){\n',
            '\t$old = $this->'+prop,';\n',
            '\tif($old!==$val){\n',
            '\t\t$this->'+prop+'=$val;\n',
            '\t\t$event = new PropertyEvent('+type.join('::')+');\n',
            '\t\t$event->property = "'+name+'";\n',
            '\t\t$event->oldValue = $old;\n',
            '\t\t$event->newValue = $val;\n',
            '\t\t$this->dispatchEvent($event);\n',
            '\t}',
            '\n}',
        ];
        var getter = [
            'public function  Get_'+name+'(){\n',
            '\treturn $this->'+prop,
            ';\n}',
        ];
        return {getter:getter.join(""),setter:setter.join("")};
    },
    "newInstanceNamespaceOf":function (name, value)
    {
        return '$'+name+' = new Namespaces("'+value+'")';
    },

    "defineProperty":function (name, value, prefix )
    {
        return (prefix?prefix+" ":"")+'$'+name+' = '+value;
    },

    "definePropertiesClassOf":function (config, classProperties, classModule )
    {
        var properties = [];
        for( var p in classProperties )
        {
            var item = classProperties[p];
            if( classProperties[p].id !=="const" && !item.isStatic && !item.value.match(/^(\"|\'|\d+|null|false|true|NaN|undefined)/i) )
            {
                properties.push( "$this->"+p+"="+item.value );
            }
        }
        if(  properties.length > 0 ){
            return  properties.join(";\n")+";";
        }
        return "";
    },

    "getConstructorName":function (classModule)
    {
        return "__construct";
    },

    "getDefaultConstructor":function (classModule, inheritClass )
    {
        if( classModule.inherit )
        {
            return 'function __construct(){\n####{props}####\nparent::__construct();\n}';
        }else
        {
            return 'function __construct(){\n####{props}####\n}';
        }
    },

    "formatImportClassPath":function ( classname , module )
    {
        return classname.replace(/\./g,"\\");
    },

    "buildPropertiesAndMethod":function ( describe, config , classModule , makeSyntax )
    {
        var code=[];
        var properties = [];
        var staticProperties = [];
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
                if( syntaxResult.length > 0  )
                {
                    desc = syntaxResult[0].desc;
                }else
                {
                    continue;
                }
            }

            //使用自定义命名空间
            if( classModule.use && classModule.use[p] === "namespace" && desc.id !=="namespace" )
            {
                var _value = syntax.buildPropertiesAndMethod(desc,config,classModule );
                properties = properties.concat( _value[0] );
                code = code.concat( _value[1] );
                continue;
            }

            var nsuri =  desc.hasCustomNs ? desc.nsUri : '';
            var ns = desc.hasCustomNs ? "public" : desc.privilege;
            var isStatic = classModule.isStatic || desc.isStatic || desc.id === "namespace";
            if( isStatic )
            {
                ns = "static "+ns;
            }

            if( classModule.id==="interface")
            {
                if( desc.id === "function" )
                {
                    var _param = desc.param.map(function (a,i) {
                        var type = desc.paramType[i];
                        var typeClass = Maker.getLoaclAndGlobalModuleDescription( type );
                        if( type && typeClass.nonglobal===true )
                        {
                           for( var c in classModule.import )
                           {
                               if( classModule.import[c] === type )
                               {
                                   type = c;
                               }
                           }

                        }else
                        {
                            type = type.toLowerCase();
                            if( type !== "array" ){
                                type="";
                            }
                        }
                        return type ? type+" $"+a : "$"+a;
                    });

                    if( typeof desc.value === "object" )
                    {
                        if (desc.value.get) {
                            code.push(ns + " function Get_" + nsuri + p + "();");
                        }
                        if (desc.value.set) {
                            code.push(ns + " function Set_" + nsuri + p + "("+_param.join(",")+");");
                        }

                    } else {
                        code.push(ns + " function " + nsuri + p + '('+_param.join(",")+');');
                    }

                }else
                {
                    throw new Error("In the interface can not define properties");
                }

            }else
            {
                var value;
                if( desc.varToBindable )
                {
                    var accessor =  syntax.getVariableBindableToAccessor(desc.accessorName, desc.accessorPropName, desc.eventType, desc.privilege, classModule, config);
                    desc.value.get.value = accessor.getter;
                    desc.value.set.value = accessor.setter;
                    properties.push( "private $" + desc.accessorPropName + '=' + ( desc.__defaultValue__ ) + ';' );
                }
                
                if (typeof desc.value === "object" && desc.id !== "namespace")
                {
                    if (desc.value.get)
                    {
                        value = desc.value.get.value;
                        value = value.replace( new RegExp("^(function "+p+")") , ns + " function Get_" + nsuri + p );
                        code.push( value );
                    }

                    if (desc.value.set)
                    {
                        value = desc.value.set.value;
                        value = value.replace( new RegExp("^(function "+p+")") , ns + " function Set_" + nsuri + p );
                        code.push( value );
                    }

                } else 
                {
                    //如果是类成员可见不用生成函数来代替
                    if (desc.id === "function")
                    {
                        value = desc.value.replace( new RegExp("^(function "+p+")") , ns + " function " + nsuri + p );
                        code.push( value );

                    } else
                    {
                        if (desc.id === "const") {
                            properties.unshift("const " + nsuri + p + '=' + desc.value + ';');
                        }
                       /* else if( isStatic )
                        {
                            properties.push(ns + " $" + nsuri + p + '=' + (desc.value || "null") + ';');
                        }*/else
                        {
                            if( desc.value.match(/^(\"|\'|\d+|null|false|true|NaN)/i) )
                            {
                                properties.push(ns + " $" + nsuri + p + '=' + ( desc.value ) + ';');

                            }else
                            {
                               if( isStatic && desc.value )
                               {
                                    var propname = '\\'+classModule.fullclassname.replace(/\./g,'\\')+"::$"+nsuri+p;
                                    staticProperties.push("if("+propname+"===null){\n"+propname+"="+desc.value+";\n}" );
                                }
                                properties.push(ns + " $" + nsuri + p + '=' + ("null") + ';');
                            }
                        }
                    }
                }
            }
        }
        return [properties,code,staticProperties];
    },

    "buildClassPropertiesAndMethod":function ( classModule, inheritModule, config, makeSyntax, externalProperties )
    {
        var code=[];
        var properties = [];

        //静态成员
        var value = syntax.buildPropertiesAndMethod( classModule.static, config ,classModule, makeSyntax );
        properties = value[0];
        code = value[1];
        if( externalProperties && value[2] ){
            externalProperties.push( value[2] );
        }

        //实例成员
        value = syntax.buildPropertiesAndMethod( classModule.proto, config ,classModule , makeSyntax )
        properties = properties.concat( value[0] );

        if( externalProperties && value[2] ){
            externalProperties.push( value[2] );
        }

        //构造函数
        if( classModule.constructor.value )
        {
            code.push('public ' + classModule.constructor.value);
        }
        code = code.concat( value[1] )
        return properties.concat(code).join("\n");
    },

    "buildClassStructure":function( classname, module, inheritClass, importMap, propertiesAndMethod , externalCode, config, uri, ns)
    {
        var str = ["<?php\n"];
        var importClass = [];
        var useClass = {};
        for(var n in importMap )
        {
            var _cname = importMap[n].fullclassname || importMap[n].type;
            useClass[ _cname ] = true;

            //当前类有命名空间或者使用的类名有命名空间,并且类的别名不能与当前类名相同，则使用 use
            if( _cname !=="Class" && module.fullclassname !== _cname && importMap[n].classname != module.classname
                && ( module.package || _cname.indexOf(".")>0 ) && !excludeUseMap[ _cname ]  )
            {
                importClass.push( _cname.replace(/\./g, "\\") );
            }
        }

        //当前有使用命名空间
        if( module.useExternalClassModules && module.useExternalClassModules.length >0 && module.package )
        {
             for(var us in  module.useExternalClassModules )
             {
                 var _cname = module.useExternalClassModules[us];
                 if( !useClass[ _cname ] && !(excludeUseMap[ _cname ] ||  module.fullclassname === _cname) )
                 {
                     useClass[ _cname ] = true;
                     importClass.push( module.useExternalClassModules[us].replace(/\./g,"\\") );
                 }
             }
        }

        if( module.package )
        {
            str.push("namespace "+syntax.formatImportClassPath(module.package)+";\n" );
        }

        if( importClass.length > 0 )
        {
            str.push( "use "+importClass.join(";\nuse ")+";\n" );
        }

        if( module.id==="interface" ){
            str.push( 'interface ' );
        }else if( module.isFinal ){
            str.push( 'final class ' );
        }else if( module.isAbstract ){
            str.push( 'abstract class ' );
        }else{
            str.push( 'class ' );
        }

        str.push( classname );
        if( inheritClass )
        {
            str.push( " extends "+module.inherit );
        }
        if( module.implements && module.implements.length > 0 )
        {
            var imples = module.implements.map(function (a){
                 return syntax.formatImportClassPath(a);
            });
            str.push( " implements "+ imples.join(",") );
        }
        str.push("\n{\n");
        str.push( propertiesAndMethod );
        str.push("\n}\n");

        if( !propertiesAndMethod )
        {
            return externalCode;
        }

        if( externalCode ){
            str.push( externalCode );
        }
        return str.join("");
    },

    "newInstanceClassOf":function (className, classModule, param)
    {
        if( className==="Array" ){
            return "["+param+"]";
        }else if( className==="JSON")
        {
            if( param.length > 2 ) {
                return 'new \\Object(' + param.replace(/\{/g, "[").replace(/\}/g, "]")+')';
            }else
            {
                return "new \\Object()";
            }
        }
        return 'new '+className+'('+param+')';
    },

    "buildExpressionGetOf":function (globalsConfig,classmodule, thisvrg, desc, props ,info, before,ns,useNs, isNew )
    {
        var checkRunning = desc.runningCheck;
        before = before || '';
        if( before && !Utils.isIncreaseAndDecreaseOperator(before) )before='';

        checkRunning = (checkRunning || !desc.descriptor);
        if( before || desc.after )checkRunning = true;

        thisvrg =  thisMap[ thisvrg ] || thisvrg;

        //引用变量
        if( props.length==0 )
        {
            if( !isNew && desc.descriptor && desc.descriptor.id==="class" && thisvrg.match(/^\w+$/) )
            {
                if( desc.descriptor.nonglobal===true ){
                    return thisvrg+"::class";
                }else {
                    return  "'"+thisvrg+"'";
                }
            }
            return before + thisvrg + desc.after;
        }

        props = Utils.createReferenceProps( props,  checkRunning );
        if( !checkRunning )
        {
            ns = ns && (desc.descriptor.privilege==="internal" || (useNs && useNs.length >0)) ? ns : "";
            if( desc.descriptor.isAccessor===true && !desc.descriptor.value.get )
            {
                throw new ReferenceError('"' + props.join(".") + '" getter does exists');
            }

            if( desc.ownerThisType && desc.ownerThisType !=="*" && props.length===1 && fun_map.hasOwnProperty( desc.ownerThisType ) )
            {
                var val = fun_map[ desc.ownerThisType ]( thisvrg , props[0] , desc.param );
                if( val ){
                    return val;
                }
            }

            var map = [];
            var segm ="->";
            if (desc.super)
            {
                segm = "::$";
                map.push("parent");

            } else
            {
                map.push(thisvrg);
            }

            //成员私有属性
            if( desc.descriptor.id !== 'function' )
            {
                map = map.concat( ns+props[0] );

                //var isClassRef = Maker.getLoaclAndGlobalModuleDescription( thisvrg );

                //常量属性
                if( desc.descriptor.id==="const" && desc.isStatic )
                {
                    return Utils.joinProperty( map, "::" );
                }

                //静态属性
                if( desc.descriptor.isStatic || desc.isStatic )
                {
                    return Utils.joinProperty( map, "::$" );
                }
                return before+Utils.joinProperty(map,"->")+desc.after;
            }

            var param = [];
            //访问器或者非私有的属性都是一个访问器
            if( desc.descriptor.isAccessor || desc.descriptor.isFunAccessor )
            {
                map = map.concat( 'Get_'+ns+props[0] );
                return Utils.joinProperty( map, segm )+'('+param.join(",")+')';

            }else
            {
                return "array("+thisvrg+",'"+(ns+props[0])+"')";
               // map = map.concat( ns+props[0] );
                //return Utils.joinProperty( map, segm );
            }
        }

        var method = '\\Reflect::get';
        var param = [ thisvrg , props[0] ,'true','undefined'];
        var index = 2;
        if( desc.super )
        {
            param.splice(0,1,"parent");
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
                method = '\\Reflect::incre';

            }else if(  before==="--" || desc.after==="--" )
            {
                method = '\\Reflect::decre';
            }
        }

        if( useNs && useNs.length > 0 )
        {
            index=4;
            param.splice(index++,1,'['+useNs.join(",")+']');
        }
        param.splice(index,2);
        param.unshift( classmodule.classname+"::class" );
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

        var checkRunning = desc.runningCheck;
        checkRunning =  (checkRunning || !desc.descriptor);
        props = Utils.createReferenceProps( props, checkRunning );

        if( !checkRunning )
        {
            ns = ns && (desc.descriptor.privilege==="internal" || (useNs && useNs.length >0)) ? ns : "";
            if( desc.descriptor.id === 'const' )
            {
                throw new ReferenceError('"' + props.join(".") + '" is not writable');
            }
            if( desc.descriptor.isAccessor===true && !desc.descriptor.value.set )
            {
                throw new ReferenceError('"' + props.join(".") + '" setter does exists');
            }

            var map = [];
            var segm = "->";
            if (desc.super)
            {
                map.push("parent");
                segm="::";

            } else
            {
                map.push(thisvrg);
            }

            //成员私有属性
            if( desc.descriptor.id !== 'function' )
            {
                var isClassRef = Maker.getLoaclAndGlobalModuleDescription( thisvrg );
                map = map.concat( ns+props[0] );

                //常量属性
                if( desc.descriptor.id==="const" )
                {
                    return Utils.joinProperty( map ,"::")+operator+_value;
                }

                //静态属性
                if( desc.descriptor.isStatic || isClassRef )
                {
                    return Utils.joinProperty( map ,"::$")+operator+_value;
                }

                //实例属性
                return Utils.joinProperty( map , segm )+operator+_value;
            }

            var param = [value];
            map = map.concat('Set_' + ns + props[0]);
            return Utils.joinProperty( map , segm )+'('+param.join(",")+')';
        }

        var method = '\\Reflect::set';
        var param = [ thisvrg , props[0], value, 'undefined','undefined'];
        var index = 3;
        if( desc.super )
        {
            param.splice(0,1,"parent");
            param.splice(index++,1,thisvrg);
        }

        //使用指定的命名空间
        if( useNs && useNs.length > 0 )
        {
            index=4;
            param.splice(index++,1,'['+useNs.join(",")+']');
        }

        param.splice(index,2);
        param.unshift( classmodule.classname+"::class" );
        return method+'('+param.join(',')+')';
    },

    "buildExpressionCallOf": function(globalsConfig, classmodule, superModule, thisvrg, desc, props ,info, ns , useNs )
    {
        var checkRunning = desc.runningCheck;
        checkRunning = checkRunning || !desc.descriptor;

        thisvrg =  thisMap[ thisvrg ] || thisvrg;

        //调用超类
        if( props.length===0 )
        {
            if( desc.super )
            {
                return 'parent::__construct('+(desc.param || []).join(",")+')';
            }
            if( !checkRunning )
            {
                return thisvrg + "(" + (desc.param ? desc.param : []).join(",") + ")";
            }
        }

        if( thisvrg==="Object" && props.length===1 && props[0]==="forEach")
        {
            return '\\'+thisvrg + "::each(" + (desc.param ? desc.param : []).join(",") + ")";
        }

        //生成引用的属性
        props = Utils.createReferenceProps(props, checkRunning );

        //不需要运行时检查
        if( !checkRunning )
        {
            if( desc.ownerThisType && desc.ownerThisType !=="*" && props.length===1 && fun_map.hasOwnProperty( desc.ownerThisType ) )
            {
                var val = fun_map[ desc.ownerThisType ]( thisvrg , props[0] , desc.param );
                if( val ){
                    return val;
                }
            }

            if( thisvrg==="Math" )
            {
                return Utils.joinProperty( props, "->") + "(" + (desc.param || []).join(",") + ")";
            }

            //直接调用全局函数
            if( desc.isStatic===true )
            {
                props.unshift( thisvrg );
                return Utils.joinProperty( props, "::") + "(" + (desc.param || []).join(",") + ")";
            }

            var map = [];
            var segm = "->";
            if (desc.super)
            {
                map.push("parent");
                segm= "::";

            } else
            {
                map.push(thisvrg);
            }

            ns = ns && (desc.descriptor.privilege==="internal" || (useNs && useNs.length >0)) ? ns : "";
            var iscall = !!desc.super;

            //成员私有属性
            if( desc.descriptor.id !== 'function' && !desc.descriptor.isStatic )
            {
                if( desc.descriptor.privilege === "private" || desc.descriptor.owner === classmodule.fullclassname )
                {
                    map = map.concat( props[0] );
                }else
                {
                    map = [ syntax.buildExpressionGetOf(globalsConfig, classmodule, thisvrg, desc, props ,info, ns , useNs ) ];
                }

            }else
            {
                //指定属性调用
                map = map.concat( ns+props[0] );
            }

            var param = desc.param || [];
            if( desc.descriptor.isStatic )segm="::";
            return Utils.joinProperty( map, segm )+'('+param.join(",")+')';
        }

        //运行时检查
        var method = '\\Reflect::call';
        var param = [ thisvrg, props[0], 'undefined', 'undefined', 'undefined'];
        var index = 2;

        if (desc.param && desc.param.length > 0)
        {
            index = 2;
            param.splice(index++, 1, '[' + desc.param.join(",") + ']');
        }

        if (desc.super)
        {
            index = 3;
            param.splice(0, 1, "parent");
            param.splice(index++, 1, thisvrg);
        }

        //使用指定的命名空间
        if (useNs && useNs.length > 0) {
            index = 4;
            param.splice(index++, 1, '[' + useNs.join(",") + ']');
        }
        param.splice(index, 4);
        param.unshift(classmodule.classname+"::class");
        return method + '(' + param.join(',') + ')';
    },
    "buildExpressionNewOf":function(globalsConfig, classmodule, express, desc, info , newParam, instanceType )
    {
        if( express==="Array")
        {
            return "array("+ newParam.join(",")+")";
        }
        if( express ==="Object" )
        {
            //return "new Object()";
        }
        return "new " + syntax.getDefinitionByName(express,desc,classmodule, true) + "(" + newParam.join(",") + ")";
    },

    "buildExpressionDeleteOf":function(globalsConfig,classmodule, thisvrg, desc, props ,info)
    {
        if( props.length === 0 )
        {
            return "unset("+thisvrg+")";
        }
        var checkRunning = desc.runningCheck ;
        props = Utils.createReferenceProps( props,  checkRunning );
        if( !checkRunning )
        {
            if( desc.funScope )
            {
                var obj = desc.funScope.define( thisvrg );
                if( obj && obj.id==="class" )return 'false';
            }
            var owner = desc.descriptor.owner ? Maker.getLoaclAndGlobalModuleDescription(desc.descriptor.owner ): null;
            if( owner && owner.nonglobal===true && ( !owner.isDynamic || owner.isStatic) )
            {
                return "false";
            }
            return "unset("+Utils.joinProperty( [thisvrg,props[0]] , desc.descriptor.isStatic  ? "::" : "->")+")";
        }

        if( desc.super )
        {
            throw new SyntaxError("Unexpected super");
        }
        var method = '\\Reflect::deleteProperty';
        var param = [thisvrg,props[0]];
        param.unshift( classmodule.classname+"::class" );
        return method+'('+param.join(',')+')';
    },

    "buildExpressionHasOf": function(globalsConfig, classmodule,thisvrg, desc, props ,info)
    {
        return "property_exists("+thisvrg+","+props+")";
    },
    "buildExpressionTypeOf":function(globalsConfig,classmodule,type,value, info )
    {
        var module = Maker.getLoaclAndGlobalModuleDescription( type );
        if( module && module.nonglobal !==true ){
            return "\\Reflect::type("+ value + ",'"+type+"')";
        }
      /*  if( type.charAt(0) ==="'" || type.charAt(0) ==='"' ){
            return "Reflect::type("+ value + ","+type+")";
        }*/
        return "\\Reflect::type("+ value + ","+type+"::class )";
    },
    "typeOf":function (value)
    {
        return '\\System::typeOf('+value+')';
    },
    "instanceOf":function (value, classType)
    {
         return "\\System::isOf("+ value + ","+classType+")";
    },
    "isOf":function (value, classType )
    {
         return "\\System::is("+ value + ","+classType+")";
    },
    "getDefinitionByName":function (classname , desc, classmodule, isNew )
    {
        if( isNew ){
            return classname.replace(/\./g,"\\");
        }
        return "'"+classname.replace(/\./g,"\\")+"'";
    },
    "getClassModuleName":function ( classname, classModule, isNew)
    {
        if( isNew ){
            return classname.replace(/\./g,"\\");
        }
        if( classModule.nonglobal===true )
        {
            return classname+"::class";
        }
        return "'"+classname.replace(/\./g,"\\")+"'";
    },
    "superClass":function ( moduleClass, inheritClass) {
        return 'parent::__construct()';
    },
    "restArguments":function ( restName, index )
    {
        return '$'+restName+'=array_slice(func_get_args(),' + index + ')';
    },
    "getVarKeyword":function(){
        return "";
    },
    "declarationDefaultVar":function( items )
    {
        return "";
        if( items instanceof Array ){
            return "$"+items.join("=null;\n$")+"=null";
        }
        return "$"+items+"=null";
    },
    "getVarReference":function (  thisarg , isClass ) {
         if( thisarg ==="super" || isClass )
         {
             return thisarg;
         }
         return '$'+thisarg;
    } ,
    "getQualifiedObjectName":function (  value )
    {
         return "get_class("+value+")";
    },
    "getCheckMethodParamTypeValue":function ( globalsConfig, value, type, nullable, typeClass, filename, line )
    {
        if( type ==="*" || type=="void" )return "";
        if( !isReferenceType(type) )
        {
            nullable = nullable===true ? value+'!==null && ' : '';
            return 'if('+nullable+'!' +syntax.isOf( value, syntax.getClassModuleName( type, typeClass ) ) + ')throw new \\TypeError("type mismatch the \\"\\'+value+'\\" parameter must be ' + type +'");\n';
        }
    },
    "getMethodParamDefualtValue":function ( globalsConfig, name, value , type)
    {
        if( value.match(/([\'\"]|null|false|true)$/i)  ) {
            return '';
        }
        return "if($"+name+"===null){"+value+";}";
    },
    "defineMethodParameter":function ( globalsConfig, paramMap )
    {
        var items=[];
        for (var n in paramMap)
        {
            var item = paramMap[n];
            if( item.value )
            {
                n=item.value;

            }else{
                n ="$"+n;
                if( item.nullable ){
                    n+="=null";
                }
            }

            if( item.type && isReferenceType( item.type ) && !item.check )
            {
                items.push( item.type+" "+n );
            }else
            {
                items.push( n );
            }
        }
        return items.join(",");
    },
    "getClosureFunctionCall":function(fn, call)
    {
        return "\\Reflect::apply("+( fn.replace(/^\(|\)$/g, "") )+",null,"+( call.replace(/^\(|\)$/g, "") )+")";
    },
    "getForIn":function( value, name, internalName , module, isIterator )
    {
        if( isIterator )
        {
            internalName = "$"+internalName;
            return internalName+"="+value+","+internalName+"->rewind();"+internalName+"->next();";
        }
       return value+' as $'+name+" => $"+internalName;

    },"getInternalVarForIn":function( name, internalName, module, isIterator )
    {
        if( isIterator )
        {
            return '$'+name+"=$"+internalName+"->key()";
        }
        return "";
    },
    "getForInOf":function( value, name, internalName , module , isIterator )
    {
        if( isIterator )
        {
            internalName = "$"+internalName;
            return internalName+"="+value+","+internalName+"->rewind();"+internalName+"->next();";
        }
        return value+' as $'+name;

    },"getInternalVarForInOf":function(name, internalName, module, isIterator )
    {
        if( isIterator )
        {
            return '$'+name+"=$"+internalName+"->current()";
        }
        return "";

    },"getForeachKeyword":function (module, isIterator)
    {
        if( isIterator ){
            return "for";
        }
        return "foreach";

    },"getForeachEnd":function (name, internalName, module, isIterator)
    {
        return "";

    },"getForeachBefore":function (name, internalName, module, isIterator)
    {
        return "";

    },"getKeyword":function (keyword)
    {
        return keyword;
    },"getJointOperator":function ( operator, left, right )
    {
        var leftType = left.type !== "*" && left.type !=="void" ?  left.type : left.referenceType;
        var rightType = right.type !== "*" && right.type !=="void" ?  right.type : right.referenceType;
        if( leftType !== "Number" && right.thisArg && ( left.thisArg.match(/([\+\-\*\/\%\^\&\|]{1})([^>])/) || right.thisArg.match(/>>|<<|>>>|<<</) ) )
        {
            leftType = "Number";
        }

        if( rightType !== "Number" && right.thisArg && ( right.thisArg.match(/([\+\-\*\/\%\^\&\|]{1})([^>])/) || right.thisArg.match(/>>|<<|>>>|<<</) ) )
        {
            rightType = "Number";
        }

        if( leftType !== "Number" && numberType.indexOf(leftType.toLowerCase()) >=0 ){
            leftType = "Number";
        }

        if( rightType !== "Number" && numberType.indexOf(rightType.toLowerCase()) >=0 ){
            rightType = "Number";
        }

        if( leftType === "Number" && rightType==="Number" )
        {
            return operator;
        }

        if( leftType !== "Number" ||  rightType!=="Number" )
        {
            return operator==="+" ? "." : ".=";
        }
        return operator;
    },
    "getWhenValue":function ( value ) {
        return "\\System::when("+value.replace(/(\|\|)/g,",")+")";
    },
    "toForceTypeConvert":function ( value , type , desc, classmodule, globalsConfig )
    {
        type = type.toLowerCase();
        if( type.toLowerCase() ==="boolean" )return '!!'+value;
        var index = numberType.indexOf( type.toLowerCase() );
        if( index >=0 )
        {
            if( globalsConfig.mode < 3 )
            {
                return "\\Reflect::type(" + value + ",'" + type.toLowerCase() + "')";
            }
            return index > 3 ? "floatval("+value+")" : "intval("+value+")";
        }
        if( type ==="object" || type==="array")
        {
            return "("+type+")"+value;
        }
        return value;
    },
    "getObjectKeyValueDelimiter":function (delimiter) {
        return "=>";
    }
};

function isReferenceType( type )
{
    if( type ==="*" || type==="void")return false;
    return ["object","number","string","boolean","class","function","int","integer","uint","float","double","number"].indexOf( type.toLowerCase() ) < 0;
}

const numberType = ["int","Integer","uint","float","double","number"];


module.exports = syntax;