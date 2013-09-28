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
/*jshint eqnull:true, eqeqeq:false */
define([
    'util/containerUtil',
    //libs
    'lodash',
    'jquery',
    'jquery-wnt'
], function (ContainerUtil, _, $) {
    'use strict';

    return {
        /**
         * @private
         *
         * @params  cfg.url               -  url of the request
         *          cfg.method            -  HTTP verb (only POST or GET, use _method = PUT or DELETE with a POST )
         *          cfg.onSuccess         -  callback function to capture the success result
         *          cfg.onFailure         -  callback to execute if there is an error
         *          cfg.content           -  optional content to send with the request, ie {value: 'x', _method: 'PUT'}
         *          cfg.async             -  optional (default is true, asynchronous send, only applies to Ajax call)
         *          cfg.handleAs          - text or json
         *          cfg.autoSendVersion   -  true to send owf version to the server, false don't send (defaults to true)
         *          cfg.ignoredErrorCodes -  optional array of http error codes to ignore (if these happen onSucess will be called)
         *          cfg.forceXdomain      -  optional flag to force xdomain ajax call using dojo window.name
         *
         *  @returns void, use callbacks
         *
         *  Static method.  Must use 2 callbacks since javascript is asyncronous
         *  we have to wait for the response.
         *
         *  This implementation uses the dojox.windowName hack for a remote server,
         * but could be replaced with something else like JSONP if desired
         */
        send: function (cfg) {
            var methodToUse = cfg.method;
            if (methodToUse == "PUT" || methodToUse == "DELETE") {
                methodToUse = "POST";
            }

            if (cfg.content == null) {
                cfg.content = {};
            }

            var content = cfg.content;

            var handleAs = 'json';
            if (cfg.handleAs != null) {
                handleAs = cfg.handleAs;
            }

            // Use AJAX if we can
            if (ContainerUtil.isUrlLocal(cfg.url) && !cfg.forceXdomain) {
                return $.ajax({
                    url: cfg.url,
                    type: methodToUse.toUpperCase(),
                    async: cfg.async || cfg.async == null,
                    dataType: 'text',
                    data: cfg.content,
                    cache: false,
                    timeout: cfg.timeout ? cfg.timeout : 0,

                    success: function (response, textStatus, jqXHR) {
                        if (handleAs == 'json') {
                            try {
                                var json = JSON.parse(response);
                                cfg.onSuccess(json);
                            }
                            catch (e) {
                                cfg.onFailure(e.name + " : " + e.message);
                            }
                        }
                        else {
                            cfg.onSuccess(response);
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        if (jqXHR.status !== 0) {
                            if (cfg.ignoredErrorCodes != null && cfg.ignoredErrorCodes.length > 0 && _.indexOf(cfg.ignoredErrorCodes, jqXHR.status) > -1) {
                                cfg.onSuccess({});
                            }
                            else {
                                cfg.onFailure(jqXHR.responseText, jqXHR.status);
                            }
                        }
                    }
                });
            }
            else {
                // Use window.name transport
                var deferred = $.Deferred();
                $.wnt[methodToUse.toLowerCase()](
                        cfg.url,
                        _.extend(content, {
                            windowname: true
                        }),
                        function (result) {
                            var json = null;
                            if (result && typeof(result) === 'string') {

                                //need to handle the old ill formatted json that may comeback
                                //this data did not have double quotes around the status and data attributes
                                result = result.replace(/\s*\{\s*status\:(.*),\s*data\:([\s\S]*)/, '{ "status":$1, "data":$2');

                                json = JSON.parse(result);
                            }
                            else {
                                json = result;
                            }

                            if (json.status === 200) {
                                if (handleAs == 'json') {
                                    cfg.onSuccess(json.data);
                                    deferred.resolve(json.data);
                                }
                                else {
                                    cfg.onSuccess(result);
                                    deferred.resolve(result);
                                }
                            }
                            else if (json.status === 500 || json.status === 401) {
                                cfg.onFailure(json.data);
                                deferred.reject(json.data);
                            }
                            //if it is an error code we ignore than call onSuccess with empty data
                            else if (cfg.ignoredErrorCodes != null && cfg.ignoredErrorCodes.length > 0 && _.indexOf(cfg.ignoredErrorCodes, json.status) > -1) {
                                cfg.onSuccess({});
                                deferred.resolve({});
                            }
                            else {
                                cfg.onFailure(json.data, json.status);
                                deferred.reject(json.data, json.status);
                            }
                        });
                return deferred.promise();
            }
        }
    };
});