package es.interfaces
{
    public interface IListIterator
    {
        public function current():*;
        public function key():*;
        public function next():void;
        public function rewind():void;
        public function valid():Boolean;
    }
}