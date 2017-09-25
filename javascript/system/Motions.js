/**
 * 目标运动属性对象
 * @param nodeElement|function target 需要运动的目标元素
 * @constructor
 * @require Object,Element,Error
 */
function Motions( target )
{
    if( !(this instanceof  Motions) )
      return new Motions(target);
    if( typeof target !== "function" )
    {
        this.__target__=target;
    }else{
        this.__target__= Element(target);
        if( !this.__target__.isNodeElement() )throw new Error('invalid target');
        this.isNodeElement=true;
    }
    this.__properties__=[];
}

Motions.prototype.constructor=Motions;
Motions.prototype.__target__=null;
Motions.prototype.__properties__=[];

/**
 * 运动目标对象
 * @read-only
 * @returns {null|NodeElement}
 */
Motions.prototype.__proxyTarget__=function()
{
    return this.__target__;
};

/**
 * 设置运动属性方位
 * @param string|function property  属性名称
 * @param number from  开始点
 * @param number to  结束点
 * @returns {Motions}
 */
Motions.prototype.set=function(property,from,to)
{
    var type =  typeof property;
    if( type !== "string" && type !== "function" )
       throw new Error('invalid property');
    from = System.parseFloat( from );
    to =  System.parseFloat( to );
    if( System.isNaN(from)  )throw new Error('The from type must be is number');
    if( System.isNaN(to)  )throw new Error('The to type must be is number');
    this.__properties__.push( {'property':property,'from': from, 'to': to, flag: type === "function" } );
    return this;
};

/**
 * 获取运动属性
 * @param string|function property 属性名称
 * @returns {*}
 */
Motions.prototype.get=function( property )
{
    if( typeof property === "undefined" )
      return this.__properties__;

    var len = this.__properties__.length;
    var index = 0;
    for(; index < len; index++ )if( this.__properties__[index].property === property )
    {
        return this.__properties__[index];
    }
    return null;
};
System.Motions=Motions;