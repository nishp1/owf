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
 * about dashboards 
 */

;(function(OWF, $) {
    'use strict';

    /**
     * @namespace
     */
    OWF.Dashboards = $.extend(OWF.Dashboards, {
        /**
         * @name getAllDashboards
         * @methodOf OWF.Dashboards
         * Allows a widget to get information on
         * the various dashboards that are available
         * to the current user.
         *
         * @param {Function}cfg.onSuccess A callback to call when
         * the dashboard data successfully comes back
         * This method is passed an array of objects with the following properties:
         * <dl>
         *  <dt>name</dt><dd>The name of the dashboard</dd>
         *  <dt>description</dt><dd>The dashboard's descriptions</dd>
         *  <dt>position</dt><dd>The index of this dashboard relative to other dashboards</dd>
         *  <dt>created</dt><dd>The timestamp for when this dashboard was created</dd>
         *  <dt>lastModified</dt><dd>The timestamp for when this dashboard was last modified</dd>
         *  <dt>createdBy</dt><dd>The user who created this dashboard</dd>
         *  <dt>lastModifiedBy</dt><dd>The user who last modified this dashboard</dd>
         *  <dt>layoutConfig</dt>
         *  <dd>The JavaScript object describing the layout of this dashboard</dd>
         *  <dt>floatingWidgets</dt>
         *  <dd>Array containing the floating widgets for this dashboard</dd>
         *  <dt>backgroundWidgets</dt>
         *  <dd>Array containing background widgets for this dashboard</dd>
         *  <dt>isLocked</dt><dd>Whether or not this dashboard is locked</dd>
         *  <dt>lastAccessed</dt><dd>Timestamp for this dashboard's last access time</dd>
         * </dl>
         *
         * @param {Function}cfg.onFailure A callback to call when the
         * dashboard data cannot be retrieved
         *
         * @return A promise object for attaching additional callbacks
         */
        getAllDashboards: function(cfg) {
            return OWF.Comms.sendWithPromise('..', 
                OWF.Comms.Constants.GET_ALL_DASHBOARDS_SERVICE_NAME)
                .done(cfg && cfg.onSuccess)
                .fail(cfg && cfg.onFailure);
        },

        /**
         * @name getDashboard
         * @methodOf OWF.Dashboards
         * Convenience method that allows a widget to get information about
         * a specific dashboard
         *
         * @param {String} cfg.id The Id of the dashboard to retrieve
         * @param {Function}cfg.onSuccess A callback to call when
         * the dashboard data successfully comes back
         * This method is passed an object with the following properties:
         * <dl>
         *  <dt>name</dt><dd>The name of the dashboard</dd>
         *  <dt>description</dt><dd>The dashboard's descriptions</dd>
         *  <dt>position</dt><dd>The index of this dashboard relative to other dashboards</dd>
         *  <dt>created</dt><dd>The timestamp for when this dashboard was created</dd>
         *  <dt>lastModified</dt><dd>The timestamp for when this dashboard was last modified</dd>
         *  <dt>createdBy</dt><dd>The user who created this dashboard</dd>
         *  <dt>lastModifiedBy</dt><dd>The user who last modified this dashboard</dd>
         *  <dt>layoutConfig</dt>
         *  <dd>The JavaScript object describing the layout of this dashboard</dd>
         *  <dt>floatingWidgets</dt>
         *  <dd>Array containing the floating widgets for this dashboard</dd>
         *  <dt>backgroundWidgets</dt>
         *  <dd>Array containing background widgets for this dashboard</dd>
         *  <dt>isLocked</dt><dd>Whether or not this dashboard is locked</dd>
         *  <dt>lastAccessed</dt><dd>Timestamp for this dashboard's last access time</dd>
         * </dl>
         *
         * @param {Function}cfg.onFailure A callback to call when the
         * dashboard data cannot be retrieved or does not exist. This method is
         * passed an error string
         *
         * @return A promise object for attaching additional callbacks
         */
        getDashboard: function(cfg) {
            return OWF.Dashboards.getAllDashboards()
                .then(function(dashboards) {
                    var deferred = new $.Deferred(),
                        dash;
                    
                    dash = $.grep(dashboards, function(dashboard) {
                        return dashboard.id === cfg.id;
                    })[0];

                    if (dash) {
                        deferred.resolve(dash);
                    }
                    else {
                        deferred.reject("No matching dashboard found");
                    }

                    return deferred.promise();
                })
                .done(cfg && cfg.onSuccess)
                .fail(cfg && cfg.onFailure);
        }
    });
})(window.OWF = window.OWF || {}, window._$);
