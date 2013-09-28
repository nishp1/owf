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
 * This function contains code for shared RPC API container logic that is used both in 
 * StandaloneContainer.js outside of OWF and the container inside OWF.
 */
;(function (window) {
    'use strict';

    var magicFunctionMap = {},
        eventToInterestedClient = {},
        proxyMap = {},
        widgetReadyMap = {},
        getIframeId = null,
        json,
        constants,
        comms,
        _$;

    var Priv = {
        
        /**
         * @private
         * @description Handler called after a widget registers functions, adding them
         *              to the cache of functions.
         *
         * @param {String} iframeId The GUID of the widget that registered the functions
         * @param {Object} data Not used
         * @param {Array} functions Array of functions registered to cache
         */
        clientToldUsFunctionsHandler: function(iframeId, data, functions) {
            var widgetID = json.parse(iframeId).id;
            magicFunctionMap[widgetID] = functions;
        },

        /**
         * @private
         * @description Handler called after a widget registers functions and initialization finished,
         *              adding them to the cache of functions.
         *
         * @param {String} iframeId The GUID of the widget that registered the functions
         * @param {Array} functions Array of functions registered to cache
         */
        clientToldUsFunctionsHandlerAfterInit: function(iframeId, functions) {
            var widgetID = json.parse(iframeId).id;

            if (!magicFunctionMap[widgetID]) {
                magicFunctionMap[widgetID] = functions;
                return;
            }

            // don't add duplicates
            var found;

            for (var i = 0, len = functions.length; i < len; i++) {
                found = false;
                for (var j = 0, len2 = magicFunctionMap[widgetID].length; j < len2; j++) {
                    if (functions[i] === magicFunctionMap[widgetID][j]) {
                        found = true;
                        break;
                    }
                }
                if (found === false) {
                    magicFunctionMap[widgetID].push(functions[i]);
                }
            }
        }
    };

    var RPC = {

        /**
         * @private
         *
         * @description Initialize container for the RPC API, involving setting up various channels to 
         *              handlers on the container to wait for messages from widgets and react appropriately.
         *
         * @param {Object} cfg Optionally used to pass in an override function for getIframeId()
         */
        init: function (cfg) {
        
            cfg = cfg || {};

            getIframeId = cfg.getIframeId;

            comms.register(constants.DIRECT_MESSAGE_SERVICE_NAME, RPC.directHandler);
            comms.register(constants.FUNCTION_CALL_SERVICE_NAME, RPC.functionCallHandler);
            comms.register(constants.FUNCTION_CALL_RESULT_SERVICE_NAME, RPC.functionCallResultHandler);
            comms.register(constants.ADD_EVENT_SERVICE_NAME, RPC.addEventHandler);
            comms.register(constants.CALL_EVENT_SERVICE_NAME, RPC.callEventHandler);
            comms.register(constants.CLOSE_EVENT_SERVICE_NAME, RPC.closeEventHandler);
            comms.register(constants.GET_FUNCTIONS_SERVICE_NAME, RPC.getFunctionsForWidgetHandler);
            comms.register(constants.REGISTER_FUNCTIONS_SERVICE_NAME, Priv.clientToldUsFunctionsHandlerAfterInit);

            //hook widgetReady callbacks
            comms.register(constants.WIDGET_READY_SERVICE_NAME, function (widgetId) {

                //mark this widget as ready
                widgetReadyMap[widgetId] = true;

                //loop through any widgets that have reference to widgetId and send messages that widgetId widget is ready
                var proxyHolders = proxyMap[widgetId];
                if (proxyHolders != null) {
                    for (var i = 0, len = proxyHolders.length; i < len; i++) {
                        var proxyHolder = proxyHolders[i];
                        if (proxyHolder != null) {
                            comms.send(proxyHolder, constants.WIDGET_READY_SERVICE_NAME, null, widgetId);
                        }
                    }
                }
            });

            comms.register(constants.GET_WIDGET_READY_SERVICE_NAME, function (widgetId, srcWidgetId) {
                return widgetReadyMap[widgetId] === true;
            });
        },

        /**
         * @private
         *
         * @description Remotes all registrations to channels that were set up during initialization.
         */
        destroy: function () {
            comms.unregister(constants.DIRECT_MESSAGE_SERVICE_NAME);
            comms.unregister(constants.FUNCTION_CALL_SERVICE_NAME);
            comms.unregister(constants.FUNCTION_CALL_RESULT_SERVICE_NAME);
            comms.unregister(constants.ADD_EVENT_SERVICE_NAME);
            comms.unregister(constants.CALL_EVENT_SERVICE_NAME);
            comms.unregister(constants.CLOSE_EVENT_SERVICE_NAME);
            comms.unregister(constants.GET_FUNCTIONS_SERVICE_NAME);
            comms.unregister(constants.REGISTER_FUNCTIONS_SERVICE_NAME);
            comms.unregister(constants.WIDGET_READY_SERVICE_NAME);
            comms.unregister(constants.GET_WIDGET_READY_SERVICE_NAME);
        },

        /**
         * @private
         * @description Route a direct message between widgets.
         *
         * @param {String} widgetId The GUID of the widget to receive the message
         * @param {Object} payload A data object containing the message
         */
        directHandler: function (widgetId, payload) {
            comms.send(getIframeId(widgetId), constants.DIRECT_MESSAGE_CLIENT_SERVICE_NAME, null, payload);
        },

        /**
         * @private
         * @description Route a function call using a widget proxy to the appropriate widget.
         *
         * @param {String} widgetId The GUID of the widget whose function is being called
         * @param {String} widgetIdCaller The GUID of the widget who is calling the function
         * @param {String} functionName The String representation of the function to call
         * @param {Object} var_args An arguments object to send to the function
         */
        functionCallHandler: function (widgetId, widgetIdCaller, functionName, var_args) {
            comms.send(getIframeId(widgetId), constants.FUNCTION_CALL_CLIENT_SERVICE_NAME, null, widgetId, widgetIdCaller, functionName, var_args);
        },

        /**
         * @private
         * @description Return the result of a remote function call to the calling widget.
         *
         * @param {String} widgetId The GUID of the widget whose function is being called
         * @param {String} widgetIdCaller The GUID of the widget who is calling the function
         * @param {String} functionName The String representation of the function to call
         * @param {Object} result An object containing the result of the function call
         */
        functionCallResultHandler: function (widgetId, widgetIdCaller, functionName, result) {
            comms.send(getIframeId(widgetIdCaller), constants.FUNCTION_CALL_RESULT_CLIENT_SERVICE_NAME, null, widgetId, functionName, result);
        },

        /**
         * @private
         * @description Register a widget for a specific event.
         *
         * @param {String} widgetId The GUID of the widget to register for the event
         * @param {String} eventName The String representation of the event to register for
         */
        addEventHandler: function (widgetId, eventName) {
            var interestedClients = eventToInterestedClient[eventName] || [];
            interestedClients.push(widgetId);
            eventToInterestedClient[eventName] = interestedClients;
        },

        /**
         * @private
         * @description Call the event handlers of all widgets registered for a triggered event,
         *              passing along a data object.
         *
         * @param {String} eventName The String representation of the event to register for
         * @param {Object} payload The data to send to the widgets
         */
        callEventHandler: function (eventName, payload) {
            var interestedClients = eventToInterestedClient[eventName];
            for (var ii = 0; ii < interestedClients.length; ii++) {
                var widgetId = interestedClients[ii];
                comms.send(getIframeId(widgetId), constants.EVENT_CLIENT_SERVICE_NAME, null, eventName, payload);
            }
        },

        /**
         * @private
         * @description Close a given widget.
         *
         * @param {String} widgetId The GUID of the widget to close
         */
        closeEventHandler: function (widgetId) {
            var widget = _$(document.getElementById(getIframeId(widgetId))).parents('.widget')[0];
            setTimeout(function () {
                widget.remove();
            }, 500);
        },

        /**
         * @private
         * @description Return the public functions for a given widget.
         *
         * @param {String} widgetID The GUID of the widget to get the functions of
         * @param {String} sourceWidgetId The GUID of the requesting widget
         */
        getFunctionsForWidgetHandler: function (widgetID, sourceWidgetId) {
            var functions = magicFunctionMap[widgetID];

            //save the fact that the sourceWidgetId has a proxy of the widgetId
            if (proxyMap[widgetID] == null) {
                proxyMap[widgetID] = [];
            }
            if (sourceWidgetId != null) {
                proxyMap[widgetID].push(sourceWidgetId);
            }

            return functions != null ? functions : [];
        }
    };

    //requirejs support
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(['gadgets/json', 'comms/Comms', 'comms/Constants', 'jquery'], function (Gadgets, Comms, Constants, $) {
            json = Gadgets.json;
            comms = Comms;
            constants = Constants;
            _$ = $;

            return RPC;
        });
    }
    else {
        json = window.gadgets.json || {};
        _$ = window._$ || {};

        var OWF = window.OWF = window.OWF || {};
        comms = OWF.Comms = window.OWF.Comms = window.OWF.Comms || {};
        constants = OWF.Comms.Constants = window.OWF.Comms.Constants = window.OWF.Comms.Constants || {};

        //set up and put on Ozone namespace for backwards compat
        var Ozone = window.Ozone = window.Ozone || {};
        Ozone.eventing = window.OWF.eventing = window.OWF.eventing || {};
        Ozone.eventing.rpc = window.OWF.RPC = window.OWF.RPC || {};

        OWF.RPC = Ozone.eventing.rpc = RPC;
        OWF.RPC.priv = Ozone.eventing.rpc.priv = Priv;
    }

}(window));