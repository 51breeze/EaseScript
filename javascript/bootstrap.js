System.getGlobalEvent().addEventListener(Event.READY,function (e) {
    try{
        var Event = System.Event;
        var main = System.getDefinitionByName("{config.main}");
        Reflect.construct(null,main);
        if( this.hasEventListener(Event.INITIALIZE_COMPLETED) ){
            this.dispatchEvent( new Event( Event.INITIALIZE_COMPLETED ) );
        }
    }catch(e)
    {
        window.console.log( Internal.getStack().join("\n") );
        throw e.valueOf();
    }
},false,-500);
