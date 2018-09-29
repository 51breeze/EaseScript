System.getGlobalEvent().addEventListener(Event.READY,function (e) {
    var routes_map = [CODE[SERVICE_ROUTE_LIST]];
    var default_route = "[CODE[DEFAULT_BOOTSTRAP_ROUTER_PROVIDER]]";
    try{
        var locator = System.Locator;
        var Event = System.Event;
        var router = routes_map.get || {};
        var path = locator.query("[CODE[STATIC_URL_PATH_NAME]]");
        if( !path ){
            path = '/'+locator.path().join("/");
        }
        router = router[ path ] || default_route;
        if( router )
        {
            var controller = router.split("@");
            var module = controller[0];
            var method = controller[1];
            var main = System.getDefinitionByName(module);
            var obj = Reflect.construct(null,main);
            Reflect.call(main, obj, method);
            if( this.hasEventListener(Event.INITIALIZE_COMPLETED) )
            {
                this.dispatchEvent( new Event( Event.INITIALIZE_COMPLETED ) );
            }
        }

    }catch(e)
    {
        if( Internal.environment == 1)
        {
            window.console.log(Internal.getStack().join("\n"));
        }
        throw e.valueOf();
    }
},false,-500);