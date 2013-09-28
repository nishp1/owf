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
define(function () {
    'use strict';

    return {

        isUrlLocal: function(url, webContextPath) {

            //todo the default should come from server config
            webContextPath = webContextPath || '/owf/';

            //append last '/' this value should never be null
            if (webContextPath !== '' && webContextPath != null) {
                webContextPath += '/';
            }

            //this regex matches urls against the configured webcontext path https://<contextPath>/.....
            //only one match is possible since this regex matches from the start of the string
            var regex = new RegExp("^(https?:)//([^/:]+):?(.*)" + webContextPath);
            var server = url.match(regex);

            //check if this might be a relative url
            if (!server) {
                if (url.match(new RegExp('^https?:\/\/'))) {
                    return false;
                }
                else {
                    return true;
                }
            }

            var port = window.location.port;// || ( window.location.protocol === "https:" ? "443" : "80" )

            //todo need to find a better way of checking same domain requests
            // see if solution posted here works: http://stackoverflow.com/questions/9404793/check-if-same-origin-policy-applies
            return window.location.protocol === server[1] && window.location.hostname === server[2] && port === server[3];
        },

        guid: function () {
            function S4() {
                /*jshint bitwise:false*/
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }

            return function () {
                return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
            };
        }()
    };
});