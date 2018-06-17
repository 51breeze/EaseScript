package es.interfaces
{
    public interface IListIterator
    {
        public function current():*;
        public function key():*;
        public function next():Boolean;
        public function rewind():void;
    }
}