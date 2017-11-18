const fs = require('fs');
const PATH = require('path');
const Ruler = require('./ruler.js');
const Utils = require('./utils.js');
var defineModules={};
var enableBlockScope=false;
var globals={};
var globalsConfig={};
var namespaceBaseUint = Math.ceil( Math.random() *10000 );
var namespacePrefix = "_N";
function getPrivateNamespaceUri( uid )
{
    return namespacePrefix+uid+'_';
}

var library_base_path = '\\es\\core\\';

/**
 * 全局模块
 * @param name
 * @returns {{}}
 */
function getmodule(classname)
{
    var ref = defineModules[classname] || globals[classname];
    if(ref == null)return null;
    return ref.id == null && Object.prototype.hasOwnProperty.call(globals,classname) ? globals[classname] : ref;
}

/**
 * 抛出错误信息
 * @param msg
 * @param type
 */
function error(msg, type)
{
    var obj = Iteration.lastStack;
    if( obj && Iteration.currentModule )
    {
        msg = Iteration.currentModule.filename+':' + obj.line + ':' + obj.cursor+"\r\n"+msg;
    }
    switch ( type )
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
            if( this.current.value==='as' && stack.keyword()==="expression" )
            {
                stack.isAs = true;
            }
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
            var obj = stack.parent().parent().parent().parent();
            obj.forIn = true;
            infor = obj.keyword() === 'for';
            var forDone = function (e)
            {
                e.iteration.content.splice(0,1,"foreach");
                obj.removeListener('(iterationDone)',forDone);
            };
            obj.addListener('(iterationDone)',forDone,-400);
        }
    }

    if( !infor )
    {
        var name = this.current.value;
        this.seek();
        if( !this.next )error('Missing expression','syntax');
        this.seek();
        var property = getDescriptorOfExpression(this, this.module);
        this.state=false;
        var obj = parse( this.module, property);
        this.content.push({
            name:[],
            descriptor:null,
            thisArg:'Reflect::has('+obj+','+name+')',
            expression:false,
            before:[],
            after:'',
            "super":null,
            runningCheck:false,
            isglobal:false,
            type:'Boolean'
        });

    }else
    {
        if( stack.parent().content().length > 1 )error('Can only statement one','syntax');
        var name = this.current.value;
        var desc = stack.scope().define( name );
        if( desc )desc.referenceType='String';
        var funScope = stack.scope().getScopeOf();
        funScope.forIterator >>= 0;
        var itn;
        do{
            itn = '__'+(funScope.forIterator++)+'__';
        }while( funScope.define(itn) );

        this.seek();
        this.seek();
        var property = getDescriptorOfExpression(this, this.module);
        this.state=false;
        this.content.push({
            name:[],
            descriptor:null,
            thisArg:parse( this.module, property)+' as $'+name+'=>$'+itn,
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
            var obj = stack.parent().parent().parent().parent();
            obj.forOf = true;
            infor = obj.keyword() === 'for';
            var forDone = function (e)
            {
                e.iteration.content.splice(0,1,"foreach");
                obj.removeListener('(iterationDone)',forDone);
            };
            obj.addListener('(iterationDone)',forDone,-400);
        }
    }
    if( !infor )error('keyword the "of" can only in for iterator','syntax');
    if( stack.parent().content().length > 1 )error('Can only statement one','syntax');

    var name = this.current.value;
    var desc = stack.scope().define( name );
    if( desc )desc.referenceType='String';

    var funScope = stack.scope().getScopeOf();
    funScope.forIterator >>= 0;

    this.seek();
    this.seek();
    var property = getDescriptorOfExpression(this, this.module);
    this.state=false;
    this.content.push({
        name:[],
        descriptor:null,
        thisArg:parse( this.module, property)+' as $'+name,
        expression:false,
        before:[],
        after:'',
        "super":null,
        runningCheck:false,
        isglobal:false,
        type:'String'
    });
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
            if(this.next.value !==';')error('can not has return value', 'type');
            return;
        }
        if(this.next.value ===';')error('Missing return value', 'type');
        if( fnScope.returnType ==='Object' )return;
        this.content.push('return ');
        var info = '"' + this.current.line + ':' + this.current.cursor + '"';
        //  this.content.push( this.module.classname +".__check__("+ getDefinedClassName(this.module, fnScope.returnType )+",");
        this.seek();

        this.content.push( toString(this.current, this.module, !isReferenceType(fnScope.returnType) ? getImportClassByType( this.module, fnScope.returnType) : undefined ) );
        //   this.content.push(")");
        this.current={};
    }
};

function getDefinedClassName(classmodule, type)
{
    if( classmodule.type === type || classmodule.classname===type )return type;
    if( classmodule.import && classmodule.import[type])
    {
        var objClass = getmodule( classmodule.import[type] );
        if( objClass && objClass.id==="class"){
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
            var itemContent = stack.content();
            var expres = Utils.merge({}, itemContent[1]);
            expres.value="__construct";
            itemContent.splice(1,1,expres);

            stack.addListener('(iterationDone)', function (e)
            {
                var param = stack.param();
                var index = e.iteration.content.indexOf('{');
                if( e.iteration.content[index+1] ==="\n" )index++;
                //预留私有属性占位
                e.iteration.content.splice(++index, 0, '####{props}####');
                //如果没有调用超类，则调用超类的构造函数
                /*if (e.iteration.module.inherit && !stack.called)
                 {
                 var inheritClass = getmodule( getImportClassByType(e.iteration.module, e.iteration.module.inherit ) );
                 if( inheritClass.nonglobal===true )
                 {
                 e.iteration.content.splice(index + 1, 0, e.iteration.module.inherit+'.constructor.call(this);\n');
                 }else
                 {
                 e.iteration.content.splice(index + 1, 0, e.iteration.module.inherit+'.call(this);\n');
                 }
                 }*/

            }, -500);


        }else if( stack.parent().keyword() !== 'class' )
        {
            stack.addListener('(iterationDone)', function (e)
            {
                var defineName = [];
                var _parent = stack.parent();
                while ( _parent && _parent.scope().keyword() !=="class" )
                {
                    var pScope = _parent.scope();
                    var defObj = pScope.define();
                    for( var p in defObj )
                    {
                        if( defObj[p].id !=="function" && defineName.indexOf('&$'+p)<0 )defineName.push( '&$'+p );
                    }
                    _parent = pScope.parent();
                }

                if( defineName.length > 0 )
                {
                    var index = e.iteration.content.indexOf('{');
                    e.iteration.content.splice(index,0, "use("+defineName.join(",")+")");
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
            express.unshift( '$'+items.slice(-1)+'=func_get_args();\n');
            items = items.slice(0, rest);
        }

        var paramItems = [];

        for (var i in items) {
            var desc = scope.define( items[i] );
            var typePrefix = '';
            desc.type = getType(desc.type);
            if (desc.type !== '*' && desc.type !=='Object')
            {
                var typeClass = getmodule( getImportClassByType(this.module, desc.type ) );
                if( typeClass.nonglobal===true )
                {
                    typePrefix = toRefClassName( typeClass.fullclassname, true )+' ';

                }else
                {
                    switch ( typeClass.type )
                    {
                        case 'Array' :
                            typePrefix = 'array ';
                            break;
                        case 'Class'   :
                        case 'Boolean' :
                        case 'String'  :
                        case 'Number'  :
                        case 'Object'  :
                            this.module.requirements['TypeError'] = true;
                            this.module.requirements['System'] = true;
                            this.module.requirements[ desc.type ] = true;
                            var reftype = toRefClassName(desc.type);
                            express.push('if( !' + 'System::is($'+items[i] + ', ' + reftype + ') )throw new TypeError("type does not match. must be ' + desc.type + '",__FILE__,__LINE__);\n');
                            break;
                        default :
                            typePrefix = toRefClassName( library_base_path+typeClass.type, true )+' ';
                    }
                }
            }

            if (desc.value instanceof Ruler.STACK)
            {
                var value = toString(desc.value, this.module);
                if( desc.value.content()[2] instanceof  Ruler.STACK )
                {
                    express.unshift( 'if($'+items[i]+'===null){'+value+';}\n' );
                    value = '$'+items[i]+'=null';
                }
                paramItems.push( typePrefix+value );

            }else{
                paramItems.push( typePrefix+'$'+items[i] );
            }
        }
        this.content.push( paramItems.join(',') );

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
    /*if( stack instanceof Ruler.SCOPE && !stack.hasListener('(blockScope)') )
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
     }*/
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
        if( stack.keyword() !== 'var' || stack.scope().keyword()==='function' || stack.scope().keyword()==='rootblock' ){
            //this.content.push('');
        }
        if( stack.content()[1].content()[0].content().length === 1 )
        {
            stack.addListener('(iterationDone)', function (e) {
                e.content.push("=");
                e.content.push("null");
            });
        }
    }
    //如果var变量不在函数域中则添加到函数域中
    else if( stack.keyword() === 'statement' && stack.parent().keyword() === 'var' && stack.parent().scope().keyword() !== 'function' )
    {
        /*var funScope =  stack.scope().getScopeOf();
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
         e.content.splice( ++startIndex , 0, '$'+items.join(',')+';\n');
         }
         stack.removeListener('(iterationSeek)',seek );
         this.removeListener('(iterationDone)', done );
         };
         stack.addListener('(iterationSeek)', seek );
         stack.scope().getScopeOf().addListener('(iterationDone)', done);*/
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
    var param = desc ? (desc.paramType || desc.param) || [] : [];
    var required = desc ? desc.required || [] : [];
    var acceptType;
    var raw = [];
    if( param.length ===0 && desc && !property.isglobal && desc.id==='function' && !desc.paramType  && desc.reference instanceof Ruler.STACK )
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
                parameters.push( toString(it.current, it.module , acceptType, true ) );
                index++;

            } else if (it.current.value !== ',')
            {
                error('Invalid identifier token', 'syntax');
            }
        }
    }

    if( param && parameters.length < param.length )
    {
        for(var i=0; i<param.length ; i++ )
        {
            if( param[i]==='...' )break;
            if( param[i]==='*' )continue;
            if( param[i]==='Object' )continue;
            if( parameters[i] === undefined && required[i]===true )
            {
                error('Missing parameter', 'syntax');
            }
        }
    }
    property.raw = raw.join(',');
    return parameters;
}

function toRefClassName( name , flag )
{
    switch ( name ){
        case 'Object' :
        case 'Class' :
        case 'String' :
        case 'Boolean' :
        case 'Number' :
        case 'Array'  :
            return flag ? name : "'"+name+"'";
    }
    if( name.charAt(0)==='\\' )
    {
        return flag ? name.replace(/\./g,'\\') : "'"+name.replace(/\./g,'\\')+"'";
    }
    return flag ? '\\'+name.replace(/\./g,'\\') : "'\\"+name.replace(/\./g,'\\')+"'";
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
    var assignType = '*';
    var runningCheck = false;
    var raw = '';
    var name = [];
    if( property ){

        var index = property.before.length;
        if( property.before[index-1]==='new' )
        {
            index--;
        }
        before = property.before.splice(0, index );
        info   = property.info;
        type   = property.type;
        referenceType = property.referenceType;
        assignType = property.descriptor ? property.descriptor.origintype : referenceType;
        thisArg = parse(classmodule,property);
        name = [thisArg];
        raw = property.raw;
        if( type==="*" || type==="Object")
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
        "assignType":assignType,
        "referenceType":referenceType,
        "funScope":it.stack.getScopeOf(),
        "use":'',
        "raw":raw,
        "info":info,
    };
}

/**
 * 获取类的全名引用
 * @param it
 * @returns {*}
 */
function getClassTypeByDefinedFullName(it)
{
    if( it.current.type==='(identifier)' && it.next && it.next.value==='.' )
    {
        var classType=[];
        do{
            classType.push( it.current.value );
            if( !(it.next.value==='.' || it.next.type==='(identifier)') )break;

        }while ( it.seek() );
        return classType.length >0 ? classType.join('') : null;
    }
    return null;
}

var requirements={};

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
    var _nextStep = false;
    var property = createDescription(it, classmodule);
    it.currentProperty = property;

    //是否为一个前置运算符
    while ( Utils.isLeftOperator(it.current.value) )
    {
        var is = Utils.isIncreaseAndDecreaseOperator(it.current.value);
        if( ( !it.next && is ) || (it.next && it.next.type !=='(identifier)' && is) )error('"'+it.current.value+'" after must be is expression reference');
        property.before.push( it.current.value );
        it.seek();
    }

    //是否为一个表达式或者对象
    if( it.current instanceof Ruler.STACK  )
    {
        if( it.current.type() === '(expression)' )
        {
            type = '*';
            desc = null;
            property.thisArg = toString(it.current, classmodule);
            property.name= [ property.thisArg ];
            if( it.current.valueType && it.current.valueType.length===1 )
            {
                type = it.current.valueType[0];
                desc = getmodule( type );
            }
            property.type= type;

        }else
        {
            property.thisArg = toString(it.current, classmodule);
            property.name= [];
            property.type= getType( it.current.type() );
            if( !(property.type =='Array' || property.type =='JSON') )
            {
                return property;
            }
            desc = getmodule( property.type );
            property.isglobal=true;
            property.type = property.type;
            if( property.type =='JSON' )
            {
                property.thisArg =property.thisArg ? 'new Object([' + property.thisArg + '])' : 'new Object()';
                classmodule.requirements['Object']=true;
                requirements['Object']=true;
            }
            property.name= [ property.thisArg ];
            if( property.type === "Array" )
            {
                classmodule.requirements[property.type]=true;
                requirements[ property.type ]=true;
                property.runningCheck = true;
            }
        }

    }else
    {
        //是一个引用或者是一个字面量
        if (isReference(it.current))
        {
            property.info.push( it.current.value );

            //获取字面量类型
            type = Utils.getValueTypeof( it.current.type );
            if (type)
            {
                desc = globals[type];
                classmodule.requirements[type]=true;
                requirements[ type ]=true;
                property.isglobal=true;
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
                    if( (desc.id==='let' || desc.id==='var') && it.stack.parent().parent().keyword() === desc.id )
                    {
                        property.isStatement = true;
                    }
                    property.assignType = getType(desc.type);
                    if( desc.id==="class" && !(it.current.value==='this' || it.current.value==='super') )
                    {
                        property.classNameReference=getImportClassByType( classmodule, it.current.value );
                    }

                } else if( Object.prototype.hasOwnProperty.call(classmodule.declared,it.current.value) )
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
                        classmodule.requirements[it.current.value]=true;
                        property.referenceType = 'Class';
                        property.classNameReference= getImportClassByType( classmodule, it.current.value );
                    }
                    if( !desc && Object.prototype.hasOwnProperty.call(globals.System.static,it.current.value) )
                    {
                        property.name=['System'];
                        property.thisArg='System';
                        classmodule.requirements['System']=true;
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
                if( funScope.static() )
                {
                    desc = getClassPropertyDesc(it, classmodule ,'static', classmodule, false, property );
                    property.name=[classmodule.classname];
                    property.thisArg = classmodule.classname;

                }else
                {
                    desc = getClassPropertyDesc(it, classmodule ,'proto', classmodule, true, property );
                    if( desc ) {
                        property.name=['this'];
                        property.thisArg ='this';
                    }else
                    {
                        desc = getClassPropertyDesc(it, classmodule ,'static', classmodule, true, property );
                        property.name=[classmodule.classname];
                        property.thisArg = classmodule.classname ;
                    }
                }
            }

            //引用一个类的全名 client.skins.Pagination
            if( !desc && it.current.type==='(identifier)' && it.next && it.next.value==='.' )
            {
                type = getClassTypeByDefinedFullName(it);
                if( type )
                {
                    desc = getmodule(type);
                    if (!desc || (desc.nonglobal === true && desc.privilege !== 'public' && desc.package !== classmodule.package)) {
                        error('"' + type + '" is not exists', 'reference');
                    }

                    //property.thisArg = "'" + type + "'";
                    property.thisArg =  type ;
                    property.name=[property.thisArg];
                    property.info=[type];
                    if (!desc)error('"' + type + '" is not defined.', 'reference');

                    property.referenceType = 'Class';
                    property.type = 'Class';

                    if (property.before.length > 0 && property.before[property.before.length - 1] === "new")
                    {
                        property.thisArg = toRefClassName( type , true );
                        property.name=[ property.thisArg ];

                        /* desc.type = desc.fullclassname;
                         desc.referenceType = desc.fullclassname;*/
                        property.type = desc.fullclassname;
                        //property.referenceType = desc.fullclassname;
                    }
                    if (!it.next)
                    {
                        property.descriptor = desc;
                        property.type = type;
                        return property;
                    }
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

            }else if( property.type !=="Class" && !(it.prev && it.prev.value==='.')  )
            {
                //如果this不在类函数的成员中,则表示this是一个函数对象，则并非是类对象
                if( it.current.value==='this' && it.stack.getScopeOf().parent().keyword() !=='class' )
                {
                    desc={'type':'*'};
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

            if( property.thisArg==="this" || desc.id==='let' ||  desc.id==='var' )
            {
                property.thisArg = "$"+property.thisArg;
                property.name[0] = "$"+property.name[0];
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

            classmodule.requirements[ type ]=true;
            requirements[type]=true;

            return property;
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
                    //指定值类型为全局对象,除Object类型外
                    if( refType !=="Object" && Object.prototype.hasOwnProperty.call( globals, refType ) )
                    {
                        property.runningCheck=false;
                        property.descriptor = desc;
                    }
                }
                desc = null;
                property.type='*';

            }else if( it.current.type() === '(expression)' )
            {
                if( property.accessor )
                {
                    error('"' + property.info.join('.') + '" is not function', 'type' );
                }
                property.descriptor = desc;
                property.expression = true;
                value = checkCallParameter( it, desc, property );
                property.param = value;
                if( property.classNameReference )
                {
                    if( (property.before.length < 1 || property.before[  property.before.length-1] !=='new' ) && property.name.length===1 )
                    {
                        property.before.push('new');
                        property.classNameReference = null;
                    }
                }

                if( desc && (desc.id === 'function' || desc.id === 'class' || desc.referenceType==='Function') )
                {
                    property.type = desc.type || '*';
                    property.runningCheck=false;
                }

                if( it.next && (it.next.value==='.' || (it.next instanceof Ruler.STACK && (it.next.type() === '(property)' || it.next.type() === '(expression)' ))))
                {
                    if (type === 'void')error('"' + it.prev.value + '" no return value', 'reference');
                    isstatic=false;
                    var hasnew = property.before[ property.before.length-1 ];
                    property = createDescription(it, classmodule, property);
                    if( hasnew==="new" )
                    {
                        property.thisArg = '('+ property.thisArg+')';
                        property.name=[ property.thisArg ];
                    }
                }

            }else
            {
                error('Unexpected expression', '');
            }

        } else if( it.next.value === '.' )
        {
            if( ( property.type ==="*" || property.type ==="Object") && property.isglobal !== true )
            {
                property.runningCheck = true;
            }
            it.seek();

        } else if( it.next.id === '(identifier)' || (it.next.id === '(keyword)' && it.current.value==='.') )
        {
            it.seek();

            //访问器的链式操作必须走反射代理
            var is_accessor_last = !!property.accessor;
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
                classmodule.use[ use ] = 'namespace';
                if( sem.id ==="var")
                {
                    property.runningCheck=true;
                    desc = null;
                }
                it.seek();
                it.seek();
            }

            if( property.name.length > 1  )
            {
                property = createDescription(it, classmodule, property)
            }
            property.use = use;
            if( it.current.value )
            {
                property.name.push( it.current.value );
                property.info.push( it.current.value );
            }
            var desctype = getDescribeType( desc );
            if ( desc && desc.notCheckType !== true && !(desctype ==='*' || desctype ==='JSON' || desctype ==='Object') )
            {
                var prevDesc = desc;
                if( desc.id !=='function' && desctype === 'void' )
                {
                    error( '"'+property.name.join('.')+'" void type can only be defined in function return','type');
                }

                var classType = getImportClassByType(classmodule, desctype );
                var refClassModule = getmodule( classType );
                if( !refClassModule && Object.prototype.hasOwnProperty.call( classmodule.declared, classType ) )
                {
                    refClassModule = classmodule.declared[classType];
                    if( refClassModule.isInternal !==true )
                    {
                        refClassModule = null;
                    }
                }

                desc = getClassPropertyDesc(it, refClassModule , isstatic ? 'static' : 'proto', classmodule, false , property );
                type = desc.type;
                property.descriptor = desc;
                property.type = type;
                isstatic= type ==='Class' || desc.id==='object';

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
                        }
                    }
                }
                //如果下一个是赋值运算符则检查当前的表达式
                else if( it.next && Utils.isMathAssignOperator(it.next.value) )
                {
                    if ( desc.id === 'const' )
                    {
                        if( it.stack.parent().keyword() !=='statement' )error('"' + property.name.join('.') + '" is not writable', '');

                    }else if ( desc.id === 'function')
                    {
                        error('"'+property.name.join('.')+'" function is not can be modified', '');
                    }
                }

                //如果只是对一个函数的引用
                if( desc.id==='function' && !property.accessor ) property.type = 'Function';

            }else if ( !desc || ( desc.isglobal !== true && desc.type !=='JSON') )
            {
                property.descriptor = null;
                property.runningCheck=true;
                property.type='*';
            }

            if( is_accessor_last )
            {
                property.runningCheck =true;
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
        var totype=[];
        do{
            if( !(it.current.value==='.' || it.current.type==='(identifier)') )break;
            totype.push( it.current.value );
        }while ( it.seek() );

        if( totype.length<1 )
        {
            error( 'Unexpected keyword "as" ', 'type');
        }

        totype = totype.join("");
        property = createDescription(it, classmodule, property);
        if( totype === classmodule.classname )
        {
            typename = classmodule.type;

        }else
        {
            var typename = getDefinedClassName(classmodule, totype);
            if (!typename) {
                error('"' + totype + '" is not exists', 'reference');
            }
            var typeClass = getmodule(typename);
            if ( !typeClass || ( typeClass.nonglobal === true && typeClass.privilege !== 'public' && typeClass.package !== classmodule.package ) )
            {
                error('"' + typename + '" is not exists', 'reference');
            }
            var info = '"' + Iteration.lastStack.line + ':' + Iteration.lastStack.cursor + '"';

            if( !typeClass.nonglobal )
            {
                property.thisArg = operateMethodOfCheckType(classmodule, library_base_path+typename, property.thisArg, info);
            }else{
                property.thisArg = operateMethodOfCheckType(classmodule, typename, property.thisArg, info);
            }
        }
        property.type = typename;
        it.stack.valueType = typename;
        property.name = [];
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
function joinProperty( props , operation )
{
    props = props.reduce(function (accumulator,value) {
        if( value instanceof Array ){
            value = "["+value.join("")+"]";
        }
        if( value.charAt(0)==="[" && accumulator.length > 0 )
        {
            accumulator[ accumulator.length-1 ]+=value;

        }else{
            accumulator.push( value );
        }
        return accumulator;
    },[]);
    return props.join( operation || "->");
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

function getOperateMethodProps( props, checkRunning )
{
    if( checkRunning )
    {
        return props[0] instanceof Array ? props[0].join("") : '"'+props[0]+'"';
    }
    return props[0] instanceof Array ? "["+props[0].join("")+"]" : props[0];
}

function getSuperMethodProps( superClass )
{
    return '"'+superClass.replace(/\./g,'\\\\')+'"';
}

function operateMethodOfCheckType( classmodule,type,value, info )
{
    classmodule.requirements['System']=true;
    return library_base_path+"System::type("+value+","+toRefClassName(type)+")";
}

function hasAssignType( type )
{
    return type && !(type==='*' || type ==='void');
}

function getExpressionOwnerType( desc )
{
    var type = '';
    if( desc )
    {
        if( desc.descriptor )
        {
            type = desc.descriptor.owner;
            if( !type && hasAssignType(desc.descriptor.origintype) )
            {
                type = desc.descriptor.origintype;
            }
        }

        if( !type )
        {
            if( hasAssignType( desc.assignType ) )
            {
                type = desc.assignType;

            }else if( hasAssignType( desc.referenceType ) )
            {
                type = desc.referenceType;
            }else if( hasAssignType( desc.type ) )
            {
                type = desc.type;
            }
        }
    }
    return type;
}

function operateMethodOfGet(classmodule, thisvrg, desc, props ,info, before)
{
    var checkRunning = desc.runningCheck;
    var hasBefore = before;
    before = before || '';
    if( before && !Utils.isIncreaseAndDecreaseOperator(before) )before='';

    if( thisvrg==="document" )
    {
        classmodule.requirements['System']=true;
        thisvrg="System::document()";
    }
    if( thisvrg==="window" )
    {
        classmodule.requirements['System']=true;
        thisvrg="System::window()";
    }
    if( thisvrg==="System" )
    {
        classmodule.requirements['System']=true;
    }

    //引用变量
    if( props.length==0 )
    {
        if( !hasBefore && desc && thisvrg !== "$this" && desc.descriptor && desc.descriptor.id ==='class' && desc.descriptor.fullclassname )
        {
            return toRefClassName( desc.descriptor.fullclassname );

        }else if( !hasBefore && desc.classNameReference && thisvrg ===  desc.classNameReference )
        {
            return toRefClassName(  globals.hasOwnProperty( desc.classNameReference ) ? library_base_path+desc.classNameReference : desc.classNameReference );
        }
        return before + thisvrg + desc.after;

    }else if( props.length > 1 )
    {
        throw new ReferenceError('"' + props.join(".") + '" parse error');
    }

    var method ='Reflect::get';
    var map;
    var ns;

    //是否对引用值的增减量操作
    if( before || desc.after )
    {
        map = desc.super ? [ getSuperMethodProps(desc.super), getOperateMethodProps(props,true), thisvrg ] : [thisvrg, getOperateMethodProps(props,true),'null'];
        if( before )map.push("true")
        method = 'Reflect::increment';
        if( before==="--" || desc.after==="--" )
        {
            method = 'Reflect::decrement';
        }
        classmodule.requirements['Reflect']=true;
        return method+"("+map.join(",")+")";
    }

    if( !checkRunning )
    {
        ns = getDescNamespace( desc.descriptor );
        if( ns ){
            ns =  getPrivateNamespaceUri( getNamespaceUid( checkUseNamespace(desc,classmodule,ns).value ) );
        }

        if( desc.super )
        {
            thisvrg='parent';
        }

        map= [thisvrg, ns+getOperateMethodProps(props, checkRunning) ];
        var operation = getPropOperator(thisvrg, desc);

        var flag= true;
        var refType = getExpressionOwnerType( desc );
        var ownerModule = refType ? getmodule( refType ) : null;
        if( ownerModule && !ownerModule.nonglobal )
        {
            flag = false;
            var syntax = toFunctionSyntax( desc, ownerModule, thisvrg, props,[]);
            if( syntax ){
                return syntax;
            }
        }

        if( desc && desc.descriptor && desc.descriptor.isAccessor===true)
        {
            var prefix = ns+"Get_";
            map.splice(1,1, prefix+getOperateMethodProps(props, checkRunning))
            if( !desc.descriptor.value.get )
            {
                throw new ReferenceError('"' + joinProperty(desc.info) + '" getter does exists');
            }
            return joinProperty( map , operation)+'()';
        }
        if( desc.super )
        {
            throw new ReferenceError('"' + joinProperty(desc.info) + '" the super property is not accessor or method');
        }
        return joinProperty( map , operation);
    }

    classmodule.requirements['Reflect']=true;
    var scope =  getOperatorScope( classmodule , desc );
    var index = desc.super ? 3 : 2;
    map = desc.super ? [ getSuperMethodProps(desc.super), getOperateMethodProps(props,true), thisvrg ,'null','null'] : [thisvrg, getOperateMethodProps(props,true),"null",'null','null'];
    if( scope )
    {
        index = 3;
        map.splice(index++,1,scope);
    }

    //使用指定的命名空间
    ns = getUseNamespace( desc );
    if( ns.length > 0 )
    {
        index=4;
        if( classmodule.id==="class" || classmodule.id==="abstract" )
        {
            map.splice(index,1,'[self::$'+ns.join(",self::$")+']');
        }else{
            map.splice(index,1,'[$'+ns.join(",$")+']');
        }
        index++;
    }
    map.splice(index,3);
    return method+"("+map.join(",")+")";
}

function operateMethodOfSet(classmodule, thisvrg, desc, props ,info, value, operator )
{
    var checkRunning = desc.runningCheck;

    //引用变量
    if( props.length==0 )
    {
        return  thisvrg + operator + value;

    }else if( props.length > 1 )
    {
        throw new ReferenceError('"' + props.join(".") + '" parse error');
    }

    var method ='Reflect::set';
    var map;
    var ns;

    if( !checkRunning )
    {
        ns = getDescNamespace( desc.descriptor );
        map= [thisvrg, ns+getOperateMethodProps(props, checkRunning) ];

        if( desc.super )
        {
            thisvrg='parent';
        }

        var operation =  getPropOperator(thisvrg, desc);
        var flag= true;
        var refType = getExpressionOwnerType( desc );
        var ownerModule = refType ? getmodule( refType ) : null;
        if( ownerModule && !ownerModule.nonglobal )
        {
            flag = false;
            var syntax = toFunctionSyntax( desc, ownerModule, thisvrg, props,[]);
            if( syntax ){
                return syntax;
            }
        }

        if( desc && desc.descriptor && desc.descriptor.isAccessor===true)
        {
            var prefix = ns+"Set_";
            map.splice(1,1, prefix+getOperateMethodProps(props, checkRunning))
            if( !desc.descriptor.value.set )
            {
                throw new ReferenceError('"' + joinProperty(desc.info) + '" setter does exists');
            }
            return joinProperty( map , operation)+'('+value+')';
        }
        if( desc.super )
        {
            throw new ReferenceError('"' + joinProperty(desc.info) + '" the super property is not accessor or method');
        }
        return joinProperty( map , operation)+operator+value;
    }

    classmodule.requirements['Reflect']=true;
    var scope =  getOperatorScope( classmodule, desc );
    var index = desc.super ? 4 : 3;
    map = desc.super ? [ getSuperMethodProps(desc.super), getOperateMethodProps(props,true),value, thisvrg, 'null' ,'null'] : [thisvrg, getOperateMethodProps(props,true),value,"null",'null',"null"];

    if( scope )
    {
        index = 4;
        map.splice(index++, 1, scope );
    }

    //使用指定的命名空间
    ns = getUseNamespace( desc );
    if( ns.length > 0 )
    {
        index=5;
        if( classmodule.id==="class" || classmodule.id==="abstract" )
        {
            map.splice(index,1,'[self::$'+ns.join(",self::$")+']');
        }else{
            map.splice(index,1,'[$'+ns.join(",$")+']');
        }
        index++;
    }
    map.splice(index,3);
    return method+"("+map.join(",")+")";
}

function operateMethodOfApply(classmodule, thisvrg, desc, props ,info)
{
    var checkRunning = desc.runningCheck;
    var method ='Reflect::call';
    var map;
    var ns = getDescNamespace( desc.descriptor , desc.use );
    var param = [];
    if( desc.param &&  desc.param.length>0 )
    {
        param = desc.param;
    }

    if( !checkRunning )
    {
        var thisRef = thisvrg;
        if( desc.classNameReference === thisvrg )
        {
            thisRef=toRefClassName( globals.hasOwnProperty( desc.classNameReference ) ? library_base_path+desc.classNameReference: desc.classNameReference , true );
        }

        map= desc.super ? ['parent'] : [thisRef];
        if( ns ){
            ns =  getPrivateNamespaceUri( getNamespaceUid( checkUseNamespace(desc,classmodule,ns).value ) );
        }

        if( props.length === 0 && desc.super )
        {
            map= ['parent','__construct'];

        }else if( props.length > 0 )
        {
            var refType = getExpressionOwnerType( desc );
            var ownerModule = refType ? getmodule( refType ) : null;
            if( ownerModule && !ownerModule.nonglobal )
            {
                var syntax = toFunctionSyntax( desc, ownerModule, thisvrg, props, param);
                if( syntax )
                {
                    return syntax;
                }
            }
            map.push( ns+getOperateMethodProps(props, checkRunning) );
        }

        var operation = getPropOperator(thisvrg, desc);
        return  joinProperty( map , operation) + "(" + param.join(",") + ")";

    }

    if( desc.classNameReference === thisvrg )
    {
        thisvrg=toRefClassName(   globals.hasOwnProperty( desc.classNameReference ) ? library_base_path+desc.classNameReference: desc.classNameReference );
    }

    classmodule.requirements['Reflect']=true;
    var callable=desc.super ? ["'"+desc.super.replace(/\./g,'\\')+"'"] : [ thisvrg ];
    if( props.length > 0 )
    {
        callable.push( getOperateMethodProps(props, true) );

    } else if ( desc.super )
    {
        return "parent::__construct("+ param.join(",")+")";
    }

    var scope =  getOperatorScope( classmodule, desc );
    var index = 1;
    map=["["+callable.join(",")+"]","null","null","null","null"];
    if( param.length > 0 )
    {
        map.splice( index++,1,"["+param.join(",")+"]");
    }

    if( desc.super )
    {
        index = 2;
        map.splice(index++,1,thisvrg);
    }

    if( scope )
    {
        index = 3;
        map.splice(index++,1, scope );
    }

    //使用指定的命名空间
    ns = getUseNamespace( desc );
    if( ns.length > 0 )
    {
        index = 4;
        if( classmodule.id==="class" || classmodule.id==="abstract" )
        {
            map.splice(index,1,'[self::$'+ns.join(",self::$")+']');
        }else{
            map.splice(index,1,'[$'+ns.join(",$")+']');
        }
        index++;
    }
    map.splice(index,4);
    return method+'('+map.join(",")+')';
}

function getOperatorScope( classModule, desc )
{
    if( desc.funScope.parent().keyword() ==="rootblock" )
    {
        // return null;
    }
    if( classModule.id==="class" || classModule.id==="abstract" )
    {
        return "'"+classModule.fullclassname.replace(/\./g,"\\")+"'";
    }
    return null;
}

function getPropOperator(thisvrg, desc)
{
    var refname = thisvrg.replace(/\\/g,'.');
    var module = getmodule( refname );
    if( module )return '::';
    var operation = desc.descriptor.isStatic || desc.super ? "::" : "->";
    return operation;
}

function operateMethodOfNew( classmodule, express, desc, info )
{
    var checkRunning = desc.runningCheck;
    var param = [];
    if( desc.param && desc.param.length>0){
        param= desc.param;
    }
    switch ( express )
    {
        case "Array" :
            return 'array('+param.join(',')+')';
        case "Object" :
            return 'new stdClass('+param.join(',')+')';
    }
    return 'new '+express+'('+param.join(',')+')';
}

function pushInfo(refArr, info, desc, express )
{
    if( globalsConfig.mode==1 )
    {
        if( !express )
        {
            express = joinProperty( desc.info );
        }
        desc.raw = express.replace(/\"/g,'\"');
        refArr.unshift( '"'+( desc.raw+':'+info)+'"' );
    }
}

function operateMethodOfDel(classmodule, thisvrg, desc, props ,info)
{
    var checkRunning = desc.runningCheck;
    if( props.length === 0 )
    {
        return "unset("+thisvrg+")";

    }else if( props.length > 1 )
    {
        throw new ReferenceError('"'+joinProperty(desc.info)+'" parse error');
    }

    props = createReferenceProps( props,  checkRunning );
    if( !checkRunning )
    {
        var owner = desc.descriptor.owner ? getmodule( desc.descriptor.owner ) : null;
        if( owner || desc.descriptor.isStatic )
        {
            throw new ReferenceError('"'+joinProperty(desc.info)+'" the class property is not delete');
        }
        return "unset("+joinProperty( [thisvrg].concat( props ) )+")";
    }

    if( desc.super )
    {
        throw new ReferenceError('"'+joinProperty(desc.info)+'" the class property is not delete');
    }
    return "unset("+joinProperty( [ thisvrg, props[0] ] )+")";
}

function getNs( ns )
{
    if( ['public','protected','private','internal'].indexOf( ns ) >=0 )
    {
        return globalsConfig.context[ ns ] ||  ns;
    }
    return ns+'->valueOf()';
}


var syntaxMap = {
    "array":{
        "push":function (thisarg,param)
        {
            return "array_push("+[thisarg].concat( param ).join(",")+")";
        },"pop":function (thisarg,param)
        {
            return "array_pop("+[thisarg].join(",")+")";
        },"splice":function (thisarg,param)
        {
            return "array_splice("+[thisarg].concat( param ).join(",")+")";
        },"indexOf":function (thisarg,param)
        {
            return "array_search("+[param[0],thisarg].join(",")+")";
        },"length":function (thisarg)
        {
            return "count("+thisarg+")";
        },"map":function (thisarg,param)
        {
            if( !param[0] )param[0]="function($a){return $a}";
            return "array_map("+[ param[0],thisarg ].join(",")+")";
        },"slice":function (thisarg,param)
        {
            return "array_slice("+[thisarg].concat( param ).join(",")+")";
        },"shift":function (thisarg,param)
        {
            return "array_shift("+[thisarg].join(",")+")";
        },"unshift":function (thisarg,param)
        {
            return "array_unshift("+[thisarg].concat(param).join(",")+")";
        },"keys":function (thisarg,param)
        {
            return "array_keys("+[thisarg].concat(param).join(",")+")";
        },"values":function (thisarg,param)
        {
            return "array_values("+[thisarg].join(",")+")";
        },"unique":function (thisarg,param)
        {
            return "array_unique("+[thisarg].join(",")+")";
        }
    },
    "string":{
        "length":function (thisarg,param) {
            return "strlen("+thisarg+")";
        },"charAt":function (thisarg,param) {
            return "strpos("+[thisarg].concat(param).join(",")+")";
        },"charCodeAt":function (thisarg,param) {
            return "ord("+syntaxMap['string']['charAt'](thisarg,param)+")";
        },"substr":function (thisarg,param) {
            return "substr("+[thisarg].concat(param).join(",")+")";
        },"toLowerCase":function (thisarg,param) {
            return "strtolower("+[thisarg]+")";
        },"toUpperCase":function (thisarg,param) {
            return "strtoupper("+[thisarg]+")";
        },"split":function (thisarg,param) {
            return "explode("+[ param[0], thisarg].join(",")+")";
        },"slice":function (thisarg,param) {
            return "substr("+[thisarg].concat(param).join(",")+")";
        }
    }
}

function toFunctionSyntax(desc, globalModule, thisarg, props ,param )
{
    var classname = (globalModule.classname || globalModule.type).toLowerCase();
    var name = props[0];
    if( syntaxMap[ classname ] && syntaxMap[ classname ][ name ] )
    {
        return syntaxMap[ classname ][ name ](thisarg, param);

    }else
    {
        return null;
    }
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
    var checkRunning = desc.runningCheck;

    //checkRunning = true;

    //调用超类属性或者方法
    //if( desc.super )thisvrg = 'this';

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

    var express;
    if( beforeOperator==='new' )
    {
        /* if( desc.descriptor.id !=='class' && desc.descriptor.type && desc.descriptor.type !=='*' && desc.descriptor.type !=="Class")
         {
         props.unshift( thisvrg );
         error('"'+props.join(".")+'" is not Class');
         }*/
        express=operateMethodOfNew(classmodule, operateMethodOfGet(classmodule, thisvrg, desc, props ,info, beforeOperator ), desc, info);
        beforeOperator= desc.before.pop();

    }else if( beforeOperator==='delete' )
    {
        express=operateMethodOfDel(classmodule, thisvrg, desc, props ,info);
        beforeOperator= desc.before.pop();

    }else if( beforeOperator==='typeof' )
    {
        express=library_base_path+'System::typeOf('+operateMethodOfGet(classmodule, thisvrg, desc, props ,info, beforeOperator)+')';
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
        return item;
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
    var leftType = getExpressionOwnerType(express[0]);

    while( it.next && Utils.isLeftAndRightOperator(it.next.value) && !Utils.isMathAssignOperator(it.next.value)  )
    {
        it.seek();
        operator = it.current.value;
        if ( !it.next )error('Missing expression', '');
        it.seek();
        if( operator === 'instanceof' || operator === 'is' )
        {
            operator = operator==='instanceof' ? 'isOf' : operator;
            var  ins = parse(classmodule, express.pop() );
            var insClass = getDescriptorOfExpression(it, classmodule);
            express.push(library_base_path+'System::'+operator+'('+ins+','+ parse(classmodule, insClass)+')');
            type= 'Boolean';

        }else
        {
            var value = getDescriptorOfExpression(it, classmodule);
            var _vType = getExpressionOwnerType( value );
            if( operator ==='in' )
            {
                express.push(' ');
                type= 'Boolean';

            }else if( Utils.isMathOperator(operator) )
            {
                type = 'Number';
            }

            if( operator==='+' &&  _vType === 'String' )
            {
                type='String';
            }


            if( operator==='+' && (leftType ==="String" || _vType === 'String') )
            {
                operator = '.';
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

        var num = 0;
        for(var b=0; b<items.length; b++)
        {
            if( items[b]==="||" )num++;
        }
        if( num * 2 === items.length-1 )
        {
            var expres = items.filter(function (a) {
                return a !== "||";
            }).join(",");
            return {type:type,thisArg: library_base_path+'System::when('+expres+')',coalition:true};
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
function expression( stack, classmodule ,  acceptType , fromParam )
{
    if( stack.content().length===0 )return '';
    var it = new Iteration( stack , classmodule );
    var express = it.content;
    var val;
    var first;
    it.acceptType = acceptType;

    while ( it.seek() )
    {
        val = first = bunch(it, classmodule);
        var firstType = getExpressionOwnerType(first);
        if(val)express.push( val );

        // a = b or a += b ;
        while( it.next && Utils.isMathAssignOperator(it.next.value) )
        {
            it.seek();
            var operator=it.current.value;
            if (!it.next)error('Missing expression', '');
            it.seek();
            var current = it.current;
            val = bunch(it, classmodule);
            var _vType = getExpressionOwnerType(val);
            if( operator==="+=" && ( firstType==="String" || _vType==="String") )
            {
                operator = '.=';
            }
            express.push( operator );
            if(val)express.push(val);
            if( current instanceof Ruler.STACK )
            {
                if( getType( stack.type() ) ==='*' )stack.type( current.type() );
            }
            //给声明的属性设置值的类型
            if( typeof express[0] === "object" && express[0].descriptor )
            {
                express[0].descriptor.valueType=stack.type();
                //express[0].descriptor.referenceType=stack.type();
            }
        }
    }

    //赋值运算从右向左（从后向前）如果有赋值
    var describe =  express.pop();
    var valueDescribe = describe;
    var value;
    var str=[];

    if( acceptType === "Function" && !describe.expression && describe.name.length === 2 )
    {
        value = "array("+describe.name[0]+",'"+describe.name[1]+"')";
    }else
    {
        value = parse(classmodule, describe );
    }

    if( express.length === 0 )
    {
        str.push(value);

    }else
    {
        var operator;
        var returnValue = true;
        var separator = stack.parent().keyword() === 'object' && stack.parent().type() === '(expression)' ? ',' : ';';
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
            if( describe.descriptor && describe.descriptor.id==='function' )
            {
                if( describe.accessor !=='set' && describe.descriptor.fromVarToAccessor !==true )
                {
                    error('"' +joinProperty( describe.info ) + '" is not setter', 'type');
                }
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
                        value = operateMethodOfCheckType( classmodule,_acceptType,value, info );
                    }

                } else if( !checkTypeOf(classmodule, _acceptType , valueType, valueDescribe , describe ) )
                {
                    error('"' + joinProperty( describe.info ) + '" type does not match. must be "' + _acceptType + '"', 'type');
                }
            }

            //设置引用的数据类型
            if ( describe.descriptor && hasAssignType(valueType) )
            {
                describe.descriptor.referenceType = valueType;
            }

            var ret = parse(classmodule, describe, value, operator, returnValue);
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
        //运行时检查类型
        if ( valueType === '*' )
        {
            var info = '"' + Iteration.lastStack.line + ':' + Iteration.lastStack.cursor + '"';
            if( fromParam !==true )
            {
                value = operateMethodOfCheckType( classmodule,acceptType,value, info );
            }

        } else if ( !checkTypeOf(classmodule, acceptType, valueType, valueDescribe ) && !( stack.parent().type() ==='(property)' && valueType==='Number' ) )
        {
            error('"' + joinProperty( describe.info ) + '" type does not match. must be "' + acceptType + '"', 'type');
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
        return refDesc.referenceType || '*';
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

    if( classmodule.nonglobal ===true &&  Object.prototype.hasOwnProperty.call( classmodule.declared,type) )
    {
        return type;
    }

    if( Object.prototype.hasOwnProperty.call(globals,type) )
    {
        (classmodule.requirements || (classmodule.requirements={}))[ type ]=true;
        requirements[type]=true;
        return type;
    }
    error( '"'+type+'" type does exists','type');
}

function getClassPropertyDescByProp(prop, proto, refObj, classmodule, it , isset , ns  )
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

        //默认命名空间
        var desc=getClassPropertyDescNS('',prop,name,refObj,classmodule,it,isset);
        if( desc.length > 1 ){
            //error('"' + it.current.value + '" inaccessible', 'reference');
        }

        //自定义伯命名空间
        if( ns )
        {
            var descNs;
            for (var n in ns )
            {
                descNs = getClassPropertyDescNS(n,prop,name,refObj,classmodule,it,isset);
                if( descNs.length>0 )
                {
                    if ( (desc.length + descNs.length) > 1 )error('"' + joinProperty( propertyDesc.info ) + '" inaccessible', 'reference');
                    desc = descNs;
                    break;
                }
            }
        }

        desc =desc[0];
        //默认都继承对象
        if ( !desc && globals.Object[name][prop])
        {
            desc = globals.Object[name][prop];
        }
        if( desc )
        {
            return desc;
        }
    }
    if( classmodule.isDynamic )return {type:'*'};
    if(flag===true)return null;
    error('"' +joinProperty( propertyDesc.info ) + '" does not exits', 'reference');
}

function getClassPropertyDescNS(ns, prop, name, refObj, classmodule, it , isset )
{
    var desc=[];
    var parent = refObj;
    var ret;

    //在继承的类中查找
    do{
        if( parent[name] )
        {
            ret = getClassPropertyDescByProp(prop, ns ? parent[name][ns] : parent[name], parent, classmodule, it, isset , ns );
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

/**
 * 转换语法
 * @returns {String}
 */
function toString( stack, module, acceptType , fromParam )
{
    if( stack.keyword() === 'expression')
    {
        return expression( stack , module , acceptType, fromParam );
    }
    var it = new Iteration(stack, module );
    var isAs = false;
    it.acceptType = acceptType;
    while ( it.seek() )
    {
        if (it.current instanceof Ruler.STACK)
        {
            it.content.push( toString(it.current, module ) );
            isAs = it.current.isAs === true;

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

            if( it.current.value===":" && (stack.type()==="(Array)" || stack.type()==="(JSON)") )
            {
                it.content.push( "=>" );
            }else
            {
                it.content.push( it.current.value );
            }

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

    if( isAs ===true && it.content[0] ==="(" && it.content[ it.content.length-1 ]===")" )
    {
        return it.content.slice(1,-1).join('');
    }

    if( stack.keyword() === 'object' )
    {
        var type = getType( stack.type() );
        if( acceptType && acceptType !== '*' && acceptType !== 'Object' )
        {
            if (type === 'Array' || type === 'JSON' || type === 'Object')
            {
                if (!checkTypeOf(module, acceptType, type))
                {
                    error('"' + it.content.join('') + '" type does not match. must be "' + acceptType + '"', 'type');
                }
            }
        }
        if( type==="JSON" )
        {
            /*if(it.content.slice(1,-1).length===0 )
             {
             return 'new Object()';
             }*/
            return it.content.slice(1,-1).join('');
        }
    }
    return it.content.join('');
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
    if( needType==='*' || needType==='void' || currentType==='Object' || needType==='Object' ){

        classModule.requirements[ needType ]=true;
        requirements[ needType ]=true;
        return true;
    }
    if( currentType ==='void' )return false;
    if( needType==='Class' && (currentType==='Function' || describeType.descriptor.id==='class') )
    {
        classModule.requirements[ needType ]=true;
        requirements[ needType ]=true;
        return true;
    }

    currentType = getmodule( getImportClassByType( classModule, currentType ) );
    var need;
    if( needDescribe && needDescribe.descriptor && needDescribe.descriptor.owner ){

        need = getmodule( getImportClassByType( getmodule( needDescribe.descriptor.owner ), needType ) );
    }else{
        need = getmodule( getImportClassByType( classModule, needType ) );
    }

    var isInterfaceType = need.id==="interface";
    needType = need.classname || need.type;

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
function checkInterface(classModule)
{
    if( classModule.implements.length === 0 )return;
    var interfaceDesc = [];
    for( var i in classModule.implements )
    {
        var last;
        doPrototype( getmodule( getImportClassByType( classModule, classModule.implements[i] ) ),function (module) {
            if( module.id !== 'interface' )error('Interface can only extends an interface' );
            last = module;
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
            if( obj.type !== desc[name].type )error('the "' + name + '" interface of mismatch the return type ('+classModule.filename+')');
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
    express = express[0].content()[0].content();
    express.splice(0, 2);
    var scope = stack.getScopeOf();
    var id = scope.keyword();
    var ret;
    if( id==="package" )
    {
        ret = classModule.package+"/"+stack.qualifier()+":"+stack.name();

    }else if( id==="class" )
    {
        ret = classModule.package+"."+classModule.classname+"/"+stack.qualifier()+":"+stack.name();

    }else if( id==="function" )
    {
        ret = classModule.package+"."+classModule.classname+"/"+stack.qualifier()+":"+scope.name()+"/"+classModule.package+":"+stack.name();
    }
    if (express.length === 1)
    {
        ret = express[0].value.replace(/[\"\']/g,'');
    }
    return ret;
}

function checkUseNamespace(item, classModule , nameNs )
{
    nameNs = nameNs || item.name();
    var scope = item.funScope ? item.funScope : item.getScopeOf();
    var descNs= scope.define(nameNs);
    if( descNs && descNs.id==="namespace" )
    {
        return classModule.namespaces[ nameNs ];
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
    return descNs[nameNs];
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


/**
 * 生成模块信息
 * @param stack
 * @returns {string}
 */
function makeModule( stack , classModule, config )
{
    var id = stack.keyword();
    if( !(id==="class" || id==="interface") )
    {
        var content = stack.content();
        var len = content.length;
        var j=0;
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
                        //classModule.namespaces[content[j].name()].value = getNamespaceValue(content[j], classModule);
                    }

                    classModule.namespaces[ content[j].name()  ].nsUid = getNamespaceUid( classModule.namespaces[ content[j].name() ].value );
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
                    }else
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

    //声明在包外的类
    if( stack.parent() && stack.parent().keyword()==="rootblock" && stack.keyword() ==="class" )
    {
        classModule = classModule.declared[ stack.name() ];
    }

    //继承父类
    if( classModule.inherit )
    {
        var realName = classModule.inherit;
        if( Object.prototype.hasOwnProperty.call(classModule.declared, classModule.inherit )  && classModule.declared[ classModule.inherit ].id==="class" )
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

            error('parent class is not extends.');
        }
        if( classModule.id !== parent.id )
        {
            classModule.id==='class' ? error('Class can only extends the class') : error('Interface can only extends the interface');
        }
        //需要的系统模块
        if( Object.prototype.hasOwnProperty.call(globals,classModule.inherit) )requirements[ classModule.inherit ]=true;
    }

    if( stack.keyword() ==='interface' )return classModule;

    //如果有使用到的全局函数必须合并
    for ( var j in classModule.import )
    {
        if( Object.prototype.hasOwnProperty.call(globals, classModule.import[j] ) )
        {
            requirements[ classModule.import[j] ]=true;
        }
    }

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
            var inheritClass = getmodule( getImportClassByType(classModule,classModule.inherit) );
            //var superclass = inheritClass.nonglobal === true ? classModule.inherit + ".constructor.call(this)" : classModule.inherit + ".call(this)";
            classModule.constructor.value = 'function __construct(){parent::__construct();}';

        }else
        {
            classModule.constructor.value ='function __construct(){parent::__construct();}';
        }
    }

    //需要实现的接口
    checkInterface(classModule);

    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK && item.keyword() !=='metatype' )
        {
            if( item.keyword()==="namespace" )
            {
                classModule.namespaces[ item.name() ] = classModule.static[ item.name() ];
                classModule.static[ item.name() ].value = getNamespaceValue( item , classModule );
                classModule.static[ item.name() ].nsUid =  getNamespaceUid( classModule.static[ item.name() ] );
                continue;

            }else if( item.keyword() ==="use" )
            {
                checkUseNamespace(item, classModule);
                continue;
            }

            var namespacePrefix='';
            if( item.qualifier() && "private,protected,public,internal".indexOf( item.qualifier() )< 0 )
            {
                var useNamespace = checkUseNamespace(item, classModule , item.qualifier() );
                namespacePrefix = getPrivateNamespaceUri( getNamespaceUid( useNamespace.value ) );
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
                error('Incompatible override for "'+item.name()+'"','');
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

                if( item.accessor() )
                {
                    var fnNameStack = item.content()[1];
                    var aName = item.accessor() ==="get" ? "Get_" : "Set_";
                    fnNameStack.value = aName+fnNameStack.value;
                }

                //去掉函数名称
                //item.content().splice(1,1);
                //构造函数
                if( item.name() === stack.name() && !isstatic )
                {
                    item.content().splice(1,1,{'type':'(string)','value':"__construct",'id':'identifier'});
                    classModule.constructor.value = toString( item , classModule );
                    continue;
                }
                //普通函数
                else
                {
                    if( namespacePrefix )
                    {
                        item.content()[1].value = namespacePrefix+item.content()[1].value;
                    }
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
                if( typeof desc.value === "string" && desc.bindable !== true  )
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

                ret = Utils.trim( ret );
                if( !( /^([\"\']).*?\1$/.test(ret) || /^\w+$/.test(ret) ) && !Utils.isConstant( ret ) )
                {
                    var _pn = namespacePrefix + item.name();
                    if (item.static()) {
                        props.push("self::" + _pn + '=' + ret);
                    } else {
                        props.push("$this->" + _pn + '=' + ret);
                    }
                    ret = 'null';
                }
                val.push( ret );
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

    for( var u in classModule.use )
    {
        if( classModule.namespaces[u] )
        {
            props.unshift("self::$"+u+"="+"new Namespaces('','"+classModule.namespaces[u].value+"')");
        }else
        {
            var refNs = classModule.import[ u ];
            if( !refNs )
            {
                for (var i in classModule.import)if (classModule.import[i] === u)
                {
                    refNs = classModule.import[i];
                    break;
                }
            }
            if( !refNs )
            {
                error('Undefined namespace "' + u + '"', "reference" );
            }
            var descNs = getmodule( refNs );
            if( descNs )
            {
                descNs = descNs.namespaces;
            }

            if( !descNs || !Object.prototype.hasOwnProperty.call(descNs,u) )
            {
                error('Undefined namespace "' + u + '"', "reference");
            }
            if( descNs[u].id !=="namespace" )
            {
                error('Invalid reference namespace "' + u + '"', "reference");
            }
            // props.unshift("self::$"+u+"="+"new Namespaces('"+descNs[u].value+"',"+getNamespaceUid(descNs[u].value)+")");
            props.unshift("self::$"+u+"="+"new "+u+"()");
        }
    }

    if( classModule.id !=='interface' && !isstatic )
    {
        var event = {type:'(defineProperty)', props:props };
        stack.dispatcher(event);
        if( event.props.length > 0 )
        {
            classModule.constructor.value = classModule.constructor.value.replace('####{props}####', event.props.join(';\n')+';\n' );
        }else
        {
            classModule.constructor.value = classModule.constructor.value.replace('####{props}####', '' );
        }
    }
    return classModule;
}

function getStack( stack , flag )
{
    if( stack instanceof Ruler.STACK )
    {
        var content = stack.content();
        var len = content.length;
        var start = 0;
        while ( start < len )
        {
            var index = flag ? start++ : len-(++start);
            if( !(content[index] instanceof Ruler.STACK) )
            {
                return content[index];
            }
        }
        return getStack( stack.parent() , flag );
    }
    return stack;
}

var default_ns = ['public','private','protected','internal'];
function getDescNamespace( desc , use )
{
    if( !desc )return use || '';
    use = use || desc.privilege;
    return default_ns.indexOf( use ) < 0 ? use || '' : '';
}

function getUseNamespace( desc )
{
    var ns =[];
    if( desc.use )
    {
        return [desc.use];
    }

    if( desc && desc.funScope && desc.funScope.define("use") )
    {
        var use = desc.funScope.define("use");
        for(var n in use )
        {
            ns.push(n);
        }
    }
    return ns;
}

function toItemValue(describe,code,properties,config,prefix, classModule )
{
    for( var p in describe )
    {
        var desc = describe[p];
        if( classModule.use && classModule.use[p] === "namespace" && desc.id !=="namespace" )
        {
            toItemValue(desc,code,properties,config, prefix, classModule);
            continue;
        }

        var item = [];
        var id = desc.id;
        var writable=!( id==='const' || id==='function' );
        var ns = desc.privilege || 'public';
        var useNamespace;
        if( ['public','private','protected','internal'].indexOf( ns ) < 0 )
        {
            useNamespace = checkUseNamespace( desc.__stack__, classModule , ns );
            ns  = "public";
        }

        if (typeof desc.value === "object")
        {
            if (desc.value.get )
            {
                item.push( ns+" "+(desc.varToBindable ?  desc.value.get : desc.value.get.value) );
            }

            if (desc.value.set)
            {
                writable=false;
                item.push( ns+" "+(desc.varToBindable ? desc.value.set : desc.value.set.value) );
            }

        }else
        {
            if (desc.value)
            {
                if( id==="function")
                {
                    if( desc.isStatic ){
                        ns = 'static '+ns;
                    }
                    item.push( ns+" "+desc.value );

                }else
                {
                    var _name = p;
                    if( useNamespace ){
                        _name = getPrivateNamespaceUri( getNamespaceUid( useNamespace.value ) )+_name;
                    }

                    if( id ==="const" && desc.isStatic ){
                        item.push( "const "+_name+"="+desc.value+";" );
                    }else{
                        item.push( ns+" $"+_name+"="+desc.value+";" );
                    }
                }
            }
        }
        code.push( item.join('\n') );
    }
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
    var properties={};
    toItemValue(describe,code,properties,config,prefix, classModule );
    return code.join("\n");
}

function buildModuleStructure( o , config )
{
    var code=[];
    if( o.isAbstract )code.push("abstract");
    code.push("class");
    code.push(o.classname);
    if( o.inherit ) {
        var inheritClass = getmodule( getImportClassByType(o, o.inherit) );
        code.push( "extends" );
        code.push( o.inherit );
    }
    if( o.implements && o.implements.length > 0 )
    {
        code.push( 'implements' );
        code.push( o.implements.join(',') );
    }
    code= [ code.join(" ") ];
    code.push("{");
    if( o.id ==='class' )
    {
        for( var p in o.use )
        {
            code.push( "public static $"+p+"=null;" );
        }

        if( !o.isDynamic )
        {
            code.push( 'protected $__sealed__=true;' );
        }else
        {
            code.push( 'protected $__sealed__=false;' );
        }

        code.push( o.constructor.value );
        code.push( toValue(o.static, config , "method" , false , o ) );
        code.push( toValue( o.proto, config , 'proto' ,  inheritClass && inheritClass.nonglobal, o ) );
    }
    code.push("}");
    return code.join("\n");
}

function makePrivateModuleClass( description, config )
{
    var str=[];
    var declared = description.declared;
    for(var p in declared )
    {
        if( declared[p].id==="class" )
        {
            str.push( buildModuleStructure( o , config ) );
        }
    }
    return str.join("\n");
}

var makeNamespaces=[];


/**
 * 将描述信息构建成类模块
 * @param o
 * @returns {string}
 */
function makeClassModule( o , config )
{
    if( o.makeDone===true )return '';
    o.makeDone = true;
    if( o.isInternal===true )return '';
    var str =[];
    if( o.inherit && o.id!=="namespace")
    {
        var inheritClass = getmodule( getImportClassByType(o,o.inherit) );
        if( inheritClass.nonglobal===true )
        {
            makeClassModule( inheritClass , config );
        }
    }

    var import_keys=[];
    var import_values=[];
    for (var i in o.import)
    {
        if( o.import[i] ==="Class")continue;
        var importModule = getmodule( getImportClassByType(o, i) );
        if( importModule.nonglobal ===true && importModule.privilege !=='public' && o.package !== importModule.package && importModule.id!=="namespace" )
        {
            error('"'+getImportClassByType(o, i)+'" is not exists',"reference");
        }

        if( importModule.id==="namespace" )
        {
            import_keys.push( i );
            import_values.push( o.import[i].replace(/\./g,'\\') );

        }else if( !Object.prototype.hasOwnProperty.call(globals, o.import[i] ) || i !== o.import[i] )
        {
            import_keys.push( i );
            import_values.push( o.import[i].replace(/\./g,'\\') );
        }
    }

    if( o.id==="namespace" )
    {
        for( var n in o.namespaces )
        {
            var v =  o.package ? "namespace "+o.package.replace(".","\\")+";\n" : "";
            if( import_values.length > 0 )
            {
                v += "use "+import_values.join(";\n use ") + ';\n';
            }
            v += 'class '+n+' extends Namespaces\n{\n';
            v+='\tpublic function valueOf()\n\t{\n \t\treturn "'+o.namespaces[n].value+'";\n\t}';
            v += '\n}';
            o.buildCode = v;
        }
        return;
    }

    if( o.package )
    {
        str.push( "namespace "+o.package.replace(/\./g,'\\')+";" );
    }

    for ( var s in o.requirements )
    {
        if( globals.hasOwnProperty(s) && ['Boolean','Number','Array','Class','Function','document','window'].indexOf(s) < 0 )
        {
            import_values.push( 'es\\core\\'+s );
        }
    }

    if( import_values.length > 0 )
    {
        str.push( "use "+import_values.join(";\nuse ")+";" );
    }

    //私有命名空间
    for( var n in o.namespaces )
    {
        str.push('$'+n+' = new Namespaces("'+o.namespaces[n].value+'")');
    }

    //全局块的中的代码
    if(o.rootContent && o.rootContent.length > 0 )
    {
        str.push( o.rootContent.join(";\n") );
    }

    str = [ str.join("\n") ];

    //生成类的结构
    str.push( buildModuleStructure( o , config ) );

    //包外类
    var pm = makePrivateModuleClass( o , config );
    if( pm )str.push( pm );
    o.buildCode = str.join("\n");
}

var namespaceMap={};
var namespaceMapCounter = 0;
function getNamespaceUid( uri )
{
    if( namespaceMap.hasOwnProperty(uri) )
    {
        return namespaceMap[ uri ];
    }
    namespaceMap[ uri ]=namespaceBaseUint+Math.pow(2,namespaceMapCounter);
    namespaceMapCounter++;
    return namespaceMap[ uri ];
}

/**
 * 开始生成代码片段
 */
function start(config, makeModules, descriptions , project )
{
    defineModules = descriptions;
    enableBlockScope = config.blockScope==='enable';
    requirements = config.requirements;
    globals = config.globals;
    globalsConfig = config;

    for( var i in makeModules )
    {
        var moduleObject = makeModules[i];
        Utils.info('  Making '+moduleObject.filename );
        makeModule( moduleObject , moduleObject.description, config );
    }

    for(var p in descriptions)
    {
        var o = descriptions[p];
        if( !o.makeDone )
        {
            makeClassModule(o, config );
        }
    }

    var builder = require( '../php/builder.js');
    return builder(config, descriptions, requirements, namespaceMap );
}


module.exports=start;