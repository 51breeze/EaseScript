const fs = require('fs');
const path = require('path');
const utils = require('./utils.js');

var map={};
var stats={};
module.exports = {
    start:function( options, callback )
    {
        if( typeof callback !== "function" )
        {
            throw new TypeError( "callback is not function in Watch.start." );
        }

        if( typeof options === "string" )
        {
            options={files:options};
        }

        if( typeof options !== "object" || !options )
        {
            throw new TypeError( "options is not object or null in Watch.start." );
        }
        
        var files = options.files instanceof Array ? options.files : [options.files];
        files.forEach(function(file)
        {
            if( file && typeof file === "string")
            {
                file = path.resolve( file );

                if( !map[ file ] )
                {
                    var isdir = utils.isDir( file );
                    var invoke = (function(isdir,file){
                        var checking = false; 
                        return function(event,name)
                        {
                            if( checking ===true || !name )return;
                            checking = true;
                            var match = true;
                            if( isdir )
                            {
                                name =  path.join(file, name);
                            }else{
                                name = file;
                            }

                            if( options.match )
                            {
                                var ext = path.extname( name ) || name;
                                match = options.match === ext;
                                if( options.match instanceof RegExp )
                                {
                                    match = options.match.test(ext);
                                }else if( options.match instanceof Array )
                                {
                                    match = options.match.indexOf( ext ) >=0 ;
                                }
                            }
                            if( match )
                            {
                                var stat = null;
                                var time = 0;
                                var old  = void 0;
                                if( fs.existsSync(name) )
                                {
                                    stat = fs.statSync( name );
                                    time = Math.ceil( (new Date( stat.mtime )).getTime() / 1000 );
                                    old = stats[ name ];
                                    stats[ name ] = time;
                                }else{
                                    delete stats[ name ];
                                }

                                if( time !== old  )
                                {
                                    callback( name , stat );
                                    checking = false;

                                }else
                                {
                                    checking = false;
                                }

                            }else
                            {
                                checking = false;
                            }
                        }
                    }(isdir,file));

                    map[ file ]={
                        fswatch:fs.watch( file ,{persistent:true,recursive:true},invoke),
                        invoke:invoke,
                        isdir:isdir
                    };
                }
            }
       });
    },
    stop:function( files )
    {
        if( files )
        {
            files = files instanceof Array ? files : [files];
            utils.forEach(files,function(filename)
            {
                filename = path.resolve( filename )
                if( map[ filename ] )
                {
                    map[ filename ].fswatch.removeListener("change", map[filename].invoke );
                    map[ filename ].fswatch.close();
                    delete map[ filename ];
                }
            });

        }else
        {
            const all = map;
            map = {};
            utils.forEach(all,function(item,filename)
            {
                item.fswatch.removeListener("change", item.invoke);
                item.fswatch.close();
                delete all[ filename ];
            });
        }
    }
}

process.on("exit", ()=>{
    module.exports.stop();
});

process.on('SIGINT', () => {
    module.exports.stop();
});