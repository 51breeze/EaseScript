const Utils  = require('../utils.js');
const fun_map={
    "System":function (thisarg, name, value) {
        var param = (value || []).join(",");
        switch ( name ) {
            case "isDefined" :
                return "isset(" + param + ")";
            case "trim" :
                return "trim("+ param + ")";
            case "isString" :
                return "is_string("+ param + ")";
            case "isFunction" :
                return "is_callable("+ param + ")";
        }
        return "";
    },
    "Function":function (thisarg, name, value) {
        value = (value || []).slice(0);
        if( thisarg.substr(0,9)==="(function" && thisarg.slice(-1) ===")" )
        {
            thisarg = thisarg.slice(1,-1);
        }
        switch ( name ) {
            case "call" :
                var param = ["null",thisarg];
                if( value.length > 0 )
                {
                    param.push( value.shift() );
                    if( value.length > 0 ){
                        param.push( "["+value.join(",")+"]" )
                    }
                }
                return "\\es\\system\\Reflect::apply("+param.join(",") + ")";
            case "apply" :
                return "\\es\\system\\Reflect::apply("+ ["null",thisarg].concat( value ).join(",") + ")";
            case "bind" :
                return "\\es\\system\\System::bind("+ [thisarg].concat(value || []).join(",") + ")";
        }
        return "";
    },
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
                return "array_map("+[value, thisarg].join(",")+")";
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
    'console':"Console",
    'document':"\\es\\system\\Document::document()",
    'window':"\\es\\system\\Window::window()",
    "Object":"BaseObject",
    'Reflect':"\\es\\system\\Reflect",
    'arguments':"func_get_args()",
}

const classNameMap={
    "Object":"\\es\\system\\BaseObject",
    'console':"\\es\\system\\Console",
    'Console':"\\es\\system\\Console",
    'Reflect':"\\es\\system\\Reflect",
}

const classTypeForString={
    "array":true,
    "object":true,
    "string":true,
    "int":true,
    "double":true,
    "uint":true,
    "float":true,
    "boolean":true,
    "integer":true,
    "number":true,
    "class":true
}

const excludeUseMap= {
    'Array':true,
    'Number':true,
    'Boolean':true,
    'console':false,
    'Document':false,
    'String':true,
    'Function':true,
    'Class':true,
    'Window':false,
    "Object":true,
    "String":true,
    "int":true,
    "double":true,
    "uint":true,
    "float":true,
    "boolean":true,
    "Integer":true,
    "Number":true,
    "Class":true,
    "Math":true
}

var syntaxBuilder={

    "bulidNamespaceClassValueOf": function(classname, fullclassname, module, importMap, value , config)
    {
        var values = [];
        for(var n in importMap )
        {
            var  _cname= importMap[n].fullclassname || importMap[n].type;
            if( _cname !=="Class" && module.fullclassname !== _cname && importMap[n].package ) {
                values.push(syntaxBuilder.formatImportClassPath(_cname, importMap[n]));
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
               properties.push("$this->" + p + "=" + item.value);
            }
        }
        if(  properties.length > 0 )
        {
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
        if( classModule.isStatic )
        {
            return "";
        }
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
        return classname.replace(/^\.|\.$/g,"").replace(/^\\+/,"").replace(/\./g,"\\");
    },

    "buildPropertiesAndMethod":function ( describe, config , classModule , makeSyntax, nsUri )
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
                var namespaceModule = syntaxBuilder.getLoaclAndGlobalModuleDescription( syntaxBuilder.getImportType(classModule, p ) );
                var _value = syntaxBuilder.buildPropertiesAndMethod(desc,config,classModule, makeSyntax, namespaceModule.nsUri );
                properties = properties.concat( _value[0] );
                code = code.concat( _value[1] );
                continue;
            }

            var nsuri =  desc.hasCustomNs ? desc.nsUri||nsUri : '';
            var ns = desc.hasCustomNs ? "public" : desc.privilege;
            var isStatic = classModule.isStatic || desc.isStatic || desc.id === "namespace";
            if( isStatic )
            {
                ns = "static "+ns;
            }

            var returnType = syntaxBuilder.getLoaclAndGlobalModuleDescription( desc.type );
            if( returnType )
            {
                syntaxBuilder.setClassModuleUsed(returnType,classModule);
            }

            if( classModule.id==="interface")
            {
                if( desc.id === "function" )
                {
                    var _param = desc.value && desc.value.set ? desc.value.set.param : desc.param;
                    _param = _param.map(function (a,i) {
                        var type = desc.paramType[i];
                        if( type==="*" || type==="void"){
                            type = null;
                        }
                        if( type )
                        {
                            var typeClass = syntaxBuilder.getLoaclAndGlobalModuleDescription( type );
                            if( typeClass ) {
                                syntaxBuilder.setClassModuleUsed(typeClass, classModule);
                            }

                            if( typeClass.nonglobal===true )
                            {
                                if( classModule.fullClassName === typeClass.fullClassName )
                                {
                                type = typeClass.classname;
                                }else
                                {
                                    for( var c in classModule.import )
                                    {
                                        if( classModule.import[c] === type )
                                        {
                                            type = c;
                                            break;
                                        }
                                    }
                                }

                            }else
                            {
                                //指定参数的类型，php 5.6 以下只能使用以下类型
                                type = type.toLowerCase();
                                if( type !== "array" ){
                                    type="";
                                }
                            }
                        }

                        if( type ==="array" )
                        {
                            return type+" $"+a;
                        }else{
                            return type ? type+" $"+a : "$"+a;
                        }

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
                Utils.forEach(desc.paramType,function (classname){
                    var typeClass = syntaxBuilder.getLoaclAndGlobalModuleDescription(classname);
                     if( typeClass ) {
                         syntaxBuilder.setClassModuleUsed(typeClass, classModule);
                     }
                });

                var value;
                if( desc.varToBindable )
                {
                    var accessor =  syntaxBuilder.getVariableBindableToAccessor(desc.accessorName, desc.accessorPropName, desc.eventType, desc.privilege, classModule, config);
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
                        else
                        {
                            if( !desc.value || desc.value==="undefined" || desc.value.match(/^(\"|\'|\d+|null|false|true|NaN)/i) )
                            {
                                properties.push(ns + " $" + nsuri + p + '=' + ( desc.value==="undefined"||!desc.value ? "null" : desc.value ) + ';');
                            }else
                            {
                               if( isStatic && desc.value )
                               {
                                    var fullClassName = '\\'+classModule.fullclassname.replace(/\./g,'\\');
                                   // var propname = fullClassName+"::$"+nsuri+p;
                                    var reflectSet = "\\es\\system\\Reflect::set('"+fullClassName+"','"+fullClassName+"','"+p+"',"+desc.value+",null,"+(nsuri||null)+");\n";
                                   // staticProperties.push("if("+propname+"===null){\n"+reflectSet+";\n}" );
                                    staticProperties.push( reflectSet );
                                }
                                properties.push(ns + " $" + nsuri + p + '=' + ("null") + ';');
                            }
                        }
                    }
                }
            }
        }
        return [properties,code,staticProperties.join("")];
    },

    "buildClassPropertiesAndMethod":function ( classModule, inheritModule, config, makeSyntax, externalProperties )
    {
        var code=[];
        var properties = [];

        //静态成员
        var value = syntaxBuilder.buildPropertiesAndMethod( classModule.static, config ,classModule, makeSyntax );
        properties = value[0];
        code = value[1];
        if( externalProperties && value[2] ){
            externalProperties.push( value[2] );
        }

        //实例成员
        value = syntaxBuilder.buildPropertiesAndMethod( classModule.proto, config ,classModule , makeSyntax )
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

        //当前有使用命名空间
        if( module.useExternalClassModules && module.useExternalClassModules.length >0 )
        {
            Utils.forEach( module.useExternalClassModules, function (classname) {
                if( !useClass[ classname ] && !(excludeUseMap[ classname ] || module.fullclassname === classname) )
                {
                    useClass[ classname ] = true;
                    var o = syntaxBuilder.getLoaclAndGlobalModuleDescription( classname );
                    //当前类名与导入的类名在不相同时使用use打开命名空间
                    if( o.classname !== module.classname )
                    {
                        if (o.nonglobal === true) {
                            if(o.package) {
                                importClass.push( syntaxBuilder.formatImportClassPath(classname) );
                            }else{
                                importClass.push( classname+" as "+classname );
                            }
                        } else {
                            importClass.push(syntaxBuilder.formatImportClassPath( classNameMap[classname] || ( config.build_system_path+'.'+classname) ) );
                        }
                    }
                }
            });
        }

        if( module.package )
        {
            str.push("namespace " + syntaxBuilder.formatImportClassPath(module.package) + ";\n");
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
            str.push( " extends "+syntaxBuilder.getDefinitionByName(module.inherit,null, module,true) );
        }
        if( module.implements && module.implements.length > 0 )
        {
            var imples = module.implements.map(function (a){
                 return syntaxBuilder.formatImportClassPath(a);
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
    "getWrapReference":function (classModule, type, thisArg)
    {
         switch( type.toLowerCase() )
         {
             case "regexp" :
                 var index = thisArg.lastIndexOf("/");
                 var regexp =  thisArg.substr(1,index-1);
                 var flag =  thisArg.substr(index+1);
                 return "(new RegExp('"+regexp+"','"+flag+"'))";
         }
         return thisArg;
    },
    "newInstanceClassOf":function (className, classModule, param)
    {
        if( className==="Array" ){
            return "["+param+"]";
        }else if( className==="JSON")
        {
            if( param.length > 2 ) {
                return 'new \\es\\system\\BaseObject(' + param.replace(/^\{/g, "[").replace(/\}$/g, "]")+')';
            }else
            {
                return "new \\es\\system\\BaseObject()";
            }
        }
        className = classNameMap[className] ? classNameMap[className] : className;
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
            if( !isNew )
            {
                if( classTypeForString[ thisvrg.toLowerCase() ] )
                {
                    return  "'"+thisvrg+"'";
                }

                //全局类
                if( ["BaseObject","System","Console","Document","Window"].indexOf(thisvrg) >= 0 )
                {
                    return before + thisvrg + "::class";
                }

                //如果是对一个类的引用
                if( desc.descriptor && desc.descriptor.id==="class" && thisvrg.match(/^\w+$/) )
                {
                    return syntaxBuilder.getDefinitionByName(thisvrg, desc.descriptor, classmodule );
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
                if( desc.descriptor.id==="function")
                {
                    return "\\es\\system\\System::bind(array("+thisvrg+",'"+(ns+props[0])+"'))";
                }
                return "array("+thisvrg+",'"+(ns+props[0])+"')";
            }
        }

        var method = '\\es\\system\\Reflect::get';
        var param = [ thisvrg , props[0] ,'true','null'];
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
                method = '\\es\\system\\Reflect::incre';

            }else if(  before==="--" || desc.after==="--" )
            {
                method = '\\es\\system\\Reflect::decre';
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
            value = syntaxBuilder.buildExpressionGetOf(globalsConfig, classmodule, thisvrg, desc, props ,info,"",ns,useNs)+operator.slice(0,-1)+value ;
        }

        var checkRunning = desc.runningCheck;
        checkRunning =  (checkRunning || !desc.descriptor);
        props = Utils.createReferenceProps( props, checkRunning );

        thisvrg =  thisMap[ thisvrg ] || thisvrg;

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
                var isClassRef = syntaxBuilder.getLoaclAndGlobalModuleDescription( thisvrg );
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

        var method = '\\es\\system\\Reflect::set';
        var param = [ thisvrg , props[0], value, 'null','null'];
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

        if( thisvrg==="BaseObject" && props.length===1 && props[0]==="forEach")
        {
            return thisvrg + "::each(" + (desc.param ? desc.param : []).join(",") + ")";
        }

        //生成引用的属性
        props = Utils.createReferenceProps(props, checkRunning );

        //不需要运行时检查
        if( !checkRunning )
        {
            if( ( (desc.ownerThisType && desc.ownerThisType !=="*") || thisvrg==="System" ) &&
                props.length===1 && fun_map.hasOwnProperty( desc.ownerThisType ) )
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
                var sem = desc.descriptor.id==="const" || desc.descriptor.id === "function" ? "::" : "::$";
                props.unshift( thisvrg );
                if( desc.descriptor.id !== "function"){
                    if( desc.param && desc.param.length > 0 ) {
                        return "call_user_func_array(" + Utils.joinProperty(props,sem) + ", [" + (desc.param || []).join(",") + "])";
                    }else{
                        return "call_user_func_array(" + Utils.joinProperty(props,sem) +")";
                    }
                }
                return Utils.joinProperty( props,sem) + "(" + (desc.param || []).join(",") + ")";
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
                    map = [ syntaxBuilder.buildExpressionGetOf(globalsConfig, classmodule, thisvrg, desc, props ,info, ns , useNs ) ];
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
        var method = '\\es\\system\\Reflect::call';
        var param = [ thisvrg,'null', 'null', 'null', 'null'];
        var index = 2;
        if( props[0] )
        {
            param.splice(1, 1, props[0]);
        }

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

        if( desc && desc.descriptor )
        {
            return "new " + syntaxBuilder.getDefinitionByName(express,desc,classmodule,true) + "(" + newParam.join(",") + ")";
        }
        return "\\es\\system\\Reflect::construct("+classmodule.classname+"::class,"+express+","+newParam.join(",")+")";
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
            var owner = desc.descriptor.owner ? syntaxBuilder.getLoaclAndGlobalModuleDescription(desc.descriptor.owner ): null;
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
        var method = '\\es\\system\\Reflect::deleteProperty';
        var param = [thisvrg,props[0]];
        param.unshift( classmodule.classname+"::class" );
        return method+'('+param.join(',')+')';
    },

    "buildExpressionHasOf": function(globalsConfig, classmodule, thisvrg, desc, props ,info)
    {
        var scope = "null";
        if( desc.type )
        {
            if( classmodule.fullclassname ===  desc.type )
            {
                scope = classmodule.classname;
            }
        }
        return "\\es\\system\\Reflect::has("+scope+","+ thisvrg + ","+props+")";
        //return "property_exists("+thisvrg+","+props+")";
    },
    "buildExpressionTypeOf":function(globalsConfig,classmodule,type,value, info )
    {
        type = syntaxBuilder.getDefinitionByName(type,null,classmodule);
        return "\\es\\system\\Reflect::type("+ value + ","+type+")";
    },
    "typeOf":function (value)
    {
        return '\\es\\system\\System::typeOf('+value+')';
    },
    "instanceOf":function (value, classType)
    {
       return "\\es\\system\\System::is(" + value + "," + classType + ", false)";
    },
    "isOf":function (value, classType)
    {
        return "\\es\\system\\System::is(" + value + "," + classType + ")";
    },
    "getDefinitionByName":function (classname , desc, classmodule, isNew )
    {

        classname = classname.replace(/\\/g,".").replace(/^\.|\.$/g,"").replace(/^es\.system\./i,'');
        if( classTypeForString[ classname.toLowerCase() ] )
        {
            return "'"+classname+"'";
        }

        var isDef = false;
        var isglobal = false;
        var module = null;
        //在类中已经定义过
        if( classmodule.import && classmodule.import.hasOwnProperty(classname) )
        {
            module = syntaxBuilder.getLoaclAndGlobalModuleDescription( classmodule.import[classname] );
            isglobal = !module.nonglobal;
            isDef = true;
        }
        //全局类允许不定义使用
        else if( (module = syntaxBuilder.getLoaclAndGlobalModuleDescription( classname )) )
        {
            isglobal = !module.nonglobal;
        }

        //使用全限定名引用
        if( isglobal && !isDef )
        {
            classname = "es.system."+classname;
        }

        if( isNew )
        {
            if( classname.indexOf(".") > 0 ){
                return "\\"+classname.replace(/\./g,"\\");
            }
            return classname;
        }
        if( classname.indexOf(".") > 0 )
        {
            return "\\"+classname.replace(/\./g,"\\")+"::class";
        }
        return isDef ? classname+"::class" : "'"+classname+"'";
    },
    "getClassModuleName":function ( classname, classModule, isNew)
    {
        classname = classname.replace(/\\/g,".").replace(/^\.|\.$/g,"");
        if( isNew )
        {
            if( classname.indexOf(".") > 0 ){
                return "\\"+classname.replace(/\./g,"\\");
            }
            return classname;
        }
        if( classname.indexOf(".") > 0 )
        {
            return "\\"+classname.replace(/\./g,"\\")+"::class";
        }
        return "'"+classname+"'";
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
            return 'if('+nullable+'!' +syntaxBuilder.isOf( value, syntaxBuilder.getClassModuleName( type, typeClass ) ) + ')throw new \\es\\system\\TypeError("type mismatch the \\"\\'+value+'\\" parameter must be ' + type +'");\n';
        }
    },
    "getMethodParamDefualtValue":function ( globalsConfig, name, value , type)
    {
        //console.log( value )
        if( !value || value === "undefined" || value.match(/([\'\"]|null|false|true|NaN|[\d\.]+)$/i)  ) {
            return '';
        }
        return "if($"+name+"===null){"+value+";}";
    },
    "defineMethodParameter":function ( globalsConfig, paramMap, classModule )
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
                var type = item.type;
                if( type.toLowerCase() ==="array" )
                {
                    type = "array";
                    //n="&"+n;
                }
                items.push( type+" "+n );

            }else
            {
                items.push( n );
            }
        }
        return items.join(",");
    },
    "getClosureFunctionCall":function(fn, call)
    {
        return "\\es\\system\\Reflect::apply("+( fn.replace(/^\(|\)$/g, "") )+",null,"+( call.replace(/^\(|\)$/g, "") )+")";
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
    "getWhenValue":function (items)
    {
        return items.filter(function(val){
              return val!=="||";
        }).join(" ?: ");
        return "\\es\\system\\System::when("+items.join(",")+")";
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
                return "\\es\\system\\Reflect::type(" + value + ",'" + type.toLowerCase() + "')";
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


module.exports = syntaxBuilder;