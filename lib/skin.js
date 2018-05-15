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
    if( ["meta","link","input"].indexOf(skin.name) >= 0 ){
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

function makeSkinObject(skin, attach)
{
    if( typeof skin === "string" )return "'"+skin+"'";
    if( skin.name==='text' || skin.name==='cdata' )
    {
        return skin.children.join(',');
    }
    var content=[];
    content.push('"name":"'+skin.name+'"');
    var attrStr = [];
    for(var p in skin.attr )
    {
        var attrV = Utils.trim(skin.attr[p]);
        if( attrV )
        {
            if( attrV.charAt(0)==="@")
            {
                attrStr.push( '"'+p+'":'+attrV.substr(1) );
            }else{
                attrStr.push( '"'+p+'":"'+attrV+'"' )
            }
        }
    }
    content.push('"attr":{'+attrStr.join(",")+'}');
    var child=[];
    for( var i in skin.children )
    {
        if( !(skin.children[i].nonChild || skin.children[i].isProperty) )
        {
            if (skin.children[i].id)
            {
                child.push(skin.children[i].id);
            } else {
                child.push( makeSkinObject(skin.children[i]) );
            }
        }
    }
    content.push('"children":['+child.join(',')+']');
    if( attach )
    {
        content = content.concat(attach);
    }
    return '{'+content.join(',')+'}';
}

function makeSkinParam(skin)
{
    var content=[];
    var _name = skin.name === "Skin" ? "div" : skin.name;
    content.push('"'+(_name)+'"');
    var attrStr = [];
    for(var p in skin.attr )
    {
        var attrV = Utils.trim(skin.attr[p]);
        if( attrV )
        {
            if( attrV.charAt(0)==="@")
            {
                attrStr.push( '"'+p+'":'+attrV.substr(1) );
            }else{
                attrStr.push( '"'+p+'":"'+attrV+'"' )
            }
        }
    }
    if( attrStr.length > 0 )
    {
        content.push('{' + attrStr.join(",") + '}');
    }
    var child= getSkinChildToString( skin );
    if( child ) {
        skin.context.initProperties.push((skin.id || "this") + ".element.html('" + child + "')");
    }
    if( content.length === 0 )return '';
    return content.join(",");
}

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
        if (["meta", "link", "input"].indexOf(skin.name) >= 0) {
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

function isNonChild( elem )
{
    return (elem.nonChild || elem.isProperty);
}

function isSerComponent(context, elem )
{
    return context.syntax !== "javascript" && elem.isComponent && !elem.isProperty;
}

function makeSkinView(skin, context, level, callback )
{
    level = level || 1;
    if( typeof skin === "string")return skin;
    var content=[];
    var attrStr = [];
    if( skin.attributeId ){
        attrStr.push('id="'+skin.attributeId+'"');
    }

    for(var p in skin.attr )
    {
        var attrV = Utils.trim(skin.attr[p]);
        if( attrV )attrStr.push( p+'="'+attrV+'"' )
    }
    var depth = new Array(level).join("\t")
    content.push(depth);

    var endTag = "";
    if( ["meta","link","input"].indexOf(skin.name) >= 0 ){
        endTag = "/";
    }

    if( attrStr.length >0 ){
        content.push('<'+skin.name+" "+attrStr.join(" ")+endTag+">");
    }else{
        content.push('<'+skin.name+endTag+">");
    }
    if( !endTag )
    {
        for (var i in skin.children)
        {
            if( !isNonChild( skin.children[i] ) )
            {
                content.push(makeSkinView(skin.children[i], context,level + 1, callback ));

            }else if( isSerComponent(context, skin.children[i]) )
            {
                if( context.syntax ==="php" )
                {
                    content.push(makeViewComponentOfPHP(skin.children[i], context, level + 1, callback));
                }
            }else  if( skin.children[i].isProperty && skin.children[i].name === "template" )
            {
                content.push( __toString( skin.children[i], true ,null,"", context.syntax ) )
            }
        }
    }
    //缩进，如果有子级并且不是文本
    if( skin.children.length > 0 && !(skin.children.length===1 && typeof skin.children[0] === "string") && !isNonChild( skin.children[0] ) )
    {
        content.push(depth);
    }
    if( !endTag ) {
        content.push('</' + skin.name + '>');
    }
    var str = content.join("").replace(/[\r\n]+/g,"\r\n" );
    if( level > 1 ){
        str = "\r\n"+str+"\r\n";
    }
    return str;
}

function makeServerView(skin, context, level, properties )
{
    level = level || 1;
    if( typeof skin === "string")return skin;
    var content=[];
    var attrStr = [];
    if( skin.attributeId ){
        attrStr.push('id="'+skin.attributeId+'"');
    }

    for(var p in skin.attr )
    {
        var attrV = Utils.trim(skin.attr[p]);
        if( attrV )attrStr.push( p+'="'+attrV+'"' )
    }
    var depth = new Array(level).join("\t")
    content.push(depth);

    var endTag = "";
    if( ["meta","link","input"].indexOf(skin.name) >= 0 ){
        endTag = "/";
    }

    if( attrStr.length >0 ){
        content.push('<'+skin.name+" "+attrStr.join(" ")+endTag+">");
    }else{
        content.push('<'+skin.name+endTag+">");
    }
    if( !endTag )
    {
        for (var i in skin.children)
        {
            if( !isNonChild( skin.children[i] ) )
            {
                content.push(makeServerView(skin.children[i], context,level + 1, properties ));

            }else if( isSerComponent(context, skin.children[i]) )
            {
                 if( !skin.children[i].async )
                 {
                     content.push(makeServerViewComponent(skin.children[i], level + 1, context, properties));
                 }

            }else  if( skin.children[i].isProperty && skin.children[i].name === "template" )
            {
                 content.push( __toString( skin.children[i], true ,null,"", context.syntax ) );
            }
        }
    }
    //缩进，如果有子级并且不是文本
    if( skin.children.length > 0 && !(skin.children.length===1 && typeof skin.children[0] === "string") && !isNonChild( skin.children[0] ) )
    {
        content.push(depth);
    }
    if( !endTag ) {
        content.push('</' + skin.name + '>');
    }
    var str = content.join("").replace(/[\r\n]+/g,"\r\n" );
    if( level > 1 ){
        str = "\r\n"+str+"\r\n";
    }
    return str;
}


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


function makeViewComponentOfPHP(skin, context, level, callback )
{
    var depth = new Array(level).join("\t")
    var depth1 = new Array(level+1).join("\t")
    var code=["\n"+depth+"<?php"];

    var str = [];
    var childComponents = getChildComponents( skin );
    if( childComponents.length > 0 )
    {
        Utils.forEach( childComponents,function (component){
            var value=component.fullclassname || component.classname;
            var param = component.param || '';
            if ( component.notNewInstance )
            {
                if (param)str.push('var ' + component.id + '=' + param+";" );

            } else if( component.isSkin === false )
            {
                str.push('var ' + component.id + ':' + value + '= new ' + value + '(' + param + ');');
            }
        });
    }

    str.push( depth1+"var "+skin.id+":"+skin.fullclassname+"= new "+skin.fullclassname+"("+(skin.param||"")+");" );
    str.push( depth1+skin.initProperties.join(";\n"+depth1 )+";" );
    if( skin.isDisplayElement ) {
        str.push(depth1 + skin.id + ".display();");
    }

    str = callback.call(skin, str.join("\n") )
    if( str ) {
        code.push( depth1+str.replace(/\n/g, "\n"+depth1 ) );
    }
    code.push(depth+"?>\n");
    return code.join("\n");
}

function makeServerViewComponent(skin, level, context, properties )
{
    var depth = new Array(level).join("\t")
    var depth1 = new Array(level+1).join("\t")
    var code=["\n"+depth+"<?"];
    var str = [];
    var childComponents = getChildComponents( skin );
    properties = properties || {};
    if( childComponents.length > 0 )
    {
        Utils.forEach( childComponents,function (component){
            var value=component.fullclassname || component.classname;
            var param = component.param || '';
            if ( component.notNewInstance )
            {
                if (param)str.push('var ' + component.id + '=' + param+";" );

            } else if( component.isSkin === false )
            {
                str.push('var ' + component.id + ':' + value + '= new ' + value + '(' + param + ');');
            }
        });
    }

    var instance = properties.newInstance || (properties.newInstance=[]);
    var member = properties.member || (properties.member=[]);
    if( !skin.isPrivate )
    {
        member.push( "this."+skin.id + '='+skin.id +';\n');
    }
    instance.push( "var "+skin.id+":"+skin.fullclassname+"= new "+skin.fullclassname+"("+(skin.param||"")+");\n" );
    str.push( depth1+skin.initProperties.join(";\n"+depth1 )+";" );
    if( skin.isDisplayElement ) {
        str.push(depth1 + '___code___+='+skin.id + ".display().toString();");
    }
    str =  str.join("\n")
    code.push( str );
    code.push( depth+"?>\n");
    return code.join("\n");
}


var __uid__=1;
function uid(){return __uid__++;}

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
                    makeSkin.loadSkinModuleDescription(context.syntax, source,  context.config );
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
                makeSkin.loadSkinModuleDescription( context.syntax, attrValue, context.config );
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
        skinObject.isComponent=true;
        var bindname = attrValue[0].replace(/\s/g,'');
        bindname = bindname.split('.');
        if( bindname[0] !== 'this' )bindname.unshift('this');
        var refname = bindname.pop();
        var refobj =  bindname.join('.');
        var binding = context.bindable[ refobj ] || (context.bindable[ refobj ]={name:[],bind:[]});
        if( binding.name.indexOf(refname) < 0 ){
            binding.name.push(refname)
        }
        if( context.isMakeView )
        {
            if( !skinObject.attributeId )
            {
              skinObject.attributeId =  getViewportId();
            }
            skinObject.notNewInstance = true;
        }

        var param = {id:skinObject,attr:attrName,name:refname,flag:(attrValue[1]||'').toLowerCase()!=="false"};
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
        if( context.isMakeView )
        {
            if( !parent.attributeId )
            {
                parent.attributeId=getViewportId();
            }
            context.initProperties.push("Element('#"+parent.attributeId+"').addChildAt( Element.createElement( "+content+" ), "+childIndex+" )");

        }else
        {
            if( !parent.id )
            {
                parent.id = "__var"+uid()+"__";
                parent.isPrivate = true;
            }
            context.initProperties.push( parent.id+".addChildAt( Element.createElement( "+refObject+" ), "+childIndex+")");
        }
    }
    return has;
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
            if( context.isMakeView )
            {
                skinObject.attributeId || (skinObject.attributeId='Q'+uid()+'_'+(new Date()).getTime());

            }else if( !skinObject.id && skinObject !== context )
            {
                skinObject.id = '__var' + uid() + '__';
                skinObject.isPrivate = true;
            }
            context.stateProperties[ attrName ] = {"value":attrValue, "target":skinObject};
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

function parseSkin(elem, context, module , parent, async )
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

    }else if( name.toLowerCase()==='script' )
    {
        context.script.push( elem.text() );
        return null;
    }
    else if( name.toLowerCase()==='style' )
    {
        context.style.push( Utils.trim( elem.text() ) );
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

    //获取一个皮肤对象
    var skinObject=getSkinObject(name);
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

    async = async===true ? true : attrdata.async === 'true';
    async = isClientRunning(async, context.syntax);
    skinObject.async = async;
    delete attrdata.async;
    if( name.toLowerCase()==='include' )
    {
        var file=attrdata.file;
        if( !file )return null;
        var suffix = file.substr( file.lastIndexOf('.')+1 );
        delete attrdata.file;
        switch ( suffix.toLowerCase() )
        {
            case 'js' :
                name = 'script';
                attrdata.src = file;
                skinObject.name = name;
                break;
            case 'css' :
                name = 'link';
                attrdata.href = file;
                skinObject.name = name;
                break;
            case 'es' :
                break;
        }
    }

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

                if (context.isMakeView === true) {
                    if (!parent.attributeId) {
                        parent.attributeId = getViewportId();
                    }
                    skinObject.viewport = 'Element("#' + parent.attributeId + '")';
                    skinObject.nonChild = true;
                }

            }
            //是否为一个组件
            else {

                //var viewport_desc = getClassPropertyDesc('viewport', skinObject, context);
                var isDisplayElement = checkInstanceOf(context, skinObject.description, "es.interfaces.IDisplay", true);
                if (isDisplayElement) {
                    skinObject.isDisplayElement = true;
                    skinObject.isSkinComponent = checkInstanceOf(context, skinObject.description, "es.components.SkinComponent");
                    skinObject.nonChild = parent.isProperty !== true;
                    skinObject.autoDisplay = (attrdata.auto || "true").toLowerCase() !== "false";

                    if (!parent.id && parent !== context && context.isMakeView !== true) {
                        parent.id = '__var' + uid() + '__';
                        parent.isPrivate = true;
                        parent.isSkin = !parent.isComponent;
                        parent.isComponent = true;
                    }

                    /* if (parent) {
                     attrdata['viewport'] = '@' + parent.id;
                     } else {
                     attrdata['viewport'] = '@this';
                     }*/

                    if (!parent.isSkin && parent.isComponent) {
                        throw new Error("Viewport must is skin element of add component. file:" + context.filepath);
                    }

                    if (context.isMakeView === true) {
                        if (!parent.attributeId) {
                            parent.attributeId = getViewportId();
                        }
                        skinObject.viewport = 'Element("#' + parent.attributeId + '")';
                        //attrdata['viewport'] = '@new Skin( new Element("#'+parent.attributeId+'") )';
                    }
                }
            }
            module = skinObject;
        }
    }else
    {
        skinObject.name = name.toLowerCase();
    }
    skinObject.module = module;
    skinObject.context = context;
    skinObject.parent = parent;
    skinObject.attrdata = attrdata;

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

    //子级
    var nodes = elem.childNodes();
    if( nodes.length > 0 )
    {
        var child;
        var childIndex = 0;
        for (var i in nodes)
        {
            child= parseSkin( nodes[i], context, module , skinObject , async);
            //如果是属性稍后会当参数处理
            if( child )
            {
                var textBinding = false;
                if( typeof child === "string" && !skinObject.ownerProperty )
                {
                    textBinding = parseTextBinding(context,skinObject,child, childIndex );
                    if(typeof textBinding ==="string")
                    {
                        child = textBinding;
                        textBinding = false;
                    }

                }else
                {
                    child.childIndex = childIndex;
                }

                if( !textBinding )
                {
                    if (child.isProperty !== true && child.id && !skinObject.id && !skinObject.attributeId)
                    {
                        skinObject.isComponent = true;
                        skinObject.isSkin = true;
                    }
                    skinObject.children.push(child);
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
            metastr = metastr.substr(0, metastr.length-2 );
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
                skinObject.description  = makeSkin.loadModuleDescription(context.syntax,  context.baseSkinclass , context.config, context.filepath );
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
            //构建一个皮肤对象
            // param = makeSkinObject( skinObject );
            param = makeSkinParam( skinObject );
        }
        if( param ) {
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
            makeSkin.loadSkinModuleDescription(context.syntax ,value, context.config);
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
    }
    if( value.charAt(0) ==='@' )value = value.substr(1);
    return value;
}

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
 * 生成一个应用视图页面
 * @param viewObject
 * @param context
 */
function createApplicationView(viewObject , context, callback )
{
    var attr = viewObject.attr;
    setViewHeadAndBodyElement(viewObject , context);
    viewObject.attr={};
    var view ="<!DOCTYPE html>\r\n"+makeSkinView( viewObject, context , 1, callback );
    viewObject.attr=attr;
    return view;
}

function createServerView(viewObject , context )
{
    var attr = viewObject.attr;
    setViewHeadAndBodyElement(viewObject , context);
    viewObject.attr={};
    var view ="<!DOCTYPE html>"+makeServerView( viewObject, context ,1);
    var code = [];
    code.push( Utils.templateMake( view ) );
    code.push( "var __this__:"+context.fullclassname+" = ("+context.fullclassname+")this;" );
    code.push( "__this__.element.html( ___code___ );" );
    viewObject.attr=attr;
    return code.join("\n");
}

/**
 * 设置视图默认需要的标签元素
 * @param viewObject
 * @param context
 */
function setViewHeadAndBodyElement(viewObject , context)
{
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
    var filename = (context.ownerModule || context).classname.toLowerCase();
    var title = getSkinObject("title")
    var script = getSkinObject("script");
    var link = getSkinObject("link");
    var view_path = Utils.getBuildPath(context.config, 'build.view')+"/"+package_path;

    var js_path = Utils.getBuildPath(context.config, 'build.js');
    var js_path = PATH.relative( view_path, PATH.resolve( js_path,filename + '.js') ).replace(/\\/g,"/");

    var css_path = Utils.getBuildPath(context.config, 'build.css');
    var css_path = PATH.relative( view_path, PATH.resolve( css_path,filename + '.css') ).replace(/\\/g,"/");

    script.attr={"type":"text/javascript","src":js_path};
    link.attr={"rel":"stylesheet","href":css_path};
    head.children=[meta,link,script];

    //是否有定义head
    var objHead = getElementByName("head", viewObject);
    if( !objHead )
    {
        objHead = head;
        viewObject.children.push( head );
    }else{
        objHead.children = objHead.children.concat( head.children );
    }

    //是否有定义body
    var objBody = getElementByName("body", viewObject);
    if( !objBody )
    {
        objBody = getSkinObject("body");
        viewObject.children.push( objBody );
    }

    var headTags = ["base","meta","link","script","title"];
    var children = viewObject.children.slice(0);
    var len = children.length;
    var index = 0;
    var i = 0;
    for(;index<len;index++)
    {
        var child = children[ index ];
        if( child === objBody || child === objHead )continue;
        if( child.name.toLowerCase()==="frameset" )continue;
        if( headTags.indexOf( child.name.toLowerCase() ) >= 0 )
        {
            objHead.children.push( child )
        }else{
            objBody.children.push( child )
        }
        i = viewObject.children.indexOf( child );
        viewObject.children.splice(i,1);
    }

    var objTitle = getElementByName("title", objHead);
    if( !objTitle ){
        title.children.push( viewObject.attr.title || context.classname );
        objHead.children.push( title );
    }

    for( var c in objHead.children )
    {
        var metaObj = objHead.children[ c ];
        if( metaObj.name === "meta" && metaObj !== meta)
        {
            if( metaObj.attr.charset )
            {
                meta.attr.charset = metaObj.attr.charset;
                delete metaObj.attr.charset;
            }
        }
    }

    objHead.children.sort(function (a,b) {
        a = headTags.indexOf( a.name );
        b = headTags.indexOf( b.name );
        if( a==b )return 0;
        return a > b ? 1 : -1;
    });

    viewObject.children.sort(function (a,b) {
        return a.name === "head" ? -1 : 1;
    });
}

/**
 * 获取类名称，不包括命名空间
 * @param name
 * @returns {*|{type, id, param}|string}
 */
function getClassName(name) {
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

function getComponentRinningContents(classModule, isMakeView, component, imports, loaded, body, property, newInstances, invokeContents)
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
    var _type = ':' + value;

    if (component.notNewInstance)
    {
        if (component.attributeId)
        {
            param = "Element('#" + component.attributeId + "')";
            _type = ':Element';
        }
        if (param)newInstances.push('var ' + component.id +_type+'=' + param + ";\n");

    } else
    {
        newInstances.push('var ' + component.id + ':' + value + '= new ' + value + '(' + param + ');\n');
    }

    //组件初始化属性，视图需要单独去生成所以在这里不添加。
    if( !isMakeView)
    {
        //组件属性
        if (component.initProperties && component.initProperties.length > 0)
        {
            body.push(component.initProperties.join(";\n") + ";\n");
        }

        //一个显示元素
        if (component.isDisplayElement)
        {
            if (component.viewport)
            {
                invokeContents.push(component.viewport + ".addChildAt( " + component.id + ".display() , " + component.childIndex + ");\n");

            } else
            {
                var parentContainer = component.parent && component.parent.id ? component.parent.id : "this";
                body.push(parentContainer + ".addChildAt( " + component.id + "," + component.childIndex + ");\n");
            }
        }
    }

    //如果是公开的属性则加入到类成员中
    if( component.isPrivate !== true )
    {
        body.push('this.' + component.id + '=' + component.id + ";\n");
        property.push('public var ' + component.id + _type + ';\n');
    }
}

/**
 * 生成一个模块脚本
 * @param classModule
 * @returns {string}
 */
function makeServerScript( classModule , skinObject )
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
    var clientScript = {
        "requirements":[],
        "content":[],
        "loaded":{},
        "body":[],
        "property":[],
        "newInstances":[],
    };

    //嵌套的组件
    Utils.forEach(components, function ( component )
    {
        //标记为异步的组件都运行在客户端
       if( component.async )
       {
           //如果是公开的属性则加入到类成员中
           if( component.isPrivate !== true )
           {
               var type=component.fullclassname || component.classname;
               property.push( ["[RunPlatform('client')]", 'public var ' + component.id +':'+ type ].join("\n")+ ';\n');
           }
           getComponentRinningContents(classModule, false, component, clientScript.requirements, clientScript.loaded,
               clientScript.body, clientScript.property,
               clientScript.newInstances, clientScript.body);

       }else
       {
           getComponentRinningContents(classModule, classModule.isMakeView, component, imports, loaded, body, property, newInstances, invokeContents);
       }

    });

    //组件实例化
    body.unshift( newInstances.join("") );

    var applicationClass = "es.core.Application";
    if( classModule.isMakeView===true )
    {
        //指定视图的上下文类
        if(  skinObject.context.ownerModule ){
            //applicationClass = skinObject.context.ownerModule.fullclassname;
        }

        if( imports.indexOf(applicationClass)<0 )
        {
            imports.push( applicationClass );
        }
    }

    //有指定宿主组件
    var hostComponent = null;
    if( skinObject.metadataList && skinObject.metadataList.HostComponent )
    {
        hostComponent = skinObject.metadataList.HostComponent.param.source;
        if( imports.indexOf(hostComponent)<0 )imports.push( hostComponent );
        property.push("private var _hostComponent:"+hostComponent+";\n")
        property.push( "protected function get hostComponent():"+hostComponent+"{\nreturn this._hostComponent;\n}\n");
        body.unshift('this._hostComponent=hostComponent;\n');
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

    //初始化当前皮肤对象上的属性
    if( skinObject.initProperties.length > 0 )
    {
        body = body.concat( skinObject.initProperties.join(";\n")+';\n' );
    }

    //生成一个视图代码
    if (classModule.isMakeView === true)
    {
        invokeContents.push( createServerView(skinObject, skinObject.context ) );
    }

    //在创建子级皮肤时执行
    if( invokeContents.length > 0 )
    {
        body.push('this.addEventListener("INTERNAL_BEFORE_CHILDREN" ,function(){\n' + invokeContents.join("") + '});\n');
    }

    content.push('{\n');
    content.push(property.join(""));

    //如果是一个视图
    if (classModule.isMakeView === true)
    {
         body.unshift("super(context);\n");
         content.push('function ' + classModule.classname + '(context:'+applicationClass+')' + '{\n' + body.join("") + '}');
    } else
    {
        body.unshift('super(' + makeSkinParam(classModule)+ ');\n');
        if (hostComponent){
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
    if( classModule.fullclassname==="view.Person") {
       //console.log( content.join("") );
      // process.exit();
    }
 
    return content.join("");
}

/**
 * 生成一个客户端脚本
 * @param classModule
 * @returns {string}
 */
function makeClientScript( classModule , skinObject )
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

    //获取样式内容
    var styleContent = getStyleContent( classModule );
    classModule.style=[ styleContent ];

    //当前子级内容创建后调用的内容
    var invokeContents = [];

    //组件初始化属性
    var initComponentProperties = getInitComponentProperties(components, imports, property, attach, loaded, classModule, invokeContents );
    if( initComponentProperties )
    {
        body = [ initComponentProperties ];
    }

    var skinEvent = "es.events.SkinEvent";
    if( classModule.bindable && imports.indexOf(skinEvent)<0  )
    {
         imports.push( skinEvent );
    }

    var applicationClass = "es.core.Application";
    if( classModule.isMakeView===true )
    {
        //指定视图的上下文类
        if(  skinObject.context.ownerModule ){
            //applicationClass = skinObject.context.ownerModule.fullclassname;
        }
        if( imports.indexOf(applicationClass)<0 )
        {
            imports.push( applicationClass );
        }
    }

    //有指定宿主组件
    var hostComponent = null;
    if( skinObject.metadataList && skinObject.metadataList.HostComponent )
    {
        hostComponent = skinObject.metadataList.HostComponent.param.source;
        if( imports.indexOf(hostComponent)<0 )imports.push( hostComponent );
        property.push("private var _hostComponent:"+hostComponent+";\n")
        property.push( "protected function get hostComponent():"+hostComponent+"{\nreturn this._hostComponent;\n}\n");
        body.unshift('this._hostComponent=hostComponent;\n');
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
        body.push('this.addEventListener( SkinEvent.CREATE_CHILDREN_COMPLETED ,function(){\n' + bindableContent + '});\n');
    }

    //在创建子级皮肤时执行
    if( invokeContents.length > 0 )
    {
        body.push('this.addEventListener("INTERNAL_BEFORE_CHILDREN" ,function(){\n' + invokeContents.join("") + '});\n');
    }

    content.push('{\n');
    content.push(property.join(""));

    //如果是一个视图
    if (classModule.isMakeView === true)
    {
         body.unshift('super(context);\n');
        // body.push("if( this.assign('title') ){\ndocument.title=this.assign('title');\n}");
         content.push('function ' + classModule.classname + '(context:Application)' + '{\n' + body.join("") + '}');

    } else
    {
        body.unshift('super(' + makeSkinParam(classModule)+ ');\n');
        if (hostComponent) {
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
       // console.log(content.join(""));
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

function getStyleContent( classModule )
{
    var styleContent = Utils.trim( classModule.style.join("\n") );
    //为样式绑定的属性{{property}}
    styleContent = styleContent.replace(/\{\{([\s\w]+)\}\}/g,function (a,prop){
        prop = Utils.trim( prop );
        if( !prop )
        {
            throw new SyntaxError('binding must have a property name');
        }
        if( !classModule.attr.hasOwnProperty(prop) )
        {
            throw new SyntaxError('property name is not defined of binding');
        }
        return classModule.attr[prop];
    });
    return styleContent;
}

function getInitComponentProperties(components, imports, classProperty, attach, loaded, classModule, invokeContents )
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
        var _type = ':'+value;

        if ( component.notNewInstance )
        {
            if( component.attributeId )
            {
                param= "Element('#"+component.attributeId+"')";
                _type = ':Element';
            }
            if(param)newInstances.push('var ' + component.id +_type+'=' + param );

        } else
        {
            newInstances.push('var ' + component.id + ':' + value + '= new ' + value + '(' + param + ')');
        }

        if( component.initProperties )
        {
            initComponentProperties = initComponentProperties.concat( component.initProperties );
        }

        if( component.isDisplayElement )
        {
            if ( component.viewport )
            {
                invokeContents.push( component.viewport + ".addChildAt( " + component.id + ".display() , "+component.childIndex+");\n" );

            } else
            {
                var parentContainer = component.parent && component.parent.id ? component.parent.id : "this";
                initComponentProperties.push(parentContainer + ".addChildAt( " + component.id +","+component.childIndex+")");
            }
        }

        if ( component.isPrivate !== true )
        {
            setSkinProperty.push('this.' + component.id + '=' + component.id);
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

const allowStateProps=["addClass","removeClass","style","width","height","left","top","right","bottom"];
function getStateProperties( classModule )
{
    //绑定状态属性
    var stateProperties = {};
    var sProp = classModule.stateProperties;
    for ( var s in sProp )
    {
        var props = s.split(".")
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
                if( propname==="style"){
                    refcontent.push(_id + ".style(" + "'" + sProp[s].value.replace(/^[\"\']+|[\"\']+$/g,'').replace(",","','") + "')");
                } else if (propname === "addClass") {
                    refcontent.push(_id + ".element.addClass(" + "'" + sProp[s].value + "')");
                } else if (propname === "removeClass") {
                    refcontent.push(_id + ".element.removeClass(" + "'" + sProp[s].value + "')");
                } else {
                    refcontent.push(_id + "." + propname + '="' + sProp[s].value + '"');
                }
            }
        }
    }

    var stateContent = [];
    for( var sp in stateProperties )
    {
        stateContent.push("if( state.includeIn('"+sp+"') ){\r\n");
        stateContent.push( stateProperties[sp].join(";\r\n")+";\r\n}" )
        stateContent.push("else ");
    }
    if( stateContent.length>0 )
    {
        stateContent.pop();
        return stateContent.join("");
    }
    return null;
}


function getBinddingContent( classModule )
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
                var refname = item.bind[i].id.id || "this";
                if( item.bind[i].id.description && item.bind[i].id.description.fullclassname === classModule.baseSkinclass )
                {
                    bindableContent.push(varname + '.bind(' + refname + '.element,"' + item.bind[i].attr + '","' + item.bind[i].name + flag + ');\n');
                }else {
                    bindableContent.push(varname + '.bind(' + refname + ',"' + item.bind[i].attr + '","' + item.bind[i].name + flag + ');\n');
                }
            }
        }
        return bindableContent.join("");
    }
    return null;
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
    Utils.info('Checking Skin file '+filepath);

    var xml = libxml.parseXmlString( content ,{noblanks:false,nocdata:false} );
    var element = xml.root();
    var name = element.name();

    var namespace = getNamespace(element).name;
    var fullname =  namespace ? namespace+'.'+name : name;
    var index = filename.lastIndexOf('.');
    var isMakeView = name==="View";
    var context=getSkinObject( isMakeView ? 'html' : 'div');
    context.components=[];
    context.imports=[fullname];
    context.isMakeView = isMakeView;
    context.style=[];
    context.script=[];
    context.hash={};
    context.initProperty = [];
    context.initSelfProperty = [];
    context.stateProperties = {};
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

    //解析皮肤
    try{
        var skinObject = parseSkin(element, context);
        if (context.attr.name) {
            context.name = context.attr.name;
            delete context.attr.name;
        }
        var classModule = createModulObject(fullname, filename, filepath);
        //模块上下文对象
        classModule.moduleContext = context;
        //模块样式内容
        classModule.styleContent = context.style.join(";\n");
        //需要编译的脚本
        classModule.script = makeClientScript(context, skinObject);
        //需要编译服务端脚本
        if( syntax !=="javascript" )
        {
            classModule.script = makeServerScript(context, skinObject);
        }
        //是一个视图
        classModule.isMakeView = isMakeView;
        classModule.isSkin = true;

        classModule.skinMaker = function (callback) {
            return makeSkinView(skinObject, context, 0, callback);
        }

        if (isMakeView) {
            classModule.viewContent = skinObject;
            classModule.viewMaker = function (callback) {
                return createApplicationView(skinObject, context, callback);
            }
          /*  console.log(  createServerView(skinObject, context, function () {
                return "";
            }))*/
            //process.exit();

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


