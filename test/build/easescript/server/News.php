<?php
namespace server;
use es\core\Service;
class News extends Service
{
public function __construct(){

parent::__construct();
}
public function one($id){
	if(!\es\system\System::is($id,'int'))throw new \es\system\TypeError("type mismatch the \"\$id\" parameter must be int");
	$result=$this->query('select * from news  where id = ?',[$id]);
	return $this->success($result);
}
public function all(){
	$result=$this->query('select * from news limit 100');
	return $this->success($result);
}
public function two(){
	$result=$this->query('select * from news limit 100');
	return $this->success($result);
}
public function match(){
	$datalist=[];
	for($i=0;$i<100;$i++){
		$id=( mt_rand(1,2147483647) / 2147483647)*1000;
		array_push($datalist,new \es\system\BaseObject(["id"=>$id,"title"=>$id,"content"=>$id,"status"=>0,"create_at"=>0,"update_at"=>0]));
	}
	return $this->success($datalist);
}
}
