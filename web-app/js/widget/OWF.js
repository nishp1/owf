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
;(function (window, document, $, undefined) {
    'use strict';

    /**
     * @ignore
     */
    var OWF = window.OWF = window.OWF || {};
    var Ozone = window.Ozone = window.Ozone || {};
    var isReady = false,
        readyList = [],
        widget = OWF.Util.parseWindowNameData();

    $.extend(OWF, /** @lends OWF */ {
        /**
         Accepts a function that is executed when Ozone APIs are ready for use
         @param {Function} handler Function to execute when OWF APIs are ready
         @param {Object} scope The scope (this reference) in which the function is executed. If omitted, defaults to the browser window.
         */
        ready: function (handler, scope) {

            if (handler === undefined) {
                throw 'Error: no arguments passed';
            }

            if (typeof handler !== 'function') {
                throw 'Error: handler must be a function';
            }

            isReady === true ? handler.call(scope) : readyList.push({fn: handler, scope: scope});

        },

        /**
         * This function should be called once the widget is ready and all initialization is completed.  This will send a
         * message to the container which in turn may notify other widgets
         */
        notifyWidgetReady: function () {
            //send a message to container that this widget is ready
            OWF.Comms.send('..', OWF.Comms.Constants.WIDGET_READY_SERVICE_NAME, null, OWF.getInstanceId());
        },

        /**
         Returns definition GUID of the widget. This is auto generated by OWF when the widget was brought in an OWF instance.
         */
        getWidgetGuid: function () {
            return widget.guid;
        },

        /**
         Returns instance GUID of the widget.
         */
        getInstanceId: function () {
            return widget.id;
        },

        /**
         * @description Returns the Widget Id
         * @returns {String} The widgetId is a complex JSON encoded string which identifies a widget for Eventing.
         *   Embedded in this string is the widget's uniqueId as the 'id' attribute.  There is other data is in the string
         *   which is needed for Eventing and other APIs to function properly. This complex widgetId string may be used in
         *   the <a href="./OWF.Eventing.html#.publish">OWF.Eventing.publish</a> function to designate a specific recipient for a message.
         *   Additionally, once subscribed to a channel via <a href="./OWF.Eventing.html#.subscribe">OWF.Eventing.subscribe</a> during the
         *   receipt of a message, the sender's widgetId is made available as the first argument to the handler function.
         * @example
         * //decode and retrieve the widget's unique id
         * var complexIdString = OWF.getIframeId();
         * var complexIdObj = JSON.parse(complexIdString);
         *
         * //complexIdObj will look like
         * // {
        * //  //widget's uniqueId
        * //  id: <id>
        * // }
         *
         * //get Widget's uniqueId
         * alert('widget id = ' + complexIdObj.id);
         */
        getIframeId: function () {
            return '{\"id\":\"' + widget.id + '\"}';
        },

        /**
         * @deprecated
         * Returns type of dashboard in which the widget is opened. [portal, desktop, accordion, tabbed]
         */
        getDashboardLayout: function () {
            return widget.layout;
        },

        /**
         Returns version of the widget.
         */
        getVersion: function () {
            return widget.version;
        },

        /**
         Returns URL of the widget.
         */
        getUrl: function () {
            return widget.url;
        },

        /**
         Returns an object containing information on the current OWF theme
         @returns {Object} Returns an object below: <br>
         { <br>
             //name of the theme <br>
             themeName: 'theme-name', <br>
             <br>
             //describes color contrast of the theme.  This may be one of 3 values: <br>
             // 'standard' (colors provide no special contrast) <br>
             // 'black-on-white' (black on white color contrast) <br>
             // 'white-on-black' (white on black color contrast) <br>
             themeContrast: 'black-on-white', <br>
             <br>
             //this field is a number of the fontSize in pixels <br>
             themeFontSize: 12 <br>
         }
         @example
         var themeObj = OWF.getCurrentTheme();
         */
        getCurrentTheme: function () {
            return widget.currentTheme;
        },

        /**
         Returns the name of the Container the Widget is in
         */
        getContainerName: function () {
            return widget.containerName;
        },

        /**
         Returns the version of the Container the Widget is in
         */
        getContainerVersion: function () {
            return widget.containerVersion;
        },

        /**
         Returns whether or not the dashboard in which the widget is opened is locked.
         */
        isDashboardLocked: function () {
            return widget.locked;
        },

        /**
         Returns the URL of the Container the Widget is in
         */
        getContainerUrl: function () {
            //figure out from preference location
            var pref = widget.preferenceLocation;
            return pref.substring(0, pref.length - 6);
        },

        /**
         Gets all opened widgets on the current dashboard.

         @param {Function} callback function to execute when opened widgets are retrieved from OWF. Function is passed an array of objects with the structure below: <br>
         {<br>
             id: 'instance guid of widget',<br>
             frameId: 'iframe id of widget',<br>
             widgetGuid: 'widget guid of the widget',<br>
             url: 'url of the widget',<br>
             name: 'name of the widget'<br>
             universalName: 'universal name of the widget'<br>
         }<br>
         @example
         OWF.getOpenedWidgets(function(openedWidgets) {

                  });
         */
        getOpenedWidgets: function (fn) {

            if (fn === undefined) {
                throw 'Error: no arguments passed';
            }

            if (typeof fn !== 'function') {
                throw 'Error: fn must be a function';
            }

            Ozone.eventing.getAllWidgets(fn);
        },

        /**
         * @name getCurrentUser
         * @methodOf OWF
         * @description retrieves the current user logged into the system
         * @param {Object} cfg config object see below for properties
         * @param {Function} cfg.onSuccess The callback function that is called for a successful 
         * retrieval of the user logged in.
         * This method is passed an object having the following properties:<br>
         * <br>
         *     {String} username: user name<br>
         *     {String} fullName: user real name<br>
         *     {String} lastLogin: last login date<br>
         *     {String} prevLogin: previous login date (date of the login before the lastLogin)<br>
         * <br>
         * @param {Function} cfg.[onFailure] A callback function that is called when the system 
         * is unable to retrieve the current user logged in. Callback parameter is an object
         * with the following properties<br>
         * <br>
         *     {String} responseText: The text indicating the reason for failure<br>
         *     {Number} status: The http status code of the attempt to retrieve the user<br>
         * <br>
         * @example
         *
         * var onSuccess = function(user) {
         *     if (user) {
         *         alert(user.fullName);
         *     }
         * };
         *
         * var onFailure = function(error) {
         *     alert(error.responseText);
         * };
         *
         * Ozone.pref.PrefServer.getCurrentUser({
         *     onSuccess:onSuccess,
         *     onFailure:onFailure
         * });
         */
        getCurrentUser: (function() {
            //cache the promise for future calls
            var currentUserPromise;

            //the actual getCurrentUser function
            function getCurrentUser(cfg) {
                if (!currentUserPromise) {
                    currentUserPromise = OWF.Comms.sendWithPromise('..', 
                        OWF.Comms.Constants.GET_CURRENT_USER_SERVICE_NAME);
                }

                return currentUserPromise
                    .done(cfg && cfg.onSuccess)
                    .fail(cfg && cfg.onFailure);
            }

            /**
             * Remove the reference to the cached promise, forcing the
             * function to refetch the user information.  
             *
             * This function exists solely to allow the unit tests
             * to clear the promise in between tests, and should not be
             * used in other contexts.
             */
            getCurrentUser.__clearCachedPromise = function() {
                currentUserPromise = undefined;
            };

            return getCurrentUser;
        })()
    });

    // for backwards compatibility
    Ozone.Widget = OWF;

    if (!OWF.disableWidgetInit) {

        $(document).ready(function () {

            //calc pageload time
            OWF.Util.pageLoad.afterLoad = (new Date()).getTime();
            OWF.Util.pageLoad.calcLoadTime();

            if (OWF.Util.isInContainer()) {

                //set relay file for backwards compatibility
                if (Ozone.eventing.Widget.widgetRelayURL != null) {
                    OWF.relayFile = Ozone.eventing.Widget.widgetRelayURL;
                }

                //initialize eventing
                OWF.Comms.Widget.init().then(function () {
                    //initialize any other apis that are dependent on eventing

                    // execute ready listeners
                    isReady = true;
                    for (var i = 0, len = readyList.length; i < len; i++) {
                        readyList[i].fn.call(readyList[i].scope);
                    }

                });

            }

        });
    }
})(window, document, window._$);
