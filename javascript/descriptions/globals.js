var descriptor = {
    'Class':{'id':'class', 'type':'Class', 'inherit':'Object'},
    'Interface':{'id':'class', 'type':'Interface', 'inherit':'Object'},
    'Number':{
        'id':'class', 'type':'Number', 'inherit':'Object',
        'static':{
            'EPSILON':{'id':'const','type':'Number'},
            'MAX_SAFE_INTEGER':{'id':'const','type':'Number'},
            'MAX_VALUE':{'id':'const','type':'Number'},
            'MIN_SAFE_INTEGER':{'id':'const','type':'Number'},
            'MIN_VALUE':{'id':'const','type':'Number'},
            'NEGATIVE_INFINITY':{'id':'const','type':'Number'},
            'NaN':{'id':'const','type':'Number'},
            'POSITIVE_INFINITY':{'id':'const','type':'Number'},
            'isFinite':{'id':'function','type':'Number','param':[] },
            'isInteger':{'id':'function','type':'Number','param':[] },
            'isNaN':{'id':'function','type':'Number','param':[] },
            'isSafeInteger':{'id':'function','type':'Number','param':[] },
            'parseFloat':{'id':'function','type':'Number','param':[] },
            'parseInt':{'id':'function','type':'Number','param':[] },
        },
        'proto':{
            'toExponential':{'id':'function','type':'Number','param':[] },
            'toFixed':{'id':'function','type':'Number','param':[] },
            'toLocaleString':{'id':'function','type':'Number','param':[] },
            'toPrecision':{'id':'function','type':'Number','param':[] },
            'toString':{'id':'function','type':'Number','param':[] },
            'valueOf':{'id':'function','type':'Number','param':[] },
        }
    },
    'String':{
        'id':'class', 'type':'String', 'inherit':'Object',
        'static': {
            'length': {'type': 'Number', 'id': 'const'},
            'fromCharCode': {'type': 'Number', 'id': 'function','param':['...']},
        },
        'proto': {
            'replace':{ 'id':'function','type':'String','param':['Object','Object']},
            'match': {'type': 'Array', 'id': 'function','param':['RegExp']},
            'search': {'type': 'Array', 'id': 'function','param':['RegExp']},
            'charAt': {'type': 'String', 'id': 'function','param':['Number']},
            'charCodeAt': {'type': 'Number', 'id': 'function','param':['Number']},
            'concat': {'type': 'String', 'id': 'function','param':['...']},
            'indexOf': {'type': 'Number', 'id': 'function','param':['String']},
            'localeCompare': {'type': 'Number', 'id': 'function','param':['String','String']},
            'repeat': {'type': 'String', 'id': 'function','param':['Number']},
            'slice': {'type': 'String', 'id': 'function','param':['Number']},
            'substr': {'type': 'String', 'id': 'function','param':['Number']},
            'substring': {'type': 'String', 'id': 'function','param':['Number']},
            'toLocaleLowerCase': {'type': 'String', 'id': 'function','param':[]},
            'toLowerCase': {'type': 'String', 'id': 'function','param':[]},
            'toLocaleUpperCase': {'type': 'String', 'id': 'function','param':[]},
            'toUpperCase': {'type': 'String', 'id': 'function','param':[]},
            'split': {'type': 'Array', 'id': 'function','param':['String']},
        }
    },
    'JSON':{
        'id':'class', 'type':'JSON','inherit':'Object',
        'static': {
            'parse': {'type': 'Object', 'id': 'function', param: ['String']},
            'stringify': {'type': 'String', 'id': 'function', param: ['Object']},
        },
    },
    'Object':{
        'id':'class',
        'type':'Object',
        'static': {
            //'assign': {'type': 'Object', 'id': 'function', param: []},
            'create': {'type': 'Object', 'id': 'function', param: []},
            'defineProperty': {'type': 'Object', 'id': 'function', param: []},
            'defineProperties': {'type': 'Object', 'id': 'function', param: []},
            //'entries': {'type': 'Object', 'id': 'function', param: []},
            //'freeze': {'type': 'Object', 'id': 'function', param: []},
            //'getOwnPropertyDescriptor': {'type': 'Object', 'id': 'function', param: []},
            //'getOwnPropertyNames': {'type': 'Object', 'id': 'function', param: []},
            //'getOwnPropertySymbols': {'type': 'Object', 'id': 'function', param: []},
            'getPrototypeOf': {'type': 'Object', 'id': 'function', param: []},
            //'is': {'type': 'Object', 'id': 'function', param: []},
            //'isExtensible': {'type': 'Object', 'id': 'function', param: []},
            //'isFrozen': {'type': 'Object', 'id': 'function', param: []},
            //'isSealed': {'type': 'Object', 'id': 'function', param: []},
            //'preventExtensions': {'type': 'Object', 'id': 'function', param: []},
            //'seal': {'type': 'Object', 'id': 'function', param: []},
            'setPrototypeOf': {'type': 'Object', 'id': 'function', param: []},
            'merge': {'type': 'Object', 'id': 'function', param: []},
        },
        'proto':{
            'constructor':{'type': 'Function', 'id': 'var'},
            'hasOwnProperty': {'type': 'Boolean', 'id': 'function', param: []},
            'isPrototypeOf': {'type': 'Boolean', 'id': 'function', param: []},
            'propertyIsEnumerable': {'type': 'Boolean', 'id': 'function', param: []},
            'setPropertyIsEnumerable': {'type': 'void', 'id': 'function', param: []},
            'toSource': {'type': 'String', 'id': 'function', param: []},
            'toLocaleString': {'type': 'String', 'id': 'function', param: []},
            'toString': {'type': 'String', 'id': 'function', param: []},
            'valueOf': {'type': 'String', 'id': 'function', param: []},
            'keys': {'type': 'Object', 'id': 'function', param: []},
            'values': {'type': 'Object', 'id': 'function', param: []}
       }
    },
    'RegExp':{
        'id':'class', 'type':'RegExp','inherit':'Object',
        'static':{
            'lastIndex': {'type': 'Number', 'id': 'const'},
            '$1': {'type': 'String', 'id': 'const'},
            '$2': {'type': 'String', 'id': 'const'},
            '$3': {'type': 'String', 'id': 'const'},
            '$4': {'type': 'String', 'id': 'const'},
            '$5': {'type': 'String', 'id': 'const'},
            '$6': {'type': 'String', 'id': 'const'},
            '$7': {'type': 'String', 'id': 'const'},
            '$8': {'type': 'String', 'id': 'const'},
            '$9': {'type': 'String', 'id': 'const'},
        },
        'proto':{
            'test': {'type': 'Boolean', 'id': 'function', 'param': ['String']},
            'exec': {'type': 'Array', 'id': 'function', 'param': ['String']},
        }
    },
    'Error':{
        'id':'class', 'type':'Error','inherit':'Object',
        'proto':{
            'message': {'type': 'String', 'id': 'const'},
            'name': {'type': 'String', 'id': 'const'},
            'filename': {'type': 'String', 'id': 'const'},
            'line': {'type': 'String', 'id': 'const'},
        }
    },
    'EvalError':{'id':'class', 'type':'EvalError','inherit':'Error'},
    'RangeError':{'id':'class', 'type':'RangeError','inherit':'Error'},
    'ReferenceError':{'id':'class', 'type':'ReferenceError','inherit':'Error'},
    'SyntaxError':{'id':'class', 'type':'SyntaxError','inherit':'Error'},
    'TypeError':{'id':'class', 'type':'TypeError','inherit':'Error'},
    'URIError':{'id':'class', 'type':'URIError','inherit':'Error'},
    'Function':{
        'id':'class', 'type':'Function','inherit':'Object',
        'proto':{
            'call':{'id':'function','type':'*','param':['Object'] },
            'apply':{'id':'function','type':'*','param':['Object','Array']},
        }
    },
    'Date':{
        'id':'class', 'type':'Date','inherit':'Object',
        'static':{
            'UTC':{'id':'function','type':'Number','param':[] },
            'now':{'id':'function','type':'Number','param':[] },
            'parse':{'id':'function','type':'Number','param':['String'] },
        },
        'proto':{
            'getDate':{'id':'function','type':'Number','param':['Object'] },
            'getDay':{'id':'function','type':'Number','param':['Object','Array']},
            'getYear':{'id':'function','type':'Number','param':['Object','Array']},
            'getFullYear':{'id':'function','type':'Number','param':['Object','Array']},
            'getHours':{'id':'function','type':'Number','param':['Object','Array']},
            'getMilliseconds':{'id':'function','type':'Number','param':['Object','Array']},
            'getMinutes':{'id':'function','type':'Number','param':['Object','Array']},
            'getMonth':{'id':'function','type':'Number','param':['Object','Array']},
            'getSeconds':{'id':'function','type':'Number','param':['Object','Array']},
            'getTime':{'id':'function','type':'Number','param':[]},
            'getTimezoneOffset':{'id':'function','type':'Number','param':['Object','Array']},
            'getUTCDate':{'id':'function','type':'Number','param':['Object','Array']},
            'getUTCDay':{'id':'function','type':'Number','param':['Object','Array']},
            'getUTCFullYear':{'id':'function','type':'Number','param':['Object','Array']},
            'getUTCHours':{'id':'function','type':'Number','param':['Object','Array']},
            'getUTCMilliseconds':{'id':'function','type':'Number','param':['Object','Array']},
            'getUTCMinutes':{'id':'function','type':'Number','param':['Object','Array']},
            'getUTCMonth':{'id':'function','type':'Number','param':['Object','Array']},
            'getUTCSeconds':{'id':'function','type':'Number','param':['Object','Array']},
            'setDate':{'id':'function','type':'Number','param':['Object'] },
            'setDay':{'id':'function','type':'Number','param':['Object','Array']},
            'setYear':{'id':'function','type':'Number','param':['Object','Array']},
            'setFullYear':{'id':'function','type':'Number','param':['Object','Array']},
            'setHours':{'id':'function','type':'Number','param':['Object','Array']},
            'setMilliseconds':{'id':'function','type':'Number','param':['Object','Array']},
            'setMinutes':{'id':'function','type':'Number','param':['Object','Array']},
            'setMonth':{'id':'function','type':'Number','param':['Object','Array']},
            'setSeconds':{'id':'function','type':'Number','param':['Object','Array']},
            'setTime':{'id':'function','type':'Number','param':['Object','Array']},
            'setTimezoneOffset':{'id':'function','type':'Number','param':['Object','Array']},
            'setUTCDate':{'id':'function','type':'Number','param':['Object','Array']},
            'setUTCDay':{'id':'function','type':'Number','param':['Object','Array']},
            'setUTCFullYear':{'id':'function','type':'Number','param':['Object','Array']},
            'setUTCHours':{'id':'function','type':'Number','param':['Object','Array']},
            'setUTCMilliseconds':{'id':'function','type':'Number','param':['Object','Array']},
            'setUTCMinutes':{'id':'function','type':'Number','param':['Object','Array']},
            'setUTCMonth':{'id':'function','type':'Number','param':['Object','Array']},
            'setUTCSeconds':{'id':'function','type':'Number','param':['Object','Array']},
            'toDateString':{'id':'function','type':'Number','param':['Object','Array']},
            'toGMTString':{'id':'function','type':'Number','param':['Object','Array']},
            'toISOString':{'id':'function','type':'Number','param':['Object','Array']},
            'toJSON':{'id':'function','type':'Number','param':['Object','Array']},
            'toLocaleDateString':{'id':'function','type':'Number','param':['Object','Array']},
            'toLocaleFormat':{'id':'function','type':'Number','param':['Object','Array']},
            'toLocalString':{'id':'function','type':'Number','param':['Object','Array']},
            'toLocalTimeString':{'id':'function','type':'Number','param':['Object','Array']},
            'toSource':{'id':'function','type':'Number','param':['Object','Array']},
            'toString':{'id':'function','type':'Number','param':['Object','Array']},
            'toUTCString':{'id':'function','type':'Number','param':['Object','Array']},
            'valueOf':{'id':'function','type':'Number','param':['Object','Array']},
            'toTimeString':{'id':'function','type':'Number','param':['Object','Array']},
        }
    },
    'Boolean':{
        'id':'class',
        'type':'Boolean',
        'inherit':'Object'
    },
    'Symbol':{'id':'class', 'type':'Symbol','inherit':'Object'},
    'Iterator':{
        'id':'class', 'type':'Iterator','inherit':'Object',
        'proto':{
            'current':{'id':'const','type':'Object'},
            'value':{'id':'const','type':'Object'},
            'key':{'id':'const','type':'String'},
            'prev':{'id':'function','type':'Object'},
            'next':{'id':'function','type':'Object'},
            'seek':{'id':'function','type':'Boolean','param':[]},
            'move':{'id':'function','type':'Object','param':['Number']},
            'reset':{'id':'function','type':'Iterator','param':[]},
        }
    },
    'Reflect':{
        'id':'object', 'type':'Reflect','inherit':'Object',
        'static':{
            'apply':{'id':'function','type':'*','param':['Function','...']},
            'construct':{'id':'function','type':'*','param':['Class','...']},
            'defineProperty':{'id':'function','type':'Object','param':['Object','String','Object']},
            'deleteProperty':{'id':'function','type':'Boolean','param':['Object','String']},
            'has':{'id':'function','type':'Boolean','param':[]},
            'get':{'id':'function','type':'*','param':['Object','String','*']},
            'set':{'id':'function','type':'*','param':['Object','String','*','*']},
        }
    }, 
    'Event':{
        'id':'class', 'type':'Event','inherit':'Object',
        'static':{
            "SUBMIT":{'id':'const','type':'String'},
            "RESIZE":{'id':'const','type':'String'},
            "FETCH":{'id':'const','type':'String'},
            "UNLOAD":{'id':'const','type':'String'},
            "LOAD":{'id':'const','type':'String'},
            "RESET":{'id':'const','type':'String'},
            "FOCUS":{'id':'const','type':'String'},
            "BLUR":{'id':'const','type':'String'},
            "ERROR":{'id':'const','type':'String'},
            "COPY":{'id':'const','type':'String'},
            "BEFORECOPY":{'id':'const','type':'String'},
            "CUT":{'id':'const','type':'String'},
            "BEFORECUT":{'id':'const','type':'String'},
            "PASTE":{'id':'const','type':'String'},
            "BEFOREPASTE":{'id':'const','type':'String'},
            "SELECTSTART":{'id':'const','type':'String'},
            "READY":{'id':'const','type':'String'},
            "SCROLL":{'id':'const','type':'String'},
        },
        'proto':{
            'preventDefault':{'id':'function','type':'void','param':[]},
            'stopPropagation':{'id':'function','type':'void','param':[]},
            'stopImmediatePropagation':{'id':'function','type':'void','param':[]},
            "bubbles":{'id':'const','type':'Boolean'},
            "cancelable":{'id':'const','type':'Boolean'},
            "currentTarget":{'id':'const','type':'Object'},
            "target":{'id':'const','type':'Object'},
            "defaultPrevented":{'id':'const','type':'Boolean'},
            "originalEvent":{'id':'const','type':'Object'},
            "type":{'id':'const','type':'String'},
            "propagationStopped":{'id':'const','type':'Boolean'},
            "immediatePropagationStopped":{'id':'const','type':'Boolean'},
            "altkey":{'id':'const','type':'Boolean'},
            "button":{'id':'const','type':'Boolean'},
            "ctrlKey":{'id':'const','type':'Boolean'},
            "shiftKey":{'id':'const','type':'Boolean'},
            "metaKey":{'id':'const','type':'Boolean'},
        }
    },
    'EventDispatcher':{
        'id':'class', 'type':'EventDispatcher','inherit':'Object',
        'proto':{
            'dispatchEvent':{'id':'function','type':'Boolean','param':['Event']},
            'removeEventListener':{'id':'function','type':'Boolean','param':['String','Function'], 'required':[true,false] },
            'addEventListener':{'id':'function','type':'EventDispatcher','param':['String','Function']},
            'hasEventListener':{'id':'function','type':'Boolean','param':['String']},
        }
    },
    'Array':{
        'id':'class',
        'type':'Array',
        'inherit':'Object',
        'proto':{
            'length':{'type':'Number','id':'const'},
            'concat':{'type':'Array','id':'function','param':['...']},
            'fill':{'type':'Array','id':'function','param':['Function']},
            'filter':{'type':'Array','id':'function','param':['Function']},
            'find':{'type':'*','id':'function','param':['Function','*']},
            'findIndex':{'type':'Number','id':'function','param':['*']},
            'forEach':{'type':'Array','id':'function','param':['Function','*']},
            'indexOf':{'type':'Number','id':'function','param':['*']},
            'join':{'type':'String','id':'function','param':['String']},
            'lastIndexOf':{'type':'Number','id':'function','param':['*']},
            'map':{'type':'Array','id':'function','param':['Function']},
            'pop':{'type':'*','id':'function','param':[]},
            'push':{'type':'Number','id':'function','param':['*']},
            'shift':{'type':'*','id':'function','param':[]},
            'slice':{'type':'Array','id':'function','param':['...']},
            'some':{'type':'Boolean','id':'function','param':['Function']} ,
            'sort':{'type':'Array','id':'function','param':['Function']},
            'splice':{'type':'Array','id':'function','param':['Number','...']},
            'toLocaleString':{'type':'String','id':'function','param':[]},
            'unshift':{'type':'*','id':'function','param':['*']},
            'toString':{'type':'String','id':'function','inherit':'Object','param':[]},
            'values':{'type':'Array','id':'function','inherit':'Object','param':[]},
            'keys':{'type':'Array','id':'function','inherit':'Object','param':[]},
            'unique':{ 'id':'function','type':'Array'}
        },
    },
    'ArrayList':{
        'id':'class',
        'type':'ArrayList',
        'inherit':'Object',
        'proto':{
            'length':{'type':'Number','id':'const'},
            'concat':{'type':'ArrayList','id':'function','param':['...']},
            'fill':{'type':'ArrayList','id':'function','param':['Function']},
            'filter':{'type':'ArrayList','id':'function','param':['Function']},
            'find':{'type':'*','id':'function','param':['Function','*']},
            'findIndex':{'type':'Number','id':'function','param':['*']},
            'forEach':{'type':'ArrayList','id':'function','param':['Function','*']},
            'indexOf':{'type':'Number','id':'function','param':['*']},
            'join':{'type':'String','id':'function','param':['String']},
            'lastIndexOf':{'type':'Number','id':'function','param':['*']},
            'map':{'type':'ArrayList','id':'function','param':['Function']},
            'pop':{'type':'*','id':'function','param':[]},
            'push':{'type':'Number','id':'function','param':['*']},
            'shift':{'type':'*','id':'function','param':[]},
            'slice':{'type':'ArrayList','id':'function','param':['...']},
            'some':{'type':'Boolean','id':'function','param':['Function']} ,
            'sort':{'type':'ArrayList','id':'function','param':['Function']},
            'splice':{'type':'ArrayList','id':'function','param':['Number','...']},
            'toLocaleString':{'type':'String','id':'function','param':[]},
            'unshift':{'type':'*','id':'function','param':['*']},
            'toString':{'type':'String','id':'function','inherit':'Object','param':[]},
            'values':{'type':'ArrayList','id':'function','inherit':'Object','param':[]},
            'keys':{'type':'ArrayList','id':'function','inherit':'Object','param':[]},
            'unique':{ 'id':'function','type':'ArrayList'}
        },
    },
    'Math':{
         'id':'object',
         'type':'Math',
         'static': {
            'E': {type: 'Number', id: 'const'},
            'LN10': {type: 'Number', id: 'const'},
            'LN2': {type: 'Number', id: 'const'},
            'LOG10E': {type: 'Number', id: 'const'},
            'LOG2E': {type: 'Number', id: 'const'},
            'PI': {type: 'Number', id: 'const'},
            'SQRT1_2': {type: 'Number', id: 'const'},
            'SQRT2': {type: 'Number', id: 'const'},
            'abs': {type: 'Number', id: 'function', param: ['Number']},
            'acos': {type: 'Number', id: 'function', param: ['Number']},
            'asin': {type: 'Number', id: 'function', param: ['Number']},
            'atan2': {type: 'Number', id: 'function', param: ['Number']},
            'ceil': {type: 'Number', id: 'function', param: ['Number']},
            'cos': {type: 'Number', id: 'function', param: ['Number']},
            'exp': {type: 'Number', id: 'function', param: ['Number']},
            'floor': {type: 'Number', id: 'function', param: ['Number']},
            'log': {type: 'Number', id: 'function', param: ['Number']},
            'max': {type: 'Number', id: 'function', param: ['Number']},
            'min': {type: 'Number', id: 'function', param: ['Number']},
            'pow': {type: 'Number', id: 'function', param: ['Number']},
            'random': {type: 'Number', id: 'function', param: ['Number']},
            'round': {type: 'Number', id: 'function', param: ['Number']},
            'sin': {type: 'Number', id: 'function', param: ['Number']},
            'sqrt': {type: 'Number', id: 'function', param: ['Number']},
            'tan': {type: 'Number', id: 'function', param: ['Number']},
         }
    },
    'arguments':{
        'id':'object',
        'type':'arguments',
        'static': {
            'callee': {type: '*', id: 'function'},
            'caller': {type: '*', id: 'function', 'state':'delete'},
            'length': {type: 'Number', id: 'const'},
        }
    },
    'System':{
        'id':'object',
        'type':'System',
        'static': {
            'env':{
                'id':'object',
                'type':'Object',
                'notCheckType':true,
                'static':{
                    'BROWSER_IE': {type: 'String', id: 'const'},
                    'BROWSER_FIREFOX':{type: 'String', id: 'const'},
                    'BROWSER_CHROME':{type: 'String', id: 'const'},
                    'BROWSER_OPERA':{type: 'String', id: 'const'},
                    'BROWSER_SAFARI':{type: 'String', id: 'const'},
                    'BROWSER_MOZILLA':{type: 'String', id: 'const'},
                    'NODE_JS':{type: 'String', id: 'const'},
                    'platform':{type: 'String', id: 'function', param: ['...']},
                    'version':{type: 'Number', id: 'function', param: ['...']},
                }
            },
            'alert': {type: 'void', id: 'function', param: ['...']},
            'log': {type: 'void', id: 'function', param: ['...']},
            'error': {type: 'void', id: 'function', param: ['...']},
            'info': {type: 'void', id: 'function', param: ['...']},
            'warn': {type: 'void', id: 'function', param: ['...']},
            'dir': {type: 'void', id: 'function', param: ['*']},
            'trace': {type: 'void', id: 'function', param: ['*']},
            'time': {type: 'void', id: 'function', param: ['String']},
            'timeEnd': {type: 'void', id: 'function', param: ['String']},
            'assert': {type: 'void', id: 'function', param: ['*']},
            'getDefinitionByName': {type: 'Object', id: 'function', param: ['String']},
            'getQualifiedClassName': {type: 'String', id: 'function', param: ['Object']},
            'getQualifiedSuperclassName': {type: 'String', id: 'function', param: ['Object']},
            'isObject': {type: 'Boolean', id: 'function', param: ['Object']},
            'isArray': {type: 'Boolean', id: 'function', param: ['Object']},
            'isString': {type: 'Boolean', id: 'function', param: ['Object']},
            'isBoolean': {type: 'Boolean', id: 'function', param: ['Object']},
            'isDefined': {type: 'Boolean', id: 'function', param: ['...']},
            'isFunction': {type: 'Boolean', id: 'function', param: ['Object']},
            'isScalar': {type: 'Boolean', id: 'function', param: ['Object']},
            'isNumber': {type: 'Boolean', id: 'function', param: ['Object']},
            'isEmpty': {type: 'Boolean', id: 'function', param: ['Object','*']},
            'trim': {type: 'String', id: 'function', param: ['String']},
            'uid': {type: 'String', id: 'function', param: []},
            'range': {type: 'Array', id: 'function', param: ['Number','Number']},
            'serialize':{type: 'String', id: 'function', param: ['Object']},

            //系统全局方法
            'decodeURI':{type:'String',id:'function',param:['String']},
            'decodeURIComponent':{type:'String',id:'function',param:['String']},
            'encodeURI':{type:'String',id:'function',param:['String']},
            'encodeURIComponent':{type:'String',id:'function',param:['String']},
            'escape':{type:'String',id:'function',param:['String']},
            'eval':{type:'*',id:'function',param:['String']},
            'isFinite':{type:'Boolean',id:'function',param:['*']},
            'isNaN':{type:'Boolean',id:'function',param:['*']},
            'parseFloat':{type:'Number',id:'function',param:['*']},
            'parseInt':{type:'Number',id:'function',param:['*']},
            'unescape':{type:'String',id:'function',param:['String']},
            'setTimeout':{type:'Number',id:'function',param:['Function','Number']},
            'setInterval':{type:'Number',id:'function',param:['Function','Number']},
            'clearTimeout':{type:'Number',id:'function',param:['Number']},
            'clearInterval':{type:'Number',id:'function',param:['Number']},
        }
    },
};

module.exports  = descriptor;