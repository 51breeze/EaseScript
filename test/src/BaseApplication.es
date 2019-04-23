package
{
    import es.core.Application;
	public class BaseApplication extends Application
	{
		public function BaseApplication()
		{
			super();
		}

		

		[RunPlatform(server)]
		public function get menus():Array
		{
             return [
				 {"link":"/MyIndex","label":"首页","content":""},
				 {"link":"/Person","label":"个人","content":""},
			 ];
        }

		[RunPlatform(client)]
		public function get menus():Array
		{
             return [
				 {"link":"?PATH=/MyIndex/home","label":"首页","content":"/MyIndex/home"},
				 {"link":"/Person","label":"个人","content":"?PATH=/Person"},
			 ];
        }
	}
}

