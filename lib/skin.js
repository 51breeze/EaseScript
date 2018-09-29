const libxml = require('libxmljs');
const Utils  = require('./utils.js');
const PATH = require('path');

//private
function __toString(skin, notContainer , parent, separation, makeSyntax )
{
    makeSyntax = makeSyntax || skin.context.syntax;
    if( typeof skin === "string" )return skin;
    var tag = skin.name;
    var children = skin.children || [];
    var attr = skin.attr || {};
    var content=[];
    separation = separation || "";

    var endTag = "";
    if( ["meta","link","input","base"].indexOf(skin.name) >= 0 ){
        endTag = "/";
    }

    //如果组件在子级中
    if( (skin.isComponent === true || skin.id ) && parent )
    {
        throw new TypeError('Component cannot be converting to string for "'+skin.fullclassname+'"');
    }
    for (var c in children)
    {
        var child = children[c];
        if( child.nonChild || child.isProperty )continue;
        if ( child+"" === "[object Object]" )
        {
            content.push( __toString(child, false, skin, separation, makeSyntax ) );
        } else
        {
            content.push( child.toString() );
        }
    }
    content = content.join( separation );
    if( notContainer===true )
    {
        if( !content && skin.isProperty && skin.defualtValue )
        {
            return skin.defualtValue;
        }
        return content;
    }

    if( tag==='text' )return content;
    if( tag.charAt(0) ===":" )
    {
        tag = tag.substr(1);
        var syntax = makeSyntax==="php" ? "php" : 'default';
        syntax = template_syntax[ syntax ];
        if( !syntax[tag] )throw new SyntaxError('Syntax tag is not supported for "'+tag+'"');
        var template = syntax[tag](attr,content, children.length > 0 );
        return template;
    }

    var str = '<' + tag;
    for (var p in attr)
    {
        if( p !=='id' )
        {
            //var v = attr[p].replace(/([\"\'])/g,'\\$1');
            var v = attr[p].replace(/([\'])/g,'\\$1');
            str += " "+p+'="'+v+'"';
        }
    }

    if( skin.appendAttr )
    {
        str += " "+skin.appendAttr+"";
    }

    if( endTag )
    {
        return  str += '/>';
    }

    str += '>' + content + '</' + tag + '>';
    return str;
}

function __toItem(skin, flag)
{
    if( typeof skin === "string" )return flag===true ? '[]' : '{}';
    var children = skin.children || [];
    var content=[];
    var hash={};
    var forceToArr = false;

    if( children.length===1 && children[0].namespace && children[0].name === "Array" )
    {
        children = children[0].children;
        flag = true;
        for(var i in children )
        {
            content.push( __toItem(children[i]) );
        }
        children=[];
    }

    for (var c in children)
    {
        var child = children[c];
        if( child.nonChild || child.isProperty )continue;
        if( child.id )
        {
            content.push( child.id );
            forceToArr = true;
            continue;
        }

        if( typeof child === "string" )
        {
            content.push( child );
            forceToArr = true;
            continue;
        }

        var name  = child.attr.name || child.name;
        var value = child.attr.value;
        var type  = child.attr.type;
        if( !type && child.description )
        {
            type = child.description.type;
        }

        if( type )
        {
            switch ( type.toLowerCase() )
            {
                case "array" :
                    value = __toItem(child, true);
                    break;
                default :
                    value = __toItem(child);
            }

        }else if( child.children.length>0 )
        {
            value = __toString(child,true);
        }

        if( flag ===true )
        {
            if( !type || type.toLowerCase()==='string' )
            {
                content.push( '"'+value+'"' );
            }else
            {
                content.push( value );
            }

        }else
        {
            if( hash[name]===true )
            {
                throw new Error('"' + name + '" has already been declared');
            }
            hash[name]=true;
            if( !type || type.toLowerCase()==='string' )
            {
                content.push('"' + name + '":"' + value + '"');
            }else
            {
                content.push('"'+ name+'":'+value);
            }
        }
    }
    if( forceToArr && !flag )
    {
        if( content.length===1 )
        {
            return content[0];
        }
        flag = true;
    }
    return flag === true ? '['+ content.join(',')+']' : '{'+ content.join(',')+'}';
}

var operation_hash={
    'gt':'>',
    'lt':'<',
    'egt':'>=',
    'elt':'<=',
    'eq':'==',
    'eqt':'===',
    'and':'&&',
    'or':'||',
};

function replace_condition( condition, syntax )
{
    condition =  condition.replace(/\s+(gt|lt|egt|elt|eq|and|or|eqt)\s+/ig,function (a,b) {
        return operation_hash[ b.toLowerCase() ];
    });
    if( syntax ==="php" ) {
        condition = condition.replace(/(\w+)/g, function (a, b, c) {
            return '$' + b;
        });
    }
    return condition;
}

//private
var template_syntax={
    'default': {
        'foreach': function (attr, content) {
            return '<? this.forEach(' + attr.name + ' , function(' +(attr.value || 'item')+','+(attr.key || 'key') + ', forIndex){ ?>' + content + '<?})?>';
            return '<? foreach(' + attr.name + ' as ' + (attr.key || 'key') + ' ' + (attr.value || 'item') + '){ ?>' + content + '<?}?>';
        },
        'for': function (attr, content) {
            return '<? for(' + replace_condition(attr.condition) +'){ ?>' + content + '<?}?>';
        },
        'if': function (attr, content) {
            return '<? if(' + replace_condition(attr.condition) + '){ ?>'+content+'<?}?>';
        },
        'elseif': function (attr, content) {
            return '<? elseif(' +  replace_condition(attr.condition) + '){ ?>'+content+'<?}?>';
        },
        'else': function (attr, content, hasChild ) {
            if( hasChild )
            {
                return '<? else{ ?>' + content + '<?}?>';
            }else{
                return '<? }else{ ?>';
            }
        },
        'do': function (attr, content) {
            return '<? do{ ?>'+content+'<?}?>';
        },
        'switch': function (attr, content) {
            return '<? switch(' +  replace_condition(attr.condition) + '){ ?>'+content+'<?}?>';
        },
        'case': function (attr, content) {
            content = '<? case "' +  replace_condition(attr.condition) + '": ?>'+content;
            if( attr["break"]==='true' )content+='<? break; ?>';
            return content;
        },
        'default': function (attr, content) {
            content='<? default: ?>'+content;
            if( attr["break"]==='true' )content+='<? break; ?>';
            return content;
        },
        'break': function (attr, content) {
            return '<? break; ?>'+content;
        },
        'while': function (attr, content) {
            return '<? while(' +  replace_condition(attr.condition) + '){ ?>'+content+'<?}?>';
        },
        'code': function (attr, content) {
            return '<? '+content+' ?>';
        },'script': function (attr, content) {
            return '<? code{ ?>'+content+' <? } ?>';
        }
    },
    'php': {
        'foreach': function (attr, content) {
            return '<? foreach(' + attr.name + ' as ' + (attr.key || 'key') + ' ' + (attr.value || 'item') + '){ ?>' + content + '<?}?>';
        },
        'for': function (attr, content) {
            var condition = replace_condition(attr.condition, "");
            return '<? for(' + condition +'){ ?>' + content + '<?}?>';
        },
        'if': function (attr, content) {
            return '<? if(' + replace_condition(attr.condition, "") + '){ ?>'+content+'<?}?>';
        },
        'elseif': function (attr, content) {
            return '<? elseif(' +  replace_condition(attr.condition, "") + '){ ?>'+content+'<?}?>';
        },
        'else': function (attr, content, hasChild ) {
            if( hasChild )
            {
                return '<? else{ ?>' + content + '<?}?>';
            }else{
                return '<? }else{ ?>';
            }
        },
        'do': function (attr, content) {
            return '<? do{ ?>'+content+'<?}?>';
        },
        'switch': function (attr, content) {
            return '<? switch(' +  replace_condition(attr.condition, "") + '){ ?>'+content+'<?}?>';
        },
        'case': function (attr, content) {
            content = '<? case "' + attr.condition + '": ?>'+content;
            if( attr["break"]==='true' )content+='<? break; ?>';
            return content;
        },
        'default': function (attr, content) {
            content='<? default: ?>'+content;
            if( attr["break"]==='true' )content+='<? break; ?>';
            return content;
        },
        'break': function (attr, content) {
            return '<? break; ?>'+content;
        },
        'while': function (attr, content) {
            return '<? while(' +  replace_condition(attr.condition, "") + '){ ?>'+content+'<?}?>';
        },
        'code': function (attr, content) {
            return '<? '+content+' ?>';
        },'script': function (attr, content) {
            return '<? '+content+' ?>';
        }
    }
};

/**
 * 获取一个皮肤对象结构
 * @param name
 * @param attr
 * @returns {object}
 */
function getSkinObject(name, attr )
{
    return {
        "name":name,
        "attr":attr||{},
        "hash":{},
        "children":[],
    };
}

function skinAttrToString(skin, delimiter, isAttr )
{
    var attrStr = [];
    for(var p in skin.attr )
    {
        var attrV = Utils.trim(skin.attr[p]);
        if( attrV )
        {
            var key = isAttr===true ? p : '"'+p+'"';
            if( !isAttr && attrV.charAt(0)==="@")
            {
                attrStr.push( key+(delimiter||':')+attrV.substr(1) );
            }else{
                attrStr.push( key+(delimiter||':')+'"'+attrV+'"' )
            }
        }
    }
    return attrStr;
}

/**
 * 生成指定皮肤所需要的构造参数值
 * super("div",{"class":"myclass"})
 * @param skin
 * @returns {*}
 */
function makeSkinParam(skin, flag)
{
    var content=[];
    var _name = skin.name === "Skin" ? "div" : skin.name;
    var attrStr = skinAttrToString(skin);
    content.push("'"+(_name)+"'");
    if( skin.attributeId )
    {
        attrStr.push('"id":"'+skin.attributeId+'"');
    }

    //是否需要获取当前皮肤的子级内容(非组件的子级)
    if( flag !== false )
    {
        if( skin.children.length===1 && typeof skin.children[0] === "string" )
        {
            if( skin.children[0] )
            {
                attrStr.push('"innerHtml":"' + skin.children[0].replace(/"/g, '\\"') + '"')
            }
        }
    }

    if( skin.isGloableElement )return '';
    if( attrStr.length > 0 )
    {
        content.push('{' + attrStr.join(",") + '}');
    }
    if( content.length === 0 )return '';
    return content.join(",");
}

/**
 * 获取皮肤对象下的html元素
 * @param skin
 */
function getSkinChildHtml(skin)
{
    var children = [];
    Utils.forEach(skin.children,function (child) {
        if( !(child.nonChild || child.isProperty || child.isComponent || child.isSkin) && !child.isGloableElement )
        {
            children.push( (skin.id || "this") + ".addChildAt( new Skin('" + __toString(child) + "')," + child.childIndex + ")");
        }
    });
    return children;
}

/**
 * 获取指定皮肤对象的字符串
 * @param skin
 * @param level
 * @returns {string}
 */
function getSkinChildToString( skin, level )
{
    level = level || 1;
    if( typeof skin === "string")return skin;
    var content=[];
    var attrStr = [];
    var endTag = "";
    if( level > 1 )
    {
        if (skin.attributeId) {
            attrStr.push('id="' + skin.attributeId + '"');
        }
        for (var p in skin.attr) {
            var attrV = Utils.trim(skin.attr[p]);
            if (attrV)attrStr.push(p + '="' + attrV + '"')
        }
        if (["meta", "link", "input","base"].indexOf(skin.name) >= 0) {
            endTag = "/";
        }
        if (attrStr.length > 0) {
            content.push('<' + skin.name + " " + attrStr.join(" ") + endTag + ">");
        } else {
            content.push('<' + skin.name + endTag + ">");
        }
    }
    if( !endTag )
    {
        for (var i in skin.children )
        {
            var item = skin.children[i];
            //非组件的元素
            if( !(item.nonChild || item.isProperty || item.isComponent || item.isSkin) )
            {
                content.push( getSkinChildToString(skin.children[i], level + 1) );
            }
        }

        if( level > 1 )
        {
            content.push('</' + skin.name + '>');
        }
    }
    return content.join("");
}

/**
 * 判断元素是否为非子级
 * @param elem
 * @returns {boolean|*}
 */
function isNonChild( elem )
{
    return (elem.nonChild || elem.isProperty);
}

/**
 * 判断指定的元素是否为服务端的组件
 * @param context
 * @param elem
 * @returns {boolean}
 */
function isSerComponent(context, elem )
{
    return context.syntax !== "javascript" && elem.isComponent && !elem.isProperty;
}

/**
 * 获取指定皮肤下使用的所有组件
 * @param skin
 * @returns {Array}
 */
function getChildComponents( skin )
{
    var children = skin.children;
    var len = children.length;
    var index = 0;
    var content = [];
    for (;index<len;index++)
    {
        var child = children[ index ];
        if( child.isComponent )
        {
            content.push( child );
        }
        if( child.children && (child.isComponent || child.isProperty || child.isChildProperty) )
        {
            content = getChildComponents(child).concat( content );
        }
    }
    return content;
}


//获取唯一的id
var __uid__=1;
function uid(context){
    return __uid__++;
}

function getUniqueVar(context) {
    return "__var"+uid(context)+"__";
}

/**
 * 获取元素引用的命名空间
 * @param elem
 * @returns {*}
 */
function getNamespace(elem)
{
    var namespace = elem.namespace();
    if( namespace )
    {
        namespace = Utils.trim( namespace.href() );
        if( namespace.charAt(0) === '@')
        {
            namespace = namespace.substr(1);
            return {name:namespace, isSystem:true};
        }
        return  {name:namespace, isSystem:false};
    }
    return {name:'', isSystem:false};
}

/**
 * 获取导入的类名
 * @param name
 * @param imports
 * @returns {*}
 */
function getImportClassName(name, imports)
{
    if( imports )
    {
        if( imports.hasOwnProperty(name) )return imports[name];
        for(var i in imports )
        {
            if( i === name )return imports[i];
        }
    }
    return null;
}


/**
 * 执行模块的原型链，直到回调函数返回值或者已到达最上层为止
 * @param classModule
 * @param callback
 * @returns {*}
 */
function doPrototype(classModule,  descriptions, callback)
{
    while ( classModule )
    {
        var val = callback( classModule );
        if( val )return val;
        if( classModule.inherit )
        {
            classModule = descriptions( getImportClassName(classModule.inherit, classModule.import ) );
        }else
        {
            return null;
        }
    }
    return null;
}

/**
 * 检查实例对象类型
 * @param context
 * @param classModule
 * @param classType
 * @param isInterfaceType
 * @returns {*}
 */
function checkInstanceOf(context, classModule, classType, isInterfaceType )
{
    var descriptions = function (full) {
        return makeSkin.getLoaclAndGlobalModuleDescription(full);
    }
    return doPrototype(classModule, descriptions, function (classModule) {
        if( (classModule.fullclassname || classModule.type) === classType )return true;
        if( classModule.implements && classModule.implements.length > 0 && isInterfaceType )for( var i in classModule.implements )
        {
            var _m = descriptions(  getImportClassName(classModule.implements[i], classModule.import ) );
            return doPrototype( _m , descriptions ,function (interfaceModule) {
                if( interfaceModule.fullclassname === classType )return true;
            });
        }
    });
}

/**
 * 获取模块的类型
 */
function getModuleType( context, description, types )
{
    while ( description && (description.id==='class'||description.id==="interface") )
    {
        var classname = description.classname || description.type;
        var fullname = description.package ? description.package+'.'+classname : classname;
        if( types.indexOf( fullname ) >=0 )
        {
            return fullname;
        }
        if( !description.inherit )return null;
        fullname = getImportClassName(description.inherit, description.import );
        if( fullname )
        {
            description = makeSkin.getLoaclAndGlobalModuleDescription( fullname );
        }else
        {
            return null;
        }
    }
    return null;
}

/**
 * 获取类中成员信息。
 * 如果是继承的类，成员信息不存在时则会逐一向上查找，直到找到或者没有父级类为止。
 * @param it
 * @param refObj 引用类模块
 * @param name 原型链名
 * @param classmodule 当前类模块
 * @returns {*}
 */

$has = Object.prototype.hasOwnProperty;
function getClassPropertyDesc(name, currentModule, context , isset )
{
    if( currentModule.description )
    {
        var currentModule = currentModule.description;
        var parent = currentModule;
        var desc;
        var last = parent;
        var parentClass;
        do{
            var proto = $has.call(parent,'proto') ? parent['proto'] : null;
            if( proto )
            {
                if ( $has.call(proto,name) )
                {
                    desc = proto[name];
                    if ( currentModule !== parent && !checkPrivilege(desc, parent, currentModule) )
                    {
                        return null;
                    }
                    if( !isset || !desc.isAccessor )return desc;
                    if( isset && desc.value && desc.value.set ) return desc;
                }
            }
            var xml = parent['xml'];
            if( xml && xml.hasOwnProperty(name) )
            {
                return { param:xml[name], isXMLProperty:true };
            }

            last = parent;
            if( parent.inherit )
            {
                parentClass = parent.inherit;
                if( parent.nonglobal === true && parent.import )
                {
                    parentClass = parent.import.hasOwnProperty( parent.inherit ) ? parent.import[ parent.inherit ] : parent.inherit;
                }
                parent = makeSkin.loadModuleDescription(context.syntax, parentClass , context.config, context.filepath );

            }else
            {
                parent = null;
            }
        }while ( parent && parent.id==='class' && last !== parent );
    }
    return null;
}

/**
 * 检查所在模块中的属性，在当前场景对象中的访问权限
 * @param desc 属性描述
 * @param inobject 查找的类对象
 * @param currobject 当前类对象
 */
function checkPrivilege(desc, inobject, currobject )
{
    //非全局模块需要检查
    if ( typeof desc.privilege !== "undefined" )
    {
        //包内访问权限
        var internal = inobject.package === currobject.package && desc.privilege === 'internal';

        //子类访问权限
        var inherit = inobject.fullclassname === currobject.import[ currobject.inherit ] && desc.privilege === 'protected';

        //判断访问权限
        if ( !(internal || inherit || desc.privilege === 'public') )
        {
            return false;
        }
    }
    return true;
}

/**
 * 获取属性值，并根据指定的类型进行验证转换
 * @param attrValue
 * @param type
 * @param context
 * @returns {*}
 */
function getAttributeValue( attrValue, type , context)
{
    if( attrValue.charAt(0)==='@' )
    {
        attrValue = attrValue.substr(1);
        var metaData = Utils.executeMetaType( attrValue );
        if( metaData )
        {
            switch ( metaData.type )
            {
                case 'Skin':
                    var source = metaData.param.source;
                    makeSkin.loadSkinModuleDescription(context.syntax, source,  context.config , context );
                    if (context.imports.indexOf(source) < 0)context.imports.push(source);
                    attrValue = source;
                    break;
            }
        }

    }else
    {
        switch( type.toLowerCase() )
        {
            case 'class' :
                makeSkin.loadSkinModuleDescription( context.syntax, attrValue, context.config , context );
                if (context.imports.indexOf(attrValue) < 0)context.imports.push(attrValue);
                break;
            case 'array' :
                attrValue='["'+attrValue.split(',').join('","')+'"]';
                break;
            case 'number' :
            case 'int' :
            case 'uint' :
            case 'Integer' :
            case 'double' :
            case 'boolean' :
                return attrValue;
                break;
            default:
                attrValue='"'+attrValue+'"';
        }
    }
    return attrValue;
}

//绑定属性
function parseBinable(attrValue, attrName, skinObject, context )
{
    if(attrValue && attrValue.slice(0,2) === '{{' && attrValue.slice(-2) === '}}' )
    {
        attrValue = attrValue.slice(2,-2);
        attrValue = attrValue.split('|');
        skinObject.isBindable=true;

        //如果只是一个普通的元素，使用皮肤对象代替
        setViewportComponent( skinObject );

        var bindname = attrValue[0].replace(/\s/g,'');
        bindname = bindname.split('.');
        if( bindname[0] !== 'this' )bindname.unshift('this');
        var refname = bindname.pop();
        var refobj =  bindname.join('.');
        var binding = context.bindable[ refobj ] || (context.bindable[ refobj ]={name:[],bind:[]});
        if( binding.name.indexOf(refname) < 0 ){
            binding.name.push(refname)
        }

        if( !skinObject.attributeId )
        {
            skinObject.attributeId = "I-D-"+uid(context);
        }

        var viewport ="Element('#" + skinObject.attributeId + "')";
        if( skinObject.isComponent && skinObject.id && skinObject.isPrivate !==true )
        {
            viewport = "this."+skinObject.id+".element";
        }

        var param = {id:skinObject,viewport:viewport,attr:attrName,name:refname,flag:(attrValue[1]||'').toLowerCase()!=="false"};
        if( skinObject.module.description )
        {
            var desc = getClassPropertyDesc(attrName, skinObject.module, context);
            if( desc && desc.id==='function' && !(desc.value && desc.value.set) )
            {
                var isElementProperty = false;
                if( skinObject.module.isSkin )
                {
                    var elementDesc = makeSkin.getLoaclAndGlobalModuleDescription("Element");
                    if( elementDesc && elementDesc.proto[ attrName ] ){
                        desc = elementDesc.proto[ attrName ];
                        if( desc.id==="function" && desc.isFunAccessor ===true )
                        {
                            isElementProperty = true;
                        }
                    }
                }
                if( isElementProperty=== false )
                {
                    throw new TypeError('Invalid binding for "'+attrName+'"');
                }
            }
        }
        binding.bind.push( param );
        return "";
    }
    return attrValue;
}
//绑定文本
function parseTextBinding(context,parent,text, childIndex )
{
    if( parent.isSkin || parent.isComponent || parent.isProperty  )
    {
        return text;
    }

    var match = null;
    var regexp = /\{([^\{]+?)\}/g;
    var cursor = 0;
    var content = [];
    var has = false;

    while ( match=regexp.exec(text) )
    {
        if( text.charCodeAt(match.index-1)===92 )
        {
            var startPos = match.index-1;
            var endPos = startPos;
            while( endPos > 0 && text.charCodeAt( --endPos ) === 92 );
            if( (startPos-endPos) % 2 === 1 )
            {
                continue;
            }
        }
        var name = Utils.trim( match[1] );
        var props = name.split('.');
        var refObject = "this.assign('"+name+"')";
        if( props[0] === 'this' || props[0] === 'context' )
        {
            refObject = props.join(".");
        }

        var str = text.substr( cursor, match.index-cursor );
        if( str ) {
            content.push("'" + str.replace(/\'/g, "\\'") + "'");
        }

        has = true;
        content.push( refObject );
        cursor = match.index + match[0].length;
    }

    if( content.length < 1 )
    {
        return text.replace(/\\\{/g, "{");
    }

    if( has  )
    {
        if( cursor < text.length )
        {
            content.push("'" + text.substr(cursor, text.length).replace(/\'/g, "\\'") + "'");
        }
        content = content.join(" + ").replace(/\\\{/g, "{").replace(/\\\\/g,"&#92;");
        if( parent.isTitleElement ){
            context.initProperties.push("document.title="+content+" as String");
        }else
        {
            setViewportComponent( parent );
            context.initProperties.push(getSkinReferenceId(parent, context) + ".element.addChildAt( Element.createElement( " + content + " ), " + childIndex + ")");
        }
        parent.hasChildTextBinding = true;
    }
    return has;
}

/**
 * 获取皮肤的引用Id
 * @param skinObject
 * @param context
 * @returns {*}
 */
function getSkinReferenceId(skinObject, context)
{
    var gloableElementReference = getGloableElementReference( skinObject, context );
    var thisId = skinObject.id;
    if( gloableElementReference )
    {
        thisId = context.gloableElementList[ skinObject.name ].id;
    }
    return thisId;
}

/**
 * 获取一个元素的属性
 * @param elem
 * @param root
 * @param description
 * @param referenceModule
 */
function parseAttributes(attrs, skinObject, module, context , async )
{
    var isNew = skinObject===module && skinObject.namespace;
    for(var p in attrs)
    {
        var attrName = p;
        var attrValue = attrs[p];

        //指定的状态属性
        if( attrName.indexOf(".")>0 )
        {
            if( !skinObject.id && skinObject !== context )
            {
                skinObject.id = '__var' + uid() + '__';
                skinObject.isPrivate = true;
            }
            if( skinObject['stateProperties_'+ attrName ] === true )
            {
                throw new Error("the state property of '"+attrName+"' already exists.");
            }
            skinObject['stateProperties_' + attrName] = true;

            if( !skinObject.attributeId )
            {
                skinObject.attributeId = "I-D-"+uid(context);
            }
            var viewport ="Element('#" + skinObject.attributeId + "')";
            if( skinObject.isComponent && skinObject.id && skinObject.isPrivate !==true )
            {
                viewport = "this."+skinObject.id+".element";
            }

            context.stateProperties.push({"name":attrName,"value":attrValue, "target":skinObject, "viewport":viewport});
            continue;
        }

        //绑定属性
        if( skinObject.isProperty!==true )
        {
            attrValue = parseBinable(attrValue, attrName, skinObject, context);
        }

        //如果不是id并且有描述则检查
        if( !(skinObject.isSkin && attrName === 'name') && attrValue && ( isNew || skinObject.isProperty===true ) && attrName !=='id' && module.description )
        {
            if( skinObject.isProperty===true )
            {
                //调用函数属性， 合并参数
                // var type = (skinObject.description.paramType || skinObject.description.param)[0] || '';
                //( skinObject.param || (skinObject.param = []) ).push(getAttributeValue(attrValue, type, context));
                continue;

            }else
            {
                var desc = getClassPropertyDesc(attrName, module, context, true );
                if( desc )
                {
                    var type = (desc.paramType || desc.param)[0] || '';

                    //设置定义的状态名
                    if( skinObject.fullclassname === context.stateClass )
                    {
                        if( attrName.toLowerCase()==="name" )
                        {
                            if (context.defineStates[attrValue] && attrName.toLowerCase() === "name") {
                                throw new Error('"' + attrValue + '" state has already been declared');
                            }
                            context.defineStates[attrValue] = true;

                        }else if( attrName.toLowerCase()==="stategroup" )
                        {
                            var stateGroup = attrValue.split(",");
                            for(var s in stateGroup ){
                                context.defineStates[ stateGroup[s] ] = true;
                            }
                        }
                    }

                    attrValue = getAttributeValue(attrValue, type, context);
                    setPropertyMethod(attrName, attrValue, skinObject, context, desc , async );
                    continue;

                }else if( !skinObject.isSkin && !(module.ignorePropertyNotExists === true || module.description.ignorePropertyNotExists ===true) )
                {
                    throw new ReferenceError( 'property "'+attrName + '" is not exists');
                }
            }
        }
        if( attrValue )
        {
            skinObject.attr[attrName] = attrValue;
        }
    }
}

function getViewportId()
{
    return 'Q'+ uid();
}

/**
 * 获取全局元素的引用
 * @param skinObject
 * @param context
 * @returns {*}
 */
function getGloableElementReference(skinObject , context)
{
    switch( skinObject.name )
    {
        case "body":
            return context.isMakeView ? 'this' : 'document.body';
        case "html":
            return 'document.documentElement';
        case "head":
            return 'document.head';
    }
    return null;
}

function isHeadElementChildOf(skinObject, context)
{
    if( !context.isMakeView )return false;
    switch( skinObject.name )
    {
        case "meta":
        case "base":
        case "title":
            return true;
    }
    return false
}


/**
 * 查找视图模块
 * @param context
 */
function findViewModuleByContext( context )
{
    if( context.isMakeView )
    {
        return context;
    }
    context = context.ownerModule;
    while( context && !context.isContextModule )
    {
        context = context.isFragmentModule ? context.ownerFragmentModule.moduleContext : context.ownerModule
    }
    return context && context.isMakeView ? context : null;
}

/**
 * 将皮肤对象标记为一个视口组件
 * @param skinObject
 */
function setViewportComponent( skinObject )
{
    if( skinObject.isProperty ||  skinObject.context === skinObject )
    {
        return false;
    }

    if( !skinObject.id )
    {
        skinObject.id = '__var' + uid() + '__';
        skinObject.isPrivate = true;
    }
    skinObject.isSkin = skinObject.isSkin || !skinObject.isComponent;
    skinObject.isComponent = true;
    return true;
}

/**
 * 解析元素
 * @param elem
 * @param context
 * @param module
 * @param parent
 * @param async
 * @returns {*}
 */
function parseSkin(elem, context, module , parent, async, childIndexAt )
{
    var name = elem.name();
    if( name==null )
    {
        if( parent && parent.name==="Metadata" )
        {
            return Utils.trim( elem.text() );
        }
        context.script.push( Utils.trim( elem.text() ) );
        return null;

    }

    //获取一个皮肤对象
    var skinObject=getSkinObject(name);
    //元素属性
    var attrs = elem.attrs();
    var attrdata = {};
    for(var p in attrs)
    {
        var attrName = attrs[p].name();
        var attrValue = Utils.trim(attrs[p].value());
        var hash = '@id';

        //@表示公开此组件
        if( attrName.toLowerCase()==='id' )
        {
            if( attrValue.charAt(0)==='@' )
            {
                attrValue = attrValue.substr(1);
                skinObject.id = attrValue;
                skinObject.isComponent=true;
                skinObject.isSkin = true;
                module = skinObject;
                hash = true;
            }
            if( !/^[a-zA-Z\$\_]\w+$/.test(attrValue) )
            {
                throw new Error('"'+attrValue+'" is not valid id');
            }
            var refObject = hash === true ? context : module;
            if ( refObject.hash.hasOwnProperty(attrValue) )
            {
                throw new Error('"' + attrValue + '" has already been declared');
            }
            refObject.hash[ attrValue ] = hash;
        }
        if( hash !== true )
        {
            attrdata[attrName] = attrValue;
        }
    }

    //皮肤样式
    if( name.toLowerCase()==='style' )
    {
        var cssStyle="";
        var sourceStyle = context.filepath;
        //如果有指定加载文件
        if( attrdata.file )
        {
             var file = attrdata.file;
             var root = PATH.dirname( context.filepath );
             if( !PATH.isAbsolute( file ) ){
                 file = PATH.resolve( root,  file );
             }
             if( !Utils.isFileExists(file) )
             {
                 throw new ReferenceError("Not found the '"+file+"' in "+context.fullclassname );
             }
             sourceStyle = file;
             cssStyle = Utils.trim( Utils.getContents( file ) );

        }else{
            cssStyle = Utils.trim( elem.text() );
        }

        if( cssStyle )
        {
            if( !attrdata.theme )attrdata.theme = "default";
            context.style.push({content: cssStyle, attr: attrdata, file:sourceStyle });
        }
        return null;
    }
    //文本直接返回
    else if( name.toLowerCase() === 'text' )
    {
        return Utils.trim( elem.text() );
    }
    //备注跳过
    else if( name.toLowerCase()==='comment' )
    {
        return null;
    }

    async = async===true ? true : attrdata.async === 'true';
    async = isClientRunning(async, context.syntax);
    skinObject.async = async;
    //delete attrdata.async;

    //root
    if(module == null)
    {
        skinObject = module = context;
        skinObject.isSkin=true;
        skinObject.isComponent = true;
    }
    //有命名空间，不是属性就是组件
    else if( elem.namespace() )
    {
        var namespace = getNamespace( elem );
        var isSystem = namespace.isSystem;
        namespace = namespace.name;
        var fullname = namespace ? namespace+'.'+name : name;
        var index;

        if( name.toLowerCase()==='script' )
        {
            context.script.push( elem.text() );
            return null;
        }

        skinObject.isMetadata = fullname.toLowerCase() === "es.core.metadata";
        if( isSystem )
        {
            index  = name.indexOf('.');
            if( index > 0 )
            {
                namespace = namespace ? namespace+'.'+name.substr(0, name) : name.substr(0, name);
                name = name.substr(index+1);
                fullname = namespace ? namespace+'.'+name : name;
            }
        }

        skinObject.isSkin = false;
        skinObject.namespace=fullname;
        skinObject.isSystem = isSystem;

        var desc = null;

        //如不不是全局类的引用，则判断是否对一个属性的属性引用
        if (!skinObject.isMetadata && parent.isProperty && parent.description && (parent.description.isAccessor || parent.description.isFunAccessor))
        {
            var refType = parent.description.type;
            if (!(refType === "void" || refType === "*"))
            {
                var typeFullname = getImportClassName(refType, module.description.import) || refType;
                var refTypeModule = makeSkin.getLoaclAndGlobalModuleDescription(typeFullname);
                var testDesc = getClassPropertyDesc(name, {description: refTypeModule}, context);
                if (testDesc)
                {
                    desc = testDesc;
                    skinObject.isChildProperty = true;
                }
            }
        }

        if ( !desc && !skinObject.isMetadata )
        {
            desc = getClassPropertyDesc(name, module, context);
        }

        if( skinObject.isMetadata )
        {

        }
        //组件属性
        else if (desc)
        {
            if( !(parent.isComponent || parent.isProperty) )
            {
                throw new Error("Unable found reference component. the attribute '"+name+"' ");
            }

            skinObject.isProperty = desc.isXMLProperty !== true;
            skinObject.param = [];
            skinObject.description = desc;
            skinObject.initProperties = parent.initProperties;

        } else
        //尝试使用组件
        {
            skinObject.fullclassname = fullname;
            skinObject.classname = fullname;
            skinObject.isComponent = true;
            skinObject.description = makeSkin.loadModuleDescription(context.syntax, fullname, context.config, context.filepath, undefined, true);

            //是否为一个皮肤
            if (getModuleType(context, skinObject.description, [context.baseSkinclass]))
            {
                skinObject.isSkin = true;
                skinObject.isDisplayElement = true;
                if (attrdata.name) {
                    skinObject.name = attrdata.name;
                    delete attrdata.name;
                }
            }
            //是否为一个组件
            else {

                var isDisplayElement = checkInstanceOf(context, skinObject.description, "es.interfaces.IDisplay", true);
                if (isDisplayElement)
                {
                    skinObject.isDisplayElement = true;
                    skinObject.isSkinComponent = checkInstanceOf(context, skinObject.description, "es.components.SkinComponent");
                    skinObject.nonChild = parent.isProperty !== true;
                    skinObject.autoDisplay = (attrdata.auto || "true").toLowerCase() !== "false";

                    //如果没有设置skinClass则使用皮肤元素类型上的皮肤
                    if( skinObject.isSkinComponent && skinObject.description.defineMetaTypeList && skinObject.description.defineMetaTypeList.Skin )
                    {
                        var skinMetatype =  skinObject.description.defineMetaTypeList.Skin;
                        if( typeof attrdata.skinClass === "undefined" )
                        {
                            if( getClassPropertyDesc('skinClass', skinObject, context) )
                            {
                                attrdata.skinClass =  skinMetatype.param.value;
                            }
                        }
                    }

                    if (!parent.id && parent !== context)
                    {
                        setViewportComponent( parent )
                    }

                    if ( !parent.isSkin && parent.isComponent)
                    {
                        throw new Error("Viewport must is skin element of add component. file:" + context.filepath);
                    }
                }
            }
            module = skinObject;
        }
    }else
    {
        skinObject.name = name.toLowerCase();

        //指定需要加载的脚本文件
        if( (skinObject.name==="script" && attrdata.src) || (skinObject.name==="link" && attrdata.href) )
        {
            skinObject.attr = attrdata;
            var vModule = findViewModuleByContext( context );
            //如果是在视图中
            if( vModule )
            {
                vModule.loadResourceFiles.push( skinObject )
            }else
            {
                //不在视图
                if( !context.config.loadResourceFiles )context.config.loadResourceFiles = [];
                context.config.loadResourceFiles.push( skinObject )
            }
            return null;
        }
    }
    skinObject.module = module;
    skinObject.context = context;
    skinObject.parent = parent;
    skinObject.attrdata = attrdata;
    skinObject.childIndex= childIndexAt||0;
    skinObject.isTitleElement = context.isMakeView && skinObject.name==="title" && ( skinObject.parent === context || (skinObject.parent && skinObject.parent.parent === context) );
    if( skinObject.isTitleElement )
    {
        context.hasSetTitle = true;
        skinObject.isGloableElement = true;
    }

    //皮肤和视图中禁用直接写脚本
    if( (skinObject.name==="script") || (skinObject.name==="link") )
    {
        return null;
    }

    var ownerProperty = skinObject.isProperty;
    if( parent ) {
        ownerProperty = parent.isProperty ? parent.isProperty : parent.ownerProperty;
    }
    skinObject.ownerProperty = ownerProperty;

    //每个元素的value属性当作默认的值（如果没有在对称标签中添加内容）。
    //<item value="1"></item> 与 <item>1</item>  是一样的效果。
    skinObject.defualtValue = attrdata.value;

    //如果是一个组件，就必须设置id
    if( skinObject.isComponent ===true )
    {
        if( !skinObject.id && skinObject !== context )
        {
            skinObject.id = '__var' + uid() + '__';
            skinObject.isPrivate = true;
        }
        skinObject.initProperties = [];
    }

    //解析属性
    if( !skinObject.isMetadata )
    {
        parseAttributes(attrdata, skinObject, module, context, async);
    }

    //是否为一个全局元素
    var gloableElementReference = getGloableElementReference( skinObject, context );
    if( gloableElementReference )
    {
        var gloableElement = context.gloableElementList[ skinObject.name ];
        if( gloableElement )
        {
            gloableElement.hasUsed = true;
            skinObject.notNewInstance = true;
            skinObject.classType = "Skin";
            skinObject.elementAdded = true;
            skinObject.isGloableElement = true;
            skinObject.gloableNodeElement = gloableElementReference;

            var eid = gloableElement.id;
            if (skinObject.id && skinObject.isPrivate !== true)
            {
                eid = skinObject.id;
                skinObject.context.declarationReference.push('var ' + (skinObject.id) + ":" + skinObject.classType + " = " + gloableElement.id);
            }

            var attrStr = skinAttrToString(skinObject);
            if (attrStr.length > 0)
            {
                (skinObject.context.initProperties).push(eid + ".element.setProperties({" + attrStr.join(",") + "})");
            }
            var child = getSkinChildToString(skinObject);
            if (child) {
                (skinObject.context.initProperties).push(eid + ".element.addChildAt( Element.createElement('" + child + "')," + skinObject.childIndex + ")");
            }
        }
    }

    //子级
    var nodes = elem.childNodes();
    if( nodes.length > 0 )
    {
        var child;
        var childIndex = 0;
        for (var i in nodes)
        {
            child= parseSkin( nodes[i], context, module , skinObject , async, childIndex );
            //如果是属性稍后会当参数处理
            if( child )
            {
                var textBinding = false;

                //如果不是属性，则需要解析是否为一个绑定器
                if( typeof child === "string" && !skinObject.ownerProperty )
                {
                    textBinding = parseTextBinding(context,skinObject,child, childIndex );
                }

                //不是一个文字绑定器({name})
                if( textBinding !== true )
                {
                    //子级设置为了组件父级就必须得为组件
                    if( child.id && child.isProperty !== true && !skinObject.id )
                    {
                        setViewportComponent( skinObject );
                    }

                    //指定组件异步执行
                    if( child.async ===true && child.isSkinComponent )
                    {
                        if( !skinObject.attributeId )
                        {
                            skinObject.attributeId = "I-D-"+uid(context);
                        }
                        if( skinObject.isComponent && skinObject.id && skinObject.isPrivate !==true )
                        {
                            child.viewport = "this."+skinObject.id+".element";
                        }else
                        {
                            child.viewport = "Element('#" + skinObject.attributeId + "')";
                        }
                    }

                    if( isHeadElementChildOf(child, context ) )
                    {
                        context.gloableElementList.head.children.push( child );
                    }else
                    {
                        skinObject.children.push(child);
                    }
                }
                childIndex++;
            }
        }
    }

    if( skinObject.isMetadata )
    {
        var metastr =  Utils.trim( __toString( skinObject , true) );
        if( metastr.charAt(0)==="[" ){
            metastr = metastr.substr(1);
        }
        if( metastr.charAt( metastr.length-1 )==="]" )
        {
            metastr = metastr.substr(0, metastr.length-1 );
        }
        var metadata = Utils.executeMetaType( metastr );
        if( !metadata )
        {
            throw new Error("Invalid metadata "+metastr );
        }
        var metadataList = context.metadataList ||  (context.metadataList = {});
        metadataList[ metadata.type ] = metadata;
        return null;
    }

    //为组件设置一个私有变量
    if( skinObject.isComponent ===true && skinObject.isProperty !==true )
    {
        if( !skinObject.id && skinObject !== context )
        {
            skinObject.id = '__var'+uid()+'__';
            skinObject.isPrivate=true;
        }

        if( !skinObject.classname && skinObject.isSkin === true )
        {
            skinObject.classname =  context.baseSkinclass;
            skinObject.fullclassname =  context.baseSkinclass;
            skinObject.isDisplayElement = true;
            if( !skinObject.description )
            {
                skinObject.description  = makeSkin.loadModuleDescription(context.syntax,  context.baseSkinclass , context.config, context.filepath,null, false, context );
            }
        }

        if( skinObject !== context )
        {
            context.components.push( skinObject );
        }
    }

    if( (skinObject.isProperty===true || skinObject.isSkin===true) && !skinObject.isBindable && !skinObject.isChildProperty )
    {
        if (skinObject.children.length === 0)
        {
            parseBinable(skinObject.defualtValue, name, skinObject, context);

        }else if( skinObject.children.length === 1 && typeof skinObject.children[0] === "string")
        {
            parseBinable(skinObject.children[0], name, skinObject, context);
        }
    }

    var param;
    if( skinObject.isProperty===true )
    {
        if( !skinObject.isChildProperty && !skinObject.isBindable )
        {
            var propertyDescription = null;
            var refPropertyObject = skinObject;
            var props = [];
            var refTypeModule = module.description;
            while ( refPropertyObject.isProperty && refPropertyObject.children[0] && refPropertyObject.children[0].isProperty )
            {
                if( refPropertyObject.description && refPropertyObject.description.isAccessor)
                {
                    propertyDescription = getClassPropertyDesc( refPropertyObject.name, {description:refTypeModule}, context);
                    if (!propertyDescription)
                    {
                        throw new ReferenceError(refPropertyObject.name + ' is not accessor');
                    }
                    props.push( refPropertyObject.name );
                    refPropertyObject.description = propertyDescription;
                    var refType = propertyDescription.type;
                    var fullname = getImportClassName(refType, module.description.import ) || refType;
                    refTypeModule = makeSkin.getLoaclAndGlobalModuleDescription(fullname );
                }
                refPropertyObject = refPropertyObject.children[0];
            }

            if( refPropertyObject && refPropertyObject.description.isAccessor)
            {
                propertyDescription = getClassPropertyDesc(refPropertyObject.name, {description:refTypeModule}, context,  true);
                if (!propertyDescription) {
                    throw new ReferenceError(refPropertyObject.name + ' is not setter');
                }
                refPropertyObject.description = propertyDescription;
            }

            props.push( refPropertyObject.name );
            var type = (refPropertyObject.description.paramType || refPropertyObject.description.param)[0];
            if (type)
            {
                var _param = getValueByType(refPropertyObject, type, context);
                if( _param ) {
                    param = [].concat(refPropertyObject.param, _param);
                }
                if( param )
                {
                    setPropertyMethod(props.join("."), param, refPropertyObject, context, null, async);
                }
            }
        }

    }else if( skinObject.isComponent==true && skinObject !== context  )
    {
        if( skinObject.description && skinObject.isSkin !==true )
        {
            //把所有子级内容转换成数据
            if( skinObject.children.length > 0  )
            {
                var _descType = skinObject.description.type;
                if( skinObject !== module )
                {
                    param = getValueByType(skinObject, _descType, context);

                }else if( _descType==="Object" || _descType==="Array" )
                {
                    param = getValueByType(skinObject, _descType, context);
                }
            }

        }else
        {
            param = makeSkinParam( skinObject );
        }

        if( param )
        {
            skinObject.param = param;
        }

    }else if( skinObject.namespace && module.isSkin )
    {
        switch( skinObject.name )
        {
            case 'attr' :
                parent.appendAttr = __toString(skinObject, true, undefined, " ");
                return null;
                break;
        }
    }

    //皮肤设置属性
    if( skinObject.appendAttr )
    {
        //只有一个皮肤对象才可以追加皮肤属性
        if( skinObject.namespace && !skinObject.module.isSkin )
        {
            parent.appendAttr = skinObject.appendAttr;
            delete skinObject.appendAttr;
        }
    }
    return skinObject;
}

/**
 * 设置初始化组件的属性
 * @param name
 * @param value
 * @param skinObject
 * @param context
 */
function setPropertyMethod( name, value, skinObject, context , desc , async )
{
    desc = desc || skinObject.description;
    if( desc )
    {
        var isset = !!(desc.value && desc.value.set ) || desc.isFunAccessor;
        //自定义类必须要有setter
        if( !isset && skinObject.module.description.nonglobal===true )
        {
            throw new ReferenceError(name+' is not setter');
        }

        var id = skinObject.module.id;
        if( skinObject.module === context  )
        {
            id = 'this';
        }

        var ref = skinObject.initProperties;
        if (isset && !desc.isFunAccessor )
        {
            if( name==="skinClass"){
                ref.unshift(id + '.' + name + '=' + value);
            }else {
                ref.push(id + '.' + name + '=' + value);
            }

        } else
        {
            if( value instanceof Array )
            {
                ref.push(id + '.' + name + '(' + value.join(',') + ')');
            }else{
                ref.push(id + '.' + name + '(' + value + ')');
            }
        }
    }
}

/**
 * 根据当前指定的类型获取数据
 * @param skinObject
 * @param type
 * @returns {*}
 */
function getValueByType( skinObject, type, context )
{
    var value;
    switch ( type.toLowerCase() )
    {
        case 'boolean':
            value = Utils.trim( __toString( skinObject, true ) );
            value=( value && value !=='false' ? 'true' : 'false' );
            skinObject.notNewInstance = true;
            break;
        case 'number':
        case 'int':
        case 'uint':
        case 'Integer':
        case 'double':
            value=parseFloat( Utils.trim( __toString(skinObject, true ) ) ) ;
            skinObject.notNewInstance = true;
            break;
        case 'array' :
            value=__toItem(skinObject, true);
            skinObject.notNewInstance = true;
            break;
        case 'object' :
            value=__toItem(skinObject);
            skinObject.notNewInstance = true;
            break;
        case 'string':
            value =__toString(skinObject,true);
            if( value.charAt(0) ==='@' ){
                value = value.substr(1);
            }else {
                value = "'" + value+ "'";
            }
            skinObject.notNewInstance = true;
            break;
        case 'class':
            value =__toString(skinObject,true);
            if( value.charAt(0) ==='@' )value = value.substr(1);
            skinObject.notNewInstance = true;
            makeSkin.loadSkinModuleDescription(context.syntax ,value, context.config, context );
            break;
        default :
            if( skinObject.children.length === 1 && skinObject.children[0].description )
            {
                if( skinObject.children[0].id ){
                    value =  skinObject.children[0].id ;
                }else {
                    value = getValueByType(skinObject.children[0], skinObject.children[0].description.type, context);
                }

            }else {
                value = __toString(skinObject, true);
                skinObject.notNewInstance = true;
            }
            if( typeof value === "string" && value.charAt(0) ==='@' )
            {
                value = value.substr(1);
            }
    }
    return value;
}

/**
 * 生成一个模块对象
 * @param inherit
 * @param fullclassname
 * @param filepath
 * @returns {{}}
 */
function createModulObject(inherit, fullclassname , filepath )
{
    var skinModule={};
    var index = fullclassname.lastIndexOf('.');
    skinModule.fullclassname = fullclassname;
    skinModule.extends = inherit;
    skinModule.classname = fullclassname.substr(index+1);
    skinModule.package = fullclassname.substr(0,index);
    skinModule.filepath = filepath;
    return skinModule;
}

/**
 * 获取指定元素名的元素对象
 * @param name
 * @param viewObject
 * @returns {*}
 */
function getElementByName(name, viewObject)
{
    if( viewObject.name === name )return viewObject;
    if( !viewObject.children )return null;
    var children = viewObject.children;
    var len = children.length;
    var index = 0;
    for(;index<len;index++)
    {
        if( getElementByName(name, children[ index ] ) )
        {
            return children[ index ];
        }
    }
    return null;
}

/**
 * 生成一个客户端的视图页面
 * @param viewObject
 * @param context
 */
function createClientApplicationView(viewObject, context, bootstrap)
{
    var view ="<!DOCTYPE html>\r\n"+getClientViewHeadAndBodyElement(viewObject, context, bootstrap);
    return view;
}

/**
 * 加载资源文件
 * @param context
 * @param view_path
 * @param css_build_path
 * @param js_build_path
 * @returns {Array}
 */
function loadResourceFiles(context, view_path, css_build_path, js_build_path)
{
    var children=[];
    var loaded = {};
    //需要加载的资源文件
    context.loadResourceFiles.forEach(function (file){
        var src = Utils.trim(file.attr.src || file.attr.href);
        if( loaded[src] ===true )return;
        loaded[src] =true;
        var basepath = file.name ==="link" ? css_build_path : js_build_path;
        var isRemote = /^https?:\/\//.test( src );
        if( !isRemote )
        {
            if( src.charAt(0) ==="@" )
            {
                src = src.substr(1);

            }else
            {
                if( !Utils.isFileExists(src) )
                {
                    src = PATH.resolve( context.config.project_path, src );
                    if( !Utils.isFileExists(src) )
                    {
                        throw new ReferenceError("Not found '"+src+"'." );
                    }
                }
                var copyTo = PATH.resolve(basepath , PATH.relative(context.config.project_path,src) );
                Utils.mkdir( PATH.dirname( copyTo ) );
                Utils.copyfile( src, copyTo );
                src = PATH.relative( view_path, copyTo ).replace(/\\/g,"/");
            }
        }

        var obj = getSkinObject( file.name );
        if( file.name ==="link" ){
            obj.attr={"rel":"stylesheet","href":src};
        }else{
            obj.attr={"type":"text/javascript","src":src};
        }
        children.push( obj );
    });
    return children;
}


/**
 * 设置视图默认需要的标签元素
 * @param viewObject
 * @param context
 */
function getServerViewHeadAndBodyElement(viewObject , context, bootstrap )
{
    var content = [];
    var version ='?v='+((new Date()).getTime());
    var head = getSkinObject("head");
    var meta = getSkinObject("meta", {
        "charset":"UTF-8",
        "http-equiv":"X-UA-Compatible",
        "content":"IE=edge",
    });

    if( viewObject.attr.charset )
    {
        meta.attr["charset"] = viewObject.attr.charset;
    }

    if( viewObject.attr.httpEquiv || viewObject.attr.httpequiv )
    {
        meta.attr["http-equiv"] = viewObject.attr.httpEquiv||viewObject.attr.httpequiv;
    }
    if( viewObject.attr.content )
    {
        meta.attr["content"] = viewObject.attr.content;
    }

    var package_path = context.package.replace(/\./g,"/");
    var filename =  viewObject.fullclassname;
    var script = getSkinObject("script");
    var link = getSkinObject("link");
    var view_path = Utils.getBuildPath(context.config, 'build.view')+"/"+package_path;

    var js_build_path = Utils.getBuildPath(context.config, 'build.js');
    var js_path = PATH.relative( view_path, PATH.resolve( js_build_path,filename + '.js') ).replace(/\\/g,"/");

    var css_build_path = Utils.getBuildPath(context.config, 'build.css');
    var css_path = PATH.relative( view_path, PATH.resolve( css_build_path,filename + '.css') ).replace(/\\/g,"/");

    //视图需要引用的资源
    script.attr={"type":"text/javascript","src":js_path+version };
    link.attr={"rel":"stylesheet","href":css_path+version};
    head.children=[meta,link,script].concat( loadResourceFiles(context, view_path, css_build_path, js_build_path) );

    var headObj = context.gloableElementList.head;
    var titleSkin = getElementByName("title", headObj );
    if( titleSkin )
    {
        if( !titleSkin.hasChildTextBinding )
        {
            content.push("document.title='" + __toString(titleSkin, true, headObj, "", context.syntax) + "';\n");
        }
        var index = headObj.children.indexOf(titleSkin);
        headObj.children.splice(index, 1);

    }else if( !context.hasSetTitle )
    {
        content.push( "document.title='"+(viewObject.attr.title || context.classname)+"';\n" );
    }

    var metaSkin = headObj.children.filter(function (item) {
        return typeof item.attr.name === "undefined";
    })[0];

    if( metaSkin )
    {
        if( metaSkin.attr.charset )
        {
            meta.attr.charset = metaSkin.attr.charset;
            delete metaSkin.attr.charset;
        }
        if( metaSkin.attr['http-equiv'] )
        {
            meta.attr['http-equiv'] = metaSkin.attr['http-equiv'];
            delete metaSkin.attr['http-equiv'];
        }
        if( metaSkin.attr.content )
        {
            meta.attr.content = metaSkin.attr.content;
            delete metaSkin.attr.content;
        }
        if( Utils.isEmpty(metaSkin.attr) )
        {
             var index = headObj.children.indexOf( metaSkin );
             headObj.children.splice(index,1);
        }
    }

    head.children.splice.apply( head.children , [1,0].concat( headObj.children ) );

    for( var c in head.children )
    {
        headObj.hasUsed = true;
        var child =  head.children[c];
        var attr = skinAttrToString( child, "=" , true ).join(" ");
        switch ( child.name ){
            case "meta" :
                child = "<meta "+attr+" />";
                break;
            case "link" :
                child = "<link "+attr+" />";
                break;
            case "script" :
                child = "<script "+attr+"></script>";
                break;
            default :
                child = "<"+child.name+" "+attr+" />";
        }
        content.push( headObj.id+".element.addChild( Element.createElement('"+(child)+"'))");
    }
    return content.join(";\n")+";\n";
}

/**
 * 设置视图默认需要的标签元素
 * @param viewObject
 * @param context
 */
function getClientViewHeadAndBodyElement(viewObject , context, bootstrap)
{
    var content = [];
    var version ='?v='+((new Date()).getTime());
    var head = getSkinObject("head");
    var html = getSkinObject("html");
    var body = getSkinObject("body");
    var meta = getSkinObject("meta", {
        "charset":"UTF-8",
        "http-equiv":"X-UA-Compatible",
        "content":"IE=edge",
    });

    if( viewObject.attr.charset )
    {
        meta.attr["charset"] = viewObject.attr.charset;
    }

    if( viewObject.attr.httpEquiv || viewObject.attr.httpequiv )
    {
        meta.attr["http-equiv"] = viewObject.attr.httpEquiv||viewObject.attr.httpequiv;
    }
    if( viewObject.attr.content )
    {
        meta.attr["content"] = viewObject.attr.content;
    }

    var package_path = context.package.replace(/\./g,"/");
    var filename = viewObject.ownerModule ? viewObject.ownerModule.classname : viewObject.classname;
    var script = getSkinObject("script");
    var link = getSkinObject("link");
    var title = getSkinObject("title");
    var view_path = Utils.getBuildPath(context.config, 'build.view')+"/"+package_path;

    var js_build_path = Utils.getBuildPath(context.config, 'build.js');
    var js_path = PATH.relative( view_path, PATH.resolve( js_build_path,filename + '.js') ).replace(/\\/g,"/");

    var css_build_path = Utils.getBuildPath(context.config, 'build.css');
    var css_path = PATH.relative( view_path, PATH.resolve( css_build_path,filename + '.css') ).replace(/\\/g,"/");

    //视图需要引用的资源
    script.attr={"type":"text/javascript","src":js_path+version };
    link.attr={"rel":"stylesheet","href":css_path+version};
    head.children=[meta,title,link,script].concat( loadResourceFiles(context, view_path, css_build_path, js_build_path) );

    var headObj = context.gloableElementList.head;
    var titleSkin = getElementByName("title", headObj );
    if( titleSkin )
    {
        if( !titleSkin.hasChildTextBinding )
        {
            content.push("document.title='" + __toString(titleSkin, true, headObj, "", context.syntax) + "';\n");
            head.children.splice(1,1,titleSkin);
        }
        var index = headObj.children.indexOf(titleSkin);
        headObj.children.splice(index, 1);

    }else if( !context.hasSetTitle )
    {
        title.children.push(viewObject.attr.title || context.classname);
    }

    var metaSkin = headObj.children.filter(function (item) {
        return typeof item.attr.name === "undefined";
    })[0];

    if( metaSkin )
    {
        if( metaSkin.attr.charset )
        {
            meta.attr.charset = metaSkin.attr.charset;
            delete metaSkin.attr.charset;
        }
        if( metaSkin.attr['http-equiv'] )
        {
            meta.attr['http-equiv'] = metaSkin.attr['http-equiv'];
            delete metaSkin.attr['http-equiv'];
        }
        if( metaSkin.attr.content )
        {
            meta.attr.content = metaSkin.attr.content;
            delete metaSkin.attr.content;
        }
        if( Utils.isEmpty(metaSkin.attr) )
        {
             var index = headObj.children.indexOf( metaSkin );
             headObj.children.splice(index,1);
        }
    }

    head.children.splice.apply( head.children , [1,0].concat( headObj.children ) );
    html.children.push( head );
    html.children.push( body );
    html.context = context;
    return __toString(html);
}

/**
 * 获取类名称，不包括命名空间
 * @param name
 * @returns {*|{type, id, param}|string}
 */
function getClassName(name)
{
    return name.substr( name.lastIndexOf(".")+1 );
}

/**
 * 判断是否要在客户端运行代码
 * @param async
 * @param syntax
 * @returns {*|boolean}
 */
function isClientRunning(async,syntax)
{
    return async && syntax !== "javascript";
}

function getServerComponentProperties(classModule, isMakeView, isClientSupport, component, imports, loaded, body, property, newInstances,declaration, invokeContents , clientInitComponents, synchSkinProperties )
{
    var value=component.fullclassname || component.classname;
    var param = component.param || '';

    // if is Skin goto load Skin class
    if (component.isSkin && imports.indexOf(classModule.baseSkinclass) < 0)
    {
        imports.push(classModule.baseSkinclass);
    }

    //需要加载的组件
    if (value && classModule.fullclassname !== value && imports.indexOf(value) < 0 && classModule.baseSkinclass !== value)
    {
        imports.push(value);
        var n = getClassName(value);
        if (loaded[n])n = value;
        loaded[value] = n;
    }

    //优先使用类名
    value = loaded[value] || value;
    var _type = ':' + (component.classType ? component.classType : value);

    //不需要实例化的组件
    if (component.notNewInstance)
    {
        if ( component.attributeId && !component.isGloableElement )
        {
            param = "Element('#" + component.attributeId + "')";
            _type = ':Element';
        }
        if (param)
        {
            declaration[0].push( 'var ' + component.id +_type+';\n' );
            declaration[1].push( component.id + '=' + param + ";\n" );
            newInstances.push('var ' + component.id +_type+'=' + param + ";\n");
        }

    } else
    {
        if( component.isSkinComponent )
        {
            var componentId = isMakeView ? '"'+Utils.uid()+'"' : "hostComponent.getComponentId('"+Utils.uid()+"')";
            var newClass = 'var '+ component.id +':'+value+'= new ' + value + '('+componentId+');\n';

            declaration[0].push( 'var ' + component.id +':'+value+';\n' );
            declaration[1].push( component.id+'= new '+value+'('+componentId+');\n');

            //异步执行的组件
            if( component.async )
            {
                clientInitComponents.push(newClass);
                if (component.initProperties && component.initProperties.length > 0)
                {
                    clientInitComponents.push( component.initProperties.join(";\n") + ";\n" );
                }

                if( component.viewport )
                {
                    clientInitComponents.push(component.viewport + ".addChildAt( " + component.id + ".display() , " + component.childIndex + ");\n");

                } else
                {
                    var viewport = getSkinReferenceId(component.parent, classModule ) || "this";
                    clientInitComponents.push( viewport + ".addChildAt( " + component.id + "," + component.childIndex + ");\n");
                }

                //clientInitComponents.push(component.id + ".skinClass="+component.attrdata.skinClass+";\n");
                //clientInitComponents.push(component.id + ".display();\n");
                if ( component.isPrivate !== true )
                {
                    clientInitComponents.push('this.' + component.id + '=' + component.id + ";\n");
                }

            }else
            {
                newInstances.push( newClass );

                //需要客户端支持的组件
                if ( isClientSupport )
                {
                    synchSkinProperties[ component.id ] = {value:componentId,type:value,isSkin:false,skinClass:component.attrdata.skinClass};
                }
            }

        }else
        {
            newInstances.push( 'var '+ component.id +':'+value+'= new ' + value + '(' + param + ');\n');
            declaration[0].push( 'var ' + component.id +':'+value+';\n' );
            declaration[1].push( component.id+'= new '+value+'('+param+');\n');
        }
    }

    if( !component.async )
    {
        //组件属性
        if (component.initProperties && component.initProperties.length > 0)
        {
            body.push(component.initProperties.join(";\n") + ";\n");
        }

        //组件初始化属性，视图需要单独去生成所以在这里不添加。
        if (component.isDisplayElement && !component.elementAdded )
        {
            if (component.viewport)
            {
                invokeContents.push(component.viewport + ".addChildAt( " + component.id + ".display() , " + component.childIndex + ");\n");

            } else
            {
                var parentContainer = getSkinReferenceId(component.parent, classModule) || "this";
                body.push(parentContainer + ".addChildAt( " + component.id + "," + component.childIndex + ");\n");
            }
        }

        //只要是皮肤对象都同步到客户端, 视图中的除外
        if ( component.isSkin && !component.isSkinComponent  && (!component.notNewInstance || param) && isClientSupport )
        {
            synchSkinProperties[component.id] = {
                value: component.id + ".generateId()",
                type: classModule.baseSkinclass,
                isSkin: true
            };
        }
    }

    //如果是公开的属性则加入到类成员中
    if( component.isPrivate !== true )
    {
        //property.push('[Remove(origin,expect=false)]\n');
        //如指定为异步运行则标记当前成员为客户端属性
        //异步运行的组件不能设置到类成员属性中, 原因是因为异步组件从服务端抽离出来单独运行的组件。
        if( component.async )
        {
            property.push("[RunPlatform('client')]\n");

        }else
        {
            //如指定此组件指定为服务端运行则标记为服务端属性
            if( !isClientSupport )
            {
                property.push("[RunPlatform('server')]\n");
            }
        }
        property.push('public var ' + component.id + _type + ';\n');
    }
}

/**
 * 获取组件需要注入的属性值
 * @param component
 * @returns {Array}
 */
function getComponentInjectionProperties( component )
{
    var desc = component.description;
    var injections = [];
    do {
        Utils.forEach(desc.proto,function (value,name) {
            if(value.defineMetaTypeList && value.defineMetaTypeList.Injection)
            {
                var type = value.defineMetaTypeList.Injection.param.value;
                if( type ) {
                    type =  makeSkin.getLoaclAndGlobalModuleDescription( getImportClassName(type, desc.import)||type );
                    if( type.nonglobal !==true ){
                        type = null;
                    }
                }
                injections.push({
                    "scope":desc.fullclassname,
                    "target":component.id,
                    "proto":true,
                    "type": type ? type.fullclassname : "",
                    "name":name,
                    "id":value.id,
                    "isAccessor":!!value.isAccessor
                });
            }
        });
        Utils.forEach(desc.static,function (value,name) {
            if( value.defineMetaTypeList && value.defineMetaTypeList.Injection )
            {
                var type = value.defineMetaTypeList.Injection.param.value;
                if( type ) {
                    type =  makeSkin.getLoaclAndGlobalModuleDescription( getImportClassName(type, desc.import)||type );
                    if( type.nonglobal !==true ){
                        type = null;
                    }
                }
                injections.push({
                    "scope":desc.fullclassname,
                    "target":desc.classname,
                    "proto":false,
                    "type": type ? type.fullclassname : "",
                    "name":name,
                    "id":value.id,
                    "isAccessor":!!value.isAccessor
                });
            }
        });

    }while( desc.inherit && ( desc = makeSkin.getLoaclAndGlobalModuleDescription( getImportClassName(desc.inherit, desc.import ) ) ) && desc.nonglobal === true );
    return injections;
}

/**
 * 生成客户端需要的皮肤工厂函数
 * @param classModule
 * @param handle
 * @param originSyntax
 * @returns {{content: string, requirements: Array, param: Array}}
 */
function makeClientSkinFactory(classModule, handle , originSyntax )
{
    var eventType = "SkinEvent.MAKE_CLIENT_SKIN_FACTORY";
    var serverCode=[];
    var clientModule={
        "proto":[],
        "import":[classModule.baseSkinclass],
        "construct":[],
        "classname":classModule.classname+"FactoryTemp"
    };

    //嵌套的组件
    Utils.forEach(classModule.components, function ( component )
    {
        if( component.async )return;
        if ( component.isSkinComponent )
        {
            var isClientSupport = makeSkin.Compile.isClientSupportOf( component.description, originSyntax, true );

            //不需要客户端支持的跳过
            if( !isClientSupport )return;

            var classType = component.fullclassname || component.classname;
            var skinClass = component.attrdata.skinClass;

            if(clientModule.import.indexOf(classType) < 0 ){
                clientModule.import.push(classType );
            }
            if(clientModule.import.indexOf(skinClass) < 0 ){
                clientModule.import.push(skinClass);
            }

            var event = getUniqueVar(classModule);
            serverCode.push("var " + event + ":es.events.SkinEvent=new es.events.SkinEvent("+eventType+");\n");
            serverCode.push(component.id + ".skin.dispatchEvent(" + event + ");\n");
            clientModule.construct.push("var "+component.id+":"+classType+"= new "+classType+"();");

            //需要注入的组件属性
            var injectionProperties = getComponentInjectionProperties( component );
            Utils.forEach( injectionProperties , function (item) {
                var injection = getUniqueVar(classModule);
                var propName = getUniqueVar(classModule);
                serverCode.push("var " + injection + ":String ="+ component.id+".valueToString("+component.id+"."+item.name+");\n");
                clientModule.construct.push("var "+propName+":*" + "="+"Generic(\"{Data{" + injection + "}}\");");
                clientModule.construct.push("if("+propName+"){\n");
                if( item.type )
                {
                    clientModule.construct.push(item.target + "." + item.name + "=new " + item.type + "(Generic("+propName+"));");
                    if(clientModule.import.indexOf( item.type ) < 0 )
                    {
                        clientModule.import.push( item.type );
                    }

                }else
                {
                    clientModule.construct.push( item.target+"."+item.name+"=Generic("+propName+");");
                }
                clientModule.construct.push("\n}\n");

            });

            clientModule.construct.push( component.id+'.skin=new '+skinClass+'('+component.id+', Generic("{Data{'+event+'.content}}"));' );
            if (component.isPrivate !== true)
            {
                clientModule.proto.push("public var "+component.id+":"+classType+";" );
                clientModule.construct.push("this."+component.id+"="+component.id+";" );
            }
            clientModule.construct.push("this.addChildAt("+component.id+","+component.childIndex+");");

        } else if (component.isPrivate !== true)
        {
            clientModule.proto.push("public var "+component.id+":Skin;" );
            clientModule.construct.push('this.'+component.id+'=new Skin("#{Skin{' + component.id + '.generateId()}}");');
        }

    });

    var self = "this";
    if( !classModule.isMakeView )
    {
        self = getUniqueVar(classModule);
        clientModule.construct.unshift('super("#{Skin{' + self + '.generateId()}}");');
    }

    var clientCode=[
        "import "+clientModule.import.join(";\nimport ")+";\n",
        "public class ",
        clientModule.classname,
        " extends Skin{\n",
        clientModule.proto.join("\n"),
        "public function ",
        clientModule.classname,
        "(){\n",
        clientModule.construct.join("\n"),
        "\n}",
        "\n}",
    ]

    var SkinFactoryTemp = makeSkin.loadFragmentModuleDescription( "javascript", {
        filepath:classModule.filepath,
        fullclassname:clientModule.classname,
        script:clientCode.join("")
    }, classModule.config, true);

    var classStack = SkinFactoryTemp.content()[0];
    var description = SkinFactoryTemp.description;
    classStack.addListener("(defineProperty)",function (e) {
        e.stopPropagation=true;
    });
    classStack.addListener("(superBefore)",function (e) {
        e.stopPropagation=true;
    });
    makeSkin.Compile("javascript", classStack, description, classModule.config , true );

    var keys = [];
    var requirements=[];
    Utils.forEach(description.import ,function (val, key) {
        if( !makeSkin.globalDescriptions.hasOwnProperty( val ) )
        {
            keys.push(key.replace(/\./g, '_'));
            requirements.push(val);
        }
    });

    if( classModule.isMakeView )
    {
        keys.unshift( "System" );
        requirements.unshift("System");
    }

    var content = description.constructor.value.replace(/^function\s+constructor\(.*?\)\s*\{/,"function("+keys.join(",")+"){");
    content = content.replace(/[\t]+/g,'');
    content = content.replace(/\{Skin\{(.*?)\}\}/g,"'+$1+'");
    content = content.replace(/\"\{Data\{(.*?)\}\}\"/g,"'+$1+'");

    var isTestMode = classModule.config.mode != 3;
    if( isTestMode )
    {
        content = content.replace(/[\n]+/g, "\\n");
    }else {
        content = content.replace(/[\n]+/g, "");
    }

    //如果是一个视图则把皮肤工厂函数输出到客户端
    if( classModule.isMakeView )
    {
        var id = getUniqueVar(classModule);
        var wrap = "var "+id+":Node = new HTMLElement('script');\n";
        wrap+=serverCode.join("");
        wrap += id+".content='window[\""+handle+"\"]="+content+"';\n";
        if( isTestMode ) {
            wrap += id + ".content=" + id + ".content.replace(/\\n/,\"\\n\");\n";
        }
        wrap += "document.head.addChild( "+id+" );\n";
        return {content:wrap,requirements:requirements,param:keys};
    }

    //如果是一个普通皮肤则通过事件传递皮肤工厂函数
    var type = classModule.fullclassname || classModule.classname;
    var wrap = 'var '+self+":"+type+"=this as "+type+";\n";
    wrap+=serverCode.join("");
    wrap+="this.addEventListener("+eventType+",function(event:SkinEvent){\n event.content='"+content+"';\n});\n";
    return {content:wrap,requirements:requirements,param:keys};
}

/**
 * 生成一个模块脚本
 * @param classModule
 * @returns {string}
 */
function makeServerScript( classModule , skinObject , isMakeView )
{
    var imports = classModule.imports;
    var body=[];
    var inherit = classModule.extends || '';
    var content = ['package ', classModule.package ,'{\n'];
    //类成员属性
    var property=[];
    //类成员map
    var attach =  getHash( classModule );
    //类成员组件
    var components = classModule.components;
    //已加载的类
    var loaded={};
    //继承组件
    if( inherit ){
        loaded[inherit]=classModule.namespace;
    }
    //获取脚本内容
    var scriptContent = getScriptContent(  imports, loaded, classModule  );
    //当前子级内容创建后调用的内容
    var invokeContents = [];
    //实例化组件
    var newInstances = [];
    //运行在客户端的脚本
    var clientInitComponents = [];
    //指定的编译语法
    var originSyntax = classModule.config.originMakeSyntax;
    //应用基类的路径
    var applicationClass = "es.core.Application";
    //用户构造函数的参数名
    var paramName = isMakeView ? "context" : "hostComponent";
    //同步皮肤属性
    var synchSkinProperties={};
    synchSkinProperties[ classModule.classname ]={value:"this.generateId()",type:classModule.baseSkinClass,isSkin:true}
    //设置公开的属性值
    var publicProperties = [];
    //需要声明的变量
    var declaration = [
        [], /*声明的变量*/
        []  /*声明赋值*/
    ];

    //嵌套的组件
    Utils.forEach(components, function ( component )
    {
        //不需要客户端支持
        var isClientSupport = makeSkin.Compile.isClientSupportOf( component.description, classModule.config.originMakeSyntax , true );
        if( component.isPrivate !== true && component.async !==true )
        {
            publicProperties.push('this.' + component.id + '=' + component.id + ";\n");
        }
        getServerComponentProperties(classModule, isMakeView , isClientSupport, component, imports, loaded, body, property, newInstances, declaration, invokeContents , clientInitComponents, synchSkinProperties);
    });

    //生成一个服务端推送到前端的皮肤工厂函数的key
   var clientViewInitializationHandle = null;
   if( classModule.isMakeView )
   {
       clientViewInitializationHandle = Utils.MD5( classModule.fullclassname+(new Date()).getTime() );
       classModule.interactionHandleKey = clientViewInitializationHandle;
   }

    //皮对象上的html元素
    classModule.initProperties = classModule.initProperties.concat( getSkinChildHtml(classModule) );

    //初始化当前皮肤对象上的属性
    if( classModule.initProperties.length > 0 )
    {
        body.push( classModule.initProperties.join(";\n")+';\n' );
    }

    //声明的引用(body,html,head 这些全局元素)
    var declarationReference = [];

    //导入SkinEvent类
    var skinEvent = "es.events.SkinEvent";
    if( imports.indexOf( skinEvent )<0 )
    {
        imports.push( skinEvent );
    }

    //导入Application类
    if( imports.indexOf(applicationClass)<0 )
    {
        imports.push( applicationClass );
    }

    //Interaction
    var interactionClass = "es.core.Interaction";
    if( imports.indexOf( interactionClass )<0 )
    {
        imports.push( interactionClass );
    }

    //有指定宿主组件
    var hostComponent = null;
    var hostComponentModule = null;
    if( skinObject.metadataList && skinObject.metadataList.HostComponent )
    {
        hostComponent = skinObject.metadataList.HostComponent.param.value;
        if( imports.indexOf(hostComponent)<0 )imports.push( hostComponent );
        hostComponentModule = makeSkin.getLoaclAndGlobalModuleDescription( hostComponent );
        property.push("private var _hostComponent:"+hostComponent+";\n")
        property.push( "protected function get hostComponent():"+hostComponent+"{\nreturn this._hostComponent;\n}\n");
    }

    if( hostComponentModule === null )
    {
        throw new TypeError("Host Component is not define.");
    }

    //对全局皮肤的声明引用
    var globalElementReference = [];
    if( isMakeView===true )
    {
        var headContent = getServerViewHeadAndBodyElement(skinObject, classModule, hostComponentModule );
        Utils.forEach(classModule.gloableElementList,function (item) {
            if( item.hasUsed ===true ) {
                if( item.notNewInstance ){
                    declarationReference.push('var ' + item.id + ':' + item.classType + '='+item.gloableNodeElement+';\n');
                }else {
                    declarationReference.push('var ' + item.id + ':' + item.classType + '=new ' + item.classType + '(' + item.gloableNodeElement + ');\n');
                }
            }
        });
        globalElementReference = declarationReference.slice(0);
        declarationReference.push( headContent );
    }

    //对全局元素的声明引用
    if( classModule.declarationReference.length >0 )
    {
        declarationReference.push( classModule.declarationReference.join(";\n")+";\n" );
        globalElementReference.push( classModule.declarationReference.join(";\n")+";\n" );
    }

    //判断运行环境
    var runPlatform = makeSkin.Compile.isConformRunPlatform( hostComponentModule,  originSyntax );
    var isClientSupport = makeSkin.Compile.isClientSupportOf( hostComponentModule, originSyntax , true);

    //导入所需要的类
    if( imports.length > 0 )
    {
        content.push( 'import '+imports.join(';\nimport ') +';\n' );
    }

    if( !runPlatform )
    {
        content.push( "[RunPlatform("+( originSyntax === "javascript" ? "server" : "client")+")]\n" );
    }

    content.push( ' public class ');
    content.push( classModule.classname );
    if( inherit )
    {
        content.push(' extends ');
        content.push( inherit );
    }

    //在创建子级皮肤时执行
    if( invokeContents.length > 0 )
    {
        invokeContents='this.addEventListener("INTERNAL_BEFORE_CHILDREN" ,function(){\n' + invokeContents.join("") + '});\n';
    }else{
        invokeContents="";
    }

    //绑定状态属性
    var stateContent = getStateProperties( classModule );
    if( stateContent )
    {
        stateContent= 'this.addEventListener( SkinEvent.INTERNAL_UPDATE_STATE ,function(event:SkinEvent){\r\n' +
            'var state:State = event.state;\r\n'+stateContent+'});\n';
    }

    //元素属性绑定
    var bindableContent = getBinddingContent( classModule );
    if( bindableContent )
    {
        bindableContent='System.getGlobalEvent().addEventListener( Event.INITIALIZE_COMPLETED ,function(){\n' + bindableContent + '},false,-500,this);\n';
    }

    content.push('{\n');
    content.push(property.join(""));

    //调用超类时需要的参数
    var superParam = paramName;
    var ownerType = applicationClass;

    //将皮肤推送到视图
    var serverPushSkinProperties = [];
    var clientPullHander = getUniqueVar(classModule);
    var interaction_uid = Utils.uid();
    var clientPullContent = 'var '+clientPullHander+':Object=Interaction.pull(hostComponent.getComponentId("'+interaction_uid+'"));\n';
    var clientPullSkinProperties = [
        [], /*不声明只赋值*/
        []  /*声明并且赋值*/
    ];
    Utils.forEach( synchSkinProperties , function (item,name) {
        if( item.isSkin )
        {
            serverPushSkinProperties.push( '"'+name+'":'+item.value );
            if( !item.notNewInstance )
            {
                if (name === classModule.classname) {
                    if (!isMakeView) {
                        clientPullSkinProperties[0].push('super("#"+' + clientPullHander + '.' + name + ')');
                        clientPullSkinProperties[1].push('super("#"+' + clientPullHander + '.' + name + ')');
                    }
                } else {
                    clientPullSkinProperties[0].push(name + ' = new ' + item.type + '("#"+' + clientPullHander + '.' + name + ')');
                    clientPullSkinProperties[1].push('var ' + name + ':' + item.type + ' = new ' + item.type + '("#"+' + clientPullHander + '.' + name + ')');
                }
            }
        }else if( !item.notNewInstance )
        {
            clientPullSkinProperties[0].push( name+' = new '+ item.type+'('+item.value+')');
            clientPullSkinProperties[0].push( name+'.skinClass = '+ item.skinClass );
            clientPullSkinProperties[0].push( name+'.display()' );
            clientPullSkinProperties[1].push( 'var '+name+':'+item.type+' = new '+ item.type+'('+item.value+')');
            clientPullSkinProperties[1].push( name+'.skinClass = '+ item.skinClass );
            clientPullSkinProperties[1].push( name+'.display()' );
        }
    });

    //如果是一个视图
    if ( isMakeView=== true)
    {
        ownerType = hostComponent;

         //组装代码
         body = ["super("+paramName+");\n",
             declarationReference.join(""),
             newInstances.join("") ].concat(body, publicProperties, invokeContents);

       if( isClientSupport )
       {
           serverPushSkinProperties  = [
               'this.addEventListener(SkinEvent.CREATE_CHILDREN_COMPLETED,function(){\n',
               'Interaction.push("' + interaction_uid + '",{' + serverPushSkinProperties.join(",\n") + '});\n',
               '});\n'
           ];
           body.push( serverPushSkinProperties.join("") );
       }

         //生成构造函数
         content.push( makeConstruct(classModule,paramName,body,hostComponent, ownerType, isClientSupport ? classModule.syntax : null ) );

         //如果需要生成一个前端的构造函数
         if( isClientSupport )
         {
             clientPullContent = 'var '+clientPullHander+':Object=Interaction.pull("'+interaction_uid+'");\n';
             var clientBody = [
                 "super("+paramName+");\n",
                 globalElementReference.join(""),
                 clientPullContent,
                 clientPullSkinProperties[1].join(";\n")+";\n",
                 clientInitComponents.join(""),
                 publicProperties.join(""),
                 invokeContents,
                 stateContent,
                 bindableContent
             ];
             content.push( makeConstruct(classModule,paramName, clientBody,hostComponent, ownerType, "javascript" ) );
         }

    } else
    {
        //组装代码
        superParam = makeSkinParam(classModule);
        ownerType = hostComponent;
        var originBody = ["super("+superParam+");\n", declarationReference.join(""), newInstances.join("") ].concat(body, publicProperties);

        //需要推送皮肤属性到客户端
        if( isClientSupport )
        {
            originBody.push( invokeContents );
            serverPushSkinProperties  = [
                'this.addEventListener(SkinEvent.CREATE_CHILDREN_COMPLETED,function(){\n',
                'if(hostComponent.async===false){\n',
                'Interaction.push(hostComponent.getComponentId("'+interaction_uid+'"),{'+serverPushSkinProperties.join(",\n")+'});\n',
                '}\n});\n'
            ];
            originBody.push( serverPushSkinProperties.join("") );
        }

        //服务端构造函数
        content.push( makeConstruct(classModule,paramName,originBody,hostComponent, ownerType, isClientSupport ? classModule.syntax : null , false) );

        //客户端构造函数
        if( isClientSupport )
        {
            var wrap= [
                declaration[0].join(""),
                globalElementReference.join(""),
                clientPullContent,
                "if("+clientPullHander+" ){\n"
            ];
            wrap.push( clientPullSkinProperties[0].join(";\n") + ";\n");
            wrap.push( "}else{\n" );
            wrap.push("super("+superParam+");\n");
            wrap.push( [ declarationReference.join(""), declaration[1].join("") ].concat(body).join("") );
            wrap.push( "}\n" );
            wrap.push( publicProperties.join("") );
            wrap.push( invokeContents );
            wrap.push( stateContent );
            wrap.push( bindableContent );
            content.push( makeConstruct(classModule, paramName,wrap,hostComponent, ownerType, "javascript", false ) );
        }
    }

    //类中成员函数
    if( scriptContent )
    {
        content.push( scriptContent );
    }
    content.push( '\n}\n}' );
    if( classModule.fullclassname==="view.Index") {
          //console.log( content.join("" ) );
         // process.exit();
    }
    return content.join("");
}

function makeConstruct( classModule, paramName, body, hostComponent, ownerClass , syntax, callSkin) {

    var wrap = [];
    var code = [];
    var paramType = paramName+':'+(ownerClass||hostComponent);
    if( hostComponent )
    {
        if( (ownerClass||hostComponent) !== hostComponent ){
            code.push('this._hostComponent='+paramName+' as '+hostComponent+';\n');
        }else{
            code.push('this._hostComponent='+paramName+';\n');
        }
    }
    if( syntax )
    {
        wrap.push("[Syntax("+syntax+")]\n");
    }
    code = code.concat(body);
    var param = [paramType];
    if( callSkin ){
        param.push("skinFactory:Function=null");
    }
    wrap.push('public function ' + classModule.classname + '('+param.join(",")+')' + '{\n' + code.join("") + '}\n');
    return wrap.join("");
}

/**
 * 生成一个客户端脚本
 * @param classModule
 * @returns {string}
 */
function makeClientScript( classModule , skinObject , isMakeView )
{
    var imports = classModule.imports;
    var body=[];
    var inherit = classModule.extends || '';
    var content = ['package ', classModule.package ,'{\n'];
    var property=[];
    var attach =  getHash( classModule );
    var components = classModule.components;
    var loaded={};
    if( inherit ){
        loaded[inherit]=classModule.namespace;
    }

    //获取脚本内容
    var scriptContent = getScriptContent(  imports, loaded, classModule  );

    //当前子级内容创建后调用的内容
    var invokeContents = [];

    //组件初始化属性
    var initComponentProperties = getClientComponentProperties(components, imports, property, attach, loaded, classModule, invokeContents );
    if( initComponentProperties )
    {
        body = [ initComponentProperties ];
    }

    var declarationReference = [];
    var applicationClass = "es.core.Application";
    if( isMakeView===true )
    {
        //导入Application类
        if( imports.indexOf(applicationClass)<0 )
        {
            imports.push( applicationClass );
        }

        Utils.forEach(classModule.gloableElementList,function (item) {
            if( item.hasUsed ===true ) {
                if( item.notNewInstance ){
                    declarationReference.push('var ' + item.id + ':' + item.classType + '='+item.gloableNodeElement+';\n');
                }else {
                    declarationReference.push('var ' + item.id + ':' + item.classType + '=new ' + item.classType + '(' + item.gloableNodeElement + ');\n');
                }
            }
        });
    }

    if( classModule.declarationReference.length >0 )
    {
        declarationReference.push( classModule.declarationReference.join(";\n")+";\n" );
    }

    //声明的引用
    //html,head,title 的引用
    body.unshift( declarationReference.join("") );

    var skinEvent = "es.events.SkinEvent";
    if( classModule.bindable && imports.indexOf(skinEvent)<0  )
    {
        imports.push( skinEvent );
    }

    //有指定宿主组件
    var hostComponent = null;
    if( skinObject.metadataList && skinObject.metadataList.HostComponent )
    {
        hostComponent = skinObject.metadataList.HostComponent.param.value;
        if( imports.indexOf(hostComponent)<0 )imports.push( hostComponent );
        property.push("private var _hostComponent:"+hostComponent+";\n")
        property.push( "protected function get hostComponent():"+hostComponent+"{\nreturn this._hostComponent;\n}\n");
    }

    if( imports.length > 0 )
    {
        content.push( 'import '+imports.join(';\nimport ') +';\n' );
    }

    content.push( ' public class ');
    content.push( classModule.classname );
    if( inherit )
    {
        content.push(' extends ');
        content.push( inherit );
    }

    //皮肤调用超类的参数
    var skinSuperParam = "";
    if( !isMakeView )
    {
        skinSuperParam= makeSkinParam(classModule);
    }
    skinObject.initProperties = skinObject.initProperties.concat( getSkinChildHtml(classModule) );

    //初始化当前皮肤对象上的属性
    if( skinObject.initProperties.length > 0 )
    {
        body.push( skinObject.initProperties.join(";\n")+';\n' );
    }

    //绑定状态属性
    var stateContent = getStateProperties( classModule );
    if( stateContent )
    {
        body.push(
            'this.addEventListener( SkinEvent.INTERNAL_UPDATE_STATE ,function(event:SkinEvent){\r\n' +
            'var state:State = event.state;\r\n'+
            stateContent +
            '});\n'
        );
    }

    //元素属性绑定
    var bindableContent = getBinddingContent( classModule );
    if( bindableContent )
    {
        body.push('System.getGlobalEvent().addEventListener( Event.INITIALIZE_COMPLETED ,function(){\n' + bindableContent + '},false,-500,this);\n');
    }

    //在创建子级皮肤时执行
    if( invokeContents.length > 0 )
    {
        body.push('this.addEventListener("INTERNAL_BEFORE_CHILDREN" ,function(){\n' + invokeContents.join("") + '});\n');
    }

    content.push('{\n');
    content.push(property.join(""));

    //如果是一个视图
    if ( isMakeView === true)
    {
         if( hostComponent )body.unshift('this._hostComponent=context as '+hostComponent+';\n');
         body.unshift('super(context);\n');
         content.push('function ' + classModule.classname + '(context:'+hostComponent+')' + '{\n' + body.join("") + '}');
    }
    //如果是一个皮肤
    else
    {
        body.unshift('super(' + skinSuperParam+ ');\n');
        if (hostComponent) {
            body.unshift('this._hostComponent=hostComponent as '+hostComponent+';\n');
            content.push('function ' + classModule.classname + '(hostComponent:' + hostComponent + ')' + '{\n' + body.join("") + '}');
        } else {
            content.push('function ' + classModule.classname + '()' + '{\n' + body.join("") + '}');
        }
    }

    //类中成员函数
    if( scriptContent )
    {
        content.push( scriptContent );
    }
    content.push( '\n}\n}' );

   if( classModule.fullclassname==="view.Index") {
        //console.log(content.join(""));
       // process.exit();
    }
    return content.join("");
}

function getScriptContent( imports, loaded, classModule )
{
    var scriptContent = Utils.trim( classModule.script.join("\n") );

    //皮肤中的脚本内容都需要编译为javascript
    //去掉注释的内容
    scriptContent = scriptContent.replace(/\/\/.*?[\r\n]+/g,"").replace(/\/\*.*?\*\//,"");

    //替换导入的类标签
    scriptContent = scriptContent.replace(/\b(import\s+[\w\.\s]+)([\;\n])/g, function (a,b,c) {
        var i = Utils.trim( b.substr(6) );
        if( imports.indexOf(i) < 0 ){
            imports.push(i);
            var n = getClassName(i);
            if( loaded[n] ){
                n = i.replace('.','_');
            }
            loaded[n] = i;
        }
        return '';
    });
    return scriptContent;
}

function getClientComponentProperties(components, imports, classProperty, attach, loaded, classModule, invokeContents )
{
    //组件初始化属性
    var initComponentProperties=[];
    //初始化对象
    var newInstances=[];
    //设置皮肤对象在类中的引用
    var setSkinProperty=[];
    //嵌套的组件
    for (var classname in components )
    {
        var component=components[classname];
        var value=component.fullclassname || component.classname;
        var param = component.param || '';

        // if is Skin goto load Skin class
        if( component.isSkin && imports.indexOf( classModule.baseSkinclass ) < 0 )
        {
            imports.push( classModule.baseSkinclass );
        }

        //需要加载的组件
        if( value && classModule.fullclassname !== value && imports.indexOf(value) < 0  && classModule.baseSkinclass !== value )
        {
            imports.push( value );
            var n = getClassName( value );
            if( loaded[n] )n =value;
            loaded[ value ] = n;
        }

        //优先使用类名
        value = loaded[ value ] || value;
        var _type = ':'+(component.classType ? component.classType : value);

        if ( component.notNewInstance )
        {
            //优先使用元素的ID引用
            if( component.attributeId && !component.isGloableElement)
            {
                param= "Element('#"+component.attributeId+"')";
                _type = ':Element';
            }

            if(param)
            {
                newInstances.push('var ' + component.id +_type+'=' + param );
            }

        } else
        {
            if( component.isSkinComponent ){
                param  = classModule.isMakeView ? '"'+Utils.uid()+'"' : "hostComponent.getComponentId('"+Utils.uid()+"')";
            }
            newInstances.push('var ' + component.id + ':' + value + '= new ' + value + '(' + param + ')');
        }

        //组件属性
        if( component.initProperties )
        {
            initComponentProperties = initComponentProperties.concat( component.initProperties );
        }

        if( component.isDisplayElement && !component.elementAdded )
        {
            if ( component.viewport )
            {
                invokeContents.push( component.viewport + ".addChildAt( " + component.id + ".display() , "+component.childIndex+");\n" );

            } else
            {
                var parentContainer = getSkinReferenceId(component.parent, classModule ) || "this";
                initComponentProperties.push(parentContainer + ".addChildAt( " + component.id +","+component.childIndex+")");
            }
        }

        if ( component.isPrivate !== true )
        {
            setSkinProperty.push('this.' + component.id + '=' + component.id);
            //classProperty.push('[Remove(origin,expect=false)]\n');
            classProperty.push('public var ' + component.id +_type+ ';\n');
            attach.push('"' + component.id + '":' + component.id);
        }
        Utils.merge(attach, getHash(component) );
    }

    initComponentProperties = newInstances.concat( initComponentProperties , setSkinProperty );
    if( initComponentProperties.length > 0 )
    {
        initComponentProperties.push("");
        return initComponentProperties.join(";\n");
    }
    return null;
}

const allowStateProps=["addClass","class","removeClass","style","width","height","left","top","right","bottom"];
function getStateProperties( classModule )
{
    //绑定状态属性
    var stateProperties = {};
    var stateContent = [];
    var rewindProperties = {};
    var sProp = classModule.stateProperties;
    for ( var s in sProp )
    {
        var props = sProp[s].name.split(".");
        if( props.length === 2 )
        {
            var propname = props[0];
            var statename =  props[1];
            if( !classModule.defineStates[statename] )
            {
                throw new ReferenceError( "'"+statename +"' state is not define");
            }

            if( allowStateProps.indexOf(propname) >= 0 )
            {
                var _id = sProp[s].target===classModule?"this" :sProp[s].target.id;
                var refcontent = stateProperties[statename] || (stateProperties[statename] = []);
                var rewindContent = rewindProperties[statename] || (rewindProperties[statename] = []);
                if( propname==="style"){
                    refcontent.push(_id + ".style(" + "'" + sProp[s].value.replace(/^[\"\']+|[\"\']+$/g,'').replace(",","','") + "')");
                } else if (propname === "class" || propname === "addClass")
                {
                    if( ( !sProp[s].value || sProp[s].value==="@null") && propname !== "addClass" )
                    {
                        refcontent.push(_id + ".element.removeClass()");
                    }else if( sProp[s].value && propname === "class") {
                        refcontent.push(_id + ".element.addClass(" + "'" + sProp[s].value + "', true)");
                    }else if( sProp[s].value ) {
                        refcontent.push(_id + ".element.addClass(" + "'" + sProp[s].value + "')");
                        rewindContent.push(_id + ".element.removeClass(" + "'" + sProp[s].value + "')");
                    }

                } else if (propname === "removeClass") {
                    refcontent.push(_id + ".element.removeClass(" + "'" + sProp[s].value + "')");
                } else {
                    refcontent.push(_id + "." + propname + '="' + sProp[s].value + '"');
                }
            }
        }
    }

    for( var sp in stateProperties )
    {
        stateContent.push("if( state.includeIn('"+sp+"') ){\r\n");
        stateContent.push( stateProperties[sp].join(";\r\n")+";\r\n}" )
        if( rewindProperties[sp].length>0 ) {
            stateContent.push("else {");
            stateContent.push(rewindContent.join(";\r\n") + ";\r\n}");
        }
    }
    if( stateContent.length>0 )
    {
        return stateContent.join("");
    }
    return null;
}


function getBinddingContent( classModule  )
{
    //绑定元标签
    if( classModule.bindable )
    {
        var bindableContent = [];
        var index = 0;
        for( var p in classModule.bindable )
        {
            var item =classModule.bindable[ p ];
            var varname = '__bind'+(index++)+'__';
            bindableContent.push('var '+varname+':Bindable = new Bindable('+p+','+JSON.stringify(item.name)+');\n' );
            for(var i in item.bind )
            {
                var flag = !item.bind[i].flag ? '",false' : '"';
                var refname = item.bind[i].viewport || "this";
                if( item.bind[i].id.description && item.bind[i].id.description.fullclassname === classModule.baseSkinclass )
                {
                    bindableContent.push(varname + '.bind(' + refname + ',"' + item.bind[i].attr + '","' + item.bind[i].name + flag + ');\n');
                }else {
                    bindableContent.push(varname + '.bind(' + refname + ',"' + item.bind[i].attr + '","' + item.bind[i].name + flag + ');\n');
                }
            }
        }
        return bindableContent.join("");
    }
    return '';
}

function getHash( skinObj ) {
    var attach = [];
    if( skinObj.hash )
    {
        for(var p in skinObj.hash )
        {
            if( skinObj.hash[p] === '@id')
            {
                attach.push('"'+p+'":"@id"');
            }
        }
    }
    return attach;
}

const loadedSkins = {};
function makeSkin(view , config, syntax, ownerModule)
{
    //工程路径
    var project_path = config.project.path;
    if( view.charAt(0)==='@' )
    {
        view = view.substr(1);
        //获取系统路径
        project_path = config.root_path;
    }

    //格式化皮肤文件路径
    //view = PATH.resolve( project_path , view.replace(/\./g,'/') ).replace(/\\/g,'/');
    view =  Utils.getResolvePath(project_path, view );

    view = PATH.relative(project_path, view ).replace(/\\/g,'/');
    var filename = view.replace(/\//g,'.');

    //如果是已经加载过
    if( loadedSkins[ filename ] === true )
    {
        return null;
    }
    loadedSkins[ filename ] = true;

    var filepath = Utils.getResolvePath( project_path , view );

    //是否加载系统库中的文件
    if( filename.indexOf( config.system_lib_path_name+'.' )===0 )
    {
        filepath = PATH.resolve( config.system_lib_path, filename.replace(/\./g, '/' ) ).replace(/\\/g,'/');
    }

    filepath = filepath+config.skin_file_suffix;
    if( !Utils.isFileExists(filepath) )throw new Error('Not found skin. for "'+filepath+'"');
    var content = Utils.getContents( filepath );
    Utils.info('Checking skin file '+filepath);

    var xml = libxml.parseXmlString( content ,{noblanks:false,nocdata:false} );
    var element = xml.root();
    var name = element.name();

    var namespace = getNamespace(element).name;
    var fullname =  namespace ? namespace+'.'+name : name;
    var index = filename.lastIndexOf('.');
    var isMakeView = name==="View";
    var context=getSkinObject( isMakeView ? 'html' : 'div');
    context.isContextModule = true;
    context.components=[];
    context.imports=[fullname];
    context.isMakeView = isMakeView;
    context.loadResourceFiles=[];
    context.style=[];
    context.script=[];
    context.hash={};
    context.initProperties = [];
    context.initSelfProperty = [];
    context.stateProperties = [];
    context.defineStates = {};
    context.fullclassname = filename;
    context.filepath = filepath;
    context.extends = name;
    context.namespace = fullname;
    context.classname = filename.substr(index+1);
    context.package = filename.substr(0,index);
    context.bindable=[];
    context.config = config;
    context.isSkin=true;
    context.syntax = syntax;
    context.ignorePropertyNotExists = true;
    context.baseSkinclass = config.baseSkinClass;
    context.stateClass = "es.core.State";
    context.nonglobal = true;
    context.description = makeSkin.loadModuleDescription( syntax, fullname, config, filepath);
    context.ownerModule = ownerModule;
    context.declarationReference = [];
    context.declarationReferenceOrigin = {};

    //解析皮肤
    try{

        if( context.isMakeView )
        {
            context.gloableElementList={
                "head":{id:getUniqueVar(context), isPrivate:true,gloableNodeElement:'document.head',classType:'Skin',hasUsed:false,children:[]},
                "body":{id:getUniqueVar(context), isPrivate:true,gloableNodeElement:'this',classType:'Skin',hasUsed:false,notNewInstance:true,children:[]},
                "html":{id:getUniqueVar(context), isPrivate:true,gloableNodeElement:'document.documentElement',classType:'Skin',hasUsed:false,children:[]},
            }
        }

        var skinObject = parseSkin(element, context);
        if (context.attr.name) {
            context.name = context.attr.name;
            delete context.attr.name;
        }
        var classModule = createModulObject(fullname, filename, filepath);

        //模块上下文对象
        classModule.moduleContext = context;

        //为样式绑定的属性{{property}}
        context.style.forEach(function (style) {
            style.content = style.content.replace(/\{\{([\s\w]+)\}\}/g,function (a,prop){
                prop = Utils.trim( prop );
                if( !prop )
                {
                    throw new SyntaxError('binding must have a property name');
                }
                if( !context.attr.hasOwnProperty(prop) )
                {
                    throw new SyntaxError('property name is not defined of binding');
                }
                return context.attr[prop];
            });
        });

        //需要编译的客户端脚本
        if( syntax ==="javascript" )
        {
            classModule.script = makeClientScript( context, skinObject, isMakeView );
        }
        //需要编译服务端脚本
        else
        {
            classModule.script = makeServerScript( context, skinObject, isMakeView);
        }

        //是一个视图
        classModule.isMakeView = isMakeView;
        classModule.isSkin = true;

        if (isMakeView)
        {
            classModule.viewContent = skinObject;
            classModule.viewMaker = function (callback,bootstrap)
            {
                return createClientApplicationView(skinObject, context,bootstrap,callback);
            }
        }
        return classModule;

    }catch (e)
    {
        if( config.debug ){
            console.log( e );
        }
        throw new Error( e.message + "\n at "+filepath );
    }
}

module.exports = makeSkin;


