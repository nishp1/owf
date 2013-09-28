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
    'comms/Container',
    'util/Util',
    'util/version',
    'jquery'
], function(commsContainer, gadgets, Util, version, $) {
    'use strict';

    return function () {

        var cbMap = {
            onRoute:[],
            onPublish:[],
            onSubscribe:[],
            onUnsubscribe:[]
        }, iframeIds = {}, config = {};

        //public
        return {

            name:'OWF',
            version:version.owfversion + version.eventing,

            init:function (cfg) {
                config = cfg || {};

                //setup any widgetEventingReady callbacks
                if (config.widgetEventingReady != null) {
                    cbMap.widgetEventingReady.push(config.widgetEventingReady);
                }
                if (config.onRoute != null) {
                    cbMap.onRoute.push(config.onRoute);
                }
                if (config.onPublish != null) {
                    cbMap.onPublish.push(config.onPublish);
                }
                if (config.onSubscribe != null) {
                    cbMap.onSubscribe.push(config.onSubscribe);
                }
                if (config.onUnsubscribe != null) {
                    cbMap.onUnsubscribe.push(config.onUnsubscribe);
                }

                //initialize shindig pubsub
                commsContainer.setupPubSubRouting(function (id) {
                    return id;
                }, {
                    onRoute:function (sender, subscriber, channel, message) {
                        var returnValue = true;

                        //execute any callbacks if any return false then stop the message
                        for (var i = 0, len = cbMap.onRoute.length; i < len; i++) {
                            returnValue = returnValue && (cbMap.onRoute[i].fn.call(cbMap.onRoute[i].scope, sender, subscriber, channel, message) !== false);
                        }

                        //shindig pubsubrouter expects true to means don't send the message
                        //so we reverse the value here so false means don't allow the action which makes more sense
                        return !returnValue;
                    },
                    onPublish:function (sender, channel, message) {
                        var returnValue = true;

                        //execute any callbacks if any return false then stop the message
                        for (var i = 0, len = cbMap.onPublish.length; i < len; i++) {
                            returnValue = returnValue && (cbMap.onPublish[i].fn.call(cbMap.onPublish[i].scope, sender, channel, message) !== false);
                        }

                        //shindig pubsubrouter expects true to means don't send the message
                        //so we reverse the value here so false means don't allow the action which makes more sense
                        return !returnValue;
                    },
                    onSubscribe:function (sender, message) {
                        var returnValue = true;

                        //execute any callbacks if any return false then stop the message
                        for (var i = 0, len = cbMap.onSubscribe.length; i < len; i++) {
                            returnValue = returnValue && (cbMap.onSubscribe[i].fn.call(cbMap.onSubscribe[i].scope, sender, message) !== false);
                        }

                        //shindig pubsubrouter expects true to means don't send the message
                        //so we reverse the value here so false means don't allow the action which makes more sense
                        return !returnValue;
                    },
                    onUnsubscribe:function (sender, message) {
                        var returnValue = true;

                        //execute any callbacks if any return false then stop the message
                        for (var i = 0, len = cbMap.onUnsubscribe.length; i < len; i++) {
                            returnValue = returnValue && (cbMap.onUnsubscribe[i].fn.call(cbMap.onUnsubscribe[i].scope, sender, message) !== false);
                        }

                        //shindig pubsubrouter expects true to means don't send the message
                        //so we reverse the value here so false means don't allow the action which makes more sense
                        return !returnValue;
                    }
                });

            },

            /**
             * @description Adds a widgetEventingReady handler function.  Each function will be executed for each widget that initializes
             * in the container
             * @param handler
             * @param scope
             */
            onRoute:function (handler, scope) {
                cbMap.onRoute.push({fn:handler, scope:scope});
            },
            onPublish:function (handler, scope) {
                cbMap.onPublish.push({fn:handler, scope:scope});
            },
            onSubscribe:function (handler, scope) {
                cbMap.onSubscribe.push({fn:handler, scope:scope});
            },
            onUnsubscribe:function (handler, scope) {
                cbMap.onUnsubscribe.push({fn:handler, scope:scope});
            },
            addListener:function (event, handler, scope) {
                if (cbMap[event] != null) {
                    cbMap[event].push({fn:handler, scope:scope});
                }
            },
            removeListener:function (event, handler, scope) {
                if (cbMap[event] != null) {
                    for (var i = 0; i < cbMap[event].length; i++) {
                        var cb = cbMap[event][i];
                        if (cb.fn == handler && cb.scope == scope) {
                            cbMap[event].splice(i, 1);
                        }
                    }
                }
            },
            clearListeners:function (event) {
                if (cbMap[event] != null) {
                    cbMap[event] = [];
                }
            },
            clearAllListeners:function () {
                cbMap = {
                    onRoute:[],
                    onPublish:[],
                    onSubscribe:[],
                    onUnsubscribe:[]
                };
            },

            /**
             * @description Subscribe to a named channel for a given function.
             * @param channelName The channel to subscribe to.
             * @param handlerObject The function you wish to subscribe
             */
            subscribe:function (channelName, handlerObject) {
                commsContainer.subscribe(channelName, handlerObject);
            },

            /**
             * @description UnSubscribe to a named channel
             * @param {String} channelName The channel to unsubscribe to.
             */
            unsubscribe:function (channelName) {
                commsContainer.unsubscribe(channelName);
            },

            /**
             * @ignore
             * @description Publish a message to a given channel
             * @param {String} channelName The name of the channel to publish to
             * @param {Object} message The message to publish to the channel.
             * @param {String} [dest] The id of a particular destination.  Defaults to null which sends to all
             *                 subscribers on the channel
             */
            publish:function (channelName, message, dest) {
                commsContainer.publish(channelName, message, dest);
            }
        };
    }();
});
