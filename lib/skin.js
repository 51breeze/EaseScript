const libxml = require('libxmljs');
const Utils  = require('./utils.js');
const PATH = require('path');

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
    var children =skin instanceof Array ? skin : skin.children || [];
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
        var type  = child.description ? child.description.type : child.attr.type;
      
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
function parseValueString(value, refer)
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
        value = value.charAt(1);
    }
    return {value:value,has:is,okValue:is ? value : /^([\d\.]+|true|false)$/i.test( value ) ? value : '"'+escapeValueString(value)+'"'};
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
    return "null";
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
        var value = child.attrdata.value || child.attrdata.content || child.attrdata.innerHTML || "null";
        var type  = child.attrdata.type;
        if( type==="*" )type = null;

        //组件或者节点元素都转成对象
        if( child.isComponent || child.isCommand || (!type && typeof child ==="object")  )
        {
            value = createComponentObjectOfValue( child, context, topScope );
            objectValue = len === 1 ? value : null;

        }else if( child.children > 0  )
        {
            //如果是一个对象
            if( child.children.length === 1 && typeof child.children[0] ==="string" )
            {
                value = parseValueString( child.children[0].toString() ).okValue;
            }else{
                value = getValueByType( child.children , type||"Object", context, topScope );
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
function willNodeElementConvertToArray(children, context, topScope )
{
    if( typeof children ==="string" )
    {
        if( children.charAt(0)==="@" )
        {
            return children.substr(1);
        }
        return "["+getValueByType( children ,"String", context, topScope )+"]";
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
        if( child.isComponent )
        {
            value = createComponentObjectOfValue(child, context, topScope);
        }else
        {
            var attr = child.attr || {}; 
            var value = attr.value;
            var type  = attr.type || "String";
            if( child.children.length > 0 )
            {
                value = willNodeElementConvertToArray(child.children, context, topScope );
            }else if(value){
                value = getValueByType( [value], type, context, topScope);
            }
        }
        content.push(value);
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

var make_skin_factory={
    'foreach': function (attr, content) {
        var key = (attr.key || '__forKey__');
        var item = (attr.value || '__forItem__');
        return 'for( var '+key+":* in "+attr.name+'){\n var '+item+":*="+attr.name+"["+key+"];\n" + content + '\n}';
        //return 'Object.forEach(' + attr.name + ' , function(' +(attr.value || 'item')+':*,'+(attr.key || 'key') + ':*){\n' + content + '\n},this);';
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
    }
};


/**
* 获取元素唯一key
*/
function uniqueKey( prefix, uid )
{
    if( prefix ){
      return prefix+"+'-"+uid+"'";  
    }
    return uid;
}

//private
function __toMakeSkinFactory(skinChildren, context, topScope, parentObject, innerHTML )
{
    parentObject = parentObject || topScope.ownerModule;
    var declaration = topScope.declaration || [];
    var beforeStack = [];
    var contentStack = [];
    var children = [];
    var afterStack =topScope.afterStack || [];
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

    var hasChildCommand = false;
    Utils.forEach(skinChildren,function(skinObject,index){
        if( hasChildCommand === false && skinObject.isCommand ){
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

     parentObject.defineRefs.forEach(function(name){
         body.push( "const "+name+":*=dataset."+name+";" );
     });

     if(  (parentObject.defineStates || parentObject.defineStateGroups) && 
        parentObject.description && 
        checkInstanceOf(parentObject, parentObject.description,context.baseSkinclass) )
    {
        body.push( "const "+_topScope.StateHandle+":State="+_topScope.Context+".getCurrentStateGroup();" );
        body.push( "if(!"+_topScope.StateHandle+"){\nthrow new TypeError(\"the '"+_topScope.StateHandle+"' state cannot be empty.\");\n}" );
    }

    if( topScope.declaration.length > 0 )
    {
       body.push( topScope.declaration.join("\n") );
    } 

    if( topScope.beforeStack.length > 0 )
    {
       body.push( topScope.beforeStack.join("\n") );
    }

    //需要一个数组来存放子级元素
    if( hasChildCommand )
    {
        contentStack.unshift( "var "+createUniqueArrayRef(parentObject)+":Array=[];" );
    }

    if( contentStack.length>0 )
    {
        body.push( contentStack.join("\n") );
    }

    if( topScope.afterStack.length>0 )
    {
        body.push( topScope.afterStack.join("\n") );
    }

    if( hasChildCommand )
    {
        body.push( 'return '+createUniqueArrayRef(parentObject)+';');
    }else{
        if( children.length === 0 && innerHTML ){
            body.push( 'return [  '+topScope.DOMRender+".createElement(0,1,\"text\","+innerHTML+')];');
        }else{
            body.push( 'return [\n'+children.join(",\n")+'\n];');
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

    var type = topScope.ContextType || "Object";
    var factory = "function("+topScope.DOMRender+":IRender,"+topScope.Context+":"+type+",dataset:Object={}){\n"+body.join("\n")+"\n}";
    if( !parentObject.description || 
        !(checkInstanceOf(context, parentObject.description, "es.interfaces.IRender", true ) || 
        checkInstanceOf(context, parentObject.description, context.baseSkinclass)))
    {
        factory = "function(){\n"+body.join("\n")+"\n}"; 
    }
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
        "defineRefs":[]
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
        //如果是一个文本节点
        if( skin.children.length===1 && skin.children[0] && typeof skin.children[0] === "string" )
        {
             attrStr.push('"innerHTML":"' + skin.children[0].replace(/"/g, '\\"') + '"')
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
function getSkinChildHtml(skin, parent, flag)
{
    var children = [];
    if( flag ===true && skin.children.length===1 && typeof skin.children[0] === "string")
    {
       return children;
    }
    Utils.forEach(skin.children,function (child) {
        if( !(child.nonChild || child.isProperty || child.isComponent || child.isSkin || child.isCommand) && !child.isGloableElement )
        {
            children.push( (parent || skin.id || "this") + ".addChildAt( new Skin('" + __toString(child) + "')," + child.childIndex + ")");
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
// function getSkinChildToString( skin, level )
// {
//     level = level || 1;
//     if( typeof skin === "string")return skin;
//     var content=[];
//     var attrStr = [];
//     var endTag = "";
//     if( level > 1 )
//     {
//         if (skin.attributeId) {
//             attrStr.push('id="' + skin.attributeId + '"');
//         }
//         for (var p in skin.attr) {
//             var attrV = Utils.trim(skin.attr[p]);
//             if (attrV)attrStr.push(p + '="' + attrV + '"')
//         }
//         if (["meta", "link", "input","base"].indexOf(skin.name) >= 0) {
//             endTag = "/";
//         }
//         if (attrStr.length > 0) {
//             content.push('<' + skin.name + " " + attrStr.join(" ") + endTag + ">");
//         } else {
//             content.push('<' + skin.name + endTag + ">");
//         }
//     }
//     if( !endTag )
//     {
//         for (var i in skin.children )
//         {
//             var item = skin.children[i];
//             //非组件的元素
//             if( !(item.nonChild || item.isProperty || item.isComponent || item.isSkin) )
//             {
//                 content.push( getSkinChildToString(skin.children[i], level + 1) );
//             }
//         }

//         if( level > 1 )
//         {
//             content.push('</' + skin.name + '>');
//         }
//     }
//     return content.join("");
// }

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
// function getChildComponents( skin )
// {
//     var children = skin.children;
//     var len = children.length;
//     var index = 0;
//     var content = [];
//     for (;index<len;index++)
//     {
//         var child = children[ index ];
//         if( child.isComponent )
//         {
//             content.push( child );
//         }
//         if( child.children && (child.isComponent || child.isProperty || child.isChildProperty) )
//         {
//             content = getChildComponents(child).concat( content );
//         }
//     }
//     return content;
// }


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
// function getAttributeValue( attrValue, type , context)
// {
//     if( attrValue.charAt(0)==='@' )
//     {
//         attrValue = attrValue.substr(1);
//         var metaData = Utils.executeMetaType( attrValue );
//         if( metaData )
//         {
//             switch ( metaData.type )
//             {
//                 case 'Skin':
//                     var source = metaData.param.source;
//                     makeSkin.loadSkinModuleDescription(context.syntax, source,  context.config , context );
//                     if (context.imports.indexOf(source) < 0)context.imports.push(source);
//                     attrValue = source;
//                     break;
//             }
//         }

//     }else
//     {
//         switch( type.toLowerCase() )
//         {
//             case 'class' :
//                 makeSkin.loadSkinModuleDescription( context.syntax, attrValue, context.config , context );
//                 if (context.imports.indexOf(attrValue) < 0)context.imports.push(attrValue);
//                 break;
//             case 'array' :
//                 attrValue='["'+attrValue.split(',').join('","')+'"]';
//                 break;
//             case 'number' :
//             case 'int' :
//             case 'uint' :
//             case 'Integer' :
//             case 'double' :
//             case 'boolean' :
//                 return attrValue;
//                 break;
//             default:
//                 attrValue='"'+attrValue+'"';
//         }
//     }
//     return attrValue;
// }

//绑定属性
// function parseBinable(attrValue, attrName, skinObject, context )
// {
//     if(attrValue && attrValue.slice(0,2) === '{{' && attrValue.slice(-2) === '}}' )
//     {
//         attrValue = attrValue.slice(2,-2);
//         attrValue = attrValue.split('|');

//         var bindname = attrValue[0].replace(/\s/g,'');
//         bindname = bindname.split('.');
//         if( bindname[0] !== 'this' )bindname.unshift('this');
//         var refname = bindname.pop();
//         var refobj =  bindname.join('.');
//         var binding = context.bindable[ refobj ] || (context.bindable[ refobj ]={name:[],bind:[]});
//         if( binding.name.indexOf(refname) < 0 )
//         {
//             binding.name.push(refname);
//         }

//         var param = {id:skinObject,attr:attrName,name:refname,flag:(attrValue[1]||'').toLowerCase()!=="false"};
//         if( skinObject.module.description )
//         {
//             var desc = getClassPropertyDesc(attrName, skinObject.module, context);
//             var isInvalid = desc && desc.id==='function' && desc.value && desc.value.set && desc.value.get;

//              //如果是一个皮肤组件
//             if( !isInvalid && skinObject.module.isSkin )
//             {
//                 var elementDesc = makeSkin.getLoaclAndGlobalModuleDescription("Element");
//                 if( elementDesc && elementDesc.proto[ attrName ] )
//                 {
//                     desc = elementDesc.proto[ attrName ];
//                     if( desc.id==="function" && desc.isFunAccessor ===true )
//                     {
//                         isInvalid = true;
//                     }
//                 }
//             }
//             if( !isInvalid )
//             {
//                 throw new TypeError('Invalid binding for "'+attrName+'"');
//             }
//         }
//         binding.bind.push( param );
//         return param;
//     }
//     return false;
// }

//获取一个值中有引用的属性名
function getValueReferenceName( value , refs )
{
    var matchs = value.replace(/([\'\"])[^\1]*\1/g,"").match(/([a-zA-Z]+\w+\.?)+/g);
    if( matchs )
    {
        matchs.forEach(function(name){
            if( name.indexOf(".") < 0  && refs.indexOf(name) < 0 )
            {
                refs.push( name );
            }
        });
        return matchs;
    }
    return null;
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
        if( twoWayBind && !/^([a-zA-Z]+\w+\.?)+$/.test(name) )
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
            getValueReferenceName(name, refs);
        }

        var props = name.split('.');
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
// function parseAttributes(attrs, skinObject, module, context , async )
// {
//     var isNew = skinObject===module && skinObject.namespace;
//     for(var p in attrs)
//     {
//         var attrName = p;
//         var attrValue = attrs[p];

//         //指定的状态属性
//         if( attrName.indexOf(".")>0 )
//         {
//             setViewportComponent(skinObject);
//             if( skinObject['stateProperties_'+ attrName ] === true )
//             {
//                 throw new Error("the state property of '"+attrName+"' already exists.");
//             }
//             skinObject['stateProperties_' + attrName] = true;

//             if( !skinObject.attributeId )
//             {
//                 skinObject.attributeId = "I-D-"+uid(context);
//             }
//             var viewport ="Element('#" + skinObject.attributeId + "')";
//             if( skinObject.isComponent && skinObject.id && skinObject.isPrivate !==true )
//             {
//                 viewport = "this."+skinObject.id+".element";
//             }
//             (skinObject.ownDataRenderContext||context).stateProperties.push({"name":attrName,"value":attrValue, "target":skinObject, "viewport":viewport});
//             continue;
//         }

//         //绑定属性
//         if( skinObject.isProperty!==true )
//         {
//             attrValue = parseBinable(attrValue, attrName, skinObject, context);
//         }

//         if( ["top","right","bottom","left"].indexOf( attrName.toLowerCase() )>=0 )
//         {
//             skinObject.attr[attrName] = attrValue;
//         }

//         //如果不是id并且有描述则检查
//         if( !(skinObject.isSkin && attrName === 'name') && attrValue && ( isNew || skinObject.isProperty===true ) && attrName !=='id' && module.description )
//         {
//             if( skinObject.isProperty===true )
//             {
//                 //调用函数属性， 合并参数
//                 // var type = (skinObject.description.paramType || skinObject.description.param)[0] || '';
//                 //( skinObject.param || (skinObject.param = []) ).push(getAttributeValue(attrValue, type, context));
//                 continue;

//             }else
//             {
//                 var desc = getClassPropertyDesc(attrName, module, context, true );
//                 if( desc )
//                 {
//                     var type = (desc.paramType || desc.param)[0] || '';

//                     //设置定义的状态名
//                     if( skinObject.fullclassname === context.stateClass )
//                     {
//                         var ownContext = skinObject.ownDataRenderContext||context;
//                         if( attrName.toLowerCase()==="name" )
//                         {
//                             if (ownContext.defineStates[attrValue] && attrName.toLowerCase() === "name") {
//                                 throw new Error('"' + attrValue + '" state has already been declared');
//                             }
//                             ownContext.defineStates[attrValue] = true;
//                         }else if( attrName.toLowerCase()==="stategroup" )
//                         {
//                             var stateGroup = attrValue.split(",");
//                             for(var s in stateGroup ){
//                                 ownContext.defineStates[ stateGroup[s] ] = true;
//                             }
//                         }
//                     }

//                     var isset = !!(desc.value && desc.value.set) || desc.isFunAccessor;
//                     if( isset )
//                     {
//                         attrValue = getAttributeValue(attrValue, type, context);
//                         setPropertyMethod(attrName, attrValue, skinObject, context, desc, async);
//                         continue;
//                     }

//                 }else if( !skinObject.isSkin && !(module.ignorePropertyNotExists === true || module.description.ignorePropertyNotExists ===true) )
//                 {
//                     throw new ReferenceError( 'property "'+attrName + '" is not exists');
//                 }
//             }
//         }
//         if( attrValue )
//         {
//             skinObject.attr[attrName] = attrValue;
//         }
//     }
// }

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

function isGloableElementNode(skinObject)
{
    switch( skinObject.name.toLowerCase() )
    {
        case "html":
        case "meta":
        case "body":
        case "base":
        case "title":
        case "head":
            return true;
    }
    return false;
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
// function setViewportComponent( skinObject )
// {
//     if( skinObject.isProperty || skinObject.context === skinObject || skinObject.isCommand === true )
//     {
//         return false;
//     }

//     if( !skinObject.id )
//     {
//         skinObject.id = '__var' + uid() + '__';
//         skinObject.isPrivate = true;
//     }
//     skinObject.isSkin = skinObject.isSkin || !skinObject.isComponent;
//     skinObject.isComponent = true;
//     return true;
// }

/**
* 合并需要引用名
*/
function mergeRefs(target, refs , exclude)
{
    var len = refs.length;
    var i = 0;
    for(;i<len;i++)
    {
        if( refs[i].indexOf(".") < 0 && target.indexOf( refs[i] ) < 0 )
        {
            if( !exclude || exclude.indexOf( refs[i] ) < 0 )
            {
                 target.push( refs[i] );
            }
        } 
    }
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
        if( context===module && parent===module )
        {
            context.script.push( Utils.trim( elem.text() ) );
        }

        if( parent.isCommand )
        {
            var cdata = getSkinObject(":cdata");
            cdata.isCommand = true;
            cdata.content = Utils.trim( elem.text() );
            return cdata;
        }
        return null;
    }

    //获取一个皮肤对象
    var skinObject=getSkinObject(name);
    //元素属性
    var attrs = elem.attrs();
    var attrdata = {};
    var bindAttrs = {};
    var oneWayBindingAttrs=[];
    skinObject.isCommand = name.charAt(0)===":";
    skinObject.assignRefs = parent && parent.assignRefs ? parent.assignRefs : [];

    for(var p in attrs)
    {
        var attrName = attrs[p].name();
        var attrValue = Utils.trim(attrs[p].value());
        var hash = '@id';
        var lowerAttrName=attrName.toLowerCase();

        //@表示公开此组件
        if( lowerAttrName==='id' )
        {
            if( attrValue.charAt(0)==='@' )
            {
                attrValue = attrValue.substr(1);
                skinObject.id = attrValue;
                //skinObject.isComponent=true;
                //skinObject.isSkin=true;
                //module = skinObject;
                hash = true;
                //默认当作皮肤组件处理
                //skinObject.fullclassname = context.baseSkinclass;
                //skinObject.classname = context.baseSkinclass.substr( context.baseSkinclass.lastIndexOf(".")+1 );
                //skinObject.description = makeSkin.getLoaclAndGlobalModuleDescription(context.baseSkinclass);
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
                    mergeRefs(skinObject.defineRefs, bind.refs, skinObject.assignRefs );
                    bindAttrs[ attrName ]=bind;
                    //oneWayBindingAttrs.push({name:attrName,value:attrValue,bind:bind,target:skinObject,isAttr:true});
                    //attrValue = null; 
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
        // if( parent.isCommand && parent.name===":code" )
        // {
        //     var cdata = getSkinObject(":cdata");
        //     cdata.isCommand = true;
        //     cdata.content = Utils.trim( elem.text() );
        //     return cdata;
        // }
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
                    /*if( !attrdata.name )
                    {
                         throw new Error('State name cannot be empty.');
                    }*/

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

                    var isDisplayElement = checkInstanceOf(context, skinObject.description, "es.interfaces.IDisplay", true);
                    if (isDisplayElement)
                    {
                        skinObject.isDisplayElement = true;
                        skinObject.isSkinComponent = checkInstanceOf(context, skinObject.description, "es.components.SkinComponent");

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
                    skinObject.isRenderComponent  = checkInstanceOf(context, skinObject.description, "es.interfaces.IRender", true);
                }
                module = skinObject;
            }
            else
            {
                var desc = null;

                //允许在每个组件的根属性上定义状态机
                // if( !(parent && parent.isProperty) )
                // {
                //     //允许属性上定义状态机
                //     var nIndex = name.lastIndexOf(".");
                //     if( nIndex > 0 )
                //     {
                //         skinObject.definedStateName = name.substr(nIndex+1);
                //         name = name.substr(0,nIndex);
                //         skinObject.name = name;
                //     }
                // }

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
    skinObject.ownerRenderComponent= skinObject.isRenderComponent ? true : !!(parent && parent.ownerRenderComponent);
    //每一个皮肤对象维护自己的独立上下文
    skinObject.ownerSkinModuleContext = context;
    if( skinObject.isSkin && skinObject.isDisplayElement )
    {
         skinObject.ownerSkinModuleContext = skinObject;
    }else if( parent && parent.ownerSkinModuleContext )
    {
         skinObject.ownerSkinModuleContext =  parent.ownerSkinModuleContext;
    }

    //如果是一个es.interfaces.IRender类型则在所属组件中标记
    if( skinObject.isProperty && checkInstanceOf(context, skinObject.description, "es.interfaces.IRender", true) )
    {
        skinObject.module.hasDefinedRenderProperty = true;
    }

    if( skinObject.isCommand && (skinObject.name===":for" || skinObject.name===":foreach") )
    {
        skinObject.ownerForeachCommand=true;
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

    //对命令代码中使用的引用收集
    var assignRefs = [];
    var isCode = false;
    if( skinObject.isCommand )
    {
        switch( skinObject.name )
        {
            case ":for" : 
                var match = attrdata.condition.match(/var\s+(\w+)/); 
                if( match ){
                    assignRefs.push( match[1] );
                }
            break;
            case ":foreach" : 
                if( attrdata.name )
                {
                    mergeRefs(skinObject.defineRefs,[attrdata.name]);
                }
                if( attrdata.value )
                {
                    assignRefs.push( attrdata.value );
                }
                if( attrdata.key )
                {
                    assignRefs.push( attrdata.key );
                }
            break;
            case ":code" :
               isCode = true;
              //skinObject.content = Utils.trim( elem.text() );  
              //return skinObject;
            break;
        }
    }

    //合并引用
    mergeRefs(skinObject.assignRefs,assignRefs);

    //子级
    var nodes = elem.childNodes();
    var hasChildCommand = false;
    if (nodes.length > 0)
    {
        var childIndex = 0;
        for (var i in nodes) 
        {
           var child = parseSkin(nodes[i], context, module, skinObject, async, childIndex);
           if( child && typeof child === "string" && !skinObject.isMetadata )
           {
                 //单向绑定
                var bind = parseTextBinding( child, context );
                if( bind.result===true )
                {
                    mergeRefs(skinObject.defineRefs, bind.refs, skinObject.assignRefs );
                }
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
                            //(bindContext.oneWayBinding || (bindContext.oneWayBinding=[])).push({name:"content",value:child,bind:bind,target:skinObject,isAttr:true});
                        }
                        //skinObject.hasBinddingValue=true;
                        child = null;

                    }
                    else if( child )
                    {
                        if( skinObject.ownerProperty ){
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
    }

    if( parent && skinObject !== parent )
    {
        if( skinObject.isRenderComponent ){
            mergeRefs(skinObject.defineRefs, skinObject.assignRefs);
        }else{
            mergeRefs(parent.defineRefs, skinObject.defineRefs, skinObject.assignRefs);
        }
    }
    skinObject.hasChildCommand = hasChildCommand;
    return skinObject;
}

/**
 * 设置初始化组件的属性
 * @param name
 * @param value
 * @param skinObject
 * @param context
 */
// function setPropertyMethod( name, value, skinObject, context , desc , async )
// {
//     desc = desc || skinObject.description;
//     if( desc )
//     {
//         var isset = !!(desc.value && desc.value.set ) || desc.isFunAccessor;
//         //自定义类必须要有setter
//         if( !isset && skinObject.module.description.nonglobal===true )
//         {
//             throw new ReferenceError(name+' is not setter');
//         }

//         var id = skinObject.module.id;
//         if( skinObject.module === context  )
//         {
//             id = 'this';
//         }

//         var ref = skinObject.initProperties;
//         var map = skinObject.mapInitProperties || (skinObject.mapInitProperties={});
//         map[ name ] = {name:name,value:value,id:id,isset: isset && !desc.isFunAccessor};
//         if (isset && !desc.isFunAccessor )
//         {
//             if( name==="skinClass"){
//                 ref.unshift(id + '.' + name + '=' + value);
//             }else {
//                 ref.push(id + '.' + name + '=' + value);
//             }

//         } else
//         {
//             if( value instanceof Array )
//             {
//                 ref.push(id + '.' + name + '(' + value.join(',') + ')');
//             }else{
//                 ref.push(id + '.' + name + '(' + value + ')');
//             }
//         }
//     }
// }

/**
 * 根据当前指定的类型获取数据
 * @param skinObject
 * @param type
 * @returns {*}
 */
function getValueByType( skinObject, type, context, topScope )
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
            value=willNodeElementConvertToArray( skinObject, context, topScope );
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
            value =__toMakeSkinFactory(skinObject,context,topScope);
            if( value ){
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
                src =  makeSkin.getLoadFileRelativePath(context.config, copyTo, "view", view_path);
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
function getServerViewHeadAndBodyElement(viewObject , context, bootstrap )
{
    var content = [];
    var version ='?v='+context.config.makeVersion;
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
    var filename =  bootstrap.fullclassname;
    var script = getSkinObject("script");
    var baseScript = getSkinObject("script");
    var link = getSkinObject("link");
    var view_path = Utils.getBuildPath(context.config, 'build.view')+"/"+package_path;

    var js_build_path = Utils.getBuildPath(context.config, 'build.js');
    var js_path = makeSkin.getLoadFileRelativePath( context.config, PATH.resolve( js_build_path,filename + '.js'), "view", view_path);

    var css_build_path = Utils.getBuildPath(context.config, 'build.css');
    var css_path =  makeSkin.getLoadFileRelativePath( context.config, PATH.resolve( css_build_path,filename + '.css'), "view", view_path)

    //视图需要引用的资源
    script.attr={"type":"text/javascript","src":js_path+version };
    link.attr={"rel":"stylesheet","href":css_path+version};
    var external_requires = context.external_requires=[];
    head.children=[meta,link,script].concat( loadResourceFiles(context, view_path, css_build_path, js_build_path,external_requires) );
   if( context.config.script_part_load )
   {
       head.children.splice(1,0, baseScript)
       baseScript.attr.type="text/javascript";
       baseScript.attr.src= makeSkin.getLoadFileRelativePath( context.config, PATH.resolve( Utils.getBuildPath(context.config, 'build.js'), "easescript.js")+version , "base" )
   }

    var headObj = context.gloableElementList.head;
    var titleSkin = getElementByName("title", headObj );
    if( titleSkin )
    {
        if( !titleSkin.hasChildTextBinding )
        {
            content.push("document.title='" + __toString(titleSkin, true, headObj, "", context.syntax) + "'");
        }
        var index = headObj.children.indexOf(titleSkin);
        headObj.children.splice(index, 1);

    }else if( !context.hasSetTitle )
    {
        content.push( "document.title='"+(viewObject.attr.title || context.classname)+"'" );
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
    var view_path = Utils.getBuildPath(context.config, 'build.view')+"/"+package_path;

    var js_build_path = Utils.getBuildPath(context.config, 'build.js');
    var js_path = PATH.relative( view_path, PATH.resolve( js_build_path,filename + '.js') ).replace(/\\/g,"/");

    var css_build_path = Utils.getBuildPath(context.config, 'build.css');
    var css_path = PATH.relative( view_path, PATH.resolve( css_build_path,filename + '.css') ).replace(/\\/g,"/");

    //视图需要引用的资源
    script.attr={"type":"text/javascript","src":js_path+version };
    link.attr={"rel":"stylesheet","href":css_path+version};

    //加载外部文件
    var external_requires = context.external_requires = [];
    var external = loadResourceFiles(context, view_path, css_build_path, js_build_path, external_requires );
    head.children=[meta,title,link,script].concat( external );

    var headObj = context.gloableElementList.head;
    var titleSkin = getElementByName("title", headObj );
    if( titleSkin )
    {
        if( !(titleSkin.defineRefs && titleSkin.defineRefs.length > 0) )
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
        metaSkin = metaSkin;
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
// function getComponentInjectionProperties( component )
// {
//     var desc = component.description;
//     var injections = [];
//     do {
//         Utils.forEach(desc.proto,function (value,name) {
//             if(value.defineMetaTypeList && value.defineMetaTypeList.Injection)
//             {
//                 var type = value.defineMetaTypeList.Injection.param.value;
//                 if( type ) {
//                     type =  makeSkin.getLoaclAndGlobalModuleDescription( getImportClassName(type, desc.import)||type );
//                     if( type.nonglobal !==true ){
//                         type = null;
//                     }
//                 }
//                 injections.push({
//                     "scope":desc.fullclassname,
//                     "target":component.id,
//                     "proto":true,
//                     "type": type ? type.fullclassname : "",
//                     "name":name,
//                     "id":value.id,
//                     "isAccessor":!!value.isAccessor
//                 });
//             }
//         });
//         Utils.forEach(desc.static,function (value,name) {
//             if( value.defineMetaTypeList && value.defineMetaTypeList.Injection )
//             {
//                 var type = value.defineMetaTypeList.Injection.param.value;
//                 if( type ) {
//                     type =  makeSkin.getLoaclAndGlobalModuleDescription( getImportClassName(type, desc.import)||type );
//                     if( type.nonglobal !==true ){
//                         type = null;
//                     }
//                 }
//                 injections.push({
//                     "scope":desc.fullclassname,
//                     "target":desc.classname,
//                     "proto":false,
//                     "type": type ? type.fullclassname : "",
//                     "name":name,
//                     "id":value.id,
//                     "isAccessor":!!value.isAccessor
//                 });
//             }
//         });

//     }while( desc.inherit && ( desc = makeSkin.getLoaclAndGlobalModuleDescription( getImportClassName(desc.inherit, desc.import ) ) ) && desc.nonglobal === true );
//     return injections;
// }

// /**
//  * 生成客户端需要的皮肤工厂函数
//  * @param classModule
//  * @param handle
//  * @param originSyntax
//  * @returns {{content: string, requirements: Array, param: Array}}
//  */
// function makeClientSkinFactory(classModule, handle , originSyntax )
// {
//     var eventType = "SkinEvent.MAKE_CLIENT_SKIN_FACTORY";
//     var serverCode=[];
//     var clientModule={
//         "proto":[],
//         "import":[classModule.baseSkinclass],
//         "construct":[],
//         "classname":classModule.classname+"FactoryTemp"
//     };

//     //嵌套的组件
//     Utils.forEach(classModule.components, function ( component )
//     {
//         if( component.async )return;
//         if ( component.isSkinComponent )
//         {
//             var isClientSupport = makeSkin.Compile.isClientSupportOf( component.description, originSyntax, true );

//             //不需要客户端支持的跳过
//             if( !isClientSupport )return;

//             var classType = component.fullclassname || component.classname;
//             var skinClass = component.attrdata.skinClass;

//             if(clientModule.import.indexOf(classType) < 0 ){
//                 clientModule.import.push(classType );
//             }
//             if(clientModule.import.indexOf(skinClass) < 0 ){
//                 clientModule.import.push(skinClass);
//             }

//             var event = getUniqueVar(classModule);
//             serverCode.push("var " + event + ":es.events.SkinEvent=new es.events.SkinEvent("+eventType+");\n");
//             serverCode.push(component.id + ".skin.dispatchEvent(" + event + ");\n");
//             clientModule.construct.push("var "+component.id+":"+classType+"= new "+classType+"();");

//             //需要注入的组件属性
//             var injectionProperties = getComponentInjectionProperties( component );
//             Utils.forEach( injectionProperties , function (item) {
//                 var injection = getUniqueVar(classModule);
//                 var propName = getUniqueVar(classModule);
//                 serverCode.push("var " + injection + ":String ="+ component.id+".valueToString("+component.id+"."+item.name+");\n");
//                 clientModule.construct.push("var "+propName+":*" + "="+"Generic(\"{Data{" + injection + "}}\");");
//                 clientModule.construct.push("if("+propName+"){\n");
//                 if( item.type )
//                 {
//                     clientModule.construct.push(item.target + "." + item.name + "=new " + item.type + "(Generic("+propName+"));");
//                     if(clientModule.import.indexOf( item.type ) < 0 )
//                     {
//                         clientModule.import.push( item.type );
//                     }

//                 }else
//                 {
//                     clientModule.construct.push( item.target+"."+item.name+"=Generic("+propName+");");
//                 }
//                 clientModule.construct.push("\n}\n");

//             });

//             clientModule.construct.push( component.id+'.skin=new '+skinClass+'('+component.id+', Generic("{Data{'+event+'.content}}"));' );
//             if (component.isPrivate !== true)
//             {
//                 clientModule.proto.push("public var "+component.id+":"+classType+";" );
//                 clientModule.construct.push("this."+component.id+"="+component.id+";" );
//             }
//             clientModule.construct.push("this.addChildAt("+component.id+","+component.childIndex+");");

//         } else if (component.isPrivate !== true)
//         {
//             clientModule.proto.push("public var "+component.id+":Skin;" );
//             clientModule.construct.push('this.'+component.id+'=new Skin("#{Skin{' + component.id + '.generateId()}}");');
//         }

//     });

//     var self = "this";
//     if( !classModule.isMakeView )
//     {
//         self = getUniqueVar(classModule);
//         clientModule.construct.unshift('super("#{Skin{' + self + '.generateId()}}");');
//     }

//     var clientCode=[
//         "import "+clientModule.import.join(";\nimport ")+";\n",
//         "public class ",
//         clientModule.classname,
//         " extends Skin{\n",
//         clientModule.proto.join("\n"),
//         "public function ",
//         clientModule.classname,
//         "(){\n",
//         clientModule.construct.join("\n"),
//         "\n}",
//         "\n}",
//     ]

//     var SkinFactoryTemp = makeSkin.loadFragmentModuleDescription( "javascript", {
//         filepath:classModule.filepath,
//         fullclassname:clientModule.classname,
//         script:clientCode.join("")
//     }, classModule.config, true);

//     var classStack = SkinFactoryTemp.content()[0];
//     var description = SkinFactoryTemp.description;
//     classStack.addListener("(defineProperty)",function (e) {
//         e.stopPropagation=true;
//     });
//     classStack.addListener("(superBefore)",function (e) {
//         e.stopPropagation=true;
//     });
//     makeSkin.Compile("javascript", classStack, description, classModule.config , true );

//     var keys = [];
//     var requirements=[];
//     Utils.forEach(description.import ,function (val, key) {
//         if( !makeSkin.globalDescriptions.hasOwnProperty( val ) )
//         {
//             keys.push(key.replace(/\./g, '_'));
//             requirements.push(val);
//         }
//     });

//     if( classModule.isMakeView )
//     {
//         keys.unshift( "System" );
//         requirements.unshift("System");
//     }

//     var content = description.constructor.value.replace(/^function\s+constructor\(.*?\)\s*\{/,"function("+keys.join(",")+"){");
//     content = content.replace(/[\t]+/g,'');
//     content = content.replace(/\{Skin\{(.*?)\}\}/g,"'+$1+'");
//     content = content.replace(/\"\{Data\{(.*?)\}\}\"/g,"'+$1+'");

//     var isTestMode = classModule.config.mode != 3;
//     if( isTestMode )
//     {
//         content = content.replace(/[\n]+/g, "\\n");
//     }else {
//         content = content.replace(/[\n]+/g, "");
//     }

//     //如果是一个视图则把皮肤工厂函数输出到客户端
//     if( classModule.isMakeView )
//     {
//         var id = getUniqueVar(classModule);
//         var wrap = "var "+id+":Node = new HTMLElement('script');\n";
//         wrap+=serverCode.join("");
//         wrap += id+".content='window[\""+handle+"\"]="+content+"';\n";
//         if( isTestMode ) {
//             wrap += id + ".content=" + id + ".content.replace(/\\n/,\"\\n\");\n";
//         }
//         wrap += "document.head.addChild( "+id+" );\n";
//         return {content:wrap,requirements:requirements,param:keys};
//     }

//     //如果是一个普通皮肤则通过事件传递皮肤工厂函数
//     var type = classModule.fullclassname || classModule.classname;
//     var wrap = 'var '+self+":"+type+"=this as "+type+";\n";
//     wrap+=serverCode.join("");
//     wrap+="this.addEventListener("+eventType+",function(event:SkinEvent){\n event.content='"+content+"';\n});\n";
//     return {content:wrap,requirements:requirements,param:keys};
// }

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
        hostComponentModule = makeSkin.loadModuleDescription(classModule.config.originMakeSyntax, hostComponent, classModule.config, hostComponent);
        if( hostComponentModule === null )
        {
            throw new TypeError("the '"+hostComponent+"' class is not exists.");
        }
        property.push("private var _hostComponent:"+hostComponent+";\n")
        property.push( "protected function get hostComponent():"+hostComponent+"{\nreturn this._hostComponent;\n}\n");

    }else
    {
        throw new TypeError("HostComponent is not define.");
    }

    //对全局皮肤的声明引用
    var globalElementReference = [];
    if( isMakeView===true )
    {
        //视图主机必须指定为入口类
        if( classModule.config.bootstrap_class_list.indexOf(  hostComponentModule.fullclassname ) < 0 )
        {
            throw new TypeError("The view HostComponent must be the bootstrap application class.");
        }
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
        "es.interfaces.IRender",
        "es.core.State",
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
        hostComponentModule = makeSkin.loadModuleDescription(classModule.config.originMakeSyntax, hostComponent, classModule.config, hostComponent);
        if( hostComponentModule === null )
        {
            throw new TypeError("the '"+hostComponent+"' class is not exists.");
        }
        property.push("private var _hostComponent:"+hostComponent+";\n")
        property.push( "protected function get hostComponent():"+hostComponent+"{\nreturn this._hostComponent;\n}\n");

    }else
    {
       // throw new TypeError("HostComponent is not define.");
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

   if( classModule.fullclassname==="view.Index" )
    {
         //console.log(content.join(""));
         //process.exit();
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

           /* if( !isMakeView && skinObject.fullclassname==="MyDataGridSkin") {
                makeChildrenFactory(skinObject, context );
            }*/

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
            classModule.viewMaker = function (callback)
            {
                return createClientApplicationView(skinObject,context,callback);
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
        target.desc = desc;
        if( okValue )
        {
             target.value = okValue;

        }else if( value )
        {
            var type = desc.paramType[0] || defaultType;
            if( !type )
            {
                type = value.length > 1 ? "Array" : "Object";
            }
            target.value= getValueByType( value, type , context , topScope );
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
function getComponentDefinedProperties( component , context, topScope )
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
            }

        });

        Utils.forEach(component.attrdata,function(value,name)
        {
            if( component === context )
            {
                name = name.toLowerCase();
                if( name==="charset" || name==="http-equiv" || name==="httpequiv" || name==="content")
                {
                    return;
                }
            }
            if( !(isSkin && name ==="name") )
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

                var desc = getClassPropertyDesc(name, component, context, true);
                if( desc && desc.isAccessor && desc.value && desc.value.set )
                {
                    properties.push({
                        stateName:stateName,
                        items:[{name:name,desc:desc}],
                        desc:desc,
                        bind:bind,
                        value: bind ? value : getValueByType(component.attrdata[name], desc.type,context, topScope)
                    });

                }else if( (isSkin || component.isDisplayElement) && !component.isSkinComponent )
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
        var filter={};

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

     //如果只需要一个参数
    if( paramTypes.length === 1 && elements.length > 0 )
    {
        var type = paramTypes[0];
        if( type ==="*" && elements.length > 1 ){
            type = "Array";
        }
        params.push( getValueByType( elements, type, context, topScope ) );
        return params;

    }else
    {
        //是一个元素对象
        if( component.isDisplayElement && !component.isSkinComponent && paramTypes.length===2 && paramTypes[0]==="Element" && paramTypes[1]==="Object" )
        {
            params.push("new Element(document.createElement(\""+(component.attrdata.name||"div")+"\"))");
            if(attrString )
            {
                params.push( attrString );
            }
        }
        //不是一个皮肤对象
        else if( !isSkin && elements.length > 0 )
        {
            //每一个参数的类型必须对应
            params = paramTypes.map(function(type){
                if( type ==="Element" )
                {
                    var elem = elements.shift();
                    var value = getValueByType( elem, "String" , context, topScope );
                    if( !value || !value.match(/^\[a-zA-A]+\w+$/) )
                    {
                        throw new TypeError("Failed parse component construct param for '"+(component.fullclassname||component.classname)+"'");
                    }
                    return "new Element(document.createElement(\""+value+"\"))";
                }
                return getValueByType( elements.shift(), type , context, topScope );
            });
        }
    }

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
           // content.push('{"prop":"'+propName+'","name":"'+name+'","target":'+target+'}');
            content.push(target+'.watch("'+name+'",'+nodeTarget+',"'+propName+'");');
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
                // if( eventType )
                // {
                //     expression.push( topScope.StateHandle+".includeIn("+parseValueString(item.stateName).okValue+") ? "+'{"prop":"'+item.name+'","name":"'+name+'","target":'+target+',"bindEvent":"'+eventType+'"}' );
                // }else{
                //     expression.push( topScope.StateHandle+".includeIn("+parseValueString(item.stateName).okValue+") ? "+'{"prop":"'+item.name+'","name":"'+name+'","target":'+target+'}' );
                // }

                if( eventType )
                {
                    expression.push( "if( "+topScope.StateHandle+".includeIn("+parseValueString(item.stateName).okValue+") ){\n "+target+'.watch("'+name+'",'+nodeTarget+',"'+propName+'","'+eventType+'");\n}');
                }else{
                   expression.push( "if( "+topScope.StateHandle+".includeIn("+parseValueString(item.stateName).okValue+") ){\n "+target+'.watch("'+name+'",'+nodeTarget+',"'+propName+'");\n}');
                }
            }
        }

        if( hasDefaultValue )
        {
            var prop = state.value.bind.twoWayBindProps[0];
            var name = prop.pop();
            var target = prop.join(".");
            // if( eventType ){
            //     defaultValue= '{"prop":"'+state.value.name+'","name":"'+name+'","target":'+target+',"bindEvent":"'+eventType+'"}';
            // }else{
            //     defaultValue= '{"prop":"'+state.value.name+'","name":"'+name+'","target":'+target+'}';
            // } 
            if( eventType ){
                defaultValue= target+'.watch("'+name+'",'+nodeTarget+',"'+propName+'","'+eventType+'");';
            }else{
                defaultValue= target+'.watch("'+name+'",'+nodeTarget+',"'+propName+'");';
            }

        }else if( targets.length > 0 && expression.length > 0 )
        {
            // if( eventType ){
            //     defaultValue= '{"unwatch":['+targets.join(",")+'],"prop":"'+propName+'","bindEvent":"'+eventType+'"}';
            // }else{
            //     defaultValue= '{"unwatch":['+targets.join(",")+'],"prop":"'+propName+'"}';
            // }
            defaultValue = "";
            targets.forEach(function(target){
                if( eventType ){
                    defaultValue+=target+'.unwatch('+nodeTarget+',"'+propName+'","'+eventType+'");';
                }else{
                    defaultValue+=target+'.unwatch('+nodeTarget+',"'+propName+'");';
                }
            });
        }

        //至少有一个双向绑定的属性
        if( expression.length > 0 )
        {
            // if( defaultValue )
            // {
            //     expression.push( defaultValue );
            // }
           // content.push( expression.join(":") );

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
        //if( (skin.name==="text" || skin.children.length===0) && p === "content" )
        //{
            //innerHTML = flag ? target[p].value : target[p];
        //}else
        //{
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
        //}
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
    var childIndex = skin.childIndex||0;
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
    var childrenCount = 0;
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
    if( !(  skin.isComponent /*(skin.isSkin && skin.isDisplayElement)*/ ) || skin === context )
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

                if( !child.isCommand )
                {
                    childrenCount++;
                }
            }
        }
    }

    topScope.contentStack = childContent;

    //一个命令元素
    if( isCommand )
    {
        var condition = attr.name || attr.condition;
        var bindIndex = condition ? condition.indexOf("bind::") : -1;
        var bindCommand = null;
        var tagName = tag.substr(1).toLowerCase();
        if( bindIndex >= 0 )
        {
            /*bindCommand = [];
            condition = condition.replace(/bind::(\w+)/g,function(a,b){
                 bindCommand.push(b);
                 return b;
            });
            if( attr.name )
            {
               attr.name = condition;
            }else{
               attr.condition = condition;
            }
            if( tagName === "case" )
            {
               throw new TypeError("Invlid bindding in the '"+tagName+"' command.");
            }*/
        }

        var code =  [];
      
        //如果是一个循环命令则需要初始化增量值
        if( skin.isForeachCommand )
        {
            //初始化一个循环增量值
            if( forLevel===1 ){
                code.push( "var "+keyPrefix+":int=0;" );
            }
            //在循环结束后增量加1
            childContent.push( keyPrefix+"++;" );
        }

        if( !make_skin_factory[ tagName ] )
        {
            throw new TypeError("Invalid '"+tagName+"' command.")
        }

        //构建一个命令脚本
        code.push( make_skin_factory[ tagName ](attr,tagName==="cdata" ? skin.content : childContent.join("\n") , children.length > 0 ) );

        //循环中的属性引用 
        if( skin.isForeachCommand )
        {
             ((parent||skin).childrenPropertiesRefs||[]).forEach(function(name){
                 code.push( Context+"."+name+"="+createUniqueArrayRef(parent||skin)+";");
             });
        }

        //绑定的命令，每次调度时都需要更新一下子级列表 
        if( bindCommand )
        {
            code.unshift( "var "+createUniqueArrayRef(parent||skin)+":Array=[];" );
            code.push( DOMRender+".updateNodes("+createUniqueRefId(parent||skin)+","+createUniqueArrayRef(parent||skin)+","+skin.childIndex+");");

            var stateName = getUniqueVar();
            //生成一个绑定器 
            var bindFnContent = 'function('+stateName+':Object,'+bindCommand.join(':*')+":*"+","+createUniqueRefId(parent)+":Object){\n"+code.join("\n")+'\n};';
            var bindParam = ['["'+bindCommand.join('","')+'"]', createUniqueRefId(skin), createUniqueRefId(parent||skin) ];
            topScope.declaration.push( "var "+createUniqueRefId(skin)+":Function = "+bindFnContent );
            topScope.afterStack.push( DOMRender+'.binding('+bindParam.join(",")+');' ); 
            return null;

        }else if( tagName==="code" )
        {
            //code.unshift( "var "+createUniqueArrayRef(parent||skin)+":Array=[];" );
            //childrenReference.push( createUniqueArrayRef(parent||skin) );
        } 
        return code.join("\n");
    }
    //一个组件或者是元素
    else{

         //是否为公开的元素
        var isPublic = skin.id && skin.isPrivate !==true;
         //元素定义的属性
        var properties = getComponentDefinedProperties( skin, context , topScope );
        //双向绑定的属性
        var propertyTwoWayBinding = getAttributesTwoWayBinding( skin, context, topScope , isPublic );
         //生成元素静态属性上的状态机
        var stateProperties = getDefinedStateProperties(skin,skin.defineAttributeStates, topScope.StateHandle, topScope );
        //获取静态属性
        var elementAttributes = getElementAttributes( skin ,topScope);
        var staticAttr = elementAttributes.attrs;
        var innerHtml = elementAttributes.innerHTML;

        //获取动态属性
        elementAttributes = getElementAttributes(skin,topScope,true);
        var bindAttr = elementAttributes.attrs;
        var eventAttr = elementAttributes.events;
        var dynamicAttr = [];
        var bindEvents = [];
        var attributes=[];

        //全局头元素直接返回
        if( context.isMakeView )
        {
            switch( skin.name.toLowerCase() )
            {
                case "title" :
                    if( bindAttr.content )
                    {
                        childContent.push("hostComponent.title="+(bindAttr.content)+" as String;");
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
        (propertyTwoWayBinding.content.length > 0) || bindEvents.length>0 || dynamicAttr.length >0;

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
                topScope.topContentStack.push( propertyTwoWayBinding.content.join(",") );
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
                topScope.topContentStack.push( DOMRender+".bindEvent("+Context+",{"+bindEvents.join(",")+"};");
            }
        }
        //针对视图处理, body 是一个全局对象，所以只需要引用
        //并且是中视图的子级中
        else if( context.isMakeView && skin.name.toLowerCase()==="body" && skin.parent === context )
        {
            var bodyId = (skin.id||context.gloableElementList.body.id);
            topScope.declaration.push( 'var ' +bodyId+ ':Skin=this;');

            if( properties.length > 0 )
            {
                var componentProps = makeComponentPropertiesMothod(skin, properties, topScope);
                if( componentProps  )
                {
                    if( componentProps.init.length > 0 )
                    {
                        topScope.topContentStack.push( componentProps.init.join("\n") );
                    }
                    if( componentProps.update.length > 0 )
                    {
                        topScope.topContentStack.push( componentProps.update.join("\n") );
                    }
                }
            }

             //如果此对象下有子级元素
            if( hasChildren )
            {
                if( skin.childrenRefName )
                {
                    skin.parent.childrenRefName = skin.childrenRefName;
                }else if(childrenReference.length > 0)
                {
                    container.splice.apply(container, [0,0].concat(childrenReference));
                }
            }

            if( propertyTwoWayBinding.content.length > 0 )
            {
                topScope.topContentStack.push( propertyTwoWayBinding.content.join(",") );
            }

            //元素对象的动态属性
            if( attrRefName )
            {
                topScope.topContentStack.push( DOMRender+".attributes("+Context+".element, "+attrRefName+");");
            }
            //元素对象的动态属性
            if( dynamicAttr.length > 0 )
            {
                topScope.topContentStack.push( DOMRender+".attributes("+Context+".element,{"+dynamicAttr.join(",")+"});");
            }
            //元素对象的动态属性
            if( bindEvents.length > 0 )
            {
                topScope.topContentStack.push( DOMRender+".bindEvent("+Context+".element,{"+bindEvents.join(",")+"};");
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
            
            if( skin.isSkinComponent )
            {
                //newComponentParam.push( context.isMakeView ? '('+uukey+'+""+'+uniqueKey+') as String' : "hostComponent.getComponentId( uniqueKey )" );

            }else
            {
                var _childScope={
                    childrenRefs:_topScope===topScope ? childrenReference : [],
                    contentStack:_topScope===topScope ? childContent : _topScope.contentStack,
                    hasChildren:hasChildren,
                }
                newComponentParam = getComponentConstructParams(skin,context,_topScope,false,attrRefName, _childScope);
                hasChildren = _childScope.hasChildren;
            }

            //new 组件对象
            var newValue = 'new ' + classname + '(' + newComponentParam.join(",") + ')';
            var componentProps = null ;
            var getOrSetElement = DOMRender+".getElement("+[uukey,uniqueKey].join(",")+")||"+DOMRender+".setElement("+[uukey,uniqueKey,newValue].join(",")+")";
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
                    throw new TypeError("");
                    // if( !skin.hasDefinedRenderProperty )
                    // {
                    //     var childSkinFactory = __toMakeSkinFactory(skin.children, context, _topScope, skin, innerHtml);
                    //     var childSkinFactoryId = getUniqueVar(context);
                    //     topScope.topStack.push( "var "+childSkinFactoryId+":Function = "+childSkinFactory.content+";" );
                    //     if( childSkinFactory.content )
                    //     {
                    //         childContent.push( createUniqueRefId(skin)+".render.factory="+childSkinFactoryId+";" ); 
                    //     }
                    // }
                }

                 //组件初始化的属性
                if( componentProps  )
                {
                    if( componentProps.init.length > 0 )
                    {
                       childContent.push( componentProps.init.join("\n") );
                    }
                }

                //元素对象的静态属性
                if( attrRefName && skin.isSkinComponent )
                {
                    childContent.push( DOMRender+".attributes("+createUniqueRefId(skin)+".element,"+attrRefName+");");
                }

                //结束创建组件
                //componentContent.push("}");

                 //组件引用的属性
                if( componentProps  )
                {
                    if( componentProps.update.length > 0 )
                    {
                       childContent.push( componentProps.update.join("\n") );
                    }
                }

                //元素对象的动态属性
                if( dynamicAttr.length > 0 )
                {
                    childContent.push( DOMRender+".attributes("+createUniqueRefId(skin)+".element,{"+dynamicAttr.join(",")+"});");
                }

                 //子级元素每次都需要更新
                if( hasChildren || childrenReference.length > 0 )
                {
                    childContent.push( DOMRender+".updateNodes("+[ 
                        createUniqueRefId(skin), 
                        skin.hasChildCommand && hasChildren ? createUniqueArrayRef(skin) : '['+childrenReference.join(",")+']'
                    ].join(",")+");" );
                }
               
                //绑定元素事件属性
                if( bindEvents.length > 0 )
                {
                    childContent.push( DOMRender+".bindEvent("+[uukey,uniqueKey,createUniqueRefId(skin),"{"+bindEvents.join(",")+"}"].join(",")+");");
                }
             
                //元素在其它地方有被引用到
                if( hasReference )
                {
                    //有定义状态机
                    if( skin.definedIncludeState )
                    {
                        pushDeclareExpressionToContent( 
                            "var "+createUniqueRefId(skin)+":"+classType+"=("+
                                (skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?")+
                                 '('+getOrSetElement+")) : null) as "+classType+";",
                            skin , 
                            childContent,
                            topScope,
                            isPublic
                        );

                    }else
                    {
                        //从属性中引用过来 
                        if( isPublic )
                        {
                             pushDeclareExpressionToContent( 
                                "var "+createUniqueRefId(skin)+":"+classType+"="+newValue+";",
                                skin , 
                                childContent,
                                topScope,
                                isPublic
                            );
                            topScope.declaration.push( "var "+createUniqueRefId(skin)+":"+classType+"="+topScope.Context+"."+createUniqueRefId(skin)+";" );

                        }else{

                            pushDeclareExpressionToContent( 
                                "var "+createUniqueRefId(skin)+":"+classType+"=("+getOrSetElement+") as "+classType+";",
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
                }
                //不需要有引用的元素
                else
                {
                    var newComponentValue = getOrSetElement;
                    //有定义状态机
                    if( skin.definedIncludeState )
                    {
                        newComponentValue = skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?"+newComponentValue+":null";
                    }

                    //需要要元素添加到数据组里面 
                    if( needPushToArray )
                    {
                        childContent.push( createUniqueArrayRef(parent||skin)+".push("+newComponentValue+");");

                    }else
                    {
                       //父级元素可以对当前元素的直接引用
                        container.push( newComponentValue );
                    }
                }

                 //双向绑定
                if( propertyTwoWayBinding.content.length > 0 )
                {
                     //childContent.push( "if("+createUniqueRefId(skin)+"){\n"+DOMRender+".watch("+createUniqueRefId(skin)+".element,["+propertyTwoWayBinding.content.join(",")+"]);\n}");
                     childContent.push( propertyTwoWayBinding.content.join(",") );
                }

            }else
            {
                if( componentProps )
                {
                    hasReference = componentProps.init.length > 0  ||  componentProps.update.length > 0;
                }

                if( hasReference )
                {
                    if( skin.isStateComponent )
                    {
                        topScope.topStack.push( "var "+createUniqueRefId(skin)+":"+classType+"="+newValue+";" );

                    }else
                    {
                        //从属性中引用过来 
                        if( isPublic && !skin.definedIncludeState )
                        {
                            pushDeclareExpressionToContent( 
                                "var "+createUniqueRefId(skin)+":"+classType+"="+newValue+";",
                                skin , 
                                childContent,
                                topScope,
                                isPublic
                            );
                            topScope.declaration.push( "var "+createUniqueRefId(skin)+":"+classType+"="+topScope.Context+"."+createUniqueRefId(skin)+";" );

                        }else
                        {
                             pushDeclareExpressionToContent( 
                                "var "+createUniqueRefId(skin)+":"+classType+"=("+getOrSetElement+") as "+classType+";",
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
                        childContent.push( createUniqueArrayRef(parent||skin)+".push("+ getOrSetElement +");");

                    }else
                    {
                       //父级元素可以对当前元素的直接引用
                        container.push( getOrSetElement );
                    }
                }
                
                if( componentProps )
                {
                    if( componentProps.init.length > 0 )
                    {
                         if( skin.isStateComponent ){
                            topScope.topStack.push( componentProps.init.join("\n") );
                         }else{
                             childContent.push( componentProps.init.join("\n") );
                         }
                    }
                    if( componentProps.update.length > 0 )
                    {
                        childContent.push( componentProps.update.join("\n") );
                    }
                }
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
            if( !(isPublic && skin.definedIncludeState) || skin.ownerForeachCommand )
            {
                //如果此对象下有子级元素
                if( hasChildren || childrenReference.length > 0 )
                {
                    //如当前元素存在子级命令元素并且当元素设置了公开属性,
                    //则子元素应该在子级命令结束后调度 render.updateNodes(node,children) 方法来创建子级元素
                    //if( !(skin.hasChildCommand && isPublic && skin !== context) )
                    //{
                        //indexAt = 3;
                        //param.splice(indexAt,1, skin.hasChildCommand && hasChildren ? createUniqueArrayRef(skin) : '['+childrenReference.join(",")+']' ); 
                    //}

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

                // //元素对象的动态属性
                // if( dynamicAttr.length > 0 )
                // {
                //     indexAt=5;
                //     param.splice(indexAt,1,"{"+dynamicAttr.join(",")+"}");
                // }

                // //双向绑定属性
                // if( propertyTwoWayBinding.content.length > 0 )
                // {
                //     indexAt=6;
                //     param.splice(indexAt,1, '['+propertyTwoWayBinding.content.join(",")+']' );
                // }

                // //绑定元素事件属性
                // if( bindEvents.length > 0 )
                // {
                //     indexAt=7;
                //     param.splice(indexAt,1,"{"+bindEvents.join(",")+"}");
                //     indexAt=8;
                //     param.splice(indexAt,1,topScope.Context);
                // }

            }
            //公开的元素，需要在当前代码块中生成子级元素
            else
            {
                //元素对象的静态属性
                if( attributes.length > 0 )
                {
                    indexAt = 4;
                    param.splice(indexAt,1,attrRefName);
                }

                //绑定元素事件属性
                if( bindEvents.length > 0 )
                {
                    indexAt = 6;
                    param.splice(indexAt,1,"{"+bindEvents.join(",")+"}");
                }

                //生成元素下的子级元素
                if( (hasChildren || childrenReference.length > 0) && !skin.hasChildCommand )
                {
                    childContent.push( DOMRender+".updateNodes("+createUniqueRefId(skin)+",["+childrenReference.join(",")+"]);");
                }
            }

            //去掉为null的参数
            param.splice(indexAt+1,6);

            //元素在其它地方有被引用到
            if( hasReference )
            {
                //引用节点对象
                var refNodeTarget = createUniqueRefId(skin);
                if( isPublic && !skin.definedIncludeState && !skin.ownerForeachCommand )
                {
                    childContent.push("var "+refNodeTarget+":Object = "+topScope.Context+"."+refNodeTarget+";" );
                }

                var expression = DOMRender+".createElement("+param.join(",")+")";
                //有定义状态机
                if( skin.definedIncludeState )
                {
                     expression = "("+skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?"+expression+":null) as Object";
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
                    childContent.push( DOMRender+".updateNodes("+refNodeTarget+", "+createUniqueArrayRef(skin)+");" )
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
                if( isPublic )
                {
                    if( dynamicAttr.length > 0 )
                    {
                        indexAt = 5;
                        param.splice(indexAt,1,"{"+dynamicAttr.join(",")+"}");
                        childContent.push( DOMRender+".attributes("+refNodeTarget+",{"+dynamicAttr.join(",")+"});");
                    }
                }

                //双向绑定属性
                if( propertyTwoWayBinding.content.length > 0 )
                {
                    childContent.push( propertyTwoWayBinding.content.join(",") );
                }

            }
            //不需要有引用的元素
            else
            {
                //新建节点对象
                var newNodeTarget = DOMRender+".createElement("+param.join(",")+")";
                //有定义状态机
                if( skin.definedIncludeState )
                {
                     newNodeTarget = skin.definedIncludeState.logic+topScope.StateHandle+"."+skin.definedIncludeState.expre+"?"+newNodeTarget+":null";
                }

                //需要要元素添加到数据组里面 
                if( needPushToArray )
                {
                    childContent.push( createUniqueArrayRef(parent||skin)+".push("+newNodeTarget+");");

                }else
                { 
                    //父级元素可以对当前元素的直接引用
                    container.push( newNodeTarget );
                }
            }

            
        }

        //有绑定的内容
        /*if( bindProperties && bindProperties.content )
        {
           if( bindProperties.declaration ) 
           {
              //绑定的内容声明到当前作用域的头部
              topScope.topStack.push( bindProperties.declaration );
           }
           //绑定的内容
           childContent.push( bindProperties.content );
        }*/

        //公开的属性
        if( isPublic && skin !== context )
        {
             var skinId = createUniqueRefId(skin);
             context.classProperties[ skinId ] = skin.classType || skin.fullclassname || skin.classname || "Object";

             //对循环体中公开元素的引用
             if( skin.ownerForeachCommand )
             {
                 context.classProperties[ skinId ] = "Array";
                 var __parent = parent||skin;
                 //公开元素的引用, 在循环命令结束后获取此引用
                 var childrenPropertiesRefs = __parent.childrenPropertiesRefs || (__parent.childrenPropertiesRefs = []);
                 childrenPropertiesRefs.push( skinId );

             }else
             {
                 //将需要公开的属性赋值放到到最顶层
                 if( skin.definedIncludeState ){
                     childContent.push(  topScope.Context+"."+skinId+"="+skinId+";");
                 }else{
                     topScope.topContentStack.push(  topScope.Context+"."+skinId+"="+skinId+";");
                 }
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
        if( isPublic && !skin.definedIncludeState ){
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
          
            // var stateEvent = getUniqueVar();
            // code.push( "var "+stateEvent+":Function = function(){\n" +[ 
            //     "var "+topScope.StateHandle+":State = "+topScope.Context+".getCurrentStateGroup();\n" 
            //     ].concat(content).join("")+"\n};");
            // code.push( stateEvent+"();");
            // code.push( topScope.Context+".addEventListener(StateEvent.CHANGE,"+stateEvent+");" );

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

/**
* 生成指定皮肤对象的单向绑定属性
*/
// function makeElementOneWayBindingContent(skinObject,context, refTarget, topScope )
// {
//     if( !skinObject.oneWayBinding || skinObject.oneWayBinding.length < 1 )
//     {
//         return null;
//     }
//     refTarget = refTarget || skinObject;
//     var bindAttrs={};
//     var twoWayBinding=null;
//     var bindContent = "";
//     var declarations = [];
//     var binding=[];
//     var bindingProperties=[];
//     var bindingRefs=[];
//     var bind = [];
//     var innerHTML = "";
//     var hasState = false;
//     var defineAttributeStates = skinObject.defineAttributeStates || {};
//     Utils.forEach(skinObject.oneWayBinding,function(item)
//     {
//         //直接对属性的引用 <h1>{name}</h1>, 是没有指定bind关键字的
//         if( item.bind.binding.length < 1 )
//         {
//             var name = item.name;
//             var nIndex = name.lastIndexOf(".");
//             var stateName = '';
//             if( nIndex > 0 ){
//                 stateName = name.substr(nIndex+1);
//                 name = name.substr(0,nIndex);
//                 hasState = true;
//             }

//              //双向绑定
//             if( item.bind.isTwoWayBind  )
//             {
//                 if( twoWayBinding===null )
//                 {
//                     twoWayBinding = {};
//                 }

//                 var twoWayBindingTarget =  twoWayBinding[ name ] || (twoWayBinding[ name ]={items:[],value:null});
//                 var _val = {value:item.value,name:name,bind:item.bind,stateName:stateName};
//                 if( !stateName )
//                 {
//                     twoWayBindingTarget.value = _val;
//                 }else{
//                     twoWayBindingTarget.items.push(_val);
//                 }
//             }
//             //指定的状态机属性
//             else if( stateName && item.isAttr )
//             {
//                 var states = defineAttributeStates[ name ] || (defineAttributeStates[ name ]={items:[],value:'null'});
//                 states.items.push({value:item.value,name:name,stateName:stateName,bind:item.bind});
//             }
//             //单向绑定
//             else
//             {
//                 //优先把文本内容当子级 
//                 if( /*item.name==="innerHTML" ||*/ (item.name==="content" && (skinObject.name==="text" || !item.isAttr) ) ){
//                     innerHTML = item.value;
//                 }else{
//                     bindAttrs[item.name]=item.value;
//                 }
//              }

//         }else{
//             //绑定需要变动的属性对象
//             //每一个对象属性中所有的绑定 name="这里是绑定的内容 {bind::name} {bind::title} 绑定的属性名在 binding 集合中"
//             binding.push( {name:item.name, value:item.value, binding:item.bind.binding});
//             //去掉重复绑定的属性名
//             item.bind.binding.forEach(function(name){
//                 if( bindingProperties.indexOf(name) < 0 ){
//                    bindingProperties.push( name )
//                 }
//             });
//             //直接对属性的引用 {name}, 是没有指定bind关键字的
//             //name="这里是绑定的内容 {bind::name} {bind::title} 这个是 {name} 不属于绑定,但需要把默认值传递到绑定器。"
//             item.bind.refs.forEach(function(name){
//                if( bindingRefs.indexOf(name) < 0 ){
//                    bindingRefs.push( name )
//                }
//             });
//         }
//     });

//     if( hasState )
//     {
//         skinObject.defineAttributeStates = defineAttributeStates;
//     }

//     //对绑定的属性进行组装
//     if( binding.length > 0 )
//     {
//         var bindTarget = createUniqueRefId( refTarget );
//         var stateName = getUniqueVar(context);
//         var refsParam = [stateName+":Object"];
//         var isDisplayElement = !refTarget.isProperty && !refTarget.isComponent && !refTarget.nonElement;
//         var isArrayElement = refTarget.nonElement && refTarget.type ==="Array" && skinObject.name === "item";

//         //绑定的属性名
//         refsParam.push( bindingProperties.join(":*,")+":*" );

//         //被绑定的对象元素
//         if( isDisplayElement )
//         {
//             refsParam.push( bindTarget+":Element" )
//         }else{
//             refsParam.push( bindTarget+":"+(refTarget.fullclassname||refTarget.type||"Object") );
//         }
        
//         //默认传递的引用参数
//         if( bindingRefs.length > 0 )
//         {
//             refsParam.push( bindingRefs.join(":*,")+":*" );
//         }

//         //绑定的侦听器
//         var bindingContent = ['function('+refsParam.join(",")+"){\n"];

//         //具体要侦听的属性
//         binding.forEach(function(item)
//         {
//             bindingContent.push("if("+stateName+"."+item.binding.join(" || "+stateName+".")+" ){\n");
//              if( isDisplayElement  )
//              {
//                  if( item.name ==="innerHTML" ){
//                      bindingContent.push(bindTarget+".html("+item.value+");\n");
//                  }else if( item.name ==="style"){
//                      bindingContent.push(bindTarget+".style('cssText',"+item.value+");\n");
//                  }else {
//                      bindingContent.push(bindTarget+".property('"+item.name+"',"+item.value+");\n");
//                  }
                
//              }else
//              {
//                  if( isArrayElement ){
//                      bindingContent.push(bindTarget+".splice("+skinObject.parent.children.indexOf( skinObject )+",1,"+item.value+");\n");
//                  }else{
//                      bindingContent.push(bindTarget+"."+item.name+"="+item.value+";\n");
//                  }
//              }
//              bindingContent.push("}\n");
//         });

//        bindingContent.push("}");

//        var bindingParam;
//        var funName = getUniqueVar(context);
//        if( skinObject.ownerForeachCommand )
//        {
//             var propsName = getUniqueVar();
//             declarations.push("var "+propsName+":Array="+'["'+bindingProperties.join('","')+'"];');
//             declarations.push( "var "+funName+":Function="+ bindingContent.join("")+";" );
//             bindingParam = [propsName,funName];
//         }else
//         {
//             bindingParam=[ '["'+bindingProperties.join('","')+'"]', bindingContent.join("") ];
//         }

//         var targetRef = [ bindTarget ];
//         var targetObject = refTarget;

//         //对属性的引用要指定到组件对象本身
//         while( targetObject.parent && targetObject.parent.isProperty )
//         {
//            targetRef.unshift( targetObject.parent.name );
//            targetObject = targetObject.parent;
//         }
//         if( targetObject !== refTarget )
//         {
//             targetRef.unshift( createUniqueRefId( targetObject.parent ) )
//             targetObject.parent.hasBinddingValue = true;
//         }

//         if( isDisplayElement )
//         {
//             bindingParam.push( targetRef.join(".") );
//         }else{
//             bindingParam.push( targetRef.join(".") );
//         }
//         bindContent=topScope.DOMRender+".binding("+bindingParam.concat( bindingRefs ).join(",")+");"; 
//     }
//     return {content:bindContent,attrs:bindAttrs,twoWayBinding:twoWayBinding,declaration:declarations.join("\n"),innerHTML:innerHTML};
// }

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

    //需要引用数据集中的属性
    if( skinObject.defineRefs.length > 0 )
    {
        skinObject.defineRefs.forEach(function(name){
            body.push( "const "+name+":*=dataset."+name+";" );
        });
    }

    body.push("const attrs:Object=this.properties;");
    // Utils.forEach(topScope.staticProperties,function(value,name){
    //     body.push( "const "+name+":Object=properties."+name+" as Object;" );
    // });

    if( skinObject.defineStates && skinObject.description && 
        checkInstanceOf(skinObject, skinObject.description,context.baseSkinclass) && !Utils.isEmpty( skinObject.defineStates ) )
    {
        body.push( "const "+topScope.StateHandle+":State="+topScope.Context+".getCurrentStateGroup();" );
        body.push( "if(!"+topScope.StateHandle+"){\nthrow new TypeError(\"the '"+topScope.StateHandle+"' state cannot be empty.\");\n}" );
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
    //factory =  "function("+topScope.DOMRender+":IRender,"+topScope.Context+":"+skinObject.fullclassname+",dataset:Object={}){\n"+body.join("\n")+"\n}";
    return {topScope:topScope,content:body.join("\n")};
}

module.exports = makeSkin;


