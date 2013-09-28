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
/*global gadgets, define*/
;(function (window, undefined) {
    'use strict';

    /*
     * Helper method for OWF.Comms.sendWithPromise.
     * Handles the rpc response and calls the appropriate method
     * on the deferred
     */
    function handlePromiseResponse(response) {
        /*jshint validthis:true */

        //'this' should be the deferred
        this[response.success ? 'resolve' : 'reject'](response.data);
    }

    var _gadgets = null,
        $;
    
    var Comms = {

        /**
         * @ignore
         */
        setRelayUrl: function() {
            _gadgets.rpc.setRelayUrl.apply(_gadgets, arguments);
        },

        /**
         * @ignore
         */
        setAuthToken: function() {
            _gadgets.rpc.setAuthToken.apply(_gadgets, arguments);
        },

        /**
         * @ignore
         */
        register: function () {
            //Simple wrapper for manager objects to register handler functions
            _gadgets.rpc.register.apply(_gadgets, arguments);
        },

        /**
         * @ignore
         */
        unregister: function () {
            //Simple wrapper for manager objects to register handler functions
            _gadgets.rpc.unregister.apply(_gadgets, arguments);
        },

        /**
         * @ignore
         * Wraps gadgets.rpc.call.
         */
        send: function () {
            _gadgets.rpc.call.apply(_gadgets, arguments);
        },

        /**
         * @ignore
         * Wraps gadgets.rpc.call.
         */
        parse: function () {
            return _gadgets.json.parse.apply(_gadgets, arguments);
        },

        /**
         * @ignore
         * Wraps gadgets.rpc.call.
         */
        stringify: function () {
            return _gadgets.json.stringify.apply(_gadgets, arguments);
        },

        /**
         * @ignore
         * Invokes a gadgets.rpc service and returns a promise that can be used to
         * handle successes and failures returned by the service.  The service must specifically
         * support this by being registered with OWF.Comms.registerWithPromise
         * @param dest The destination iframe id or '..' for the container
         * @param serviceName The name of the RPC service to invoke
         * @param args The arguments to send to the RPC service
         * @return a Promise object for the RPC call
         */
        sendWithPromise: function(dest, serviceName, args) {
            var deferred = $.Deferred();

            try {
                Comms.send(dest, serviceName, $.proxy(handlePromiseResponse, deferred), args);
            }
            catch (e) {
                deferred.reject({responseText: e});
            }

            return deferred.promise();
        },

        /**
         * @ignore
         * Registers a rpc service that is meant to work with the
         * sendWithPromise function
         * @param serviceName The name of the RPC service to invoke
         * @param handler The handler function for this service, which can
         * be written the same way as if it had been used with a normal
         * register call, with the added functionality that it can pass 
         * 'false' as the second parameter to the callback function in order
         * to indicate failure
         */
        registerWithPromise: function(serviceName, handler) {
            //wrap the return value of the handler function
            function processReturnData(result, success) {
                //success must explicitly be set to false to indicate failure
                success = (success !== false);

                return {
                    success: success,
                    data: result
                };
            }

            //'this' is the rpc object
            function handlerWrapper() {
                /*jshint validthis:true */
                var rpc = this,
                    retval,
                    context = $.extend({}, this);

                context.callback = function(result, success) {
                    rpc.callback(processReturnData(result, success));
                };

                try {
                    retval = handler.apply(context, arguments);
                }
                catch (e) {
                    return processReturnData({
                        responseText: e instanceof Error ? e.message : e
                    }, false);
                }


                if (typeof retval !== 'undefined') {
                    return processReturnData(retval);
                }
            }

            Comms.register(serviceName, handlerWrapper);
        },

        /**
         * @ignore
         * Convenience function used to attach service handlers that are based
         * around an asynchronous call to Backbone.sync and related methods.  If the
         * sync is successful, the synced model's JSON representation is returned,
         * otherwise, the response status code and responseText are returned.  This
         * function builds on top of registerWithPromise
         * @param serviceName The servicename to bind
         * @param A function that returns a promise object which behaves as defined
         * by the return of Backbone.sync
         */
        registerBackboneSyncHandler: function(serviceName, handler) {
            //wrapper for the handler that is passed in
            function handlerWrapper() {
                /*jshint validthis:true */
                var rpc = this;

                //wrapper for the response that comes back from handler
                function responseWrapper(model, resp) {

                    //'this' should be the promise
                    if (this.state() === 'resolved') {
                        //success
                        
                        rpc.callback(model.toJSON(), true);
                    }
                    else {
                        //not resolved, must be rejected.
                        //relay error message back to widget
                        rpc.callback({
                            status: resp.status,
                            responseText: resp.responseText
                        }, false);
                    }
                }

                handler.apply(this, arguments).always(responseWrapper);
            }

            Comms.registerWithPromise(serviceName, handlerWrapper);
        }
    };

    //requirejs support
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(['gadgets/rpc', 'jquery'], function (g, j) {
            _gadgets = g;
            $ = j;
            return Comms;
        });
    }
    else {
        //no requirejs
        _gadgets = window.gadgets;
        $ = window._$;

        var OWF = window.OWF = window.OWF || {};
        OWF.Comms = Comms;
    }
})(window);
