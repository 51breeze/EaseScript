const libxml = require('libxmljs');
const Utils  = require('./utils.js');
const PATH = require('path');
const FS = require('fs');
const skinComponentClass = "es.core.SkinComponent";
const displayInterfaceClass = "es.interfaces.IDisplay";

//private
function __toString(skin, notContainer , parent, separation, makeSyntax )
{
    if( typeof skin === "string" )return skin;
    makeSyntax = makeSyntax || skin.context.syntax;
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
    if( (skin.isComponent === true && skin.id ) && parent )
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


/**
* 转义一个字符串中的双引号
*/
function escapeValueString( content , flag )
{
   if( content.indexOf('\"')>=0 )
   {
       content = content.replace(/\\"/g,'"')
   } 
   return content.replace(/\"/g,'\\"');
}

/**
* 去掉引用符号'@'
* @param value 需要判断的字符串
* @param refer 是否允许出现引用符号
* retrun object
*/
function parseValueString(value, refer, flag)
{
    var is = false;
    //引用属性值
    if( value.charAt(0)==="@" )
    {
        value = value.substr(1);
        if( refer === false )
        {
            throw new SyntaxError("Invalid reference the '"+value+"'");
        }
        is = true;
    }

    //转义引用 \@ 符号
    if( value.charAt(0)==="\\" )
    {
        value = value.substr(1);
    }
    return {value:value,has:is,okValue:is ? value : flag !== true && /^([\-\+]?[\d\.]+|true|false)$/i.test( value ) ? value : '"'+escapeValueString(value)+'"'};
}

/**
* 将一组子级元素转换成对象表达式
* @param children array
* @param context 当前上下文对象
* @param topScope 顶级域，存放需要构建的代码
* @param flag 是否需要加引号
* @param refer 是否可以出现引用 '@'
* @return string
*/
function willNodeElementConvertToString(children, context, topScope, flag , refer )
{
    if( typeof children === "string" )
    {
        if( children.charAt(0)==="@" ){
            return children.substr(1);
        }
        if( children.charAt(0) ==='"' || children.charAt(0)==="'" )
        {
            children = children.slice(1,-1);
        }
        children = parseValueString( children.toString(), refer );
        return !children.has && flag ? '"'+children.value+'"' : children.value;
    }

    if( !(children instanceof Array) )
    {
        children = [children];
    }

    var content=[];
    var len = children.length;
    var index = 0;
    var hasRef = false;
    for (;index<len;index++)
    {
        var child = children[index];
        var value="";
        if( child.nonChild || child.isProperty)continue;
        if( typeof child === "string" )
        {
            child = parseValueString(child.toString(), refer===false ? false : len===1 );
            if(hasRef===false) hasRef = child.has;
            value = child.value;

        }else
        {
            var attr = child.attr || {};
            var name = child.name;
            var endTag = "";
            value = attr.value||value;
            //闭合元素
            if( ["meta","link","input","base"].indexOf(name) >= 0 )
            {
                endTag = "/";
            }
            if( child.children.length > 0 )
            {
                if( endTag )
                {
                    throw new SyntaxError("Invalid child element. parent node is closed element.");
                }
                value = willNodeElementConvertToString(child.children,context, topScope, false, false);
            }

            var wrap = '<' + name;
            for (var p in attr)
            {
                if( (p==="content" || p==="innerHTML") && !value )
                {
                    value = attr[p];
                    continue;
                }
                var v = attr[p].replace(/([\'])/g,'\\$1');
                wrap += " "+p+'="'+v+'"';
            }
            if( endTag ){
                 wrap += '/>';
            }else
            {
                wrap += '>' + value + '</' + name + '>';
            }
            value = wrap;
        }
        if( value )
        {
            content.push( value );
        }
    }
    return flag===true && !hasRef ? '"'+content.join("")+'"' : content.join("");
}

/**
* 生成一个组件对象
* @param skinObject 组件对象
* @param context 上下文
* @return object
*/
function createComponentObjectOfValue(skinObject, context, topScope)
{
    var children = [];
    var _topScope = Utils.merge({}, topScope);
    var content = makeRenderScript(skinObject,context,skinObject,_topScope,_topScope.forLevel,_topScope.keyPrefix,children);
    if( content )
    {
        topScope.contentStack.push( content );
    }
    if( children.length > 0 )
    {
        if( children.length > 1 )
        {
           return '[\n'+children.join(",\n")+'\n]';
        }else{
           return children[0];
        }
    }
    return createUniqueArrayRef(skinObject);
}

/**
* 将一组子级元素转换成对象表达式
* @param children array
* @param context 当前上下文对象
* @param topScope 顶级域，存放需要构建的代码
* @return string object
*/
function willNodeElementConvertToObject(children, context, topScope )
{
    if( !children ){
         return "null";
    }
    if( typeof children ==="string" )
    {
        if( children.charAt(0)==="@" ){
            return children.substr(1);
        }
        return "new String(\""+children+"\")";
    }
    if( !(children instanceof Array) )
    {
       children = [children]; 
    }

    var content=[];
    var hash={};
    var len =children.length;
    var index = 0;
    var objectValue = null;

    //直接引用一个对象
    if( len === 1 && typeof children[0] ==="string" && children[0].charAt(0) === "@" )
    {
        return children[0].substr(1);
    }

    for (;index<len;index++)
    {
        var child = children[ index ];
        if( child.nonChild || child.isProperty)
        {
            continue;
        }

        var name  = child.attrdata.name || child.name;
        var value = null;
        var type  = child.attrdata.type;
        if( type==="*" )type = null;
        //组件或者节点元素都转成对象
        if( child.isComponent || child.isCommand )
        {
            value = createComponentObjectOfValue( child, context, topScope );
            objectValue = len === 1 ? value : null;
        }else if( child.children && child.children.length > 0  )
        {
            //如果不是一个对象
            if( child.children.length === 1 && typeof child.children[0] ==="string" )
            {
                value = parseValueString( child.children[0].toString() ).okValue;
            }else{
                
                value = getValueByType( child.children , type||"Object", context, topScope );  
            }

        }else{
            value = child.attrdata.value || child.attrdata.content || child.attrdata.innerHTML;
            if( value ){
                value = parseValueString( value ).okValue;
            }else{
                value = "null";
            }
        }

        if( hash[name]===true )
        {
            throw new Error('"' + name + '" has already been declared');
        }
        hash[name]=true;
        content.push('"'+name+'":'+value);
    }
    if( objectValue ){
        return objectValue;
    }
    return '{'+ content.join(',')+'}';
}

/**
* 将一组子级元素转换成对象表达式
* @param children array
* @param context 当前上下文对象
* @param topScope 顶级域，存放需要构建的代码
* @return string array
*/
function willNodeElementConvertToArray(children, context, topScope, isParam )
{
    if( typeof children ==="string" )
    {
        if( children.charAt(0)==="@" )
        {
            return children.substr(1);
        }
        children = children.split(",").map(function(item){
           return  parseValueString( item ).okValue;
        });
        return "["+children.join(",")+"]";
    }
    var content=[];
    var len = children.length;
    var index = 0;
    var ref = null;
    for (;index<len;index++)
    {
        var child = children[ index ];
        if( child.nonChild || child.isProperty)
        {
            continue;
        }
        if( child.isComponent || child.isCommand )
        {
            value = createComponentObjectOfValue(child, context, topScope);
        }else
        {
            var attr = child.attrdata || {}; 
            var value = attr.value || attr.content || attrs.innerHTML;
            var type  = attr.type || "String";
            if( child.children.length > 0 )
            {
                if( child.children.length ===1 )
                {
                    if( typeof child.children[0] ==="string" ){
                       value = parseValueString(child.children[0]).okValue;
                    }else{
                       value = getValueByType(child.children, type, context, topScope);
                    }
                }else{
                    value = willNodeElementConvertToArray(child.children, context, topScope );
                }
                
            }else if(value)
            {
                if( attr.type ){
                    value = getValueByType(value, type, context, topScope);
                }else{
                    value = parseValueString(value).okValue;
                }
               
            }else{
                value = "null";
            }
        }
        content.push(value);
    }
    if( isParam ){
        return content.join(',');
    }
    if( ref )
    {
        topScope.declaration.push( 'var '+ref+':Array=['+ content.join(',')+'];');
        return ref;
    }
    return '['+ content.join(',')+']';
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
    return condition;
}

var make_skin_factory={
    'foreach': function (attr, content) {
        return 'Object.forEach(' + attr.name + ' , function(' +(attr.value || 'item')+':*,'+(attr.key || 'key') + ':*){\n' + content + '\n},this);';
    },
    'for': function (attr, content) {
        return 'for(' + replace_condition(attr.condition) +'){\n' + content + '\n}';
    },
    'if': function (attr, content) {
        return 'if(' + replace_condition(attr.condition) + '){\n'+content+'\n}';
    },
    'elseif': function (attr, content) {
        return 'else if(' +replace_condition(attr.condition) + '){\n'+content+'\n}';
    },
    'else': function (attr, content, hasChild ) {
        if( hasChild )
        {
            return 'else{\n' + content + '\n}';
        }else{
            return '}else{';
        }
    },
    'do': function (attr, content) {
        return 'do{\n'+content+'\n}';
    },
    'switch': function (attr, content) {
        return 'switch(' +  replace_condition(attr.condition) + '){\n'+content+'\n}';
    },
    'case': function (attr, content) {
        content = 'case "' +  replace_condition(attr.condition) + '":\n'+(content||"");
        if( attr["break"]==='true' )
        {
            content+= content ? '\nbreak;' : "break;";
        }
        return content;
    },
    'default': function (attr, content) {
        content='default:\n'+(content||"");
        if( attr["break"]==='true' ){
            content+='break;';
        }
        return content;
    },
    'break': function (attr, content) 
    {
        if( content ){
            return '\nbreak;\n';
        }
        return 'break;\n';
    },
    'while': function (attr, content) {
        return 'while(' +  replace_condition(attr.condition) + '){\n'+content+'\n}';
    },
    'cdata':function(attr, content){
       return content;
    },
    'code': function (attr, content) {
        return content;
    },'script': function (attr, content) {
        return content;
    },'empty': function (attr, content) {
        return 'if( !'+attr.name+' ){\n'+content+'\n}';
    },'notempty': function (attr, content) {
        return 'if( '+attr.name+' ){\n'+content+'\n}';
    }
};

//private
function __toMakeSkinFactory(skinChildren, context, topScope, parentObject, innerHTML )
{
    parentObject = parentObject || topScope.ownerModule;
    var declaration = [];
    var beforeStack = [];
    var contentStack = [];
    var children = [];
    var afterStack = [];
    var _topScope ={
        properties:topScope.properties,
        declaration:declaration,
        beforeStack:beforeStack,
        afterStack:afterStack,
        contentStack:contentStack,
        topStack:topScope.topStack||beforeStack,
        children:children,
        ownerModule:topScope.ownerModule,
        childCount:topScope.childCount || 0,
        DOMRender:topScope.DOMRender||"DOMRender",
        Context:topScope.Context||"Context",
        ContextType:topScope.ContextType,
        StateHandle:topScope.StateHandle||"stateGroup"
    };

    var body=[];
    if( !parentObject && skinChildren[0] && skinChildren[0].parent )
    {
         parentObject = skinChildren[0].parent;
    }

    var returnChildren = !(skinChildren.length===1 && skinChildren[0].isCommand) && !parentObject.isProperty;
    var hasChildCommand = false;
    Utils.forEach(skinChildren,function(skinObject,index)
    {
        if( hasChildCommand === false && skinObject.isCommand )
        {
           hasChildCommand = true;
        }

        if( !skinObject.isProperty )
        {
            var content = makeRenderScript(skinObject,context,parentObject,_topScope,0,'',children);
            if( content )
            {
               contentStack.push(content);
            }
        }
    });

    if( _topScope.declaration.length > 0 )
    {
       body.push( _topScope.declaration.join("\n") );
    } 

    if( _topScope.beforeStack.length > 0 )
    {
       body.push( _topScope.beforeStack.join("\n") );
    }

    //需要一个数组来存放子级元素
    if( hasChildCommand && returnChildren )
    {
        contentStack.unshift( "var "+createUniqueArrayRef(parentObject)+":Array=[];" );
    }

    if( contentStack.length>0 )
    {
        body.push( contentStack.join("\n") );
    }

    if( _topScope.afterStack.length>0 )
    {
        body.push( _topScope.afterStack.join("\n") );
    }

    if( returnChildren )
    {
        if( hasChildCommand )
        {
            body.push( 'return '+createUniqueArrayRef(parentObject)+';');
        }else
        {
            if( children.length === 0 && innerHTML ){
                body.push( 'return [  '+topScope.DOMRender+".createElement(0,1,\"text\","+innerHTML+')];');
            }else{
                body.push( 'return [\n'+children.join(",\n")+'\n];');
            }
        }
    }

     //如果是在皮肤模块中
    if( parentObject.module )
    {
        if( checkInstanceOf(context, parentObject.module.description, context.baseSkinclass) )
        {
             parentObject = parentObject.module;
        }
    }
   
    factory = "function(){\n"+body.join("\n")+"\n}"; 
    
    return {
        topScope:topScope,
        content: factory
    };
}


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
        "bindAttrs":{},
        "hash":{},
        "children":[],
        //"defineRefs":[]
    };
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

//绑定文本
function parseTextBinding(text,context)
{
    var match = null;
    var regexp = /\{([^\{]+?)\}/g;
    var cursor = 0;
    var content = [];
    var binding = [];
    var refs = [];
    var isTwoWayBind=false;
    var twoWayBindProps = [];
    while ( match=regexp.exec(text) )
    {
        //转义绑定 \{name} 匹配到的反斜为单数时为取消绑定否则为绑定
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
        var twoWayBind = text.substr( match.index-1, 2 ) === "{{" && text.substr( match.index+name.length+1, 2 )==="}}";
        var twoName = name.replace(/\[\s*(\w+?)\s*\]$/,".@$1");
        var twoRefName = twoName !== name;
        if( twoWayBind && !/^([a-zA-Z]+\w+\.?@?)+$/.test(twoName) )
        {
            throw new TypeError("Bind property name is invalid. for '"+name+"'");
        }

        if( !twoWayBind && name.substr(0,6) === "bind::" )
        {
            //暂时不支持绑定数据集
            throw new TypeError("Bind datasets are not supported");
            name= name.substr(6);
            if( binding.indexOf(name) < 0 )
            {
                binding.push(name);
            }

        }
        //没有指明对象的引用都要从数据集中声明, 并且不是双向绑定。
        //默认双向绑定为当前上下文对象所以不需要声明
        else if( !twoWayBind )
        {
            //getValueReferenceName(name, refs);
        }

        var props = twoWayBind ? twoName.split('.') : name.split('.');
        if( twoWayBind )
        {
            //如果没有指定目标对象
            if( props.length===1 )
            {
                props.unshift("this");
            }
        }

        //将this 转成  Context引用
        if( props[0] === 'this' )
        {
            //props[0]="Context";
        }

        var refObject = props.join(".");
        var len = match[0].length;
        var str = text.substr( cursor, match.index-cursor );
        if( twoWayBind )
        {
            twoWayBindProps.push(props)
            isTwoWayBind = true;
            str = text.substr( cursor, match.index-cursor-1 );
            len++;
        }

        if( str )
        {
            content.push('"' + str.replace(/\"/g, '\\"') + '"');
        }

        //如是三元表达式，需要增加优先运算符 "()"
        if( refObject.charAt(0) !=="(" )
        {
            if( !/^\@?(\w+\.?)+$/.test( refObject ) )
            {
               refObject="("+refObject+")";
            }
        }

        content.push( refObject );
        cursor = match.index + len;
    }

    //不支持在同一个属性中绑定多个属性
    if(isTwoWayBind && refs.length > 1 )
    {
        throw new TypeError("Binding multiple properties is not supported");
    }

    if( content.length < 1 )
    {
        return {value:text.replace(/\\\{/g, "{"),refs:refs, binding:binding, result:false,isTwoWayBind:isTwoWayBind,twoWayBindProps:twoWayBindProps};
    }

    if( cursor < text.length )
    {
        content.push('"' + text.substr(cursor, text.length).replace(/\"/g, '\\"') + '"');
    }

    return {value:content.join(" + ").replace(/\\\{/g, "{").replace(/\\\\/g,"&#92;"),refs:refs,binding:binding,result:true,isTwoWayBind:isTwoWayBind,twoWayBindProps:twoWayBindProps};
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
    var iscdata = false;
    if( name==null )
    {
        if( context===module && parent===module )
        {
            context.script.push( Utils.trim( elem.text() ) );
            return null;
        }
        if( parent.isCommand )
        {
            var cdata = getSkinObject(":cdata");
            cdata.isCommand = true;
            cdata.content = Utils.trim( elem.text() );
            return cdata;
        }
        
        //默认当代码块处理
        name=":code";
        iscdata = true;
    }

    //获取一个皮肤对象
    var skinObject=getSkinObject(name);
    //元素属性
    var attrs = elem.attrs();
    var attrdata = {};
    var bindAttrs = {};
    skinObject.isCommand = name.charAt(0)===":";

    for(var p in attrs)
    {
        var attrName = attrs[p].name();
        var attrValue = Utils.trim(attrs[p].value());
        var hash = '@id';
        var lowerAttrName=attrName.toLowerCase();

        if( attrName.toLowerCase() === "src" && !/^(@|{|$|(https?|tcp|file|udp|ftp)\:\/\/)/i.test(attrValue) )
        {
            var file = Utils.resolvePath( attrValue, [PATH.dirname(context.filepath )] );
            var dest = Utils.makeAssetsFile( context.config, context.config.workspace, file );
            attrValue = Utils.getRequestRelativePath(context.config, Utils.getBuildPath(context.config,"webroot"), dest);
            context.assets[ file ] = dest;
        }

        //@表示公开此组件
        if( lowerAttrName==='id' )
        {
            if( attrValue.charAt(0)==='@' )
            {
                attrValue = attrValue.substr(1);
                skinObject.id = attrValue;
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
            //不是指令元素，解析绑定命令
            if( !skinObject.isCommand )
            {
                //单向绑定
                var bind = parseTextBinding( attrValue , context );
                attrValue = bind.value;
                if( bind.result===true )
                {
                    bind.isAttr=true;
                    bindAttrs[ attrName ]=bind;
                }
            }
           
            if( attrValue !== null )
            {
                attrdata[attrName] = attrValue;
            }
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
             var root = PATH.dirname( context.filepath );
             var file = Utils.resolvePath( attrdata.file, [ root ] );
             sourceStyle = file;
             attrdata.file = file;

        }else
        {
            cssStyle = Utils.trim( elem.text() );
        }

        if( cssStyle || attrdata.file )
        {
            if( !attrdata.theme )
            {
                attrdata.theme = "default";
            }

            context.style.push({content: cssStyle, attr: attrdata, file:sourceStyle,classname:context.fullclassname});
        }
        return null;
    }
    //文本直接返回
    else if( name.toLowerCase() === 'text' )
    {
        if( parent.isCommand && parent.name===":code" )
        {
            var cdata = getSkinObject(":cdata");
            cdata.isCommand = true;
            cdata.content = Utils.trim( elem.text() );
            return cdata;
        }
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
        var fullname = namespace.name ? namespace.name+'.'+name : name;
        var index;

        if( name.toLowerCase()==='script' )
        {
            context.script.push( elem.text() );
            return null;

        }else if( name.toLowerCase()==='declare')
        {
            context.declares.push( elem.text() );
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
        skinObject.isComponent = false;

        if( !skinObject.isMetadata )
        {
            var isClass = false;
            try{
                isClass = !!( makeSkin.getLoaclAndGlobalModuleDescription(fullname) || makeSkin.isClassFileExists(fullname, context.config) );
            }catch(e){
               isClass = false;
            }

            //如果是属性就不是类
            if( isClass && module === parent && getClassPropertyDesc(name, module, context)  )
            {
                isClass = false;
            }

            if( isClass )
            {
                skinObject.fullclassname = fullname;
                skinObject.classname = name;
                skinObject.isComponent = true;
                skinObject.description = makeSkin.loadModuleDescription(context.syntax, fullname, context.config, context.filepath, undefined, true);

                //是否为一个状态组件
                if( checkInstanceOf(skinObject.description, context.stateClass) )
                {
                    skinObject.isStateComponent = true;

                    //每一个皮肤对象维护自己的状态属性
                    var ownerContext = parent.ownerSkinModuleContext;
                    if( attrdata.name )
                    {
                        if( ownerContext.defineStates[ attrdata.name ] ) 
                        {
                            throw new Error('"' + attrdata.name + '" state has already been declared');
                        }
                        ownerContext.defineStates[ attrdata.name ] = true;
                    }

                    if( attrdata.stateGroup )
                    {
                        var stateGroup = attrdata.stateGroup.split(",");
                        for(var s in stateGroup )
                        {
                            ownerContext.defineStateGroups[ stateGroup[s] ] = true;
                        }
                    }
                }

                //是否为一个皮肤
                if( getModuleType(context, skinObject.description, [context.baseSkinclass]) )
                {
                    skinObject.isSkin = true;
                    skinObject.isDisplayElement = true;
                    skinObject.name = attrdata.name || "div";

                }
                //是否为一个组件
                else {

                    var isDisplayElement = checkInstanceOf(context, skinObject.description, displayInterfaceClass , true);
                    if (isDisplayElement)
                    {
                        skinObject.isDisplayElement = true;
                        skinObject.isSkinComponent = checkInstanceOf(context, skinObject.description, skinComponentClass );

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
                    }
                }
                module = skinObject;
            }
            else
            {
                var desc = null;

                //是否对一个父级属性的引用
                if( parent && parent.isProperty && parent.description && (parent.description.isAccessor || parent.description.isFunAccessor) )
                {
                    var type = parent.description.type;
                    if ( !(type === "void" || type === "*") )
                    {
                        var typeClass = getImportClassName(type, module.description.import) || type;
                        var typeModule = makeSkin.getLoaclAndGlobalModuleDescription(typeClass);
                        desc = getClassPropertyDesc(name, {description: typeModule}, context);
                    }else{
                        desc = {type:"*"};
                    }

                }
                //属性不能跨父级元素
                else if( module === parent )
                {
                    desc = getClassPropertyDesc(name, module, context);
                }

                if( !desc )
                {
                    throw new ReferenceError("Property is not exists for '"+name+"'");
                } 
                 
                //必须是一个存储器 
                if( !( desc.isAccessor || desc.isFunAccessor) )
                {
                    throw new ReferenceError("Property is not accessor for '"+name+"'");
                } 
                skinObject.isProperty = desc.isXMLProperty !== true;
                skinObject.description = desc;
            }
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

    //状态机属性,包括或者排除状态机。只有显示元素组件或者节点元素才能定义
    if( (attrdata.excludeFrom || attrdata.includeIn) && (!skinObject.isComponent || skinObject.isDisplayElement || 
        (parent && parent.isDisplayElement && skinObject.isProperty) ) )
    {
        if( attrdata.excludeFrom && attrdata.includeIn )
        {
            throw new ReferenceError("'includeIn' with 'excludeFrom' of state conflicts");
        }
        var originValue = attrdata.excludeFrom||attrdata.includeIn;
        var parseValue = parseValueString(originValue);
        skinObject.definedIncludeState={
            origin:originValue,
            value:parseValue.okValue,
            logic:attrdata.excludeFrom ? "!":"",
            expre:"includeIn("+parseValue.okValue+")"
        };
        delete attrdata.excludeFrom;
        delete attrdata.includeIn;
        context.__hasUseState__ = true;
    }

    skinObject.module = module;
    skinObject.context = context;
    skinObject.parent = parent;
    skinObject.attrdata = attrdata;
    skinObject.attr = attrdata;
    skinObject.bindAttrs = bindAttrs;
    skinObject.childIndex= childIndexAt||0;
    skinObject.ownerProperty = skinObject.isProperty ? skinObject : parent ? parent.ownerProperty : null;
    skinObject.foreachLevelCommand = parent ? parent.foreachLevelCommand : 0;
    skinObject.ownerForeachCommand = parent && parent.ownerForeachCommand;
   
    //每一个皮肤对象维护自己的独立上下文
    skinObject.ownerSkinModuleContext = context;
    if( skinObject.isSkin && skinObject.isDisplayElement )
    {
         skinObject.ownerSkinModuleContext = skinObject;
    }else if( parent && parent.ownerSkinModuleContext )
    {
         skinObject.ownerSkinModuleContext =  parent.ownerSkinModuleContext;
    }

    if( skinObject.isCommand && (skinObject.name===":for" || skinObject.name===":foreach") )
    {
        skinObject.ownerForeachCommand=skinObject;
        skinObject.foreachLevelCommand++;
        skinObject.isForeachCommand = true;
    }

    if( skinObject.isRenderComponent && parent === context )
    {
        context.hasChildRenderComponent = true;
    }

    //数据元类型
    if( skinObject.isMetadata )
    {
        var metastr =  Utils.trim( elem.text() );
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

    //子级
    var nodes = elem.childNodes();
    var hasChildCommand = false;
    var childIndex = 0;
    if (nodes.length > 0)
    {
        for (var i in nodes) 
        {
           var child = parseSkin(nodes[i], context, module, skinObject, async, childIndex);
           if( child && typeof child === "string" && !skinObject.isMetadata )
           {
                //单向绑定
                var bind = parseTextBinding( child, context );
                child = bind.value;

                //纯文本
                if( nodes.length === 1 )
                {   
                    if( bind.result===true )
                    {
                        if( skinObject.isProperty )
                        {
                            skinObject.bindAttrs[ skinObject.name ]=bind;

                        }else
                        {
                            bind.isAttr=true;
                            skinObject.bindAttrs[ "content" ]=bind;
                            skinObject.attrdata["content"] = child;
                            skinObject.attr["content"] = child;
                        }
                        child = null;
                    }
                    else if( child )
                    {
                        if( skinObject.ownerProperty )
                        {
                            skinObject.attrdata.content = child;
                        }else{
                            skinObject.attrdata.content = child;
                        }
                    }
                    child = null;

                }else
                {
                    child = getSkinObject("text",{content:child});
                    child.parent = skinObject;
                    child.attrdata=child.attr;
                    child.childIndex= childIndex;
                    child.ownerProperty = skinObject.ownerProperty;
                    child.foreachLevelCommand = skinObject.foreachLevelCommand;
                    child.ownerForeachCommand = skinObject.ownerForeachCommand;
                    child.ownerSkinModuleContext = skinObject.ownerSkinModuleContext;
                    if( bind.result===true )
                    {
                        bind.isAttr=true;
                        child.bindAttrs["content"]=bind;
                    }
                }
           }

           if (child) 
           {
                skinObject.children.push(child);

                //创建子级时的位置索引
                if( !child.isProperty )
                {
                     childIndex++;
                }

                if( child.isCommand )
                {
                     hasChildCommand = true;
                }
           }
        }

    }else if( iscdata )
    {
        var child = parseSkin(elem, context, module, skinObject, async, childIndex);
        hasChildCommand = true;
        skinObject.children.push(child);
    }

    skinObject.hasChildCommand = hasChildCommand;
    return skinObject;
}

/**
 * 根据当前指定的类型获取数据
 * @param skinObject
 * @param type
 * @returns {*}
 */
function getValueByType( skinObject, type, context, topScope, isParam )
{
    var value;
    switch ( type.toLowerCase() )
    {
        case 'boolean':
            value = willNodeElementConvertToString( skinObject, context, topScope );
            value=( value && value !=='false' ? 'true' : 'false' );
            break;
        case 'number':
        case 'int':
        case 'uint':
        case 'integer':
        case 'double':
            value=willNodeElementConvertToString( skinObject, context, topScope );
            break;
        case 'array' :
            value=willNodeElementConvertToArray( skinObject, context, topScope, isParam );
            break;
        case 'object' :
            value=willNodeElementConvertToObject( skinObject,context, topScope  );
            break;
        case 'string':
            value =willNodeElementConvertToString( skinObject, context, topScope, true);
            break;
        case 'class':
            value = willNodeElementConvertToString( skinObject, context, topScope );
            makeSkin.loadSkinModuleDescription(context.syntax ,value, context.config, context );
            break;
        case 'function':
            if( typeof skinObject ==="string" )
            {
                value = "function(){\n"+skinObject+"\n}";
                return value;
            }
            value =__toMakeSkinFactory(skinObject,context,topScope);
            if( value.content ){
                value = value.content;
            }else{
                value = "function(){}";
            }
            break;
        default :
            value = willNodeElementConvertToObject( skinObject, context, topScope , true);
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
function createModulObject(classModule, inherit, fullclassname , filepath )
{
    var index = fullclassname.lastIndexOf('.');
    classModule.fullclassname = fullclassname;
    classModule.extends = inherit;
    classModule.classname = fullclassname.substr(index+1);
    classModule.package = fullclassname.substr(0,index);
    classModule.filepath = filepath;
    return classModule;
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
function createClientApplicationView(viewObject, context)
{
    var view ="<!DOCTYPE html>\r\n"+getClientViewHeadAndBodyElement(viewObject, context);
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
function loadResourceFiles(context, view_path, css_build_path, js_build_path, external_requires )
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
                src =  Utils.getLoadFileRelativePath(context.config, copyTo, "view", view_path);
            }
            external_requires.push( src );
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
function getClientViewHeadAndBodyElement(viewObject , context)
{
    var content = [];
    var version ='?v='+context.config.makeVersion;
    var head = getSkinObject("head",context.gloableElementList.head.attr||{});
    var html = getSkinObject("html", context.gloableElementList.html.attr||{});
    var body = getSkinObject("body",context.gloableElementList.body.attr||{});
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
    
    var hostComponent = makeSkin.getLoaclAndGlobalModuleDescription( viewObject.metadataList.HostComponent.param.value );
    var package_path = context.package.replace(/\./g,"/");
    var filename = hostComponent.fullclassname;
    var script = getSkinObject("script");
    var link = getSkinObject("link");
    var title = getSkinObject("title");
    title.children.push("");
    var view_path = Utils.getBuildPath(context.config, 'build.html');
    var js_build_path = Utils.getBuildPath(context.config, 'build.js');
    var js_path = makeSkin.getLoadFileRelativePath( context.config , PATH.resolve( js_build_path,filename + '.js') );

    var css_build_path = Utils.getBuildPath(context.config, 'build.css');
    var css_path = makeSkin.getLoadFileRelativePath( context.config , PATH.resolve( css_build_path,filename + '.css') );
   
     //生成文件
     var baseScriptFile = makeSkin.getLoadFileRelativePath( context.config , PATH.join( Utils.getBuildPath(context.config, 'build.js'),'easescript.js') );
     var baseScript = getSkinObject("script");
     baseScript.attr={"type":"text/javascript","src":baseScriptFile+version };

    //视图需要引用的资源
    script.attr={"type":"text/javascript","src":js_path+version };
    link.attr={"rel":"stylesheet","href":css_path+version};

    //加载外部文件
    var external_requires = context.external_requires = [];
    var external = loadResourceFiles(context, view_path, css_build_path, js_build_path, external_requires );
    head.children=[meta,title,link,baseScript,script].concat( external );

    var headObj = context.gloableElementList.head;
    var titleSkin = getElementByName("title", headObj );
    if( titleSkin )
    {
        if( titleSkin.attrdata.content )
        {
            title.children=[ titleSkin.attrdata.content];
        }
        var index = headObj.children.indexOf( titleSkin );
        headObj.children.splice(index,1);
    }

    var metaSkin = headObj.children.filter(function(item) {
        return typeof item.attr.name === "undefined";
    })[0];

    if( metaSkin )
    {
        if( metaSkin.attr.charset )
        {
            meta.attr.charset = metaSkin.attr.charset;
        }
        if( metaSkin.attr['http-equiv'] )
        {
            meta.attr['http-equiv'] = metaSkin.attr['http-equiv'];
        }
        if( metaSkin.attr.content )
        {
            meta.attr.content = metaSkin.attr.content;
        }
        var index = headObj.children.indexOf( metaSkin );
        headObj.children.splice(index,1);
    }

    //head.children.splice.apply( head.children , [1,0].concat( headObj.children ) );
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
    var loaded={};
    if( inherit )
    {
        loaded[inherit]=classModule.namespace;
    }

    //获取脚本内容
    var scriptContent = getScriptContent(  imports, loaded, classModule  );
    var classProperties = classModule.classProperties;
    var topStack = [];
    var DOMRender = "this";
    var Context = "this";
    var render = makeRenderFactoryScript(skinObject, classModule,topStack,DOMRender,Context);
    Utils.forEach(classProperties,function(type,name)
    {
        if( type ==="Array" ){ 
            property.push("public var "+name+":"+type+"=[];");
        }else{
            property.push("public var "+name+":"+type+"=null;");
        }
    });

    if( topStack.length > 0 )
    {
        body.push( topStack.join("\n")+"\n" );
    }
   
    var declarationReference = [];
    var requireImportClass=[
        "es.interfaces.IDisplay",
        "es.core.State",
        "es.events.ComponentEvent",
        "es.events.StateEvent",
    ];
    if( isMakeView===true )
    {
        //导入Application类
        requireImportClass.push("es.core.Application");
        requireImportClass.push("es.core.Skin");

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
    requireImportClass.forEach(function(name)
    {
        if( imports.indexOf(name)<0 )
        {
            imports.push( name );
        } 
    });

    //有指定宿主组件
    var hostComponent = null;
    var hostComponentModule = null;
    if( skinObject.metadataList && skinObject.metadataList.HostComponent )
    {
        hostComponent = skinObject.metadataList.HostComponent.param.value;
        if( imports.indexOf(hostComponent)<0 )imports.push( hostComponent );
        hostComponentModule = makeSkin.loadModuleDescription(classModule.config.originMakeSyntax, hostComponent, classModule.config, hostComponent, void 0, true, classModule );
        if( hostComponentModule === null )
        {
            throw new TypeError("the '"+hostComponent+"' class is not exists.");
        }
        classModule.hostComponent = hostComponentModule;
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
        skinSuperParam= classModule.name === "Skin" ? '"div"' : '"'+classModule.name+'"';
    }

    content.push('{\n');

    //元素需要的静态属性
    var staticProperties= [];
    if( render.topScope.staticProperties )
    {
        Utils.forEach(render.topScope.staticProperties,function(value,name){
            staticProperties.push('"'+name+'":'+value);
        });
        if( staticProperties.length > 0 )
        {
             content.push("private var properties:Object={};");
             body.push("const attrs:Object={"+staticProperties.join(",")+"};\n");
             body.push("this.properties=attrs;\n");
        }
    }

    if( render.topScope.topContentStack.length > 0  )
    {
         body.push( render.topScope.topContentStack.join("\n")+"\n" );
    }

    content.push( property.join("\n") );

    //如果是一个视图
    if ( isMakeView === true)
    {
        body.unshift('super(hostComponent);\n');
    }
    //如果是一个皮肤
    else
    {
        body.unshift('super(' + skinSuperParam+ ');\n');
    }

    body.unshift('this._hostComponent=hostComponent;\n');


    if( classModule.config.hot_replacement )
    {
        body.push(`\nif(System.env.HOT_UPDATA){
            System.env.HOT_UPDATA( this, function(obj:${classModule.classname}, newClass:Class ){
                if( obj instanceof es.core.View ){
                    (obj.hostComponent as es.core.Application).render( new newClass(obj.hostComponent) );
                    return true;
                }else if( (obj.hostComponent as ${skinComponentClass}).skinClass !== newClass )
                {
                    (obj.hostComponent as ${skinComponentClass}).skinClass = newClass;
                    return true;
                }
                return false;
            });
        }\n`);
    }

    content.push('function ' + classModule.classname + '(hostComponent:'+(hostComponent||"Object")+ '=null)' + '{\n' + body.join("") + '}');

    if( render.content )
    {
        content.push('\noverride protected function render():Array' + '{\n' + render.content + '\n}');
    }

    //类中成员函数
    if( scriptContent )
    {
        content.push( scriptContent );
    }
    content.push( '\n}\n}' );
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
    var project_path = config.workspace;
    if( view.charAt(0)==='@' )
    {
        view = view.substr(1);
        //获取系统路径
        project_path = config.root_path;
    }

    view =  Utils.getResolvePath(project_path, view );
    view = PATH.relative(project_path, view ).replace(/\\/g,'/');
    var filename = view.replace(/\//g,'.');
    var filepath = Utils.getResolvePath( project_path , view );

    //是否加载系统库中的文件
    if( filename.indexOf( config.system_lib_path_name+'.' )===0 )
    {
        filepath = PATH.resolve( config.system_lib_path, filename.replace(/\./g, '/' ) ).replace(/\\/g,'/');
    }

    filepath = filepath+config.skin_file_suffix;

    if( !Utils.isFileExists(filepath) )
    {
        throw new Error('Not found skin. for "'+filepath+'"');
    }

    //检查源文件的状态
    var stat = FS.statSync( filepath );

    //源文件修改过的时间
    var statId = Math.ceil( new Date(stat.mtime).getTime() / 1000 ) ;

    //如果是已经加载过
    if( loadedSkins[ filename ] && loadedSkins[ filename ].uid === statId )
    {
        return null;
    }

    var classModule = {};
    classModule.uid = statId;
    classModule.isModify = !!loadedSkins[ filename ];
    loadedSkins[ filename ] = classModule;
    
    Utils.info('Checking skin file '+filepath);
    var content = Utils.trim( Utils.getContents( filepath ) );
    if( !content )
    {
        Utils.warn( filepath+" is empty." );
        return null;
    }

    var xml = libxml.parseXmlString( content ,{noblanks:false,nocdata:false} );
    var element = xml.root();
    var name = element.name();
    var namespace = getNamespace(element).name;
    var fullname =  namespace ? namespace+'.'+name : name;
    var index = filename.lastIndexOf('.');
    var isMakeView = name==="View";
    var context=getSkinObject( isMakeView ? 'html' : 'div');
    createModulObject(classModule,fullname, filename, filepath);
    context.isContextModule = true;
    context.components=[];
    context.imports=[fullname];
    context.isMakeView = isMakeView;
    context.loadResourceFiles=[];
    context.style=[];
    context.script=[];
    context.declares=[];
    context.hash={};
    context.initProperties = [];
    context.initSelfProperty = [];
    context.stateProperties = [];
    context.defineStates = {};
    context.defineStateGroups = {};
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
    context.classProperties={};
    context.assets={};

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
            classModule.script = makeClientScript( context, skinObject, isMakeView );
        }

        //是一个视图
        classModule.isMakeView = isMakeView;
        classModule.isSkin = true;

        if (isMakeView)
        {
            classModule.viewContent = skinObject;
            classModule.viewMaker = function (callback)
            {
                return createClientApplicationView(skinObject,context,callback);
            }
        }
        return classModule;

    }catch (e)
    {
        if( config.debug )
        {
            console.log( e );
        }
        throw new Error( e.message + "\n at "+filepath );
    }
}


/**
* 获取指定组件属性的引用
*/
function getComponentPropertyDescriptor( propertyObject, value,component, context, topScope )
{
    var target={items:[],value:null, target:propertyObject};
    var property = [ propertyObject ];

    if(propertyObject.definedStateName)
    {
        target.stateName = propertyObject.definedStateName;
    }

    //属于显示对象的元素或者属性都可以定义状态机 
    if( propertyObject.definedIncludeState && propertyObject.parent && propertyObject.parent.isDisplayElement )
    {
        target.definedIncludeState = propertyObject.definedIncludeState;
    }

    // 判断value是否为一个属性的引用还是值
    //对属性值的引用, 循环找出最后一个属性
    while( value instanceof Array && value.length===1 && value[0].isProperty )
    {
        property.push( value[0] );
        value = value[0].children;
    }

     var lastPropertyObject = property[ property.length-1 ];
     var defaultType = null;
     var okValue = null;

    //默认会把属性下的文本元素存放到 attrdata.content 属性中
    //<component:property>value</component:property>
    if( lastPropertyObject.isProperty && value instanceof Array && value.length=== 0 )
    {
        if( lastPropertyObject.bindAttrs.hasOwnProperty( lastPropertyObject.name ) )
        {
            okValue = lastPropertyObject.bindAttrs[lastPropertyObject.name].value;
            target.bind = lastPropertyObject.bindAttrs[lastPropertyObject.name];
            
        }else if( lastPropertyObject.attrdata.content )
        {
            defaultType = "String";
            value = [lastPropertyObject.attrdata.content];
        }
    }
  
    do{
        //属性对象  
        var object = property.shift();
        //属性描述
        var desc = object.description;
        //属性链引用
        target.items.push({name:object.name,desc:desc,target:object});

    }while( property.length > 0 );

    if( target.items.length > 0 )
    {
        var prop = target.items[ target.items.length -1 ];
        var desc = prop.desc;
        if( !( (desc.isAccessor && desc.value.set) || desc.isFunAccessor) )
        {
            throw new ReferenceError("Property is not setter. for '"+prop.name+"'")
        }
        desc = desc.isFunAccessor ? desc : desc.value.set;
        target.desc = desc;
        if( okValue )
        {
             target.value = okValue;

        }else if( value )
        {
            var type = desc.paramType && desc.paramType[0] ? desc.paramType[0] : desc.param[0] || defaultType;
            if( type === "*" || !type )
            {
                if( value instanceof Array && value.length === 1 && typeof value[0] ==="string" )
                {
                    value = value[0];
                }
                if( typeof value ==="string")
                {
                    type = /^[\-\+]?[\d\.]+$/.test(value) ? "Number": "String";
                }else if( value.length > 1 )
                {
                    type = "Array";
                }else{
                    type = "Object";
                }
            }

            target.value=getValueByType( value, type , context , topScope );
        }
    }
    return target;
}


/**
* 获取组件已经定义的属性
* 需要生成的元素属性 attributes
* 有定义的状态属性 defineAttributeStates
* 动态绑定的属性 bindAttributes
* 在生成构建元素的，属性状态机，单向绑定（状态机），双向绑定（状态机），事件属性，组件方法属性时都必须先调用此方法。
*/
function getComponentDefinedProperties( component , context, topScope, callback )
{
    if( component.__$properties__ )
    {
        return component.__$properties__;
    }

    var properties = [];
    var isSkin = component.isSkin;
    //元素上的静态属性对象
    //在对象本身设置的属性
    component.attributes={};
    //动态属性对象
    component.bindAttributes={};
    var defineAttributeStates = component.defineAttributeStates || {};
    var hasState = false;
    var filter={};

    if( component.isComponent )
    {
        (component.children||[]).forEach(function(child){

            //每一个属性必须设置有命名空间
            //每一个属性上的描述符不是类标识符
            if( child.isProperty )
            {
                var target = getComponentPropertyDescriptor( child, child.children ,component, context, topScope );
                if( target.value === null )
                {
                    throw new ReferenceError("set property is cannot empty.");
                }
                properties.push( target );

            }else if( child.isCommand && callback )
            {
                callback(child);
            }
        });

        Utils.forEach(component.attrdata,function(value,name)
        {
            if( component === context )
            {
                var _name = name.toLowerCase();
                if( _name==="charset" || _name==="http-equiv" || _name==="httpequiv" || _name==="content")
                {
                    return;
                }
            }

            if( !( ( isSkin || (component.isDisplayElement && !component.isSkinComponent) ) && name ==="name") )
            {
                var nIndex = name.lastIndexOf(".");
                var stateName = '';
                var bind = component.bindAttrs.hasOwnProperty(name) ? component.bindAttrs[ name ] : null;
                value = bind ? bind.value : parseValueString(value).okValue;
                //组件只能显示对象元素允许定义状态机
                if( component.isDisplayElement )
                {
                    if( nIndex > 0 ){
                        stateName = name.substr(nIndex+1);
                        name = name.substr(0,nIndex);
                        hasState = true;
                    }
                }

                var isBindEvent = !!Utils.getEventType( name );
                var desc = isBindEvent ? null : getClassPropertyDesc(name, component, context, true);
                if( desc && desc.isAccessor && desc.value && desc.value.set )
                {
                    var _type =  desc.isAccessor ? desc.param[0] : desc.value.set.paramType[0];
                    properties.push({
                        stateName:stateName,
                        items:[{name:name,desc:desc}],
                        desc:desc,
                        bind:bind,
                        value: bind ? value : getValueByType(component.attrdata[name], _type==="*" ? "String" : _type ,context, topScope)
                    });

                }
                //皮肤组件的属性必须在组件中定义
                else if( (isSkin || component.isDisplayElement) && !(component.isSkinComponent && !isBindEvent && name!=="content" ) )
                {
                    if( stateName )
                    {
                        var states = defineAttributeStates[ name ] || (defineAttributeStates[ name ]={items:[],value:null});

                        //没有定义状态的属性为默认
                        //如果设置为状态默认属性，原有的必须删除 
                        if( !states.value )
                        {
                            if( component.attrdata.hasOwnProperty(name) )
                            {
                                //如果默认值有绑定优先使用
                                var defualtValue = component.bindAttrs.hasOwnProperty(name) ? component.bindAttrs[name] : null;
                                if( defualtValue && bind )
                                {
                                    //默认值不是双向绑定的属性, 双向绑定的属性不能设置默认值为单向属性
                                    if( !(bind.isTwoWayBind || defualtValue.isTwoWayBind) )
                                    {
                                        states.value = defualtValue;
                                    }

                                }else
                                {
                                   states.value = parseValueString( component.attrdata[name] ).okValue;
                                }
                                if( states.value )
                                {
                                    filter[ name ] = true;
                                    delete component.attributes[ name ];
                                    delete component.bindAttributes[ name ];
                                }
                            }
                        }
                        states.items.push({value:value,name:name,stateName:stateName,bind:bind});

                    }else
                    {
                        if( bind )
                        {
                            component.bindAttributes[ name ] = {name:name,value:value,bind:bind};
                        }else{
                            component.attributes[ name ] = value;
                        }
                    }
                     
                }else
                {
                    throw new ReferenceError("Property is not defined. for '"+(component.fullclassname||component.classname)+"::"+name+"'");
                }
            }
        });

    }else
    {
    
        //处理元素属性
        Utils.forEach(component.attrdata,function(value,name)
        {
            if( filter[ name ] === true )return;
            var nIndex = name.lastIndexOf(".");
            var stateName = '';
            var bind = component.bindAttrs.hasOwnProperty(name) ? component.bindAttrs[ name ] : null;
            value = bind ? bind.value : parseValueString( value ).okValue;
            if( nIndex > 0 ){
                stateName = name.substr(nIndex+1);
                name = name.substr(0,nIndex);
                hasState = true;
            }

            if( stateName )
            {
                var states = defineAttributeStates[ name ] || (defineAttributeStates[ name ]={items:[],value:null});

                //没有定义状态的属性为默认
                //如果设置为状态默认属性，原有的必须删除 
                if( !states.value )
                {
                    if( component.attrdata.hasOwnProperty(name) )
                    {
                        //如果默认值有绑定优先使用
                        var defualtValue = component.bindAttrs.hasOwnProperty(name) ? component.bindAttrs[name] : null;
                        if( defualtValue && bind )
                        {
                            //默认值不是双向绑定的属性, 双向绑定的属性不能设置默认值为单向属性
                            if( !(bind.isTwoWayBind || defualtValue.isTwoWayBind) )
                            {
                                states.value = defualtValue;
                            }

                        }else
                        {
                           states.value = parseValueString( component.attrdata[name] ).okValue;
                        }
                        if( states.value )
                        {
                            filter[ name ] = true;
                            delete component.attributes[ name ];
                            delete component.bindAttributes[ name ];
                        }
                    }
                }
                states.items.push({value:value,name:name,stateName:stateName,bind:bind});

            }else
            {
                if( bind )
                {
                    component.bindAttributes[ name ] = {name:name,value:value,bind:bind};
                }else{
                    component.attributes[ name ] = value;
                }
            }
        });
    }
    if( hasState )
    {
        component.defineAttributeStates= defineAttributeStates;
        context.__hasUseState__ = true;
    }
    component.__$properties__ = properties;
    return properties;
}


/**
* 获取组件需要的构造参数
*/
function getComponentConstructParams(component , context, topScope, isSkin , attrString , childScope )
{
    var params = [];
    var elements = [];
    var paramTypes = (component.description && component.description.constructor.paramType) || [];
    var componentType = null;
    if( component.description )
    {
        componentType = component.description.fullclassname || component.description.type;
    }
   
    //如果是皮肤并前没有定义渲染组件，则需要把组件下的元素转换构造参数处理
    if( !(component.isSkin && !component.hasDefinedRenderProperty) )
    {
         //获取所有不是属性的元素，这些元素都当数据处理
        (component.children||[]).forEach(function(child)
        {
            if( !child.isProperty )
            {
                elements.push(child);
            }
        });
    }

    topScope = Utils.merge({}, topScope );
    topScope.ownerModule = component;
    isSkin = component.isSkin || isSkin;
    if( isSkin )
    {
       params.push( '"'+(component.name)+'"' );
       if( attrString ) 
       {
          params.push( attrString );
       }
    }

    //非显示对象组件
    if( !component.isDisplayElement && elements.length > 0 )
    {
        var types = paramTypes.length > 0 ? paramTypes : [componentType];
        var toArray = types.length === 1 && types[0]==="*" && elements.length > 1;
        if( paramTypes.length === 0  )
        {
            params.push( getValueByType( elements, componentType, context, topScope , true ) );
            return params;
        }

         //每一个参数的类型必须对应
         params = types.map(function(type)
         {
             var elem = elements; 
             if( !toArray )
             {
                elem = elements.shift();
                if( type ==="*" )
                {
                    type = "Object";
                    if( typeof elem === "string" )
                    {
                        type = /^([\-\+]?[\d\.]+)$/.test( elements[0] ) ? "Number" : /^(true|false)$/i.test( elements[0] ) ? "Boolean" : "String";
                    }

                }else if( type ==="Element" )
                {
                    var value = getValueByType( elem, "String" , context, topScope );
                    if( !value || !value.match(/^\[a-zA-A]+\w+$/) )
                    {
                        throw new TypeError("Failed parse component construct param for '"+(component.fullclassname||component.classname)+"'");
                    }
                    return "new Element(document.createElement(\""+value+"\"))";
                }
            }
            return getValueByType(elem, type , context, topScope);
         });
        return params;
    }

    //如果是一个显示对象元素，则需要把剩下的元素转换成子级显示对象元素
    if( component.isDisplayElement && elements.length > 0  )
    {
        if( !childScope.hasChildren )
        {
            if( component.hasChildCommand )
            {
                childScope.contentStack.unshift( "var "+createUniqueArrayRef(component)+":Array=[];" );
            }
            childScope.hasChildren = elements.length > 0;
        }

        while( elements.length > 0 )
        {
            var elem = elements.shift();
            var content = makeRenderScript(elem,context,component,topScope,topScope.forLevel,topScope.keyPrefix,childScope.childrenRefs);
            if( content )
            {
                childScope.contentStack.push( content );
            }
        }
        return params;
    }

    //存在多余的参数
    if( elements.length > 0 )
    {
        throw new TypeError("There are redundant elements in '"+component.fullclassname+"'");
    }
    return params;
}

/**
* 获取已经定义的状态属性
* 此方法会生成事件和元素的状态属性。
* 带有绑定的引用也会生成，双向绑定的除外。
*/
function getDefinedStateProperties(skin, stateObject, stateHandle, topScope )
{
    if( !stateObject )
    {
        return null;
    }
    var properties = {};
    var events={};
    Utils.forEach(stateObject,function(state,name)
    {
        var items = state.items.slice(0);
        var len = items.length;
        var index = 0;
        var expression = [];
        var hash = {};
        var eventType = Utils.getEventType( name );
        var defaultValue = eventType ? "null" : '""';
        if( state.value )
        {
            defaultValue = typeof state.value ==="object" && !(state.value.bind && state.value.bind.isTwoWayBind) ? state.value.value : state.value;
        }

        for(;index<len;index++)
        {
            var item = items[index];
            if( !(item.bind && item.bind.isTwoWayBind) )
            {
                if( hash[item.stateName] )
                {
                      throw new ReferenceError("State property has already defined the '"+item.stateName+"'");
                }
                hash[item.stateName]=true;
                expression.push( stateHandle+".includeIn("+parseValueString(item.stateName).okValue+") ? "+item.value)
            }
        }

        if( expression.length > 0 )
        {
            expression.push( defaultValue );
            if( eventType ){
                events[ name ]= expression.join(" : ");
            }else{
                properties[name]=expression.join(" : ");
            }
        }
    });
    return {attrs:properties,events:events};
}

function getWatchExpression(name, target, nodeTarget, propName, topScope )
{
    var param =[parseValueString( name , true, true).okValue,nodeTarget,parseValueString( propName , true, true).okValue];
    if( target !== topScope.Context )
    {
        param.push(target);
    }
    return topScope.Context+".watch("+param.join(",")+")";
}

function getUnwatchExpression(target, nodeTarget, propName, topScope )
{
    var param =[nodeTarget,parseValueString( propName , true, true).okValue];
    if( target !== topScope.Context )
    {
        param.push(target);
    }
    return topScope.Context+".unwatch("+param.join(",")+")";
}

/*
* 仅获取双向绑定的属性
* 包含带有状态机的双向绑定属性也一同返回
*/
function getAttributesTwoWayBinding( skin, context, topScope ,isPublic)
{
    var content=[];
    var _hasState = false;
    var nodeTarget = skin===context ? topScope.Context : createUniqueRefId( skin );
    if( isPublic && !skin.definedIncludeState && skin !== context )
    {
        nodeTarget = topScope.Context+"."+nodeTarget;
    }
    Utils.forEach(skin.bindAttributes,function(item,propName)
    {
        if( item.bind.isTwoWayBind )
        {
            var prop = item.bind.twoWayBindProps[0];
            var name = prop.pop();
            var target = prop.join(".");
            content.push( getWatchExpression(name, target, nodeTarget, propName, topScope )+';' );
        }
    });

    //带有状态机的双向绑定
    Utils.forEach(skin.defineAttributeStates,function(state,propName)
    {
        var defaultValue = null;
        var hasDefaultValue = !!(typeof state.value === "object" && state.value && state.value.bind && state.value.bind.isTwoWayBind);
        var items = state.items.slice(0);
        var hasState = items.length > 0;
        var expression = [];
        var targets=[];
        var len = state.items.length;
        var i = 0;
        var eventType = Utils.getEventType( propName );
        if( hasState )
        {
            _hasState = true;
        }

        for(;i<len;i++)
        {
            var item = state.items[i];
            if( item.bind && item.bind.isTwoWayBind )
            {
                var prop = item.bind.twoWayBindProps[0];
                var name = prop.pop();
                var target = prop.join(".");
                if( targets.indexOf(target) < 0  )
                {
                    targets.push( target );
                }
                expression.push( "if( "+topScope.StateHandle+".includeIn("+parseValueString(item.stateName).okValue+") ){\n"+getWatchExpression(name, target, nodeTarget,propName,topScope )+";\n}");
            }
        }

        if( hasDefaultValue )
        {
            var prop = state.value.bind.twoWayBindProps[0];
            var name = prop.pop();
            var target = prop.join(".");
            defaultValue= getWatchExpression(name, target,nodeTarget, propName, topScope );

        }else if( targets.length > 0 && expression.length > 0 )
        {
            defaultValue = "";
            targets.forEach(function(target){
                defaultValue+=getUnwatchExpression(target, nodeTarget, propName, topScope)+";";
            });
        }

        //至少有一个双向绑定的属性
        if( expression.length > 0 )
        {
            if( defaultValue )
            {
                content.push( expression.join("else ")+"else{\n"+defaultValue+"\n}" );
            }else{
                content.push( expression.join("else ") );
            }
           
        }else if( hasDefaultValue )
        {
            content.push( defaultValue );
        }
    });
    return {content:content,hasState:_hasState};
}

/**
* 获取元素的属性。
* 返回单向绑定或者静态属性,包含事件属性
* @param flag 为true返回动态属性否则为静态属性
*/
function getElementAttributes(skin, topScope, flag)
{
    var attributes={};
    var bindEvents = {};
    var innerHTML = null;
    var target = flag ? skin.bindAttributes : skin.attributes;
    for( var p in target )
    {
        //文本内容
        if( p === "content" && (!skin.children || skin.children.length===0) )
        {
            innerHTML = flag ? target[p].value : target[p];

        }else
        {
            if( flag )
            {
                //双向绑定的属性稍后处理
                if( target[p].bind && target[p].bind.isTwoWayBind )
                {
                    continue;
                }
                var eventType = Utils.getEventType( p );
                if( eventType ){
                    bindEvents[eventType]=target[p].value;
                }else{
                    attributes[p] =target[p].value;
                }

            }else
            {
                attributes[p] = target[p];
            }
        }
    }
    return {attrs:attributes,innerHTML:innerHTML,events:bindEvents};
}

 //获取渲染组件的作用域
function getRenderScope(component, contextType, context, topScope)
{
    if( component===true || ( component.isComponent && (component.isRenderComponent || (component.isSkin && !component.hasDefinedRenderProperty) ) ) )
    {
        while( contextType && !(contextType.isComponent && contextType.isSkin && contextType.isDisplayElement) )
        {
            contextType = contextType.parent;
        }
        return {
            declaration:[],
            beforeStack:[],
            properties:topScope.properties||[],
            afterStack:[],
            topStack:topScope.topStack||[],
            childCount:topScope.childCount||0,
            contentStack:[],
            DOMRender:topScope.DOMRender||"DOMRender",
            Context:topScope.Context||"Context",
            ContextType:contextType ? contextType.fullclassname : context.baseSkinclass,
            StateHandle:topScope.StateHandle||"stateGroup",
            keyPrefix:topScope.keyPrefix||"",
            forLevel:topScope.forLevel||0
        }
    }
    return topScope;
}

//生成动态渲染皮肤的脚本
function makeRenderScript(skin, context, parent, topScope, forLevel, keyPrefix, container)
{
    var DOMRender = topScope.DOMRender;
    var Context = topScope.Context;
    if( !skin.isCommand )
    {
        if( topScope.childCount ){
            topScope.childCount++;
            context.totalChildCount++;
        }else{
            topScope.childCount=1;
            context.totalChildCount = 1;
        }
    }

    var uniqueKey = context.totalChildCount;
    if( typeof skin === "string" )
    {
        var param = [keyPrefix ? keyPrefix : 0, uniqueKey, '"text"', parseValueString(skin).okValue ];
        return DOMRender+".createElement("+param.join(",")+");";
    }

    var tag = skin.name;
    var children = skin.children || [];
    var attr = skin.attrdata || {};
    var childContent = [];
    var isCommand = skin.isCommand;
    var len = children.length;
    var c = 0;
    var childrenReference = isCommand ? container : [];
    var hasChildren = false;
    forLevel = forLevel||0;
    if( isCommand )
    {
        var lowerName = skin.name.toLowerCase();
        if( skin.isForeachCommand )
        {
            if( !keyPrefix )
            {
                keyPrefix = "__FOR"+(context.forCommandCount||0)+"__";
            }
            context.forCommandCount = (context.forCommandCount||0)+1;
            forLevel++;
        }
    }

    topScope.keyPrefix = keyPrefix;
    topScope.forLevel = forLevel;

    //解析子级元素
    if( !( skin.isComponent ) || skin === context )
    {
        for (;c<len;c++)
        {
            var child = children[c];
            if( child.isProperty !== true )
            {
                //将子元素转换成脚本    
                var str = makeRenderScript(
                     child,
                     context, 
                     isCommand && parent? parent : skin,
                     topScope, 
                     forLevel,
                     keyPrefix, 
                     childrenReference
                );
                //如果有内容则追加到数组中
                if( str || childrenReference.length>0 )
                {
                    hasChildren = true;
                    str && childContent.push(str);
                }
            }
        }
    }

    topScope.contentStack = childContent;

    //一个命令元素
    if( isCommand )
    {
        var bindCommand = null;
        var tagName = tag.substr(1).toLowerCase();
        var code =  [];
      
        //如果是一个循环命令则需要初始化增量值
        if( skin.isForeachCommand )
        {
            //初始化一个循环增量值
            if( forLevel===1 ){
                topScope.declaration.push( "var "+keyPrefix+":int=0;" );
            }
            //在循环结束后增量加1
            childContent.push( keyPrefix+"++;" );
        }

        if( !make_skin_factory[ tagName ] )
        {
            throw new TypeError("Invalid '"+tagName+"' command.")
        }
        var codeContent =  tagName==="cdata" ? skin.content : childContent.join("\n");
        
        //构建一个命令脚本
        code.push( make_skin_factory[ tagName ](attr, codeContent, children.length > 0 ) );
        
        //绑定的命令，每次调度时都需要更新一下子级列表 
        if( bindCommand )
        {
            code.unshift( "var "+createUniqueArrayRef(parent||skin)+":Array=[];" );
            code.push( DOMRender+".updateChildren("+createUniqueRefId(parent||skin)+","+createUniqueArrayRef(parent||skin)+","+skin.childIndex+");");

            var stateName = getUniqueVar();
            //生成一个绑定器 
            var bindFnContent = 'function('+stateName+':Object,'+bindCommand.join(':*')+":*"+","+createUniqueRefId(parent)+":Object){\n"+code.join("\n")+'\n};';
            var bindParam = ['["'+bindCommand.join('","')+'"]', createUniqueRefId(skin), createUniqueRefId(parent||skin) ];
            topScope.declaration.push( "var "+createUniqueRefId(skin)+":Function = "+bindFnContent );
            topScope.afterStack.push( DOMRender+'.binding('+bindParam.join(",")+');' ); 
            return null;
        }
        return code.join("\n");
    }
    //一个组件或者是元素
    else{

         //是否为公开的元素
        var isPublic = skin.id && skin.isPrivate !==true;
         //元素定义的属性
        var properties = getComponentDefinedProperties( skin, context , topScope);
        //双向绑定的属性
        var propertyTwoWayBinding = getAttributesTwoWayBinding( skin, context, topScope , isPublic );
         //生成元素静态属性上的状态机
        var stateProperties = getDefinedStateProperties(skin,skin.defineAttributeStates, topScope.StateHandle, topScope );
        //获取静态属性
        var elementAttributes = getElementAttributes( skin ,topScope);
        var staticAttr = elementAttributes.attrs;
        var innerHtml = elementAttributes.innerHTML;
        //获取动态属性
        var bindAttributes = getElementAttributes(skin,topScope,true);
        var bindAttr = bindAttributes.attrs;
        var eventAttr = bindAttributes.events;
        var dynamicAttr = [];
        var bindEvents = [];
        var attributes=[];
        
        //元素的文本内容 
        if( bindAttributes.innerHTML )
        {
            innerHtml = bindAttributes.innerHTML;
        }

        //全局头元素直接返回
        if( context.isMakeView )
        {
            switch( skin.name.toLowerCase() )
            {
                case "title" :
                    if( bindAttributes.innerHTML )
                    {
                        childContent.push("hostComponent.title="+(innerHtml)+" as String;");
                    }
                case "meta" :
                case "script" :
                    context.gloableElementList.head.children.push( skin );
                    return childContent.join("\n");
                case "head" :
                    return childContent.join("\n");
                break;
            } 
        }

        //如果有子级元素命令，需要声明一个存放子级元素的数组
        if( skin.hasChildCommand && hasChildren)
        {
            childContent.unshift( "var "+createUniqueArrayRef(skin)+":Array=[];" );
            skin.childrenRefName=createUniqueArrayRef(skin);
        }
       
        var attrRefName = null;
        if( stateProperties )
        { 
            Utils.merge( eventAttr, stateProperties.events );
            for( var p in stateProperties.attrs )
            {
                dynamicAttr.push('"'+p+'":'+stateProperties.attrs[p]);
            }
        }

        //生成事件属性
        for( var eventType in eventAttr )
        {
            bindEvents.push( '"'+eventType+'":'+eventAttr[eventType] );
        }

        //生成元素的动态属性
        for( var p in bindAttr )
        {
            dynamicAttr.push('"'+p+'":'+bindAttr[p]);
        }

        //生成元素的静态属性对象
        for( var p in staticAttr )
        {
            attributes.push('"'+p+'":'+staticAttr[p]);
        }

        //元素初始化的属性
        if( attributes.length > 0 )
        {
            var attrValue  = "{"+attributes.join(",")+"}";
            if( topScope.staticPropertiesHash[ attrValue ] )
            {
                attrRefName = topScope.staticPropertiesHash[ attrValue ];

            }else
            {
                attrRefName = getUniqueVar(context);
                topScope.staticPropertiesHash[ attrValue ] = attrRefName;
                topScope.staticProperties[ attrRefName ] = attrValue;
                //topScope.topStack.push("var "+attrRefName+":Object={"+attributes.join(",")+"};");
            }
            attrRefName="attrs."+attrRefName;
        }

         //此元素是否在其它地方有被引用到
        var hasReference = isPublic || properties.length > 0 || skin.hasChildCommand || 
        (propertyTwoWayBinding.content.length > 0) || ( (bindEvents.length>0||dynamicAttr.length >0) && skin.isComponent);

        //是否需要追加到数组中
        //如果父级是一个命令或者在同辈元素中有子级命令
        //如果是一个根元素并且存在子级元素命令
        var needPushToArray = ( skin.parent && (skin.parent.isCommand || skin.parent.hasChildCommand) ) || ( skin===context && skin.hasChildCommand);
        //元素的唯一key
        var uukey = keyPrefix ? keyPrefix : 0;
        //生成根皮肤元素的属性或者方法
        if( skin === context )
        {
            //如果此对象下有子级元素
            if( hasChildren )
            {
                container.splice.apply(container, [0,0].concat(
                    childrenReference.length > 0 ? childrenReference : createUniqueArrayRef(skin)
                ));
            }

            if( properties.length > 0 )
            {
                var componentProps = makeComponentPropertiesMothod(skin, properties, topScope);
                if( componentProps )
                {
                    if( componentProps.init.length > 0 )
                    {
                        topScope.topStack.push( componentProps.init.join("\n") );
                    }
                    if( componentProps.update.length > 0 )
                    {
                        topScope.topStack.push( componentProps.update.join("\n") );
                    }
                }
            }

            if( propertyTwoWayBinding.content.length > 0 )
            {
                topScope.topContentStack.push( propertyTwoWayBinding.content.join("\n") );
            }

            //元素对象的静态属性
            if( attrRefName )
            {
                topScope.topContentStack.push( DOMRender+".attributes(this.element, "+attrRefName+");");
            }
            //元素对象的动态属性
            if( dynamicAttr.length > 0 )
            {
                 topScope.topContentStack.push( DOMRender+".attributes("+Context+".element,{"+dynamicAttr.join(",")+"});");
            }
            //元素对象的动态属性
            if( bindEvents.length > 0 )
            {
                topScope.topContentStack.push( DOMRender+".bindEvent("+[uukey,uniqueKey,"this","{"+bindEvents.join(",")+"}"].join(",")+");");
            }
        }
       
        //创建一个组件
        else if( skin.isComponent )
        {
            var classname = skin.fullclassname || skin.classname;
            var classType = (skin.classType ? skin.classType :classname);
            var componentContent = [];
            var newComponentParam = [];
            var _topScope = getRenderScope(skin, parent, context, topScope);
            var _childScope={
                childrenRefs:_topScope===topScope ? childrenReference : [],
                contentStack:_topScope===topScope ? childContent : _topScope.contentStack,
                hasChildren:hasChildren,
            }
            newComponentParam = getComponentConstructParams(skin,context,_topScope,false,attrRefName, _childScope);
            if( _childScope.hasChildren )
            {
                hasChildren =true;
            }
                
            //new 组件对象
            var newValue = 'new ' + classname + '(' + newComponentParam.join(",") + ')';
            var componentProps = null;
            if( properties.length > 0 )
            {
                componentProps = makeComponentPropertiesMothod(skin, properties, topScope);
            }

            //显示对象组件
            if( skin.isDisplayElement )
            {
                //皮肤元素单独获取子级元素
                if( skin.isSkin )
                {
                    //皮肤只能应用于根容器
                    throw new TypeError("Skin component can only is root node.");
                }

                //组件下面存在子级元素
                if( (hasChildren || childrenReference.length > 0) )
                {
                    hasReference = true;
                }

                var componentChildren = innerHtml;
                if( (hasChildren || childrenReference.length > 0) )
                {
                    componentChildren =  skin.hasChildCommand && hasChildren ? createUniqueArrayRef(skin) : '['+childrenReference.join(",")+']';
                }

                //构建元素需要的参数
                var param=[
                    uukey,
                    uniqueKey,
                    classname, 
                    skin.isSkinComponent ? "null": '"'+(skin.attrdata.name||"div")+'"',
                    "null",
                    "null",
                    "null",
                    "null",
                    "null"
                ];

                var indexAt = skin.isSkinComponent ? 2 : 3;
                if( attrRefName )
                {
                    indexAt = 5;
                    param.splice(indexAt,1, attrRefName);
                }

                if( !isPublic )
                {
                    //子级元素每次都需要更新
                    if( componentChildren )
                    {
                        indexAt = 4;
                        param.splice(indexAt,1, componentChildren);
                    }

                    //元素对象的动态属性
                    if( dynamicAttr.length > 0  )
                    {
                        indexAt =6;
                        param.splice(indexAt,1, "{"+dynamicAttr.join(",")+"}");
                    }

                    //绑定元素事件属性
                    if( bindEvents.length > 0 )
                    {
                        indexAt = 7;
                        param.splice(indexAt,1, "{"+bindEvents.join(",")+"}");
                    }
                }
                param.splice(indexAt+1, 6);
                newValue = DOMRender+".createComponent("+param.join(",")+")";

                 //有定义状态机
                if( skin.definedIncludeState && !(isPublic && !skin.ownerForeachCommand) )
                {
                    newValue = skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?"+newValue+":null";
                }

                //元素在其它地方有被引用到
                if( hasReference )
                {
                    //从属性中引用过来 
                    if( isPublic )
                    {
                        //循环体中的公开元素需要先声明一个数组来存放在循环中创建的元素
                        if( skin.ownerForeachCommand )
                        {
                            topScope.declaration.push( "var "+createUniquePublicArrayRef(skin,context)+":Array="+topScope.Context+"."+createUniqueRefId(skin)+";" );
                            //先清空数组中的元素
                            topScope.declaration.push( createUniquePublicArrayRef(skin,context)+".splice(0,"+createUniquePublicArrayRef(skin,context)+".length);" );

                        }else
                        {
                            //公开的属性需要从类成员属性中先引用过来
                            var _expression = topScope.Context+"."+createUniqueRefId(skin);
                            if( skin.definedIncludeState )
                            {
                                _expression = "("+skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?"+_expression+":null) as "+classType;
                            }
                            topScope.declaration.push( "var "+createUniqueRefId(skin)+":"+classType+"="+_expression+";" );
                        }
                    }
                   
                    if( !isPublic || !skin.ownerForeachCommand )
                    {
                        pushDeclareExpressionToContent( 
                            "var "+createUniqueRefId(skin)+":"+classType+"=("+newValue+") as "+classType+";",
                            skin , 
                            childContent,
                            topScope,
                            isPublic
                        );
                    }
                     
                    //需要要元素添加到数据组里面 
                    if( needPushToArray )
                    {
                        childContent.push( createUniqueArrayRef(parent||skin)+".push("+createUniqueRefId(skin)+");");
                    }else{
                        //父级元素可以对当前元素的直接引用
                        container.push( createUniqueRefId(skin) );
                    }
                }
                //不需要有引用的元素
                else
                {
                    //需要要元素添加到数据组里面 
                    if( needPushToArray )
                    {
                        childContent.push( createUniqueArrayRef(parent||skin)+".push("+newValue+");");

                    }else
                    {
                       //父级元素可以对当前元素的直接引用
                        container.push( newValue );
                    }
                }

                //组件初始化的属性
                if( componentProps  )
                {
                    if( componentProps.init.length > 0 )
                    {
                        componentContent.push( componentProps.init.join("\n") );
                    }
                    if( componentProps.update.length > 0 )
                    {
                        componentContent.push( componentProps.update.join("\n") );
                    }
                }

                //双向绑定
                if( propertyTwoWayBinding.content.length > 0 )
                {
                    componentContent.push( propertyTwoWayBinding.content.join("\n") );
                }

                if( isPublic )
                {
                    //元素对象的动态属性
                    if( dynamicAttr.length > 0 )
                    {
                        componentContent.push( DOMRender+".attributes("+createUniqueRefId(skin)+".element,{"+dynamicAttr.join(",")+"});");
                    }

                    //绑定元素事件属性
                    if( bindEvents.length > 0 )
                    {
                        componentContent.push( DOMRender+".bindEvent("+[uukey,uniqueKey,createUniqueRefId(skin),"{"+bindEvents.join(",")+"}"].join(",")+");");
                    }

                    //子级元素每次都需要更新
                    if( componentChildren )
                    {
                        if( skin.isSkinComponent )
                        {
                            componentContent.push(createUniqueRefId(skin)+".children="+componentChildren+";");

                        }else
                        {
                            componentContent.push( DOMRender+".updateChildren("+[ createUniqueRefId(skin), componentChildren].join(",")+");" );
                        }
                    }
                }

                if( componentContent.length > 0 )
                {
                    //如果存在包含状态则需要判断
                    if( skin.definedIncludeState && hasReference )
                    {
                        childContent.push( ["if(",createUniqueRefId(skin),"){\n",componentContent.join("\n"),"\n}"].join("") );
                    }else{
                        childContent.push( componentContent.join("\n") );
                    }
                }

            }
            //非元素组件
            else
            {
                if( skin.definedIncludeState && !(isPublic && !skin.ownerForeachCommand) )
                {
                    newValue = skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?"+newValue+":null";
                }

                if( hasReference )
                {
                    if( skin.isStateComponent )
                    {
                        if( skin.definedIncludeState )
                        {
                            throw new ReferenceError("State component cannot defined state property.");
                        }
                        topScope.topStack.push( "var "+createUniqueRefId(skin)+":"+classType+"="+newValue+";" );

                    }else
                    {
                        //从属性中引用过来 
                        if( isPublic )
                        {
                            if( skin.ownerForeachCommand )
                            {
                                topScope.declaration.push( "var "+createUniquePublicArrayRef(skin,context)+":Array="+topScope.Context+"."+createUniqueRefId(skin)+";" );
                                topScope.declaration.push( createUniquePublicArrayRef(skin,context)+".splice(0,"+createUniquePublicArrayRef(skin,context)+".length);" );

                            }else
                            {
                                var _expression = topScope.Context+"."+createUniqueRefId(skin);
                                if( skin.definedIncludeState )
                                {
                                    _expression = "("+skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?"+_expression+":null) as "+classType;
                                }
                                topScope.declaration.push( "var "+createUniqueRefId(skin)+":"+classType+"="+_expression+";" );
                            }
                        }

                       
                        if( !isPublic || !skin.ownerForeachCommand )
                        {
                            pushDeclareExpressionToContent( 
                                "var "+createUniqueRefId(skin)+":"+classType+"=("+newValue+") as "+classType+";",
                                skin , 
                                childContent,
                                topScope,
                                isPublic
                            );
                        }
                        
                    }
                
                    //需要要元素添加到数据组里面 
                    if( needPushToArray )
                    {
                        childContent.push( createUniqueArrayRef(parent||skin)+".push("+createUniqueRefId(skin)+");");
                    }else{
                        //父级元素可以对当前元素的直接引用
                        container.push( createUniqueRefId(skin) );
                    }

                }else
                {
                     //需要要元素添加到数据组里面 
                    if( needPushToArray )
                    {
                        childContent.push( createUniqueArrayRef(parent||skin)+".push("+ newValue +");");

                    }else
                    {
                       //父级元素可以对当前元素的直接引用
                        container.push( newValue );
                    }
                }
                
                if( componentProps )
                {
                    if( componentProps.init.length > 0 )
                    {
                         if( skin.isStateComponent ){
                            topScope.topStack.push( componentProps.init.join("\n") );
                         }else{
                            componentContent.push( componentProps.init.join("\n") );
                         }
                    }
                    if( componentProps.update.length > 0 )
                    {
                        componentContent.push( componentProps.update.join("\n") );
                    }
                }

                if( componentContent.length > 0 )
                {
                    //如果存在包含状态则需要判断
                    if( skin.definedIncludeState && hasReference )
                    {
                        childContent.push( ["if(",createUniqueRefId(skin),"){\n",componentContent.join("\n"),"\n}"].join("") );
                    }else{
                        childContent.push( componentContent.join("\n") );
                    }
                }
            }
        }
        else if( tag ==="text" && bindAttributes.innerHTML )
        {
             //需要要元素添加到数据组里面 
             if( needPushToArray )
             {
                 childContent.push( createUniqueArrayRef(parent||skin)+".push("+bindAttributes.innerHTML+");");

             }else
             { 
                 //父级元素可以对当前元素的直接引用
                 container.push( bindAttributes.innerHTML );
             }
        }
        //创建一个元素
        else{

            //构建元素需要的参数
            var param=[
                 uukey,
                 uniqueKey,
                 '"'+tag+'"', 
                 "null",
                 "null",
                 "null",
                 "null",
                 "null",
                 "null"
            ];

            var indexAt = 2;

            //如果不是一个公开元素
            if( !isPublic )
            {
                //如果此对象下有子级元素
                if( hasChildren || childrenReference.length > 0 )
                {
                    if( !skin.hasChildCommand )
                    {
                        indexAt = 3;
                        param.splice(indexAt,1,'['+childrenReference.join(",")+']'); 
                    }

                }else if( innerHtml )
                {
                    indexAt = 3;
                    param.splice(indexAt,1, innerHtml ); 
                }

                //元素对象的静态属性
                if( attributes.length > 0 )
                {
                    indexAt = 4;
                    param.splice(indexAt,1,attrRefName);
                }

                //元素对象的动态属性
                if( dynamicAttr.length > 0 )
                {
                    indexAt = 5;
                    param.splice(indexAt,1,"{"+dynamicAttr.join(",")+"}");
                }

                //绑定元素事件属性
                if( bindEvents.length > 0 )
                {
                    indexAt = 6;
                    param.splice(indexAt,1,"{"+bindEvents.join(",")+"}");
                }

            }
            //公开的元素，需要在当前代码块中生成子级元素
            else
            {
                if( innerHtml && !bindAttributes.innerHTML )
                {
                    indexAt = 3;
                    param.splice(indexAt,1, innerHtml ); 
                }

                //元素对象的静态属性
                if( attributes.length > 0 )
                {
                    indexAt = 4;
                    param.splice(indexAt,1,attrRefName);
                }

                //绑定元素事件属性
                if( bindEvents.length > 0 )
                {
                    childContent.push( DOMRender+".bindEvent("+[uukey,uniqueKey,createUniqueRefId(skin),"{"+bindEvents.join(",")+"}"].join(",")+");");
                }

                //生成元素下的子级元素
                if( (hasChildren || childrenReference.length > 0) && !skin.hasChildCommand )
                {
                    childContent.push( DOMRender+".updateChildren("+createUniqueRefId(skin)+",["+childrenReference.join(",")+"]);");

                }else if( innerHtml && bindAttributes.innerHTML )
                {
                    childContent.push( DOMRender+".attributes("+createUniqueRefId(skin)+",{\"content\":"+innerHtml+"});");
                }
            }

            //去掉为null的参数
            param.splice(indexAt+1,6);

            var expression = DOMRender+".createElement("+param.join(",")+")";
            if( skin.definedIncludeState && !(isPublic && !skin.ownerForeachCommand) )
            {
                expression = skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?"+expression+":null";
            }

            //元素在其它地方有被引用到
            if( hasReference )
            {
                //引用节点对象
                var refNodeTarget = createUniqueRefId(skin);
                if( isPublic )
                {
                    if( skin.ownerForeachCommand )
                    {
                        topScope.declaration.push( "var "+createUniquePublicArrayRef(skin,context)+":Array="+topScope.Context+"."+createUniqueRefId(skin)+";" );
                        topScope.declaration.push( createUniquePublicArrayRef(skin,context)+".splice(0,"+createUniquePublicArrayRef(skin,context)+".length);" );

                    }else{
                        var _expression = topScope.Context+"."+refNodeTarget;
                        //有定义状态机
                        if( skin.definedIncludeState )
                        {
                            _expression = "("+skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?"+_expression+":null) as Object";
                        }
                        topScope.declaration.push("var "+refNodeTarget+":Object = "+_expression+";" );
                    }
                }

                //声明一个对象的引用
                pushDeclareExpressionToContent( 
                    "var "+createUniqueRefId(skin)+":Object="+expression+";",
                    skin , 
                    childContent,
                    topScope,
                    isPublic
                );

                if( skin.hasChildCommand )
                {
                    childContent.push( DOMRender+".updateChildren("+refNodeTarget+", "+createUniqueArrayRef(skin)+");" )
                }

                //需要要元素添加到数据组里面 
                if( needPushToArray )
                {
                    childContent.push( createUniqueArrayRef(parent||skin)+".push("+refNodeTarget+");");
                }else{
                    //父级元素可以对当前元素的直接引用
                    container.push( refNodeTarget );
                }

                //元素对象的动态属性
                if( isPublic && dynamicAttr.length > 0 )
                {
                    childContent.push( DOMRender+".attributes("+refNodeTarget+",{"+dynamicAttr.join(",")+"});");
                }

                //双向绑定属性
                if( propertyTwoWayBinding.content.length > 0 )
                {
                    childContent.push( propertyTwoWayBinding.content.join("\n") );
                }

            }
            //不需要有引用的元素
            else
            {
                //需要要元素添加到数据组里面 
                if( needPushToArray )
                {
                    childContent.push( createUniqueArrayRef(parent||skin)+".push("+expression+");");

                }else
                { 
                    //父级元素可以对当前元素的直接引用
                    container.push( expression );
                }
            }  
        }

        //公开的属性
        if( isPublic && skin !== context )
        {
             var skinId = createUniqueRefId(skin);
             context.classProperties[ skinId ] = skin.classType || skin.fullclassname || skin.classname || "Object";

             //对循环体中公开元素的引用
             if( skin.ownerForeachCommand )
             {
                 context.classProperties[ skinId ] = "Array";
                 var forContainer = createUniquePublicArrayRef(skin,context);
                 childContent.push(forContainer+".push("+skinId+");");

             }else
             {
                topScope.topContentStack.push(  topScope.Context+"."+skinId+"="+skinId+";");
             }
        }
    }

    return childContent.join("\n");
}


//把当前的表达式声明在指定的代码块中
function pushDeclareExpressionToContent(expression, skin, contentStack, topScope, isPublic)
{
    //如果是在一个循环命令下就添加到当前位置
    if( skin.ownerForeachCommand )
    {
         contentStack.push(expression);
    }else
    {
        //如果是一个公开的元素或者组件，需要在构造函数中初始化
        if( isPublic /*&& !skin.definedIncludeState*/ ){
            topScope.topContentStack.push( expression );
        }else{
            //把要创建的元素或者组件声明在前面
            topScope.declaration.push( expression );
        }
    }
}


/**
* 生成一个组件需要设置的属性方法
*/
function makeComponentPropertiesMothod(component,properties,topScope)
{
    if( !component.isComponent || properties.length < 1 )return null;
    var data = {};
    var hash = {};
    var staticContent = [];
    var dynamicContent = [];
    properties.forEach(function(property)
    {
        var ref = [ component.context === component ? "this" : createUniqueRefId(component) ];
        var stateName = property.stateName||"";
        var definedIncludeState =  property.definedIncludeState;
        var stateLogic = "";
        //指定当前属性是否需要执行
        if( definedIncludeState && definedIncludeState.value )
        {
            stateName = definedIncludeState.value;
            stateLogic = definedIncludeState.logic;
        }

        var prop = property.items.pop();
        var target = null;
        while( property.items.length > 0 )
        {
            target=property.items.shift();
            if( target.desc.isAccessor )
            {
                if( !target.desc.value || !target.desc.value.get )
                {
                    throw new ReferenceError("Reference property is not getter. for '"+target.name+"'");
                }
                ref.push(target.name); 
            }else if(target.desc.isFunAccessor){
                ref.push(target.name+"()");
            }
        }

        var targetPropsRef= ref.join(".");
        ref.push(prop.name);
        var refsName = ref.join(".");
        var expre = "";
        if( hash[ refsName+stateName ] )
        {
            throw new ReferenceError("Properties already define. for '"+refsName+"'"); 
        }
        hash[ refsName+stateName ] = true;
        var state = data[ refsName ] || (data[ refsName ]={items:[],defualtValue:null});
        var expre = null;

        if( !(prop.desc.isFunAccessor || prop.desc.isAccessor) )
        {
           throw new ReferenceError("Reference property is not setter. for '"+refsName+"'"); 
        }

        var isBind = !!property.bind;

         //双向绑定
        if( property.bind && property.bind.isTwoWayBind )
        {
            var twoWayBindProps = property.bind.twoWayBindProps[0];
            var bindPropName = twoWayBindProps.pop();
            var bindTargetName = twoWayBindProps.join(".");
            expre= bindTargetName+".watch(\""+bindPropName+"\","+targetPropsRef+",\""+prop.name+"\");";
            isBind = false;

        }else
        {
            if( prop.desc.isAccessor )
            {
                expre=refsName+"="+property.value+";";
            }else if(prop.desc.isFunAccessor){
                expre=refsName+"("+property.value+");";
            }
        }

        expre = {stateName:stateName,expre:expre,logic:stateLogic,isRef:!!definedIncludeState,isBind:isBind};
        var paramType = prop.desc.isAccessor ? prop.desc.value.set.paramType[0] : prop.desc.param && prop.desc.param[0];
        var _defValue = "null";
        switch( paramType.toLowerCase() )
        {
            case "string":
               _defValue='""';
            break;
            case "int":
            case "uint":
            case "float":
            case "number":
            case "double":
            case "integer":
                _defValue='NaN';
            break;
            case "boolean":
                _defValue='!'+property.value;
            break;
        }

        if( !state.defualtValue )
        {
            state.defualtValue={expre: prop.desc.isAccessor ? refsName+"="+_defValue+";" : refsName+"("+_defValue+");" };
        }

        //如果是包函或者排除需要置空
        if( definedIncludeState )
        {
            state.defualtValue={expre: prop.desc.isAccessor ? refsName+"="+_defValue+";" : refsName+"("+_defValue+");" }
        }

        if( !stateName )
        {
            state.defualtValue = expre;
        }else{
            state.items.push(expre);
        }
    });

    var code = [];
    for(var p in data)
    {
        var state = data[p];
        if( state.items.length > 0 )
        {
            var content = [];
            var condition= "if";
            state.items.map(function(item){
                if( item.isRef ){
                    content.push( condition+"("+item.logic+topScope.StateHandle+".includeIn("+item.stateName+")){\n")
                }else{
                    content.push( condition+"("+item.logic+topScope.StateHandle+".includeIn(\""+item.stateName+"\")){\n")
                }
                content.push( item.expre )
                content.push( "\n}")
                condition="else if";
            });

            if( state.defualtValue )
            {
                 content.push( "else{\n")
                 content.push( state.defualtValue.expre );
                 content.push( "\n}")
            }

            dynamicContent.push( content.join("") );

        }else if(state.defualtValue)
        {
            if( state.defualtValue.stateName || state.defualtValue.isBind )
            {
                dynamicContent.push( state.defualtValue.expre );
            }else{
                staticContent.push( state.defualtValue.expre );
            }
        }
    }
    return {"init":staticContent,"update":dynamicContent};
}

/**
* 给指定的对象生成一个唯一的引用ID
*/
function createUniqueRefId( object , key)
{
    if( !object.id )
    {
        object.id = key || getUniqueVar();
        object.isPrivate = true;
    }
    return object.id;
}

function createUniqueArrayRef(object)
{
    if( !object.__$parentArrayRefName )
    {
         object.__$parentArrayRefName =  getUniqueVar();
    }
    return object.__$parentArrayRefName;
}

function createUniquePublicArrayRef(object,context)
{
    if( !object.__$parentArrayPublicRefName )
    {
         object.__$parentArrayPublicRefName = "__"+object.id+"__";
    }
    return object.__$parentArrayPublicRefName;
}

/**
* 生成一个皮肤对象的代码
*/
function makeRenderFactoryScript(skinObject, context, topStack, DOMRender,Context)
{
    var declaration = [];
    var beforeStack = [];
    var contentStack = [];
    var children = [];
    var afterStack = [];
    var topScope ={
        declaration:declaration,
        beforeStack:beforeStack,
        afterStack:afterStack,
        topStack:topStack||declaration,
        topContentStack:[],
        children:children,
        staticProperties:{},
        staticPropertiesHash:{},
        childCount:0,
        contentStack:contentStack,
        hasTopRender:false,
        DOMRender:DOMRender||"DOMRender",
        Context:Context||"Context",
        ContextType:skinObject.fullclassname,
        StateHandle:"stateGroup",
        forLevel:0, 
        keyPrefix:""
    };

    var content = makeRenderScript(skinObject,context,null,topScope,0,'',children);
    var body=[];
    var factory ="";

    if( content )
    {
        topScope.content=content;
    }

    body.push( "const dataset:Object=this.dataset;" );

    if( context.__hasUseState__ )
    {
        body.push( "const "+topScope.StateHandle+":State="+topScope.Context+".getCurrentStateGroup();" );
        body.push( "if(!"+topScope.StateHandle+"){\nthrow new TypeError(\"State group is not defined for '"+topScope.StateHandle+"'\");\n}" );
    }

    if( context.declares.length > 0 )
    {
       body.push(  context.declares.join("\n") );
    }

    if( !Utils.isEmpty(topScope.staticProperties) )
    {
        body.push("const attrs:Object=this.properties;");
    }

    if( topScope.declaration.length > 0 )
    {
       body.push( topScope.declaration.join("\n") );
    } 

    if( topScope.beforeStack.length > 0 )
    {
       body.push( topScope.beforeStack.join("\n") );
    }

    if( topScope.content )
    {
        body.push( topScope.content );
    }

    if( topScope.afterStack.length>0 )
    {
        body.push( topScope.afterStack.join("\n") );
    }

    if( skinObject.childrenRefName )
    {
        body.push( 'return '+skinObject.childrenRefName+';' ); 
    }else{
        body.push( 'return [\n'+topScope.children.join(",\n")+'\n];' ); 
    }
    return {topScope:topScope,content:body.join("\n")};
}

module.exports = makeSkin;