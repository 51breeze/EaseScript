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
	}
}