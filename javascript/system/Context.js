/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
function Context( name )
{
    var current = function(name){
        var children = current.children || (current.children={});
        var c = children[name];
        if( !c )
        {
            c= children[name] = Context(name);
            c.parent = current;
            c.root = current.root || current;
        }
        return c;
    };
    current.label = name;
    current.parent = null;
    current.scope = {};
    return current;
}