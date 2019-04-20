package app
{
    import BaseApplication;
    import view.Index;
    import view.Viewport;
    import es.core.es_internal;
    import es.interfaces.IListIterator;
    import es.core.PopUp;
    import es.core.Display;
    import es.core.Container;
    import es.core.View;
    import view.AppHome;
    import es.components.DataGrid;
    import es.skins.DataGridSkin;
    import es.core.SystemManage;
    [Router(default=home, alias=MyIndexApp)]
	public class IndexApplication extends BaseApplication implements IListIterator
	{
		public function IndexApplication()
		{
            super();
            this.assign("message","Hello word!");
            this.title="Index page";
        }

      

        [Router(method="get,post,put", alias="home")]
        public function home()
        {
            var view:view.AppHome = new view.AppHome( this );

            this.title = "the is home page";

           // var view:View = new View(this);

           // var container:Container = new Container( new Element( Element.createElement("div") ) ,{innerHTML:"=======home========="});

           // view.addChild( container );

           if( this ){

                var object:Object = {names:"ppppp",address:"sssss"};

                var {name:*="1232||ssss",address:*} =  object;
           }
            
            var grid: DataGrid = new DataGrid();
            //grid.source = "http://local.working.com/json.php";
            //grid.dataSource.dataType( Http.TYPE_JSONP );

            grid.source = ServiceProvider("/getNews","server.News@all");

            grid.dataSource.options({responseProfile:function (response:Object,name:String) {
                    switch (name){
                        case "data":
                            return response["data"];
                            break;
                        case "total":
                            return response["data"]['length'];
                            break;
                        case "status":
                            return response["status"];
                            break;
                        case "successCode":
                            return 200;
                            break;
                    }
            }});

            grid.width = 400;
            grid.skinClass = DataGridSkin;
            grid.columns = {id: "ID", title: "名称", content: "内容"};
            var gridSkin:DataGridSkin = grid.skin as DataGridSkin;
            gridSkin.pagination.wheelTarget = new Display( new Element(gridSkin.foot) );
            view.addChild(grid);

            //view.children = [ "=======" ];


            (new EventDispatcher(view.popup)).addEventListener( MouseEvent.CLICK, function(e:MouseEvent){

                    PopUp.confirm("您有3条信息未处理2",function (type:String) {

                             view.assign("uuuu", 6666);    
                             view.assign("yy", 555);    
                             view.assign("kk", 666);    
                             view.assign("rr", 444);    
                             view.assign("www", 888);    
                             view.assign("qqq", 999); 
                             view.currentState = "show";
        
                    });

            });
           
            
          
            return this.render( view );
        }

      

        [Router(post)]
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

        public function next():Boolean
        {
            return items.length > ++cursor;
        }

        public function current():*
        {
            var item:Object = items[ cursor ];
            return item.value;
        }

        public function key():*
        {
            var item:Object = items[ cursor ];
            return item.key;
        }

        public function rewind():void
        {
             cursor = -1;
        }
	}
}

