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
    'events/EventBus',

    //libs
    'backbone',
    'lodash',
    'jquery'
], function (EventBus, Backbone, _, $) {
    'use strict';

    // Defining the application router, you can attach sub routers here.
    var Router = Backbone.Router.extend({
        routes: {
            '': 'init',
            'guid=:id': 'renderDashboard',
            'perf/:count': 'measurePerformance',
            ':guid': 'index'
        },

        initialize: function (options) {
            this.options = options;

            //anytime a dashboard is switched update the url so it has the dashboard's id
            EventBus.on('dashboard:switched', function (model) {
                if (model && model.get('id')) {
                    this.navigate('guid=' + model.get('id'));
                }
            }, this);
        },

        init: function () {
            EventBus.trigger('app:init');
        },

        renderDashboard: function (id) {
            this.init();
            EventBus.trigger('dashboard:switch', id);
        }
    });

    return Router;

});
