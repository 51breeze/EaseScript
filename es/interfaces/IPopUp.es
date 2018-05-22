package es.interfaces
{
    import es.interfaces.IDisplay;
    public interface IPopUp extends IDisplay
    {
        public function close():void;
        public function get title():String;
        public function set title(value:String):void;
    }
}