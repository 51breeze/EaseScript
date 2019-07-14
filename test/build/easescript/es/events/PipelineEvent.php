<?php
namespace es\events;
use es\system\Event;
class PipelineEvent extends \es\system\Event
{
const RESPONSE_BEFORE='pipelineResponseBefore';
const PIPELINE_REDIS='pipelineRedis';
const PIPELINE_DATABASE='pipelineDatabase';
public $name=null;
public $data=null;
public $cmd=null;
public function __construct($type,$bubbles=true,$cancelable=true){
	
	if(!\es\system\System::is($type,'String'))throw new \es\system\TypeError("type mismatch the \"\$type\" parameter must be String");
	if(!\es\system\System::is($bubbles,'Boolean'))throw new \es\system\TypeError("type mismatch the \"\$bubbles\" parameter must be Boolean");
	if(!\es\system\System::is($cancelable,'Boolean'))throw new \es\system\TypeError("type mismatch the \"\$cancelable\" parameter must be Boolean");
	parent::__construct($type,$bubbles,$cancelable);
}
}
