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
;(function (window, document, undefined) {
    'use strict';

    /**
     * @ignore
     */
    var OWF = window.OWF = window.OWF || {};

    /**
     * @ignore
     */
    OWF.Util = OWF.Util || {};

    /**
     * @private
     * @description This method informs a widget developer if their widget is running
     * in a Container, like OWF
     *
     * @returns  boolean true if the widget is inside a container, false otherwise.
     *
     */
    OWF.Util.isInContainer = function () {
        var inContainer = false;

        //check window.name
        if (OWF.Util.parseJson) {
            var configParams = OWF.Util.parseWindowNameData();
            if (configParams != null
            //is the fact that a json string was in window.name enough to determine the widget is in a container?
            //&& configParams.inContainer
                    ) {
                inContainer = true;
            }
        }
        return inContainer;
    };

    /**
     * @description This method informs a widget developer if their widget is running
     * from the OWF or from a direct URL call.
     *
     * @returns  boolean true if the widget is inside OWF, false otherwise.
     *
     */
    OWF.Util.isRunningInOWF = function () {
        var isInOwf = false;

        //check window.name
        if (OWF.Util.parseJson) {
            var configParams = OWF.Util.parseWindowNameData();
            if (configParams != null && configParams.owf) {
                isInOwf = true;
            }
        }
        return isInOwf;
    };

    /**
     * @description This method returns flash/flex object from dom.
     *
     * @returns  flash/flex object from dom
     *
     */
    OWF.Util.getFlashApp = function (id) {
        id = id || Ozone.dragAndDrop.WidgetDragAndDrop.getInstance().getFlashWidgetId();
        if (!id) {
            return;
        }

        if (navigator.appName.indexOf("Microsoft") != -1) {
            return window[id];
        }
        else {
            return document[id];
        }
    };

    /**
     * @private
     * @description This method will convert a string into a json object.  There is a check
     * done to ensure no unsafe json is included.
     *
     * @param {String} str String that represents a json object
     *
     * @returns {Object} json object
     *
     * @throws Error if parameter is not a string
     * @throws Error if there is an issue converting to JSON
     */
    OWF.Util.parseJson = function (str) {
        if (typeof(str) === 'string') {
            return JSON.parse(str);
        }
        else {
            throw "OWF.Util.parseJson expected a string, but didn't get one";
        }
    };

    /**
     * @private
     * @description This method will convert anything to a string.
     * There is no check for recursion, so don't do that
     *
     * @param {Object} obj object to convert
     *
     * @returns string
     */
    OWF.Util.toString = function (obj) {
        if (typeof(obj) === 'object') {
            return JSON.stringify(obj);
        }
        else {
            return obj + '';
        }
    };

    OWF.Util.parseWindowNameData = function () {
        var configParams = null;
        return function () {

            //if already parsed just return the value
            if (configParams) {
                return configParams;
            }

            //parse out the config
            try {
                configParams = OWF.Util.parseJson(
                        window.name
                );
                return configParams;
            }
            catch (e) {
                return null;
            }
        };
    }();

    //put on Ozone namespace for backwards compat
    var Ozone = window.Ozone = window.Ozone || {};
    Ozone.util = OWF.Util;

})(window, document);
