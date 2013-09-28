// In Firefox 3.6-10, an error in loading script causes
// window.onerror to execute which fails test in Mocha
window.onerror = function () {};
process.on = function(e, fn){
    if ('uncaughtException' == e) {
        window.onerror = function(err, url, line){
            if(err === 'Error loading script')
                return;
            fn(new Error(err + ' (' + url + ':' + line + ')'));
        };
    }
};

// Patching in a fix for IE 7 through 10 related to stack overflow errors
// while running tests and flash transport.
// See https://github.com/visionmedia/mocha/issues/502
// for more details.
process.nextTick = (function(){
    var timeouts = []
    // postMessage behaves badly on IE8
    if (window.ActiveXObject || !window.postMessage) {
      return function(fn){ 
          timeouts.push(fn);
          setTimeout(function(){
              if (timeouts.length) timeouts.shift()();
          }, 0)
      };
    }

    // based on setZeroTimeout by David Baron
    // - http://dbaron.org/log/20100309-faster-timeouts
    var name = 'mocha-zero-timeout'

    window.addEventListener('message', function(e){
      if (e.source == window && e.data == name) {
        if (e.stopPropagation) e.stopPropagation();
        if (timeouts.length) timeouts.shift()();
      }
    }, true);

    return function(fn){
      timeouts.push(fn);
      window.postMessage(name, '*');
    }
  })();