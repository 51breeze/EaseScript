System.getGlobalEvent().addEventListener(Event.READY,function (e) {
    var router = [CODE[ServiceRouteList]];
    try{
        var locator = System.Locator;
        var Event = System.Event;
        router = router.get || {};
        var path = locator.path().join("/");
        path = '/'+path.replace(/^\//,'');
        if( router[ path ] )
        {
            var controller = router[ path ].split("@");
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