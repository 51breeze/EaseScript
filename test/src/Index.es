package{

    public class Index extends EventDispatcher{

        
        public function Index()
        {

            (function(){

               this.name;

           }).apply(this, [1,2,3,5]);


           var fn:Function = function(){
                 this.name;
           };

           fn.call(this,1,2,3,6);

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
        
        override public addEventListener(type:String, callback:Function, flag:Boolean, pri:int, thisavrg:Object=null ):EventDispatcher
        {

            super.addEventListener(type, callback, flag, pri, thisavrg);
            return this;

        }
        public get name():String
        {
            return "sssss";
        }
        address(...names:Array ){

             console.log( names );
        }
        

         public function assign(name:String, value:*=null)
         {

         }

    }

}