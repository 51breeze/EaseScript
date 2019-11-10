const Path= require("path");
const fs= require("fs");
const Internal= require("[CODE[REQUIRE_IDENTIFIER(Internal)]]");
const Object  = require("[CODE[REQUIRE_IDENTIFIER(Object)]]");
const Array  = require("[CODE[REQUIRE_IDENTIFIER(Array)]]");
const System  = require("[CODE[REQUIRE_IDENTIFIER(System)]]");
const Event   = require("[CODE[REQUIRE_IDENTIFIER(Event)]]");
const PipeLineEvent = require("[CODE[REQUIRE_IDENTIFIER(es.events.PipelineEvent)]]");
const root_path = "[CODE[ROOT_PATH]]";
const config = require("./config.json");

/**
 * 运行环境相关信息
 */
const env={
    "HTTP_DEFAULT_ROUTE":"[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]",
    "HTTP_SERVER_ROUTES":[CODE[SERVICE_ROUTE_LIST]],
    "HTTP_VIEW_ROUTES":[CODE[VIEW_ROUTE_LIST]],
    "HTTP_ROUTE_PATH":null,
    "MODE":[CODE[MODE]],
    "ORIGIN_SYNTAX":"[CODE[ORIGIN_SYNTAX]]",
    "URL_PATH_NAME":"[CODE[STATIC_URL_PATH_NAME]]",
    "HTTP_ROUTE_CONTROLLER":null,
    "COMMAND_SWITCH":[CODE[COMMAND_SWITCH]],
    "VERSION":[CODE[VERSION]],
    "WORKSPACE":"[CODE[WEBROOT_PATH]]"
};

Object.merge(Internal.env, env);

var db = ()=>{
    throw new Error("No db connection");
}

if( config.database )
{
    var dbconfig = Array.isArray( config.database ) ? config.database[0] : config.database;
    if(dbconfig)
    {
        const drives={
            mysql(){
                const Mysql= require("mysql");
                const connection = Mysql.createConnection({
                    host     :dbconfig.host     || '127.0.0.1',
                    port     :dbconfig.port     || '3306',
                    user     :dbconfig.user     || 'root',
                    password :dbconfig.password || '',
                    database :dbconfig.dbname
                });
            
                connection.connect();
                process.on('SIGINT', () => {
                    connection.end();
                });

                return ( sql, callback )=>{
                    connection.query(sql, function (err, rows, fields) {
                        if (err) throw err;
                        callback( rows, fields);
                    });
                }
            }
        }
        const driver = drives[ dbconfig.driver.toLowerCase() ];
        db = driver ? driver() : db;
    }
}

module.exports=function createRouter( factory , staticAsset )
{
    Object.forEach( env.HTTP_SERVER_ROUTES, function(routes, method)
    {
        Object.forEach(routes,function(provider,route){
            factory(method,route.replace(/\{(\w+)\}/g,':$1'),function(req, res){
                const route = provider.split("@");
                const controller = route[0];
                const method = route[1];
                try{

                    Internal.env.HTTP_REQUEST ={
                        "method":req.method,
                        "path":req.path,
                        "host":req.get("host"),
                        "port":req.get("host").split(":")[1] || null,
                        "protocol":req.protocol,
                        "cookie":req.cookies || null,
                        "uri":req.originalUrl,
                        "url":req.protocol + '://' + req.get('host') + req.originalUrl,
                    }
                    
                    Internal.env.HTTP_RESPONSE =res;
                    Internal.env.APP_CONFIG = config;

                    const moduleClass = require( Path.join(root_path, controller.replace(/\./g,'/')+".js") );
                    const obj = new moduleClass();
                    obj.addEventListener(PipeLineEvent.PIPELINE_DATABASE,function(e){
                        db( e.getCmd(), function( result ){
                            e.setData( result );
                            res.status(200)
                            res.send( e.valueOf() );
                        });
                    });
                    obj[ method ].apply(obj, Object.values( req.params ) );

                }catch(e)
                {
                    console.log( "Error:"+ e.message );
                    staticAsset(req, res, "error.html", e);
                }
            });
        });
    });

    Object.forEach( env.HTTP_VIEW_ROUTES, function(routes, method)
    {
        Object.forEach(routes,function(provider,route){
            factory(method,route.replace(/\{(\w+)\}/g,':$1'),function(req, res){
                try{
                    const file = Path.join(__dirname, env.WORKSPACE, "index.html");
                    if( fs.existsSync(file) )
                    {
                        res.status(200);
                        res.sendFile( file );

                    }else if( staticAsset )
                    {
                        staticAsset(req, res, "index.html");
                    }else{
                        throw new Error("Not find source file.")
                    }  
                }catch(e)
                {
                    console.log( "Error:"+ e.message );
                    staticAsset(req, res, "error.html", e);
                }
            });
        });
    });
}