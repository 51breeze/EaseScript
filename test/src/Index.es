package{

    public class Index extends EventDispatcher{

        public function Index()
        {

            (function(){

               this.name;

           }).bind(this);

           Object.forEach([],function(){

               this.name;
               console.log("===");

           },this);

           [].forEach(function(){
               this.name;
           },this);

           this.addEventListener("ss",function(){

                this.name;

           },false,1, this );

           this.address(["sdfdf"],["pppp"]);




        }

        public function get name():String
        {
            return "sssss";
        }

        public function address(...names:Array ){

             console.log( names );
        }

    }

}