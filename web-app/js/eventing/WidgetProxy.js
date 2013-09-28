/*
 * Copyright 2013 Next Century Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global gadgets*/
;(function (window, document, OWF, undefined) {
    'use strict';

    function rpcCall(widgetId, widgetIdCaller, functionName, var_args) {
        gadgets.rpc.call("..", OWF.Comms.Constants.FUNCTION_CALL_SERVICE_NAME, null, widgetId, widgetIdCaller, functionName, var_args);
    }

    /**
     * Creates or updates a proxy - This is a private constructor - Do not call this directly.  The other
     * Widget APIs such as Widget Intents may return a proxy.  A proxy may contain dynamic functions that were
     * registered by the origin widget.
     *
     * @param {String} wid Id of the Widget this proxy represents
     * @param {Object[]} functions Array of objects representing proxy functions
     * @param {String} srcId Id of the source Widget who is using the proxy
     * @param {Ozone.eventing.WidgetProxy} [proxy] A existing proxy object to be used, instead of creating a new instance
     * @constructor
     */
    var WidgetProxy = function (wid, functions, srcId, proxy) {
        var widgetId = wid,
                widgetIframeId,
                readyList = [],
                pub = proxy;

        // assume JSON
        if (widgetId.charAt(0) === '{') {
            widgetIframeId = widgetId;
            widgetId = JSON.parse(widgetIframeId).id;
        }
        else {
            widgetIframeId = '{\"id\":\"' + widgetId + '\"}';
        }

        if (pub == null) {
            pub = /** @lends WidgetProxy.prototype */ {

                /**
                 * Id of the Widget that this proxy represents
                 */
                id: widgetIframeId,
                /**
                 * Flag which represents if the Widget this proxy represents
                 */
                isReady: false,
                callbacks: {},
                /**
                 * Sends a direct message to the Widget this proxy represents
                 * @param {Object} dataToSend
                 * @example
                 * var widgetProxy = OWF.RPC.getWidgetProxy(id);
                 * widgetProxy.sendMessage({data:'foo'});
                 */
                sendMessage: function (dataToSend) {
                    gadgets.rpc.call("..", OWF.Comms.Constants.DIRECT_MESSAGE_SERVICE_NAME, null, widgetId, dataToSend);
                },

                /**
                 * Registers a listener function to be executed when the Widget has called notifyReady
                 * @param {function} readyListener function to execute
                 * @param {Object} readyListenerScope scope for the function to execute with
                 * @example
                 * var widgetProxy = OWF.RPC.getWidgetProxy(id);
                 * widgetProxy.onReady(function() { console.log("Other widget is ready!"); });
                 */
                onReady: function (readyListener, readyListenerScope) {

                    if (this.isReady) {
                        //just execute because the widget is already ready
                        readyListener.call(readyListenerScope);
                    }
                    else {
                        //save ready listeners
                        readyList.push({fn: readyListener, scope: readyListenerScope});
                    }
                },
                fireReady: function () {
                    this.isReady = true;
                    for (var i = 0, len = readyList.length; i < len; i++) {
                        readyList[i].fn.call(readyList[i].scope);
                    }
                }
            };
        }

        if (functions != null) {
            for (var ii = 0; ii < functions.length; ii++) {
                var functionName = functions[ii];

                /*jshint loopfunc:true */
                pub[functionName] = function (name) {
                    return function () {
                        var callback = arguments[arguments.length - 1];
                        var callbackExists = typeof callback == 'function';
                        var args = Array.prototype.slice.call(arguments, 0, callbackExists ? arguments.length - 1 : arguments.length);
                        if (callbackExists) {
                            pub.callbacks[name] = callback;
                        }
                        rpcCall.call(this, widgetId, srcId, name, args);
                    };
                }(functionName);

            }
        }

        return pub;
    };

    //OWF.Eventing namespace
    var Eventing = OWF.Eventing = OWF.Eventing || {};
    Eventing.WidgetProxy = WidgetProxy;

    //put on Ozone namespace for backwards compat
    var Ozone = window.Ozone = window.Ozone || {};
    Ozone.eventing = Ozone.eventing || {};
    Ozone.eventing.WidgetProxy = WidgetProxy;


}(window, document, window.OWF = window.OWF || {}));