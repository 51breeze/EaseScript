package 
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
    import view.Home;
    import es.components.DataGrid;
    import es.skins.DataGridSkin;
    import es.core.SystemManage;

    [Router(default=home, alias=MyIndex)]
	public class IndexApplication extends BaseApplication implements IListIterator
	{
		public function IndexApplication()
		{
            super();
            this.assign("message","Hello word!");
            this.title="Index page";
        }

        [Router(method="get")]
        public function viewport()
        {
            console.log(" ====enter viewport====");
            var view:view.Viewport = new view.Viewport( this );
            return this.render(view);
        }

        [Router(method="get,post,put", alias="home")]
        public function home()
        {
            var view:view.Home = new view.Home( this );

            this.title = "the is home page";

           // var view:View = new View(this);

           // var container:Container = new Container( new Element( Element.createElement("div") ) ,{innerHTML:"=======home========="});

           // view.addChild( container );

           if( this ){

                var object:Object = {names:"ppppp",address:"sssss"};

                var {name:*="1232",address:*} =  {names:"ppppp",address:"sssss"};
           }

           console.log( name , "=====", address);

        
            
            var grid: DataGrid = new DataGrid();
            grid.source = "http://local.working.com/json.php";
            grid.dataSource.dataType( Http.TYPE_JSONP );

            grid.width = 800;
            grid.skinClass = DataGridSkin;
            grid.columns = {id: "IDsssss", name: "名称", phone: "电话"};
            var gridSkin:DataGridSkin = grid.skin as DataGridSkin;
            gridSkin.pagination.wheelTarget = new Display( new Element(gridSkin.foot) );
            view.addChild(grid);

            //view.children = [ "=======" ];


            (new EventDispatcher(view.popup)).addEventListener( MouseEvent.CLICK, function(e:MouseEvent){

                    PopUp.modality("您有3条信息未处理2","这里是内容", {callback:function (type:String) {

                             view.assign("uuuu", 6666);    
                             view.assign("yy", 555);    
                             view.assign("kk", 666);    
                             view.assign("rr", 444);    
                             view.assign("www", 888);    
                             view.assign("qqq", 999);

                             console.log("====PopUp===", type );   
        
                       
                    }});

            });
           
            
          
            return this.render( view );
        }

        [Router(method="get", alias="index")]
        public function index()
        {
            console.log(" ====enter index====");

            this.title = "the is index page";

            var view:view.Index = new view.Index( this );

            view.assign("address","<span style='color:red'>sssssss</span>");
            view.assign("rowHeight",40);
            view.assign("maxHeight",40);
            view.assign("title","Hello world!!");
            view.assign("name","Hello world!!");

            var datalist:Array=[];

            var len:int = Math.abs( Math.random() * 100 );
            len = 100;

            for(var i:int=0;i<len;i++)
            {

                datalist.push({"name":i,"id":i,"address":i});

            }
            view.assign("datalist",datalist);



            //var view:View =  new View(this);

          //  view.navigate.current=1;

           // var grid: DataGrid = new DataGrid();
          //  grid.source = ServiceProvider("/getNews/","server.News@index");
            //grid.source = ServiceProvider("/getNews/{id:int}","server.News@one",'get',2);
           // grid.dataSource.dataType( Http.TYPE_JSONP );

           // ServiceProvider("/Person/list","server.Person@all",'get');
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

