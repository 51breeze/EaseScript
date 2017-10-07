/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,TypeError,ReferenceError
 */
function State( name )
{
     if( !(this instanceof State) )
     {
         this.__name__ = name;
         return new State(name);
     }
}

System.State = State;
State.prototype = Object.create( Object.prototype );
State.prototype.__name__='';
State.prototype.__stateGroup__=[];
State.prototype.name=function name( value )
{
    if( value==null )return this.__name__;
    if(  typeof value !== "string" )
    {
        throw new TypeError('Invalid param in State.prototype.name');
    }
    this.__name__=value;
};

State.prototype.stateGroup=function stateGroup( value )
{
    if( value == null )return this.__stateGroup__;
    if( !System.isArray(value) )
    {
        throw new TypeError('Invalid param in State.prototype.stateGroup');
    }
    this.__stateGroup__=value;
};

State.prototype.includeIn=function includeIn( value )
{
    return value===this.name() || this.__stateGroup__.indexOf(value) >= 0;
};