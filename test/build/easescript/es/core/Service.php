<?php
namespace es\core;
use es\system\EventDispatcher;
use es\events\PipelineEvent;
use es\system\ReferenceError;
use es\system\arguments;
use es\system\System;
class Service extends \es\system\EventDispatcher
{
static protected function pipeline(EventDispatcher $target,$type,$name,$cmd){
	if(!\es\system\System::is('String',undefined))throw new \es\system\TypeError("type mismatch the \"\$type\" parameter must be String");
	if(!\es\system\System::is('String',undefined))throw new \es\system\TypeError("type mismatch the \"\$name\" parameter must be String");
	$event=new PipelineEvent($type);
	$event->name=$name;
	$event->cmd=$cmd;
	if($target->hasEventListener($type)){
		$data=$target->dispatchEvent($event);
		return $data===null?$event->data:$data;
	}
	throw new \es\system\ReferenceError("No binding to the specified '".$type."' pipeline.","es.core.Service","40:87");
}
public function __construct(){
	
	parent::__construct();
}
protected function query($sql){
	if(!\es\system\System::is('String',undefined))throw new \es\system\TypeError("type mismatch the \"\$sql\" parameter must be String");
	return Service::pipeline($this,PipelineEvent::PIPELINE_DATABASE,"select",func_get_args());
}
protected function save($sql){
	if(!\es\system\System::is('String',undefined))throw new \es\system\TypeError("type mismatch the \"\$sql\" parameter must be String");
	return Service::pipeline($this,PipelineEvent::PIPELINE_DATABASE,"update",func_get_args());
}
protected function append($sql){
	if(!\es\system\System::is('String',undefined))throw new \es\system\TypeError("type mismatch the \"\$sql\" parameter must be String");
	return Service::pipeline($this,PipelineEvent::PIPELINE_DATABASE,"insert",func_get_args());
}
protected function remove($sql){
	if(!\es\system\System::is('String',undefined))throw new \es\system\TypeError("type mismatch the \"\$sql\" parameter must be String");
	return Service::pipeline($this,PipelineEvent::PIPELINE_DATABASE,"delete",func_get_args());
}
protected function success($data){
	if(\es\system\System::is($data,'Array', false)){
		$data=array_map(function($item){
			return System::isObject($item)?\es\system\Reflect::type($item,'Object')->valueOf():$item;
		},\es\system\Reflect::type($data,'Array'));
	}
	else if(System::isObject($data)){
		$data=$data->valueOf();
	}
	return new \es\system\BaseObject(["data"=>$data,"status"=>200]);
}
protected function failed($message,$errorCode=500,$status=200){
	if(!\es\system\System::is('String',undefined))throw new \es\system\TypeError("type mismatch the \"\$message\" parameter must be String");
	if(!\es\system\System::is('int',undefined))throw new \es\system\TypeError("type mismatch the \"\$errorCode\" parameter must be int");
	if(!\es\system\System::is('int',undefined))throw new \es\system\TypeError("type mismatch the \"\$status\" parameter must be int");
	return new \es\system\BaseObject(["message"=>$message,"errorCode"=>$errorCode,"status"=>$status]);
}
}
