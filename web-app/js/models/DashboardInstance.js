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

define([
    'backbone',
    'models/Dashboard',

    'lodash'
],

function(Backbone, Dashboard, _) {
    'use strict';

    var DashboardInstance = Dashboard.extend({

        urlRoot: '/ozp/rest/owf/persons/me/dashboard-instances',

        fields: [
            "name",
            "description",
            "position",
            "created",
            "lastModified",
            "createdBy",
            "lastModifiedBy",
            "layoutConfig",
            "floatingWidgets",
            "backgroundWidgets",
            "lastAccessed",
            "dashboardTemplate"
        ],

        defaults: function() {
            return _.extend({}, Dashboard.prototype.defaults.call(this), {
                name: 'Untitled',
                dashboardTemplate: null
            });
        },

        initialize: function () {
            Dashboard.prototype.initialize.apply(this, arguments);
            
            var lastAccessed = this.get('lastAccessed');
            if(_.isString(lastAccessed)) {
                this.set('lastAccessed', new Date(lastAccessed));
            }
        },

        restore: function (options) {
            options = options || {};
            options.url = this.urlRoot + '/' + this.get('id') + '/restore';
            var success = options.success;
            options.success = function(model, resp, options) {
                var parsedResp = model.parse(resp);
                model.set(model.parse(resp));
                if (success) {
                    success(model, resp, options);
                }
            };
            this.sync('update', this, options);
        }

    });

    return DashboardInstance;

});
