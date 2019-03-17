package server{
	import es.core.Service;
	public class News extends Service{
		[Router(method='get',alias='/getNews/{id}')]
		public function one(id:int){
			var result:* = this.query('select * from news  where id = ?', [id]);
			return this.success(result);
		}
	}
}