package
{
    import BaseApplication;
    import view.Person;
    import IndexApplication;

    [Router(default=index,method=get,alias="/Person")]
	public class PersonApplication extends BaseApplication
	{
		public function PersonApplication()
		{
            this.title="Person page 9999";
			this.assign("message","Hello word! yejun 6666");
        }

        public function index()
        {
            console.log("===========index===========");
            var view:view.Person = new view.Person( this );
           // view.navigate.source = this.menus;
            return this.render( view );
        }

	}


}

