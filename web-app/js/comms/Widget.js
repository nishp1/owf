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
;(function (window, document, OWF, $, undefined) {
    'use strict';

    var readyCallbacks = $.Callbacks("memory");

    var Widget = {
        initializing: false,
        initialized: false,
        widgetRelayURL: OWF.relayFile,
        init: function (widgetRelay) {
            var jsonString = null,
                    deferred = $.Deferred();

            this.initializing = true;

            this.setWidgetRelay(widgetRelay);

            //check for data in window.name
            var configParams = OWF.Util.parseWindowNameData();
            if (configParams != null) {

                //the id is the whole contents of the window.name
                this.widgetId = '{\"id\":\"' + configParams.id + '\"}';
                this.locked = configParams.locked;

                //embedded in the id is the relay
                this.containerRelay = configParams.relayUrl;
            }
            else {
                throw {
                    name: 'WidgetInitException',
                    message: 'The call to ' + OWF.Comms.Constants.CONTAINER_INIT_SERVICE_NAME + ' failed. Inner Exception: '
                };
            }

            OWF.Comms.setRelayUrl("..", this.containerRelay, false, true);

            var handlersActive = false;
            var activateWidget = $.proxy(function () {

                var config = {
                    fn: "activateWidget",
                    params: {
                        guid: configParams.id,
                        focusIframe: document.activeElement === document.body
                    }
                };

                var stateChannel = OWF.Comms.Constants.WIDGET_STATE_CHANNEL_PREFIX + configParams.id;
                if (!this.disableActivateWidget) {
                    OWF.Comms.send('..', stateChannel, null, this.widgetId, config);
                }
                else {
                    this.disableActivateWidget = false;
                }
            }, this);

            //register for after_container_init
            var me = this;
            OWF.Comms.register(OWF.Comms.Constants.AFTER_CONTAINER_INIT_SERVICE_NAME, function () {

                OWF.Comms.unregister(OWF.Comms.Constants.AFTER_CONTAINER_INIT_SERVICE_NAME);

                //attach mouse click and keydown listener to send activate calls for the widget
                if (!handlersActive) {
                    $(document).on('click', activateWidget);
                    $(document).on('keyup', activateWidget);
                    handlersActive = true;
                }

                //manage state flags
                me.initializing = false;
                me.initialized = true;

                //execute any readyCallbacks
                readyCallbacks.fire(this);

                //widget initial handshake complete resolve deferred
                deferred.resolve(this);
            });

            OWF.Comms.register(OWF.Comms.Constants.WIDGET_ACTIVATED_SERVICE_NAME, function () {
                //console.log(OWF.Comms.Constants.WIDGET_ACTIVATED_SERVICE_NAME + " => " + configParams.id);

                if (handlersActive) {
                    $(document).off('click', activateWidget);
                    $(document).off('keyup', activateWidget);
                    handlersActive = false;
                }
            });

            OWF.Comms.register(OWF.Comms.Constants.WIDGET_DEACTIVATED_SERVICE_NAME, function () {
                //console.log(OWF.Comms.Constants.WIDGET_DEACTIVATED_SERVICE_NAME + " => " + configParams.id);

                if (!handlersActive) {
                    $(document).on('click', activateWidget);
                    $(document).on('keyup', activateWidget);
                    handlersActive = true;
                }
            });

            //register with container
            try {
                var idString = '{\"id\":\"' + configParams.id + '\"}';
                var data = {
                    id: idString,
                    version: this.version,
                    useMultiPartMessagesForIFPC: true,
                    relayUrl: this.widgetRelay
                };

                if (OWF.Util.pageLoad.loadTime != null && OWF.Util.pageLoad.autoSend) {
                    data.loadTime = OWF.Util.pageLoad.loadTime;
                }

                //jsonString = gadgets.json.stringify(data);
                jsonString = JSON.stringify(data);
                OWF.Comms.send('..', OWF.Comms.Constants.CONTAINER_INIT_SERVICE_NAME, null, idString, jsonString);

            }
            catch (error) {
                deferred.reject(error);
                throw {
                    name: 'WidgetInitException',
                    message: 'The call to ' + OWF.Comms.Constants.CONTAINER_INIT_SERVICE_NAME + ' failed. Inner Exception: ' + error
                };
            }

            return deferred.promise();
        },

        ready: function(callback) {
          readyCallbacks.add(callback);
        },

        /**
         * @ignore
         * @returns The URL for the widgetRelay
         * @description This should not be called from usercode.
         */
        getWidgetRelay: function () {
            return this.widgetRelay;
        },
        /**
         * @ignore
         * @param The relaypath to set.
         * @description This should not be called from usercode.
         */
        setWidgetRelay: function (relaypath) {
            //if null figure out path
            if (relaypath == null) {
                //check if global path variable was set
                if (OWF.relayFile != null) {
                    relaypath = OWF.relayFile;
                }
                //else calculate a standard relative path
                else {
                    //find root context - assume relay file is at /<context/js/eventing/rpc_relay.uncompressed.html
                    var baseContextPath = window.location.pathname;
                    var baseContextPathRegex = /^(\/[^\/]+\/).*$/i;
                    var matches = baseContextPath.match(baseContextPathRegex);
                    if (matches != null && matches[1] != null && matches[1].length > 0) {
                        baseContextPath = matches[1];
                        //remove final /
                        baseContextPath = baseContextPath.substring(0, baseContextPath.length - 1);
                    }
                    else {
                        baseContextPath = '';
                    }
                    relaypath = baseContextPath + '/js/eventing/rpc_relay.uncompressed.html';
                }
            }
            this.widgetRelay = window.location.protocol + "//" + window.location.host + (relaypath.charAt(0) != '/' ? ('/' + relaypath) : relaypath);
        },

        /**
         * @description Returns the Widget Id
         * @returns {String} The widgetId is a complex JSON encoded string which identifies a widget for Eventing.
         *   Embedded in this string is the widget's uniqueId as the 'id' attribute.  There is other data is in the string
         *   which is needed for Eventing and other APIs to function properly. This complex widgetId string may be used in
         *   the <a href="#publish">Ozone.eventing.Widget.publish</a> function to designate a specific recipient for a message.
         *   Additionally, once subscribed to a channel via <a href="#subscribe">Ozone.eventing.Widget.subscribe</a> during the
         *   receipt of a message, the sender's widgetId is made available as the first argument to the handler function.
         * @example
         * //decode and retrieve the widget's unique id
         * var complexIdString = this.eventingController.getWidgetId();
         * var complexIdObj = owfdojo.toJson(complexIdString);
         *
         * //complexIdObj will look like
         * // {
         * //  //widget's uniqueId
         * //  id:"49cd21f0-3110-8121-d905-18ffa81b442e"
         * // }
         *
         * //get Widget's uniqueId
         * alert('widget id = ' + complexIdObj.id);
         */
        getWidgetId: function () {
            return this.widgetId;
        },

        /**
         * @ignore
         * @returns The containerRelay
         * @description This should not be called from usercode.
         */
        getContainerRelay: function () {
            return this.containerRelay;
        },
        /**
         * @ignore
         */
        register: function () {
            //Simple wrapper for manager objects to register handler functions
            OWF.Comms.register.apply(this, arguments);
        },

        /**
         * @ignore
         */
        unregister: function () {
            //Simple wrapper for manager objects to register handler functions
            OWF.Comms.unregister.apply(this, arguments);
        },

        /**
         * @ignore
         * Wraps gadgets.rpc.call.
         */
        send: function () {
            OWF.Comms.send.apply(this, arguments);
        },

        //wrapping gadgets.rpc.pubsub
        publish: function (channel, message, dest) {
            gadgets.pubsub.publish(channel, message, dest);
        },

        subscribe: function (channel, callback) {
            gadgets.pubsub.subscribe(channel, callback);
        },

        /**
         * Unsubscribes from a channel.
         * @param {string} channel Channel name.
         */
        unsubscribe: function (channel) {
            gadgets.pubsub.unsubscribe(channel);
        }
    };

    //expose eventing to OWF.Comms namepace
    var Comms = OWF.Comms = OWF.Comms || {};
    Comms.Widget = Widget;

})(window, document, window.OWF = window.OWF || {}, window._$);