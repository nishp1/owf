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
 
/**
 * This function populates the Ozone.eventing  and OWF.RPC global variables
 * with functions related to the RPC API for widgets.
 */
;(function (OWF, Ozone, ozoneEventing, gadgets, json) {
    'use strict';

    //////////////////////////////////////////////////////////////////////////
    // private objects and functions
    //////////////////////////////////////////////////////////////////////////

    var config = null,
        fnMap = {},
        widgetProxyMap = {};

    /**
     * @private
     *
     * @description Returns the config object for this widget, retrieving it from the
     *              iframe's window name if this is the first time.
     * 
     * @returns {Object} The widget's config object
     */
    function getConfig() {
        if (config == null) {
            config = {};
            if (window.name.charAt(0) != '{') {
                config.rpcId = window.name;
            }
            else {
                config = json.parse(window.name);
                config.rpcId = config.id;
                return config;
            }
        }
        else {
            return config;
        }
    }

    /**
     * @private
     *
     * @description Get the widget's map of proxied widgets. 
     * 
     * @returns {Object} The widget's proxy map
     */
    function getWidgetProxyMap() {
        return widgetProxyMap;
    }

    /**
     * @private
     *
     * @description Get the widget's id from the window name. 
     * 
     * @returns {Object} The widget's id
     */
    function getIdFromWindowName() {
        return getConfig().rpcId;
    }

    /**
     * @private
     *
     * @description Wraps OWF.Eventing.handleDirectMessage() to redirect a message to this widget there.
     */
    function handleDirectMessageWrapper(message) {
        if (ozoneEventing.handleDirectMessage) {
            ozoneEventing.handleDirectMessage(message);
        }
        else {
            if (console && console.log) {
                console.log("ChildWidget: Kernel: Default direct message handler, doing nothing.  Override by defining Ozone.eventing.handleDirectMessage");
            }
        }
    }

    /**
     * @private
     *
     * @description Handles when a function registered by this widget is called by another widget.
     */
    function handleFunctionCall() {
        var var_args = Array.prototype.slice.call(arguments);
        var fn_args = Array.prototype.slice.call(arguments, 3);
        var widgetId = var_args[0];
        var widgetIdCaller = var_args[1];

        var fnName = var_args[2];
        var fnObj = fnMap[fnName];

        //id of the calling widget
        fnObj.fn.widgetIdCaller = widgetIdCaller;

        var result = fnObj.fn.apply(fnObj.scope, fn_args[0]);

        gadgets.rpc.call("..", OWF.Comms.Constants.FUNCTION_CALL_RESULT_SERVICE_NAME, null, widgetId, widgetIdCaller, fnName, result);
    }

    /**
     * @private
     *
     * @description Handles the result of a function called by this widget to a widget proxy.
     */
    function handleFunctionCallResult(widgetId, functionName, result) {
        var wproxy = widgetProxyMap[widgetId];
        if (wproxy != null) {
            var cb = wproxy.callbacks[functionName];
            if (typeof cb === 'function') {
                cb.call(window, result);
            }
        }
    }

    /**
     * @private
     *
     * @description Handles when an event is called on this widget.
     */
    function handleEventCall(eventName) {
        var fn = ozoneEventing.clientEventNameToHandler[eventName];
        var var_args = Array.prototype.slice.call(arguments, 1);
        fn.apply(window, var_args);
    }

    /**
     * @private
     *
     * @description Takes an array of functions and returns their names.
     *
     * @returns {Array} An array of function name Strings
     */
    function getFunctionNames(functions) {
        if (functions) {
            var funcNames = [];
            for (var ii = 0; ii < functions.length; ii++) {
                var fnName = functions[ii].name;
                funcNames.push(fnName);
            }
            return funcNames;
        }
    }

    /**
     * @private
     *
     * @description Create a widget proxy complete with shims of its public functions.
     *
     * @param {String} widgetId The GUID of the widget to get the proxy of
     * @param {Array} An optional Array of functions to create shims for on the proxy
     * @param {OWF.Eventing.WidgetProxy} An optional initial proxy to extend
     *
     * @returns {OWF.Eventing.WidgetProxy} The widget's proxy
     */
    function createClientSideFunctionShims(widgetId, functions, initialProxy) {
        widgetProxyMap[widgetId] = new OWF.Eventing.WidgetProxy(widgetId, functions, getIdFromWindowName(), initialProxy);
        return widgetProxyMap[widgetId];
    }

    /**
     * @private
     *
     * @description Get the URL to the widget's relay file from a given URL.
     *
     * @param {String} url URL to extract the relay URL from
     *
     * @returns {String} Relay URL for the widget
     */
    function getRelayUrl(url) {
        var protocolIdx = url.indexOf("//");
        var protocolEndIdx = url.indexOf("/", protocolIdx + 2);
        var appEndIdx = url.indexOf("/", protocolEndIdx + 1);
        var relay;
        if(appEndIdx > -1) {
            relay = url.substring(0, appEndIdx + 1) + "rpc_relay.html";
        }
        else {
            // No app context, append directly to end http://domain:port/
            relay = url.substring(0, protocolEndIdx + 1) + "rpc_relay.html";
        }
        return relay;
    }

    /**
     * @private
     *
     * @description Cache the given functions in the widget's function map for reuse.
     *
     * @param {Array} functions An Array of funtions to cache
     */
    function cacheFunctions(functions) {
        var fnObj;

        for (var i = 0, len = functions.length; i < len; i++) {
            fnObj = functions[i];

            if (!fnObj.name) {
                throw 'Error: name is not set';
            }
            if (!fnObj.fn) {
                throw 'Error: fn is not set';
            }

            fnMap[fnObj.name] = fnObj;
        }
    }

    //////////////////////////////////////////////////////////////////////////
    // public objects and functions
    //////////////////////////////////////////////////////////////////////////

    /**
     * Initializes a widget for use with the RPC API when outside of the OWF container.
     * This handles the necessary setup when the OWF container isn't being used.
     *
     * @example
     * function plot(lat, lon) { //do some plotting }
     * function center(lat, lon) { //do some centering }

     * @name clientInitialize
     * @methodOf Ozone.eventing
     *
     * @param {Array} publicFunctions Optional array of functions to expose to other widgets
     * @param {String} relayUrl Optional String URL to specify the relay URL (used for 
     *                          cross-domain communiation) for this widget
     */
    function clientInitialize(publicFunctions, relayUrl) {
        gadgets.rpc.setRelayUrl("..", getConfig().relayUrl, false, true);

        publicFunctions = [].concat(publicFunctions);
        cacheFunctions(publicFunctions);

        var fnNames = getFunctionNames(publicFunctions);
        var id = getIdFromWindowName();

        if (relayUrl == null) {
            relayUrl = getRelayUrl(document.location.href);
        }

        //this rpc call must be consistent with OWF container_init
        var idString = '{\"id\":\"' + id + '\"}';
        var data = {
            id:idString,
            version:'1.0',
            useMultiPartMessagesForIFPC:true,
            relayUrl:relayUrl
        };
        var dataString = json.stringify(data);
        gadgets.rpc.call("..", OWF.Comms.Constants.CONTAINER_INIT_SERVICE_NAME, null, idString, dataString, fnNames);
    }

    /**
     * @deprecated Use OWF.RPC.registerFunctions() instead
     */
    function registerFunctions(functions) {
        functions = [].concat(functions);

        cacheFunctions(functions);
        gadgets.rpc.call("..", OWF.Comms.Constants.REGISTER_FUNCTIONS_SERVICE_NAME, null, window.name, getFunctionNames(functions));
    }

    /**
     * @deprecated Use OWF.RPC.getWidgetProxy() instead
     * 
     * @description Get a proxy to another widget in the same container. Note that once created, the proxy 
     * will be available in the global Ozone.eventing collection
     *
     * @example
     * createWidget("http://maps.com/widgetMap", "MyMapWidget", "div1", "100%", "100%", ok);</p>
     * function ok() {
     *      Ozone.eventing.MyMapWidget.plot(1.1,2.2);
     * }

     * @name importWidget
     * @methodOf Ozone.eventing
     *
     * @param {String} widgetId The GUID of the widget to get the proxy for
     * @param {Function} ready Callback to call when the proxy is ready to interact with
     * @param {String} accessLevel The minimum access level a widget must have to receive the message
     *
     * @returns {OWF.Eventing.WidgetProxy} A proxy object that can be used to send direct messages, 
     *                                       handle events, or call functions
     */
    function importWidget(widgetId, ready) {
        // assume JSON
        if(widgetId.charAt(0) === '{') {
            widgetId = json.parse(widgetId).id;
        }

        var proxy = createClientSideFunctionShims(widgetId);

        function processFunctionsFromContainer(functions) {
            proxy = createClientSideFunctionShims(widgetId, functions, proxy);
            gadgets.rpc.call("..", OWF.Comms.Constants.GET_WIDGET_READY_SERVICE_NAME, function(isReady) {
                if (isReady) {
                  proxy.fireReady();
                }
                if (typeof ready == 'function') {
                    ready.call(this, proxy);
                }
            }, widgetId, srcWidgetIframeId);
        }

        var id = getIdFromWindowName();
        var srcWidgetIframeId = '{\"id\":\"' + id + '\"}';
        gadgets.rpc.call("..", OWF.Comms.Constants.GET_FUNCTIONS_SERVICE_NAME, processFunctionsFromContainer, widgetId, srcWidgetIframeId);
        return proxy;
    }

    /**
     * Listen for events of a given name using the specified handler function.
     *
     * @name addEventHandler
     * @methodOf Ozone.eventing
     *
     * @param {String} eventName String representation of the event
     * @param {Function} handler Handler to call when the event is fired
     */
    function addEventHandler(eventName, handler) {
        ozoneEventing.clientEventNameToHandler[eventName] = handler;
        var widgetId = getIdFromWindowName();
        gadgets.rpc.call("..", OWF.Comms.Constants.ADD_EVENT_CLIENT_SERVICE_NAME, null, widgetId, eventName);
    }

    /**
     * Raise and event with a json payload.
     *
     * @name raiseEvent
     * @methodOf Ozone.eventing
     *
     * @param {String} eventName String representation of the event
     * @param {Object} payload Data Object to pass along with the event
     */
    function raiseEvent(eventName, payload) {
        gadgets.rpc.call("..", OWF.Comms.Constants.CALL_EVENT_CLIENT_SERVICE_NAME, null, eventName, payload);
    }

    /**
     * Close current dialog widget, returning a json payload to the container.
     *
     * @name closeDialog
     * @methodOf Ozone.eventing
     *
     * @param {Object} payload Data Object to pass along to the container on close
     */
    function closeDialog(payload) {
        document.body.display = "none";
        gadgets.rpc.call("..", OWF.Comms.Constants.CLOSE_EVENT_CLIENT_SERVICE_NAME, null, getIdFromWindowName(), payload);
    }

    /**
     * Get an array of objects containing the url and id of all currently
     * open widgets. (e.g. [ { url: "http://www.example.com", id: "foo" }, ... ])
     *
     * @name getAllWidgets
     * @methodOf Ozone.eventing
     *
     * @param {Function} handlerFn Callback to call when the widget list is retrieved
     */
    function getAllWidgets(handlerFn) {
        function listResultHandler(widgetList) {
            handlerFn(widgetList);
        }

        gadgets.rpc.call("..", OWF.Comms.Constants.LIST_WIDGETS_SERVICE_NAME, listResultHandler);
    }

    gadgets.rpc.register(OWF.Comms.Constants.DIRECT_MESSAGE_CLIENT_SERVICE_NAME, handleDirectMessageWrapper);
    gadgets.rpc.register(OWF.Comms.Constants.FUNCTION_CALL_CLIENT_SERVICE_NAME, handleFunctionCall);
    gadgets.rpc.register(OWF.Comms.Constants.FUNCTION_CALL_RESULT_CLIENT_SERVICE_NAME, handleFunctionCallResult);
    gadgets.rpc.register(OWF.Comms.Constants.EVENT_CLIENT_SERVICE_NAME, handleEventCall);
    gadgets.rpc.register(OWF.Comms.Constants.WIDGET_READY_SERVICE_NAME, function (widgetId) {
        var wproxy = widgetProxyMap[widgetId];
        if (wproxy != null) {
            wproxy.fireReady();
        }
    });

    OWF.RPC = OWF.RPC || {};
    
    OWF.RPC.registerFunctions = ozoneEventing.registerFunctions = registerFunctions;
    OWF.RPC.getWidgetProxy = ozoneEventing.importWidget = importWidget;
    OWF.RPC.handleDirectMessage = function(fn) {
        if(typeof fn !== 'function') {
            throw 'Error: fn must be a function';
        }
        ozoneEventing.handleDirectMessage = fn;
    };

    OWF.RPC.clientInitialize = ozoneEventing.clientInitialize = clientInitialize;
    OWF.RPC.addEventHandler = ozoneEventing.addEventHandler = addEventHandler;
    OWF.RPC.raiseEvent = ozoneEventing.raiseEvent = raiseEvent;
    OWF.RPC.closeDialog = ozoneEventing.closeDialog = closeDialog;
    OWF.RPC.getAllWidgets = ozoneEventing.getAllWidgets = getAllWidgets;
    OWF.RPC.getWidgetProxyMap = ozoneEventing.getWidgetProxyMap = getWidgetProxyMap;

}(window.OWF = window.OWF || {}, 
  window.Ozone = window.Ozone || {}, 
  window.Ozone.eventing = window.Ozone.eventing || {}, 
  window.gadgets || {}, 
  window.gadgets.json || {}));
