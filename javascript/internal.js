var _stack = [];
Internal.environment = environment;
Internal.addStack =function (filename, info){
    if( !info )return;
    _stack.splice(10, 1, info.replace(/(\:\d+\:\d+)$/, function (a,b) {
        return ' ('+filename+b+')';
    }));
}
Internal.getStack =function()
{
    return _stack;
}