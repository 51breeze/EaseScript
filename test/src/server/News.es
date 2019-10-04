package server{
	import es.core.Service;
	public class News extends Service{
		[Router(method='get',alias='/match')]
		public function match(){
			var result:* = this.query('select * from news limit 100');
			return this.success(result);
		}
		[Router(method='get',alias='/getNews')]
		public function all(){
			var result:* = this.query('select * from news limit 100');
			return this.success(result);
		}
	}
}