package server{
	import es.core.Service;
	public class Person extends Service{
		[Router(method='get',alias='/Person/list')]
		public function all(){
			var result:* = this.query('select id,name from person limit 100');
			return this.success(result);
		}
		[Router(method='post',alias='/Person/save/{id}')]
		public function set(id:*){
			var result:Boolean = true;
			return this.success(result);
		}
	}
}