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

    var Lang = {

        languageSetting: 'en-US',

        version : OWF.Version.owfversion + OWF.Version.language,


        urlDecode: function (string, overwrite) {
            if (!string || !string.length) {
                return {};
            }
            var obj = {};
            var pairs = string.split('&');
            var pair, name, value;
            for (var i = 0, len = pairs.length; i < len; i++) {
                pair = pairs[i].split('=');
                name = decodeURIComponent(pair[0]);
                value = decodeURIComponent(pair[1]);
                if (overwrite !== true) {
                    if (typeof obj[name] == "undefined") {
                        obj[name] = value;
                    }
                    else if (typeof obj[name] == "string") {
                        obj[name] = [obj[name]];
                        obj[name].push(value);
                    }
                    else {
                        obj[name].push(value);
                    }
                }
                else {
                    obj[name] = value;
                }
            }
            return obj;
        },

        /**
         * @description Gets the language that is currently being used by OWF
         * @return Returns the ISO 639-1 language code for the language that is currently being used by OWF
         * @example
         * if (Ozone.lang.getLanguage() == 'es') {
         *   AnnouncingClockStrings.timeLabel = 'El tiempo es';
         * }
         *
         */
        getLanguage: function () {
            var params = Lang.urlDecode(window.location.search.substring(1));
            if (params.lang) {
                return params.lang;
            }
            else {

                //try to find it in the window.name
                if (OWF.Util.parseWindowNameData) {

                    var data = OWF.Util.parseWindowNameData();
                    if (data != null && data.lang) {
                        return data.lang;
                    }
                }
            }

            //just use default
            return Lang.languageSetting;
        }
    };

    //put on OWF namespace
    OWF.Lang = Lang;

    //put on Ozone namespace for backwards compat
    var Ozone = window.Ozone = window.Ozone || {};
    Ozone.lang = Lang;


})(window, document, window.OWF = window.OWF || {}, window._$);