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

        if( typeof options !== "object" || !options )
        {
            throw new TypeError( "options is not object or null in Watch.start." );
        }
        
        var files = options.files instanceof Array ? options.files : [options.files];
        files.forEach(function(file)
        {
            if( !map[ file ] )
            {
                var isdir = utils.isDir( file );
                var invoke = (function(isdir,file){
                    var checking = false; 
                    return function(event,name)
                    {
                        if( checking ===true )return;
                        checking = true;
                        var match = true;
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
                            if( isdir )
                            {
                                name =  path.join(file, name);
                            }
                            var stat = fs.statSync( name );
                            var time = Math.ceil( (new Date( stat.mtime )).getTime() / 1000 );
                            var old = stats[ name ];
                            stats[ name ] = time;
                            if( time !== old  )
                            {
                                setTimeout(function(){
                                    callback( name , stat );
                                    checking = false;
                                },100);
                                
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
       });
    },
    stop:function( files )
    {
        if( files )
        {
            files = files instanceof Array ? files : [files];
            utils.forEach(files,function(filename)
            {
                if( map[ filename ] )
                {
                    map[ filename ].fswatch.removeListener("change", map[filename].invoke );
                    map[ filename ].fswatch.close();
                    delete map[ filename ];
                }
            });

        }else
        {
            utils.forEach(map,function(item)
            {
                item.fswatch.removeListener("change", item.invoke);
                item.fswatch.close();
            });
            map={};
        } 
        
    }
}