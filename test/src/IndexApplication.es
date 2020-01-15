package 
{
    import BaseApplication;
    import view.Index;
    import view.Viewport;
    import es.core.es_internal;
    import es.interfaces.IListIterator;
    import es.components.PopUp;
    import es.core.Display;
    import es.core.Container;
    import es.core.View;
    import view.Home;
    import es.components.DataGrid;
    import es.skins.DataGridSkin;
    import es.core.SystemManage;
    import server.News;

   // [Embed('./jquery-1.11.2.js')];
   // [Import( file='jquery', alias=JQ, export=jQuery )];

    [Router(default=home, alias=MyIndex)]
	public class IndexApplication extends BaseApplication implements IListIterator
	{
		public function IndexApplication()
		{
            super();
            this.assign("message","Hello word!");
            this.title="Index page";
        }

        private window(container:View)
        {
            console.log( (View)container  );
            console.log( this ,1, true, view.Viewport );
        }

        public function getObject():Object{
            return [];
        }

    
        [Router(method="get")]
        public function viewport()
        {
            var viewObject:view.Viewport = new view.Viewport( this );
            return this.render(viewObject);
        }

    
        [Router(method="get,post,put", alias="home123")]
        public function home()
        {
            var viewObject:view.Home = new view.Home( this );
            this.title = "the is home page";
            return this.render( viewObject );
        }
        

        //[Router(method="get", alias="index")]
        public function index()
        {
            this.title = "the is index page";
            var viewObject:view.Index = new view.Index( this );
            return this.render( viewObject );
        }

       // [Router(post)]
        public function add(){

        }


        es_internal function test(){

            console.log("<br/>");
            console.log( es_internal.valueOf()  );

            Object.forEach(this,function (val:*,key:String) {

                console.log("<br/>");
                console.log( val,key );

            });

            console.log("<br/>===================");

            for( var n:String in this )
            {
                console.log("<br/>");
                console.log( n  , this.current() );
            }

        }

        private var cursor:Number=-1;
        private var items:Array=[{key:"6666",value:"yejun"},{key:"tttt",value:"最后"}];

        public function next():void
        {
            ++cursor;
        }

        public function current():*
        {
            var item:Object = items[ cursor ] as Object;
            return item.value;
        }

        public function key():*
        {
            var item:Object = items[ cursor ] as Object;
            return item.key;
        }

        public function rewind():void
        {
             cursor = 0;
        }

        public function valid():Boolean
        {
            return cursor < items.length;
        }


    
	}
}

