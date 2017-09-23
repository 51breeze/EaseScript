
/**
 * 皮肤类
 * @constructor
 * @require Internal,Object,TypeError,Math,EventDispatcher,Reflect,Symbol,Render,Element,SkinEvent,State,ElementEvent
 */

/**
 * @private
 */
var storage=Internal.createSymbolStorage( Symbol('skin') );
var has = $Object.prototype.hasOwnProperty;
function Skin( skinObject )
{
    skinObject = skinObject || {};
    var attr=skinObject.attr || {};
    var name = skinObject.name || 'div';
    var hash = skinObject.hash;
    if( hash )
    {
        for(var h in hash )
        {
           if( hash[h]==='@id' )
           {
               hash[h] = System.uid();
               if( attr.id===h ) attr.id = hash[h];
           }
        }
    }
    storage(this, true,{
        'parent':null,
        'hostComponent':null,
        'validation':false,
        'attr': attr,
        'name': name,
        'stateGroup':{},
        'hash': skinObject.hash || {},
        'children': skinObject.children || []
    });

    var str = System.serialize(attr,'attr');
    Element.call(this, '<'+name+" "+str+'/>');
}

Skin.prototype = Object.create( Element.prototype );
Skin.prototype.constructor = Skin;

/**
 * 获取父级皮肤元素
 * 只有已经添加到父级元素中才会返回父级皮肤元素，否则返回 null
 * @returns {null|Skin}
 */
Skin.prototype.parent=function parent()
{
    return storage(this,'parent') || null;
};

/**
 * 获取子级元素
 * @returns {Array}
 */
Skin.prototype.children=function children()
{
    return storage(this,'children') || [];
};

/**
 * 根据id获取子级元素
 * @param id
 * @returns {*}
 */
Skin.prototype.getChildById = function getChildById( id )
{
    var data = storage(this,'hash');
    if( has.call(data, id) )
    {
        return data[id];
    }
    return null;
};

/**
 * 获取指定索引处的子级元素
 * @param index
 * @returns {Skin}
 */
Skin.prototype.getChildAt=function getChildAt( index )
{
    var children = storage(this, 'children');
    index = index < 0 ? index+children.length : index;
    var result = children[index] && System.instanceOf(children[index],Skin) ? children[index] : null;
    if( result=== null )
    {
        throw new RangeError('The index out of range');
    }
    return result;
};

/**
 * 根据子级皮肤返回索引
 * @param child
 * @returns {Number}
 */
Skin.prototype.getChildIndex=function getChildIndex( child )
{
    var children = storage(this, 'children');
    for(var i in children )
    {
         if( children[i] === child && System.instanceOf(children[i] , Skin) )
         {
             return i;
         }
    }
    return -1;
};

/**
 * 添加一个子级元素
 * @param child
 */
Skin.prototype.addChild = function addChild( childElement )
{
    return Skin.prototype.addChildAt.call(this, childElement, -1 );
};

/**
 * 在指定索引位置添加元素
 * @param child
 * @param index
 * @returns Skin
 */
Skin.prototype.addChildAt = function addChildAt( childElement , index )
{
    if( System.instanceOf( childElement, Skin ) )
    {
        var children = storage( this,'children');
        var indexAt = index < 0 ? index+children.length : index;
        if( children.length > 0 )
        {
            var childSkin = Skin.prototype.getChildAt.call(this, index);
            index = Element.prototype.getChildIndex.call(this, childSkin[0] );
        }
        Element.prototype.addChildAt.call(this, childElement[0], index );
        children.splice(indexAt, 0, childElement);
        storage( childElement, 'parent', this);
        return childElement;
    }
    throw new TypeError('The child is not skin element');
};

/**
 * 移除指定的子级元素
 * @param Element
 * @returns Skin
 */
Skin.prototype.removeChild = function removeChild( childElement )
{
    var index = Skin.prototype.getChildIndex.call(this,childElement);
    if( index >= 0 )
    {
        Element.prototype.removeChild.call(this, childElement.current() );
        storage(this,'children').splice(index,1);
        storage(childElement,'parent', null);
        return childElement;
    }
    throw new ReferenceError('The child skin does not exists');
};

/**
 * 移除指定索引的子级元素
 * @param Element
 * @returns Skin
 */
Skin.prototype.removeChildAt = function removeChildAt( index )
{
    var child=Skin.prototype.getChildAt.call(this,index);
    Element.prototype.removeChild.call(this, child.current() );
    storage(this,'children').splice(index,1);
    storage(child,'parent', null);
    return child;
};

/**
 * 为当前的皮肤添加一组子级元素, 并清空当前已存在的子级元素
 * @param childElement
 * @returns Skin
 */
Skin.prototype.html = function html( childElement )
{
     if( childElement == null )return Element.prototype.html.call(this);
     if( !System.instanceOf(childElement,Skin) )
     {
         throw new TypeError('is not child Skin');
     }
     Element.prototype.html.call(this, childElement );
     storage(this,'children', [childElement] );
     storage(childElement,'parent', this );
     return childElement;
};

/**
 * 当组件准备生成皮肤之前会调用此方法，无需手动调用
 */
Skin.prototype.initializing = function initializing()
{
    return !storage(this,'initialized_flag');
};

/**
 * 当组件此生成皮肤结束并且将此皮肤添加到视图中后由系统调用此方法，无需手动调用
 */
Skin.prototype.initialized = function initialized()
{
    return !!storage(this,'initialized_flag');
};

/**
 * 设置状态对象
 * 如果在每一个子皮肤中应用了当前状态，那么这些皮肤会随着状态的变化来决定是否显示在当前的视图中
 * @param String name
 * @param Array group
 */
Skin.prototype.states=function states( value )
{
    if( !(System.instanceOf(value, System.Array) ) )
    {
        throw new TypeError('Invalid param group in Skin.prototype.states');
    }
    var len = value.length;
    var i=0;
    var stateGroup={};
    storage(this,'stateGroup', stateGroup);
    for(;i<len;i++)
    {
        if( !(value[i] instanceof State) )
        {
            throw new TypeError('array element is not State. in Skin.prototype.states');
        }
        var name = value[i].name();
        if( !name )throw new TypeError('name is not define in Skin.prototype.states');
        if( has.call( stateGroup, name ) )
        {
            throw new TypeError('"'+name+'" has already been declared in Skin.prototype.states');
        }
        stateGroup[ name ] = value[i];
    }
    return this;
};

/**
 * 获取设置当前状态组名
 * @returns {Skin}
 */
Skin.prototype.currentState = function currentState( name )
{
    var current = storage(this,'currentState');
    if( typeof name === "string" )
    {
        if( current !== name )
        {
            storage(this,'currentState', name);
            if( storage(this,'initialized_flag') === true )
            {
                EventDispatcher.prototype.dispatchEvent.call(this, new SkinEvent('internal_skin_state_changed'));
                Reflect.apply( Reflect.get(this, "updateDisplayList"), this );
            }
        }
        return this;
    }
    return current;
};

/**
 * 获取设置当前状态组名
 * @returns {Skin}
 */
Skin.prototype.layout = function layout( layoutObject )
{
    var current = storage(this,'layout');
    if( layoutObject != null && layoutObject !==current )
    {
        storage(this,'layout', layoutObject );
        return layoutObject;
    }
    return current;
};

/**
 * 在初始化皮肤皮会先设置宿主组件
 * @param host
 * @returns {Object}
 */
Skin.prototype.hostComponent = function hostComponent(host)
{
    var _host = storage(this,'hostComponent');
    if( host != null && _host===null );
    {
        storage(this,'hostComponent', host );
        return host;
    }
    return _host;
};

/**
 * 设置一个渲染器
 * @param value
 * @returns {Render}
 */
Skin.prototype.render=function render( value )
{
    var old = storage(this, 'render');
    if( value != null )
    {
        if ( !System.instanceOf(value, Render) )
        {
            throw new TypeError('Invalid param type, must be a Render. in Skin.prototype.render');
        }
        storage(this, 'render', value);
        return this;
    }
    if( !old )
    {
        old = new Render();
        storage(this, 'render', old);
    }
    return old;
};

/**
 * 设置一个皮肤模板
 * @param value
 * @returns {*}
 */
Skin.prototype.template=function template( value )
{
    var render = Skin.prototype.render.call(this);
    var result = render.template( value );
    return result === render ? this : result;
};

/**
 * 为模板设置变量
 * @param name
 * @param value
 * @returns {*}
 */
Skin.prototype.variable=function variable(name,value)
{
    var render = Skin.prototype.render.call(this);
    var result = render.variable( name,value );
    return result === render ? this : result;
};

/**
 * 创建一组子级元素
 * 当前皮肤被添加到视图中后会自动调用，无需要手动调用
 */
Skin.prototype.createChildren = function createChildren()
{
    var flag = storage(this,'initialized_flag');
    if( flag !== true )
    {
        Reflect.apply( Reflect.get(this, "initializing"), this);
    }

    var skinObject = storage(this);
    var children = skinObject.children;
    var hash = skinObject.hash;
    var len = children.length;
    var c = 0;
    var child;
    var render = storage(this, 'render');
    var parent = storage(this, 'parent');

    Element.prototype.html.call(this, '');
    if( render )
    {
        child = render.fetch();
        if( child ) {
            Element.prototype.addChildAt.call(this, Element.createElement(child, true), -1);
        }
    }

    for (;c<len;c++)
    {
        child = children[c];
        if( child+"" === '[object Object]' )
        {
            child = __toString(child, hash );

        }else if( System.instanceOf(child,Render) )
        {
            child = child.fetch();
        }

        if( child )
        {
            if (child+"" === child )
            {
                Element.prototype.addChildAt.call(this, Element.createElement(child, true), -1);

            }else if( System.instanceOf(child,Skin) )
            {
                storage(child, 'parent', this);
                Reflect.apply( Reflect.get(child, "createChildren"), child);
                Element.prototype.addChildAt.call(this, child, -1);

            }
        }
    }

    if( parent )
    {
        var e = new ElementEvent( ElementEvent.CHNAGED );
        e.parent = parent[0];
        e.child = this[0];
        e.result = true;
        EventDispatcher.prototype.dispatchEvent.call(parent, e);
    }

    //触发完成事件
    EventDispatcher.prototype.dispatchEvent.call(this, new SkinEvent( SkinEvent.CREATE_CHILDREN_COMPLETED ) );
    Reflect.apply( Reflect.get(this, "updateDisplayList"), this);

    if( flag !== true )
    {
        Reflect.apply( Reflect.get(this, "initialized"), this);
        storage(this,'initialized_flag', true);
    }
};

/**
 * @private
 * @param stateGroup
 * @param currentState
 * @returns {*}
 */
function getCurrentState( stateGroup, currentState )
{
    if( !stateGroup )return null;
    if( has.call(stateGroup,currentState ) )return stateGroup[currentState];
    for( var p in stateGroup )
    {
        if( stateGroup[p].includeIn(currentState) )
        {
            return currentState;
        }
    }
    return null;
}

/**
 * 更新显示列表
 */
Skin.prototype.updateDisplayList=function updateDisplayList()
{
    var currentState = storage(this,'currentState');
    if( currentState )
    {
        var stateGroup = getCurrentState( storage(this,'stateGroup') , currentState );
        if( !stateGroup )throw new ReferenceError('"'+currentState+'"'+' is not define');
        var isGroup = typeof stateGroup !== "string";
        Element('[includeIn],[excludeFrom]', this).forEach(function ()
        {
            var includeIn = this.property('includeIn');
            var include = isGroup ? stateGroup.includeIn(includeIn) : includeIn===currentState;
            if( include )
            {
                var excludeFrom = this.property('excludeFrom');
                if( excludeFrom ) {
                    include = !( isGroup ? stateGroup.includeIn(excludeFrom) : excludeFrom === currentState );
                }
            }
            if( include )
            {
                this.show();
            }else{
                this.hide();
            }
        });
    }
    var layoutObject = storage(this,'layout');
    if( layoutObject )
    {
        Internal["Layout.prototype.target"].call(layoutObject, this);
    }
};

/**
 * 将皮肤对象转字符串
 */
Skin.prototype.toString=function toString()
{
    return '[object Skin]';
};

/**
 * 对象的表示形式
 * @returns {string}
 */
Skin.prototype.valueOf=function valueOf()
{
    return '[object Skin]';
};

//private
function __toString(skin, hash )
{
    var tag = skin.name || 'div';
    var children = skin.children || [];
    var attr = skin.attr || {};
    var content='';
    for (var c in children)
    {
        var child = children[c];
        if ( child+"" === "[object Object]" )
        {
            content += __toString(child, hash );
        } else
        {
            content += child.toString();
        }
    }
    if( tag==='text' )return content;
    var str = '<' + tag;
    for (var p in attr)
    {
        var v = attr[p];
        v = p==='id' && has.call(hash,v) ? hash[v] : v;
        str += " " + p + '="' + v + '"';
    }
    str += '>' + content + '</' + tag + '>';
    return str;
}
System.Skin=Skin;