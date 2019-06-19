package server{
	import es.core.Service;
	public class News extends Service{
		[Router(method='get',alias='/getNews/{id}')]
		public function one(id:int){
			var result:* = this.query('select * from news  where id = ?', [id]);
			return this.success(result);
		}

        [Router(method='get',alias='/getNews')]
		public function all(){
			var result:* = this.query('select * from news limit 100');
			return this.success(result);
		}

		[Router(method='get',alias='/two')]
		public function two()
		{
            var result:* = this.query('select * from news limit 100');
			return this.success(result);
		}

        [Router(method='get')]
		public function match()
		{
			var datalist:Array = [];
			for(var i:int=0; i<100;i++)
			{
			   var id:* = Math.random() * 1000;
			   datalist.push( {id: id, title: id, content: id, status: 0, create_at: 0, update_at: 0} );
			}
             
			return this.success(datalist); 
		}
	}
}