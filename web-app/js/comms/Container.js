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
/*global require*/
define([
    'gadgets/pubsub_router',
    'config',
    'comms/Comms',
    'comms/Constants',
    'util/Util',
    'util/version',
    'lodash',
    'jquery'
], function (gadgets, Config, Comms, Constants, Util, Version, _, $) {
    'use strict';

        var Ozone = Ozone ? Ozone : {};
        Ozone.eventing = Ozone.eventing ? Ozone.eventing : {};

        var cbMap = {
                widgetEventingReady: []
            }, 
            iframeIds = {},
            options = {};

        function containerInit(sender, message) {
            //Handler used by container to parse out incoming initiation messages from gadgets
            //and set their relay URLs for communications downward

            if ((window.name === "undefined") || (window.name === "")) {
                window.name = "ContainerWindowName" + Math.random();
            }

            var initMessage = Comms.parse(message);
            var useMultiPartMessagesForIFPC = initMessage.useMultiPartMessagesForIFPC;
            var idString = null;
            if (initMessage.id.charAt(0) !== '{') {
                idString = initMessage.id;
            }
            else {
                var obj = Comms.parse(initMessage.id);
                var id = obj.id;
                idString = Comms.stringify({id: obj.id});
            }

            Comms.setRelayUrl(idString, initMessage.relayUrl, false, useMultiPartMessagesForIFPC);
            Comms.setAuthToken(idString, 0);

            //execute any widgetEventingReady callbacks
            for (var i = 0, len = cbMap.widgetEventingReady.length; i < len; i++) {
                cbMap.widgetEventingReady[i].fn.call(cbMap.widgetEventingReady[i].scope, sender, message);
            }

            //sent after_container_init message
            var jsonString = '{\"id\":\"' + window.name + '\"}';
            Comms.send(idString, Constants.AFTER_CONTAINER_INIT_SERVICE_NAME, null, window.name, jsonString);
        }


        //public
        return {

            name: 'OWF',
            version: Version.owfversion + Version.eventing,

            init: function (opts) {
                options = opts || {};

                //determine containerRelay
                this.setContainerRelay(options.containerRelay);

                //setup any widgetEventingReady callbacks
                if (options.widgetEventingReady) {
                    this.widgetEventingReady(options.widgetEventingReady.fn,options.widgetEventingReady.scope);
                }

                //check for overrides
                if (options.getIframeId) {
                    this.getIframeId = $.proxy(options.getIframeId.fn, options.getIframeId.scope);
                }
                if (options.getOpenedWidgets) {
                    this.getOpenedWidgets = $.proxy(options.getOpenedWidgets.fn, options.getOpenedWidgets.scope);
                }

                //hook containerInit for when widgets initialize with the container
                Comms.register(Constants.CONTAINER_INIT_SERVICE_NAME, function (sender, message, functions) {
                    //initialize the widget with the container
                    containerInit(sender, message);
                });
            },

            /**
             * @description Adds a widgetEventingReady handler function.  Each function will be executed for each widget that initializes
             * in the container
             * @param handler
             * @param scope
             */
            widgetEventingReady: function (handler, scope) {
                cbMap.widgetEventingReady.push({fn: handler, scope: scope});
            },
            addListener: function (event, handler, scope) {
                if (cbMap[event]) {
                    cbMap[event].push({fn: handler, scope: scope});
                }
            },
            removeListener: function (event, handler, scope) {
                if (cbMap[event]) {
                    for (var i = 0; i < cbMap[event].length; i++) {
                        var cb = cbMap[event][i];
                        if (cb.fn == handler && cb.scope == scope) {
                            cbMap[event].splice(i, 1);
                        }
                    }
                }
            },
            clearListeners: function (event) {
                if (cbMap[event]) {
                    cbMap[event] = [];
                }
            },
            clearAllListeners: function () {
                cbMap = {
                    widgetEventingReady: []
                };
            },

            /**
             *
             * @param uniqueId
             */
            getIframeId: function (uniqueId) {
                return iframeIds[uniqueId];
            },

            /**
             * @description Return an iframe DOM element given a unique id.
             * @param uniqueId
             */
            getIframeEl: function (uniqueId) {
                return document.getElementById( this.getIframeId(uniqueId) );
            },

            getOpenedWidgets: function () {
                return iframeIds.length ? iframeIds : 0;
            },

            /**
             * @description This method takes a widget model and returns an object with the widget's iframe attributes
             */
            getIframeAttributes: function (widget, dashboard) {
                function getAttr(obj, name) {
                  return _.isFunction(obj.get) ? obj.get(name) : obj[name];
                }

                var id = getAttr(widget,'id') || getAttr(widget,'uniqueId');
                var url = getAttr(widget,'src') || getAttr(widget,'url');
                var generatedIdText = JSON.stringify({
                    id: id
                });
                var generatedNameObj = {
                    id: id,
                    containerVersion: Version.owfversion,
                    relayUrl: this.getContainerRelay(),
                    owf: true,
                    url: url,

                    //these are needed for widget backward compat
                   webContextPath: Config.webContextPath,
                   preferenceLocation: Config.prefsLocation,

                    //todo figure out if we need the properties below
                    lang: 'en-US',
                    layout: "",
                    guid: id,
                    version:getAttr(widget,'version') || 1,
                    locked: (dashboard != null && getAttr(dashboard,'locked'))
                };

                var generatedNameText = JSON.stringify(generatedNameObj);
                var a = url.split('?');
                var base = a[0];
                var qstring = '';
                if (a[1]) {
                    qstring = '&' + a[1];
                }

                //put extra parameters into the frame src and use the generatedid for the id and name of the frame
                var ret = {
                    id: generatedIdText,
                    name: generatedNameText,
                    src: base + "?lang=en-US&owf=true" + qstring
                };
//                if (generatedNameObj.currentTheme) {
//                    var currentThemeName = generatedNameObj.currentTheme.themeName;
//                    var currentThemeContrast = generatedNameObj.currentTheme.themeContrast;
//                    var currentThemeFontSize = generatedNameObj.currentTheme.themeFontSize;
//
//                    ret.src += '&themeName=' + currentThemeName;
//                    ret.src += '&themeContrast=' + currentThemeContrast;
//                    ret.src += '&themeFontSize=' + currentThemeFontSize;
//                }
                ret.src += "\" ";

                iframeIds[id] = generatedIdText;
                iframeIds.length != null ? iframeIds.length++ : iframeIds.length = 0;

                return ret;
            },

            /**
             * @returns A string which represents the address where the container relay file is located.
             */
            getContainerRelay: function () {
                return this.containerRelay;
            },
            /**
             * @ignore
             * @param A string representing the full or relative URL to the container relay file.
             * @description Call this method to set the location of the container relay file. You may specify either a full or a relative URL. <strong>An incorrectly set URL will result in relaying not working, but no error message will display.</strong>
             */
            setContainerRelay: function (relaypath) {

                if (relaypath === undefined || relaypath === '') {
                    //default location
                    relaypath = window.location.protocol + "//" + window.location.host + window.location.pathname + "/js/eventing/rpc_relay.uncompressed.html";
                }

                //For purposes of basic proxy safeguards the container relay is pulled from the current
                //window.location parameters and the relay path passed in by the manager object.

                //We should handle people passing in a full URL instead of a relative path. Let's accept both.

                var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;

                // parse_url.exec will give us an array with entries of
                // ['url', 'scheme', 'slash', 'host', 'port','path', 'query', 'hash'];
                var result = parse_url.exec(relaypath);
                if (result[1] === undefined || result[1] === null || result[1] === '') {
                    // Meaning there is no scheme, so we can just use the relaypath that was passed in.
                    // (Extra regexp at the end ensures no double slashes, save for the one after protocol.)
                    this.containerRelay = window.location.protocol + "//" + (window.location.host + "/" + relaypath).replace(/\/{2,}/, '/');
                }
                else {
                    // There is a scheme, therefore this is a full url. Let's just use the path
                    // (Extra regexp at the end ensures no double slashes, save for the one after protocol.)
                    this.containerRelay = window.location.protocol + "//" + (window.location.host + "/" + result[5]).replace(/\/{2,}/, '/');
                }
            },

            //wrapping gadgets.pubsub_router
            setupPubSubRouting: function (gadgetIdToSpecUrlHandler, opt_callbacks) {
                gadgets.pubsubrouter.init(gadgetIdToSpecUrlHandler, opt_callbacks);
            },
            publish: function (channel, message, dest) {
                gadgets.pubsubrouter.publish(channel, message, dest);
            },
            subscribe: function (channel, handler) {
                gadgets.pubsubrouter.subscribe(channel, handler);
            },
            unsubscribe: function (channel) {
                gadgets.pubsubrouter.unsubscribe(channel);
            }

        };
});
