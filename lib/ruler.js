const Utils = require('./utils.js');

/**
 * 保护的语法关键词 , 不可当参数名， 不可声明为变量
 * @type {string[]}
 */
const reserved = [
    'static','public','private','protected','internal','package','override','final','dynamic','as','use',
    'extends','import','class','var','function','new','typeof','const','interface','abstract','implements','namespace',
    'is','instanceof','if','else','do','while','for','in','of','switch','case','super',
    'break','default','try','catch','throw','Infinity','this','debugger','eval',
    'finally','return','null','false','true','NaN','undefined','delete'
];

/**
 * 元类型
 * @type {string[]}
 */
const metaType = ['Bindable','Embed','Style','Event','Syntax','Skin'];

/**
 * 验证是否可以声明为参数名或者变量名
 * @param s 准备声明的变量名或者参数名
 * @param include 包括这里指定的，不可以再声明
 * @returns {boolean}
 */
function checkStatement(s, include )
{
    return Utils.isPropertyName(s) && reserved.indexOf( s )<0 && ( !include || include.indexOf(s)<0 );
}

/**
 * 获取一个导入类的名称
 * @param name
 * @param scope
 * @returns {*}
 */
function getImportClassName(name, scope )
{
     var def = scope.define();
     if( def.hasOwnProperty(name) )
     {
         return {id:'class','type':def[name].type,'classname':def[name].classname, 'fullclassname':def[name].fullclassname};
     }
     for (var i in def)if (def[i].id === 'class' && def[i].fullclassname === name )
     {
         return {id:'class','type':'('+i+')','classname':i, 'fullclassname':name};
     }
     var classname = name.replace(/\./g,'_');
     return {id:'class','type':'('+classname+')','classname':classname, 'fullclassname':name};
}

/**
 * 验证定义的类型是否存在
 * @param s
 * @param defined
 * @returns {boolean}
 */
function checkStatementType( type , scope , globals )
{
    if( type==='*' || type==='void' )return true;
    var val;
    if( scope )
    {
        val = scope.define( type ) || scope.define('this');
        if( !( val && (val.fullclassname === type || val.classname === type) ) )
        {
            val=null;
            while ( scope.keyword() !=='class' && scope.parentScope )scope=scope.parentScope;
            //这里判断是否使用命名定义的类型
            var def = scope.define();
            for (var i in def)if (def[i].id === 'class' && def[i].fullclassname === type)
            {
                val = def[i];
                break;
            }
        }
    }

    //是否为全局类型
    if( !val && globals )
    {
        val =globals[type];
        if(val && val.id==='class' )return {id:'class','type':'('+val.type+')','classname':type, 'fullclassname': type };
    }
    return val && val.id==='class' ? val : null;
}

// 验证分段是否有效
function checkSegmentation( arr , require )
{
    return arr instanceof Array && arr.length > 0 ? arr.length % 2 === 1 : !require && arr.length===0 ;
}

// 对称符
var balance={'{':'}','(':')','[':']'};

//语法验证
var syntax={};
syntax["package"]=function (event)
{
    event.prevented=true;
    if( this.scope().keyword() !=='rootblock' )this.error();
    var s =  new Scope('package', '(block)' );
    this.add( s );
    var self = this;
    var name = [];
    this.loop(function(){
        this.seek();
        if( this.current.id === '{' || this.current.id === '(keyword)' || this.current.value===';' )return false;
        if( this.current.value !=='.' && !Utils.isPropertyName( this.current.value ) )self.error('Invalid package name');
        name.push( this.current.value );
        return true;
    });

    if( !checkSegmentation( name ) )this.error('Invalid package name');
    this.scope().name( name.join('') );
    if( this.current.value===';' )
    {
        this.loop(function(){
            this.step();
            if( this.scope()===s )return false;
            return true;
        });

    }else
    {
        if (this.current.id !== '{') this.error('Missing token {');
        this.loop(function () {
            if (this.next.id === '}') return false;
            this.step();
            return true;
        });
        this.seek();
        if (this.current.id !== '}') this.error('Missing token }');
    }
    if( this.scope() !== s )this.error('Syntax is not end');
    this.scope().switch();
};

function importClass( classname, filename , scope )
{
    //检查文件路径名是否有效
    if( !checkSegmentation( filename, true ) )this.error('Invalid import');
    //如果没有指定别名，默认使用类名
    classname = classname || filename[filename.length-1];
    var full = filename.join("");
    var def =  scope.define(classname);

    //如果类名已定义则取全名
    if( def )
    {
        if( def.fullclassname === full ){
            return;
        }
        classname = full;
    }

    var name = classname.replace(/\./g,'_');
    var desc = {'type':'('+classname+')','id':'class','fullclassname':full,'classname':name ,'import':true};

    //防止定义重复的类名
    if( scope.define(name) )error('class name the "'+classname+'" is already been defined');

    //将类描述信息定义到域中
    scope.define(name , desc );
    //加入到被保护的属性名中
    //this.config('reserved').push( name );
}

/**
 * 引用模块
 * @param event
 */
syntax['import']=function (event)
{
    event.prevented=true;
    // import 只能出现在 package 或者 rootblock 中
    if( this.scope().keyword() !=='package' && this.scope().keyword() !=='rootblock' )
    {
        this.error('Unexpected import ', 'syntax');
    }
    var index = this.scope().length();
    this.add( new Stack('expression', '(string)' ) );
    var s = this.scope();
    var filename=[];
    var name=null;
    this.loop(function()
    {
        this.seek();

        //如果定义了别名
        if( this.current.value==='as' )
        {
            name = this.seek().value;
            if ( !Utils.isPropertyName(name) )this.error('Invalid alias for '+name );
            return false;
        }

        //目录下的所有文件
        if( this.current.value==='*' && this.prev.value==='.' )
        {
            filename.pop();
            var files = Utils.getDirectoryFiles( Utils.getResolvePath( this.config('path'), filename.join('') ) );
            files.forEach(function (a) {
                importClass(null,filename.concat('.', Utils.getFilenameByPath(a) ),  s.scope() );
            });
            filename=[];
            return false;
        }

        //是否到达结尾
        if( this.current.id === ';' || this.current.id==='(keyword)' || s.close() )return false;

        //是否有效
        if ( this.current.id !== '.' && !Utils.isPropertyName(this.current.value) )this.error('Invalid filename of import');
        filename.push( this.current.value );
        return true;
    });

    //关闭此语法
    this.end();

    //从父级中删除
    s.parent().content().splice( index, s.parent().length()-index );
    if( filename.length > 0 ){
        importClass.call(this, name , filename, s.scope() );
    }
};

var keyword_all ='private,protected,internal,public,static,override,final,dynamic,abstract';
var keyword_no_ns='static,override,final,dynamic,abstract';

var property_keyword = syntax[ keyword_all ]=function(event)
{
    event.prevented=true;
    var scope = this.scope();
    var id = scope.keyword();
    if( id !=='package' && id !=='class' && id !=='interface' && id !=="rootblock" )
    {
        this.error('Unexpected keyword "'+event.type+'"','syntax', this.current );
    }
    var arr = [event.type];
    var self= this;
    var n;
    var description={};
    description[event.type]=this.current;
    this.loop(function(){
        if( (event.ns===true ? keyword_no_ns : keyword_all).indexOf( this.next.value )<0  && this.next.id !== "(identifier)" )return false;
        n = this.seek();
        if( arr.indexOf(n.value) >=0  )self.error();
        arr.push( n.value );
        description[n.value]=n;
        return true;
    });

    var q = '';
    var s ='';
    var o = '';
    var f = '';
    var d = '';
    var a = '';
    for (var i =0; i<arr.length; i++)
    {
        switch (arr[i])
        {
            case 'static'  :s='static'  ;break;
            case 'override':o='override';break;
            case 'dynamic':d='dynamic';break;
            case 'abstract':a='abstract';break;
            case 'final'   :
                f='final';
                if( arr.indexOf('override')>=0 )this.error();
                break;
            default:q=arr[i];
        }
    }

    n = this.seek();

    // override 只能出现在函数的修饰符中
    if( o && n.value !== 'function' )this.error('Unexpected keyword override.');
    if( d && n.value !== 'class' )this.error('Unexpected keyword dynamic.');

    if( o && this.scope().keyword() === 'class' && !this.scope().extends() )
        this.error('The "override" only can be used in subclasses.');

    //如是静态类，那么整个类不能实例化
    if( scope.keyword() ==='class' && scope.static() )s = scope.static();
    if( n.value==='class' || n.value === 'function' || n.value === 'interface'  )
    {
        if( n.value === 'interface' )
        {
            this.add( new Interface() );

            //接口访问控制只能是 public or internal
            if( q !=='public' &&  q !=='internal' )
            {
                this.error('class in the namespace can only is the public or internal' );
            }

        }
        else if( n.value==='class' )
        {
            this.add( new Class() );
            this.scope().abstract( a );

            //类的访问控制只能是 public or internal
            if( q !=='public' &&  q !=='internal' )
            {
                this.error('class in the namespace can only is the public or internal' );
            }

        }else
        {
            if(a)this.error('The abstract can only appear in the class attribute');
            this.add( new Scope(n.value, '(block)') );
        }

        if( scope.keyword() === 'interface' || n.value === 'interface' )
        {
            var str = s || o || f || d;
            if( str )this.error('"'+str+'" cannot appear in the interface' );
            if( q !== 'public' )this.error('can only is "public" qualifier in the interface' );
        }

        this.scope().static( s );
        this.scope().qualifier( q );
        this.scope().override( o );
        this.scope().final( f );
        this.scope().dynamic( d );
        this.scope().description=description;
        this.check();

    }else if( n.value==='var' || n.value==='const' )
    {
        this.add( new Stack(n.value, '(*)' ) );
        this.scope().static( s );
        this.scope().qualifier( q );
        this.scope().final( f );
        this.scope().description=description;
        this.check();

    }else if( n.value==='namespace' )
    {
        this.add( new Stack(n.value, '(*)' ) );
        this.scope().static( 'static' );
        this.scope().qualifier( q );
        this.scope().description=description;
        this.check();

    }else
    {
        this.error('Invalid identifier '+n.value );
    }
    return true;
};

syntax['class']=function( event )
{
    event.prevented=true;
    if( this.scope().keyword() !=='class' )this.add( new Class() );
    if( this.scope().parent().keyword() !=='package' && this.scope().parent().keyword() !=='rootblock' )
    {
        this.error("Unexpected identifier class","syntax", this.current );
    }

    var stack = this.scope();
    var n = this.seek();

    //检查类名是否合法声明
    if( !checkStatement(n.value) )this.error('Invalid class name', "syntax", this.current );

    //设置类名
    var name = n.value;
    stack.name( name );

    //完整的类名
    var classname = this.scope().parent().name() ? this.scope().parent().name()+'.'+name : name;

    //如果此类名与导入的类名相同，则导入的类型设置 全名限定类型
    var def = stack.parent().scope().define();
    for (var i in def)if( name===def[i].classname )
    {
        def[i].type = def[i].fullclassname;
        def[i].classname = def[i].fullclassname.replace(/\./g,'_');
        stack.parent().scope().__define__[ def[i].classname ] = def[i];
        delete stack.parent().scope().__define__[name];
        break;
    }

    //实例作用域
    stack.scope('proto').define('this', {'type':'('+name+')','id':'class','fullclassname':classname,'classname':name} );
    stack.scope('proto').define(name, {'type':'('+name+')','id':'class','fullclassname':classname ,'classname':name} );

    //静态类作用域
    stack.scope('static').define(name, {'type':'(Class)','id':'class','fullclassname':classname ,'classname':name} );

    //将类名加入被保护的属性名中
    //this.config('reserved').push( name );

    do{
        n = this.seek();
        //是否有继承或者实现接口
        if( n.id==='(keyword)' )
        {
            //扩展父类
            if( n.value==='extends'  )
            {
                stack.__stackExtends__=this.current;
                var className = getTypeName.call(this);
                var p = getImportClassName(className, stack.parent().scope() );
                stack.extends( p.classname );
                stack.scope('proto').define('super',p);
            }
            //实现接口
            else if( n.value==='implements'  )
            {
                stack.__stackImplements__=this.current;
                var interfaces=[];
                do {
                    var interfaceName = getTypeName.call(this);
                    var p = getImportClassName(interfaceName, stack.parent().scope() );
                    //if (!checkStatementType(interfaceName, stack.parent().scope()))this.error('"' + interfaceName + '" is not import');
                    interfaces.push( p.classname );
                }while ( this.next.value===',' );
                stack.implements( interfaces );
            }
        }
    }while ( n.id === '(keyword)' );

    //必须要{开始正文
    if( this.current.id !== '{' )this.error('Missing token {');

    //获取正文
    this.loop(function(){
        if( this.next.id === '}' ) return false;
        this.step();
        return true;
    });
    //必须要}结束正文
    this.seek();
    if( this.current.id !=='}' ) this.error('Missing token }');
    if( this.scope() !== stack )this.error('Syntax is not end');
    this.scope().switch();
};

syntax['interface']=function( event )
{
    event.prevented=true;
    if( this.scope().keyword() !=='interface' )this.add( new Interface() );
    if( this.scope().parent().keyword() !=='package' )this.error();

    var stack = this.scope();
    var n = this.seek();
    var name = n.value;

    //检查接口名是否合法声明
    if( !checkStatement(name) )this.error('Invalid interface name');

    //设置接口名
    stack.name( name );

    //完整的类名
    var classname = this.scope().parent().name() ? this.scope().parent().name()+'.'+name : name;

    //类名不能与导入的类名相同
    var def = stack.parent().scope().define();
    for (var i in def)if( def[i].fullclassname === classname )
    {
        this.error('"'+name+'" is already been declared',this.current);
    }

    //实例作用域
    stack.scope().define(name, {'type':'('+name+')','id':'interface','fullclassname':classname ,'classname':name} );

    //将类名加入被保护的属性名中
    //this.config('reserved').push( name );
    n = this.seek();
    //是否有继承接口
    if( n.id==='(keyword)' && n.value==='extends' )
    {
        stack.__stackExtends__=this.current;

        //扩展父类
        var className = getTypeName.call(this);
        var p = checkStatementType(className, stack.parent().scope() );
        if (!p)this.error('"' + className + '" is not import');
        stack.extends( p.classname );
        this.seek();
    }

    //必须要{开始正文
    if( this.current.id !== '{' )this.error('Missing token {');

    //获取正文
    this.loop(function(){
        if( this.next.id === '}' ) return false;
        this.step();
        return true;
    });
    //必须要}结束正文
    this.seek();
    if( this.current.id !=='}' ) this.error('Missing token }');
    if( this.scope() !== stack )this.error('Syntax is not end');
    this.scope().switch();
};

syntax['var,let']=function (event)
{
    event.prevented=true;
    if(this.scope().keyword() !== event.type )this.add( new Stack( event.type, '(*)' ) );
    var variable = this.scope();
    var statement = new Stack('statement' , '(expression)');
    this.add( this.current );
    this.scope().name( this.next.value );
    var parent = this.scope().parent();

    //var 只能出现在块级或者for中
    if( !(parent instanceof Scope) )
    {
        while( parent && parent.keyword() !== 'for' && !(parent instanceof Scope) )parent = parent.parent();
        if( !parent )this.error();
    }

    if( this.next.id==='(keyword)' )this.error('"'+this.next.value+'" is be keyword of reserved',  this.next );
    if( this.next.type !=='(identifier)' )this.error('Invalid identifier for '+this.next.value,  this.next );
    this.add( statement );
    this.step();
    if( parent.keyword()==='for' )
    {
        //end expression
        if( this.scope().keyword()==='expression') this.scope().switch();
        //end statement
        if( this.scope()===statement )this.scope().switch();
        //end var
        if( this.scope()===variable )this.scope().switch();
    }
};

syntax['const']=function (event)
{
    event.prevented=true;
    if(this.scope().keyword() !== event.type )this.add( new Stack( event.type, '(*)' ) );
    this.add( this.current );
    if( this.next.type!=='(identifier)' || this.next.id==='(keyword)' )this.error('Invalid identifier for '+this.next.value,  this.next );
    if( !(this.scope().parent() instanceof Scope) )this.error('Invalid const');
    this.scope().name( this.next.value );
    this.add( new Stack('statement' , '(expression)') );
    this.step();
};

syntax['namespace']=function (event)
{
    event.prevented=true;
    if(this.scope().keyword() !== event.type )
    {
        this.add( new Stack( event.type, '(*)' ) );
    }
    this.add( this.current );
    if( this.next.type!=='(identifier)' || this.next.id==='(keyword)' )this.error('Invalid identifier for '+this.next.value,  this.next );
    this.scope().name( this.next.value );
    this.add( new Stack('statement' , '(expression)') );
    this.step();
};

syntax['use']=function (event)
{
    event.prevented=true;
    if(this.scope().keyword() !== event.type )
    {
        this.add( new Stack( event.type, '(*)' ) );
    }
    var stack = this.scope();
    this.add( this.current );
    if( this.next.value !=='namespace' )this.error('Invalid identifier for '+this.next.value,  this.next );
    this.seek();
    if( this.next.type!=='(identifier)' || this.next.id==='(keyword)' )this.error('Invalid identifier for '+this.next.value,  this.next );
    this.seek();
    var scope = this.scope().getScopeOf();
    if( scope.keyword()==="class" )
    {
        scope = scope.parent().getScopeOf();
    }
    var use = scope.define('use');
    if( !use )
    {
        use = {};
        scope.define('use',use);
    }
    use[ this.current.value ]="namespace";
    this.scope().name( this.current.value );
    this.end();
    var content = stack.parent().content();
    var index = content.indexOf( stack );
    content.splice( index, 1);
    var s =  stack.parent().previous();
    if( s && s.value===";" )
    {
        index = content.indexOf( s );
        content.splice( index, 1);
    }
};

syntax['function']= function(event){

    event.prevented=true;
    var isassign = this.prev && (this.prev.value==='=' || this.prev.value===':');
    if( this.scope().keyword() !=='function' || this.scope().content().length > 0 )
    {
        this.add( new Scope( event.type, '(*)' ) );
    }
    this.add( this.current );
    var stack = this.scope();
    var n = this.seek();
    var name='';
    var isClassOrInterface = stack.parent().keyword() ==='class' || stack.parent().keyword() ==='interface';
    var scope = stack.getScopeOf().parentScope;
    if( !isFunScope(scope) )scope = scope.getScopeOf();
    if( isClassOrInterface && (n.value === 'get' || n.value === 'set') && this.next.id !== '(' )
    {
        stack.accessor(n.value);
        n = this.seek();
    }

    var name_stack= n;
    if( n.id !== '(' )
    {
        name = n.value;
        if ( !checkStatement( name ) )this.error();
        stack.name( name );
        this.add( this.current );
        n = this.seek();
    }

    // 类中定义的方法不能为匿名函数
    if( stack.parent().keyword() === 'class' && !stack.name() )
    {
        this.error('Missing function name');
    }
    // 方法中的函数只能是匿名
    /*else if( isClassOrInterface && stack.name() )
    {
        this.error('Can only be an anonymous function');
    }*/

    this.add( this.current );
    if( n.id !== '(' )this.error('Missing token (');
    var param=null;

    //获取函数声明的参数
    if( this.next.id !==')' )
    {
        param = new Stack('statement', '(expression)');
        this.add( param );
        this.step();
        this.scope().switch();
        if( this.scope().keyword() === 'statement' )this.scope().switch();
    }

    //类成员属性必须定义在类作用域中
    if( stack.parent().keyword() === 'class' )
    {
        //验证访问器的参数
        if( stack.accessor() === 'get' && ( param && param.length() > 0 ) )this.error('getter accessor cannot has parameter');
        if (stack.accessor() === 'set' && ( !param || param.length() !== 1 ) )this.error('setter accessor be only one parameter');
    }

    this.add( this.seek() );
    if( this.current.id !==')' ) this.error('Missing token )');
    var type='*';

    //返回类型
    if( this.next.id===':' )
    {
        this.seek();
        type = getTypeName.call(this);
        var currentType = this.current;

        /*if( !checkStatementType(type, stack.scope() , this.config('globals') ) )
        {
            this.error( type+' is not defined');
        }*/

        if( type !=='void' && stack.parent().keyword() !=='interface' )
        {
            stack.addListener('(switch)', function (e) {
                if( !this.isReturn )error('Must be return','', currentType);
            });
        }
    }

    var is=false;
    //构造函数不能有返回值
    if( isClassOrInterface && stack.parent().name() === stack.name() && !stack.static() )
    {
        type='void';
        is=true;
        //抽象类不能定义构造函数
        if( stack.parent().abstract() )this.error('the abstract class cannot define constructor');
        if( stack.parent().keyword() ==='interface' )this.error('the interface cannot define constructor');
        //构造函数的修饰符必须为公有的
        if( !stack.qualifier() )
        {
            stack.qualifier("public");
        }
        if( stack.qualifier() !== 'public' )this.error('can only is public qualifier of constructor');
    }

    //返回类型
    stack.returnType = type;

    //定义到作用域中
    if( name && !isassign )
    {
        var ns = stack.qualifier() || 'internal';
        if( "private,protected,public,internal".indexOf(ns) > -1 )
        {
            ns='';
        }

        //不能重复声明函数
        var val = scope.define( ns || name );

        //如果有自定义命名空间
        var useNs;
        if( ns )
        {
            if( val )
            {
                useNs = val;
                val = val.hasOwnProperty(name) ? val[name] : null;
            }else
            {
                useNs = {};
                scope.define( ns , useNs );
            }
        }

        if( val && val.scope === scope )
        {
            if( !stack.accessor() || stack.accessor() === val.get || stack.accessor() === val.set )
            {
                this.error('function "'+name+'" has already been declared', name_stack );
            }

            //同一访问器的修饰符必须一致
            if( stack.accessor() && val.qualifier !== stack.qualifier() )
            {
                this.error('The same accessor modifier must be consistent for "'+stack.qualifier()+'"', stack.description[ stack.qualifier() ] );
            }
            if( stack.accessor() )val[ stack.accessor() ]=stack.accessor();
        }
        else if( is )
        {
           if( stack.parent().construct() )this.error('function "'+name+'" has already been declared', name_stack );
           stack.parent().construct( stack );

        }else
        {
            var obj = {
                type: '(' + type + ')',
                'id': 'function',
                'qualifier': stack.qualifier(),
                'static': stack.static(),
                'scope': scope,
                'reference':stack
            };
            if (stack.accessor())obj[stack.accessor()] = stack.accessor();

            if( useNs )
            {
                useNs[name]=obj;
            }else {
                scope.define(name, obj);
            }
        }
    }

    //接口中没有函数体
    if( stack.parent().keyword() ==='interface' )
    {
        return this.end();
    }

    this.add( this.seek() );
    if( this.current.id !=='{' ) this.error('Missing token {');
    this.loop(function(){
        if( this.next.value==='}')return false;
        this.step();
        return true;
    });
    this.add( this.seek() );
    if( this.current.id !=='}' ) this.error('Missing token }');
    if( this.scope() !== stack ){
        this.error('Syntax is not end');
    }
    this.scope().switch();
    if( this.scope().keyword()==='expression' )
    {
        this.end();
    }
};


syntax['else']= function(event)
{
    var p = this.scope().previous();
    if( !(p instanceof Scope) || p.keyword() !=='if' )this.error();
    event.prevented=true;
    var s = new Scope('else', '(block)' );
    this.add( s );
    this.add( this.current );
    if( this.next.value==='if' )
    {
        this.scope().switch();
        this.step();

    }else if( this.next.id === '{' )
    {
        this.add( this.seek() );
        this.loop(function(){
            if( this.next.id==='}' )return false;
            this.step();
            return true;
        });
        this.add( this.seek() );
        if( this.current.id !=='}' )this.error('Missing token }');
        if( s !== this.scope() )
        {
            this.error('Syntax is not end');
        }
        this.scope().switch();

    }else
    {
        this.step();
    }
};

syntax['do,try,finally'] = function(event)
{
    event.prevented = true;
    var s = new Scope( event.type, '(block)' );
    this.add( s );
    this.add( this.current );
    if( event.type==='finally' )
    {
        var p = this.scope().parent().previous(-2);
        if( !(p instanceof Stack) || !(p.keyword() === 'catch' || p.keyword()==='try') ) this.error('Missing try "'+event.type+'"');
    }

    this.add( this.seek() );
    if( this.current.id !== '{' ) this.error('Missing token {');
    this.loop(function(){
        if( this.next.id==='}' )return false;
        this.step();
        return true;
    });
    this.add( this.seek() );
    if( this.current.id !== '}' )this.error('Missing token }');
    if( s !== this.scope() )this.error('Syntax is not end');
    this.scope().switch();
    if( event.type==='do' && this.next.value !== 'while' )this.error('Missing condition "while"');
};

syntax['if,switch,while,for,catch'] = function(event)
{
    event.prevented = true;
    var s =  new Scope( event.type, '(block)' );
    this.add(s);
    if( event.type==='catch' )
    {
        var p = this.scope().parent().previous(-2);
        if( !(p instanceof Scope) || p.keyword() !== 'try' ) this.error('Missing try "'+event.type+'"');
    }
    this.add( this.current );
    this.add( this.seek() );
    if( this.current.value !== '(' ) this.error('Missing token (');
    if( this.next.value===')' )this.error('Missing condition');
    var condition = new Stack( event.type==='catch' ? 'statement' : 'condition','(expression)');
    this.add( condition );
    if( event.type ==='for' )
    {
        var self= this;
        var num=0;
        var seek= function (e) {
            if( e.__proxyTarget__.value==='in' || e.__proxyTarget__.value==='of' )num=2;
            if( e.__proxyTarget__.value===';' )num++;
            if( e.__proxyTarget__.value===')' )
            {
                if( num !==2 )this.error('Invalid condition in "for"');
                self.removeListener('(seek)', seek );
            }
        };
        this.addListener('(seek)',seek);
    }

    //获取条件表达式
     this.loop(function(){
         if( this.next.value===')')return false;
         this.step();
         return true;
     });
    if( this.scope()===condition )condition.switch();
    this.add( this.seek() );
    if( this.current.value !== ')' )this.error('Missing token )');
    if( this.scope().keyword() !== event.type )this.error('Not end expression');
    if( event.type !=='for' && condition.length() > 1 )this.error('Invalid condition');

    // switch catch 必须要 {}
    if( ( event.type === 'switch' || event.type === 'catch' ) && this.next.id!=='{' )this.error('Missing token {');
    if( this.next.id==='{' )
    {
        this.add( this.seek() );
        this.loop(function () {
            if( this.next.value ==='}')return false;
            this.step();
            return true;
        });
        this.add( this.seek() );
        if( this.current.id !== '}' )this.error('Missing token }');
        if( this.scope()!==s )this.error();
        this.scope().switch();
        return true;
    }
    s.endIdentifer = ';';
    if( event.type ==='while' )
    {
        var p = this.scope().parent().previous(-2);
        if( !(p instanceof Scope) || p.keyword() !=='do' )
        {
            if( Utils.isRightDelimiter(this.next.value) )this.error('Missing expression');
            this.step();
        }else
        {
            this.end();
        }

    }else
    {
        this.step();
    }
};

syntax["return"]=function(event)
{
    event.prevented=true;
    if( !(this.scope() instanceof Scope) )this.error();
    this.add( this.current );
    var fn = this.scope().getScopeOf();
    fn.isReturn=false;
    if( Utils.isLeftDelimiter(this.next.value) || Utils.isIdentifier( this.next ) || Utils.isLeftOperator(this.next.value) || this.next.value==='function' )
    {
        if( fn.accessor() === 'set' )this.error('setter cannot has return');
        if( !fn )this.error('Unexpected identifier return');
        if( fn.type()==='(void)' )this.error('Do not return');
        this.step();
        fn.isReturn=true;

    }else
    {
        this.seek();
        this.end();
    }
};

syntax["case,default"]=function(e)
{
    e.prevented=true;
    if( this.scope().keyword() !=='switch' )this.error();

    //判断是否有结束或者换行
    if( !(this.prev.value===';' || this.prev.value==='}' || this.prev.line !== this.current.line ) )this.error();

    //case 需要表达式
    if( this.next.value===':' && e.type==='case' ) this.error('Missing expression');

    //default 不需要表达式
    if( this.next.value!==':' && e.type==='default' ) this.error();
    this.add( this.current );
    if( e.type==='default' )
    {
        this.add( this.seek() );
    }
    this.step();
};

syntax["break,continue"]=function(e)
{
    e.prevented=true;
    var id = this.scope().keyword();
    if( e.type==='continue' )
    {
        if ( !(id=== 'for' || id==='while') )this.error();
    }else if( e.type ==='break' )
    {
        if ( !(id=== 'for' || id==='while' || id==='switch') )this.error();
    }
    if( this.scope().keyword()==='expression' )this.error();
    if( !(this.scope() instanceof Scope) )this.error();
    this.add( this.current );

    if( this.next.id ==='(identifiler)' )
    {
        this.step();
    }else {
        this.end();
    }
};

syntax["debugger"]=function (e)
{
    if( !(this.prev.value===';' || this.prev.value==='}' || this.prev.line !== this.current.line ) )this.error();
    if( !(this.scope() instanceof Scope) )this.error('Unexpected identifier debugger');
    this.add( new Stack('expression','(*)') );
    this.add( this.current );
    this.end();
};

syntax["throw"]=function (e)
{
    e.prevented=true;
    if( !(this.scope() instanceof Scope) )this.error('Unexpected identifier throw');
    if( this.scope().keyword()!=='expression')this.add( new Stack('expression', '(*)' ) );
    this.add( this.current );
    this.step();
};

syntax["this"]=function (e)
{
    e.prevented=true;
    if( this.scope().keyword()!=='expression' )this.add( new Stack('expression','(*)') );
    var fun = this.scope().getScopeOf();
    if( fun.parent().keyword() ==='class' && fun.static() )this.error('this is not defined in static function');
    this.add( this.current );
    if( this.next.type==='(operator)' || this.next.value==='[' )
    {
        this.step();

    }else
    {
        this.end();
    }
};

syntax["super"]=function (e)
{
    e.prevented=true;
    if( this.scope().keyword() !== 'expression' )this.add( new Stack('expression','(*)') );
    var fun = this.scope().getScopeOf();
    if( !fun || fun.parent().keyword() !=='class' || fun.static() )this.error();
    if( !fun.parent().extends() )this.error('No parent class inheritance');

    //构造函数中有调用超类
    if( !fun.called && fun.parent().keyword() ==='class' && fun.name()===fun.parent().name() )
    {
        //调用超类的构造函数
        fun.called= this.next.value==='(';
    }
    this.add( this.current );
    if( this.next.type==='(operator)' || this.next.value==='(' || this.next.value==='[' )
    {
        this.step();
    }else
    {
        this.end();
    }
};

syntax["in"]=function(e)
{
    e.prevented=true;
    //this.scope().switch();
    //if('statement' ===  this.scope().keyword() )this.scope().switch();
    this.add( this.current );
    if( this.next.type ==='(operator)' || ( Utils.isConstant(this.next.value) && this.next.value!=='this' ) || this.next.value ===';'  )this.error('Missing expression',this.next);
    this.step();
};

syntax["of"]=function(e)
{
    e.prevented=true;
    //this.scope().switch();
    //if('statement' ===  this.scope().keyword() )this.scope().switch();
    this.add( this.current );
    if( this.next.type ==='(operator)' || ( Utils.isConstant(this.next.value) && this.next.value!=='this' ) || this.next.value ===';'  )this.error('Missing expression',this.next);
    this.step();
};

syntax["typeof"]=function(e)
{
    e.prevented=true;
    if( Utils.isOperator(this.next.value) && !Utils.isIncreaseAndDecreaseOperator(this.next.value) && !(this.next.value==='!' || this.next.value==='!!' || this.next.value==='new' ) )
        this.error();
    if( this.scope().keyword()!=='expression')this.add( new Stack('expression', '(String)' ) );
    this.scope().type('(String)');
    if( Utils.isBoolOperator(this.prev.value) ) this.scope().type('(Boolean)');
    this.add( this.current );
    this.step();
};

syntax["delete"]=function(e)
{
    e.prevented=true;
    if( Utils.isOperator(this.next.value) )this.error();
    if( !(this.next.type ==='(identifier)' || this.next.value==='this') )this.error();
    if( this.scope().keyword()!=='expression')this.add( new Stack('expression', '(*)' ) );
    this.add( this.current );
    this.step();
};

syntax["new"]=function(e)
{
    e.prevented=true;
    //如果上一个是标识并且当前未换行
    if( this.prev.id==='(identifier)' && this.prev.line===this.current.line )this.error();
    if( this.scope().keyword()!=='expression')this.add( new Stack('expression', '(*)' ) );
    this.add( this.current );
    this.step();
};


syntax['(delimiter)']=function( e )
{
    e.prevented=true;
    var id = this.current.value;
    if( balance[id] )
    {
       var s;
       if( this.prev.value === ':' && this.scope().keyword() !== 'ternary' && this.scope().keyword() !=='object' )
       {
           s = new Scope('structure', '(block)');
           this.add( s );

       }else
       {
           s = new Stack('object', id === '(' ? '(expression)' : id === '[' ? '(Array)' : '(JSON)');
           var self= this;
           if( s.type()==='(Array)' )
           {
               var is=false;
               var prev = this.scope().previous();
               if( this.prev.id==='(identifier)' || this.prev.value==='this' || (prev instanceof Stack && prev.type()==='(expression)') )
               {
                   is=true;
                   s.type('(property)');
               }
               s.addListener('(add)',function (e) {
                   if( e.__proxyTarget__.value==='[' ||  e.__proxyTarget__.value===']' )return;
                   //数组中的元素只能用','隔开
                   if( !(e.__proxyTarget__ instanceof Stack) && e.__proxyTarget__.value !==',' )self.error();
                   if( is=== true && e.__proxyTarget__.value===',')self.error();
               });
           }
           var k = this.scope().keyword();

           //无类型
           if( (k==='class' || k==='package') && s.type() === '(Array)' )
           {
               s.type('(*)');
               s.__keyword__='metatype';

           }else if( k !== 'expression' )
           {
               this.add( new Stack('expression', '(*)' ) );
           }
           this.add( s );
       }

        this.add( this.current );

        //json object
        if( s.type()==='(JSON)' )
        {
            this.loop(function () {
                if( this.next.value === '}' )return false;
                this.seek();
                this.add( this.current );
                if( this.current.type !=='(identifier)' && this.current.type !== '(string)' )
                    this.error('Invalid key name for "'+this.current.value+'"');
                if( this.current.type !== '(string)' )
                {
                    this.current.type ='(string)';
                    this.current.value = '"' + this.current.value + '"';
                }
                this.add( this.seek() );
                if ( this.current.value !== ':' )this.error('Missing token :');
                this.step();
                if( this.next.value === '}' )return false;
                if( this.current.value === '}' ){
                    var prev = this.scope().previous();
                    if( prev.keyword()=== "function" ){
                        this.seek();
                        if( this.current.value===',' && this.next.value !== '}' )
                        {
                            this.add( this.current );
                        }
                    }
                }
                return true;
            });

        }else
        {
            this.loop(function ()
            {
                if( this.next.value=== balance[id] )return false;
                this.step();
                return true;
            });
        }
        if( this.scope().keyword() ==='expression' && Utils.isRightDelimiter(this.next.value) )this.scope().switch();
        this.seek();
        this.add( this.current );
        if( this.current.value !== balance[id] )this.error('Missing token '+balance[id] );
        if( this.scope() !==s )this.error();
        s.switch();

        if( s.keyword()==='structure' )return true;

        // 如果下一个是运算符或者是一个定界符
        if( ( this.scope().keyword() ==='object' && Utils.isLeftDelimiter(this.next.value) ) ||
            //(expression)[property]
            ( this.scope().keyword() ==='expression' && this.next.value==='[' )  ||
            //[property](expression)
            ( s.type() ==='(property)' && this.next.value==='(' )  ||
            //bb() as Object or (bb) as Object
            ( s.type() ==='(expression)' && this.next.value==='as' )  ||
            ( this.scope().keyword() ==='expression' && this.next.type==='(operator)' ) )
        {
            this.step();

        }else
        {
            var id = this.scope().parent().keyword();
            if( this.current.line === this.next.line && this.next.id==='(identifier)' && (id==='expression' || id==='condition' || id==='object') )
            {
                this.error('Unexpected identifiler '+ this.next.value, this.next);
            }

            if( s.keyword() !=='metatype' )
            {
                this.end();
            }
        }
    }
};

syntax['(operator)']=function( e )
{
    e.prevented=true;
    var id = this.current.value;

    //运算符后面不能跟操作符(自增减运算符除外)
    if( id===this.next.value || ( this.next.type==='(operator)' && this.next.value !==';' && !Utils.isLeftOperator(this.next.value) && !Utils.isIncreaseAndDecreaseOperator(id) ) )
    {
        this.error('Unexpected token ' + this.next.value, this.next);
    }

    //空操作符
    if( id===';' )
    {
        //赋值运算符后不能是空操作符
        if( Utils.isMathAssignOperator( this.prev.value ) )this.error('Missing expression', this.next);
        return this.end();
    }
    //点运算符 或者 命名空间访问运算符
    else if( id==='.' || id==="::" )
    {
        //数字后面不能有点运算符 点运算符后面只能是属性名
        if( this.prev.type==='(number)' || !(this.next.id ==='(identifier)' || this.next.id==='(keyword)') )this.error();
        var e = this.scope().previous();
        if( e instanceof Stack && e.parent().keyword() !=='expression' )
        {
            var e= new Stack('expression', '(*)');
            var obj = this.scope().content().pop();
            e.content().push( obj );
            obj.__parent__ = e;
            this.add(e);
        }
        this.add( this.current );
        return this.step();
    }

    //顺序操作符
    if( id===',' )
    {
        //不关闭字面量的对象 {} [] ()
        if( !(this.scope().keyword() ==='object' || this.scope().keyword()==='function') )this.scope().switch();

        //(a ? b : c, 1, 2);
        if( this.scope().keyword() ==='ternary' )
        {
            this.scope().switch();
            if( this.scope().parent().keyword()==='object' )
            {
                this.scope().switch();
            }
        }

        //(1,) 不允许
        if( this.next.value === ')' )this.error('Unexpected token ,',this.current);

        //[1,] {key:1,} 允许
        if( !Utils.isRightDelimiter( this.next.value ) )
        {
            this.add( this.current );
        }
        if( this.scope().keyword()==='object' )return true;

        return this.step();

    }else if( id===':' )
    {
        this.scope().switch();
        if( this.scope().keyword()==='ternary' && this.scope().length()===5 )
        {
            this.scope().switch();
        }
        this.add( this.current );
        return this.step();
    }
    //条件判断三元运算符
    else if( id==='?' )
    {
       // this.scope().switch();
        var content = this.scope().content();
        var index = 0;
        if (content.length > 1)
        {
            var len = content.length;
            while (len > 0) {
                --len;
                if (Utils.isMathAssignOperator(content[len].value)) {
                    index = len + 1;
                    break;
                }
            }
        }

        var ternary = new Stack('ternary', '(*)');
        var express = new Stack('expression', '(*)');
        var self = this;
        express.__content__ = content.splice(index, content.length - index );
        express.__parent__ = ternary;
        express.__close__ = true;

        ternary.content().push( express );
        this.add( ternary );
        ternary.addListener('(add)',function(){
            if( this.length()>5 ){
                self.error('Not end expression');
            }
        }).addListener('(switch)',function(){
            var p = this.previous(-2);
            if( !p || p.id !==':' ){
                self.error('Missing token :');
            }
        });

        this.add( this.current );
        //添加表达式
        this.add(new Stack('expression', '(*)').addListener('(switch)', function () {
            if (this.length() < 1)self.error('Missing expression');
        }));
        return this.step();
    }

    //运算符只能出现在表达式中
    if( this.scope().keyword() !=='expression' )
    {
        if( !Utils.isLeftOperator(id) )this.error('Unexpected token '+id);
        this.add( new Stack('expression','(*)') ) ;
    }
    this.add(this.current);

    //自增加运算符只能是一个对数字的引用
    if( Utils.isIncreaseAndDecreaseOperator(id) && this.prev.type !== '(identifier)' && this.next.type !=='(identifier)' )
    {
        this.error('Unexpected token '+this.current.value, this.current);
    }

    //后置自增减运算符
    if( this.prev.id === '(identifier)' && Utils.isIncreaseAndDecreaseOperator(id) )
    {
        //后置自增减运算符后面允许出现部分运算符
        if( this.next.type==='(operator)' )
        {
            var next = this.next.value;

            //后置自增减运算符后面不允许出现的运算符
            if (next === '.' || Utils.isKeywordOperator(this.next.value) || Utils.isLeftOperator(next) || Utils.isMathAssignOperator(next))
                this.error('Unexpected operator ' + this.next.value, this.next);
        }
        //必须结束当前表达式
        else if( Utils.isIncreaseAndDecreaseOperator(id) )
        {
            return this.end();
        }
    }

    //比较运算符后面不能跟结束运算符
    if( Utils.isLeftAndRightOperator(id) && Utils.isEndOperator( this.next.value ) )
    {
       this.error('Missing expression the operator ' + this.current.value);
    }
    this.step();
};

/**
 * 获取类型名
 * @returns {string}
 */
function getTypeName()
{
    var type=[];
    this.loop(function(){
         this.seek();
         type.push(this.current.value);
         if( !(this.next.value==='.' || this.next.id==='(identifier)') )return false;
         return true;
    });
    if( !checkSegmentation(type, true) )this.error('Invalid type name');
    return type.join('');
}

/**
 * 声明属性
 */
function statement()
{
    var type = '*';
    var name = this.current.value;
    var stack = this.scope().parent();
    var id = stack.parent().keyword();
    var isrest = false;

    //剩余参数
    if( name === '...' )
    {
        if( id !=='function' )this.error();
        stack.parent().param( name );
        if( this.next.type==='(identifier)')
        {
            this.seek();
            name = this.current.value;
        }
        isrest=true;
    }

    //获取声明的类型
    if( this.next.id===':' )
    {
        var current = this.current;
        var prev = this.prev;
        this.seek();
        type= getTypeName.call(this);
        this.current= current;
        this.prev = prev;
        //检查声明的类型是否定义
        //if( !checkStatementType(type, stack.scope() , this.config('globals') ) )this.error( '"'+type+'" type is not defined');
    }

    if( id==="namespace" )
    {
        if (type !== "*" && type !== "String")
        {
            this.error('Namespace uri indentify can only is String');
        }
        type = "String";
    }

    //剩余参数必须在最后
    if( isrest && this.next.value !==')' )this.error('Rest parameter can only be in the final');

    //检查属性名是否可以声明
    var _reserved = this.config('reserved');
    if( !(id==='function' && isrest) && !checkStatement(name, _reserved ) )
    {
        this.error( reserved.indexOf( name )>0 || (_reserved && _reserved.indexOf(name) >0) ? 'Reserved keyword is not statemented for '+name : 'Invalid statement for '+name);
    }
    var scope =  stack.getScopeOf( id==='let' || id==='const' || id==='var' );
    if( scope.keyword() ==="class" )
    {
        scope =  scope.scope( stack.parent().static() );
    }
    var desc = {'type':'('+type+')','id':id, 'static': stack.parent().static() , 'scope':scope};
    //如是函数声明的参数
    if( id==='function' )
    {
        desc.id='var';
        stack.parent().param( name );

    }else if( id ==='var' || id==='const' || id==='let' || id==="namespace")
    {
        stack.parent().type( type );
    }

    var e = {type:"(statement)", desc:desc};
    this.dispatcher( e );
    scope = desc.scope || scope;

    //不能重复声明变量
    var val = scope.define( name );
    if( val && val.scope === scope )this.error('Identifier "'+name+'" has already been declared');

    //将声明的变量定义到作用域中
    scope.define(name, desc);

    //常量必须指定默认值
    if( id==='const' && this.next.value !=='=' )this.error('Missing default value in const',this.next);
    if( this.next.value ==='=' )
    {
        desc.value=this.scope();
        if( stack.parent().parent().keyword() === 'interface' )this.error('Can not assign default value',this.next);
    }
    return desc;
}

var namespace_keyword = ["let","var","const","function","static","override","final","namespace"];
syntax['(identifier)']=function( e )
{
    e.prevented=true;
    var stack = this.scope();
    var id = stack.keyword();
    if( this.next && this.next.id==="(keyword)" )
    {
        var v = this.next.value;
        if( namespace_keyword.indexOf(v) >= 0 )
        {
            property_keyword.call(this, {type:this.current.value, ns:true} );
            return;
        }
    }

    if( id==='class' || id==='package' )this.error();

    //如果不是表达式
    if( id !=='expression' )this.add( new Stack('expression','(*)') );
    //声明属性
    if( id==='statement' )statement.call(this, e);
    this.add( this.current );

    //call fun or dynamic property
    if( this.next.value==='(' || this.next.value==='[' )
    {
        if( this.current.type !== '(identifier)' )this.error('Unexpected token '+this.next.value, this.next );
        this.step();
    }
    else if( this.next.type === '(operator)' && this.next.value !==';' )
    {
        this.step();
    }
    else
    {
        var id = this.scope().parent().keyword();
        if( this.current.line === this.next.line && this.next.id==='(identifier)' && (id==='expression' || id==='condition' || id==='object') )
        {
            this.error('Unexpected identifiler '+ this.next.value, this.next);
        }
        this.end();
    }
};

syntax['(string),(number),(regexp)']=syntax['(identifier)'];

/**
 * 抛出错误信息
 * @param msg
 * @param type
 */
function error(msg, type, obj )
{
    if( obj )
    {
        console.log( obj );
        console.log('error line:',obj.line, ' characters:', obj.cursor );
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
 * 事件对象
 * @param type
 * @constructor
 */
function Event( type, props )
{
    if( !(this instanceof Event) )return new Event(type, props );
    if( typeof props === "object" ) Utils.merge(this, props);
    this.type = type;
    this.prevented=false;
    this.stopPropagation=false;
}

Event.prototype.constructor=Event;
Event.prototype.type='';
Event.prototype.__proxyTarget__=null;
Event.prototype.prevented=false;
Event.prototype.stopPropagation=false;


/**
 * 事件侦听器
 * @constructor
 */
function Listener() {
    if( !(this instanceof Listener) )return new Listener();
    this.events={};
}

/**
 * 指定构造函数为事件侦听器
 * @type {Listener}
 */
Listener.prototype.constructor = Listener;

/**
 * 调度事件
 * @param event 事件对象
 * @param options 引用的对象
 * @returns {boolean}
 */
Listener.prototype.dispatcher=function( event )
{
    var type = event.type || event;
    if( this.events[type] && this.events[type].length > 0 )
    {
        var listener = this.events[type].slice();
        var len = listener.length;
        for ( var i =0; i<len; i++)
        {
            listener[i].callback.call(this, event);
            if( event.stopPropagation )
            {
                return false;
            }
        }
    }
    return true;
};

/**
 * 添加事件侦听器
 * @param type 事件类型
 * @param callback  回调函数
 * @param priority  优先级
 * @returns {Listener}
 */
Listener.prototype.addListener=function(type, callback, priority)
{
    if( type instanceof Array )
    {
        for (var i in type )this.addListener( type[i], callback, priority);
        return this;
    }
    var obj = this.events[type] instanceof Array ? this.events[type] : ( this.events[type]=[] );
    obj.push({callback:callback, priority:priority || 0});
    if( obj.length > 1 )obj.sort(function(a,b)
    {
        return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
    });
    return this;
};


/**
 * 是否存在指定类型的侦听器
 * @param type 事件类型
 * @param callback  可选， 如果指定则判断回调函数必须相同
 * @returns {boolean}
 */
Listener.prototype.hasListener=function(type, callback)
{
    if( typeof callback === "undefined"  )
    {
        return !!this.events[type];

    }else if( this.events[type] && this.events[type].length > 0 )
    {
        var len = this.events[type].length;
        for ( var i =0; i<len; i++)
        {
            if( this.events[type][i] && this.events[type][i].callback === callback )
            {
                return true;
            }
        }
    }
    return false;
};

/**
 * 删除指定类型的侦听器
 * @param type 事件类型
 * @param callback  可选， 如果指定则只删除回调函数相同的侦听器
 * @returns {Listener}
 */
Listener.prototype.removeListener=function(type, callback)
{
    if( typeof callback === "undefined" )
    {
        delete this.events[type];

    }else if(  this.events[type] &&  this.events[type].length > 0 )
    {
        var len = this.events[type].length;
        for ( var i =0; i<len; i++)
        {
            if( this.events[type][i] && this.events[type][i].callback === callback )
            {
                this.events[type].splice(i,1);
                return this;
            }
        }
    }
    return this;
};


/**
 * 语法描述
 * @param type
 * @param value
 * @param id
 * @returns {{type: *, value: *, id: *}}
 */
function describe(type,value,id)
{
    return {type:type ,value:value, id:id || value , line:0, cursor:0};
}

var stack_level = 1;

/**
 * 代码堆
 * @param type
 * @constructor
 */
function Stack( keyword, type )
{
    if( !(this instanceof Stack) )return new Stack(keyword, type);
    this.__content__=[];
    this.__parent__ =null;
    this.__type__   = type;
    this.__keyword__ = keyword;
    this.__name__='';
    this.__close__  =false;
    this.__qualifier__='';
    this.__static__   = '' ;
    this.__override__= '' ;
    this.__final__   = '' ;
    this.__dynamic__ = '';
    this.__scope__   = null ;
    this.__blockScope__   = null ;
    this.__define__  ={};
    this.__level__ = stack_level;
    Listener.call(this);
}

// 全局属性， 保存为当前的代码块的作用域
Stack.__current__=null;

/**
 * 返回当前的作用域
 * @returns {*|null}
 */
Stack.current=function()
{
    if( Stack.__current__=== null )
    {
        Stack.__current__ = new Scope('rootblock','(rootblock)');
    }
    return Stack.__current__;
};

/**
 * 继承侦听器
 * @type {Listener}
 */
Stack.prototype = new Listener();

/**
 * 设置构造函数为代码块的作用域
 * @type {Scope}
 */
Stack.prototype.constructor = Stack;

/**
 * 所在的函数作用域
 * @param keyword
 * @returns {*}
 */
Stack.prototype.scope=function( name )
{
   if( this.__scope__===null )
   {
       var block= this;
       while( !(block instanceof Scope) && block.parent() )block = block.parent();
       if( block instanceof Class )block = block.scope( this.static() );
       block.parentScope = block.parent() ? block.parent().scope( this.static() ) : null;
       this.__scope__= block;
   }
    if( name ==="static" )
   {
       var block= this.__scope__;
       while( block.keyword() !=="class" && block.parent() )block = block.parent().scope( this.static() );
       return block;
   }
   return this.__scope__;
};


/**
 * 设置获取已声明的引用描述
 * @param prop 属性名称
 * @param desc 属性描述  如果为true表示引用全局属性
 * @returns {*}
 */
Stack.prototype.define=function( prop , desc)
{
    if( typeof prop === "string" )
    {
        var scope = this;
        if( !desc )
        {
            if( scope.__define__[prop] )return scope.__define__[prop];
            while( scope && scope.parentScope )
            {
                scope = scope.parentScope;
                if( scope.keyword() ==='class' )
                {
                    if( scope.__define__[prop] && scope.__define__[prop].id==='class' )return scope.__define__[prop];
                    scope = scope.parentScope;
                }
                if( scope.__define__[prop] )return scope.__define__[prop];
            }
            return null ;
        }
        this.__define__[prop] = desc;
        return this;
    }
    return this.__define__;
};

Stack.prototype.getScopeOf=function( isBlock )
{
    var scope=this.scope();
    if( isBlock )return scope;
    while ( scope && !isFunScope(scope) )scope = scope.parent().scope();
    return scope;
};

function isFunScope(scope)
{
    return (scope.keyword() ==='function' ||
    scope.keyword()==='class'             ||
    scope.keyword()==='interface'         ||
    scope.keyword()==='package'           ||
    scope.keyword()==='rootblock');
}


/**
 * 关键字
 * @param keyword
 * @returns {*}
 */
Stack.prototype.keyword=function()
{
    return this.__keyword__;
};

/**
 * 作用域的名称
 * @param name
 * @returns {*}
 */
Stack.prototype.name=function( name )
{
    if( typeof name === 'string' )
    {
        this.__name__=name;
        return this;
    }
    return this.__name__;
};


/**
 * 设置类型
 * @param name
 * @returns {*}
 */
Stack.prototype.type=function( type )
{
    if( typeof type === 'string' ){
        this.__type__=type;
        return this;
    }
    return this.__type__;
};

/**
 * 是否已关闭
 * @returns {boolean}
 */
Stack.prototype.close=function()
{
    return this.__close__;
};

/**
 * 添加代码语法
 * @param val object | Stack
 * @returns {bool}
 */
Stack.prototype.add=function( val, index )
{
    if( this.close() )
    {
        error('stack is end','', val );
    }
    if( !val )error('Invalid val');
    var event = new Event('(add)', {__proxyTarget__:val} );
    this.dispatcher( event );
    val = event.__proxyTarget__;

    var p = this.previous();
    if( p instanceof Stack && !p.close() )error('Syntax not end');

    if( !event.prevented )
    {
        if( val instanceof Stack )
        {
            if( val === this )error('Invalid child');

            //堆叠器中不能添加结构体 比如 if else switch do while try for catch finally
            if( this.keyword() !== 'rootblock' && val.type() ==='(block)' && !(this instanceof Scope) )
            {
                error('Invalid syntax ' + val.keyword() );
            }

            //指定的子级的父级对象的引用
            val.__parent__ = this;
            Stack.__current__ = val;

        }else if( val.value===';' && !(this instanceof Scope) && this.parent() && this.parent().keyword() !=='for' )
        {
            error('Unexpected token '+val.value, '', val );
        }
        index = index || this.length();
        this.__content__.splice(index,0,val);
        return true;
    }
    return false;
};

/**
 * 父级
 * @returns {null}
 */
Stack.prototype.parent=function()
{
    return this.__parent__;
};

/**
 * 内容代码
 * @param value
 * @returns {*}
 */
Stack.prototype.content=function()
{
    return this.__content__;
};


/**
 * 返回上一个在作用域中的语法
 * @param step 可以是一个回调函数， 也可以是一个负数字
 * @returns {*}
 */
Stack.prototype.previous=function ( step )
{
    var c = this.content();
    if( c.length < 1  )return null;
    var index =  typeof step === "number" ? step : -1;
    var i = index < 0 ? c.length+index : index;
    var r = c[ i ];
    if( typeof step === "function"  )
    {
        while ( step.call(this, r, i ) && ( r=this.previous( --index ) ) && index >=0 );
    }
    return r;
};


/**
 * 代码语法个数
 * @returns {Number}
 */
Stack.prototype.length=function()
{
    return this.__content__.length;
};

/**
 * 切换到父级堆叠容器
 * @param stack
 * @returns {boolean}
 */
Stack.prototype.switch=function()
{
    if( this.close() )return true;
    var stack = this.parent();
    if( stack )
    {
       var event = new Event('(switch)', {parent:stack} );
       this.dispatcher( event );
        stack =  event.parent;
        if( !event.prevented )
        {
            this.__close__ = true;
            Stack.__current__ = stack;
            return true;
        }

    }else if( this.keyword() === 'rootblock' )
    {
        this.__close__ = true;
        return true;
    }
    return false;
};

/**
 * 设置对外接口的限定附
 * @param qualifier
 * @returns {*}
 */
Stack.prototype.qualifier=function(qualifier )
{
    if( typeof qualifier === 'undefined' )return this.__qualifier__;
    this.__qualifier__=qualifier;
    return this;
};

/**
 * 设置不可改变
 * @param qualifier
 * @returns {*}
 */
Stack.prototype.final=function( val )
{
    if( typeof val === 'undefined' )return this.__final__;
    this.__final__=val;
    return this;
};

/**
 * 设置不可改变
 * @param qualifier
 * @returns {*}
 */
Stack.prototype.dynamic=function( val )
{
    if( typeof val === 'undefined' )return this.__dynamic__;
    this.__dynamic__=val;
    return this;
};


/**
 * 设置可修改
 * @param qualifier
 * @returns {*}
 */
Stack.prototype.override=function( val )
{
    if( typeof val === 'undefined' )return this.__override__;
    this.__override__=val;
    return this;
};

/**
 * 标记是动态还是静态模块
 * @param flag  true是静态，否则为动态
 * @returns {*}
 */
Stack.prototype.static=function( val )
{
    if( typeof val !== "undefined" ){
        this.__static__=val;
        return this;
    }
    return this.__static__;
};


/**
 * 代码块的作用域
 * @param type
 * @constructor
 */
function Scope( keyword, type )
{
    if( !(this instanceof Scope) )return new Scope(keyword, type);
    this.__param__=[];
    this.__accessor__= '' ;
    this.__extends__='';
    Stack.call(this,keyword,type);
}
Scope.prototype = new Stack();
Scope.prototype.constructor=Scope;


/**
 * 添加参数的类型
 * @param type
 * @returns {*}
 */
Scope.prototype.param=function( type )
{
    if( typeof type !== 'undefined' )
    {
        this.__param__.push( type );
        return this;
    }
    return this.__param__;
};

/**
 * 访问器类型
 * @param name get|set
 * @returns {Scope|String}
 */
Scope.prototype.accessor=function( accessor )
{
    if( typeof accessor === 'undefined' )return this.__accessor__;
    this.__accessor__=accessor;
    return this;
};

/**
 * 类模块作用域
 * @param type
 * @constructor
 */
function Class()
{
    if( !(this instanceof Scope) )return new Class();
    Scope.call(this,'class','(block)');
    this.__extends__='';
    this.__scope__=null;
    this.__implements__=[];
    this.__abstract__  ='';
    this.__construct__=null;
}
Class.prototype = new Scope();
Class.prototype.constructor=Class;
Class.prototype.__fullclassname__=null;

/**
 * 返回一个类的全名。
 * @returns {null|*}
 */
Class.prototype.fullclassname=function()
{
    if( this.__fullclassname__ !== null )return this.__fullclassname__;
    var p = this.parent().name();
    var n = this.name();
    this.__fullclassname__ = (p ? p+'.'+n : n).replace(/\s+/g,'');
    return this.__fullclassname__;
};

/**
 * 所在的作用域
 * @param keyword
 * @returns {*}
 */
Class.prototype.scope=function( name )
{
    if( this.__scope__===null )
    {
        var s = new Scope('class','(block)');
        s.static('static');
        s.__parent__ = this.parent();
        var ps = this.parent().scope();
        s.parentScope = ps;
        this.parentScope = ps;
        Utils.merge(this.__define__, ps.__define__);
        Utils.merge(s.__define__, ps.__define__);
        this.__scope__={'proto':this,'static':s};
    }
    if( typeof name  === "undefined" )return this;
    return name === 'static' ? this.__scope__.static : this.__scope__.proto;
};

/**
 * 是否有继承
 * @param name
 * @returns {*}
 */
Class.prototype.extends=function( name )
{
    if( typeof name === 'undefined' )return this.__extends__;
    this.__extends__=name;
    return this;
};

/**
 * 实现的接口
 * @param val
 * @returns {*}
 */
Class.prototype.implements=function( val )
{
    if( typeof val === 'undefined' )return this.__implements__;
    this.__implements__=val;
    return this;
};

/**
 * 是否标识为抽象类
 * @param qualifier
 * @returns {*}
 */
Class.prototype.abstract=function( abstract )
{
    if( typeof abstract === 'undefined' )return this.__abstract__;
    this.__abstract__=abstract;
    return this;
};

Class.prototype.construct=function( stack )
{
    if( typeof name === 'undefined' )return this.__construct__;
    this.__construct__=stack;
    return this;
};


/**
 * 接口模块
 * @returns {Interface}
 * @constructor
 */
function Interface()
{
    if( !(this instanceof Scope) )return new Interface();
    Scope.call(this,'interface','(block)');
    this.__extends__='';
    this.__scope__=null;
}
Interface.prototype = new Scope();
Interface.prototype.constructor=Interface;

Interface.prototype.__fullclassname__=null;

/**
 * 返回一个类的全名。
 * @returns {null|*}
 */
Interface.prototype.fullclassname=function()
{
    if( this.__fullclassname__ !== null )return this.__fullclassname__;
    var p = this.parent().name();
    var n = this.name();
    this.__fullclassname__ = (p ? p+'.'+n : n).replace(/\s+/g,'');
    return this.__fullclassname__;
};

/**
 * 是否有继承接口
 * @param name
 * @returns {*}
 */
Interface.prototype.extends=function( name )
{
    if( typeof name === 'undefined' )return this.__extends__;
    this.__extends__=name;
    return this;
};

/**
 * 所在的作用域
 * @param keyword
 * @returns {*}
 */
Interface.prototype.scope=function()
{
    if( this.__scope__===null )
    {
        Utils.merge(this.__define__, this.parent().scope().__define__);
        this.__scope__=this;
    }
    return this.__scope__;
};

/**
 * 默认配置
 * @type {}
 */
var default_config = {
    'semicolon':false,
    'reserved':[],
};


/**
 *  语法分析器
 * @param config
 * @constructor
 */
function Ruler( content, config )
{
    this.lines=content.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split(/\n/);
    this.line=0;
    this.cursor=0;
    this.input='';
    this.skip=false;
    this.current=null;
    this.prev=null;
    this.next=null;
    this.__end__=false;
    this.__balance__=[];
    this.__config__= Utils.merge(default_config,config || {});
    Stack.__current__=null;
    Listener.call(this);
    for (var type in syntax )this.addListener( type.split(','), syntax[type] ) ;
}

/**
 * 继承侦听器
 * @type {Listener}
 */
Ruler.prototype = new Listener();

/**
 * 指定构造函数为语法分析器
 * @type {Ruler}
 */
Ruler.prototype.constructor = Ruler;

/**
 * 调度事件
 * @param event 事件对象
 * @param options 引用的对象
 * @returns {boolean}
 */
Ruler.prototype.dispatcher=function(event)
{
    event.__proxyTarget__ = event.__proxyTarget__ || this.current;
    return Listener.prototype.dispatcher.call(this, event );
};

/**
 * 配置选项
 * @param key
 * @returns {*}
 */
Ruler.prototype.config=function(key, value )
{
    if( typeof key === "string" )
    {
        if( typeof value !=="undefined" )
        {
            this.__config__[key]=value;
            return this;
        }
        return this.__config__[key] || null;
    }
    return this.__config__;
};

/**
 * 是否完成语法分析过程
 * @returns {boolean}
 */
Ruler.prototype.done=function()
{
    return this.__end__;
};

/**
 * 将代码移动到下一行
 * @returns {*}
 */
Ruler.prototype.move=function()
{
    if ( this.line < this.lines.length )
    {
        this.input = this.lines[ this.line ].replace(/\t/g,'  ');
        var s = '';
        this.line++;
        this.cursor=0;
        if( !this.skip  )
        {
            var n ;
            //多行注释
            if ( (n=/\/\*/.exec( this.input )) )
            {
                s = this.input.substr(0, n.index);
                this.skip = true;
            }
            //单行注释
            else
            {
                var index = this.input.indexOf('//');
                if( index >= 0  )
                {
                    var left =  this.input.indexOf('"');
                    var right= -1;
                    if( left < 0  )left = this.input.indexOf("'");
                    if( left >= 0 )
                    {
                        right = this.input.lastIndexOf('"');
                        if (right < 0)right = this.input.lastIndexOf("'");
                    }
                    if( !(left < index && index < right) )
                    {
                        this.input = this.input.substr(0, index);
                    }
                }
            }
        }

        //是否跳过
        if( this.skip )
        {
            var e=/\*\//.exec( this.input );
            if( e ){
                this.skip=false;
                s = s + this.input.substr(e.index+2);
            }
            this.input=s;
        }

        //空行继续
        if( !this.input )return this.move();
        return this.input;
    }
    this.__end__=true;
    return null;
};


/**
 * 抛出错误消息
 * @param msg
 * @param type
 */
Ruler.prototype.error=function (msg, o, type )
{
    o = o || this.current;
    msg =  msg || 'Unexpected token '+o.value;
    type = type || 'syntax';
    error(msg , type , o);
};

/**
 * 平衡器
 * 主要是检测 () {} [] 是否成对出现
 * @param o
 * @returns {boolean}
 */
Ruler.prototype.balance=function( o )
{
    var b = this.__balance__;
    var s = this.scope();
    var tag = b.pop();
    if ( o.id !== tag )
    {
        if( tag )
        {
            if( !balance[o.id] )this.error('Unexpected identifier '+o.id );
            b.push(tag);
        }
        if( balance[o.id] )
        {
            if( typeof s.balance === "undefined" )s.balance = b.length;
            b.push( balance[o.id] );
            if( o.id ==="{" )stack_level++;
        }
        if( b.length === 0 )this.error('Unexpected identifier '+o.id );
        return false;
    }
    if(tag==="}")stack_level--;
    return true;
};

/**
 * 获取语法描述
 * @returns {*}
 */
Ruler.prototype.seek=function( flag )
{
    var o;
    if( this.done() )
    {
        o = describe('(end)','','(end)');
        this.scope().dispatcher( new Event('(end)', {__proxyTarget__:o, ruler:this}) );

    }else
    {
        if (this.input.length === this.cursor)
        {
            this.move();
            o = describe('(newline)','','(newline)');
            o.line= this.line;
            o.cursor = this.cursor;
            this.hasListener('(newline)') && this.dispatcher( new Event('(newline)', {__proxyTarget__:o, ruler:this}) );
            return this.seek( flag );

        } else {
            var s = this.input.slice(this.cursor);
            while (s.charAt(0) === " ") {
                this.cursor++;
                s = s.slice(1);
            }
            if (!s)return this.seek();
            o = this.operator(s) || this.number(s) || this.keyword(s) || this.identifier(s);
            if (!o)this.error('Unexpected Illegal ' + s);
            this.cursor += o.value.length;
        }
    }

    //如果当前是空或者没有结束
    if( !this.current || this.current.id !=='(end)' )
    {
        o.line= this.line;
        o.cursor = this.cursor;
        this.prev = this.current;
        this.current = this.next;
        this.next    = o;
        if (this.current === null)return this.seek( flag );
    }

    //seek before dispatch event
    this.hasListener('(seek)') && this.dispatcher(new Event('(seek)', {__proxyTarget__: this.current,scope:this.scope()}));

    //检测块级代码堆叠器是否到达结束位置
    if( this.current.type==='(delimiter)' && Utils.isDelimiter( this.current.value ) )
    {
        this.balance(this.current);
    }
    return this.current;
};

/**
 * 返回当前的作用域
 * @returns {Scope}
 */
Ruler.prototype.scope=function()
{
    return Stack.current();
};

function isEndSyntax(id)
{
    return id ==='expression' || id ==='statement' || id==='ternary' || id==='var' || id==='const' || id==='let' || id==='namespace' || id==='use' || id==='if' || id==='else' || id==='for' || id==='while';
}

/**
 * 指定结束点
 * @returns {*|null}
 */
Ruler.prototype.end=function( stack )
{
    stack = stack || Stack.current();
    var id = stack.keyword();
    if( stack.close() )return true;
    if( this.next.value===';')this.seek();

    //如果当前是一个空操作符或者是一个右定界符则结束
    if( this.current.value === ';' )
    {
        var pid = stack.parent().keyword();
        //结束接口
        if( stack.keyword()==='function' && (pid === 'interface') )
        {
            stack.switch();
            return true;
        }
        while ( isEndSyntax( stack.keyword() ) && !stack.close()  )
        {
            if( stack.keyword()==='if' || stack.keyword()==='else' || stack.keyword()==='for' || stack.keyword()==='while' )
            {
                if( !stack.endIdentifer || stack.endIdentifer !== this.current.value )break;
            }
            stack.switch();
            stack = this.scope();
        }
        if( this.current.value )this.add( this.current );
        return true;

    }else if( stack.keyword() ==='function' && stack.parent().keyword() ==='interface' )
    {
        stack.switch();
        return true;
    }
    //如果下一个是一个右定界符 ] ) }
    //并且当前表达式不在域块级中
    else if( Utils.isRightDelimiter( this.next.value ) )
    {
        var pid = stack.parent().keyword();
        if( pid==='function' || pid==='if' || pid==='for' || pid==='switch' || pid==='else' || pid==='while' || pid==='do' || pid==='try' )
        {
            this.error('Syntax not end');
        }

        var ret=false;
        while ( id ==='expression' || id==='ternary' || id==='condition' || (id==='var' && pid==='condition') ){
            stack.switch();
            stack = this.scope();
            pid = stack.parent().keyword();
            id = stack.keyword();
            ret=true;
        }
        if( ret )return true;
    }
    this.error('Syntax not end');
};


/**
 * 步进
 * @param flag
 * @returns {*|null}
 */
Ruler.prototype.step=function()
{
    this.seek();
    var s = this.scope();
    var index = this.scope().length();
    var event = this.check();
    if( !event.prevented && event.__proxyTarget__ )
    {
        s.add( event.__proxyTarget__ , index);
    }
};

/**
 * 验证语法
 * @param o
 */
Ruler.prototype.check=function( o )
{
    o = o || this.current;
    var type = o.id==='(keyword)' && this.hasListener(o.value) ? o.value : o.type;
    var event= new Event( type, {__proxyTarget__:o, scope: this.scope()} );
    this.dispatcher( event );
    return event;
};

/**
 * 开始分析
 * @returns {Scope}
 */
Ruler.prototype.start=function()
{
    stack_level = 0;
    do{
        this.step();
    }while( !this.done() );
    var scope = this.scope();
    var child = scope.content();
    for( var i in child )
    {
        if(child[i] instanceof Stack && !child[i].close() )
        {
            this.error();
        }
    }
    scope.__close__=true;
    return scope;
};

/**
 * 循环执行
 * @param callback
 * @returns {null|*}
 */
Ruler.prototype.loop=function(callback)
{
    while( !this.done() && callback.call(this) );
    return this.current;
};

/**
 * 添加语法到当前的作用域
 * @param val
 * @param index
 * @returns {boolean}
 */
Ruler.prototype.add=function( val , index )
{
    if(val.type==='(end)')return false;
    try {
        this.scope().add(val, index);
    }catch (e)
    {
        this.error(e.message);
    }
    return true;
};


/**
 * 获取关键词
 * @param s
 * @returns {*}
 */
Ruler.prototype.keyword=function(s)
{
    s = /^([a-z_$]+[\w]*)/i.exec( s );
    if( s )
    {
        var index = reserved.indexOf( s[1] );
        if( index <0) {
            index = this.config('reserved').indexOf(s[1]);
        }
        var type = '(identifier)';
        if( Utils.isOperator( s[1] ) )type='(operator)';
        return describe(type, s[1] , index >= 0 ? '(keyword)' : '(identifier)' );
    }
    return null;
};

/**
 * @type {RegExp}
 */
var number_regexp = /^(0x[0-9a-f]+|o[0-7]+|[\-\+]?[\d\.]+)/i;

/**
 * 获取数字类型
 * @param s
 * @returns {*}
 */
Ruler.prototype.number=function(s)
{
    if( s.charAt(0)==='.' && !/\d/.test( s.charAt(1) ) )return null;
    if( number_regexp.exec(s) )
    {
        return describe('(number)', RegExp.$1 , RegExp.$1 );
    }
    return null;
};

/**
 * 获取语法定界符
 * @param s
 * @returns {*}
 */
Ruler.prototype.identifier=function(s)
{
    var v = s.charAt(0);
    if( Utils.isDelimiter( v ) )return describe('(delimiter)', v , v );
    switch( v )
    {
        case '`' :
        case '"' :
        case "'":
            var i=1;
            while ( i<s.length && !( v === s.charAt(i) && s.charCodeAt(i-1) !== 92 ) )i++;
            if( v !== s.charAt(i) ){
                this.error('Missing identifier '+v );
            }
            return describe( v==='`' ? '(template)' : '(string)', s.substr(0,i+1), v );
        case '/':
            // 正则表达式的前面不能是任务标识符
            if( this.next.type==='(number)' || this.next.type==='(identifier)' )return null;
            var i=1;
            while ( i<s.length && i<500 )
            {
                if( s.charAt(i) ==='/' )
                {
                    if( s.charAt(i-1) !=='\\' )break;
                    var b = i-1;
                    var t = 0;
                    while( b>0 && s.charAt( b-- ) ==='\\' )t++;
                    if( t%2 === 2 || t%2===0 )break;
                }
                i++;
            }
            var j = s.substr(0,++i);
            if( v !== j.charAt(j.length-1) )this.error('Missing identifier end for '+v );
            var g='';
            while ( /[a-zA-Z]/.test( s.charAt( i ) ) )g+=s.charAt( i++ );
            if(j.length < 3)this.error('Invalid regexp expression');
            new RegExp( j, g );
            return describe('(regexp)', j+g , j+g );
    }
    return null;
};

/**
 * 获取运算符
 * @param s
 * @returns {*}
 */
Ruler.prototype.operator=function(s)
{
    var v = s.charAt(0);

    //正则表达式的字面量
    if( this.next && this.next.id==="=" && v==="/" )
    {
        return null;
    }

    //这些只能单个出现
    if( v===';' || v==='.' || v===',' || v==='?' )
    {
        var type = '(operator)';
        if( v==='.' )
        {
            //rest
            if( s.charAt(1)==='.' && s.charAt(2)==='.' && /[a-zA-Z]/.test( s.charAt(3) ) )
            {
                type = '(identifier)';
                v = s.substr(0, 3);
            }
        }
        return describe(type, v , v );
    }

    var index = 0;
    while( Utils.isCombinationOperator( s.charAt( index ) ) )index++;
    if( index === 0 )return null;
    s = s.substr(0, index);
    if( s==='::' )
    {
        return describe('(operator)', s, s );
    }

    //声明的类型 var name:*=123;
    if( s==='*=' && this.next.id===':' )
    {
        return describe('(operator)', s.charAt(0), s.charAt(0) );
    }
    // .* import com.*
    else if( s===':*=' || s===':*' || s==='.*' )
    {
        return describe('(operator)', s.charAt(0), s.charAt(0) );
    }

    //处理等号后面跟的其它前置运算符 - + ~ !
    if( s.length>1 )
    {
        var l = s.lastIndexOf('=');
        if( l > 0 )s=s.substr(0, l+1 );
    }

    if( s )
    {
        if( !Utils.isOperator(s) )this.error('Unexpected operator '+s);
        return describe('(operator)', s, s);
    }
    return null;
};
Ruler.SCOPE=Scope;
Ruler.STACK=Stack;
Ruler.CLASS=Class;
Ruler.META_TYPE = metaType;
module.exports = Ruler;
