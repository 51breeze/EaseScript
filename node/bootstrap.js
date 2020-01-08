const PATH= require("path");
const FS= require("fs");
const Internal= require("[CODE[REQUIRE_IDENTIFIER(Internal)]]");
const Object  = require("[CODE[REQUIRE_IDENTIFIER(Object)]]");
const Array  = require("[CODE[REQUIRE_IDENTIFIER(Array)]]");
const System  = require("[CODE[REQUIRE_IDENTIFIER(System)]]");
const Event   = require("[CODE[REQUIRE_IDENTIFIER(Event)]]");
const PipeLineEvent = require("[CODE[REQUIRE_IDENTIFIER(es.events.PipelineEvent)]]");
const root_path = "[CODE[ROOT_PATH]]";
const config = FS.existsSync( PATH.join(__dirname, "./config.json" ) ) ? require( PATH.join(__dirname, "./config.json" ) ) : {};

/**
 * 运行环境相关信息
 */
const env=Object.merge(Internal.env,{
    "HTTP_DEFAULT_ROUTE":"[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]",
    "HTTP_ROUTES":[CODE[SERVICE_ROUTE_LIST]],
    "MODE":[CODE[MODE]],
    "ORIGIN_SYNTAX":"[CODE[ORIGIN_SYNTAX]]",
    "URL_PATH_NAME":"[CODE[STATIC_URL_PATH_NAME]]",
    "HTTP_ROUTE":null,
    "HTTP_PATH":null,
    "HTTP_PARAMS":null,
    "COMMAND_SWITCH":[CODE[COMMAND_SWITCH]],
    "VERSION":[CODE[VERSION]],
    "WORKSPACE":"[CODE[WEBROOT_PATH]]",
    "APP_CONFIG":config,
    "APP":null,
    "LOAD_SCRIPTS":[CODE[LOAD_SCRIPTS]],
    "ROOT_PATH":PATH.resolve(__dirname, root_path ),
    "HTTP_DISPATCHER":null
});


class Bootstrap {

    constructor( app )
    {
        this.app = app;
        this.pipelines={};

        env.APP = this;
        env.HTTP_DISPATCHER=(module,method,args)=>{
            var moduleClass = require( PATH.join(root_path, module.replace(/\./g,'/')+".js") )
            if( typeof method === "function")
            {
                return method( moduleClass );
            }
            var obj = new moduleClass();
            if( typeof obj[ method ] === "function" ){
               obj[ method ].apply( obj , Object.values( args ) );
            }else
            {
                throw new ReferenceError( method+" is not exists. in the "+module);
            }
        };

        if( env.HTTP_DEFAULT_ROUTE )
        {
            if( !env.HTTP_ROUTES.get )
            {
                env.HTTP_ROUTES.get = {};
            }
            env.HTTP_ROUTES.get["/"] = env.HTTP_DEFAULT_ROUTE;
        }
    }

    /**
     * 获取指定的配置项
     * @param {*} name 
     */
    getConfig( name )
    {
        return name ? env.APP_CONFIG[ name ] || null : env.APP_CONFIG;
    }

    /**
     * 获取指定的环境选项
     * @param {*} name 
     */
    getEnv( name )
    {
        return name ? env[ name ] || null : env;
    }

    /**
     * 绑定管道操作服务
     * @param $name
     * @param $callback
     */
    pipe(name, factor)
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
        System.getGlobalEvent().addEventListener( name, function(e)
        {
            factor( e.getCmd(), e.getParams(), e.getCallback() );
        });
    }

    /**
     * 绑定路由服务
     * @param $name
     * @param $callback
     */
    bindRoute( callback )
    {
        for(var method in env.HTTP_ROUTES )
        {
            const routes = env.HTTP_ROUTES[ method ];
            for( var route in routes)
            {
                const provider = routes[ route ];
                callback(method, route.replace(/\{(\w+)\}/g,':$1'),(req, res)=>{
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
                    env.HTTP_ROUTE  = provider;
                    env.HTTP_PATH   = route;
                    env.HTTP_PARAMS = req.params;

                    const [moduleClass,method] = provider.split("@");
                    env.HTTP_DISPATCHER( moduleClass, method, req.params );
                });
            };
        }
    }
}

module.exports=Bootstrap;