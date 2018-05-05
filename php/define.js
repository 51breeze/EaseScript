/**
 * 定义模块对象
 * @require System,Internal,Class,Interface,Namespace,Reflect,Object,JSON,Array,TypeError,Error
 * @internal
 */
var modules={};
var has = $Object.prototype.hasOwnProperty;
var nsvalue={};
var nslength = 1;
function getValueOfNS( name )
{
    if( has.call(nsvalue,name) )return nsvalue[name];
    return nsvalue[name] = '@ns:'+nslength++;
}

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
    var pn = getPackageName(name);
    var context = getContext(name);
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
    requires.push( getValueOfNS("public") );
    requires.push( getValueOfNS(pn+":internal") );
    requires.push( getValueOfNS(name+":protected") );
    requires.push( getValueOfNS(name+":private") );
    if(fix){
        requires = requires.slice(0);
    }
    return callback.apply( context, requires);
}
Internal.define = define;

/**
 * 获取类的全名
 * @private
 * @param classModule
 * @returns {string}
 */
function getFullname(classModule) {
    return classModule.__T__.package ? classModule.__T__.package + '.' + classModule.__T__.classname : classModule.__T__.classname;
}

/**
 * 根据指定的类名获取类的对象
 * @param name
 * @returns {Object}
 */
System.getDefinitionByName = function getDefinitionByName(name) {

    var context = getContext(name);
    name = getClassName(name);
    if( Object.prototype.hasOwnProperty.call(context,name) )return context[name];
    if(Object.prototype.hasOwnProperty.call(System, name))return System[name];
    throw new TypeError('"' + name + '" is not define');
};

/**
 * 返回对象的完全限定类名
 * @param value 需要完全限定类名称的对象。
 * 可以将任何类型、对象实例、原始类型和类对象
 * @returns {string}
 */
System.getQualifiedClassName = function getQualifiedClassName(value)
{
    if( value==null )return 'Object';
    if( value===System )return 'System';
    if( value===JSON )return 'JSON';
    if( value===Reflect )return 'Reflect';
    if( value instanceof Class )return getFullname( value );
    var type = typeof value;
    if( type==='number' || type==='boolean')return System.ucfirst(type);
    var str = (value.constructor || value).toString();
    str = str.substr(0, str.indexOf('(') );
    var name = str.substr(str.lastIndexOf(' ')+1);
    if( name && !System[name] && !modules[name] )
    {
        throw new ReferenceError( '"'+name+'" type does not exist' );
    }
    return name;
};
/**
 * 获取指定实例对象的超类名称
 * @param value
 * @returns {string}
 */
System.getQualifiedSuperclassName =function getQualifiedSuperclassName(value)
{
    var classname = System.getQualifiedClassName(value);
    if (classname)
    {
        var classModule = System.getDefinitionByName(classname);
        var parentModule = classModule.__T__["extends"];
        if (parentModule)
        {
            return parentModule.fullclassname;
        }
    }
    return null;
};