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

module.exports = function router(req, res, next)
{
    const router = env.HTTP_ROUTES[ req.method.toLowerCase() ]
    if( router && router[ req.path ] )
    {
        const route = router[ req.path ].split("@");
        const controller = route[0];
        const method = route[1];
        const module = require( Path.join(root_path, controller.replace(/\./g,'/')+".js") );
        const obj = new module();
        obj.addEventListener(PipeLineEvent.PIPELINE_DATABASE,function(e){
            query( e.getCmd(), function( result ){
                  e.setData( result );
                  res.status(200)
                  res.send( e.valueOf() );
            });
        });
        obj[ method ]();

    }else
    {
        next();
    }
}
