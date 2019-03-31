package{

    public class Index extends EventDispatcher{


       
        
        public function Index()
        {

            var address:Object={
                name:"yejun",
                post:"iiiii",
                uuuu:"hhhh"
            };

            if(true){ 
                 var co:String='333', bb:*, jjj:*;
                 var {name:*="sssss",post:*=66666} = this.target();
            }
            
            console.log( name );

        }

        public target():Object{
            return {};
        }

        public get name():String
        {
            return "sss";
        } 

        public get address():String
        {
             return "sss";
        }
        
    }

}