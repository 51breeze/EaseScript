package
{
    public class Test{

        public function Test()
        {
             var a:int = 5, b:int=9;
             const d:String = "666";
             if(a>10)
             { 
                console.log("ok");  
             }

             console.log( "==test==" );
             index(a * 3);
        }

        public function index(a:int)
        {
             if(a>6)
             { 
                throw new Error("type error");
             }
        }

    }
}