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
				 {"link":"/MyIndex","label":"首页","content":"view.page.IndexSkin"},
				 {"link":"/Person","label":"个人","content":view.page.IndexSkin},
			 ];
        }

		[RunPlatform(client)]
		public function get menus():Array
		{
             return [
				 {"link":"?PATH=/MyIndex/index","label":"首页","content":"/webroot/index.html?PATH=/MyIndex/index"},
				 {"link":"?PATH=/Person","label":"个人","content":"/webroot/index.html?PATH=/Person"},
			 ];
        }
	}
}

