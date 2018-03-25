const fs = require('fs');
const PATH = require('path');
const Ruler = require('./ruler.js');
const Utils = require('./utils.js');
var defineModules={};
var stackModules = {};
var enableBlockScope=false;
var globals={};
var globalsConfig={};

/**
 * 全局模块
 * @param name
 * @returns {{}}
 */
function getmodule(classname)
{
    var ref = defineModules[classname] || globals[classname];
    if(ref == null)return null;
    ref = ref.id == null && Object.prototype.hasOwnProperty.call(globals,classname) ? globals[classname] : ref;
    return ref;
}

/**
 * 抛出错误信息
 * @param msg
 * @param type
 */
function error(msg, type)
{
    var obj = Iteration.lastStack;
    obj = getStackItem( obj );
    if( obj && Iteration.currentModule )
    {
        msg = Iteration.currentModule.filename+':' + obj.line + ':' + obj.cursor+"\r\n"+msg;
    }
    switch ( (type||"").toLowerCase() )
    {
        case 'syntax' :
            throw new SyntaxError(msg);
            break;
        case 'reference' :
            throw new ReferenceError(msg);
            break;
        case 'type' :
            throw new TypeError(msg);
            break;
        default :
            throw new Error(msg);
    }
}

function getStackItem( stack )
{
    if( stack instanceof Ruler.STACK )
    {
        var i=0;
        var content = stack.content();
        var len = content.length;
        for(;i<len;i++)
        {
            return getStackItem( content[i] );
        }
        return null;
    }else
    {
        return stack;
    }
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
 * 迭代器
 * @param data
 * @constructor
 */
function Iteration( stack , module )
{
    Iteration.currentModule = module;
    var index=0;
    this.stack = stack;
    this.module = module;
    this.index=index;
    this.data=stack.content().slice(0);
    this.prev=undefined;
    this.next=undefined;
    this.current=undefined;
    this.content=[];
    this.state=true;
    this.lastStack=Iteration.lastStack;
    this.seek=function(){
        if( !this.state )return false;
        if( index===0 )stack.dispatcher({type:'(iterationStart)',content:this.content,iteration:this});
        if( index >= this.data.length )
        {
            this.next = undefined;
            stack.dispatcher({type:'(iterationDone)',content:this.content,iteration:this});
            return false;
        }
        this.prev = this.current;
        this.current = this.data[index];
        if( !(this.current instanceof Ruler.STACK) )
        {
            this.lastStack = Iteration.lastStack = this.current;
        }
        index++;
        this.next = this.data[index];
        stack.dispatcher({type:'(iterationSeek)',content:this.content,iteration:this});
        if( this.current.value==='return' && this.current.id==='(keyword)' )this.checkReturnType( stack );
        if( this.next && this.next.value==='in')this.nextIn( stack );
        if( this.next && this.next.value==='of')this.nextOf( stack );
        return true;
    };
    stack.returnValues=[];
    if( enableBlockScope )this.parseBlockScope( stack );
    this.parseFunctionScope( stack );
    this.parseArgumentsOfMethodAndConstructor( stack );
}

Iteration.lastStack=null;
Iteration.currentModule=null;
Iteration.prototype.constructor=Iteration;

/**
 * 给表表达式添加返回值
 * @param stack
 * @param value
 */
Iteration.prototype.values=function( value )
{
    if( typeof value !== "undefined" )this.stack.returnValues.push( value );
    return this.stack.returnValues;
};

Iteration.prototype.nextIn=function(stack)
{
    var infor=false;
    if( stack.parent().keyword() === 'statement' )
    {
        if( stack.parent().parent().parent().keyword() === "condition" )
        {
            infor = stack.parent().parent().parent().parent().keyword() === 'for';
        }
    }
    if( infor )
    {
        if( stack.parent().content().length > 1 )error('Can only statement one','syntax');
        var name = this.current.value;
        var desc = stack.scope().define( name );
        if( desc )desc.referenceType='String';
        var funScope = stack.scope().getScopeOf();
        funScope.forIterator >>= 0;
        var itn;
        do{
            itn = '__$'+(funScope.forIterator++)+'__';
        }while( funScope.define(itn) );

        this.seek();
        this.seek();
        var property = getDescriptorOfExpression(this, this.module);
        this.state=false;
        var key = '('+name+'='+itn+'.key)!==false';
        this.content.push({
            name:[],
            descriptor:null,
            thisArg:'var '+itn+' = Iterator('+parse( this.module, property)+');'+itn+'.seek() && '+key+';',
            expression:false,
            before:[],
            after:'',
            "super":null,
            runningCheck:false,
            isglobal:false,
            type:'String'
        });
    }
};

Iteration.prototype.nextOf=function(stack)
{
    var infor=false;
    if( stack.parent().keyword() === 'statement' )
    {
        if( stack.parent().parent().parent().keyword() === "condition" )
        {
            infor = stack.parent().parent().parent().parent().keyword() === 'for';
        }
    }
    if( !infor )error('keyword the "of" can only in for iterator','syntax');
    if( stack.parent().content().length > 1 )error('Can only statement one','syntax');

    var name = this.current.value;
    var desc = stack.scope().define( name );
    if( desc )desc.referenceType='String';

    var funScope = stack.scope().getScopeOf();
    funScope.forIterator >>= 0;
    var itn;
    do{
        itn = '__$'+(funScope.forIterator++)+'__';
    }while( funScope.define(itn) );

    this.seek();
    this.seek();
    var property = getDescriptorOfExpression(this, this.module);
    this.state=false;
    this.content.push({
        name:[],
        descriptor:null,
        thisArg:'var '+itn+' = Iterator('+parse( this.module, property)+'); '+itn+'.seek();',
        expression:false,
        before:[],
        after:'',
        "super":null,
        runningCheck:false,
        isglobal:false,
        type:'String'
    });
    var seek = function (e) {
        if( e.iteration.current.value==='{' ){
            e.iteration.seek();
            e.iteration.content.push('{\n'+name+'='+itn+'.value;\n');
            stack.scope().removeListener('(iterationSeek)',seek);
        }
    };
    stack.scope().addListener('(iterationSeek)',seek);
};


/**
 * 检查函数的返回类型
 * @param stack
 */
Iteration.prototype.checkReturnType=function(stack)
{
    var fnScope = stack.getScopeOf();
    if( fnScope.returnType && fnScope.returnType !=='*' )
    {
        if( fnScope.returnType ==='void' )
        {
            if(this.next && this.next.value !==';')
            {
                error('can not has return value', 'type');
            }
            return;
        }
        if(this.next.value ===';')error('Missing return value', 'type');
        if( fnScope.returnType ==='Object' )return;
        this.content.push('return ');
        this.seek();

        var returnType = undefined;

        if( isReferenceType(fnScope.returnType) )
        {
             returnType = fnScope.returnType;
             var _import = this.module.import;
             getImportClassByType( this.module, fnScope.returnType);
             for( var p in _import )
             {
                 if( _import[p] === returnType ){
                     returnType = p;
                 }
             }
        }
        this.content.push( toString(this.current, this.module, returnType, false, true ) );
        this.current={};
    }
};

function getDefinedClassName(classmodule, type)
{
    if( classmodule.type === type || classmodule.classname===type )return type;
    if( classmodule.import && classmodule.import[type])
    {
        var objClass = getmodule( classmodule.import[type] );
        if( objClass && objClass.nonglobal === true )
        {
            return objClass.fullclassname;
        }
    }
    if( type.indexOf('.') > 0 )
    {
        for(var b in classmodule.import )if( classmodule.import[b] === type )return type;
    }
    //使用全名
    if( Object.prototype.hasOwnProperty.call(defineModules,type)  )
    {
        return type;
    }
    return globals[type] ? type : null;
}

function getDefinedShortClassName(classmodule, className)
{
    if( className.indexOf(".") < 0 )
    {
        return className;
    }
    for(var name in classmodule.import)
    {
        if( classmodule.import[ name ]===className )
        {
            return name;
        }
    }
    return className;
}

/**
 * 生成函数
 * @param stack
 * @returns {string}
 */
Iteration.prototype.parseArgumentsOfMethodAndConstructor=function( stack )
{
    //如果是一个构造函数
    if( stack.keyword()==='function' )
    {
        //运行时检查实例对象是否属于本类
        // content.push( 'if( !(this instanceof '+stack.name()+') )throw new SyntaxError("Please use the new operation to build instances.");\n' );
        if( stack.name() === this.module.classname && !stack.static() && stack.parent().keyword() === 'class')
        {
            stack.addListener('(iterationDone)', function (e)
            {
                var param = stack.param();
                var index = e.iteration.content.indexOf('{');
                if( e.iteration.content[index+1] ==="\n" )index++;
                //预留私有属性占位
                e.iteration.content.splice(++index, 0, '####{props}####\n');
                //如果没有调用超类，则调用超类的构造函数
                if (e.iteration.module.inherit && !stack.called)
                {
                    var inheritClass = getmodule( getImportClassByType(e.iteration.module, e.iteration.module.inherit ) );
                    if( inheritClass.nonglobal===true )
                    {
                        e.iteration.content.splice(index + 1, 0, e.iteration.module.inherit+'.constructor.call(this);\n');
                    }else
                    {
                        e.iteration.content.splice(index + 1, 0, e.iteration.module.inherit+'.call(this);\n');
                    }
                }
            }, -500);
        }
    }

    if( stack.keyword() ==='statement' && stack.parent().keyword() === 'function' )
    {
        var items = stack.parent().param();
        var scope = stack.parent().scope();
        var express = [];
        var rest = items.indexOf('...');
        if (rest >= 0) {
            express.unshift( 'var '+items.slice(-1)+'=Array.prototype.slice.call(arguments, ' + rest + ');\n');
            items = items.slice(0, rest);
        }

        this.content.push( items.join(',') );
        for (var i in items) {
            var desc = scope.define( items[i] );
            desc.type = getType(desc.type);
            if (desc.value instanceof Ruler.STACK)
            {
                var value = toString(desc.value, this.module);
                express.unshift('if('+items[i]+' == null ){'+value+';}\n');
            }
            if ( desc.type !== '*' /*&& desc.type !=='Object'*/ )
            {
                var typeClass = getmodule( getImportClassByType(this.module, desc.type ) );
                var shortName = this.module.import.hasOwnProperty(typeClass.classname) ? typeClass.classname : desc.type;
                if( typeClass.nonglobal===true  && typeClass.privilege !=='public' && typeClass.package !==this.module.package  )
                {
                   error( '"'+desc.type+'" is not exists', 'reference' );
                }

                if( globalsConfig.mode !== 3 )
                {
                    if (shortName.indexOf(".") > 0) {
                        express.push('if( !System.is(' + items[i] + ', System.getDefinitionByName("' + desc.type + '")))throw new TypeError("type does not match. must be ' + desc.type + '","' + this.module.filename + '",' + Iteration.lastStack.line + ');\n');
                    } else {
                        express.push('if( !System.is(' + items[i] + ', ' + shortName + '))throw new TypeError("type does not match. must be ' + shortName + '","' + this.module.filename + '",' + Iteration.lastStack.line + ');\n');
                    }
                }

            }
        }
        stack.parent().addListener('(iterationDone)',function (e)
        {
            if(express.length>0)
            {
                var index =  e.iteration.content.indexOf('{');
                if( e.iteration.content[index+1] ==="\n" )index++;
                e.iteration.content.splice( ++index, 0, express.join('') );
            }

        },-400);
        this.seek();
        this.state=false;
    }
};



/**
 * 处理块级域
 * @param stack
 */
Iteration.prototype.parseBlockScope=function(stack)
{
    if( stack instanceof Ruler.SCOPE && !stack.hasListener('(blockScope)') )
    {
        var blockScopeItems=[];
        var hasBlockScope=false;
        stack.addListener('(blockScope)',function (e)
        {
            hasBlockScope=true;
            if( blockScopeItems.indexOf(e.name) < 0 && this !== e.scope )
            {
                blockScopeItems.push( e.name );
            }
        });

        stack.addListener('(iterationDone)',function (e)
        {
            if( hasBlockScope )
            {
                if( stack.keyword()==='do' )
                {
                    e.content.unshift('(function(){');
                    var index = this.parent().content().indexOf(this);
                    index++;
                    if( this.parent().content().length > index && this.parent().content()[ index ].keyword()==='while' )
                    {
                        this.parent().content()[ index ].addListener('(iterationDone)',function (e) {
                            e.content.push('}).call(this);\n');
                            e.prevented=true;
                            e.stopPropagation=true;
                        },100);

                    }else
                    {
                        e.content.push('}).call(this);\n');
                    }
                }
                else if( stack.keyword()==='for' || stack.keyword()==='while' )
                {
                    e.content.unshift('(function(){');
                    e.content.push('}).call(this);\n');

                }else
                {
                    var startIndex = e.content.indexOf(')');
                    if( e.content[++startIndex] ==='{')startIndex++;
                    e.content.splice( startIndex, 0, '(function('+ blockScopeItems.join(',')+'){' );
                    e.content.splice( e.content.length-1,0, '}).call('+['this'].concat(blockScopeItems).join(',')+');' );
                }
            }
        });
    }
};

/**
 * 将var变量提到函数中
 * @param stack
 */
Iteration.prototype.parseFunctionScope=function( stack )
{
    //声明的变量不能当前类模块同名。
    if( stack.keyword() === 'expression' && stack.parent().keyword()==='statement' )
    {
        stack.addListener('(iterationSeek)',function (e)
        {
            if ( e.iteration.current.value === e.iteration.module.classname )
            {
                var desc = e.iteration.stack.getScopeOf().define( e.iteration.current.value );
                if(desc && desc.id !== 'class' && desc.id !== 'namespace' )
                {
                    error( '"'+e.iteration.current.value+'" is self class. do not declaration', 'type' );
                }
            }
        });
    }

    //替换一些关键字
    if( stack.keyword() ==='var' || stack.keyword() ==='const' || stack.keyword() ==='let')
    {
        this.seek();
        if( stack.keyword() !== 'var' || stack.scope().keyword()==='function' || stack.scope().keyword()==='rootblock' )this.content.push('var ');
    }
    //如果var变量不在函数域中则添加到函数域中
    else if( stack.keyword() === 'statement' && stack.parent().keyword() === 'var' && stack.parent().scope().keyword() !== 'function' )
    {
        var funScope =  stack.scope().getScopeOf();
        var exists= funScope.__replace__ || (funScope.__replace__=[]);
        var items=[];
        var seek = function (e)
        {
            //is expression
            if( e.iteration.current instanceof Ruler.STACK )
            {
                var name = e.iteration.current.content()[0].value;
                if( exists.indexOf(name) < 0 ){
                    items.push( name );
                    exists.push( name );
                }
                if (e.iteration.current.content().length === 1){
                    e.iteration.seek();
                    if (e.iteration.current.value === ',')e.iteration.seek();
                }
            }
        };
        var done = function (e)
        {
            if( items.length > 0 )
            {
                var startIndex = e.content.indexOf('{');
                if( e.content[startIndex+1]==="\n")
                {
                    startIndex++;
                }
                e.content.splice( ++startIndex , 0, 'var ' + items.join(',')+';\n' );
            }
            stack.removeListener('(iterationSeek)',seek );
            this.removeListener('(iterationDone)', done );
        };
        stack.addListener('(iterationSeek)', seek );
        stack.scope().getScopeOf().addListener('(iterationDone)', done);
    }
};

/**
 * 检查参数类型
 * @param desc
 * @param funExpression
 * @returns Boolean
 */
function checkCallParameter(it, desc, property )
{
    var parameters = [];
    var index = 0 ;
    var param = desc ? ( desc.nonglobal ? desc.paramType : desc.param) : null;
    var acceptType;
    var raw = [];

    //从函数的 scope 中获取参数类型
    if( !param && desc && desc.nonglobal && desc.id==='function' && !desc.paramType  && desc.reference instanceof Ruler.STACK )
    {
        param = desc.reference.param();
        desc.paramType=[];
        for(var i in param )
        {
            if( param[i] ==='...')
            {
                desc.paramType.push('*');

            }else
            {
                var obj = desc.reference.define( param[i] );
                obj.type = getType(obj.type);
                desc.paramType.push( obj.type );
            }
        }
        param = desc.paramType;
    }

    if( it.current.content().length > 0 )
    {
        var it = new Iteration(it.current, it.module);
        while (it.seek())
        {
            if (it.current instanceof Ruler.STACK)
            {
                acceptType = param && param[index] !=='...' ? param[index] : '*';

                //(function)();
                if( it.current.keyword() ==="expression" && it.prev instanceof Ruler.STACK && it.prev.keyword() ==="expression")
                {
                    parameters.push( parameters.pop()+toString(it.current, it.module , acceptType, true ) );
                }else
                {
                    parameters.push( toString(it.current, it.module , acceptType, true ) );
                }
                index++;

            } else if (it.current.value !== ',')
            {
                error('Invalid identifier token', 'syntax');
            }
        }
    }

    if( param && parameters.length < param.length )
    {
        for(var i in param )
        {
            if( param[i]==='...' )break;
            if( parameters[i] === undefined )
            {
                //有指定默认值的参数可以不传
                if( desc.__stack__ instanceof Ruler.STACK )
                {
                    param = desc.__stack__.param();
                    var obj = desc.__stack__.getScopeOf().define( param[i]  );
                    if( obj &&  obj.value instanceof Ruler.STACK )
                    {
                        continue;
                    }
                }

                //是否允许不传
                if( !desc.nonglobal && ( desc.isFunAccessor===true || ( desc.required && desc.required[i]===false ) ) )
                {
                    continue;
                }
                error('Missing parameter', 'syntax');
            }
        }
    }
    property.raw = raw.join(',');
    return parameters;
}

/**
 * 是否为一个可引用的属性
 * @param stack
 * @returns {boolean}
 */
function isReference( stack )
{
    if( globals[stack.value] )return true;
    return  stack.id === '(identifier)' ||
        stack.value === 'this'      ||
        stack.value === 'super'     ||
        stack.type==='(string)'     ||
        stack.type==='(regexp)'
}

function createDescription( it , classmodule, property )
{
    var before = [];
    var info = [];
    var type = '*';
    var thisArg = '';
    var referenceType = '*';
    var runningCheck = false;
    var raw = '';
    var name = [];
    var desc = null;
    if( property ){
        desc = property.descriptor;
        before = property.before.splice(0, property.before.length );
        var last =  before.pop();
        if( property.expression && last === "new" )
        {
            property.before.push( last );
        }else{
            before.push( last );
        }

        info   = property.info;
        type   = property.type;
        referenceType = property.referenceType;
        thisArg = parse(classmodule,property);
        name = [thisArg];
        raw = property.raw;
        if( type==="*" )
        {
            runningCheck = true;
        }
    }
    return {
        "name":name,
        "descriptor":null,
        "thisArg":thisArg,
        "expression":false,
        "before":before,
        "after":'',
        "super":null,
        "runningCheck":runningCheck,
        "isglobal":false,
        "type":type,
        "referenceType":referenceType,
        "funScope":it.stack.getScopeOf(),
        "use":'',
        "raw":raw,
        "info":info,
        "ownerScope":classmodule.fullclassname
    };
}

/**
 * 获取类的全名引用
 * @param it
 * @returns {*}
 */
function getClassTypeByDefinedFullName(it)
{
    if( it.current.type==='(identifier)' )
    {
        var classType=[];
        do{
            classType.push( it.current.value );
        }while ( it.next && (it.next.value==='.' || it.next.type==='(identifier)') && it.seek() );
        return classType.length > 0 ? classType.join('') : null;
    }
    return null;
}

var requirements={};

var lastProperty = null;
var constant_property = ["__CLASS__","__LINE__","__FILE__"];

/**
 * 获取表达式的描述说明
 * @param it
 * @param classmodule
 * @returns {*}
 */
function getDescriptorOfExpression(it, classmodule)
{
    //标记一个状态，如果是false表示跳过这段代码的解析
    if( it.state === false )return '';

    var type;
    var desc;
    var property = createDescription(it, classmodule);
    lastProperty = property;
    it.currentProperty = property;

    //是否为一个前置运算符
    while ( Utils.isLeftOperator(it.current.value) )
    {
        var is = Utils.isIncreaseAndDecreaseOperator(it.current.value);
        if( ( !it.next && is ) || (it.next && it.next.type !=='(identifier)' && is) )error('"'+it.current.value+'" after must be is expression reference');
        property.before.push( it.current.value );
        it.seek();
    }

    var isNew = property.before.length > 0 && property.before[property.before.length - 1] === "new";

    //是否为一个表达式或者对象
    if( it.current instanceof Ruler.STACK  )
    {
        if( it.current.type() === '(expression)' )
        {
            type = '*';
            desc = null;

            //是否强制转换类型
            if( it.next && (it.next.id==="(identifier)" || it.next.value==="this" || ( it.next instanceof Ruler.STACK && it.next.keyword() === 'expression') ) )
            {
                desc = it.stack.scope().define( it.next.value );
                if( desc )
                {
                    var typeStack = it.current.content()[1];
                    var typeIt = new Iteration( typeStack, classmodule );
                    if( typeIt.seek() )
                    {
                        type = getClassTypeByDefinedFullName(typeIt);
                        type = getDefinedClassName(classmodule, type);
                        if (!type)error('"' + type + '" is not exists', 'reference');
                        type = getDefinedShortClassName(classmodule,type);

                    }else{
                        error('Missing type reference', 'type');
                    }
                    property.referenceType = type;
                    it.seek();
                    
                }else{
                    error('Type must have a reference of forced conver', 'reference');
                }
            }

            if( it.current instanceof Ruler.STACK ){
                property.thisArg = toString(it.current, classmodule, type);
            }else{          
                property.thisArg = it.current.value;
            }
            property.name= [ property.thisArg ];
            property.type= type;

        }else
        {
            property.thisArg = toString(it.current, classmodule);
            property.name= [];
            property.type= getType( it.current.type() );
            if( it.current.keyword() ==="function" )
            {
                property.type = "Function";
            }
            if( property.type !=='Array' )
            {
                return property;
            }
            type='Array';
            desc = getmodule(type);
            property.isglobal=true;
            property.type = type;
            property.thisArg = 'new Array('+( property.thisArg.replace(/^\s*\[|\]\s*$/g,'') )+')';
            property.name= [ property.thisArg ];
        }

    }else
    {
        var isConstantAttr = false;
        //是一个引用或者是一个字面量
        if (isReference(it.current))
        {
            property.info.push( it.current.value );
            if( constant_property.indexOf(it.current.value) >= 0)
            {
                type = "String";
                isConstantAttr = true;
                switch ( it.current.value ){
                    case "__CLASS__" :
                        property.thisArg='System.getQualifiedObjectName(this)';
                      break;
                    case "__FILE__" :
                        property.thisArg='"'+classmodule.filename+'"';
                        break;
                    case "__LINE__" :
                        property.thisArg = it.current.line;
                        type = "Number";
                      break;
                }

            }else
            {
                //获取字面量类型
                type = Utils.getValueTypeof(it.current.type);
            }

            if (type)
            {
                desc = globals[type];
                property.isglobal=true;
            }
            //引用命名空间
            else if( classmodule.namespaces.hasOwnProperty( it.current.value ) )
            {
                desc =  classmodule.namespaces[ it.current.value ];
                desc.type = getType(desc.type);
            }
            //声明的引用
            else
            {
                desc = it.stack.scope().define(it.current.value);
                if (desc)
                {
                    //触发一个块级域事件
                    if( desc.id==='let' || desc.id==='const' )
                    {
                        var blockScope = it.stack.scope();
                        while( blockScope && blockScope.keyword()==='function' )blockScope = blockScope.parent().scope();
                        blockScope.dispatcher({"type":"(blockScope)","name":it.current.value, "stack":it.stack, "current":it.current,'scope':desc.scope });
                    }

                    if( desc.id==="function")
                    {
                        desc.referenceType = "Function";
                    }

                } else if(classmodule.declared && Object.prototype.hasOwnProperty.call(classmodule.declared,it.current.value) )
                {
                    desc = classmodule.declared[ it.current.value ];
                }
                 //全局引用
                else
                {
                    if( Object.prototype.hasOwnProperty.call( globals, it.current.value ) )
                    {
                        desc = globals[ it.current.value ];
                        requirements[ it.current.value ]=true;
                    }
                    if( !desc && Object.prototype.hasOwnProperty.call(globals.System.static,it.current.value) )
                    {
                        property.name=['System'];
                        property.thisArg='System';
                        desc = globals.System;
                        desc = desc.static[it.current.value];
                    }
                    if( desc )
                    {
                        property.isglobal = true;
                    }
                }

                if( desc )
                {
                    desc.type = getType(desc.type);
                }
            }

            //默认使用this引用
            if ( !desc )
            {
                var funScope = it.stack.getScopeOf();
                //是否为类的成员属性
                if( funScope.parent().keyword() === "class" )
                {
                    if (funScope.static()) {
                        desc = getClassPropertyDesc(it, classmodule, 'static', classmodule, false, property);
                        property.name = [classmodule.classname];
                        property.thisArg = classmodule.classname;
                    } else {
                        desc = getClassPropertyDesc(it, classmodule, 'proto', classmodule, true, property);
                        if (desc) {
                            property.name = ['this'];
                            property.thisArg = 'this';
                        } else {
                            desc = getClassPropertyDesc(it, classmodule, 'static', classmodule, true, property);
                            property.name = [classmodule.classname];
                            property.thisArg = classmodule.classname;
                        }
                    }
                }
            }

            //引用一个类的全名 client.skins.Pagination
            if( !desc && it.current.type==='(identifier)' )
            {
                type = getClassTypeByDefinedFullName(it);
                if( type )
                {
                    desc = getmodule(type);
                    if (!desc || (desc.nonglobal === true && desc.privilege !== 'public' && desc.package !== classmodule.package)) {
                        error('"' + type + '" is not exists', 'reference');
                    }
                    property.info=[type];
                    property.referenceType = 'Class';
                    property.type = 'Class';
                    property.descriptor = desc;
                    type = getDefinedShortClassName(classmodule, type);
                    if ( isNew )
                    {
                        property.type = type;
                        property.referenceType = type;
                    }
                    if( type.indexOf(".") > 0 ){
                        property.thisArg = "System.getDefinitionByName('" + type + "')";
                    }else{
                        property.thisArg = type;
                    }
                    property.name=[property.thisArg];
                    setClassModuleUsed( desc , classmodule );
                }
            }

            if (!desc)
            {
                error('"' + it.current.value + '" is not defined.', 'reference');
            }

            //如果是调用超类
            if( it.current.value==='super' )
            {
                //super 只能在类成员函数中
                if( it.stack.getScopeOf().parent().keyword() !=='class' )
                {
                    error('Unexpected identifier "'+it.current.value+'"', 'syntax');
                }
                property.super = desc.type;

            }else if( !isConstantAttr )
            {
                //如果this不在类函数的成员中,则表示this是一个函数对象，则并非是类对象
                if( it.current.value==='this' && it.stack.getScopeOf().parent().keyword() !=='class' )
                {
                    desc={'type':'*',isThis:false};
                    property.isThis = false;
                }
                if( it.current.value )
                {
                    property.name.push( it.current.value );
                }
            }
            property.descriptor = desc;
            type = getDescribeType( desc );
            //如果没有确定类型并且有设置值类型则引用值的类型
            //if( type==='*' && desc.valueType )type = desc.valueType;
            property.type = type || '*';
            if( !property.thisArg )
            {
                property.thisArg = it.current.value;
            }
        }
        //一组常量的值
        else
        {
            type = Utils.getConstantType(it.current.value) || Utils.getValueTypeof(it.current.type);
            if (!type)
            {
                error('Unexpected identifier','syntax');
            }
            property.type = type || '*';
            property.thisArg = it.current.value;
            property.info.push( property.thisArg );
            property.isglobal=true;
            property.isNullType = type==="Object";
            return property;
        }
    }

    var refClassModule =null;
    var classType = null;

    //抽象类不能实例化
    if( desc && desc.id==="class" )
    {
        classType = getImportClassByType(classmodule,  desc.type );
        refClassModule = getmodule( classType );
        if( isNew )
        {
            if( refClassModule.isAbstract )
            {
                error('"' + refClassModule.fullclassname + '" is abstract class. can not be instances.', 'type');
            }else if( refClassModule.isStatic )
            {
                error('"' + refClassModule.fullclassname + '" is static class. can not be instances.', 'type');
            }
        }
        if( refClassModule.fullclassname !== classmodule.fullclassname )
        {
            setClassModuleUsed(refClassModule, classmodule );
        }
    }

    var isstatic = it.current.value === type || type==='Class' || (desc && desc.id==='object');
    while ( it.next )
    {
        if ( it.next instanceof Ruler.STACK )
        {
            it.seek();
            var first = it.current.content()[0];
            var last  = it.current.previous(-1);
            if( first.value === '[' || first.value === '('  )
            {
                it.current.content().shift();
            }
            if( last.value === ']' || last.value === ')'  )
            {
                it.current.content().pop();
            }
            var value;
            if( it.current.type() === '(property)' )
            {
                value = toString(it.current, classmodule,'String');
                if( !value )error('Missing expression', 'syntax');
                if( Utils.isConstant( value ) && value !=='this' )
                {
                    error( 'Invalid property name the '+value, 'reference');
                }

                if( property.name.length > 1 )
                {
                    property = createDescription(it, classmodule, property);
                }
                property.name.push( [value] );
                property.info.push( '['+value+']' );
                property.runningCheck=true;
                property.descriptor = null;
                if( desc && desc.id==='var')
                {
                    var refType = getDescribeType( desc );

                    //通过内部变量引用的值的类型为全局对象
                    //类型为全局对象,允许直接引用
                    if( desc.valueType==="JSON" || globals.hasOwnProperty( refType ) )
                    {
                        property.runningCheck=false;
                        property.descriptor = desc;
                        property.isglobal = true;
                    }
                }
                desc = null;
                property.type='*';

            }else if( it.current.type() === '(expression)' )
            {
                var isFun = desc && (desc.id === 'function' || desc.id === 'class' ||
                    desc.referenceType==='Function' || desc.type ==="Class" ||
                    desc.origintype ==="Function" || desc.origintype ==="Class" ) && desc.isAccessor !== true;

                var isClassProp = desc && desc.id !=='function' && desc.__stack__ && desc.__stack__.getScopeOf().keyword()==="class";
                if( property.accessor || (desc && desc.isAccessor) || (desc && !isFun && isReferenceType( desc.type ) && desc.type !=="Object" ) || (!isFun && isClassProp )  )
                {
                    error('"' + property.info.join('.') + '" is not function', 'type' );
                }

                if( !isNew && (desc && desc.id==="class" ) && property.thisArg !=="super" )
                {
                    classType = getImportClassByType(classmodule, desc.type);
                    refClassModule = getmodule(classType);
                    if ( refClassModule.nonglobal ===true )
                    {
                        error('"' + property.info.join('.') + '" is not function', 'type' );
                    }
                    setClassModuleUsed(refClassModule, classmodule);
                }

                property.type = desc ? desc.type : "*";
                property.descriptor = desc;
                property.expression = true;
                value = checkCallParameter( it, desc, property );
                property.param = value;

                //全局函数的访问器
                /*if( desc && desc.param instanceof Array && desc.param.length===1 && desc.isFunAccessor===true )
                {
                    //没有指定参数就是getter反之setter
                    if( value.length === 0 )
                    {
                        property.type = isReferenceType(desc.param[0]) ? desc.param[0] : '*';
                        property.referenceType = property.type;
                    }
                }*/

                if( !isFun || property.isThis === false )
                {
                    property.type = '*';
                    property.runningCheck=true;
                    if( property.before[0] === "new" )
                    {
                        error('"' + property.info.join('.') + '"is not Function or Class', 'type' );
                    }

                }else if( isNew && (desc.type ==="Class" || desc.type==="Function") )
                {
                    property.type = '*';
                    property.referenceType = '*';
                    property.descriptor = null;
                }

                //清除new运算符标识
                if( isNew && (desc.type ==="Class" || desc.type==="Function" || desc.id==="class") ){
                    isNew = false;
                }

                if( it.next && (it.next.value==='.' || (it.next instanceof Ruler.STACK && (it.next.type() === '(property)' || it.next.type() === '(expression)' ))))
                {
                    if (type === 'void')error('"' + it.prev.value + '" no return value', 'reference');
                    isstatic=false;
                    property = createDescription(it, classmodule, property);
                }

            }else
            {
                error('Unexpected expression for "'+joinProperty( property.info )+'"', '');
            }

        } else if( it.next.value === '.' )
        {
            it.seek();

        } else if( it.next.id === '(identifier)' || (it.next.id === '(keyword)' && it.current.value==='.') )
        {
            it.seek();
            property.accessor = '';
            var use = '';

            //是否一个指定的命名空间
            if( it.next && it.next.value === '::' )
            {
                use = it.current.value;
                var sem = classmodule.namespaces[  use ] || it.stack.getScopeOf().define( use );
                if( !sem )
                {
                    error( '"'+use+'" is not defined of namespace','reference');
                }
                if( sem.id ==="var" || sem.id==="let" || sem.id==="const" )
                {
                    property.runningCheck=true;
                    desc=null;

                }else if( sem.id !=="namespace" )
                {
                    sem.type = getType(sem.type);
                    var nsmodule = getmodule(sem.fullclassname||sem.type);
                    if( !nsmodule || nsmodule.id !=="namespace" ){
                        error( '"'+use+'" is not defined of namespace','reference');
                    }
                }
                it.seek();

                //如果是一个动态属性
                if( it.next instanceof Ruler.STACK )
                {
                    property.use = use;
                    continue;

                }else
                {
                    it.seek();
                }
            }

            if( property.name.length > 1  )
            {
                property = createDescription(it, classmodule, property);
            }

            property.use = use;
            if( it.current.value )
            {
                property.name.push( it.current.value );
                property.info.push( it.current.value );
            }

            var desctype = getDescribeType( desc );

            //JSON 类型的引用
            if( desc && (desctype==="JSON" || desc.valueType==="JSON") )
            {
                refClassModule = getmodule( "JSON" );
                desc = getClassPropertyDesc(it, refClassModule, isstatic ? 'static' : 'proto', classmodule, true , property );
                type = '*';
                if( !desc )
                {
                    desc = {type:"*",referenceType:"JSON", "notCheckType":true};
                    property.runningCheck = false;
                }else{
                    type = desc.type;
                    if( desc.id==="function" )type = "Function";
                    if( it.next && Utils.isMathAssignOperator(it.next.value) )
                    {
                        if ( desc.id === 'const' )
                        {
                            error('"' + property.name.join('.') + '" is not writable', '');
                        }else if ( desc.id === 'function')
                        {
                            error('"'+property.name.join('.')+'" function is not can be modified', '');
                        }
                    }
                }
                isstatic= type ==='Class' || desc.id==='object';
                property.descriptor = desc;
                property.type = type;
            }
            //指定不检查引用
            else if( desc && desc.notCheckType === true )
            {
                property.runningCheck = true;
                refClassModule =desc && desc.id==="object" ? desc : getmodule( desctype );
                desc = getClassPropertyDesc(it, refClassModule , isstatic ? 'static' : 'proto', classmodule, true , property );
                type = "*";
                if( desc )
                {
                    property.runningCheck = false;
                    type = desc.type;
                    if( desc.id==="function" )type = "Function";
                    isstatic= type ==='Class' || desc.id==='object';
                    if( it.next && Utils.isMathAssignOperator(it.next.value) )
                    {
                        if ( desc.id === 'const' )
                        {
                            error('"' + property.name.join('.') + '" is not writable', '');

                        }else if ( desc.id === 'function')
                        {
                            error('"'+property.name.join('.')+'" function is not can be modified', '');
                        }
                    }
                }
                property.descriptor = desc;
                property.type       = type;
            }
            //类型引用
            else if ( desc && isReferenceType(desctype) )
            {
                classType = getImportClassByType(classmodule, desctype );
                refClassModule = getmodule( classType );
                if( !refClassModule && Object.prototype.hasOwnProperty.call( classmodule.declared, classType ) )
                {
                    refClassModule = classmodule.declared[classType];
                    if( refClassModule.isInternal !== true )
                    {
                        refClassModule = null;
                    }
                }
                //标记已经使用的类型
                if( refClassModule && refClassModule.fullclassname !== classmodule.fullclassname )
                {
                    setClassModuleUsed(refClassModule, classmodule);
                }

                desc = getClassPropertyDesc(it, refClassModule , isstatic ? 'static' : 'proto', classmodule,  classType === "Object" , property );
                type = "*";

                if( desc )
                {
                    type = desc.type;
                    property.descriptor = desc;
                    isstatic = type === 'Class' || desc.id === 'object';

                    //如果是一个函数或者是一个访问器
                    if(desc.id === 'function')
                    {
                        if( typeof desc.value === "object" )
                        {
                            var setter = !!( it.next && Utils.isMathAssignOperator(it.next.value) );
                            if( setter && !desc.value.set )error( '"'+it.current.value+'" setter does exists');
                            if( !setter && !desc.value.get )error( '"'+it.current.value+'" getter does exists');
                            property.accessor = setter ? 'set' : 'get';
                            if( property.accessor === 'get' )
                            {
                                property.type = type;

                            }else if( property.accessor ==="set")
                            {
                                property.type = "void";
                                property.referenceType = "void";
                            }
                        }

                        //如果只是对一个函数的引用
                        if( !property.accessor && !desc.isAccessor )type = 'Function';
                    }
                }
                property.type = type;

                //如果下一个是赋值运算符则检查当前的表达式
                if( it.next && Utils.isMathAssignOperator(it.next.value) )
                {
                    if ( desc.id === 'const' || (desc.id === 'function' && property.accessor!=="set") )
                    {
                        if( it.stack.parent().keyword() !=='statement' )error('"' + property.name.join('.') + '" is not writable', '');

                    }else if ( desc.id === 'function' && property.accessor !== "set" )
                    {
                        error('"'+property.name.join('.')+'" function is not can be modified', '');
                    }
                }
            }
            //全局类的引用
           /* else if(desc && desc.id==="class" && desc.nonglobal !==true )
            {
                desc = getClassPropertyDesc(it, refClassModule , isstatic ? 'static' : 'proto', classmodule, false , property );
                type = desc.type;
                if( desc.id==='function')type = 'Function';
                isstatic= type ==='Class' || desc.id==='object';
                if( it.next && Utils.isMathAssignOperator(it.next.value) )
                {
                    if ( desc.id === 'const' )
                    {
                        error('"' + property.name.join('.') + '" is not writable', '');

                    }else if ( desc.id === 'function')
                    {
                        error('"'+property.name.join('.')+'" function is not can be modified', '');
                    }
                }
                property.descriptor = desc;
                property.type = type;
            }*/
            //未知的情况，运行时验证
            else
            {
                property.descriptor = null;
                property.runningCheck=true;
                property.type='*';
                desc = null;
            }
        }
        else
        {
            break;
        }
    }

    //是否有后置运算符
    if( it.next && Utils.isIncreaseAndDecreaseOperator(it.next.value) )
    {
        it.seek();
        property.after = it.current.value;
    }

    //前后增减运算符只能是一个引用
    if( (property.after && property.before.length>0) || (property.expression && property.after) )
    {
        error( '"'+it.next.value+'" can only is reference', 'reference');
    }

    //类型转换运算符
    if( it.next && it.next.value==='as' )
    {
          it.seek();
          it.seek();
          var totype= getClassTypeByDefinedFullName(it);
          if( !totype )
          {
              error( 'Unexpected keyword "as" ', 'type');
          }
          if( totype === classmodule.classname )
          {
              property = createDescription(it, classmodule, property);
              typename = classmodule.type;
              property.type = typename;
              it.stack.valueType = typename;

          }else
          {
              var typename = getDefinedClassName(classmodule, totype);
              if (!typename)
              {
                  error('"' + totype + '" is not exists', 'reference');
              }

              var origin = property;
              var _reftype = getDescribeType( origin );
              property = createDescription(it, classmodule, property);
              property.type = typename;
              it.stack.valueType = typename;
              setClassModuleUsed( getmodule( typename ) , classmodule );
              if( !isReferenceType( _reftype ) || !checkTypeOf(classmodule, typename, _reftype , origin ) )
              {
                  var info = '"' + Iteration.lastStack.line + ':' + Iteration.lastStack.cursor + '"';
                  typename = getDefinedShortClassName(classmodule,typename);
                  property.thisArg = operateMethodOfCheckType(classmodule, typename.indexOf('.') >= 0 ? "System.getDefinitionByName('" + typename + "')" : typename, property.thisArg, info);
                  property.name = [];
              }
          }
          property.isAs = true;
    }

    var _p=it.stack.parent();
    if( _p && _p.keyword()==='object' && _p.type()==='(expression)' && property.type !=='*' )
    {
        var _valueType = _p.valueType || (_p.valueType=[]);
        if( _valueType.indexOf(property.type) <0) {
            _valueType.push(property.type);
        }
    }
    return property;
}

/**
 * 合并属性链
 * @param props
 * @returns {string|*|{type, id, param}}
 */
function joinProperty( props )
{
    props = props.reduce(function (accumulator,value) {
          if( value.charAt(0) ==="[" ){
              accumulator[ accumulator.length-1 ]+=value;
          }else{
              accumulator.push( value );
          }
          return accumulator;
    },[]);
    return props.join(".");
}

/**
 *  检查实例类型
 */
function checkInstanceType( moduleClass, instanceModule , type )
{
    var desc = getmodule( getImportClassByType(moduleClass,  type ) );
    type = desc.fullclassname || desc.type;
    if( type ==='Object' )return true;
    while ( instanceModule && instanceModule.id==='class' )
    {
        var classname = instanceModule.fullclassname || instanceModule.type;
        if( classname===type )
        {
            return true;
        }
        if( instanceModule.inherit )
        {
            instanceModule = getmodule( getImportClassByType(instanceModule, instanceModule.inherit) );
        }else
        {
            return false;
        }
    }
    return false;
}

function getOperateMethodProps( props )
{
    return props.length>1 ?  '['+props.join(',')+']': props.join('');
}

function operateMethodOfCheckType( classmodule,type,value, info )
{
    if( globalsConfig.mode==1 )
    {
        return 'Reflect._type('+info+','+classmodule.classname+','+ type + ',' + value+ ')';
    }
    return  globalsConfig.mode==3 ? value : 'Reflect.type('+ value + ',' + type+ ')';
}

function operateMethodOfGet(classmodule, thisvrg, desc, props ,info, before)
{
    var checkRunning = desc.runningCheck || globalsConfig.mode==1;
    before = before || '';
    if( before && !Utils.isIncreaseAndDecreaseOperator(before) )before='';

    if( before || desc.after )
    {
        checkRunning = true;
    }

    //引用变量
    if( props.length==0 )
    {
        return before + thisvrg + desc.after;
    }
    props = createReferenceProps( props,  checkRunning );
    if( !checkRunning && desc.descriptor )
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

        var owner = desc.descriptor.owner ? getmodule( desc.descriptor.owner ) : null;

        //对象属性
        if( !owner || owner.nonglobal !== true )
        {
            map = map.concat( props[0] );
            return joinProperty( map );
        }

        var ns = getNamespaceUriByModule(classmodule,desc.use||desc.descriptor.privilege);

        //成员私有属性
        if( desc.descriptor.id !== 'function' )
        {
            //静态属性
            if( desc.descriptor.isStatic )
            {
                map = map.concat( ns+props[0] );
                return joinProperty( map );
            }

            if( desc.descriptor.privilege === "private" )
            {
                map = map.concat(props[0]);
                if(  desc.isglobal !==true ){
                    map.splice(0, 1, map[0] + '[' + globalsConfig.context.private + ']');
                }
                return before+joinProperty(map)+desc.after;
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
             return joinProperty( map );
         }
         if(desc.super)
         {
             map.push("call");
             param.push( thisvrg );
         }
         return joinProperty( map )+'('+param.join(",")+')';
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

    var ns = props.length > 0 ? getUseNamespace( desc ) : null;
    if( ns && ns.length > 0 )
    {
        index=4;
        param.splice(index++,1,'['+ns.join(",")+']');
    }

    param.splice(index,2);
    pushInfo(param, info, desc, null , classmodule);
    return method+'('+param.join(',')+')';
}

function operateMethodOfSet(classmodule, thisvrg, desc, props ,info, value, operator )
{
    //直接对引用变量进行操作
    if( props.length === 0 )
    {
        return thisvrg+(operator||'=')+value;
    }

    var _value = value;
    if( operator !=='=' && Utils.isMathAssignOperator(operator) )
    {
        value = operateMethodOfGet(classmodule, thisvrg, desc, props ,info)+operator.slice(0,-1)+value ;
    }

    var checkRunning = desc.runningCheck || globalsConfig.mode==1;
    props = createReferenceProps( props,  checkRunning );

    if( !checkRunning && desc.descriptor )
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

        var owner = desc.descriptor.owner ? getmodule( desc.descriptor.owner ) : null;

        //对象属性
        if( (!owner || owner.nonglobal !== true) && desc.descriptor.isAccessor !== true )
        {
            map = map.concat( props[0] );
            return joinProperty( map )+operator+_value;
        }

        var ns = getNamespaceUriByModule(classmodule,desc.use||desc.descriptor.privilege);

        //成员私有属性
        if( desc.descriptor.id !== 'function' && desc.descriptor.isAccessor !== true && (desc.descriptor.isStatic || desc.descriptor.privilege === "private") )
        {
            //静态属性
            if( desc.descriptor.isStatic )
            {
                map = map.concat( ns+props[0] );
                return joinProperty( map )+operator+_value;
            }

            //实例属性
            map = map.concat( props[0] );
            if( desc.isglobal !==true )
            {
                map.splice(0, 1, map[0] + '[' + globalsConfig.context.private + ']');
            }
            return joinProperty( map )+operator+_value;
        }

        var param = [value];
        map = map.concat('Set_' + ns + props[0]);
        if(desc.super)
        {
            map.push("call");
            param.unshift( thisvrg );
        }
        return joinProperty( map )+'('+param.join(",")+')';
    }

    var method = globalsConfig.mode==1 ? 'Reflect._set' : 'Reflect.set';
    var param = [desc.super || thisvrg , getOperateMethodProps( props ), value, 'undefined','undefined'];
    var index = 3;
    if( desc.super )
    {
        param.splice(index++,1,thisvrg);
    }

    //使用指定的命名空间
    var ns = props.length > 0 ? getUseNamespace( desc ) : null;
    if( ns && ns.length > 0 )
    {
        index=4;
        param.splice(index++,1,'['+ns.join(",")+']');
    }

    param.splice(index,2);
    pushInfo(param, info, desc, null , classmodule);
    return method+'('+param.join(',')+')';
}

function operateMethodOfApply(classmodule, thisvrg, desc, props ,info)
{
    var checkRunning = desc.runningCheck || globalsConfig.mode==1;

    //生成引用的属性
    props = createReferenceProps(props, checkRunning );

    //调用超类
    if( props.length===0 && globalsConfig.mode !=1 )
    {
        if( desc.super )
        {
            var superModule = getmodule( getImportClassByType(classmodule, desc.super) );
            var code = superModule.nonglobal===true ? desc.super+'.constructor' : desc.super;
            return code+'.call('+[thisvrg].concat(desc.param || []).join(",")+')';
        }
        return thisvrg+"("+(desc && desc.param ? desc.param : []).join(",")+")";
    }

    //不需要运行时检查
    if( !checkRunning && desc.descriptor )
    {
        //直接调用全局函数
        if( Object.prototype.hasOwnProperty.call(globals, thisvrg ) )
        {
            props = createReferenceProps(props, false);
            props.unshift( thisvrg );
            return props.join(".") + "(" + (desc.param || []).join(",") + ")";
        }

        var ns = getNamespaceUriByModule(classmodule,desc.use || desc.descriptor.privilege);

        //如果是对一个变量的引用并且是一个全局函数.
        /*if( !desc.descriptor.owner && desc.descriptor.id!=="class" && !(thisvrg=="this" || thisvrg =="super") )
        {
            var referDesc = desc.funScope.define( thisvrg );
            if( referDesc && !(referDesc.id =="class" || referDesc.id=="namespace") )
            {
                var referType =  getDescribeType(referDesc);
                if( referType ==="JSON" )referType = "Object";

                // var arr:Array=[];
                // arr.push(1);
                if( referType && isReferenceType(referType) )
                {
                    referType = getImportClassByType(classmodule,referType);
                    var referModule = getmodule( referType );
                    if ( referModule.id==="class" && !referModule.nonglobal )
                    {
                        //return referType+'.prototype.'+ns+props[0]+".call("+[thisvrg].concat( desc.param || []).join(",")+")";
                    }
                }
            }
        }*/

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
                map = [ operateMethodOfGet(classmodule, thisvrg, desc, props ,info) ];
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
        return joinProperty( map )+'('+param.join(",")+')';
    }


    //运行时检查
    var method = globalsConfig.mode == 1 ? 'Reflect._call' : 'Reflect.call';
    var param = [desc.super || thisvrg, 'undefined', 'undefined', 'undefined', 'undefined'];
    var index = 1;
    if( props.length > 0 )
    {
        param.splice(index++, 1, getOperateMethodProps(props));
    }

    if (desc.param && desc.param.length > 0) {
        index = 2;
        param.splice(index++, 1, '[' + desc.param.join(",") + ']');
    }

    if (desc.super)
    {
        index = 3;
        param.splice(index++, 1, thisvrg);
    }

    //使用指定的命名空间
    var ns = props.length > 0 ? getUseNamespace(desc) : null;
    if (ns && ns.length > 0) {
        index = 4;
        param.splice(index++, 1, '[' + ns.join(",") + ']');
    }

    param.splice(index, 4);
    pushInfo(param, info, desc, null, classmodule);
    return method + '(' + param.join(',') + ')';
}

function operateMethodOfNew( classmodule, express, desc, info )
{
    var checkRunning = desc.runningCheck || globalsConfig.mode==1;
    if( !checkRunning )
    {
        //如果是一个引用，并且有指定类型
        var referenceType;
        if (desc && desc.descriptor)
        {
            if (desc.descriptor.id === "var")
            {
                referenceType = getDescribeType(desc.descriptor);

            } else if (desc.descriptor.id === "class")
            {
                referenceType = desc.descriptor.type;
            }
        }

        if ( isReferenceType(referenceType) )
        {
            //如果是实例化一个错误类，则把当前的信息添加上
            if (desc.descriptor && checkInstanceType(classmodule, desc.descriptor, 'Error'))
            {
                var p = desc.param || (desc.param = []);
                if (p.length === 0)p.push("");
                if (p.length === 1)p.push('"' + classmodule.filename + '"');
                if (p.length === 2)p.push('"' + info + '"');
            }

            if( referenceType !=="Function" )
            {
                if (referenceType === "Class") {
                    express += ".constructor";
                } else {
                    var refmoduel = getmodule(getImportClassByType(classmodule, referenceType));
                    if (refmoduel && refmoduel.nonglobal === true) {
                        express += ".constructor";
                    }
                }
            }
            return desc.param ? "new " + express + "(" + desc.param.join(",") + ")" : "new " + express + "()";
        }
    }

    var method = globalsConfig.mode==1 ? 'Reflect._construct' : 'Reflect.construct';
    var param = [express,'undefined'];
    if( desc.param && desc.param.length>0)
    {
        param.splice(1,1,'[' + desc.param.join(",") + ']' );
    }else
    {
        param.splice(1,1);
    }
    pushInfo(param, info, desc, express, classmodule );
    return method+'('+param.join(',')+')';
}

function pushInfo(refArr, info, desc, express, classmodule )
{
    if( classmodule )refArr.unshift( classmodule.classname );
    if( globalsConfig.mode==1 )
    {
        if( !express )
        {
            express = joinProperty( desc.info );
        }
        desc.raw = express.replace(/\"/g,'');
        refArr.unshift( '"'+( desc.raw+':'+info)+'"' );
    }
}


function operateMethodOfDel(classmodule, thisvrg, desc, props ,info)
{
    var checkRunning = desc.runningCheck || globalsConfig.mode==1;
    if( props.length === 0 )
    {
        return "delete "+thisvrg;
    }

    if( !checkRunning && desc.descriptor )
    {
        if( desc.funScope )
        {
            var obj = desc.funScope.define( thisvrg );
            if( obj && obj.id==="class" )return 'false';
        }
        var owner = desc.descriptor.owner ? getmodule( desc.descriptor.owner ) : null;
        if( owner && owner.nonglobal===true && ( !owner.isDynamic || owner.isStatic) )
        {
            return "false";
        }
        props = createReferenceProps( props,  false );
        return "delete "+joinProperty( [thisvrg,props[0]] );
    }
    if( desc.super )
    {
        throw new SyntaxError("Unexpected super");
    }
    props = createReferenceProps( props,  checkRunning );
    var method = globalsConfig.mode==1 ? 'Reflect._deleteProperty' : 'Reflect.deleteProperty';
    var param = [thisvrg,props[0]];
    pushInfo(param, info, desc, null, globalsConfig.mode==1 ? classmodule : null );
    return method+'('+param.join(',')+')';
}


function operateMethodOfHas(classmodule,thisvrg, desc, props ,info)
{
    var checkRunning = desc.runningCheck || globalsConfig.mode==1;
    if( !checkRunning )
    {
         if( desc.descriptor && !desc.descriptor.owner )
         {
             return props+" in "+thisvrg;
         }
         return desc.descriptor ? "true" : "false";
    }
    var method = globalsConfig.mode==1 ? 'Reflect._has' : 'Reflect.has';
    var param = [thisvrg, props ];
    pushInfo(param, info, desc,null, classmodule);
    return method+'('+param.join(',')+')';
}

function getNs( ns )
{
    if( ['public','protected','private','internal'].indexOf( ns ) >=0 )
    {
        return globalsConfig.context[ ns ] ||  ns;
    }
    return ns+'.valueOf()';
}

/**
 * 运行时验证引用及操作
 * @param classmodule
 * @param desc
 * @param value
 * @param operator
 * @returns {string}
 */
function checkRunning( classmodule, desc , value , operator )
{
    var thisvrg = desc.thisArg || desc.name[0];
    var props   = desc.name.slice();

    //调用超类属性或者方法
    if( desc.super )thisvrg = 'this';

    //如果引用对象和属性对象完全相同就删除
    if( thisvrg === props[0] )props.shift();

    //前置运算符
    var beforeOperator = desc.before.pop() || '';
    var info='""';

    //当前引用所在行信息
    if (Iteration.lastStack && Iteration.lastStack.line )
    {
        info= Iteration.lastStack.line + ':' + Iteration.lastStack.cursor ;
    }

    if( operator==="in" )
    {
        return operateMethodOfHas(classmodule, thisvrg, desc, value, info);
    }

    var express;
    if( beforeOperator==='new' )
    {
        express=operateMethodOfNew( classmodule, operateMethodOfGet(classmodule, thisvrg, desc, props ,info), desc, info);
        beforeOperator= desc.before.pop();

    }else if( beforeOperator==='delete' )
    {
        express=operateMethodOfDel(classmodule, thisvrg, desc, props ,info);
        beforeOperator= desc.before.pop();

    }else if( beforeOperator==='typeof' )
    {
        express='System.typeOf('+operateMethodOfGet(classmodule, thisvrg, desc, props ,info)+')';
        beforeOperator= desc.before.pop();

    }else
    {
        if (desc.expression)
        {
            express = operateMethodOfApply(classmodule, thisvrg, desc, props, info);
        } else if (value)
        {
            express = operateMethodOfSet(classmodule, thisvrg, desc, props, info, value, operator);
        } else {
            express = operateMethodOfGet(classmodule, thisvrg, desc, props, info, beforeOperator);
        }
        if( beforeOperator && Utils.isIncreaseAndDecreaseOperator(beforeOperator) )beforeOperator = desc.before.pop();
    }

    //组合前置运算符
    while ( beforeOperator )
    {
        //关键字运算符
        switch ( beforeOperator )
        {
            case "throw" :
                //express =  classmodule.classname+'.__throw__('+express+')';
                //break;
            default :
                express = Utils.isKeywordOperator( beforeOperator ) ? beforeOperator+' '+express : beforeOperator+express;
        }
        beforeOperator = desc.before.pop();
    }
    return express;
}

/**
 * 生成一个运行时的引用属性名
 * @param props
 * @param checkRunning
 * @returns Array
 */
function createReferenceProps(props, checkRunning )
{
    //引用的属性名
    props = props.map(function (item) {
        //动态属性
        if ( item instanceof Array ){
            return checkRunning ? item.join('') : "["+item.join('')+"]";
        }
        return checkRunning ? '"' + item + '"' : item;
    });
    return props;
}

/**
 * 解析一个表达式
 * @param desc
 * @returns {*}
 */
function parse(classmodule, desc , value ,operator, returnValue )
{
    var express=[];
    if ( typeof desc === "string")
    {
        express.push(desc);
        if (operator)
        {
            express.push(operator);
            express.push(value);
        }
        return express.join('');

    }else if(desc.coalition===true)
    {
        return desc.thisArg;
    }

    //运行时检查
    return checkRunning(classmodule, desc , value ,operator , returnValue );
}

/**
 * 组合表达式
 * @param it
 * @param classmodule
 * @returns {*[]}
 */
function bunch(it, classmodule)
{
    var express = [ getDescriptorOfExpression(it, classmodule) ];
    var operator;
    var type= '*';
    var lastExpress = express[0];
    while( it.next && Utils.isLeftAndRightOperator(it.next.value) && !Utils.isMathAssignOperator(it.next.value)  )
    {
        it.seek();
        operator = it.current.value;
        if ( !it.next )error('Missing expression', '');
        it.seek();
        if( operator === 'instanceof' || operator === 'is' || operator==="in" )
        {
            var property1 =  express.pop();
            var target1 = parse(classmodule, property1);
            var property2 = getDescriptorOfExpression(it, classmodule);
            if( operator==="in" )
            {
                 var isstring =  /^[\'\"]+/.test( target1 );
                 var refdesc=null;
                 var refvalue = parse(classmodule, property2 );
                 if( property2 && isstring )
                 {
                     var desctype = getDescribeType( property2 );
                     if( isReferenceType(desctype) )
                     {
                         var refObj = getmodule( getImportClassByType(classmodule, desctype ) );
                         if( refObj.nonglobal ===true )
                         {
                             if( refObj.isDynamic )
                             {
                                 isstring=false;
                             }else
                             {
                                 var prop = property2.thisArg === desctype ? "static" : "proto";
                                 refdesc = getClassPropertyDescNS('', target1.replace(/^[\'\"]+|[\'\"]+$/g, ""), prop, refObj, classmodule, this, false, property2 );
                                 refdesc = refdesc.length == 1 ? refdesc[0] : null;
                             }
                         }else{
                             refdesc = refObj;
                         }
                     }
                 }
                property2.thisArg = refvalue;
                property2.descriptor = refdesc;
                property2.runningCheck  = !refdesc;
                express.push( checkRunning(classmodule, property2, target1 , "in") );

            }else
            {
                operator = operator==='instanceof' ? 'instanceOf' : operator;
                express.push('System.'+operator+'('+target1+','+parse(classmodule, property2 )+')');
            }
            type= 'Boolean';

        }else
        {
            var leftType = getDescribeType(lastExpress);
            var value = getDescriptorOfExpression(it, classmodule);
            if( operator ==='in' )
            {
                express.push(' ');
                type= 'Boolean';

            }else if( Utils.isMathOperator(operator) )
            {
                type = 'Number';
            }

            if( operator==="+" && (leftType ==='String' || value.type === 'String') )
            {
                type='String';
            }

            express.push( operator );
            express.push( value );
        }
    }

    //逻辑表达式  a && b  或者是 运算表达式 a instanceof b  a > b
    if( express.length > 1 )
    {
        var items=[];
        for(var i in express )
        {
            items.push( typeof express[i] === "string" ? express[i] : parse(classmodule,express[i]) );
        }
        return {type:type,thisArg:items.join(""),coalition:true};
    }
    return express[0];
}

/**
 * 解析表达式
 * @param it
 * @returns {*}
 */
function expression( stack, classmodule ,  acceptType , fromParam, fromReturn )
{
    if( stack.content().length===0 )return '';
    var it = new Iteration( stack , classmodule );
    var express = it.content;
    var val;
    var refExpress;
    while ( it.seek() )
    {
        val = bunch(it, classmodule);
        refExpress = val;
        if(val)express.push( val );
        // a = b or a += b ;
        while( it.next && Utils.isMathAssignOperator(it.next.value) )
        {
            it.seek();
            express.push( it.current.value );
            if (!it.next)error('Missing expression', '');
            it.seek();
            val = bunch(it, classmodule);
            if(val)express.push(val);
            //给声明的属性设置值的类型
            var type = getDescribeType( val );
            if( isReferenceType( type ) ){
                refExpress.referenceType= type;
                if( refExpress.descriptor ){
                    refExpress.descriptor.valueType = type;
                    refExpress.descriptor.referenceType = type;
                }
            }
            refExpress = val;
        }
    }

    //赋值运算从右向左（从后向前）如果有赋值
    var describe =  express.pop();
    var valueDescribe = describe;
    var value = parse(classmodule, describe );
    var str=[];
    if( express.length === 0 )
    {
        str.push(value);

    }else
    {
        var operator;
        var returnValue = true;
        var separator = stack.parent().keyword() === 'object' && stack.parent().type() === '(expression)' ? ',' : ';\n';
        while (express.length > 0)
        {
            //= += /= *= -= ...
            operator = express.pop();

            //reference expression
            describe = express.pop();
            if( !describe )
            {
                error('Unexpected error');
            }

            //组合的表达式
            if (describe.coalition === true || describe.expression)
            {
                error('"' + joinProperty( describe.info ) + '" is not reference', 'syntax');
            }

            //未声明的引用不能修改
            if (describe.descriptor)
            {
                if (describe.descriptor.id === 'class' || describe.descriptor.id === 'object')
                    error('"' + joinProperty( describe.info ) + '" is be protected', 'type');
                if (describe.descriptor.id === 'const')
                {
                    if (describe.descriptor.constValue)error('"' + describe.name.join('.') + '" is a constant', 'type');
                    describe.descriptor.constValue = true;
                }
            }

            var valueType = getDescribeType(valueDescribe);
            var _acceptType = describe.descriptor ? describe.descriptor.type : null;

            //当前设置的引用是否为一个属性或者setter
            if( describe.descriptor && describe.descriptor.id==='function' )
            {
                if( describe.accessor !=='set' && describe.descriptor.fromVarToAccessor !==true && describe.descriptor.value && !describe.descriptor.value.set)
                {
                    error('"' +joinProperty( describe.info ) + '" is not setter', 'type');
                }
                //是一个函数，并只接受的参数类型
                if( describe.descriptor.paramType )
                {
                    _acceptType = describe.descriptor.paramType[0] || '*';
                }
            }

            //有指定类型必须检查
            if ( isReferenceType(_acceptType) && operator === '=' )
            {
                //运行时检查类型
                if ( valueType=== '*' )
                {
                    var info = '"'+Iteration.lastStack.line + ':' + Iteration.lastStack.cursor+'"';
                    if( fromParam !==true )
                    {
                        var _typeClass = getmodule( getImportClassByType( classmodule , _acceptType ) );
                        if( !_typeClass )
                        {
                            error('"' + _acceptType + '" type does not exists.', 'type');
                        }
                        setClassModuleUsed(_typeClass, classmodule );
                        value = operateMethodOfCheckType( classmodule,_acceptType.indexOf('.') >= 0 ? "System.getDefinitionByName('" + _acceptType + "')" : _acceptType,value, info );
                    }

                } else if( !checkTypeOf(classmodule, _acceptType , valueType, valueDescribe , describe ) )
                {
                    error('"' + joinProperty( describe.info ) + '" type does not match. must is "' + _acceptType + '"', 'type');
                }
            }

            //设置引用的数据类型
            if ( describe.descriptor )
            {
                describe.descriptor.referenceType = valueType;
                if( valueDescribe ) {
                    describe.descriptor.isNullType = valueDescribe.isNullType;
                }
            }

            var ret = parse(classmodule, describe, value, operator, returnValue);

            //多个赋值运算符
            if (express.length > 0)
            {
                ret += separator;
                valueDescribe = describe;
                value = parse(classmodule, describe);
            }
            returnValue = true;
            str.push(ret);
        }
    }

    value = str.join('');
    if( isReferenceType(acceptType) )
    {
        var valueType = getDescribeType(valueDescribe);
        var isReturn = true;
        if( valueDescribe.descriptor && valueDescribe.descriptor.id==="function" && valueDescribe.descriptor.__stack__ && !valueDescribe.descriptor.isInterface )
        {
            isReturn = valueDescribe.descriptor.__stack__.getScopeOf().isReturn;
        }

        if( fromReturn && (valueType ==="void" || !isReturn ) )
        {
            error( joinProperty( describe.info )+' not return', 'type');
        }

        //运行时检查类型
        if ( valueType === '*' )
        {
            var info = '"' + Iteration.lastStack.line + ':' + Iteration.lastStack.cursor + '"';
            if( fromParam !== true )
            {
                value = operateMethodOfCheckType( classmodule,acceptType.indexOf('.') >= 0 ? "System.getDefinitionByName('" + acceptType + "')" : acceptType,value, info );
            }

        } else if ( !checkTypeOf(classmodule, acceptType, valueType, valueDescribe ) && !( stack.parent().type() ==='(property)' && valueType==='Number' ) )
        {
            //如果不是全局对象函数访问器
            if( !(valueDescribe.descriptor && valueDescribe.descriptor.isFunAccessor && valueDescribe.param instanceof Array && valueDescribe.param.length===0) )
            {
                error( '"'+joinProperty( describe.info )+'" type does not match. must is "' + acceptType + '"', 'type');
            }
        }
    }
    return value;
}

var skipType = ['*','void'];
function isReferenceType(type , checkType )
{
    if( type==null )return false;
    checkType = checkType || skipType;
    return checkType.indexOf( type.toLowerCase() ) < 0;
}

function getDescribeType( refDesc )
{
    if( !refDesc )return '*';
    if( (refDesc.type === '*' || !refDesc.type) )
    {
        if( refDesc.referenceType && isReferenceType( refDesc.referenceType ) ){
            return refDesc.referenceType;
        }
        if( refDesc.descriptor && isReferenceType(refDesc.descriptor.type) )
        {
            return refDesc.descriptor.type;
        }
        if(  refDesc.descriptor && isReferenceType(refDesc.descriptor.referenceType) )
        {
            return refDesc.descriptor.referenceType;
        }
        return '*';
    }
    return refDesc.type || '*';
}

/**
 * 根据类型获取类全名
 * @param classmodule
 * @param type
 * @returns {*}
 */
function getImportClassByType(classmodule, type )
{
    //全类型名称
    if( type.indexOf('.') > 0 && Object.prototype.hasOwnProperty.call( defineModules,type) )
    {
        return type;
    }

    if( classmodule.type === type || classmodule.classname===type)return classmodule.fullclassname;
    if( classmodule.import && Object.prototype.hasOwnProperty.call( classmodule.import,type) )return classmodule.import[type];
    for( var i in classmodule.import )if( classmodule.import[i]===type )
    {
        return type;
    }

    if( classmodule.nonglobal ===true && classmodule.declared &&  Object.prototype.hasOwnProperty.call( classmodule.declared,type) )
    {
        return type;
    }
    if( Object.prototype.hasOwnProperty.call(globals,type) )return type;
    error( '"'+type+'" type does exists','type');
}

function getClassPropertyDescByProp(prop, proto, refObj, classmodule, it , isset , ns ,propertyDesc )
{
    if( proto && Object.prototype.hasOwnProperty.call(proto, prop) )
    {
        var desc = proto[prop];

        //如果在本类中有定义
        if ( desc )
        {
            //非全局模块和外部类需要检查权限
            if( !checkPrivilege(desc, refObj, classmodule ,it , ns ) )
            {
                //console.log( desc.privilege, refObj.fullclassname  , classmodule.fullclassname, desc.owner )
                //error('"' + it.current.value + '" inaccessible', 'reference');
                return null;    
            }

            if( desc.isAccessor )
            {
                if( isset && desc.value && desc.value.set )return desc;
                if( !isset && desc.value && desc.value.get )return desc;

            }else
            {
                return desc;
            }
        }
    }
    return null;
}

function getClassPropertyOwnerDesc(it, refObj, name ,prop, ns,classmodule , isset, propertyDesc )
{
    //默认命名空间
    var desc=getClassPropertyDescNS('',prop,name,refObj,classmodule,it,isset, propertyDesc );

    //自定义命名空间
    if( ns )
    {
        var descNs;
        for (var n in ns )
        {
            descNs = getClassPropertyDescNS(n,prop,name,refObj,classmodule,it,isset, propertyDesc );
            if( descNs.length>0 )
            {
                if ( (desc.length + descNs.length) > 1 )error('"' + joinProperty( propertyDesc.info ) + '" inaccessible', 'reference');
                desc = descNs;
                break;
            }
        }
    }
    return desc;
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
function getClassPropertyDesc(it, refObj, name , classmodule , flag, propertyDesc )
{
    if( refObj )
    {
        var prop = it.current.value;
        var ns;
        if( propertyDesc.use )
        {
           ns = {};
           ns[propertyDesc.use]=true;

        }else
        {
            ns = it.stack.getScopeOf().define("use");
        }

        //这里引用的是一个类，并非类的实例
        if ( prop === refObj.type )return refObj;
        var isset = !!(it.next && Utils.isMathAssignOperator(it.next.value));
        var desc = getClassPropertyOwnerDesc(it, refObj, name , prop, ns, classmodule , isset, propertyDesc );
        desc =desc[0];
        //默认都继承对象
        if ( !desc && globals.Object[name][prop])
        {
            desc = globals.Object[name][prop];
        }
        if( desc )
        {
            if( isset && ( desc.id ==="const" || ( desc.id==="function" && !( desc.value && desc.value.set ) ) ) )
            {
                 error('"'+joinProperty(propertyDesc.info)+ '" is not writable', 'reference');
            }
            return desc;
        }
        if( isset )
        {
           desc = getClassPropertyOwnerDesc(it, refObj, name ,prop, ns, classmodule , false, propertyDesc );
           if( desc[0] ){
               error('"'+joinProperty(propertyDesc.info)+ '" is not writable', 'reference');
           }
        }
    }
    if( refObj.id==="class" && refObj.isDynamic )return {type:'*'};
    if(flag===true)return null;
    error('"' +joinProperty( propertyDesc.info ) + '" is not defined', 'reference');
}

function getClassPropertyDescNS(ns, prop, name, refObj, classmodule, it , isset, propertyDesc )
{
    var desc=[];
    var parent = refObj;
    var ret;

    //在继承的类中查找
    do{
        if( parent[name] )
        {
            ret = getClassPropertyDescByProp(prop, ns ? parent[name][ns] : parent[name], parent, classmodule, it, isset , ns , propertyDesc );
            if( ret )desc.push(ret);
            if( desc.length > 1 || (!ns && ret) )return desc;
        }
    } while ( parent && parent.inherit && parent.id==='class' && (parent = getmodule( getImportClassByType(parent, parent.inherit) ) ) );
    return desc;
}

/**
 * 检查所在模块中的属性，在当前场景对象中的访问权限
 * @param desc 属性描述
 * @param inobject 查找的类对象
 * @param currobject 当前类对象
 */
function checkPrivilege(desc, inobject, currobject ,it, ns )
{
    if( currobject.type === inobject.type )
    {
        if( desc.privilege && "protected,public,private,internal".indexOf( desc.privilege ) < 0 )
        {
           if( desc.privilege !== ns  )
           {
               return false;
           }
        }
        return true;
    }

    //非全局模块需要检查
    if ( typeof desc.privilege !== "undefined" )
    {
        //包内访问权限
        var internal = inobject.package === currobject.package && desc.privilege === 'internal';

        //子类访问权限
        var inherit = desc.privilege === 'protected' && checkInstanceType(currobject,currobject,inobject.fullclassname);

        //判断访问权限
        if ( !(internal || inherit || desc.privilege === 'public') )
        {
            if( desc.privilege && "protected,public,private,internal".indexOf( desc.privilege ) < 0 )
            {
                if( desc.privilege === ns )
                {
                    return true;
                }
            }
            return false;
        }
    }
    return true;
}

function metaTypeToString( stack , type )
{
    var content  = stack.content();
    if( stack.keyword()==='metatype'){
        content = content[1].content();
        if( Ruler.META_TYPE.indexOf( content[0].value ) < 0 )
        {
            error('Invaild Metatype label','syntax');
        }
        type = content[0].value;
    }

    if( (type==='Embed') && stack.type()==='(expression)')
    {
        if( content[1].previous(0).value !=='source' )
        {
            error('Missing identifier source','syntax');
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
var block_statck = ['function','for','if','else','while','try','catch','switch']
function formatCode(stack, code )
{
    var id = stack.keyword();
    if( block_statck.indexOf(id)>=0 )
    {
        code = code.split( /([\r\n]+)/g );
        var end = code.slice(-1);
        code = code.filter(function (val) {
             return !(val == '\n' || val == '\r\n' || val=='');
        })
        if( code.length > 2 )
        {
            return code.slice(0,-1).join( '\n\t' )+'\n'+code.slice(-1) + (end=='' ? '\n' : '');
        }
        return code.join("\n")+ (end=='' ? '\n' : '');
    }
    return code;
}

/**
 * 转换语法
 * @returns {String}
 */
function toString( stack, module, acceptType , fromParam , fromReturn)
{
    if( stack.keyword() === 'expression')
    {
        return  formatCode( stack, expression( stack , module , acceptType, fromParam, fromReturn ) );
    }
    var it = new Iteration(stack, module );
    while ( it.seek() )
    {
        if (it.current instanceof Ruler.STACK)
        {
            it.content.push( toString(it.current, module ) );

        }else if( typeof it.current === "string")
        {
            it.content.push( it.current );
        }
        else
        {
            if ( it.current.id === '(keyword)' && (it.current.value === 'in' || it.current.value === 'is' || it.current.value === 'instanceof' ))
            {
                it.content.push(' ');
            }

            it.content.push( it.current.value );
            if( it.current.value===';' && it.next && stack.keyword() !=="condition" )
            {
                it.content.push('\n');

            }else if( it.current.value==='{' || it.current.value==='}')
            {
                var kid = stack.keyword();
                if(  ['if','else','function','do','switch','while','for'].indexOf(kid)>=0 )
                {
                    if( !(it.current.value==='}' && kid==="function") ){
                        it.content.push('\n');
                    }
                }
            }
            if ( it.current.id === '(keyword)' && !( it.next && (it.next.value ==='(' || it.next.value ==='[') ) )it.content.push(' ');
        }
    }
    if( stack.keyword() === 'object' && isReferenceType(acceptType) )
    {
        var type = getType( stack.type() );
        if( type==='Array' || type==='JSON' || type==='Object' )
        {
           if ( !checkTypeOf(module, acceptType,type) )
           {
                error( '"'+it.content.join('')+'" type does not match. must be "' + acceptType + '"', 'type');
            }
        }
    }
    return formatCode( stack,it.content.join('') );
}


/**
 * 执行模块的原型链，直到回调函数返回值或者已到达最上层为止
 * @param classModule
 * @param callback
 * @returns {*}
 */
function doPrototype(classModule, callback)
{
    while ( classModule )
    {
        var val = callback( classModule );
        if( val )return val;
        if( classModule.inherit )
        {
            classModule = getmodule( getImportClassByType(classModule, classModule.inherit) );
        }else
        {
            return null;
        }
    }
    return null;
}

/**
 * 检查类型
 * 检查 currentType 是否属于 needType 包括接口类型
 * @param needType
 * @param currentType
 * @returns {*}
 */
function checkTypeOf(classModule, needType, currentType, describeType, needDescribe )
{
    //接收的类型为Object
    if( needType==='Object' )
    {
        //如当前值的类型是包裹容器验证不通过
        return ['Boolean','Number'].indexOf( currentType )<0;
    }
    //接收的类型只要不是包裹容器并且当前值的类型为Object验证通过
   /* else if( currentType === "Object" )
    {
        return ['String','Boolean','Number'].indexOf(needType) < 0;
    }*/

    if( describeType.isNullType === true )
    {
        return [/*'String',*/'Boolean','Number'].indexOf(needType) < 0;
    }

    if( needType==='Class' && (currentType==='Function' || currentType==="Class" || describeType.descriptor.id==='class') )
    {
         return true;
    }

    currentType = getmodule( getImportClassByType( classModule, currentType ) );
    var need;
    if( needDescribe && needDescribe.descriptor && needDescribe.descriptor.owner ){

        need = getmodule( getImportClassByType( getmodule( needDescribe.descriptor.owner ), needType ) );
    }else{
        need = getmodule( getImportClassByType( classModule, needType ) );
    }
    setClassModuleUsed(currentType, classModule);
    setClassModuleUsed(need,classModule);

    var isInterfaceType = need.id==="interface";
    needType = need.classname || need.type;
    if( need.type==="Class" && currentType.id ==="class")
    {
        return true;
    }

    if ( need.nonglobal === true && need.privilege !== 'public' && need.package !== need.package )
    {
        return false;
    }

    return doPrototype(currentType, function (classModule) {
        if( (classModule.classname || classModule.type) === needType )return true;
        if( classModule.implements && classModule.implements.length > 0 && isInterfaceType )for( var i in classModule.implements )
        {
            return doPrototype( getmodule( getImportClassByType( classModule, classModule.implements[i] ) ) ,function (interfaceModule) {
                if( interfaceModule.classname === needType )return true;
            });
        }
    });
}

/**
 * 检查模块的接口是否实现
 * @param classModule
 */
function checkInterface(classModule, stack)
{
    if( classModule.implements.length === 0 )return;
    var interfaceDesc = [];
    var currentModule = classModule;
    Iteration.lastStack = stack.__stack__.implements;
    for( var i in classModule.implements )
    {
        var last;
        doPrototype( getmodule( getImportClassByType( classModule, classModule.implements[i] ) ),function (module) {
            if( module.id !== 'interface' )error('Interface can only extends an interface' );
            last = module;
            setClassModuleUsed(module, currentModule);
            interfaceDesc.push( module.proto );
        });
    }
    var desc;
    var obj;
    for( var i in interfaceDesc )
    {
        desc = interfaceDesc[i];
        for( var name in desc )
        {
            obj=doPrototype(classModule,function (module) {
                if( module.proto[name] && module.proto[name].id === 'function')return module.proto[name];
            });

            if( !obj )error('the "' + name + '" interface method no implementation');
            if( obj.type !== desc[name].type )
            {
                error('the "' + name + '" interface of mismatch the return type ('+classModule.filename+')');
            }
            if( desc[name].param.length !== obj.param.length )error('the "' + name + '" method parameter no implementation');
            if( desc[name].param.length > 0 )
            {
                for(var b in desc[name].paramType )
                {
                    if( desc[name].paramType[b] !== obj.paramType[b] )
                    {
                        error('the "'+name+'" method of mismatch parameter type','type');
                    }
                }
            }
        }
    }
}

function getNamespaceValue( stack, classModule )
{
    var express = stack.content();
    express.shift();
    express = express[0] ? express[0].content()[0].content() : [];
    express.splice(0, 2);
    var scope = stack.getScopeOf();
    var id = scope.keyword();
    var ret;
    var qualifier = stack.qualifier() || "internal";
    if( id==="package" || id==="rootblock")
    {
        ret = classModule.package+"/"+qualifier+":"+stack.name();

    }else if( id==="class" )
    {
        ret = classModule.fullclassname+"/"+qualifier+":"+stack.name();

    }else if( id==="function" )
    {
        ret = classModule.fullclassname+"/"+qualifier+":"+scope.name()+"/"+classModule.package+":"+stack.name();
    }
    if (express.length === 1)
    {
        ret = express[0].value.replace(/[\"\']/g,'');
    }
    return ret;
}

function getNamespaceModuleValue( module, name)
{
    name = name || module.classname;
    if( module.namespaces && module.namespaces.hasOwnProperty(name) )
    {
        if( module.namespaces[name].value )
        {
            return module.namespaces[name].value;
        }
    }

    if( module.namespaces.hasOwnProperty( name ) )
    {
        if( module.namespaces[name].value )
        {
            return module.namespaces[name].value;
        }

    }else if( module )
    {
        var nsmodule = getmodule(getImportClassByType(module, name));
        if (nsmodule && nsmodule.namespaces.hasOwnProperty(name)) {
            if (!nsmodule.namespaces[name].value && nsmodule.id === "namespace" && stackModules[nsmodule.fullclassname]) {
                makeModule(stackModules[nsmodule.fullclassname], nsmodule, globalsConfig);
            }
            if (nsmodule.namespaces[name].value) {
                return nsmodule.namespaces[name].value;
            }
        }
    }
    throw new ReferenceError(name+" undefined of the namespace");
}

function checkUseNamespace(item, classModule , nameNs )
{
    nameNs = nameNs || item.name();
    var scope = item.getScopeOf();
    var descNs= scope.define(nameNs);
    if( descNs && descNs.id==="namespace" )
    {
        return true;
    }

    descNs = classModule.namespaces;
    if( !Object.prototype.hasOwnProperty.call(descNs,nameNs) )
    {
        var refNs = classModule.import[ nameNs ];
        if( !refNs )
        {
            for (var i in classModule.import)if (classModule.import[i] === nameNs)
            {
                refNs = classModule.import[i];
                break;
            }
        }
        if( !refNs )
        {
            error('Undefined namespace "' + nameNs + '"', "reference" );
        }
        descNs = getmodule( refNs );
        if( descNs )
        {
            descNs = descNs.namespaces;

        }
    }

    if( !descNs || !Object.prototype.hasOwnProperty.call(descNs,nameNs) )
    {
        error('Undefined namespace "' + nameNs + '"', "reference");
    }
    if( descNs[nameNs].id !=="namespace" )
    {
        error('Invalid reference namespace "' + nameNs + '"', "reference");
    }

    setClassModuleUsed(descNs[nameNs],classModule);
}

/**
 * 在对象原型中的查找属性描述
 * @param name
 * @param classModule
 * @param proto
 * @returns {*}
 */
function findDescInPrototype(name, classModule, proto ){

    proto = proto || 'proto';
    return doPrototype( getmodule( getImportClassByType(classModule,  classModule.inherit ) ),function (module){
        var desc = module[ proto ];
        if( desc && Object.prototype.hasOwnProperty.call( desc,  name ) && desc[ name ].qualifier !== 'private' )
        {
            return desc[ name ];
        }
    });
}

function checkProtectedName( item, classmodule )
{
     var is = item.keyword()==="namespace" || item.static();
     var name = item.name();
     if( is && name === "__T__" )
     {
         error( '"'+name+'" is reserved can not defined' );
     }
}

/**
 * 生成模块信息
 * @param stack
 * @returns {string}
 */
function makeModule( stack , classModule, config )
{
    if( stack.__making__ === true )
    {
        return classModule;
    }
    stack.__making__ = true;
    if( !classModule.__making__ )
    {
        Utils.info('  Making ' + classModule.filename);
    }
    classModule.__making__=true;
    var id = stack.keyword();
    if( !(id==="class" || id==="interface") )
    {
        var content = stack.content();
        var len = content.length;
        var j=0;

        if( stack.keyword()==="rootblock" )
        {
            var y = j;
            for(;y<len;y++)
            {
                if( content[y] instanceof Ruler.STACK && content[y].keyword()==="namespace" )
                {
                    if( !classModule.namespaces[ content[y].name() ].value )
                    {
                        classModule.namespaces[content[y].name()].value = getNamespaceValue(content[y], classModule);
                    }
                }
            }
        }

        for(;j<len;j++)
        {
            if( content[j] instanceof Ruler.STACK )
            {
                if( content[j].qualifier() && "private,protected,public,internal".indexOf( content[j].qualifier() )< 0 )
                {
                    checkUseNamespace(content[j] ,classModule , content[j].qualifier() );
                }

                if( content[j].keyword()==="package" || content[j].keyword()==="class" || content[j].keyword()==="interface" )
                {
                    makeModule( content[j] , classModule, config );

                }else if( content[j].keyword()==="namespace" )
                {
                    if( !classModule.namespaces[ content[j].name() ].value )
                    {
                        classModule.namespaces[content[j].name()].value = getNamespaceValue(content[j], classModule);
                    }
                    if( content[j+1] && content[j+1].value===";" )
                    {
                        j++;
                    }

                }else if( content[j].keyword()==="use" )
                {
                    checkUseNamespace(content[j], classModule );

                }else
                {
                    if( content[j].keyword()==="function")
                    {
                        classModule.rootContent.push(toString(content[j], classModule) + "\n");

                    }else if ( content[j].keyword() !== "metatype" )
                    {
                        classModule.rootContent.push(toString(content[j], classModule) + ";\n");
                    }
                }

            }else
            {
                if( content[j].value===";" ){
                    //classModule.rootContent.push( content[j].value+"\n" );
                }else{
                    classModule.rootContent.push( content[j].value );
                }
            }
        }
        return;
    }

    //当前编译的模块
    Iteration.currentModule = classModule;

    //声明在包外的类
    if( stack.parent() && stack.parent().keyword()==="rootblock" && stack.keyword() ==="class" )
    {
        classModule = classModule.declared[ stack.name() ];
    }

    //继承父类
    if( classModule.inherit )
    {
        var realName = classModule.inherit;
        //是否为包中的类
        if( classModule.declared && Object.prototype.hasOwnProperty.call(classModule.declared, classModule.inherit )  && classModule.declared[ classModule.inherit ].id==="class" )
        {
            realName = classModule.declared[ classModule.inherit ].fullclassname;
        }else
        {
            realName = getImportClassByType( classModule, realName );
        }

        var parent = getmodule( realName );
        if( !parent )
        {
            error('"'+classModule.inherit+'" does exists');
        }

        //终结的类不可以扩展
        if( parent.isFinal ){
            error( 'cannot extends of class finalize the "'+realName+'".');
        }
        if( classModule.id !== parent.id )
        {
            classModule.id==='class' ? error('Class can only extends the class') : error('Interface can only extends the interface');
        }
        //需要的系统模块
        if( Object.prototype.hasOwnProperty.call(globals,classModule.inherit) )requirements[ classModule.inherit ]=true;
    }

    var inheritClass = classModule.inherit ? getmodule( getImportClassByType(classModule,classModule.inherit) ) : null;
    if( inheritClass )
    {
        //父类中不能出现当前类
        doPrototype( inheritClass , function (parentModule)
        {
             if( parentModule.fullclassname === classModule.fullclassname )
             {
                 Iteration.currentModule = classModule;
                 Iteration.lastStack = stack.__stackExtends__  || stack.__stackImplements__;
                 error('can not inherited the "'+inheritClass.fullclassname+'" class');
             }
        });
        setClassModuleUsed( inheritClass, classModule );
    }

    if( stack.keyword() ==='interface' )return classModule;

    var data = stack.content();
    var i = 0;
    var item;
    var props = [];
    var len = data.length;
    var isstatic = stack.static();
    if( !isstatic )
    {
        if( classModule.inherit )
        {
            var superclass = inheritClass.nonglobal === true ? classModule.inherit + ".constructor.apply(this,arguments)" : classModule.inherit + ".apply(this,arguments)";
            classModule.constructor.value = 'function(){\n####{props}####' + superclass + ';\n}';
        }else
        {
            classModule.constructor.value ='function(){\n####{props}####}';
        }
    }

    //需要实现的接口
    checkInterface(classModule,stack);
    Iteration.currentModule = classModule;

    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK && item.keyword() !=='metatype' )
        {
            Iteration.lastStack = item;

            checkProtectedName( item , classModule );

            if( item.keyword()==="namespace" )
            {
                classModule.namespaces[ item.name() ] = classModule.static[ item.name() ];
                classModule.namespaces[ item.name() ].value = getNamespaceValue( item , classModule );
                continue;

            }else if( item.keyword() ==="use" )
            {
                checkUseNamespace(item, classModule);
                continue;
            }

            if( item.qualifier() && "private,protected,public,internal".indexOf( item.qualifier() )< 0 )
            {
                checkUseNamespace(item, classModule , item.qualifier() );
            }

            var val = [];
            //是静态成员还是动态成功
            var ref =  item.static() || isstatic ? classModule.static : classModule.proto;

            //切换到自定义的命名空间
            if( classModule.use &&  classModule.use[item.qualifier()] ==="namespace" )
            {
                ref = ref[ item.qualifier() ];
            }

            //如果有继承检查扩展的方法属性
            var info=null;
            if( classModule.inherit && item.qualifier() !== 'private' )
            {
                info=findDescInPrototype( item.name(), classModule, !item.static() ? 'proto' : 'static' );
            }

            var desc =  ref[ item.name() ];
            var privilege = info ? info.privilege || 'public' : null;

            //此属性或者方法与父中的成员不兼容的
            if( privilege && privilege !== item.qualifier() )
            {
                if( item.override() )
                {
                    error('Incompatible override for "' + item.name() + '"', '');
                }else{
                    error('Missing override for "' + item.name() + '"', '');
                }
            }

            //属性绑定器
            if( desc && desc.bindable ===true )
            {
                if( !desc.value.get || !desc.value.set )
                {
                    error("bindable property must is getter and setter");
                }
                if( desc.privilege !== 'public' )
                {
                    error("bindable property must is public");
                }
            }

            //类中的成员方法
            if( item.keyword() === 'function' )
            {
                //父类中必须存在才能覆盖
                if( item.override() && !info )
                {
                    error('"'+item.name()+'" is not exists in parent class');
                }
                //扩展父类中方法必须指定override关键字
                else if( !item.override() && info )
                {
                    error('Missing override for "'+item.name()+'"');
                }

                //父类成员如果是访问器
                if( info && !item.accessor() && info.value && (info.value.get || info.value.set) )
                {
                    error('override parent function of inconformity for "'+item.name()+'"');
                }

                //父类成员如果不是访问器
                if( info && item.accessor() )
                {
                    if( !info.value || !Object.prototype.hasOwnProperty.call(info.value, item.accessor() ) )
                    {
                        error('override parent accessor of inconformity for "'+item.name()+'"');
                    }
                    info = info.value[ item.accessor() ];
                }

                //扩展父类的方法必须保持参数和参数类型的一致
                if( item.override() )
                {
                    if( info.final || info.isFinal )
                    {
                        error('cannot extends of method finalize the "'+item.name()+'"');
                    }
                    var param = item.accessor() && desc.value ? desc.value[ item.accessor() ].paramType : desc.paramType;
                    if(info.param &&  info.param.length !== param.length )
                    {
                        error('the override parameters of inconformity for "'+item.name()+'"');
                    }
                    for(var b in info.paramType )
                    {
                        if( info.paramType[b] !== param[b] )
                        {
                            error('the override parameter types of inconformity for "'+item.name()+'"','type');
                        }
                    }
                    desc.inheritOwner = info.owner;
                }

                //去掉函数名称
                //item.content().splice(1,1);
                //构造函数
                if( item.name() === stack.name() && !isstatic )
                {
                    if( classModule.isAbstract )
                    {
                        error( '"'+classModule.fullclassname +'" is abstract class not define constructor.');
                    }
                    item.content().splice(1,1,{'type':'(string)','value':"constructor",'id':'identifier'});
                    classModule.constructor.value = toString( item , classModule );
                    continue;
                }
                //普通函数
                else
                {
                    val.push( toString( item , classModule ) );
                }
            }
            //类中的成员属性
            else if( item.keyword() === 'var' || item.keyword() === 'const' )
            {
                //属性不能指定override关键字
                if( item.override() )
                {
                    error('can only override method of the parent');
                }

                var ret = 'null';
                if( typeof desc.value === "string" && desc.bindable !==true  )
                {
                    ret = desc.value;
                } else
                {
                    item.content().shift();
                    var express = item.content()[0].content()[0];
                    if (express.content().length > 1)
                    {
                        express.content().splice(0, 2);
                        ret = expression(express, classModule);
                    }
                }

                //数据绑定的属性引用
                //这部分已经在编译代码时已做好了准备工作，无须再处理。
                if( desc.bindable ===true )
                {
                    props.push('"'+item.name()+'":'+ ret );
                    continue;
                }

               /* if( metatype )
                {
                    ret ='Internal.define("'+metatype+'")';
                }*/

                //将成员属性，替换为访问器的形式
                //私有属性直接放到构造函数中
                if( item.static() /*&& item.qualifier() !=='private'*/ )
                {
                    val.push( ret );
                }else
                {
                    props.push('"'+item.name()+'":'+ret );
                    val.push( ret );
                }
            }

            //访问器的原始代码
            if( item instanceof Ruler.SCOPE && item.accessor() )
            {
                desc.value[ item.accessor() ].value = val.join('');
            }
            //成员的原始代码
            else if( desc )
            {
                desc.value=val.join('');
            }
        }
    }

    if( classModule.id !=='interface' && !isstatic )
    {
        var event = {type:'(defineProperty)', props:props };
        stack.dispatcher(event);
        var strprops = "";
        if( !classModule.isAbstract )
        {
            strprops = 'Object.defineProperty(this,'+ globalsConfig.context.private+',{value:{'+event.props.join(',')+'}});';
        }
        classModule.constructor.value = classModule.constructor.value.replace('####{props}####', strprops);
    }

     var _import = classModule.import;
     for (var j in _import )
     {
         if( _import[j] === classModule.fullclassname )
         {
             var d = stack.getScopeOf().define( j );
             Iteration.lastStack = d.stack;
             Iteration.currentModule = classModule;
             error('Unexpected import class of the "'+classModule.fullclassname+'"');
         }

         if (Object.prototype.hasOwnProperty.call(globals, _import[j]) )
         {
            requirements[ _import[j] ] = true;

         } else if( classModule.useExternalClassModules.indexOf(_import[j]) >= 0 )
         {
             var _stackModule = stackModules[ _import[j] ];
             if( _stackModule && _stackModule.__making__ !== true )
             {
                 makeModule(_stackModule, _stackModule.description, config);
             }
         }
     }
     return classModule;
}

/**
 * 标记 classModule 为使用状态
 * @param classModule
 * @param currentModule
 * @param flag
 */
function setClassModuleUsed(classModule, currentModule , flag )
{
    if( !(currentModule.useExternalClassModules instanceof Array) )
    {
        currentModule.useExternalClassModules = [];
    }

    var index = currentModule.useExternalClassModules.indexOf( classModule.fullclassname || classModule.type );
    if( flag===true )
    {
        if( index>=0 )
        {
            currentModule.useExternalClassModules.splice(index,1);
        }
        classModule.hasUsed = false;

    }else
    {
        if( index < 0 )
        {
            currentModule.useExternalClassModules.push(classModule.fullclassname || classModule.type);
        }
        classModule.hasUsed = true;
    }
}

var default_ns = ['public','private','protected','internal'];
function getDescNamespace( desc , use )
{
    if( !desc )return use || '';
    use = use || desc.privilege;
    return default_ns.indexOf( use ) < 0 ? use : '';
}

var namespaceUriHashValue={};
var namespaceUriHashValueCounter=1;
function getNamespaceUriByModule( classModule , name , flag )
{
    if( !name )return '';
    classModule.__namespaceUri__ || (classModule.__namespaceUri__={});
    var uri = classModule.__namespaceUri__[ name ];
    if( !uri )
    {
        switch (name) {
            case "public":
                uri = "/public";
                break;
            case "internal" :
                uri = classModule.package + "/internal";
                break;
            case "protected" :
                if (classModule.inherit && !globals.hasOwnProperty(classModule.inherit) )
                {
                    var inheritClass = getmodule(getImportClassByType(classModule, classModule.inherit));
                    uri = getNamespaceUriByModule(inheritClass, name, true );
                } else {
                    uri = classModule.fullclassname + "/protected:" + classModule.classname;
                }
                break;
            case "private" :
                uri = classModule.fullclassname + "/private:" + classModule.classname;
                break;
            default:
                uri = getNamespaceModuleValue(classModule, name);
        }
        classModule.__namespaceUri__[ name ] = uri;
    }

    if( flag ===true )return uri;
    if( typeof namespaceUriHashValue[ uri ] === "undefined" )
    {
        if(  uri === "/public" )
        {
            namespaceUriHashValue[ uri ]="_";

        }else
        {
            namespaceUriHashValue[ uri ] = String.fromCharCode( Math.floor( Math.random()*26 )+(Math.random() * 122 > 66 ? 'a' : "A" ).charCodeAt(0) )+namespaceUriHashValueCounter+"_";
            namespaceUriHashValueCounter++;
        }
    }
    return namespaceUriHashValue[ uri ];
}

function getUseNamespace( desc )
{
    var ns =[];
    if( !desc )return ns;
    if( desc.use )
    {
        return [desc.use];
    }

    if( !desc.runningCheck && desc.descriptor )
    {
        var use = desc.funScope.define("use");
        if( use && use.hasOwnProperty( desc.descriptor.privilege ) )
        {
            return [ desc.descriptor.privilege ];
        }
        return [];
    }

    if ( desc.runningCheck && desc.funScope && desc.funScope.define("use"))
    {
       var use = desc.funScope.define("use");
       for (var n in use) {
           ns.push(n);
       }
    }
    return ns;
}

/**
 * 生成语法描述
 * @param describe
 * @param flag
 * @returns {string}
 */
function toValue( describe, config , prefix, inherit, classModule )
{
    var code=[];
    for( var p in describe )
    {
        var desc = describe[p];

        //使用自定义命名空间
        if( classModule.use && classModule.use[p] === "namespace" && desc.id !=="namespace" )
        {
            code.push( toValue(desc,config, prefix,inherit, classModule) );
            continue;
        }
        var item = [];
        var nsuri =  getNamespaceUriByModule(classModule,desc.privilege || 'internal' );
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
}

function buildModuleStructure( o , config )
{
    var code=[];
    var inheritClass = null;
    if( o.inherit )
    {
        inheritClass = getmodule( getImportClassByType(o, o.inherit) );
    }
    var descriptor = [];
    var privilege = o.privilege || "internal";
    if( privilege !== 'public')
    {
        descriptor.push('"ns":"' + getNamespaceUriByModule(o, o.privilege || "internal") + '"');
    }
    if( o.inherit )
    {
        descriptor.push('"extends":' + o.inherit);
    }
    if( o.package )
    {
        descriptor.push('"package":"'+o.package+'"');
    }
    descriptor.push('"classname":"' + o.classname + '"');
    if( config.mode == 1 ) {
        descriptor.push('"filename":"' + o.filename + '"');
    }
    if( o.isAbstract )
    {
        descriptor.push('"abstract":' + (!!o.isAbstract));
    }
    if( o.implements && o.implements.length >0 )
    {
        descriptor.push('"implements":[' + o.implements.join(',') + ']');
    }
    if( o.isFinal ) {
        descriptor.push('"final":' + !!o.isFinal);
    }
    if( o.isDynamic ) {
        descriptor.push('"dynamic":' + !!o.isDynamic);
    }
    descriptor.push('"_private":'+ config.context.private);

    var _private =  getNamespaceUriByModule( o, "private");
    var _protected =  getNamespaceUriByModule( o, "protected");
    var _internal =  getNamespaceUriByModule( o, "internal");
    var _public =  getNamespaceUriByModule( o, "public");

    descriptor.push('"uri":["'+[_private, _protected,_internal,_public].join('","')+'"]' );
    code.push("var _private=this._private;\n");
    if( o.id ==='class' )
    {
        //静态成员
        var s = toValue(o.static, config , "method" , false , o);
        if( s )
        {
            descriptor.push('"method":method');
            code.push("var method={"+s+"};\n");
            code.push('for(var prop in method){\n\tObject.defineProperty('+o.classname+', prop, method[prop]);\n}\n' );
        }

        //构造函数
        if( !o.isStatic )
        {
            descriptor.push('"proto":proto');
            //实例成员
            s = toValue( o.proto, config , 'proto' ,  inheritClass && inheritClass.nonglobal, o );
            var constructor = '{"value":'+o.constructor.value+'}';
            var refConstruct = '"constructor":{"value":'+o.classname+'}';
            s = s ? refConstruct+','+s : refConstruct;
            code.push("var proto={"+s+"};\n");
            code.push('Object.defineProperty(' + o.classname + ',"constructor",'+constructor+');\n');
            code.push(o.classname + '.constructor.prototype=Object.create( ' + (o.inherit || 'Object' ) + '.prototype , proto);\n');
            code.push('Object.defineProperty(' + o.classname + ',"prototype",{value:' + o.classname + '.constructor.prototype});\n');

        }else
        {
            code.push('Object.defineProperty(' + o.classname + ',"prototype",{value:{}});\n');
        }
    }
    code.push('Object.defineProperty('+o.classname+',"__T__",{value:{\n\t'+descriptor.join(',\n\t')+'\n}});\n');
    return code.join("");
}

function makePrivateModuleClass( description, config )
{
    var str="";
    var declared = description.declared;
    for(var p in declared )
    {
        if( declared[p].id==="class" )
        {
            var o = declared[p];
            var codeModule = makeClassModule(o, config);
            if( codeModule )
            {
                str+="var "+o.classname+"="+codeModule;
            }
        }
    }
    return str;
}

var makeNamespaces={};
var namespacesHashMap={};

/**
 * 将描述信息构建成类模块
 * @param o
 * @returns {string}
 */
function makeClassModule( o , config , codeModules )
{
    if( o.makeDone===true )return '';
    o.makeDone = true;
    var str ="";
    var internalCode = "";
    if( o.inherit && o.id !== "namespace" )
    {
        var inheritClass = getmodule( getImportClassByType(o,o.inherit) );
        if( o.hasUsed === true )
        {
            inheritClass.hasUsed = true;
        }
        setClassModuleUsed(inheritClass,o);
        if( inheritClass.nonglobal===true )
        {
            if( inheritClass.isInternal )
            {
                internalCode = "var "+inheritClass.classname+"="+makeClassModule( inheritClass , config , codeModules );
            }else{
                makeClassModule( inheritClass , config , codeModules );
            }
        }
    }

    var import_keys=[];
    var import_values=[];
    for (var i in o.import)
    {
        var importModule = getmodule( getImportClassByType(o, i) );
        if( importModule.nonglobal ===true && importModule.privilege !=='public' && o.package !== importModule.package && importModule.id!=="namespace" )
        {
            error('"'+getImportClassByType(o, i)+'" is not exists',"reference");
        }

        if( o.useExternalClassModules instanceof Array && importModule.id !=='namespace' )
        {
            if(  o.useExternalClassModules.indexOf(importModule.fullclassname || importModule.type)<0 )
            {
                continue;
            }
        }

        if( importModule.id==="namespace" )
        {
            import_keys.push( i );
            import_values.push( 'ns:'+o.import[i] );

        }else if( importModule.id==="interface" )
        {
            import_keys.push( i );
            import_values.push( 'if:'+o.import[i] );

        }else if( !Object.prototype.hasOwnProperty.call(globals, o.import[i] ) || i !== o.import[i] )
        {
            import_keys.push( i );
            import_values.push( o.import[i] );
        }
    }
    if( o.id==="namespace" )
    {
        for( var n in o.namespaces )
        {
            var fullname = o.package ? o.package + "." + n : n;
            var keys = import_keys.slice();
            var values = import_values.slice();
            keys.unshift(n);
            values.unshift('ns:' + fullname);
            var v = 'function(' + keys.join(",") + '){\n';
            v += 'Object.defineProperty(' + n + ', "valueOf", {value:function valueOf(){\nreturn "' + o.namespaces[n].value + '";\n}});'
            v += '\n}';
            namespacesHashMap[o.namespaces[n].value] = getNamespaceUriByModule(o, n);
            makeNamespaces[fullname] = config.context.defineModuleMethod + "(" + JSON.stringify(values) + ", " + v + ");\n";
        }
        return str;
    }

    import_keys.unshift( o.classname );
    if( o.id ==='interface' )
    {
        import_values.unshift('if:'+o.fullclassname);
    }else
    {
        import_values.unshift(o.fullclassname);
    }

    str += 'function('+import_keys.join(",")+'){\n';

    //包外类
    if( !o.isInternal )
    {
        //私有命名空间
         for (var n in o.namespaces)
         {
             if( o.namespaces[n].id==="namespace")
             {
                 str += 'var ' + n + ' = new Namespace("' + o.namespaces[n].value + '");\n';
                 namespacesHashMap[o.namespaces[n].value] = getNamespaceUriByModule(o, n);
             }
         }

        //全局块的中的代码
        if(o.rootContent && o.rootContent.length > 0 )
        {
            str += o.rootContent.join("")+"\n";
        }

        var m = internalCode + makePrivateModuleClass(o, config);
        if (m)str += m + "\n";
    }

    //生成类的结构
    str += buildModuleStructure( o , config );
    str += "return "+o.classname+";\n";
    str += '}';

    if( !o.isInternal )
    {
        return codeModules[ o.fullclassname ] =  config.context.defineModuleMethod+"("+JSON.stringify(import_values)+","+str+");\n";
    }
    return config.context.defineModuleMethod+"("+JSON.stringify(import_values)+","+str+");\n";
}

/**
 * 开始生成代码片段
 */
function start(config, makeModules, descriptions , project )
{
    defineModules = descriptions;
    stackModules  = makeModules;
    //块级域的实现还有问题，后续修正
    //enableBlockScope = config.blockScope==='enable';
    requirements = config.requirements;
    globals = config.globals;
    globalsConfig = config;
    makeNamespaces = {};

    try {

        var moduleObject;
        var description;

        //系统主要的类
        for (var srmc in config.system_require_main_class )
        {
            moduleObject =  makeModules[ config.system_require_main_class[srmc] ];
            description =  moduleObject.description;
            makeModule( moduleObject , description, config);
        }

        moduleObject = makeModules[ config.bootstrap ];
        description = moduleObject.description;
        makeModule(moduleObject, description, config);

        var code = [];
        var codeModules = {};
        for (var p in descriptions)
        {
            var o = descriptions[p];
            if (!o.makeDone && o.__making__ )
            {
                makeClassModule(o, config, codeModules);
            }
        }

        for (var n in makeNamespaces)
        {
            var namespacemodule = getmodule(n);
            if( namespacemodule && namespacemodule.namespaces[ namespacemodule.classname ].hasUsed ===true )
            {
                if( config.source_file ==="enable" )
                {
                    var file = Utils.getResolvePath(config.build_path + '/src', n);
                    Utils.mkdir(file.substr(0, file.lastIndexOf("/")));
                    Utils.setContents(file + '.js', makeNamespaces[n]);
                }
                code.push(makeNamespaces[n]);
            }
        }

        for (var m in codeModules)
        {
            var _loadModule = getmodule(m);
            var isUsed = _loadModule.hasUsed;
            if ( isUsed === true)
            {
                if( config.source_file ==="enable" )
                {
                    var file = Utils.getResolvePath(config.build_path + '/src', m);
                    Utils.mkdir(file.substr(0, file.lastIndexOf("/")));
                    Utils.setContents(file + '.js', codeModules[m]);
                }
                code.push(codeModules[m]);
            }
        }

    }catch (e)
    {
        if( config.debug )
        {
            console.log( e );
        }
        error( e.message , e.name.substr(0, e.name.length-5) );
    }
    var builder = require( '../javascript/builder.js');
    return builder(config, code.join(""), requirements, {namespace:function(content) {
        return content.replace(/var\s+codeMap=\{\};/,"var codeMap="+JSON.stringify(namespacesHashMap)+";");
    }});
}

module.exports=start;