const Path= require("path");
const Mysql= require("mysql");
const Internal= require("[CODE[REQUIRE_IDENTIFIER(Internal)]]");
const Object  = require("[CODE[REQUIRE_IDENTIFIER(Object)]]");
const System  = require("[CODE[REQUIRE_IDENTIFIER(System)]]");
const Event   = require("[CODE[REQUIRE_IDENTIFIER(Event)]]");
const PipeLineEvent = require("[CODE[REQUIRE_IDENTIFIER(es.events.PipelineEvent)]]");
const root_path = "[CODE[ROOT_PATH]]";

/**
 * 运行环境相关信息
 */
const env={
    "HTTP_DEFAULT_ROUTE":"[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]",
    "HTTP_ROUTES":[CODE[SERVICE_ROUTE_LIST]],
    "HTTP_ROUTE_PATH":null,
    "MODE":[CODE[MODE]],
    "ORIGIN_SYNTAX":"[CODE[ORIGIN_SYNTAX]]",
    "URL_PATH_NAME":"[CODE[STATIC_URL_PATH_NAME]]",
    "HTTP_ROUTE_CONTROLLER":null,
    "COMMAND_SWITCH":[CODE[COMMAND_SWITCH]],
    "VERSION":[CODE[VERSION]],
    "LOAD_JS_PATH":"[CODE[JS_LOAD_PATH]]",
    "LOAD_CSS_PATH":"[CODE[CSS_LOAD_PATH]]",
    "WORKSPACE":"[CODE[WORKSPACE]]",
    "MODULE_SUFFIX":"[CODE[MODULE_SUFFIX]]"
};

Object.merge(Internal.env, env);

const connection = Mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
});
  
connection.connect();
process.on('SIGINT', () => {
    connection.end();
});

function query( sql, callback )
{
    connection.query(sql, function (err, rows, fields) {
        if (err) throw err;
        callback( rows, fields);
    });
}

function match(routes, pathName )
{
    if( !routes )
    {
        return null;
    }

    pathName = pathName.replace(/^\/|\/$/g,'');
    const pathArr = pathName.split('/');
    for(var p in routes )
    {
       const routeName = p.replace(/^\/|\/$/g,'').toLowerCase();
       const routeArr = routeName.split('/');
       if( routeArr.length === pathArr.length )
       {
           var args = [];
           var props = [];
           if( p.indexOf("{") >= 0 )
           {
                var index = 0;
                var len = routeArr.length;
                while( index < len )
                {
                    var name = routeArr[ index ];
                    if( name.charAt(0) ==="{" && name.charAt(name.length-1) ==="}" )
                    {
                       props.push( name.slice(1,-1) )
                       args.push( pathArr[index] );

                    }else if( name !== pathArr[index].toLowerCase() )
                    {
                       break;
                    }
                    index++;
                }

                if( index < len )
                {
                    continue;
                }

           }else if( routeName !== pathName.toLowerCase() )
           {
               continue;
           }

           return {
              provider:routes[ p ],
              props:props,
              args:args
           }
       }
    }
    return null;
}

module.exports = function router(req, res, next)
{
    const router = env.HTTP_ROUTES[ req.method.toLowerCase() ];
    const result = match( router, req.path );
    
    if( result )
    {
        const route = result.provider.split("@");
        const controller = route[0];
        const method = route[1];
        const moduleClass = require( Path.join(root_path, controller.replace(/\./g,'/')+".js") );
        const obj = new moduleClass();
        obj.addEventListener(PipeLineEvent.PIPELINE_DATABASE,function(e){
            query( e.getCmd(), function( result ){
                  e.setData( result );
                  res.status(200)
                  res.send( e.valueOf() );
            });
        });
        obj[ method ].apply(obj, result.args );

    }else
    {
        next();
    }
}