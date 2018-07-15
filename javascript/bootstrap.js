System.getGlobalEvent().addEventListener(Event.READY,function (e) {
    try{
        var Event = System.Event;
        var main = System.getDefinitionByName("{config.main}");
        var interactionClass = System.getDefinitionByName("es.core.Interaction");
        Reflect.set(interactionClass,interactionClass,"properties", window.Interaction || {});
        Internal.context = Reflect.construct(null,main);
        if( this.hasEventListener(Event.INITIALIZE_COMPLETED) )
        {
            this.dispatchEvent( new Event( Event.INITIALIZE_COMPLETED ) );
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
