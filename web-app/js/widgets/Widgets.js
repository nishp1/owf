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
 * This file defines functions related to retrieving information
 * about widgets
 */

;(function(OWF, $) {
    'use strict';

    /**
     * @namespace
     */
    OWF.Widgets = $.extend(OWF.Widgets, {
        /**
         * @name findWidgetDefinitions
         * @methodOf OWF.Widgets
         * @description Queries Widget definitions that are available to the current user
         * @param {Object} cfg config object see below for properties
         * @param {Boolean} [cfg.userOnly] boolean flag that determines whether to only return
         *   widgets assigned to the user (excluding widgets to which the user only has access
         *   via their assigned groups)
         * @param {Object} [cfg] object containing search parameters
         * @param {String} [cfg.displayName] name of widget '%' are wildcards
         * @param {String} [cfg.displayNameExactMatch] true or false to match the
         *   name exactly. defaults to false
         * @param {String} [cfg.version] version of widget '%' are wildcards
         * @param {String} [cfg.id] ID of widget '%' are wildcards
         * @param {String} [cfg.universalName] Universal name of widget '%' are
         *   wildcards
         * @param {Function} cfg.onSuccess callback function to capture the success result.
         *   This method is passed an array of objects having the following properties:<br>
         * <ul>
         *   <li>{String} id: The unique id (GUID) of this widget definition
         *   <li>{String} displayName: The Display name (title) of this widget
         *   <li>{String} widgetUrl: The URL from which to load the widget
         *   <li>{String} imageUrlLarge: The widget's large icon URL
         *   <li>{String} imageUrlSmall: The widget's small icon URL
         *   <li>{String} widgetType: The type of the widget. Examples: standard, admin,
         *     marketplace
         *   <li>{String} universalName: The widget's universal name
         *   <li><String> description: The widget's description
         *   <li>{String} descriptorUrl: The URL of the widget's Widget Descriptor
         *   <li>{String} version: The current version of the widget
         *   <li>{Number} height: The default height of the widget
         *   <li>{Number} width: The default width of the widget
         *   <li>{Boolean} background: Whether or not this widget is intended to be a background
         *     widget
         *   <li>{Boolean} singleton: Whether or not this widget is a singleton widget
         *   <li>{Boolean} visibleForLaunch: Whether or not this widget is visible in the launch
         *     menu by default
         *   <li>{Array} sendableIntents: List of objects describing the Intents that this
         *     widget can send
         *   <li>{Array} receivableIntents: List of objects describing the Intents that this
         *     widget can receive
         *   <li>{Array} tags: List of tags given to this widget by default
         *      recursively
         * </ul>
         * @param {Function} [cfg.onFailure] callback to execute if there is an error (optional, a default alert provided).  This callback is called with two parameters: a error message string, and optionally a status code
         * @example
         *
         * var onSuccess = function(widgets) {
         *     if (widgets.length > 0) {
         *         alert(widgets[0].value.namespace);
         *     }
         * };
         *
         * var onFailure = function(error, status) {
         *     alert(error);
         * };
         *
         * Ozone.pref.PrefServer.findWidgets({
         *     onSuccess:onSuccess,
         *     onFailure:onFailure
         * });
         */
        findWidgetDefinitions: function(cfg) {
            var onSuccess = cfg && cfg.onSuccess, onFailure = cfg && cfg.onFailure, args;

            //copy only the supported values from the cfg
            args = OWF.Util.filterAttrs(cfg,
                    ['userOnly', 'displayName', 'displayNameExactMatch', 'version', 'id', 'universalName']);

            return OWF.Comms.sendWithPromise('..',
                OWF.Comms.Constants.FIND_WIDGET_DEFINITIONS_SERVICE_NAME, args)
                .done(onSuccess).fail(onFailure);
        },

        getWidgetDefinition: function(cfg) {
            return OWF.Widgets.findWidgetDefinitions({id: cfg.id})
                .then(function (widgets) {
                    var deferred = new $.Deferred();

                    switch (widgets.length) {
                        case 0:
                            deferred.reject('No widgets found with Id: ' + cfg.id);
                            break;
                        case 1:
                            deferred.resolve(widgets[0]);
                            break;
                        default:
                            deferred.reject('Multiple widgets found with Id: ' + cfg.id);
                    }
                
                    return deferred.promise();
                })
                .done(cfg.onSuccess)
                .fail(cfg.onFailure);
        }

        //TODO Move getOpenedWidgets here
    });

})(window.OWF = window.OWF || {}, window._$);
