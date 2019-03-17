package
{
    import es.components.DataGrid;

	public class MyDataGrid extends DataGrid
	{

		public function MyDataGrid(componentId:String = UIDInstance() )
		{
            super( componentId );
        }


        private var _address:String;
        public function set address(name:String):void{
              _address = name;
             console.log( address );
        }

        public function get address():String{
            return _address;
        }


	}
}

