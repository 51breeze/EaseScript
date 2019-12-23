package server{
	import es.core.Service;
	public class News extends Service
	{
     	[Router(method='get',alias='match')]
		public function match(id:*=null){
			this.query( `select * from news  order by id asc limit 50`);
		}

		[Router(method='get',alias='/getNews')]
		public function all(){
			this.query('select * from news limit 100');
		}
	}
}