package es.interfaces
{
    public interface IListIterator
    {
        public function seek():Object
        public function next():Object
        public function prev():Object
        public function move(cursor:Number):Object
        public function reset():Boolean
    }
}