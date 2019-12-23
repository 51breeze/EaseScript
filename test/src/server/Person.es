package server{

	import es.core.Service;
	
	public class Person extends Service{
		[Router(method='get',alias='/Person/list')]
		public function all(){
			var result:* = this.query('select * from person limit 100');
			return this.success(result);
		}
	}
}