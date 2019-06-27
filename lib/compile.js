const fs = require('fs');
const PATH = require('path');
const Ruler = require('./ruler.js');
const Utils = require('./utils.js');
var enableBlockScope=false;
var globals={};
var globalsConfig={};
var compileSyntax;

/**
 * 全局模块
 * @param name
 * @returns {{}}
 */
function getmodule(classname, classmodule)
{
    if( classmodule && classmodule.nonglobal ===true && classmodule.declared &&  classmodule.declared.hasOwnProperty(classname) && classmodule.declared[ classname ].id==="class" )
    {
        return classmodule.declared[ classname ];
    }
    if( classmodule.fullclassname === classname  )
    {
        return classmodule;
    }
    if( classmodule.import && classmodule.import.hasOwnProperty(classname) )
    {
        classname = classmodule.import[ classname ];
    }
    return Compile.getLoaclAndGlobalModuleDescription( classname );
}

/**
 * 抛出错误信息
 * @param msg
 * @param type
 */
function error(msg, type)
{
    var obj = Iteration.lastStack;
    obj = Compile.getStackItem(obj);
    if( obj && Iteration.currentModule )
    {
        var filename = Iteration.currentModule.filename;
        if( !filename ){
           filename= Iteration.currentModule.package ? Iteration.currentModule.package + "."+ Iteration.currentModule.classname : Iteration.currentModule.classname;
        }
        msg = filename+':' + obj.line + ':' + obj.cursor+"\r\n"+msg;
    }
    if( obj && obj.raw)
    {
        Utils.error( obj.raw );
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
    this.skip=false;
    this.lastStack=Iteration.lastStack;
    var started = false;
    this.seek=function(){
        if( !this.state )return false;
        this.skip=false;
        if( index===0 && !started ){
            started = true;
            stack.dispatcher({type:'(iterationStart)',content:this.content,iteration:this});
        }
        if( index >= this.data.length )
        {
            this.next = undefined;
            stack.dispatcher({type:'(iterationDone)',content:this.content,iteration:this});
            return false;
        }
        this.prev = this.current;
        this.current = this.data[index];
        this.index = index;
        if( !(this.current instanceof Ruler.STACK) )
        {
            this.lastStack = Iteration.lastStack = this.current;
        }
        index++;
        this.next = this.data[index];
        var e = {type:'(iterationSeek)',content:this.content,iteration:this};
        stack.dispatcher(e);
        if( e.stopPropagation )return false;
        if( this.current && this.current.value==='return' && this.current.id==='(keyword)' )this.checkReturnType( stack );
        if( this.next && this.next.value==='in')this.nextIn( stack );
        if( this.next && this.next.value==='of')this.nextOf( stack );
        return true;
    };
    stack.returnValues=[];
    if( enableBlockScope )this.parseBlockScope( stack );
    this.parseFunctionScope( stack );
    this.parseArgumentsOfMethodAndConstructor( stack );
    this.checkStatement( stack );
}

Iteration.lastStack=null;
Iteration.currentModule=null;
Iteration.prototype.constructor=Iteration;
Iteration.prototype.test=function( callback )
{
    var data = this.data;
    var index = this.index;
    var obj={
        "current":data[index],
        "next":function () {
            obj.current = data[ ++index ];
            return obj.current;
        },"prev":function () {
            obj.current = data[ --index ];
            return obj.current;
        },
    }
    return callback.call(obj);
}

Iteration.prototype.getIdentifierName=function()
{
    var data = this.data;
    var index = this.index;
    var items = [];
    while ( data[index] )
    {
        if( (data[index].id==="(identifier)" || data[index].value===".") && data[index].value )
        {
            if( data[index].value !== "." )
            {
                items.push(data[index].value);
            }

        }else{
            break;
        }
        index++;
    }
    return items;
}

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
    var isStatement = stack.parent().keyword() === 'statement';
    //for 中有声明变量
    if( isStatement && stack.parent().parent().parent().keyword() === "condition"  )
    {
        infor = stack.parent().parent().parent().parent().keyword() === 'for';

    }
    //for 没有声明变量
    else if( stack.parent().keyword() === 'condition' && stack.parent().parent().keyword()==='for' )
    {
        infor = true;
    }

    if( infor )
    {
        var forStack = stack.parent().parent();
        if( isStatement ){
           forStack = forStack.parent().parent(); 
        }
        var forDone=function (e) {
            var value = buildSyntax.getForeachKeyword( this.module , isIterator );
            if( value ){
                e.iteration.content.splice(0,1, value);
            }
            var endFor = buildSyntax.getForeachEnd(name, itn, this.module, isIterator );
            if( endFor ){
                e.iteration.content.push( endFor +";\n" );
            }
            var beforeFor = buildSyntax.getForeachBefore(name, itn, this.module, isIterator);
            if( beforeFor ){
                e.iteration.content.unshift( beforeFor +";" );
            }
            forStack.removeListener("(iterationDone)", forDone);
        }
        forStack.addListener("(iterationDone)", forDone);

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
        var isIterator = false;
        var _type = getDescribeType( property );
        var _value = parse( this.module, property);
        if( isReferenceType(_type))
        {
            isIterator = isIteratorInterface( getmodule( getImportClassByType(this.module,_type), this.module ) );
        }

        this.state=false;
        this.content.push({
            name:[],
            descriptor:null,
            thisArg:buildSyntax.getForIn( _value , name,  itn , this.module, isIterator),
            expression:false,
            before:[],
            after:'',
            "super":null,
            runningCheck:false,
            isglobal:false,
            type:'String'
        });

        var seek = function (e)
        {
            if( e.iteration.current.value==='{' )
            {
                var body = buildSyntax.getInternalVarForIn(name, itn, this.module, isIterator );
                if( body ) {
                    e.iteration.seek();
                    e.iteration.content.push('{\n' +body+ ';\n');
                }
                stack.scope().removeListener('(iterationSeek)',seek);
            }
        };
        stack.scope().addListener('(iterationSeek)',seek);
    }
};

Iteration.prototype.nextOf=function(stack)
{
    var infor=false;
    var isIterator = false;
    if( stack.parent().keyword() === 'statement' )
    {
        if( stack.parent().parent().parent().keyword() === "condition" )
        {
            var forStack = stack.parent().parent().parent().parent();
            infor = forStack.keyword() === 'for';
            if( infor )
            {
                var forDone=function (e) {
                    var value = buildSyntax.getForeachKeyword(this.module, isIterator );
                    if( value ){
                        e.iteration.content.splice(0,1, value);
                    }

                    var endFor = buildSyntax.getForeachEnd(name, itn, this.module, isIterator);
                    if( endFor ){
                        e.iteration.content.push( endFor +";\n" );
                    }

                    var beforeFor = buildSyntax.getForeachBefore(name, itn, this.module, isIterator);
                    if( beforeFor ){
                        e.iteration.content.unshift( beforeFor +";" );
                    }
                    forStack.removeListener("(iterationDone)", forDone);
                }
                forStack.addListener("(iterationDone)", forDone);
            }

        }
    }
    if( !infor )error('keyword the "of" can only in for iterator','syntax');
    if( stack.parent().content().length > 1 )error('Can only statement one','syntax');

    var name = this.current.value;
    var desc = stack.scope().define( name );
    if( desc ){
        desc.referenceType='String';
    }

    var funScope = stack.scope().getScopeOf();
    funScope.forIterator >>= 0;
    var itn;
    do{
        itn = '__'+(funScope.forIterator++)+'__';
    }while( funScope.define(itn) );

    this.seek();
    this.seek();
    var property = getDescriptorOfExpression(this, this.module);
    var _value = parse( this.module, property );
    var _type = getDescribeType( property );
    if( isReferenceType(_type) )
    {
        isIterator = isIteratorInterface( getmodule( getImportClassByType(this.module,_type), this.module ) );
    }

    this.state=false;
    this.content.push({
        name:[],
        descriptor:null,
        thisArg:buildSyntax.getForInOf( _value, name, itn, this.module, isIterator ),
        expression:false,
        before:[],
        after:'',
        "super":null,
        runningCheck:false,
        isglobal:false,
        type:'String'
    });
    var seek = function (e) {
        if( e.iteration.current.value==='{' )
        {
            var body = buildSyntax.getInternalVarForInOf(name, itn, this.module, isIterator );
            if( body ) {
                e.iteration.seek();
                e.iteration.content.push('{\n' +body+ ';\n');
            }
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
                error('cannot have return value', 'type');
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

Iteration.prototype.checkStatement=function(stack)
{
    var id = stack.keyword();
    if( !(id === 'var' || id==="let" || id==="const") )
    {
        return;
    }

    if( stack.name()==="@extractIntoVariable" )
    {
        do{
           this.seek();
        }while( !(this.current instanceof Ruler.STACK) && this.next);

        var valueDescriptor = null;
        var statements= [];
        var hasRest = false;
        var sit = new Iteration( this.current, this.module );
        while( sit.seek() )
        {
            if( sit.current instanceof Ruler.STACK )
            {
                if( sit.current.content().length > 0 )
                {
                    if( sit.current.content()[0].value==="..." )
                    {
                        hasRest = true;
                       
                    }else
                    {
                       statements.push( sit.current );
                    }
                }
            }
        }

        //skip =
        this.seek();
        //next stack value
        this.seek();
        var valueStack = this.current;
        var it = new Iteration( valueStack, this.module );
        var _prefix = this.module.currentMakeSyntax;
        var classmodule = this.module;
        var valueDescriptor = it.seek() && getDescriptorOfExpression( it, classmodule );
        var valueType = getDescribeType( valueDescriptor );
        var valueTypeClass = null;
        if( valueType !=="*" )
        {
            valueTypeClass = getmodule( getImportClassByType(classmodule,  valueType ) , classmodule );
        }

        var referTarget = parse(classmodule,valueDescriptor);
        var scope = stack.getScopeOf();
        var extracts = [];
        var descriptor = valueDescriptor.descriptor||valueDescriptor;
        var isrefer =  descriptor.id==="var" || descriptor.id==="let" || descriptor.id==="const";
        var isFunAccessor = descriptor.isFunAccessor;
        var isJson= descriptor.type==="JSON";
        var flag =  (descriptor.isAccessor || descriptor.expression || descriptor.isFunAccessor || isJson ) && !isrefer;
        if( flag )
        {
            var uid = null;
            do{
                uid = "__extract"+Utils.uid()+"__";
                if( scope.define(uid) ){
                    uid = null;
                }
            }while( !uid );

            var varkeyword = buildSyntax.getVarKeyword();
            if( !varkeyword ){
               uid = buildSyntax.getVarReference(uid);
               this.content.unshift( uid+" = "+referTarget+";\n" );
               referTarget = uid;
            }else{
               this.content.unshift( "var "+uid+" = "+referTarget+";\n" );
               referTarget = uid;
            } 
        }

        //不能从函数中提出属性
        if( valueDescriptor.type ==="Function" && descriptor.id==="function" ||  
            valueDescriptor.type ==="Class" && descriptor.id==="class" )
        {   
            error('extract properties of the target must is instance object', 'type');
        }

        Utils.forEach(statements, function(stack){

            var name = stack.previous(0).value;
            var defaultValue = null;
            var property = Utils.merge({}, valueDescriptor);
            var desc = scope.define(name);
            var acceptType = getType( desc.type );
            var extractExpress = null;
            if( stack.content().length >= 3 )
            {
                stack.addListener("(iterationSeek)",function(e){
                    if( stack.content().indexOf( e.iteration.current ) < 2 ){
                        e.iteration.seek();
                    }
                },500);
                defaultValue = expression(stack, classmodule);
            }
          
            property.name = property.name.slice(0);
            property.info = property.info.slice(0);
            if( flag ){
                property.name=[ referTarget ];
                property.thisArg=referTarget;
                property.expression = false;
                property.accessor = false;
                property.isFunAccessor = false;
                property.descriptor={
                    type:property.type,
                    isFunAccessor:isFunAccessor
                }
            }
            property.name.push( name );
            property.info.push( name );
            if (desc.id === 'const')
            {
                desc[_prefix+"_constValue"] = true;
            }

            if( stack.content().length > 1 )
            {
                desc.defaultValue = defaultValue;
            }
            desc.referenceTarget = referTarget;

            if( isReferenceType(acceptType) && valueTypeClass && valueTypeClass.nonglobal )
            {
                var valueDesc = getClassPropertyDescNS("", name, "proto", valueTypeClass, classmodule, it , false, property)[0];
                if( !valueDesc )
                {
                    valueDesc = {type:"*"};
                }else{
                    valueDesc = valueDesc.value ? valueDesc.value.get : valueDesc;
                }

                property.descriptor = valueDesc;
                property.fullPropDescriptor[ name ] =  valueDesc;
                extractExpress = parse(classmodule,property);

                var valueType = getDescribeType( valueDesc );
                if( !checkTypeOf(classmodule, acceptType , valueType, valueDesc , desc ) )
                {
                    //如果是数据类型可以在运行里转换
                    if( numberType.indexOf(acceptType.toLowerCase())>=0 && numberType.indexOf(valueType.toLowerCase())>=0  )
                    {
                        extractExpress = operateMethodOfCheckType( classmodule, acceptType,value, property.info );
                    }else
                    {
                        error('"' + Utils.joinProperty( property.info ) + '" type does not match. must is "' + acceptType + '"', 'type');
                    }
                }

            }else
            {
                extractExpress = parse(classmodule,property);
            }
           
            extracts.push({
                "name":name,
                "desc":scope.define(name),
                "hasValue":stack.content().length > 1,
                "value":defaultValue,
                "express":extractExpress
            });

        });
        var content = this.content;
        var extractContent = [];
        var it = this;
        Utils.forEach(extracts, function(item,index){
            var name = buildSyntax.getVarReference(item.name);
            if( item.hasValue ){
                extractContent.push( name+"="+buildSyntax.getWhenValue([item.express,item.value], it, it.module) );
            }else{
                extractContent.push( name+"="+item.express);
            }
        });
        if( _prefix ==="php" ){
           content.push( extractContent.join(";\n") );
        }else{
           content.push( extractContent.join(",\n") );
        }
    }
}

function getDefinedClassName(classmodule, type)
{
    if( classmodule.type === type || classmodule.classname===type )return type;
    if( classmodule.import && classmodule.import[type])
    {
        var objClass = getmodule( classmodule.import[type] , classmodule);
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
    if( getmodule(type, classmodule) )
    {
        return type;
    }

    return globals[type] ? type : null;
}

function getDefinedShortClassName(classmodule, className)
{
    if( classmodule.fullclassname === className ){
        return classmodule.classname;
    }
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
        //函数域的变量声明
        stack.__replace__=[];

        //运行时检查实例对象是否属于本类
        // content.push( 'if( !(this instanceof '+stack.name()+') )throw new SyntaxError("Please use the new operation to build instances.");\n' );
        if( stack.name() === this.module.classname && !stack.static() && stack.parent().keyword() === 'class')
        {
            var _done = function (e)
            {
                var index = e.iteration.content.indexOf('{');
                if( e.iteration.content[index+1] ==="\n" )index++;
                //预留私有属性占位
                e.iteration.content.splice(++index, 0, '####{props}####\n');
                //如果没有调用超类，则调用超类的构造函数
                if (e.iteration.module.inherit && !stack.called)
                {
                    var inheritClass = getmodule( getImportClassByType(e.iteration.module, e.iteration.module.inherit ) , e.iteration.module );
                    var superEvent = {type:"(superBefore)"}
                    if( stack.parent().dispatcher(superEvent) !== false )
                    {
                        e.iteration.content.splice(index + 1, 0, buildSyntax.superClass(e.iteration.module, inheritClass) + ';\n');
                    }
                }
                stack.removeListener("(iterationDone)", _done);
            }
            stack.addListener('(iterationDone)', _done, -500);
        }

        //为闭包函数添加变量引用
        if( compileSyntax==="php" )
        {
            if (stack.parent().keyword() !== 'class')
            {
                var refVarItem = function(e)
                {
                    var fnScope = stack.getScopeOf();
                    var usingVar = fnScope.__usingVar__ || (fnScope.__usingVar__=[]);
                    if( usingVar.length > 0 )
                    {
                        var index = e.iteration.content.indexOf('{');
                        e.iteration.content.splice(index, 0, "use(&$" + usingVar.join(",&$") + ")");
                    }
                    stack.removeListener('(iterationDone)', refVarItem);
                }
                stack.addListener('(iterationDone)', refVarItem , -500);
            }
        }

    }

    if( stack.keyword() ==='statement' && stack.parent().keyword() === 'function' )
    {
        var items = stack.parent().param();
        var scope = stack.parent().scope();
        var express = [];
        var rest = items.indexOf('...');
        if (rest >= 0) {
            express.unshift( buildSyntax.restArguments( items.slice(-1), rest ) +';\n');
            items = items.slice(0, rest);
        }

        var paramTypeMap = {};
        for (var i in items)
        {
            var desc = scope.define( items[i] );
            desc.type = getType(desc.type);
            var _def;
            var value = null;
            var shortName;
            var typeClass;
            if ( desc.type !== '*' /*&& desc.type !=='Object'*/ )
            {
                typeClass = getmodule(getImportClassByType(this.module, desc.type), this.module);
                shortName = desc.type;
                if( typeClass && typeClass.classname ) {
                    shortName = getDefinedShortClassName(this.module, typeClass.classname)
                }
                if (typeClass.nonglobal === true && typeClass.privilege !== 'public' && typeClass.package !== this.module.package) {
                    error('"' + desc.type + '" is not exists', 'reference');
                }
                setClassModuleUsed(typeClass, this.module);
            }

            var nullable = false;
            if (desc.value instanceof Ruler.STACK)
            {
                var value = toString(desc.value, this.module);
                _def = buildSyntax.getMethodParamDefualtValue( globalsConfig,  items[i], value, shortName );
                nullable = !!value.match(/null$/i);
                if( _def ) {
                    value = null;
                    express.unshift(_def+'\n');
                }
            }

            if ( desc.type !== '*' )
            {
                var _con = buildSyntax.getCheckMethodParamTypeValue( globalsConfig,
                    buildSyntax.getVarReference( items[i] ),
                    shortName, nullable, typeClass,
                    this.module.filename||this.module.fullclassname,
                    Iteration.lastStack.line );
                if( _con ) {
                    express.push(_con);
                }
            }
            paramTypeMap[ items[i] ]={type:shortName,value:value, check:!!_def, nullable:nullable,typeModuleClass:typeClass };
        }

        this.content.push( buildSyntax.defineMethodParameter( globalsConfig, paramTypeMap , this.module ) );

        var _call = function (e)
        {
            if(express.length>0)
            {
                var index =  e.iteration.content.indexOf('{');
                if( e.iteration.content[index+1] ==="\n" )index++;
                e.iteration.content.splice( ++index, 0, express.join('') );
            }
            stack.parent().removeListener('(iterationDone)',_call);
        }
        stack.parent().addListener('(iterationDone)',_call,-400);
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
        var _call = function (e)
        {
            hasBlockScope=true;
            if( blockScopeItems.indexOf(e.name) < 0 && this !== e.scope )
            {
                blockScopeItems.push( e.name );
            }
        };
        stack.addListener('(blockScope)',_call);

        var _callDone = function (e)
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
            stack.removeListener('(iterationDone)',_callDone);
        };

        stack.addListener('(iterationDone)',_callDone);
    }
};

/**
 * 将var变量提到函数中
 * @param stack
 */
Iteration.prototype.parseFunctionScope=function( stack )
{
    //一个匿名函数,对this 对象的引用
    if( stack.keyword()==="function" && stack.parent().getScopeOf().keyword() !=="class" 
    && stack.parent().parent() && stack.parent().parent().keyword() === "expression")
    {
        var expression_stack =  stack.parent().parent();
        var _content = expression_stack.content();
        if( _content[2] && _content[2].id==="(identifier)" )
        {
            var fun_method = _content[2].value;
            var isbind = fun_method==="call" || fun_method==="bind" || fun_method==="apply";
            if( isbind )
            {
                expression_stack = _content[3];
                if( expression_stack instanceof Ruler.STACK )
                {
                    _content = expression_stack.content();
                    var ref_this = _content[1]
                    if( ref_this )
                    {
                        if( ref_this instanceof Ruler.STACK )
                        {
                            ref_this =  toString(ref_this, this.module).replace(/^\(|\)$/g,"");
                            if( this.module.currentMakeSyntax ==="php" )
                            {
                                ref_this = ref_this.replace(/^\$/,"");
                            }
                        }else{
                            ref_this = ref_this.value;
                        }

                        if( ref_this )
                        {
                            ref_this = expression_stack.parent().getScopeOf().define( ref_this );
                            if( ref_this )
                            {
                               stack.getScopeOf().define("this", ref_this);
                            }
                        }
                    }
                }
            }
        }
    }

    var self = this;
    //声明的变量不能与当前类同名。
    if( stack.keyword() === 'expression' && stack.parent().keyword()==='statement' )
    {
        var _callback = function (e)
        {
            if ( e.iteration.current.value === e.iteration.module.classname )
            {
                var desc = e.iteration.stack.getScopeOf().define( e.iteration.current.value );
                if(desc && desc.id !== 'class' && desc.id !== 'namespace' )
                {
                    error( '"'+e.iteration.current.value+'" is self class. do not declaration', 'type' );
                }
            }
        }
        stack.addListener('(iterationSeek)',_callback);
        stack.addListener('(iterationDone)',function (e) {
            stack.removeListener("(iterationDone)");
            stack.removeListener("(iterationSeek)",_callback);
        },-1000);
    }

    //替换一些关键字
    if( stack.keyword() ==='var' || stack.keyword() ==='const' || stack.keyword() ==='let')
    {
        this.seek();
        //跳过当前没有赋值的变量表达式。如果是php语法
        //条件表达式除外
        if( this.module.currentMakeSyntax ==="php" && stack.parent().keyword() !=="condition" )
        {
            var _value = stack.scope().define( stack.name() );
            if( _value && !_value.value )
            {
                this.seek();
                var skipFn = function (e) {
                    if( e.iteration.current.value===";" )
                    {
                        e.iteration.seek();
                    }
                    stack.scope().removeListener("(iterationSeek)",skipFn);
                }
                stack.scope().addListener("(iterationSeek)",skipFn);
            }
        }

        var _event = {"type":"(declarVariableKeyword)","iteration":this,"scope":stack.scope()};
        if( !_event.scope.dispatcher(_event) )return;
        if( stack.keyword() !== 'var' || _event.scope.keyword()==='function' || _event.scope.keyword()==='rootblock' )
        {
            var varkey = buildSyntax.getVarKeyword();
            if( varkey ){
               this.content.push( varkey );
            }
        }
    }
    //如果var变量不在函数域中则添加到函数域中
    else if( stack.keyword() === 'statement' && stack.parent().keyword() === 'var' && stack.parent().scope().keyword() !== 'function' )
    {
        if( !stack.scope().dispatcher({"type":"(declarVariableToFunScope)","iteration":this}) )return;
        var funScope =  stack.scope().getScopeOf();
        var exists= []; //funScope.__replace__ || (funScope.__replace__=[]);
        var items=[];
        var seek = function (e)
        {
            //is expression
            if( e.iteration.current instanceof Ruler.STACK )
            {
                //需要声明在函数内的变量名
                var name = e.iteration.current.content()[0].value;
                if( exists.indexOf(name) < 0 )
                {
                    items.push( name );
                    exists.push( name );
                }

            }else if( e.iteration.current.value === ',' )
            {
                if( e.iteration.next instanceof Ruler.STACK )
                {
                    //跳过没有定义默认值的声明
                    if (e.iteration.next.content().length === 1)
                    {
                        e.iteration.seek();
                        e.iteration.seek();
                        e.iteration.skip = true;
                    }
                }
            }

        };
        var done = function (e)
        {
            if( items.length > 0 )
            {
                var defaultVar = buildSyntax.declarationDefaultVar(items, self);
                if( defaultVar )
                {
                    var startIndex = e.content.indexOf('{');
                    if (e.content[startIndex + 1] === "\n") {
                        startIndex++;
                    }
                    e.content.splice(++startIndex, 0, defaultVar+';\n');
                }
            }
            this.removeListener('(iterationSeek)',seek );
            this.scope().getScopeOf().removeListener('(iterationDone)', done );
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
function checkCallParameter(it, desc, property , isNew )
{
    var parameters = [];
    var parameterRaw = [];
    var index = 0 ;
    var param = desc ? ( desc.nonglobal ? desc.paramType : desc.param) : null;
    var acceptType;
    var raw = [];
    var origin = desc;
    var owner = null;

    //获取类的构造函数的参数
    if( desc && desc.id==="class" && desc.fullclassname )
    {
        var _desc = getmodule( desc.fullclassname, it.module );
        if( _desc.nonglobal===true && _desc.hasOwnProperty("constructor") && _desc.constructor.paramType )
        {
            param = _desc.constructor.paramType;
            desc = _desc.constructor;
            owner = _desc.fullclassname;
        }
    }

    //从函数的 scope 中获取参数类型
    if( !param && desc && desc.nonglobal && desc.id==='function' && !desc.paramType  && desc.reference instanceof Ruler.STACK )
    {
        param = desc.reference.param();
        desc.paramType=[];
        for(var i in param )
        {
            if( param[i] ==='...')
            {
                desc.paramType.push('...');

            }else
            {
                var obj = desc.reference.define( param[i] );
                obj.type = getType(obj.type);
                desc.paramType.push( obj.type );
            }
        }
        param = desc.paramType;
    }

    var stackCurrent = it.current;
    var hasRest = 0;
    if( it.current.content().length > 0 )
    {
        it = new Iteration(it.current, it.module);
        while (it.seek())
        {
            if (it.current instanceof Ruler.STACK)
            {
                acceptType = param ? param[index] : "*";
                if( param )
                {
                    if(  param[index] ==='...' )
                    {
                        hasRest = index+1;
                    }

                    if( hasRest > 0 )
                    {
                        acceptType = param[ hasRest ]||"*";
                    }
                }

                if( it.current.keyword()==="function" && desc )
                {
                    var nextIndex = 0
                    if( desc.owner==="Array.proto.forEach" )
                    {
                        nextIndex = 3;

                    }else if( desc.owner==="Object.forEach" )
                    {
                        nextIndex = 5;
                    }else if( desc.owner==="EventDispatcher.proto.addEventListener")
                    {
                        nextIndex = 9;
                    }

                    if( nextIndex>0 )
                    {
                        var thisRef = it.stack.content()[ nextIndex ];
                        if( thisRef instanceof Ruler.STACK )
                        {
                            var refScope = thisRef.getScopeOf();
                            thisRef = toString( thisRef,  it.module).replace(/^\(|\)$/g,"");
                            if( it.module.currentMakeSyntax ==="php" )
                            {
                                thisRef = thisRef.replace(/^\$/,"");
                            }
                            thisRef = refScope.define( thisRef );
                            if( thisRef )
                            {
                                it.current.getScopeOf().define("this", thisRef);
                            }
                        }
                    }
                }

                //(function)();
                if( it.current.keyword() ==="expression" && it.prev instanceof Ruler.STACK && it.prev.keyword() ==="expression")
                {
                    var pa = parameters.pop();
                    parameters.push( buildSyntax.getClosureFunctionCall( pa, toString(it.current, it.module , acceptType, true ) ) );

                }else
                {
                    parameters.push( toString(it.current, it.module , acceptType, true ) );
                }
                parameterRaw.push( lastProperty.info.join(".") );
                index++;

            } else if( it.current && it.current.value !== ',')
            {
                error('Invalid identifier token', 'syntax');
            }
        }
    }

    if( desc && desc.__stack__ )
    {
        param =  desc && desc.__stack__ && desc.__stack__.param();
    }

    if( param && parameters.length < param.length )
    {
        var len = param.length;
        var i = 0;
        for(;i<len;i++ )
        {
            if( param[i]==='...')
            {
                break;
            }

            if( parameters[i] === undefined )
            {
                //有指定默认值的参数可以不传
                if( desc.__stack__ instanceof Ruler.STACK )
                {
                   // var __param = desc.__stack__.param();
                    var obj = desc.__stack__.getScopeOf().define( param[i]  );
                    //如果有指定默认值
                    if( obj && obj.value instanceof Ruler.STACK )
                    {
                       // var defaultValue = toString(obj.value, it.module);
                        var stackExpress = getStackExpression( obj.value );
                        //如当前参数的值指定为自动生成实例ID则把当前生成的id赋值到参数中
                        if( stackExpress.autoUidInstanceValue )
                        {
                            stackCurrent.autoUidInstanceValue || (stackCurrent.autoUidInstanceValue=stackExpress.autoUidInstanceValue);
                            parameters.push( stackCurrent.autoUidInstanceValue );
                        }
                        continue;
                    }
                    //var type = obj.type;
                    /*if( viewMetaType && type==="es.core.View" )
                    {
                        var viewModule = getmodule(viewMetaType.param.source);
                        var viewClass = getDefinedShortClassName(it.module, viewMetaType.param.source );
                        setClassModuleUsed( viewModule, it.module );
                        parameters.push( buildSyntax.newInstanceClassOf(viewClass, viewModule,  buildSyntax.getVarReference( "this" ) ) );
                        continue;
                    }*/
                }

                //是否允许不传
                if( !desc.nonglobal && ( desc.isFunAccessor===true || ( desc.required && desc.required[i]===false ) ) )
                {
                    continue;
                }
                if( isNew ) {
                    error('Missing parameter the "new ' + property.info.join(".") + '('+parameterRaw.join(",")+')"', 'type');
                }else{
                    error('Missing parameter the "' + property.info.join(".") + '('+parameterRaw.join(",")+')"', 'type');
                }
            }
        }
    }
    property.raw = raw.join(',');
    return parameters;
}

//判断模块是否实现了迭代器接口
function isIteratorInterface( module )
{
    return !!Compile.Maker.checkInstanceOf(module, "es.interfaces.IListIterator", true);
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
    var fullPropDescriptor = {};
    var hasSyntaxRemove = property ? property.hasSyntaxRemove : false;
    if( property && !hasSyntaxRemove ){
        desc = property.descriptor;
        fullPropDescriptor = property.fullPropDescriptor;
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
        "descriptor":desc,
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
        "ownerScope":classmodule.fullclassname,
        "fullPropDescriptor":fullPropDescriptor,
        "hasSyntaxRemove":hasSyntaxRemove,
        "isWrapReference":false
    };
}

function checkReferenceClassNameInClassModule( classModule , fullclassname )
{
    if( classModule.fullclassname === fullclassname || classModule.classname===fullclassname)
    {
        return true;
    }
    if( classModule && classModule.import ){
         if( classModule.import.hasOwnProperty(fullclassname) )
         {
             return true;
         }
         for( var p in classModule.import )
         {
             if( classModule.import[p] === fullclassname )
             {
                 return true;
             }
         }
    }
    return globals.hasOwnProperty(fullclassname);
}

/**
 * 获取类的全名引用
 * @param it
 * @returns {*}
 */
function getClassTypeByDefinedFullName(it, targetProps )
{
    if( it.current.type==='(identifier)' )
    {
        var classType=[];
        do{
            classType.push( it.current.value );
            if( targetProps ){
                targetProps.push( it.current.value );
            }
        }while ( it.next && (it.next.value==='.' || it.next.type==='(identifier)') && it.seek() );
        classType = classType.length > 0 ? classType.join('') : null;
        if( classType && !checkReferenceClassNameInClassModule( it.module , classType ) )
        {
            try
            {
                var loadModule = getmodule( classType,  it.module );
                if( !loadModule )
                {
                    loadModule = Compile.loadModuleDescription(globalsConfig.syntax, classType, globalsConfig, classType, null, false, it.module);
                    if (!loadModule) {
                        error(classType + " is not found.", "reference");
                    }
                    makeModule(globalsConfig.syntax, Compile.makeModuleByName(classType), loadModule, globalsConfig);
                }

                if( !it.module.import[loadModule.classname] )
                {
                    it.module.import[loadModule.classname] = classType;
                }else{
                    it.module.import[classType] = classType;
                }
                setClassModuleUsed( loadModule , it.module );

            }catch (e)
            {
                error('"' + classType + '" is not exists', 'reference');
                //error( e.message +"\n at "+it.module.fullclassname, "reference");
                return null;
            }
        }
        return classType;
    }
    return null;
}

/**
 * 判断当前的模块描述与前编译的语法是否一致
 * @param desc
 * @param syntax
 * @returns {boolean}
 */
function isConformRunPlatform(desc,syntax)
{
    if( !desc )return true;
    var descriptor =  desc;
    if( descriptor.hasSyntaxRemove )
    {
        return false;
    }

    //如果是一个变量并有赋值
    if( !descriptor.defineMetaTypeList )
    {
        var lastValueDesc = lastValueDescriptorBySyntax(syntax, descriptor);
        if( lastValueDesc ){
            descriptor = lastValueDesc;
        }
        if( descriptor.hasSyntaxRemove )
        {
            return false;
        }
        if( !descriptor.defineMetaTypeList && descriptor.descriptor )
        {
           descriptor = descriptor.descriptor;
        }
    }

    if( descriptor.hasSyntaxRemove )
    {
        return false;
    }

    //没有描述符和元类型对象
    if( !descriptor || !descriptor.defineMetaTypeList )
    {
        return true;
    }

    //元类型对象列表
    var defineMetaTypeList = descriptor.defineMetaTypeList;

    //没有明确指定运行平台和语法
    if( !(defineMetaTypeList.RunPlatform || defineMetaTypeList.Syntax) )
    {
        return true;
    }

    //指定运行平台
    if( defineMetaTypeList.RunPlatform )
    {
        var runPlatform = defineMetaTypeList.RunPlatform.param.value || defineMetaTypeList.RunPlatform.param.source;
        if( runPlatform==="client" && syntax ==="javascript" )
        {
            return true;
        }
    }

    //指定语法
    if( defineMetaTypeList.Syntax instanceof Array )
    {
        var results = defineMetaTypeList.Syntax.filter(function (a) {
            return a.syntaxs.indexOf(syntax)>=0;
        });
        if( results.length > 0  )
        {
            return true;
        }
    }
    return false;
}

/**
 * 判断当前的模块是否需要客户端的支持
 * @param desc
 * @param syntax
 * @param excludeClientInRunPlatform 如果为true 排序已经指明运行在客户的模块
 * @returns {boolean}
 */
function isClientSupportOf(descriptor, syntax , excludeClientInRunPlatform )
{
    if( !descriptor || !descriptor.defineMetaTypeList )
    {
       return true;
    }

    if( syntax ==="javascript" )
    {
        return true;
    }

    //元类型对象列表
    var defineMetaTypeList = descriptor.defineMetaTypeList;

    //没有明确指定运行平台和语法
    if( !(defineMetaTypeList.RunPlatform || defineMetaTypeList.Syntax) )
    {
        return true;
    }

    //指定运行平台
    if( defineMetaTypeList.RunPlatform )
    {
        var runPlatform = defineMetaTypeList.RunPlatform.param.value || defineMetaTypeList.RunPlatform.param.source;
        if( runPlatform==="client" )
        {
            return !excludeClientInRunPlatform;
        }
    }

    if( defineMetaTypeList.Syntax instanceof Array && defineMetaTypeList.Syntax.length > 0 )
    {
        var results = defineMetaTypeList.Syntax.filter(function (a)
        {
            return a.syntaxs.indexOf( "javascript" ) >= 0;
        });
        return results.length > 0 && !excludeClientInRunPlatform;
    }
    return true;
}

/**
 * 判断当前的表达式是否标记为删除
 * @param desc
 * @param syntax
 * @returns {boolean}
 */
function isRemoveExpression(desc,syntax)
{
    if( !desc )return false;
    var descriptor =  desc;
    if( descriptor.hasRemoveExpression )
    {
        return true;
    }

    //如果是一个变量并有赋值
    if( !descriptor.defineMetaTypeList )
    {
        var lastValueDesc = lastValueDescriptorBySyntax(syntax, descriptor);
        if( lastValueDesc ){
            descriptor = lastValueDesc;
        }
        if( descriptor.hasRemoveExpression )
        {
            return false;
        }
        if( !descriptor.defineMetaTypeList && descriptor.descriptor )
        {
           descriptor = descriptor.descriptor;
        }
    }

    if( descriptor.hasRemoveExpression )
    {
        return true;
    }

    //没有描述符和元类型对象
    if( !descriptor || !descriptor.defineMetaTypeList )
    {
        return false;
    }

    //元类型对象列表
    var defineMetaTypeList = descriptor.defineMetaTypeList;
    if( defineMetaTypeList.Remove )
    {
        var whenSyntax = defineMetaTypeList.Remove.param.syntaxs;
        var expect = defineMetaTypeList.Remove.param.expect;
        return (whenSyntax.indexOf( syntax ) >= 0) === expect;
    }
    return false;
}

/**
 * 判断指定的作用域是否在运行策略作用域中
 * @param scope
 * @returns {boolean}
 */
function isInScopePolicyOfRunPolicy( scope , syntax)
{
    do{
        scope = scope.scope();
        if( scope["compile_policy_"+syntax] ===true )
        {
            return true;
        }
    }while ( (scope = scope.parent()) && scope.keyword() !== "class" );
    return false;
}

//只能在客户端运行的类
const canOnlyClientRun=["MouseEvent"];


//捕获指定运行在客户端或者语法的代码
//如果在成员属性或者成员方法中设置了元类型(RunPlatform,Syntax) 才会对当前的代码进行筛选
//筛选的条件必须要与当前编译器指定的语法一致才会保留反之将会删除
function captureRunPlatformMetatype(it, desc,property, classmodule )
{
    if( !desc )return false;

    if( desc.id==="class" && !desc.proto )
    {
        desc = getmodule( getImportClassByType( classmodule, getType( desc.type ) ) , classmodule );
    }

    var conform = true;
    var isRemove = isRemoveExpression(desc,classmodule.currentMakeSyntax);
    var flag = false;
    if( desc.type && canOnlyClientRun.indexOf( desc.type )>=0  && classmodule.currentMakeSyntax !== "javascript" )
    {
        conform = false;
        flag = true;
    }else
    {
        conform = isConformRunPlatform(desc, classmodule.currentMakeSyntax );
    }

    if( isRemove )
    {
        property.hasSyntaxRemove = true;
    }
    if( !conform )
    {
        property.hasSyntaxRemove = true;
    }

    if( conform && !isRemove )
    {
        return false;
    }

    //当前表达式对象
    var expressionStack = it.stack;
    var pid = expressionStack.parent().keyword();
    var scope = expressionStack.scope();

    //如果父作用域已经加入了运行策略
    if( isInScopePolicyOfRunPolicy(scope, classmodule.currentMakeSyntax) )
    {
        return;
    }

    if( flag && pid==="object" )
    {
        expressionStack = expressionStack.parent().parent();
    }

    if( !flag && (pid === "condition" || ( pid==="object" && scope["compile_policy_"+classmodule.currentMakeSyntax] !==true ) ) )
    {
        var msg = "\n at "+classmodule.fullclassname+" "+Iteration.lastStack.line+":"+Iteration.lastStack.cursor;
        throw new ReferenceError( '"'+property.info.join(".") + '" has been removed. in compiling the "'+classmodule.currentMakeSyntax+'" syntax.'+ msg );
    }

    while ( expressionStack.keyword() !=="expression" && expressionStack.type()!=="object" && expressionStack.parent() )
    {
        var parent = expressionStack.parent();
        var id = parent.keyword();
        if( id === "function" ){
            break;
        }
        expressionStack = parent;
    }

    //如果是块级域或者函数域才需要清空表达式
    var sid = expressionStack.scope().keyword();
    var pid = expressionStack.parent().keyword();
    if( pid === "condition" || ["function","if","for","else","while","switch","rootblock"].indexOf( sid ) < 0 )
    {
        return true;
    }

    //表达式结束后拦截
    var intercept = function(e)
    {
       expressionStack.removeListener("(expressionCompleted)",intercept);
       e.stopPropagation = true;
       e.content = "";
       var __replace = function (e) {
           expressionStack.scope().removeListener("(iterationSeek)", __replace);
           if( pid ==="statement" )
           {
               var last = e.iteration.content.pop();
               if( Utils.trim(last) !== "var" ){
                   e.iteration.content.push(last);
               }
           }

           if (e.iteration.current && e.iteration.current.value === ";") {
               e.iteration.seek();
           }
       }
       expressionStack.scope().addListener("(iterationSeek)", __replace);
    }
    expressionStack.removeListener("(expressionCompleted)");
    expressionStack.addListener("(expressionCompleted)", intercept);
    return true;
}

//指定编译器需要的代码块内容
//目前只支持，RunPlatform， Syntax
//如果 RunPlatform，Syntax 没有在 when 域中则返回判断后的布尔值
function compilePolicy(it,desc,classmodule)
{
    var method = it.current.value;
    if( !(method==="RunPlatform" || method==="Syntax") )
    {
        return false;
    }
    //跳到下一个标识符
    it.seek();
    //Stack of the RunPlatform or Syntax
    var express =  it.current;
    var option = null;
    var condition  = null;
    it.seek();
    try{
        //var express = Syntax(javascript), if express Syntax(javascript);
        if( express.keyword() !=="object" )throw new SyntaxError("Invalid directive");
        express = express.content();
        if( !express[1].content()[0]  )throw new SyntaxError("Missing expression");
        condition = express[1].content()[0].value.replace(/^[\'\"]|[\'\"]$/g,'').toLowerCase();
        if( express[2] && express[2].value==="," )
        {
            option = express[3].content()[0].value.replace(/^[\'\"]|[\'\"]$/g,'').toLowerCase();
        }
    }catch (e){
        throw new SyntaxError("Invalid directive the "+method );
    }

    if( method==="RunPlatform" && !(condition==="server" || condition==="client") )
    {
        throw new SyntaxError("The RunPlatform optional expression is server or client");
    }

    if( method==="Syntax" && condition !=="origin" && globalsConfig.syntax_supported[ condition ] !== true )
    {
        var keys = utils.toKeys( globalsConfig.syntax_supported );
        throw new SyntaxError("The Syntax optional expression is "+keys.join(" or ") );
    }

    var syntax = classmodule.currentMakeSyntax;
    var isClient = syntax === "javascript";
    var scope = it.stack.scope();
    var result =  false;
    if( method==="RunPlatform" ){
        result = condition ==="client" && isClient || condition ==="server" && !isClient;
    }else if( method==="Syntax" )
    {
        if( condition ==="origin" )
        {
            condition = globalsConfig.originMakeSyntax;
        }
        if( option )
        {
            syntax = option;
        }
        result = condition === syntax;
    }

    if( scope.keyword() !== "when" )
    {
        desc.type = "Boolean";
        desc.thisArg = result.toString();
        return true;
    }

    //在当前作用域中设置已经加入了编译策略
    if( scope.keyword() === "when"  )
    {
        scope["compile_policy_" + syntax] = true;
    }

    var parentScope = scope.parent();
    var content = parentScope.content();
    var indexAt = content.indexOf( scope );
    var hasElse = content[indexAt+1] instanceof Ruler.STACK && content[indexAt+1].keyword().toLowerCase() === "then";
    var done = function (e) {
        var id = this.keyword().toLowerCase();
        var startLen = this.endIdentifer ? 4 : 5;
        if( id==="then" ){
            startLen = this.endIdentifer ? 2 : 3;
        }
        //将开始的if else 弹出
        if( (id==="when" && result) || (id==="then" && !result) )
        {
            e.iteration.content.splice(0, startLen);
            if (!this.endIdentifer && e.iteration.content.pop() === "\n") {
                e.iteration.content.pop();
            }

        }else{
            e.iteration.content.splice(0,  e.iteration.content.length);
        }

        if( this.endIdentifer )
        {
            var seek = function (e) {
                if(e.iteration.current.value===";")
                {
                    e.iteration.seek();
                    this.removeListener("(iterationSeek)",seek);
                }
            }
            this.parent().addListener("(iterationSeek)",seek);
        }
        this.removeListener("(iterationDone)", done );
        this.removeListener("(declarVariableToFunScope)");
    }
    scope.addListener("(iterationDone)", done );

    //如果表达式不为真，则停止在块级范围中声明变量
     scope.addListener("(declarVariableToFunScope)", function (e) {
        if( !result || this.parent().scope().keyword() === "function") {
            e.stopPropagation = true;
        }
    }).addListener("(declarVariableKeyword)",function (e) {
         e.scope = this.parent().scope();
     });

    //绑定在else块级中的处理函数
    if( hasElse )
    {
        if( !(content[indexAt+2] instanceof Ruler.STACK) || content[indexAt+2].keyword().toLowerCase() !=="when" )
        {
            content[indexAt + 1].addListener("(iterationDone)", done);
            //如果表达式为真，则停止在块级范围中声明变量
            content[indexAt + 1].addListener("(declarVariableToFunScope)", function (e) {
                if (result || this.parent().scope().keyword() === "function") {
                    e.stopPropagation = true;
                }
            }).addListener("(declarVariableKeyword)", function (e) {
                e.scope = this.parent().scope();
            });

        }else{
            //拦截 else
            var _seek = function (e) {
                if( e.iteration.current === content[indexAt + 1] )
                {
                    e.iteration.seek();
                    parentScope.removeListener("(iterationSeek)",_seek);
                }
            }
            parentScope.addListener("(iterationSeek)",_seek);
        }
    }
    return true;
}

//指定编译器需要的代码块内容
//目前只支持，Generic,UIDInstance,ServiceProvider,CommandSwitch
function compileDirective(it,desc,classmodule)
{
    var method = it.current.value;
    if( !(method==="Generic" || method==="UIDInstance" || method==="ServiceProvider") )
    {
        return false;
    }

    //跳到下一个标识符
    it.seek();
    var express =  it.current;
    it.seek();

    if( express.keyword() !=="object" )
    {
        throw new SyntaxError("Invalid directive of the "+method);
    }

    express = express.content();
    switch ( method ){
        case "Generic" :
            if( express.length > 3  )
            {
                throw new SyntaxError("Generic directive can only have one expression");
            }
            if( express.length != 3 || !express[1].content()[0]  )
            {
                throw new SyntaxError("Missing expression in the Generic directive");
            }
            desc.thisArg = toString( express[1] , classmodule );
            desc.notCheckType = true;
            break;
        case "UIDInstance" :
            desc.type="String";
            var prefix = express.length >= 3 ? toString( express[1] , classmodule ) : null;
            var stackExpress = getStackExpression( it.current );
            var uid = Utils.uid();
            var uidInstance = '"'+uid+'"';
            if( prefix ){
                var newPrefix = prefix.replace(/^([\'\"])([^\1]*)\1$/g,"\$2");
                if( newPrefix !== prefix )
                {
                    uidInstance = '"'+newPrefix+"-"+uid+'"';
                }else
                {
                    uidInstance = prefix+buildSyntax.getJointOperator("+",{type:"String"},{type:"String"})+'"-'+uid+'"';
                }
            }

            if( stackExpress.keyword()==="expression" )
            {
                stackExpress.autoUidInstanceValue = uidInstance;
            }
            desc.thisArg=uidInstance;
        break;
        case "ServiceProvider" :
            desc.type="String";
            if( !express.ServiceProviderValue )
            {
                var param = [];
                for (var i in express) {
                    if (express[i] instanceof Ruler.STACK) {
                        var _stack = express[i].content()[0];
                        if (_stack && (_stack.type === "(string)" || _stack.type === "(number)") ) {
                            var _value = _stack.value.replace(/^[\'\"]+|[\'\"]$/g, '');
                            param.push(Utils.trim(_value));
                            if ((i == 5 && ['get', 'post', 'put', 'delete'].indexOf(_value.toLowerCase()) < 0)) {
                                throw new SyntaxError("Invalid argument is in the third. value optional for '[get,post,put,delete]'. in the ServiceProvider directive");
                            }

                        } else {
                            throw new SyntaxError("Invalid argument can only is string and cannot is reference. in the ServiceProvider directive");
                        }
                    }
                }

                if (param.length < 2) {
                    throw new SyntaxError("Missing param in the ServiceProvider directive");
                }

                if (!param[1]) {
                    throw new SyntaxError("The service provider is not specified. in the ServiceProvider directive");
                }

                var provider = param[1].split("@");
                if (provider.length < 2) {
                    throw new SyntaxError("The service provider method name is not specified. in the ServiceProvider directive");
                }

                param[0] = param[0].replace(/^\/|\/$/g,"");
                if( !param[0].match(/^(https?\:\/\/|tcp:\/\/|udp:\/\/)/i) )
                {
                    param[0] ="/"+ param[0];
                }

                //去掉参数类型
                var bindname =  param[0].replace(/{([a-z]+[\w]+)(\s*\:\s*[a-z]+[\w]+)?}/ig,"{$1}");
                var args =  param.slice(3);
                var index = 0;

                //转换成请求的地址
                express.ServiceProviderValue =  bindname.replace(/\{([a-z]+[\w]+)\}/g,function (a,b) {
                    if( typeof args[index] === "undefined" ){
                        throw new ReferenceError("No value is specified for the binding parameter {"+b+"}");
                    }
                    return args[index++];
                });
                desc.thisArg='"'+ express.ServiceProviderValue+'"';

                var serviceProviderList = classmodule.serviceProviderList || (classmodule.serviceProviderList = {});
                var key =param[0]+'@'+param[1];
                var method = (param[2] || 'get').toLowerCase();

                //一个新的服务提供者
                if ( !serviceProviderList[key] )
                {
                    //加入到全局唯一哈希值中
                    if( Compile.global_route_unique_hash[ express.ServiceProviderValue ] && 
                        Compile.global_route_unique_hash[ express.ServiceProviderValue ] !== key )
                    {
                        throw TypeError( 'The "'+express.ServiceProviderValue+'" service name already bound to '+Compile.global_route_unique_hash[ express.ServiceProviderValue ] );
                    }
                    Compile.global_route_unique_hash[ express.ServiceProviderValue ] = key;

                    //如果指定的服务提供者已经存在就验证方法
                    if( Compile.isClassFileExists( provider[0], globalsConfig ) )
                    {
                        var description = Compile.loadModuleDescription(globalsConfig.service_provider_syntax,provider[0],globalsConfig,null,null,true,classmodule);
                        var desc = getClassPropertyDescNS("", provider[1], "proto", description, description, it , false, {} );
                        if( desc.length===0 )
                        {
                            throw new ReferenceError( '"'+provider[0]+"@"+provider[1]+"\" is not exists.");
                        }
                    }

                    serviceProviderList[key] = {
                        "name": param[0],
                        "bind":bindname,
                        "provider": provider[0],
                        "action": provider[1],
                        "method": method
                    }

                }else if( method != serviceProviderList[key].method )
                {
                    //throw new ReferenceError("The request method specified as '"+param[0]+"' service provider is inconsistent.");
                    throw new ReferenceError( "The '"+param[0]+"' service provider is already bound to the '"+serviceProviderList[key].method+"' request method");
                }

            }else {
                desc.thisArg='"'+express.ServiceProviderValue+'"';
            }

            break;
    }
    return true;
}


/**
 * 获取代码表达式
 * @param stack
 * @returns {*}
 */
function getStackExpression( stack )
{
    while ( stack.keyword() !=="expression" && stack.keyword() !=="class" && ( stack=stack.parent() ) );
    return stack;
}

var requirements={};
var lastProperty = null;
var constant_property = ["__CLASS__","__LINE__","__FILE__","__SWITCH__"];

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
    property.isNewInstance = true;

    //是否为一个表达式或者对象
    if( it.current instanceof Ruler.STACK  )
    {
        if( it.current.type() === '(expression)' )
        {
            type = '*';
            desc = null;
            var isForceType= false;
            var _content = it.current.content();

            //一个匿名函数
            if( _content.length===3 && _content[1] instanceof Ruler.STACK && _content[1].keyword() ==="function" )
            {
                type ="Function";
            }

            //是否强制转换类型
            if( it.next && (it.next.id==="(identifier)" || it.next.value==="this" || ( it.next instanceof Ruler.STACK && it.next.keyword() === 'expression') ) )
            {
                isForceType = true;
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
                    property.type = type;
                    property.isForceType = isForceType;
                    it.seek();

                }else{
                    error('Type must have a reference of forced conver', 'reference');
                }

            }else
            {
                //去掉外层的括号 (ref as ClassType)
                it.current.addListener("(iterationDone)",function (e) {
                    if( it.current.property && it.current.property.isAs )
                    {
                        var first = e.iteration.content.shift();
                        var last = e.iteration.content.pop();
                        if( first !=="(" ){
                           e.iteration.content.unshift( first );
                        }
                        if( last !== ")"){
                            e.iteration.content.push( last );
                        }
                    }
                    it.current.removeListener("(iterationDone)");
                },-500);
            }

            if( it.current instanceof Ruler.STACK )
            {
                if( isForceType )
                {
                    var needTypeConvert = true;
                    var expressionProperty={};
                    it.current.addListener("(expressionEnd)", function (e) {
                        if( e.content.length !== 1 || e.content[0].coalition ===true )throw new ReferenceError("Invalid reference");
                        expressionProperty = e.content[0];
                        var valueType = property.descriptor ? expressionProperty.descriptor.type : '';
                        if( isReferenceType(valueType) )
                        {
                            needTypeConvert = false;
                            desc = getmodule( getImportClassByType(classmodule, type), classmodule );
                            if( !checkTypeOf(classmodule, type , valueType, expressionProperty, desc) )
                            {
                                //需要在运行时强制转换
                                needTypeConvert = true;
                                //数字类型和字符串类型可以强制转换
                                var isNumberType = numberType.indexOf(type) >=0 && (numberType.indexOf(valueType)>=0 || valueType==="String");
                                if( !isNumberType )throw new TypeError(expressionProperty.thisArg + " can not be convert for " + type);
                            }
                        }
                    });

                    property.thisArg = toString(it.current, classmodule );
                    //在运行时强制转换
                    if( needTypeConvert )
                    {
                        property.thisArg = buildSyntax.toForceTypeConvert( property.thisArg, type, expressionProperty, classmodule, globalsConfig );
                    }

                }else
                {
                    property.thisArg = toString(it.current, classmodule, type);
                }

            }else{
                property.thisArg = it.current.value;
            }

            property.name= [ property.thisArg ];
            property.type= type;
            if( it.current.property && !isReferenceType(type)  )
            {
                property.type = getDescribeType( it.current.property );
                type = property.type;
            }
            if( isReferenceType(property.type) && !desc )
            {
                desc = getmodule( getImportClassByType(classmodule, property.type), classmodule );
            }

        }else
        {
            var expression_type=null;
            var isTernary = it.current.keyword() ==="ternary";
            if( isTernary )
            {
                var callback_type = function (e)
                {
                    var type = getDescribeType(e.content[0]);
                    if( expression_type !== null )
                    {
                        expression_type = type;
                    }else if( expression_type !== type ){
                        expression_type = "*"
                    }
                    this.removeListener("(expressionEnd)",callback_type);
                }
                var ternary_content = it.current.content();
                if( ternary_content[2].keyword() === "expression" )
                {
                    ternary_content[2].addListener("(expressionEnd)",callback_type);
                }
                if( ternary_content[4].keyword() === "expression" )
                {
                    ternary_content[4].addListener("(expressionEnd)",callback_type);
                }
            }

            property.thisArg = toString(it.current, classmodule);
            property.info= [ property.thisArg ];
            property.name= [];
            property.type= getType( it.current.type() );
            if( property.type ==="*" && expression_type ){
                property.type = expression_type;
            }

            if( it.current.keyword() ==="function" )
            {
                property.type = "Function";
            }

            if( property.type !=='Array' )
            {
                if( property.type ==="JSON" )
                {
                    desc = getmodule("JSON", classmodule );
                    property.thisArg = buildSyntax.newInstanceClassOf("JSON", desc, property.thisArg );
                }
                property.fullPropDescriptor[ property.thisArg ] = desc;
                return property;
            }

            type='Array';
            desc = getmodule(type, classmodule);
            property.isglobal=true;
            property.type = type;
            if( !isTernary ){
                property.thisArg =  buildSyntax.newInstanceClassOf( type , desc, property.thisArg.replace(/^\s*\[|\]\s*$/g,'') ); 
            }
            property.name= [ property.thisArg ];
        }

    }else
    {
        //如果是一个编译器指令
        if( compilePolicy(it,property,classmodule) )
        {
            return property;
        }

        //使用编译器指令（泛类型函数），绕过编译器对类型的检查
        if( compileDirective(it,property,classmodule) )
        {
            return property;
        }

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
                        property.thisArg= buildSyntax.getQualifiedObjectName(  buildSyntax.getVarReference("this") );
                        break;
                    case "__FILE__" :
                        property.thisArg='"'+classmodule.filename+'"';
                        break;
                    case "__LINE__" :
                        property.thisArg = it.current.line;
                        type = "Number";
                        break;
                    case "__SWITCH__" :
                        property.thisArg = parseInt(globalsConfig.command_switch);
                        if( isNaN(property.thisArg) ){
                            property.thisArg = "0";
                        }else{
                            property.thisArg = property.thisArg.toString();
                        }
                        type = "Number";
                        break;
                }

            }else
            {
                //获取字面量类型
                type = Utils.getValueTypeof(it.current.type, it.current.value );
                if( type ){
                    property.isWrapReference=true;
                }
            }

            if (type)
            {
                desc = globals[type];
                property.isglobal=true;
                property.isWrapReference = true;
            }
            //引用命名空间
            else if(classmodule.namespaces && classmodule.namespaces.hasOwnProperty( it.current.value ) )
            {
                desc =  classmodule.namespaces[ it.current.value ];
                desc.type = getType(desc.type);
            }
            //声明的引用
            else
            {
                desc = it.stack.scope().define(it.current.value);
                //如果是对自己的变量赋值，去掉对自己的引用
                if( desc && desc.value === it.stack )
                {
                    //赋值运算从右向左计算
                    if( it.stack.content().indexOf( it.current ) > 0 )
                    {
                        desc = null;
                    }
                }

                //已声明的引用
                if (desc)
                {
                    //当前函数域中引用了其它域中的变量
                    if( desc.id==="var" || desc.id==="const" || desc.id==="let" )
                    {
                        //当前函数域
                        var fnScope = it.stack.getScopeOf();
                        var defineScope = fnScope.define();
                        var usingVar = fnScope.__usingVar__ || (fnScope.__usingVar__=[]);
                        if( !defineScope.hasOwnProperty( it.current.value ) && usingVar.indexOf(  it.current.value ) < 0 )
                        {
                            usingVar.push( it.current.value );
                        }

                        //父级函数域
                        var pScope = fnScope.parent();
                        pScope = pScope ? pScope.getScopeOf() : null;
                        if( pScope && pScope.keyword()==="function" && pScope.parent() && pScope.parent().type()==="(expression)" )
                        {
                            var pUsingVar = pScope.__usingVar__ || (pScope.__usingVar__=[]);
                            var pDefineScope = pScope.define();
                            for( var _us in usingVar )
                            {
                                if( !pDefineScope.hasOwnProperty( usingVar[_us] ) &&  pUsingVar.indexOf(usingVar[_us]) < 0 )
                                {
                                    pUsingVar.push( usingVar[_us] );
                                }
                            }
                        }
                    }

                    var identifierNames = it.getIdentifierName();
                    var isDefined = true;
                    if( identifierNames.length > 1  )
                    {
                        identifierNames = identifierNames.join(".");
                        var importClass = it.stack.scope().define( identifierNames );
                        if( importClass && importClass.id==="class")
                        {
                            desc = null;
                            isDefined = false;
                        }
                    }
                    if( isDefined )
                    {
                        //触发一个块级域事件
                        if (desc.id === 'let' || desc.id === 'const')
                        {
                            var blockScope = it.stack.scope();
                            while (blockScope && blockScope.keyword() === 'function')blockScope = blockScope.parent().scope();
                            blockScope.dispatcher({
                                "type": "(blockScope)",
                                "name": it.current.value,
                                "stack": it.stack,
                                "current": it.current,
                                'scope': desc.scope
                            });
                        }

                        if (desc.id === "function") {
                            desc.referenceType = "Function";
                        }
                    }
                    if( desc && desc.id==="class" )
                    {
                        var __classModule = getmodule( getImportClassByType(classmodule, getType(desc.type) ) , classmodule);
                        desc.nonglobal = __classModule.nonglobal;
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
                        setClassModuleUsed(desc, classmodule);
                    }
                    if( !desc && Object.prototype.hasOwnProperty.call(globals.System.static,it.current.value) )
                    {
                        property.name=['System'];
                        property.thisArg='System';
                        desc = globals.System;
                        requirements[ "System" ]=true;
                        setClassModuleUsed(desc, classmodule);
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

            //是否为类的成员属性
            if ( !desc )
            {
                var funScope = it.stack.getScopeOf();
                var inClassScope = funScope.parent().keyword() === "class";
                while ( funScope && funScope.keyword() !== "class" && funScope.parent() )
                {
                    funScope = funScope.parent().getScopeOf();
                    //if( funScope.parent().getScopeOf().keyword() === "class" )break;
                }

                if( funScope && (funScope.keyword() === "class" /*|| (funScope.parent() && funScope.parent().keyword() === "class")*/ ) )
                {
                    //如果当作用域为static则只查找static
                    if (funScope.static()) {
                        desc = getClassPropertyDesc(it, classmodule, 'static', classmodule, false, property);
                        property.name = [classmodule.classname];
                        property.thisArg = classmodule.classname;
                    }
                    //否则优先从实例原型中查找
                    else {

                        //该属性不在类成员的函数中，则只能调用静态方法
                        if( !inClassScope )
                        {
                            desc = getClassPropertyDesc(it, classmodule, 'static', classmodule, true, property);
                            if( desc )
                            {
                                property.name = [classmodule.classname];
                                property.thisArg = classmodule.classname;
                            }

                        }else{

                            desc = getClassPropertyDesc(it, classmodule, 'proto', classmodule, true, property);
                            if (desc) {
                                property.thisArg =buildSyntax.getVarReference("this");
                                property.name = [  property.thisArg ];
                            } else {
                                desc = getClassPropertyDesc(it, classmodule, 'static', classmodule, true, property);
                                property.name = [classmodule.classname];
                                property.thisArg = classmodule.classname;
                            }
                        }
                    }
                }

            }

            var isSkipName = false;
            //引用一个类的全名 client.skins.Pagination
            if( !desc && it.current.type==='(identifier)' )
            {
                var targetProps = [];
                type = getClassTypeByDefinedFullName(it, targetProps );
                if( !type ) {
                    error('"' + targetProps.join("") + '" is not exists', 'reference');
                }
                desc = getmodule(type, classmodule );
                if ( !desc || (desc.nonglobal === true && desc.privilege !== 'public' && desc.package !== classmodule.package))
                {
                    error('"' + type + '" is not exists', 'reference');
                }
                isSkipName = true;
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
                    property.thisArg = buildSyntax.getDefinitionByName( type , property, classmodule, isNew );
                }else{
                    property.thisArg = type;
                }
                property.name=[property.thisArg];
                setClassModuleUsed( desc , classmodule );
            }

            if (!desc)
            {
                error('"' + it.current.value + '" is not defined.', 'reference');
            }

            var _funScope = it.stack.getScopeOf();
            var isVarReference = desc.id==="var" || desc.id==="let" || (_funScope && _funScope.keyword() ==="function" && desc.id==="const");

            //如果是调用超类
            if( it.current.value==='super' )
            {
                //super 只能在类成员函数中
                var classScope = _funScope;
                while( classScope && classScope.keyword() !=='class' && classScope.parent() )
                {
                    classScope = classScope.parent();
                }
                if( !classScope || classScope.keyword() !=='class' || classScope.static() )
                {
                    error('Unexpected identifier "'+it.current.value+'"', 'syntax');
                }
                property.super = desc.type;

            }else if( !isConstantAttr )
            {
                //如果this不在类函数的成员中,则表示this是一个函数对象，则并非是类对象
                // if( it.current.value==='this' && it.stack.getScopeOf().parent().keyword() !=='class' )
                // {
                //     desc={'type':'*',isThis:false};
                //     property.isThis = false;
                // }

                if( it.current.value && !isSkipName )
                {
                    if( !property.thisArg && (isVarReference || it.current.value==="this") )
                    {
                        property.name.push( buildSyntax.getVarReference( it.current.value ) );
                    }else {
                        property.name.push(it.current.value);
                    }
                }
            }

            property.descriptor = desc;
            type = getDescribeType( desc );
            //如果没有确定类型并且有设置值类型则引用值的类型
            //if( type==='*' && desc.valueType )type = desc.valueType;
            property.type = type || '*';
            if( property.thisArg==="" )
            {
                if( isVarReference || it.current.value==="this" ) {
                    property.thisArg = buildSyntax.getVarReference( it.current.value );
                }else{
                    property.thisArg = it.current.value;
                }
            }

            //正则字面量
            if( property.type ==="RegExp" && property.isWrapReference )
            {
                var wrapReference = buildSyntax.getWrapReference( classmodule, property.type, property.thisArg );
                if( wrapReference ){
                    property.thisArg = wrapReference;
                    property.name = [wrapReference];
                }
            }
        }
        //一组常量的值
        else
        {
            type = Utils.getConstantType(it.current.value) || Utils.getValueTypeof(it.current.type, it.current.value );
            property.thisArg = it.current.value;
            property.isWrapReference = true;
           
            //解析使用的模板
            if( !type && it.current.type==="(template)")
            {
                var text = it.current.value.replace(/^`|`$/g,"");
                var match = null;
                var regexp = /\{([^\{]+?)\}/g;
                var cursor = 0;
                var content = [];
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
                    var expres = new Ruler.SCOPE('block','(block)');
                    expres.parent( it.stack.scope() );

                    try
                    {
                        var _ruler = new Ruler(name+";", globalsConfig , expres );
                        var scope = _ruler.start().content()[0];
                        var refObject =  expression( scope, classmodule );
                        var str = text.substr( cursor, match.index-cursor );
                        if( str ) {
                            content.push("'" + str.replace(/\'/g, "\\'") + "'");
                        }
                        if( /^\s*[\w\$]+\s*$/.test( refObject ) ){
                            content.push( refObject );
                        }else {
                            content.push('(' + refObject + ')');
                        }
                        cursor = match.index + match[0].length;

                    }catch(e)
                    {
                        Iteration.lastStack = it.current;
                        error(e.message, 'syntax'); 
                    }
                }

                //将字符串装载到容器中
                if( cursor < text.length )
                {
                    content.push("'" + text.substr(cursor, text.length).replace(/\'/g, "\\'") + "'");
                }

                type = "String";
                property.thisArg =  content.join(" "+buildSyntax.getJointOperator("+",{type:"String"},{type:"String"})+" ");
                //去掉转义符
                property.thisArg =  property.thisArg.replace(/\\\{/g, "{");
            }

            if (!type)
            {
                error('Unexpected identifier for "'+it.current.value+'"','syntax');
            }

            property.type = type || '*';
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
        refClassModule = getmodule( classType , classmodule );
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

    //归属于哪种引用类型
    property.ownerThisType = desc ? desc.type : '*';
    var isstatic = type==='Class' || (desc && desc.id==='object') || property.thisArg ==="System";
    if( !isstatic && desc && (desc.id==="class") )
    {
        isstatic = it.current.value === getDefinedShortClassName(classmodule,type);
    }
    property.isStatic = isstatic && desc.id !=='object';
   //描述引用
    property.fullPropDescriptor[ property.info[0] ] = desc;
    ////捕获指定运行在客户端平台的元数据
    captureRunPlatformMetatype( it, desc ,property, classmodule );

    while ( it.next )
    {
        if ( it.next instanceof Ruler.STACK )
        {
            it.seek();
            it.current.addListener("(iterationSeek)",function (e) {
                if( e.iteration.current && (e.iteration.current.value==="[" || e.iteration.current.value==="(") )
                {
                    e.iteration.seek();
                }
                if( e.iteration.current && (e.iteration.current.value==="]" || e.iteration.current.value===")") )
                {
                    e.stopPropagation = true;
                    it.current.removeListener("(iterationSeek)");
                    it.current.removeListener("(iterationDone)");
                }
            });

            it.current.addListener("(iterationDone)",function (e) {
                it.current.removeListener("(iterationSeek)");
                it.current.removeListener("(iterationDone)");
            });

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
                property.isDynamicProperty = true;
                property.fullPropDescriptor[ '['+value+']' ] =  property.descriptor;
                property.notCheckType=true;

                if( desc && desc.id==='var')
                {
                    var refType = getDescribeType( desc );

                    //通过内部变量引用的值的类型为全局对象
                    //类型为全局对象,允许直接引用
                    if( desc.valueType==="JSON" || globals.hasOwnProperty( refType ) )
                    {
                        property.runningCheck=false;
                        property.descriptor = {type:refType};
                        property.isglobal = true;
                    }
                }
                desc = null;
                property.type='*';

            }else if( it.current.type() === '(expression)' )
            {
                var isFun = desc && (desc.id === 'function' || desc.id === 'class' ||
                    desc.referenceType==='Function' || desc.type ==="Class" || desc.type ==="Function" ||
                    desc.origintype ==="Function" || desc.origintype ==="Class" ) && desc.isAccessor !== true;

                var isClassProp = desc && desc.id !=='function' && desc.__stack__ && desc.__stack__.getScopeOf().keyword()==="class";
                if( property.accessor || (desc && desc.isAccessor) || (desc && !isFun && isReferenceType( desc.type ) && desc.type !=="Object" ) || (!isFun && isClassProp )  )
                {
                    if( !isNew ) {
                        error('"' + property.info.join('.') + '" is not function', 'type');
                    }else {
                        error('"' + property.info.join('.') + '" is not constructor', 'type');
                    }
                }

                if( !isNew && (desc && desc.id==="class" ) && property.thisArg !=="super" )
                {
                    classType = getImportClassByType(classmodule, desc.type);
                    refClassModule = getmodule(classType, classmodule);
                    if ( refClassModule.nonglobal ===true )
                    {
                        error('"' + property.info.join('.') + '" is not function', 'type' );
                    }
                    setClassModuleUsed(refClassModule, classmodule);
                }

                property.type = desc ? desc.type : "*";
                property.descriptor = desc;
                property.expression = true;
                value = checkCallParameter( it, desc, property , isNew );
                property.param = value;

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

                if( it.next && (it.next.value==='.' || (it.next instanceof Ruler.STACK && (it.next.type() === '(property)' || it.next.type() === '(expression)' ))))
                {
                    if (type === 'void')error('"' + it.prev.value + '" no return value', 'reference');
                    isstatic=false;
                    property = createDescription(it, classmodule, property);
                    if( isNew ){
                        property.thisArg = "("+property.thisArg+")";
                        property.name = [ property.thisArg ];
                    }
                    property.ownerThisType = desc ? desc.type : '*';
                }

                //清除new运算符标识
                if( isNew && (desc.type ==="Class" || desc.type==="Function" || desc.id==="class") ){
                    isNew = false;
                }

            }else
            {
               // console.log( it.current.parent().content() )
                //process.exit();
                error('Unexpected expression for "'+Utils.joinProperty( property.info )+'"', '');
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
                var sem = classmodule.namespaces[ use ] || it.stack.getScopeOf().define( use );
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
                    var nsmodule = getmodule(sem.fullclassname||sem.type, classmodule );
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
                property.ownerThisType = desc ? desc.type : '*';
            }

            property.use = use;
            if( it.current.value )
            {
                property.name.push( it.current.value );
                property.info.push( it.current.value );
            }

            var _propName = it.current.value;
            var desctype = isReferenceType( property.type ) ? property.type : getDescribeType( desc );

            //JSON类型的引用
            if( desc && (desctype==="JSON" || desc.valueType==="JSON") )
            {
                refClassModule = getmodule( "JSON" , classmodule );
                desc = getClassPropertyDesc(it, refClassModule, isstatic ? 'static' : 'proto', classmodule, true , property );
                type = '*';
                if( !desc )
                {
                    desc = {type:"*",referenceType:"JSON", "notCheckType":true};
                    property.runningCheck = false;

                }else
                {
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
                refClassModule =desc && desc.id==="object" ? desc : getmodule( desctype, classmodule  );
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
                refClassModule = getmodule( classType , classmodule );
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
                property.descriptor = desc;
                property.isObjectSeftReference = classType === "Object";
                if( classType === "Object" )
                {
                    property.isglobal=true;
                    property.descriptor = {type:"*", isglobal:true};
                }

                if( desc )
                {
                    type = desc.type;
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
                if( desc && it.next && Utils.isMathAssignOperator(it.next.value) )
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
            //未知的情况，运行时验证
            else
            {
                property.descriptor = null;
                property.runningCheck=true;
                property.type='*';
                desc = null;
            }

            if( !isReferenceType(property.ownerThisType) )
            {
                property.ownerThisType = getDescribeType( property );
            }

            property.fullPropDescriptor[ _propName ] =  property.descriptor;
            captureRunPlatformMetatype( it, desc , property, classmodule );
        }
        else
        {
            break;
        }
    }

    //布尔转换运行符
    if( property.before[0] === "!" || property.before[0] === "!!" )
    {
        property.type="Boolean";
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
        var typename = classmodule.type;
        if( !totype )
        {
            error( 'Unexpected keyword "as" ', 'type');
        }
        if( totype === classmodule.classname )
        {
            property = createDescription(it, classmodule, property);
            property.type = typename;
            it.stack.valueType = typename;

        }else
        {
            typename = totype;
            var origin = property;
            var _reftype = getDescribeType( origin );
            property = createDescription(it, classmodule, property);
            property.type = typename;
            it.stack.valueType = typename;
            if( classmodule.declared && classmodule.declared.hasOwnProperty( typename ) )
            {
                setClassModuleUsed( classmodule.declared[typename] , classmodule );
            }else{
                setClassModuleUsed( getmodule( typename, classmodule ) , classmodule );
            }

            if( !isReferenceType( _reftype ) || !checkTypeOf(classmodule, typename, _reftype , origin ) )
            {
                var info = '"' + Iteration.lastStack.line + ':' + Iteration.lastStack.cursor + '"';
                typename = getDefinedShortClassName(classmodule,typename);
                property.thisArg = operateMethodOfCheckType(classmodule, typename, property.thisArg, info);
                property.name = [];
            }
        }

        if( it.stack.parent() && it.stack.parent().type()==="(expression)" )
        {
            it.stack.parent().property = property;
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
 *  检查实例类型
 */
function checkInstanceType( moduleClass, instanceModule , type )
{
    var desc = getmodule( getImportClassByType(moduleClass,  type ) , moduleClass );
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
            instanceModule = getmodule( getImportClassByType(instanceModule, instanceModule.inherit), instanceModule );
        }else
        {
            return false;
        }
    }
    return false;
}

/**
 * 类型转换操作
 * @param classmodule
 * @param type
 * @param value
 * @param info
 */
function operateMethodOfCheckType( classmodule,type,value, info )
{
    return buildSyntax.buildExpressionTypeOf(globalsConfig,classmodule,type,value, info);
}

/**
 * 获取操作
 * @param classmodule
 * @param thisvrg
 * @param desc
 * @param props
 * @param info
 * @param before
 * @returns {*}
 */
function operateMethodOfGet(classmodule, thisvrg, desc, props ,info, before, isNew )
{
    var useNs = props.length > 0 ? getUseNamespace( desc ) : null;
    var ns = desc.use ?  desc.use : (desc.descriptor ? desc.descriptor.privilege : null);
    ns = getNamespaceUriByModule(classmodule, ns );
    return buildSyntax.buildExpressionGetOf(globalsConfig,classmodule, thisvrg, desc, props ,info, before,ns,useNs, isNew );
}

/**
 * 设置操作
 * @param classmodule
 * @param thisvrg
 * @param desc
 * @param props
 * @param info
 * @param value
 * @param operator
 * @returns {*}
 */
function operateMethodOfSet(classmodule, thisvrg, desc, props ,info, value, operator )
{
    var useNs = props.length > 0 ? getUseNamespace( desc ) : null;
    var ns = desc.use ?  desc.use : (desc.descriptor ? desc.descriptor.privilege : null);
    ns = getNamespaceUriByModule(classmodule, ns );
    return buildSyntax.buildExpressionSetOf(globalsConfig, classmodule, thisvrg, desc, props ,info, value, operator,ns,useNs );
}

/**
 * 调用操作
 * @param classmodule
 * @param thisvrg
 * @param desc
 * @param props
 * @param info
 * @returns {*}
 */
function operateMethodOfApply(classmodule, thisvrg, desc, props ,info)
{
    var superModule = desc.super ?  getmodule( getImportClassByType(classmodule, desc.super), classmodule ) : null;
    var useNs = props.length > 0 ? getUseNamespace( desc ) : null;
    var ns = desc.use ?  desc.use : (desc.descriptor ? desc.descriptor.privilege : null);
    ns = getNamespaceUriByModule(classmodule, ns );
    return buildSyntax.buildExpressionCallOf(globalsConfig, classmodule, superModule, thisvrg, desc, props ,info, ns , useNs );
}

/**
 * 构建实例操作
 * @param classmodule
 * @param express
 * @param desc
 * @param info
 * @returns {*}
 */
function operateMethodOfNew( classmodule, express, desc, info )
{
    //如果是一个引用，并且有指定类型
    var referenceType;
    var param = (desc.param||[]).slice(0);
    var instanceType;
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
            var p = param;
            if (p.length === 0)p.push("");
            if (p.length === 1)p.push('"' + classmodule.filename + '"');
            if (p.length === 2)p.push('"' + info + '"');
        }

        if( referenceType !== "Function" )
        {
            instanceType = getmodule( getImportClassByType(classmodule, referenceType), classmodule );
        }
    }
    return buildSyntax.buildExpressionNewOf(globalsConfig, classmodule, express, desc, info , param, instanceType );
}

/**
 * 删除操作
 * @param classmodule
 * @param thisvrg
 * @param desc
 * @param props
 * @param info
 * @returns {*}
 */
function operateMethodOfDel(classmodule, thisvrg, desc, props ,info)
{
    return buildSyntax.buildExpressionDeleteOf(globalsConfig,classmodule, thisvrg, desc, props ,info);
}

/**
 * in 操作
 * @param classmodule
 * @param thisvrg
 * @param desc
 * @param props
 * @param info
 * @returns {*}
 */
function operateMethodOfHas(classmodule,thisvrg, desc, props ,info)
{
    return buildSyntax.buildExpressionHasOf(globalsConfig, classmodule,thisvrg, desc, props ,info);
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

    if( !thisvrg ){
       return "";
    }

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

    var express="";
    if( beforeOperator==='new' )
    {
        express=operateMethodOfNew( classmodule, operateMethodOfGet(classmodule, thisvrg, desc, props ,info,"", true), desc, info);
        beforeOperator= desc.before.pop();

    }else if( beforeOperator==='delete' )
    {
        express=operateMethodOfDel(classmodule, thisvrg, desc, props ,info);
        beforeOperator= desc.before.pop();

    }else if( beforeOperator==='typeof' )
    {
        express= buildSyntax.typeOf( operateMethodOfGet(classmodule, thisvrg, desc, props ,info) );
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
 * 解析一个表达式
 * @param desc
 * @returns {*}
 */
function parse(classmodule, desc , value ,operator, returnValue )
{
    //有被编译器删除的表达式
   /* var hasSyntaxRemove =  desc.hasSyntaxRemove ;
    var lastValueDesc = lastValueDescriptorBySyntax( classmodule.currentMakeSyntax, desc.descriptor );

    //设置到变量上面的引用
    if( !hasSyntaxRemove && desc.descriptor && (desc.descriptor.id==="var" || desc.descriptor.id==="const") && lastValueDesc)
    {
        hasSyntaxRemove =  lastValueDesc.hasSyntaxRemove;
    }

    //如果有删除尝试转换一个相近的值来替换
    if( hasSyntaxRemove )
    {
        var beforeOperator = desc.before[ desc.before.length-1 ];
        var _type = "*";

        //获取引用对象上所定义的数据类型
        if( desc.expression && desc.descriptor && (desc.descriptor.id==="var" || desc.descriptor.id==="const") &&
            lastValueDesc && lastValueDesc.descriptor )
        {
            _type = getDescribeType( lastValueDesc.descriptor );
            if( !isReferenceType(_type) )
            {
                _type = getDescribeType( lastValueDesc );
            }

        }else {
            _type = getDescribeType( desc );
        }

        if( !beforeOperator && isReferenceType(_type) )
        {
            var defaultVlaue = "null";
            switch (_type.toLowerCase()){
                case "string" :
                    defaultVlaue = '""';
                    break;
                case "array" :
                    defaultVlaue = '[]';
                    break;
                case "boolean" :
                    defaultVlaue = 'false';
                    break;
                case "number" :
                case "float" :
                case "double" :
                case "unit" :
                case "integer" :
                case "int" :
                    defaultVlaue = 'NaN';
                    break
            }

            if( operator ) {
                value = defaultVlaue;
            }else{
                return defaultVlaue;
            }

        }else {
            //throw new ReferenceError("Failed references. try converting the default value of removed method or property. for '"+desc.info.join(".")+"'");
        }
    }*/

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
    var nonOrOperator=false;
    type = getDescribeType( lastExpress );
    var hasBoolOperator = false;
    var logicOperator = '';

    while( it.next && Utils.isLeftAndRightOperator(it.next.value) && !Utils.isMathAssignOperator(it.next.value)  )
    {
        it.seek();
        if( it.skip === true )
        {
           continue;
        }

        operator = it.current.value;
        if( !nonOrOperator && operator !=="||" )
        {
            nonOrOperator = true;
        }

        if( !hasBoolOperator )hasBoolOperator = Utils.isBoolOperator(operator);
        if ( !it.next )error('Missing expression', '');
        it.seek();
        logicOperator = '';
        if( operator === 'instanceof' || operator === 'is' || operator==="in" )
        {
            logicOperator = operator;
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
                        var refObj = getmodule( getImportClassByType(classmodule, desctype ), classmodule );
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
                if( operator==='instanceof' ){
                    express.push( buildSyntax.instanceOf( target1, parse(classmodule, property2 ) ) );
                }else if( operator==='is' ){
                    express.push( buildSyntax.isOf( target1, parse(classmodule, property2 ) ) );
                }
            }
            type= 'Boolean';
            hasBoolOperator = operator;

        }else
        {
            var leftType = getDescribeType(lastExpress);
            var value = getDescriptorOfExpression(it, classmodule);
            var desctype = getDescribeType( value );
            if( isReferenceType(desctype) )
            {
                type = desctype;
            }

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

            if( Utils.isBoolOperator(operator) || ( Utils.isLogicOperator(operator) && operator !=="||" ) )
            {
                type='Boolean';
            }

            if( operator==="+" )
            {
                operator = buildSyntax.getJointOperator(operator, lastExpress, value );
            }

            express.push(operator);
            express.push(value);

        }
    }

    //如果有布尔运算符则整个表达式都为布尔类型
    if( hasBoolOperator )
    {
        type = 'Boolean';
    }

    //逻辑表达式  a && b  或者是 运算表达式 a instanceof b  a > b
    if( express.length > 1 || logicOperator )
    {
        var items=[];
        var info = [];
        for(var i in express )
        {
            info.push(  typeof express[i] === "string" ? express[i] : Utils.joinProperty( express[i].info ) );
            items.push( typeof express[i] === "string" ? express[i] : parse(classmodule,express[i]) );
        }

        if( !nonOrOperator && items.indexOf("||") > 0 )
        {
            items = [ buildSyntax.getWhenValue( items, it, classmodule) ];
        }
        return {type: type,thisArg:items.join(""),coalition:true, info: [ info.join("") ] };
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
    var _refDescription = {};
    while ( it.seek() )
    {
        if( it.skip === true )
        {
           continue;
        }

        val = bunch(it, classmodule, _refDescription);
        refExpress = val;
        if(val)express.push( val );
        // a = b or a += b ;
        while( it.next && Utils.isMathAssignOperator(it.next.value) )
        {
            it.seek();
            express.push( it.current.value );
            if (!it.next)error('Missing expression', '');
            it.seek();
            val = bunch(it, classmodule, _refDescription );
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

    var event = {type:'(expressionEnd)',content:express,iteration:it};
    stack.dispatcher(event);
    if( event.stopPropagation === true )
    {
        return event.value || "";
    }

    //if is Remove Metatype then has been remove expression
    if( express.length < 1 )
    {
        return "";
    }

    //赋值运算从右向左（从后向前）如果有赋值
    var describe =  express.pop();
    var valueDescribe = describe;
    var value = parse(classmodule, describe );
    var str=[];
    //引用内存地址
    var var_reference_operator = "";
    if( !fromReturn && !fromParam && classmodule.currentMakeSyntax==="php" && describe.descriptor && (describe.descriptor.id==="var" || describe.descriptor.id==="const" || describe.descriptor.id==="let" ) )
    {
        if( getDescribeType(describe) === "Array" )
        {
            var_reference_operator="&";
        }
    }

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
                error('"' + Utils.joinProperty( describe.info ) + '" is not reference', 'syntax');
            }

            //未声明的引用不能修改
            if (describe.descriptor)
            {
                if (describe.descriptor.id === 'class' || describe.descriptor.id === 'object')
                {
                    error('"' + Utils.joinProperty( describe.info ) + '" is be protected', 'type');
                }

                if (describe.descriptor.id === 'const')
                {
                    var _prefix = classmodule.currentMakeSyntax;
                    if (describe.descriptor[_prefix+"_constValue"] )
                    {
                        error('Specified constant cannot be assigned twice for "' + describe.name.join('.') + '"', 'type');
                    }
                    describe.descriptor[_prefix+"_constValue"] = true;
                }
            }

            var valueType = getDescribeType(valueDescribe);
            var _acceptType = describe.descriptor && describe.notCheckType !==true ? describe.descriptor.type : null;

            //当前设置的引用是否为一个属性或者setter
            if( describe.descriptor && describe.descriptor.id==='function' )
            {
                if( describe.accessor !=='set' && describe.descriptor.fromVarToAccessor !==true && describe.descriptor.value && !describe.descriptor.value.set)
                {
                    error('"' +Utils.joinProperty( describe.info ) + '" is not setter', 'type');
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
                if( !checkTypeOf(classmodule, _acceptType , valueType, valueDescribe , describe ) )
                {
                    //如果是数据类型可以在运行里转换
                    if( numberType.indexOf(_acceptType.toLowerCase())>=0 && numberType.indexOf(valueType.toLowerCase())>=0  )
                    {
                        if( value !== "NaN" )
                        {
                            value = operateMethodOfCheckType( classmodule,_acceptType,value, info );
                        }

                    }else
                    {
                        error('"' + Utils.joinProperty(describe.info) + '" type does not match. must is "' + _acceptType + '"', 'type');
                    }
                }

                //php语法
                if( var_reference_operator && !(describe.descriptor && describe.descriptor.isAccessor) )
                {
                    value = var_reference_operator+value;
                    var_reference_operator = "";
                }
            }

            if( operator==="+=" )
            {
                operator = buildSyntax.getJointOperator(operator, describe, valueDescribe );
            }

            //设置引用的数据类型
            if ( describe.descriptor )
            {
                describe.descriptor.referenceType = valueType;
                if( valueDescribe ) {
                    describe.descriptor.isNullType = valueDescribe.isNullType;
                }
            }

            //对属性值描述的引用
            if( operator ==="=" && describe.descriptor )
            {
                lastValueDescriptorBySyntax(classmodule.currentMakeSyntax, describe.descriptor, valueDescribe );
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
            var scope = valueDescribe.descriptor.__stack__.getScopeOf();
            if( valueDescribe.descriptor.isAccessor && valueDescribe.descriptor.value.get )
            {
                scope =valueDescribe.descriptor.value.get.__stack__.getScopeOf();
            }
            if( !scope.isReturn )
            {
                isReturn = false;
            }
        }

        if( fromReturn && (valueType ==="void" || !isReturn ) )
        {
            error( Utils.joinProperty( describe.info )+' not return', 'type');
        }

        //运行时检查类型
        if ( valueType === '*' )
        {
            var info = '"' + Iteration.lastStack.line + ':' + Iteration.lastStack.cursor + '"';
            if( fromParam !== true )
            {
                value = operateMethodOfCheckType( classmodule,acceptType,value, info );
            }

        } else if ( !checkTypeOf(classmodule, acceptType, valueType, valueDescribe ) && !( stack.parent().type() ==='(property)' && valueType==='Number' ) )
        {
            //不是数字类型就报错
            if( !(numberType.indexOf(acceptType.toLowerCase())>=0 && numberType.indexOf(valueType.toLowerCase())>=0)  )
            {
                //如果不是全局对象函数访问器
                if (!(valueDescribe.descriptor && valueDescribe.descriptor.isFunAccessor && valueDescribe.param instanceof Array && valueDescribe.param.length === 0))
                {
                    error('the "' + Utils.joinProperty(describe.info) + '" reference types does not match. must is "' + acceptType + '"', 'type');
                }
            }
        }
    }

    var event = {type:'(expressionCompleted)',content:value,iteration:it};
    stack.dispatcher(event);
    return event.content;
}

/**
 * 设置获取描述对象上最近一次写数据的描述符
 * @param desc
 * @param value
 * @param syntax
 * @returns {*}
 */
function lastValueDescriptorBySyntax(syntax,desc, value)
{
    if( !desc )return null;
    if( value )
    {
        desc['last_value_descriptor_' + syntax] = value;
        return value;
    }
    return desc['last_value_descriptor_' + syntax];
}

var skipType = ['*','void'];
function isReferenceType(type , checkType )
{
    if( !type )return false;
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
function getImportClassByType(classmodule, type, flag )
{
    //全类型名称
    if( type.indexOf('.') > 0 && getmodule(type, classmodule) )
    {
        return type;
    }

    //优先使用导入的别名
    if( classmodule.import && Object.prototype.hasOwnProperty.call( classmodule.import,type) )
    {
        //return type;
        return classmodule.import[type];
    }

    //使用本类的引用
    if( classmodule.type === type || classmodule.classname===type)
    {
        //return type;
        return classmodule.fullclassname;
    }

    //全类型引用
    for( var i in classmodule.import )if( classmodule.import[i]===type )
    {
        return type;
    }

    //内部引用
    if( classmodule.nonglobal ===true && classmodule.declared &&
        Object.prototype.hasOwnProperty.call(classmodule.declared,type) &&
        classmodule.declared[ type ].id==="class" )
    {
        return type;
    }

    //全局引用
    if( Compile.getLoaclAndGlobalModuleDescription( type ) )
    {
        return type;
    }

    //是否忽略不存在的类型引用
    if( flag ===true ){
        return null;
    }
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
                if ( (desc.length + descNs.length) > 1 )error('"' + Utils.joinProperty( propertyDesc.info ) + '" inaccessible', 'reference');
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
        desc = desc[0];

        //默认都继承对象
        if ( !desc && Object.prototype.hasOwnProperty.call( globals.Object, name ) )
        {
            if( Object.prototype.hasOwnProperty.call( globals.Object[name], prop ) )
            {
                desc = globals.Object[name][prop];
            }
        }
        if( desc )
        {
            if( isset && ( desc.id ==="const" || ( desc.id==="function" && !( desc.value && desc.value.set ) ) ) )
            {
                error('"'+Utils.joinProperty(propertyDesc.info)+ '" is not writable', 'reference');
            }
            return desc;
        }
        if( isset )
        {
            desc = getClassPropertyOwnerDesc(it, refObj, name ,prop, ns, classmodule , false, propertyDesc );
            if( desc[0] ){
                error('"'+Utils.joinProperty(propertyDesc.info)+ '" is not writable', 'reference');
            }
        }
    }
    if( refObj.id==="class" && refObj.isDynamic )return {type:'*'};
    if(flag===true)return null;
    error('"' +Utils.joinProperty( propertyDesc.info ) + '" is not defined', 'reference');
}

function getClassPropertyDescNS(ns, prop, name, refObj, classmodule, it , isset, propertyDesc )
{
    var desc=[];
    var parent = refObj;
    var ret;

    //在继承的类中查找
    if( parent[name] )
    {
        ret = getClassPropertyDescByProp(prop, ns ? parent[name][ns] : parent[name], parent, classmodule, it, isset , ns , propertyDesc );
        if( ret )desc.push(ret);
        if( desc.length > 1 || (!ns && ret) )return desc;
    }

    if( parent.inherit )
    {
        var inherits = parent.inherit.split(",");
        for( var p in inherits )
        {
           var refClass = getmodule( getImportClassByType(parent, inherits[p]) , parent );
           if( refClass.id==='class' || refClass.id==='interface' )
           {
               ret = getClassPropertyDescNS(ns, prop, name, refClass, classmodule, it ,isset, propertyDesc );
               if( ret )
               {
                   desc = desc.concat(ret);
               }
               if( desc.length > 1 || (!ns && ret) )return desc;
           }
        }
    }
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
    var externalClass = it.stack.getScopeOf().define( currobject.classname );
    externalClass = externalClass ? !!externalClass.import : false;
    if( currobject.type === inobject.type && !externalClass)
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
        var inherit = desc.privilege === 'protected' && !externalClass && checkInstanceType(currobject,currobject,inobject.fullclassname);

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
    if( !code )return code;
    var id = stack.keyword();
    code = code.replace(/[\n]+/g,'\n');
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
        return formatCode( stack, expression( stack , module , acceptType, fromParam, fromReturn ) );
    }
    var it = new Iteration(stack, module );
    while ( it.seek() )
    {
        if( it.skip === true )
        {
           continue;
        }

        if (it.current instanceof Ruler.STACK)
        {
            it.content.push( toString(it.current, module ) );

        }else if( it.current && typeof it.current === "string")
        {
            it.content.push( it.current );
        }
        else if( it.current )
        {
            if ( it.current.id === '(keyword)' && (it.current.value === 'in' || it.current.value === 'is' || it.current.value === 'instanceof' ))
            {
                it.content.push(' ');
            }

            if( it.current.id === '(keyword)'  )
            {
                it.content.push( buildSyntax.getKeyword( it.current.value ) );
            }else{

                if( it.current.value ===":" && stack.keyword()==="object" && stack.type()==="(JSON)") {
                    it.content.push( buildSyntax.getObjectKeyValueDelimiter( it.current.value ) );
                }else{
                    it.content.push( it.current.value );
                }
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
    return formatCode( stack, it.content.join('') );
}


/**
 * 执行模块的原型链，直到回调函数返回值或者已到达最上层为止
 * @param classModule
 * @param callback
 * @returns {*}
 */
function doPrototype(classModule, callback, notObject )
{
    if( !classModule )
    {
        return null;
    }

    if( classModule.type==="Object" )
    {
        if( notObject )return null;
        var val = callback( classModule );
        if( val )return val;
        return null;
    }

    var val = callback( classModule );
    if( val )return val;
    if( classModule.inherit )
    {
        var inherits = classModule.inherit.split(",");
        for(var p in inherits)
        {
           val = doPrototype( getmodule( getImportClassByType(classModule, inherits[p] ), classModule ) , callback, notObject );
           if( val )return val;
        }
        
    }else
    {
        return doPrototype( getmodule("Object", classModule) , callback, notObject );
    }
    return null;
}

const numberType = ['float',"double","integer",'uint','int','number'];

/**
 * 检查类型
 * 检查 currentType 是否属于 needType 包括接口类型
 * @param needType
 * @param currentType
 * @returns {*}
 */
function checkTypeOf(classModule, needType, currentType, describeType, needDescribe )
{
    if( currentType ==="void" || currentType ==="*" )
    {
        return false;
    }

    //除了指定的包裹容器都可指定为空类型
    if( describeType.isNullType === true )
    {
        return ['boolean','number','int',"float","integer","double"].indexOf(needType.toLowerCase()) < 0;
    }

    //接收的类型为Object
    if( needType==='Object' )
    {
        //如当前值的类型是指定的包裹容器验证不通过
        if( describeType.isWrapReference && ['boolean','number','int',"float","integer","double"].indexOf( currentType.toLowerCase() ) >= 0  )
        {
            return false;
        }
        return true;
    }

    //如是需要判断一个数字类型
    var numberIndex = numberType.indexOf( needType.toLowerCase() )
    if( numberIndex >=0 )
    {
        var valueNumberIndex = numberType.indexOf( currentType.toLowerCase() );

        //将integer转成int;
        if( needType===2 )needType='int';
        if( valueNumberIndex===2 )needType='int';

        //如果是一个字面量
        if( valueNumberIndex >=0 && /^[-+]?[\d\.]+$/.test( describeType.thisArg ) )
        {
            var testValue = parseInt( describeType.thisArg );
            if (needType === "uint")return testValue >= 0;
            if (needType === "int")return !(testValue > globals.Integer.static.MAX || testValue < testValue<globals.Integer.static.MIN);
        }

        //如果是Number可以包括为 int uint double float
        if( numberIndex===5 && valueNumberIndex >=0 )
        {
            return true;
        }

        //当前值的类型与给定的类型一致
        return valueNumberIndex === numberIndex;
    }

    if( needType==='Class' && (currentType==='Function' || currentType==="Class" || describeType.descriptor.id==='class') )
    {
        return true;
    }

    currentType = getmodule( getImportClassByType( classModule, currentType ), classModule );

    var need;
    if( needDescribe && needDescribe.descriptor && needDescribe.descriptor.owner ){
        need = getmodule( getImportClassByType( getmodule( needDescribe.descriptor.owner, classModule ), needType ), classModule );
    }else{
        need = getmodule(getImportClassByType(classModule, needType), classModule);
    }

    setClassModuleUsed(currentType, classModule);
    setClassModuleUsed(need,classModule);

    var isInterfaceType = need.id==="interface";
    needType = need.fullclassname || need.type;
    if( need.type==="Class" && currentType.id ==="class")
    {
        return true;
    }

    if ( need.nonglobal === true && need.privilege !== 'public' && need.package !== need.package )
    {
        return false;
    }

    return doPrototype(currentType, function (classModule) {
        if( (classModule.fullclassname || classModule.type) === needType )return true;
        if( classModule.implements && classModule.implements.length > 0 && isInterfaceType )for( var i in classModule.implements )
        {
            return doPrototype( getmodule( getImportClassByType( classModule, classModule.implements[i] ), classModule ) ,function (interfaceModule) {
                if( interfaceModule.fullclassname === needType )return true;
            });
        }
    });
}

function checkInterfaceParamAndType(desc,name,classModule,ns, descModule )
{
     var obj=doPrototype(classModule,function (module) 
     {
          var proto = ns ? module.proto[ns] : module.proto;
         if( proto && proto[name] && proto[name].id === 'function')return proto[name];
     });

    if( !obj )
    {
        error('the "' + name + '" interface method no implementation');
    }

    if( obj.__stack__)Iteration.lastStack = obj.__stack__;

    if( obj.privilege !== desc.privilege )
    {
        error('the "' + name + '" method access modifier is inconsistent with the interface access modifier.');
    }

    if( obj.type !== desc.type )
    {
        getImportClassByType( classModule, obj.type);
        error('the "' + name + '" interface of mismatch the return type ('+classModule.filename+')');
    }
    if( desc.param.length !== obj.param.length )error('the "' + name + '" method parameter no implementation');
    if( desc.param.length > 0 )
    {
        for(var b in desc.paramType )
        {
            if( desc.paramType[b] !== obj.paramType[b] )
            {
                error('the "'+name+'" method of mismatch parameter type','type');
            }
        }
    }
    return true;
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
        doPrototype( getmodule( getImportClassByType( classModule, classModule.implements[i] ) , classModule ),function (module) {
            if( module.id !== 'interface' )error('Interface can only extends an interface' );
            last = module;
            setClassModuleUsed(module, currentModule);
            interfaceDesc.push( module );
        }, true );
    }

    var descModule;
    for( var i in interfaceDesc )
    {
        descModule = interfaceDesc[i];
        var interProto = descModule.proto;
        for( var name in interProto )
        {
            var importModuleType = getImportClassByType( descModule, name, true);
            var ns = null;
            if( importModuleType )
            {
                var refClassModule = getmodule( importModuleType , descModule );
                ns = refClassModule.id ==="namespace" ? name : null;
            }
            if( ns )
            {
                for(var p in interProto[name])
                {
                    checkInterfaceParamAndType(interProto[name][p],p,classModule,ns, descModule);
                }

            }else
            {
               
                checkInterfaceParamAndType(interProto[name],name,classModule,null,descModule);
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
        var nsmodule = getmodule(getImportClassByType(module, name), module );
        if (nsmodule && nsmodule.namespaces.hasOwnProperty(name))
        {
            var _nsMakeModule = Compile.makeModuleByName( nsmodule.fullclassname );
            if (!nsmodule.namespaces[name].value && nsmodule.id === "namespace" && _nsMakeModule )
            {
                makeModule(globalsConfig.syntax, _nsMakeModule, nsmodule, globalsConfig);
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
        descNs = getmodule( refNs , classModule );
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
    setClassModuleUsed( getmodule( getImportClassByType( classModule, nameNs ) , classModule ) ,classModule );
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
    return doPrototype( getmodule( getImportClassByType(classModule,  classModule.inherit || "Object" ), classModule ),function (module){
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
 * 编译视图数据元
 * @param config
 * @param currentModule
 * @param metatype
 * @param itemStack
 */
function makeViewMetatype(config, currentModule, metatype, itemStack )
{
    var viewClass = metatype.param.source;
    Compile.loadSkinModuleDescription( config.syntax, viewClass, config , currentModule )
    var viewModule = Compile.makeModuleByName( viewClass );
    var description = viewModule.description;
    var className = description.classname;
    if(  currentModule.import[ description.classname ] || currentModule.classname === description.classname )
    {
        className=description.fullclassname;
    }
    currentModule.import[ className ]=viewClass;
    makeModule(config.syntax, viewModule, description, config);
    setClassModuleUsed( description, currentModule )
    var done = function (e) {
        var startIndex = e.content.lastIndexOf('}');
        var code = [];
        if( description.nonglobal===true )
        {
            var property = {descriptor:description,type:viewClass};
            var thisvrg = buildSyntax.buildExpressionNewOf(config, currentModule, buildSyntax.getDefinitionByName( className ) , property, [] , [ buildSyntax.getVarReference("this") ], property);
            var desc = getClassPropertyDescNS('',"display","proto", description, currentModule );
            if( desc && desc.length===1 )
            {
                var express = buildSyntax.buildExpressionCallOf(config, currentModule, null, '(' + thisvrg + ')', {descriptor: desc[0]}, ["display"], [thisvrg,"display"], desc[0].nsUri, []);
                code.push(express);
                e.content.splice(startIndex, 0, code.join(";\n") + ";\n");
            }
        }
        itemStack.removeListener('(iterationDone)', done );
    }
    itemStack.addListener("(iterationDone)", done );
}

function isMaking(syntax, stack , flag )
{
    if( stack[ syntax+"_making"] === true ){
        return true;
    }
    if( flag ===true )return false;
    stack[ syntax+"_making"] = true;
    return false;
}

function makingFlag(syntax, stack , flag )
{
    stack[ syntax+"_making"] = flag;
}

/**
 * 检查方法名在原型中是否存在冲突
 */
function checkMethodConflict(classModule,name, desc)
{
    var isStatic = !!(classModule.isStatic || desc.static());
    if( isStatic )
    {
        return classModule.static.hasOwnProperty(name) ? name : null;
    }

    do{
        if( classModule.id==="class" && classModule.proto.hasOwnProperty(name) )
        {
            return name;
        }
    }while( (classModule = classModule.inherit) );
    return null;
}

/**
 * 生成模块信息
 * @param stack
 * @returns {string}
 */
function makeModule(syntax, stack , classModule, config , force, compileFlag )
{
    if( !force && isMaking(syntax, stack ) )
    {
        return classModule;
    }

    //是否有指定需要一致的语法编译
    //如果不一致则不需要编译
    if( classModule["has_syntax_remove_"+syntax]===true || !isConformRunPlatform(classModule, syntax ) )
    {
        classModule["has_syntax_remove_"+syntax] = true;
        return classModule;
    }

    classModule.currentMakeSyntax = syntax;
    var id = stack.keyword();
    if( !(id==="class" || id==="interface" || id==="namespace") )
    {
        var content = stack.content().slice(0);
        var len = content.length;
        var j=0;

        if( stack.keyword()==="rootblock" )
        {
            var y = j;
            var rootContent =[];
            for(;y<len;y++)
            {
               
                if( content[y] instanceof Ruler.STACK )
                {
                    if( content[y].keyword()==="namespace" && !classModule.namespaces[ content[y].name() ].value )
                    {
                        classModule.namespaces[content[y].name()].value = getNamespaceValue(content[y], classModule);
                    }

                     //make root stack
                    if( !(content[y].keyword()==="package" 
                        || content[y].keyword()==="class" 
                        || content[y].keyword()==="interface" 
                        || content[y].keyword()==="namespace"
                        || content[y].keyword()==="use"
                        || content[y].keyword() === "metatype") )
                    {
                         //other expression
                         rootContent.push( toString(content[y], classModule ) );
                    }  

                }else if( content[y].value )
                {
                    //other identifier
                    if( content[y].value===";" ){
                         rootContent.push(";\n");
                    }else{
                        rootContent.push( content[y].value );
                    }
                }
            }
            classModule.rootContent[syntax] = rootContent.join("");
        }


        for(;j<len;j++)
        {

            if( content[j] instanceof Ruler.STACK )
            {

                if( content[j].qualifier() && "private,protected,public,internal".indexOf( content[j].qualifier() )< 0 )
                {
                    checkUseNamespace(content[j] ,classModule , content[j].qualifier() );
                }

                if( content[j].keyword()==="package" || content[j].keyword()==="class" || content[j].keyword()==="interface" || content[j].keyword()==="namespace"  )
                {
                    makeModule(syntax, content[j] , classModule, config );

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
                }
            }
        }
        return;
    }

    if( !classModule.isInternal && classModule.filename )
    {
        Utils.info('  Making ' + classModule.filename);
    }

    //当前编译的模块
    Iteration.currentModule = classModule;


    //如果类没有在包结构下
    var isRootClass = stack.parent() && stack.parent().keyword()==="rootblock" && stack.keyword() ==="class";

    //声明在包外的类
    if( isRootClass && classModule.hasPackage && classModule.isInternal && classModule.declared )
    {
        //classModule = classModule.declared[ stack.name() ];
        //包外类放在构建主模块时编译
        return;
    }

    var useNamespace = stack.getScopeOf().define("use");
    if( useNamespace )
    {
        for (var dns in useNamespace)
        {
            var _useNs = getmodule(getImportClassByType(classModule, dns),classModule);
            setClassModuleUsed(_useNs, classModule);
            setClassModuleUsed(_useNs.namespaces[ dns ] , _useNs.namespaces[ dns ] );
        }
    }

    //继承父类
    var inheritClass = null;
    if( classModule.inherit )
    {
        var realName = classModule.inherit;
        classModule.inherit.split(",").forEach(function(inheritName){

            //是否为包中的类
            if( classModule.declared && Object.prototype.hasOwnProperty.call(classModule.declared, inheritName )  && classModule.declared[ inheritName ].id==="class" )
            {
                inheritName = classModule.declared[ inheritName ].fullclassname;
            }else
            {
                inheritName = getImportClassByType( classModule, inheritName );
            }

            inheritClass = getmodule( inheritName , classModule );
            if( !inheritClass )
            {
                error('"'+inheritName+'" does exists');
            }

            //终结的类不可以扩展
            if( inheritClass.isFinal )
            {
                error( 'Cannot extends of class finalize the "'+inheritName+'".');
            }

            //继承的类型是否一致
            if( classModule.id !== inheritClass.id )
            {
                classModule.id==='class' ? error('Class can only extends the class') : error('Interface can only extends the interface');
            }

            //父类中不能出现当前类
            //不能出现嵌套引用
            doPrototype( inheritClass , function (parentModule)
            {
                if( parentModule.fullclassname === classModule.fullclassname )
                {
                    Iteration.currentModule = classModule;
                    Iteration.lastStack = stack.__stackExtends__  || stack.__stackImplements__;
                    error('Inherit conflicting the "'+inheritClass.fullclassname+'" class.');
                }
            });
            setClassModuleUsed( inheritClass, classModule );
            
        });
    }

    if( stack.keyword()==="namespace" )
    {
        if( !classModule.namespaces[ stack.name() ].value )
        {
            classModule.namespaces[ stack.name() ].value = getNamespaceValue( stack, classModule);
        }
        buildModule(syntax, classModule, config );
        return classModule;
    }

    if( stack.keyword() ==='interface' )
    {
        buildModule(syntax, classModule, config );
        return classModule;
    }

    var data = stack.content();
    var i = 0;
    var item;
    var len = data.length;
    var isstatic = stack.static();

    //除静态类没有构造函数外，其它类包括抽象类（但不可以实例化类）可以有构造函数
    if( !isstatic )
    {
        classModule.constructor.value = buildSyntax.getDefaultConstructor( classModule, inheritClass );
        classModule.constructor.isDefault = true;
        classModule.constructor.isConstructor = true;
    }

    //需要实现的接口
    checkInterface(classModule,stack);
    Iteration.currentModule = classModule;
    classModule.nsUri = getNamespaceUriByModule(classModule, classModule.privilege );

    var classProperties={};
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

            var hasCustomNs = false;
            if( item.qualifier() && "private,protected,public,internal".indexOf( item.qualifier() )< 0 )
            {
                checkUseNamespace(item, classModule , item.qualifier() );
                hasCustomNs = true;
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
            if( /*classModule.inherit &&*/ item.qualifier() !== 'private' )
            {
                info=findDescInPrototype( item.name(), classModule, !item.static() ? 'proto' : 'static' );
            }

            var desc =  ref[ item.name() ];
            var privilege = info ? info.privilege || "public": null;

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

            var refPropDesc =  desc ;
            if( !refPropDesc && classModule.classname === item.name() )
            {
                refPropDesc = classModule.constructor;
            }else if( info && info.defineMetaTypeList )
            {
                //desc.inheritDefineMetaTypeList = info.defineMetaTypeList;
            }

            //语法数据元, 编译当前指定的语法的内容
            if( refPropDesc.defineMetaTypeList && refPropDesc.defineMetaTypeList.Syntax )
            {
                //当前语法运行策略, 通过 Syntax 和 RunPlatform 元类型数据标识
                //var _stackScope = item.scope();
                //_stackScope["compile_policy_"+syntax]=true;

                var accessorName = item instanceof Ruler.SCOPE ?  item.accessor() : null;
                var syntaxMetatype = refPropDesc.defineMetaTypeList.Syntax;
                var syntaxResult = syntaxMetatype.filter(function (syntaxItem) {
                     return syntaxItem.syntaxs.indexOf( syntax ) >= 0;
                });
                if( syntaxResult.length > 1 )
                {
                    throw new ReferenceError('Metatype binding has already exists in same method for "'+item.name()+'"');
                }
                if( syntaxResult[0] && ( (!accessorName && syntaxResult[0].desc.__stack__ === item) ||
                   (accessorName && syntaxResult[0].desc.value && syntaxResult[0].desc.value[accessorName].__stack__=== item) )  )
                {
                    desc = syntaxResult[0].desc;
                    var cLeftParam = desc.paramType || [];
                    var cRightParam = refPropDesc.paramType || [];
                    if( desc.type !== refPropDesc.type || cLeftParam.join(",") !== cRightParam.join(",") )
                    {
                        throw new TypeError("Inconsistent parameter or return types. in the '"+item.name()+"' method.");
                    }
                    refPropDesc = desc;

                }else
                {
                    continue;
                }
            }

            refPropDesc.nsUri = getNamespaceUriByModule(classModule, refPropDesc.privilege || 'internal');
            refPropDesc.hasCustomNs = hasCustomNs;

            //编译视图元数据
            if( refPropDesc.defineMetaTypeList && refPropDesc.defineMetaTypeList.View )
            {
                 makeViewMetatype(config, classModule, refPropDesc.defineMetaTypeList.View, item);
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

                    var aDesc = item.accessor() && desc.value ? desc.value[ item.accessor() ]||{} : desc;
                    if( info.isReturn && !aDesc.isReturn )
                    {
                        error('Missing return types. for "'+item.name()+'"','type');
                    }

                    if( aDesc.type !== info.type )
                    {
                        error('The return types inconformity. for "'+item.name()+'"','type');
                    }
                    desc.inheritOwner = info.owner;
                }

                //如果是一个访问器需要检查编译后的名称是否存在冲突
                if( item.accessor() )
                {
                   var _accessName = Utils.getMethodName( item.name(), item.accessor() );
                   var conflictName = checkMethodConflict( classModule, _accessName, item );
                   if( conflictName ){
                       error('The "'+item.name()+'" accessor conflicts with method the "'+conflictName+'" ','reference');
                   }
                }

                //去掉函数名称
                //item.content().splice(1,1);
                //构造函数
                if( item.name() === stack.name() && !isstatic )
                {
                    if( classModule.isAbstract )
                    {
                        error( '"'+classModule.fullclassname +'" is abstract class cannot define constructor.');
                    }
                    item.addListener("(iterationDone)",function (e) {
                        e.content.splice(2,1, buildSyntax.getConstructorName(classModule) );
                        item.removeListener("(iterationDone)");
                    });
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

                var ret = 'undefined';
                var express = item.content()[1].content()[0];

                //除了绑定的元类型给定的值
                if( typeof desc.value === "string" && desc.bindable !==true && express.content().length < 2 )
                {
                    ret = desc.value;

                } else
                {
                    if (express.content().length > 2)
                    {
                        express.addListener("(iterationStart)",function (e) {
                            e.iteration.seek();
                            e.iteration.seek();
                            express.removeListener("(iterationStart)");
                        });

                        if( item.keyword() === 'const' )
                        {
                            express.addListener("(expressionEnd)", function (e) {
                                express.removeListener("(expressionEnd)");
                                if( e.content.length > 1 || e.content[0].coalition ){
                                    throw new TypeError("The value of the specified constant cannot be compound expression.");
                                }
                                if( !Utils.isScalar( getDescribeType(e.content[0]) ) )
                                {
                                    throw new TypeError("The value of the specified constant only can be a scalar type.");
                                }
                            }, -500);
                        }
                        ret = expression(express, classModule, desc.type);
                    }
                }

                var _propName = item.name();
                if( desc.bindable ===true )
                {
                    _propName = desc.accessorPropName;
                    desc.__defaultValue__ = ret;
                }

                //成员属性
                classProperties[ _propName ]={ id:item.keyword(),isStatic:!!item.static(),ns:item.qualifier(),value:ret, type:desc.type};

                //数据绑定的属性引用
                //这部分已经在编译代码时已做好了准备工作，无须再处理。
                if( desc.bindable ===true )
                {
                    continue;
                }
                //属性赋值
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

    if( classModule.id !=='interface' && !isstatic )
    {
        var event = {type:'(defineProperty)', props:classProperties };
        var strprops = stack.dispatcher(event) !== false ? buildSyntax.definePropertiesClassOf( globalsConfig, event.props, classModule) : "";
        classModule.constructor.value = classModule.constructor.value.replace('####{props}####', strprops);
    }
    buildModule(syntax, classModule, config );
    if( compileFlag !==true )
    {
        var useExternalClass = classModule.useExternalClassModules;
        for (var uc in useExternalClass)
        {
            if (!Object.prototype.hasOwnProperty.call(globals, useExternalClass[uc])) {
                var _stackModule = Compile.makeModuleByName(useExternalClass[uc]);
                if (_stackModule) {
                    makeModule(syntax, _stackModule, _stackModule.description, config);
                }
            }
        }
    }
    return classModule;
}

/**
 * 指定的模块是否有被使用
 * 根据语法来区分
 * @param classModule
 * @param syntax
 * @returns {boolean}
 */
function hasUsedModuleOf(classModule, syntax)
{
    if( classModule.has_used_in_syntax )
    {
        if( syntax )
        {
            return !!classModule.has_used_in_syntax[ syntax ];
        }
        return !!classModule.hasUsed;
    }
    return false;
}

/**
 * 为 currentModule 标记需要使用的外部类
 * @param classModule  使用的外部类
 * @param currentModule 当前类
 * @param flag
 */
function setClassModuleUsed(classModule, currentModule , flag )
{
    if( !(currentModule.useExternalClassModules instanceof Array) )
    {
        currentModule.useExternalClassModules = [];
    }

    var index = currentModule.useExternalClassModules.indexOf( classModule.fullclassname || classModule.type );
    var useSyntax = classModule.has_used_in_syntax||(classModule.has_used_in_syntax={});

    if( flag===true )
    {
        if( index>=0 )
        {
            currentModule.useExternalClassModules.splice(index,1);
        }
        classModule.hasUsed = false;
        useSyntax[ currentModule.currentMakeSyntax ] = false;

    }else
    {
        if( index < 0  && classModule !==currentModule )
        {
            currentModule.useExternalClassModules.push(classModule.fullclassname || classModule.type);
        }
        classModule.hasUsed = true;
        useSyntax[ currentModule.currentMakeSyntax ] = true;
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
    classModule.__namespaceUri__ || (classModule.__namespaceUri__ = {});
    var uri = classModule.__namespaceUri__[name];
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
                if (classModule.inherit && !globals.hasOwnProperty(classModule.inherit)  && classModule.id==="class")
                {
                    var inheritClass = getmodule(getImportClassByType(classModule, classModule.inherit),classModule);
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
            namespaceUriHashValue[ uri ]="";

        }else
        {
            namespaceUriHashValue[ uri ] = String.fromCharCode( Math.floor( Math.random()*26 )+(Math.random() * 122 > 66 ? 'a' : "A" ).charCodeAt(0) )+namespaceUriHashValueCounter+"";
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


function makePrivateModuleClass(syntax, description, config )
{
    var str="";
    var declared = description.declared;
    for(var p in declared )
    {
        if( declared[p].id==="class" )
        {
            var o = declared[p];
            makeModule(syntax, o.rootStack, o, config );
            var codeModule = buildModule(syntax,o, config);
            if( codeModule )
            {
                if( description.currentMakeSyntax ==="javascript" )
                {
                    str += buildSyntax.defineProperty(o.classname, codeModule);
                }else{
                    str+=codeModule;
                }
            }
        }
    }
    return str;
}

var namespacesHashMap={};

/**
 * 将描述信息构建成类模块
 * @param o
 * @returns {string}
 */
function buildModule(syntax, o , config, force )
{
    var makeContent = o.makeContent || (o.makeContent={});
    if( !force && isMaking(syntax,o) )
    {
        return makeContent[ syntax ];
    }

    var internalCode = "";
    if( o.inherit && o.id !== "namespace" )
    {
        o.inherit.split(",").forEach(function(inheritName)
        {
            var inheritClass = getmodule( getImportClassByType(o,inheritName), o );
            if( hasUsedModuleOf(o, syntax) )
            {
                setClassModuleUsed(inheritClass,inheritClass);
            }
            //setClassModuleUsed(inheritClass,o);
            if( inheritClass.nonglobal===true )
            {
                //var iCode =  buildModule(syntax, inheritClass , config, force );
                if( inheritClass.isInternal )
                {
                    //internalCode += "var " + inheritClass.classname + "=" + iCode;
                }
            }
        });
    }

    var importMap={};
    for (var i in o.import)
    {
        var importModule = getmodule( getImportClassByType(o, i),o );
        if( !hasUsedModuleOf( importModule, syntax ) )
        {
            continue;
        }
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

        //if( importModule.nonglobal===true )
        //{
            importMap[i] = importModule;// buildSyntax.formatImportClassPath( o.import[i], importModule );
        //}
    }

    if( o.id==="namespace" )
    {
        makeContent[ syntax ] = "";
        for( var n in o.namespaces )
        {
            var fullname = o.package ? o.package + "." + n : n;
            namespacesHashMap[ o.namespaces[n].value ] = getNamespaceUriByModule(o, n);
            o.nsUri = namespacesHashMap[ o.namespaces[n].value ];
            makeContent[ syntax ] +=  buildSyntax.bulidNamespaceClassValueOf( n, fullname, o, importMap, o.namespaces[n].value , config );
        }
        return makeContent[ syntax ];
    }

    var propertiesAndMethod = "";

    //非包外类
    if( !o.isInternal )
    {
        //私有命名空间
        for(var n in o.namespaces)
        {
            if( o.namespaces[n].id==="namespace")
            {
                namespacesHashMap[o.namespaces[n].value] = getNamespaceUriByModule(o, n);
                propertiesAndMethod+=buildSyntax.newInstanceNamespaceOf( n , o.namespaces[n].value );
            }
        }

        //全局块的中的代码
        if( o.rootContent[ syntax ] )
        {
            internalCode += o.rootContent[ syntax ];
        }
        internalCode += makePrivateModuleClass(syntax,o, config);

    }else{
        //console.log( o.fullclassname );
        // process.exit();
    }

    var inheritModule = null;
    if( o.inherit ){
        inheritModule = o.inherit.split(",").map(function(name){
            return getmodule( getImportClassByType(o, name), o )
        });
    }

    var externalProperties=[];
    propertiesAndMethod += buildSyntax.buildClassPropertiesAndMethod(o, inheritModule, config, syntax, externalProperties );
    if( externalProperties.length > 0 )
    {
        if( internalCode ) {
            externalProperties.push(internalCode);
        }
        internalCode = externalProperties.join("\n");
    }

    var _private =  getNamespaceUriByModule( o, "private");
    var _protected =  getNamespaceUriByModule( o, "protected");
    var _internal =  getNamespaceUriByModule( o, "internal");
    //var _public =  getNamespaceUriByModule( o, "public");
    var uri    =   [_private, _protected,_internal];
    
    makeContent[ syntax ] =  buildSyntax.buildClassStructure( o.classname, o, inheritModule, importMap, propertiesAndMethod, internalCode, config, uri );
    return makeContent[ syntax ];
}

var buildSyntax;
function getBuildSyntax( syntax )
{
    buildSyntax = Compile.syntaxBuilder[ syntax ];
    return buildSyntax;
}

/**
 * 开始生成代码片段
 */
function Compile(syntax, module, description, config , flag )
{
    globals = config.globals;
    globalsConfig =config;
    compileSyntax = syntax;
    getBuildSyntax( syntax );
    makeModule(syntax, module, description, config, false, flag );
    if( !flag ){
       setClassModuleUsed( description, description );
    }
    return namespacesHashMap;
}

Compile.global_route_unique_hash={};
Compile.makingFlag = makingFlag;
Compile.isConformRunPlatform = isConformRunPlatform;
Compile.isClientSupportOf = isClientSupportOf;
Compile.hasUsedModuleOf = hasUsedModuleOf;
Compile.setClassModuleUsed = setClassModuleUsed;
Compile.getDefinedShortClassName = getDefinedShortClassName;
module.exports=Compile;