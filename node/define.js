/**
 * 定义模块对象
 * @require System,Internal,Class,Interface,Namespace,Reflect,Object,JSON,Array,TypeError,Error,Symbol
 * @internal
 */
var modules={};
var has = $Object.prototype.hasOwnProperty;
function getPackageName( name )
{
    var index = name.lastIndexOf(".");
    return index > 0 ? name.substr(0, index) : '';
}

function getContext( name )
{
    var key = '/'+getPackageName(name);
    return modules.hasOwnProperty(key) ? modules[key] : modules[key]={};
}

function getClassName(name)
{
    return name.substr( name.lastIndexOf(".")+1 );
}

var fix = !$Array.prototype.map;
function define(requires , callback )
{
    var name = requires[0];
    var context=getContext( name );
    var name = getClassName( name );
    return context[name] || (context[name]={
        name:name,
        factory:callback,
        exports:null,
    });


    if( context.hasOwnProperty(name) && context[name].__T__ )
    {
        return;
    }
    requires = Array.prototype.map.call( requires , function (item)
    {
        if( System.hasOwnProperty( item ) )return System[item];
        var ref =  null;
        var prefix = item.substr(0,3);
        if( prefix === "ns:" || prefix === "if:" )
        {
            item = item.substr(3);
        }
        var context=getContext( item );
        var name = getClassName( item );
        if (prefix === "ns:")
        {
            ref = context.hasOwnProperty(name) ? context[ name ] : context[ name ] = new Namespace();
        } else if (prefix === "if:")
        {
            ref = context.hasOwnProperty(name) ? context[ name ] : context[ name ] = new Interface();
        }else
        {
            ref = context.hasOwnProperty(name) ? context[ name ] : context[ name ] = new Class();
        }
        return ref;
    });
    if(fix)requires = requires.slice(0);
    return callback.apply({_private:Symbol(name).valueOf()}, requires);
}
Internal.define = define;

define.create=function(module,classFactory)
{
    module.exports = classFactory;
    require.d(module, "exports", { enumerable: false,value:factory,configurable:false });
    Object.defineProperty(factory, "name", { enumerable: false, value: name,configurable:false });
    Object.defineProperty(factory, "valueOf", { enumerable: false, value:function valueOf(){
        return "[Class "+name+"]";
    },configurable:false});
    Object.defineProperty(factory, "toString", { enumerable: false, value:function toString(){
        return "[Class "+name+"]";
    },configurable:false});
    return factory;
    
}

/**
 * 获取类的全名
 * @private
 * @param classModule
 * @returns {string}
 */
function getFullname(classModule)
{
    return classModule.__T__.package ? classModule.__T__.package + '.' + classModule.__T__.classname : classModule.__T__.classname;
}


function installer(module)
{
    if( module.installed )return module;
    module.installed = true;
    var requires = Array.prototype.map.call(module.requires, function(item)
    {
        return System.getDefinitionByName( item );
    });

    if(fix)requires = requires.slice(0);
    module._private=Symbol(name).valueOf();
    module.factory.apply(module, requires);
    return module;

}


/**
 * 根据指定的类名获取类的对象
 * @param name
 * @returns {Object}
 */
System.getDefinitionByName = function getDefinitionByName(name) {

    var context = getContext(name);
    name = getClassName(name);
    if( has.call(context,name) ){
        return installer(context[name]).exports;
    }
    if( has.call(System, name))return System[name];
    throw new TypeError('"' + name + '" is not define');
};

System.hasClass = function hasClass(name) {

    var context = getContext(name);
    name = getClassName(name);
    return has.call(context,name);
};

var map=['System','Class','Interface','Namespace','Reflect','Object','JSON','Array','String','EventDispatcher','TypeError','Error','Symbol','Element'];

/**
 * 返回类的完全限定类名
 * @param value 需要完全限定类名称的对象。
 * 可以将任何类型、对象实例、原始类型和类对象
 * @returns {string}
 */
System.getQualifiedClassName = function getQualifiedClassName( target )
{
    if( target == null )throw new ReferenceError( 'target is null or undefined' );
    if( target===System )return 'System';
    if( target===JSON )return 'JSON';
    if( target===Reflect )return 'Reflect';
    if( target instanceof Class )
    {
        return getFullname( target );
    }
    if( typeof target === "function" && target.prototype)
    {
        var con  = target.prototype.constructor;
        if( con )
        {
            var str = con.toString();
            if( str.indexOf('[native code]')>0 )
            {
                str = str.substr(0, str.indexOf('(') );
                return str.substr(str.lastIndexOf(' ')+1);
            }
            for (var b in map)
            {
                var obj = System[ map[b] ];
                if (con === obj) {
                    return map[b];
                }
            }
        }
    }
    throw new ReferenceError( 'target is not class' );
};

/**
 * 返回对象的完全限定类名
 * @param value 需要完全限定类名称的对象。
 * 可以将任何类型、对象实例、原始类型和类对象
 * @returns {string}
 */
System.getQualifiedObjectName = function getQualifiedObjectName( target )
{
    if( target == null )
    {
        throw new ReferenceError( 'target is null or undefined' );
    }else if( typeof target !== "object" || target instanceof Class ){
        throw new ReferenceError( 'target is not object' );
    }
    if( target.constructor instanceof Class )return getFullname( target.constructor );
    return System.getQualifiedClassName( Object.getPrototypeOf( target ).constructor );
};
/**
 * 获取指定实例对象的超类名称
 * @param value
 * @returns {string}
 */
System.getQualifiedSuperclassName =function getQualifiedSuperclassName(target)
{
    if( target == null )throw new ReferenceError( 'target is null or undefined' );
    if ( target instanceof Class )
    {
        var objClass = target.__T__["extends"] || Object;
        if ( objClass )
        {
            return System.getQualifiedClassName( objClass );
        }
    }
    return null;
};