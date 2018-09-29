var _stack = [];
Internal.addStack =function (filename, info){
    if( !info )return;
    _stack.push(info.replace(/(\:\d+\:\d+)$/, function (a,b) {
        return ' ('+filename+b+')';
    }));
    if( _stack.length > 10 )_stack.shift();
}
Internal.getStack =function()
{
    return _stack;
}