/**
 * 执行上下文
 * @returns {Function}
 * @constructor
 * @require System,Object;
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