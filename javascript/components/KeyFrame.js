/**
 * 关键侦构造函数
 * @param length
 * @constructor
 * @require Object,Element,,Error,Motions
 */
function KeyFrame( length )
{
    if( !(this instanceof  KeyFrame) )
       return new KeyFrame(length);
    this.__motions__=[];
    this.length( length );
}
KeyFrame.prototype.constructor = KeyFrame;
KeyFrame.prototype.__name__=0;
KeyFrame.prototype.__lenght__=1;
KeyFrame.prototype.__start__=0;
KeyFrame.prototype.__end__=0;
KeyFrame.prototype.__timeline__=null;
KeyFrame.prototype.__motions__=[];
KeyFrame.prototype.__prevKeyFrame__=null;
KeyFrame.prototype.__nextKeyFrame__=null;

/**
 * 紧邻的上一个关键侦
 * @read-only
 * @returns {KeyFrame}
 */
KeyFrame.prototype.prevKeyFrame=function()
{
    return this.__prevKeyFrame__;
};

/**
 * 紧邻的下一个关键侦
 * @read-only
 * @returns {KeyFrame}
 */
KeyFrame.prototype.nextKeyFrame=function()
{
    return this.__nextKeyFrame__;
};

/**
 * 获取时间轴对象
 * @read-only
 * @returns {Timeline}
 */
KeyFrame.prototype.timeline=function()
{
    if( !(this.__timeline__ instanceof System.Timeline) )
    {
        throw new System.Error('timeline instance is empty');
    }
    return this.__timeline__;
};

/**
 * 当前关键需要播放的总时长
 * @read-only
 * @returns {number}
 */
KeyFrame.prototype.timeByIndex=function()
{
    return this.timeline().timeByIndex( this.timeline().next() - this.start() );
};

/**
 * 动作入口
 * @read-only
 * @returns {null|NodeElement}
 */
KeyFrame.prototype.action=function()
{
   var motion,motions = this.motions();
   var len = motions.length,index=0;
   var d = this.timeline().duration( this.length() );
   var t = this.timeByIndex();
   var timing = this.timeline().timing();

   for( ;index< len ; index++ )
   {
       motion = motions[index];
       if( motion instanceof Motions )
       {
           var properties = motion.get();
           var target = motion.__proxyTarget__();
           var i= 0, l= properties.length;
           for( ; i<l; i++ )
           {
                var property = properties[i];
                var to = property.to;
                var from  = property.from;
                var value =timing ? Math.round( timing(t,from, to-from, d) ) : NaN;
                if( !motion.isNodeElement )
                {
                   target.call( this, value);
                }else
                {
                    property.flag ? property.property.call(target, value) : target.style(property.property, value);
                }
           }

       }else if( typeof motion === "function" )
       {
           motion.call(this,t,d,timing);
       }
   }
};


/**
 * 关键侦在侦格上的开始位置
 * @read-only
 * @returns {number}
 */
KeyFrame.prototype.start=function()
{
    return this.__start__;
};

/**
 * 关键侦在侦格上的结束位置
 * @read-only
 * @returns {number}
 */
KeyFrame.prototype.end=function()
{
    return this.__end__;
};

/**
 * 关键侦在侦格上持续的长度
 * @param length
 * @returns {*}
 * @public
 */
KeyFrame.prototype.length=function( length )
{
     if( typeof length !==  "undefined" )
     {
         length = length>>0;
         if( length < 1 )throw new Error('invalid length. The keyframe lenght must be greater than 0');
         this.__lenght__ = length;
         return this;
     }
     return this.__lenght__;
};

/**
 * 设置获取运动属性对象
 * @param Motions motions 目标运动属性对象
 * @returns {Array|KeyFrame}
 * @public
 */
KeyFrame.prototype.motions=function( motions )
{
    if( typeof motions !== "undefined" )
    {
        if( !(motions instanceof Motions) && typeof motions !== "function" )
            throw new Error('invalid motionProperties');
        this.__motions__.push(motions);
        return this;
    }
    return this.__motions__;
};

/**
 * 设置获取关键侦名称
 * @public
 * @param string name
 * @returns {*}
 */
KeyFrame.prototype.name=function( name )
{
    if( typeof name !== "undefined" )
    {
        this.__name__ = name;
        return this;
    }
    return this.__name__;
};
System.KeyFrame=KeyFrame;
