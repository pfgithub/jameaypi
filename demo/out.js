(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"_process":3,"inherits":2}],6:[function(require,module,exports){
var util = require('util');
var events = require('events');
var keys = require('./keys.json');
/**
 * The game api
 *
 * @module Game
 */
 
var screen = document.createElement('canvas');

screen.width  = window.innerWidth;
screen.height = window.innerHeight;
screen.style.position = "fixed";
screen.style.top   = "0";
screen.style.left   = "0";
screen.style.width  = "100%";
screen.style.height = "100%";

var buffer = document.createElement('canvas');

buffer.width  = window.innerWidth;
buffer.height = window.innerHeight;

function clone(obj) {
  if(obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
    return obj;

  var temp = obj.constructor(); // changed

  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      obj['isActiveClone'] = null;
      temp[key] = clone(obj[key]);
      delete obj['isActiveClone'];
    }
  }    

  return temp;
}

window.addEventListener("resize", function(){
  var w = window.innerWidth;
  var h = window.innerHeight;
  buffer.width = w;
  buffer.height = h;
  buffer.getContext('2d').drawImage(screen, 0, 0);
  
  screen.width = w;
  screen.height = h;
  screen.getContext('2d').drawImage(buffer, 0, 0);
  
  screenObj.w = w;
  screenObj.h = h;
  
  ev.out('resize');
});

document.addEventListener('keydown',function(e){
  var key = keys[e.keyCode];
  ev.out('keydown', key);
  ev.out('keydown-'+key);
});

document.addEventListener('keyup',function(e){
  var key = keys[e.keyCode];
  ev.out('keyup', key);
  ev.out('keyup-'+key);
});

document.addEventListener('mousemove',function(e){
  screenObj.mouseX = e.clientX;
  screenObj.mouseY = e.clientY;
  
  ev.out('mousemove', e.clientX - screenObj.camera.x, e.clientY - screenObj.camera.y);
});

document.body.appendChild(screen);

function Events(){this.x = 0;}
util.inherits(Events, events.EventEmitter);
Events.prototype.out = function(data){
  this.emit.apply(this, arguments);
};

var screenObj = new Canvas(screen);
/**
 * The main canvas class. Do not change the width and height of the canvas.
 *
 * @class Canvas
 * @param {int} width The width
 * @param {int} height The height
 * @namespace Game
 * @constructor
 */
 
/**
 * Width
 *
 * @property w
 * @type Number
 * @default "w"
 */
 
/**
 * Height
 *
 * @property h
 * @type Number
 * @default "h"
 */
 
/**
 * The canvas's official SpriteList !! Organization WIP
 *
 * @property spriteList
 * @type SpriteList
 * @default "new SpriteList(this)"
 */
 
/**
 * Screen drawing offset position. This determines the ammount all drawings to this canvas will be offset by
 *
 * @property camera
 * @type Camera
 * @default "new Camera(0,0)"
 */
function Canvas(w,h){
  if(typeof w != "number")this.canvas = w;
  else{
    this.canvas = document.createElement('canvas');
    this.canvas.width  = w;
    this.canvas.height = h;
  }
  this.ctx = this.canvas.getContext("2d");
  this.w = this.canvas.width;
  this.h = this.canvas.height;
  
  this.spriteList = new SpriteList(this);
  
  this.camera = new Camera(0,0);
  
  this.ctx.imageSmoothingEnabled = false;
}

/**
 * Draw an image onto the canvas
 *
 * @method drawImage
 * @param {Image} image The image to be drawn to the canvas
 * @param {int} x The x position to draw the image to
 * @param {int} y The y position to draw the image to
 * @return {Boolean} Weather the image drawing succeeded or not. If image drawing did not succeed, it is likley that the image was not loaded yet. Please use awaitImages to house your image loading.
 */

Canvas.prototype.drawImage = function(image,x,y,w,h){
  try {this.ctx.drawImage(image.canvas, x+this.camera.x,y+this.camera.y,w,h);return true;}
  catch(err) {console.log('Could not draw canvas',image,err);return false;}
};

/**
 * Register a sprite to the canvas's SpriteList
 *
 * @method registerSprite
 * @param {Sprite} sprite The sprite to be added to the SpriteList
 * @return
 */

Canvas.prototype.registerSprite = function(sprite,collisionType){
  this.spriteList.addSprite(sprite,collisionType);
};

/**
 * Register multiple sprites to the canvas's SpriteList (UNTESTED)
 *
 * @method registerSprites
 * @param {Array(Sprite)} sprites The sprites to be added to the SpriteList
 * @return
 */

Canvas.prototype.registerSprites = function(sprites,collisionType){
  sprites.forEach(function(sprite){this.spriteList.addSprite(sprite,collisionType);});
};

/**
 * Register a collider to the canvas's ColliderList !! Organization WIP
 *
 * @method registerSprite
 * @param {Sprite} sprite The sprite to be added to the SpriteList
 * @return
 */

Canvas.prototype.registerCollider = function(collider){
  this.colliderList.addCollider(collider);
};

/**
 * Clear the canvas
 *
 * @method clear
 * @return
 */

Canvas.prototype.clear = function(){
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

function convertImageToCanvas(image) {
	var canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	canvas.getContext("2d").drawImage(image, 0, 0);

	return canvas;
}

/**
 * Images to be used in your sprites. Please load all your images with awaitImages(array,callback) before actually running any code. All events are outputted to Game.events.on in the awaitImages callback
 *
 * @class Image
 * @param {url} url The url to the image. This can be in data:image format or an actuall https:// url
 * @namespace Game
 * @constructor
 */
 
/**
 * Fired the image loads. Instead of using this event, you can use awaitImages to wait for all images in an array to load.
 *
 * @event load
 */
 
/**
 * Width
 *
 * @property w
 * @type Number
 * @default "w"
 */
 
/**
 * Height
 *
 * @property h
 * @type Number
 * @default "h"
 */
 
function Image(url){
  this.img = document.createElement('img');
  this.img.src = url;
  this.img.addEventListener("load",function(){
    this.canvas = convertImageToCanvas(this.img);
    this.w = this.img.width;
    this.h = this.img.height;
    
    this.emit('load');
  }.bind(this));
}
util.inherits(Image, events.EventEmitter);

/**
 * Draw the image to a canvas
 *
 * @method drawImage
 * @param {Canvas} canvas The canvas to draw the image to (not a RenderingContext2d)
 * @return
 */
Image.prototype.draw = function(canvas, x, y){
  canvas.drawImage(this,x,y,this.w,this.h);
};
function Size(w,h){
  this.w = w;
  this.h = h;
  this.canvas = document.createElement("canvas");
  this.canvas.width = this.w;
  this.canvas.height = this.h;
}
util.inherits(Size,events.EventEmitter);
Size.prototype.draw = function(canvas,x,y){
  this.emit("draw",canvas,x,y);
};

/**
 * Lists of sprites that can be drawn quickly
 *
 * @class SpriteList
 * @param {Canvas} canvas The canvas to draw your sprites to
 * @param OR
 * @param {Array(Canvas)} canvases The canvases to draw your sprites to formated in [canvas,canvas,canvas]. If no canvases are given, nothing will be drawn with draw()
 * @namespace Game
 * @constructor
 */
 
/**
 * The ColliderList for the SpriteList !! Organization WIP
 *
 * @property colliderList
 * @type ColliderList
 * @default "new ColliderList()"
 */
function SpriteList(canvas){
  this.sprites = [];
  this.canvas = canvas;
  this.colliderList = new ColliderList();
}

/**
 * Add a sprite to the SpriteList
 *
 * @method addSprite
 * @param {Sprite} sprite The sprite to be added to the SpriteList
 * @return
 */
SpriteList.prototype.addSprite = function(sprite,colliderType){
  this.sprites.push(sprite);
  sprite.onSpriteListed(this,colliderType);
};

/**
 * Draws all the sprites to be updated
 *
 * @method draw
 * @param {Boolean} [update=false] Weather the sprites should have their images updated first. Disabling this can get better performance, only use when neccessary.
 * @param {Canvas} [canvas=this.canvas] A custom canvas to draw the spritelist to. Defaults to the canvas you instantiated it with.
 * @return
 */
SpriteList.prototype.draw = function(update, canvas){
  if(this.sprites.length == 0) return;
  this.sprites.forEach(function(sprite){
    if(update) sprite.update();
    
    //if(this.canvas.prototype == [].prototype){
      sprite.draw(canvas ? canvas : this.canvas);
    //}else{
    //  this.canvas.forEach(function(canva){
    //    sprite.draw(canva);
    //  });
   // }
  }.bind(this));
  return true;
};
SpriteList.prototype.removeSprite= function(sprite){
  this.sprites.forEach(function(sprie,i){
    if(sprie == sprite) delete this.sprites[i];
  });
};


/**
 * A list of colliders for easy collision detection
 *
 * @class ColliderList
 * @param {Canvas} canvas The canvas to draw your sprites to
 * @param OR
 * @param {Array(Canvas)} canvases The canvases to draw your sprites to formated in [canvas,canvas,canvas]. If no canvases are given, nothing will be drawn with draw()
 * @namespace Game
 * @constructor
 */

function ColliderList(){
  this.colliders = [];
}

/**
 * Adds a collider to the ColliderList
 *
 * @method draw
 * @param {Collider} collider The collider to add. It must comply with the collider rules.
 * @return
 */
ColliderList.prototype.addCollider = function(collider){
  this.colliders.push(collider);
};

function Camera(x,y){
  this.x = x;
  this.y = y;
}
Camera.prototype.centerOn = function(sprite,canvas){
  this.x = -sprite.x + canvas.w / 2 - sprite.image.w/2;
  this.y = -sprite.y + canvas.h / 2 - sprite.image.h/2;
};

/**
 * Sprites. The basic object which has your character, platform, monster, or npc. It has an X and a Y to be moved around, and can be drawn in the canvas's spritelist
 *
 * @class Sprite
 * @param {image} image The first image for the sprite. If this image is given before it is loaded, the sprite WILL NOT load properly. Make sure to load ALL your images before doing anything, or serious errors could occur.
 * @param {int} x The starting x position of the sprite
 * @param {int} y The starting y position of the sprite
 * @namespace Game
 * @constructor
 */
 
/**
 * The x position to the sprite
 *
 * @property x
 * @type Number
 * @default "x"
 */
 
/**
 * The y position to the sprite
 *
 * @property y
 * @type Number
 * @default "y"
 */
function Sprite(image,x,y){
  this.image = image;
  this.canvas = new Canvas(this.image.w,this.image.h);
  
  this.x = x;
  this.y = y;
  
  this.do = {};
  this.collision = "Add your sprite to a SpriteList for collision";
  
  this.update();
}
util.inherits(Sprite,events.EventEmitter);
Sprite.prototype.onSpriteListed = function(spriteList,colliderType){
  this.collision = new BoxCollider(spriteList,this.x,this.y,this.image.w,this.image.h,this,colliderType);
  this.collision.on('updateLocations',function(){
    this.collision.update(this.x,this.y,this.image.w,this.image.h);
  }.bind(this));
};

/**
 * Draws the sprite to the canvas provided
 *
 * @method draw
 * @param {Canvas} canvas The canvas to draw to.
 * @return
 */
 
Sprite.prototype.draw = function(canvas){
  this.image.draw(canvas,this.x,this.y);
};

/**
 * Changes the image of the sprite to the one provided, or switches to a new image in this.image
 *
 * @method draw
 * @param {Collider} collider The collider to add. It must comply with the collider rules.
 * @return
 */
Sprite.prototype.update = function(image){
  this.canvas.clear();
  if(image) this.image = image;
  return this.image.draw(this.canvas,0,0);
};


/**
 * All the main events for your game to run. Handle any events with Game.events.on(event,callback). Call any events with Game.events.out(event,paramaters...)
 *
 * @class events
 * @namespace Game
 * @static
 */
/**
 * When a key is first pressed
 *
 * @event keydown
 * @param {String} key The key that was pressed formatted according to keys.json (Expect these to be changed)
 */
/**
 * When a key is let go of
 *
 * @event keyup
 * @param {String} key The key that was released formatted according to keys.json (Expect these to be changed)
 */
/**
 * When the screen is resized. Make sure to redraw on this event and reformat your screen.
 *
 * @event resize
 */
/**
 * Called when your game should draw
 *
 * @event draw
 */
/**
 * Called when your game should update
 *
 * @event error
 * @param {number} deltaTime How long (in seconds) since the last frame. Multiply it by your speed for constant movement (in px/s)
 */

/** 
 * These methods can be accessed directly with Game.[method]
 * 
 * @class GLOBAL
 * @static
 */
 
/**
 * Waits for all the images in an array to load. 
 *
 * @method awaitImages
 * @param {Array(Image)} images The images to load
 * @param {Function()} callback Called when all the images load
 * @return
 */

function awaitImages(images,callback){
  var counter = images.length;
  if(counter == 0) {callback(images);return;}
  images.forEach(function(image){
    if(image.w) counter--;
    if(counter == 0) {callback(images);return;}
    image.on('load',function(){
      counter --;
      
      if(counter == 0) {callback(images);return;}
    });
  });
}

setInterval(onTimerTick, 33); // 33 milliseconds = ~ 30 frames per sec

function onTimerTick() {
  ev.out('update', 0.033);
  ev.out('draw', 0.033);
}




/**
 * A simple box collider. The format does not currently allow you to add custom colliders
 *
 * @class BoxCollider
 * @namespace Game
 * @static
 */

function BoxCollider(spriteList,x,y,w,h,sprite,colliderType){
  this.colliderList = spriteList.colliderList;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.colliderType = colliderType ? colliderType : "background"; // none, background, or object
  this.sprite = sprite;
  this.colliderList.addCollider(this);
}
util.inherits(BoxCollider,events.EventEmitter);

BoxCollider.prototype.colliding = function(){
  this.emit('updateLocations');
  if(this.colliderType == "object"){
    var collided = this.colliderList.colliders.some(function(collider,i){
      if(collider == this) return false;
      if(collider.colliderType == "trigger") {this.emit('trigger',collider);return false;}
      if(
        this.x < collider.x + collider.w &&
        this.x + this.w > collider.x &&
        this.y < collider.y + collider.h &&
        this.h + this.y > collider.y
      ){
        return true;
      }else return false;
    }.bind(this));
    return collided;
  }else{
    throw new Error("Collider type " + this.colliderList +" can not be on the ground. Remove this check");
  }
};

BoxCollider.prototype.update = function(x,y,w,h){
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
};

function RigidBody(sprite,collider){
  this.sprite = sprite;
  this.collider = collider;
  
  this.vx = 0;
  this.vy = 0;
}
util.inherits(RigidBody,events.EventEmitter);
RigidBody.prototype.applyForce = function(x,y){
  this.vx += x;
  this.vy += y;
};
RigidBody.prototype.setForce = function(x,y){
  this.vx = x;
  this.vy = y;
};
RigidBody.prototype.update = function(deltaTime){
  this.sprite.x += this.vx * deltaTime;
  
  if(this.collider.colliding()){
    this.sprite.x -= this.vx * deltaTime;
    this.vx = 0;
  }
  
  this.sprite.y += this.vy * deltaTime;
  
  if(this.collider.colliding()){
    this.sprite.y -= this.vy * deltaTime;
    if(this.vy > 0)this.onGround = true;
    this.vy = 0;
  }else{
    this.onGround = false;
  }
  
  this.vy += 10;
  if(this.vx > 0){
    this.vx -= 5;
    if(this.vx < 0) this.vx = 0;
  }else if(this.vx < 0){
    this.vx += 5;
    if(this.vx > 0) this.vx = 0;
  }
};

var ev = new Events();

module.exports = {};
module.exports.Canvas = Canvas;
module.exports.screen = screenObj;
module.exports.Sprite = Sprite;
module.exports.SpriteList = SpriteList;
module.exports.BoxCollider = BoxCollider;
module.exports.RigidBody = RigidBody;
module.exports.Image = Image;
module.exports.awaitImages = awaitImages;
module.exports.events = ev;

},{"./keys.json":7,"events":1,"util":5}],7:[function(require,module,exports){
module.exports={
  "-100":"Credit: https://github.com/wesbos/keycodes",
  "3": "break",
  "8": "backspace / delete",
  "9": "tab",
  "12":"clear",
  "13":"enter",
  "16":"shift",
  "17":"ctrl",
  "18":"alt",
  "19":"pause/break",
  "20":"caps lock",
  "27":"escape",
  "32":"spacebar",
  "33":"page up",
  "34":"page down",
  "35":"end",
  "36":"home",
  "37":"left arrow",
  "38":"up arrow",
  "39":"right arrow",
  "40":"down arrow",
  "41":"select",
  "42":"print",
  "43":"execute",
  "44":"Print Screen",
  "45":"insert",
  "46":"delete",
  "48":"0",
  "49":"1",
  "50":"2",
  "51":"3",
  "52":"4",
  "53":"5",
  "54":"6",
  "55":"7",
  "56":"8",
  "57":"9",
  "59":"semicolon (firefox), equals",
  "60":"<",
  "61":"equals (firefox)",
  "63":"ß",
  "65":"a",
  "66":"b",
  "67":"c",
  "68":"d",
  "69":"e",
  "70":"f",
  "71":"g",
  "72":"h",
  "73":"i",
  "74":"j",
  "75":"k",
  "76":"l",
  "77":"m",
  "78":"n",
  "79":"o",
  "80":"p",
  "81":"q",
  "82":"r",
  "83":"s",
  "84":"t",
  "85":"u",
  "86":"v",
  "87":"w",
  "88":"x",
  "89":"y",
  "90":"z",
  "91":"Windows Key / Left ⌘",
  "92":"right window key",
  "93":"Windows Menu / Right ⌘",
  "96":"numpad 0",
  "97":"numpad 1",
  "98":"numpad 2",
  "99":"numpad 3",
  "100":"numpad 4",
  "101":"numpad 5",
  "102":"numpad 6",
  "103":"numpad 7",
  "104":"numpad 8",
  "105":"numpad 9",
  "106":"multiply",
  "107":"add",
  "108":"numpad period (firefox)",
  "109":"subtract",
  "110":"decimal point",
  "111":"divide",
  "112":"f1",
  "113":"f2",
  "114":"f3",
  "115":"f4",
  "116":"f5",
  "117":"f6",
  "118":"f7",
  "119":"f8",
  "120":"f9",
  "121":"f10",
  "122":"f11",
  "123":"f12",
  "124":"f13",
  "125":"f14",
  "126":"f15",
  "127":"f16",
  "128":"f17",
  "129":"f18",
  "130":"f19",
  "144":"num lock",
  "145":"scroll lock",
  "163":"#",
  "173":"minus (firefox), mute/unmute",
  "174":"decrease volume level",
  "175":"increase volume level",
  "176":"next",
  "177":"previous",
  "178":"stop",
  "179":"play/pause",
  "180":"email",
  "181":"mute/unmute (firefox)",
  "182":"decrease volume level (firefox)",
  "183":"increase volume level (firefox)",
  "186":"semicolon / ñ",
  "187":"equal sign",
  "188":"comma",
  "189":"dash",
  "190":"period",
  "191":"forward slash",
  "192":"grave accent",
  "194":"numpad period (chrome)",
  "219":"open bracket",
  "220":"back slash",
  "221":"close bracket",
  "222":"single quote",
  "223":"`",
  "224":"left or right ⌘ key (firefox)",
  "225":"altgr",
  "226":"< /git >",
  "230":"GNOME Compose Key",
  "255":"toggle touchpad"
}
},{}],8:[function(require,module,exports){
var Game = require("../../api/index.js");
var Image = Game.Image;
var screen = Game.screen;
var Sprite = Game.Sprite;
var Canvas = Game.Canvas;
var awaitImages = Game.awaitImages;

var playerFacingLeft = new Image('images/Idle.png');
var playerFacingRight = new Image('images/IdleRight.png');
var floor = new Image('images/Floor.png');
var coins = [];
for (var i=1;i<=8;i++){
  coins[i-1] = new Image('images/Coin/coin_'+ i +'.png');
}
var waters = [];
for (var i=1;i<=8;i++){
  waters[i-1] = new Image('images/Water/water_'+ i +'.png');
}
var o = 0;
awaitImages([playerFacingRight,playerFacingLeft,floor].concat(coins).concat(waters),function(){
  coins.forEach(function(coin){
    coin.w = 64;
    coin.h = 64;
  });
  
  var sprite = new Sprite(playerFacingLeft,10,10);
  screen.registerSprite(sprite, "object");
  var rigidSprite = new Game.RigidBody(sprite,sprite.collision);
  var floorSprite = new Sprite(floor,10,300);
  var floorSprite2 = new Sprite(floor,200,250);
  var floorSprite3 = new Sprite(floor,200,10);
  var coin = new Sprite(coins[0],-80,250);
  var mousepos = new Sprite(coins[0],0,0);
  screen.registerSprite(floorSprite, "background");
  screen.registerSprite(floorSprite2, "background");
  screen.registerSprite(floorSprite3, "background");
  screen.registerSprite(coin, "trigger");
  screen.registerSprite(mousepos, "trigger");
  var coinState = 1;
  
  var velocity = 0;
  var velocityX = 0;
  
  var speed = 100;
  var toJump;
  
  var direction = {};
  Game.events.on('keydown',function(key){
    if(key == "right arrow"){
      direction['right'] = true;
      sprite.update(playerFacingRight);
    }
    if(key == "up arrow"){
      toJump = true;
    }
    if(key == "left arrow"){
      direction['left'] = true;
      sprite.update(playerFacingLeft);
    }
  });
  Game.events.on('keyup',function(key){
    if(key == "left arrow"){
      direction['left'] = false;
    }
    if(key == "up arrow"){
      toJump = false;
    }
    if(key == "right arrow"){
      direction['right'] = false;
    }
  });
  Game.events.on('update',function(deltaTime){
    if(direction.left){
      rigidSprite.applyForce(-10,0);
    }
    if(direction.right){
      rigidSprite.applyForce(10,0);
    }
    rigidSprite.update(deltaTime);
    
    if(toJump){
      if(rigidSprite.onGround){
        rigidSprite.applyForce(0,-200);
      }
    }
    if(sprite.y > screen.h){
      rigidSprite.applyForce(0,-200);
    }
    screen.camera.centerOn(sprite,screen);
    
    coinState += deltaTime * 10;
    if(Math.floor(coinState) > 7){
      coinState = 0;
    }
    
    coin.update(coins[Math.floor(coinState)]);
    
    
    mousepos.x = screen.mouseX - screen.camera.x;
    mousepos.y = screen.mouseY - screen.camera.y;
  });
  rigidSprite.on('colliderEnter',function(){
    
  });
  Game.events.on('draw',function(deltaTime){
    screen.clear();
    screen.spriteList.draw();
  });
  Game.events.on('resize',function(){
    
  });
  Game.events.on('mousemove',function(mx,my){
    console.log(mx == screen.mouseX,my == screen.mouseY);
  });
});


},{"../../api/index.js":6}]},{},[8]);
