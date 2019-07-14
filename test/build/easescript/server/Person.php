<?php
namespace server;
use es\core\Service;
class Person extends Service
{
public function __construct(){

parent::__construct();
}
public function all(){
	$result=$this->query('select id,name from person limit 100');
	return $this->success($result);
}
public function set($id){
	$result=true;
	return $this->success($result);
}
}
