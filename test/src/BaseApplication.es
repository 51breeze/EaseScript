package
{
    import es.core.Application;
	import view.Home;


	public class BaseApplication extends Application
	{
		public function BaseApplication()
		{
			super();

			var aa:int = 1;

			aa is uint;
		}

		[RunPlatform(server)]
		public function get menus():Array
		{
             return [
				 {"link":"/MyIndex","label":"首页","content":"/MyIndex"},
				 {"link":"/Welcome","label":"个人","content":"/Welcome"},
			 ];
        }

		[RunPlatform(client)]
		public function get menus():Array
		{
             return [
				 {"link":"/MyIndex","label":"首页","content":"/MyIndex"},
				 {"link":"/Welcome","label":"个人","content":"/Welcome"},
			 ];
        }
	}
}

