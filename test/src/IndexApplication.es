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

           // var view:View = new View(this);

            var container:Container = new Container( new Element( Element.createElement("div") ) ,{innerHTML:"=======home==5555==6666====="});

            viewObject.addChild( container );

           if( this ){

                var object:Object = {names:"ppppp",address:"sssss"};

                var {name:*="1232||ssss",address:*} =  object;
           }
            
            var grid: DataGrid = new DataGrid();
            //grid.source = "http://local.working.com/json.php";
            //grid.dataSource.dataType( Http.TYPE_JSONP );

            var di:int = 1;

            grid.source = ServiceProvider("/News/match","server.News@match","get");

            /*grid.dataSource.options({responseProfile:function (response:Object,name:String) {
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
            }});*/

            grid.width = 400;
            grid.skinClass = DataGridSkin;
            grid.columns = {id: "ID", title: "名称", content: "内容"};
            var gridSkin:DataGridSkin = grid.skin as DataGridSkin;
            grid.pagination.wheelTarget = new Display( new Element(gridSkin.foot) );
            viewObject.addChild(grid);

            //view.children = [ "======sss=" ];


            (new EventDispatcher(viewObject.popup)).addEventListener( MouseEvent.CLICK, function(e:MouseEvent){

                    PopUp.confirm("您有3条信息未处理2",function (type:String) {

                             viewObject.assign("uuuu", 6666);    
                             viewObject.assign("yy", 555);    
                             viewObject.assign("kk", 666);    
                             viewObject.assign("rr", 444);    
                             viewObject.assign("www", 888);    
                             viewObject.assign("qqq", 999); 
                             viewObject.currentState = viewObject.currentState === "show" ? "hide" : "show";
        
                    });

            });

            var iis:String = " the is template";
            var bb:int = 99999;
            var tem:String = `ssss ${iis} ===== {${bb}} 66666=====33333 `;
            console.log( tem );

            console.log( new Date().getTime() );

            this.es_internal::test();

            var tt:Class = PopUp as Class;

          
            return this.render( viewObject );
        }
        

        //[Router(method="get", alias="index")]
        public function index()
        {
            console.log(" ====enter index====");

            this.title = "the is index page";

            var viewObject:view.Index = new view.Index( this );

            viewObject.assign("address","<span style='color:red'>sssssss</span>");
            viewObject.assign("rowHeight",40);
            viewObject.assign("maxHeight",40);
            viewObject.assign("title","Hello world!!");
            viewObject.assign("name","Hello world!!");

            var datalist:Array=[];

            var len:int = Math.abs( Math.random() * 100 );
            len = 100;

            for(var i:int=0;i<len;i++)
            {

                datalist.push({"name":i,"id":i,"address":i});

            }
            viewObject.assign("datalist",datalist);



            //var view:View =  new View(this);

          //  view.navigate.current=1;

           // var grid: DataGrid = new DataGrid();
          //  grid.source = ServiceProvider("/getNews/","server.News@index");
            //grid.source = ServiceProvider("/getNews/{id:int}","server.News@one",'get',2);
           // grid.dataSource.dataType( Http.TYPE_JSONP );

            ServiceProvider("/Person/list","server.Person@all",'get');
            ServiceProvider("/getNews","server.News@all");


           // ServiceProvider("/Person/save/{id}","server.Person@set",'post',6);


            /*grid.dataSource.options({responseProfile:function (response:Object,name:String) {
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

            grid.width = 800;
            grid.skinClass = DataGridSkin;
            grid.columns = {id: "编号", title: "标题", content: "内容"};
            var gridSkin:DataGridSkin = grid.skin as DataGridSkin;
            gridSkin.pagination.wheelTarget = gridSkin.foot;

            grid.async = true;
            */
           // gridSkin.pagination.async = true;


           // view.addChild(grid);

       
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

