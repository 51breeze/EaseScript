const Path= require("path");
const fs= require("fs");
const Internal= require("[CODE[REQUIRE_IDENTIFIER(Internal)]]");
const Object  = require("[CODE[REQUIRE_IDENTIFIER(Object)]]");
const Array  = require("[CODE[REQUIRE_IDENTIFIER(Array)]]");
const System  = require("[CODE[REQUIRE_IDENTIFIER(System)]]");
const Event   = require("[CODE[REQUIRE_IDENTIFIER(Event)]]");
const PipeLineEvent = require("[CODE[REQUIRE_IDENTIFIER(es.events.PipelineEvent)]]");
const root_path = "[CODE[ROOT_PATH]]";
const config = fs.existsSync( "./config.json" ) ? require("./config.json") : {};

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
    "WORKSPACE":"[CODE[WEBROOT_PATH]]",
    "APP_CONFIG":config,
    "LOAD_SCRIPTS":[CODE[LOAD_SCRIPTS]],
    "ROOT_PATH":Path.resolve(__dirname, root_path )
};

Object.merge(Internal.env, env);

const _serverProvier = {};

class Bootstrap{

    constructor( app )
    {
        this.app = app;
        Internal.env.BOOT_APP = this;
    }

    serviceProvider( name , factory )
    {
        switch( name.toLowerCase() )
        {
            case "database" :
                name = PipeLineEvent.PIPELINE_DATABASE;
            break;
            case "redis" :
                name = PipeLineEvent.PIPELINE_REDIS;
            break;
            default:
                throw TypeError( name + " is not supported.");
        }
        _serverProvier[ name ]=factory;
    }

    getConfig()
    {
        return env.APP_CONFIG;
    }

    getEnv( name )
    {
        return name ? env[ name ] || null : env;
    }

    bindPipeline( obj )
    {
        for( var name in _serverProvier )
        {
            obj.addEventListener(name, function(e){
                var callback =  e.getCallback();
                if( !callback )
                {
                    throw new Error("PipeLineEvent is must assig a callback function.");
                }else{
                   _serverProvier[ name ]( e.getCmd(), e.getParams(), callback);
                }
            });
        }
    }

    dispatch( provider, params )
    {
        const route = provider.split("@");
        const controller = route[0];
        const method = route[1];
        try{

            const moduleClass = require( Path.join(root_path, controller.replace(/\./g,'/')+".js") );
            const obj = new moduleClass();
            this.bindPipeline(obj);
            obj[ method ].apply(obj, Object.values( params ) );

        }catch(e)
        {
            console.log( e );
        }
    }

    start( factory )
    {
        for(var method in env.HTTP_ROUTES )
        {
            const routes = env.HTTP_ROUTES[ method ];
            for( var route in routes)
            {
                const provider = routes[ route ];
                factory(method, route.replace(/\{(\w+)\}/g,':$1'),(req, res)=>{
                    Internal.env.HTTP_REQUEST ={
                        "method":req.method,
                        "path":req.path,
                        "body":req.body||{},
                        "query":req.query||{},
                        "params":req.params||{},
                        "host":req.get("host").split(":")[0],
                        "port":req.get("host").split(":")[1] || null,
                        "protocol":req.protocol,
                        "cookie":req.cookies || null,
                        "uri":req.originalUrl,
                        "url":req.protocol + '://' + req.get('host') + req.originalUrl,
                    };
                    Internal.env.HTTP_RESPONSE = res;
                    this.dispatch( provider , req.params );
                });
            };
        }
    }
}

module.exports=Bootstrap;