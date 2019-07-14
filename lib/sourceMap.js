const SourceMap = require('source-map');
const SourceNode = SourceMap.SourceNode;

module.exports = {

    "createSourceMap":function( config, classModule)
    {
        return (function(config,classmodule)
        {
            var nodes = [];
            var suffix = config.suffix;
            var source = (classModule.package ? classModule.package+"."+classModule.classname : classModule.classname)+suffix;
            return {
                "createNode":function( ast , chunk )
                {
                    var node = new SourceNode(
                        ast.line,
                        ast.cursor,
                        source,
                        chunk,
                        ast.value
                    );
                    nodes.push( node );
                    return node;
                },
                "getNodes":function(){
                    return nodes;
                },
                "toString":function()
                {
                   var root = new SourceNode(1, 0, source, nodes);
                   root.setSourceContent(source, classmodule.__sourceContent__||"");
                   var generator = root.toStringWithSourceMap();
                   return generator.map.toString();
                }
            };

        }(config,classModule));
    }
}