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

// require.js configuration for application.
require.config({

    baseUrl: 'js/',

    //need this to be true to handle errors in IE
    enforceDefine: true,

    paths: {
        'bootstrap': '../libs/js/bootstrap',
        'jqueryui': '../libs/development-bundle/ui',
        // alias versioned dependencies to simplify updating as new versions are released
        'jquery': '../libs/js/jquery',
        'lodash': '../libs/js/lodash',
        'backbone': '../libs/js/backbone',
        'backbone.declarative.views': '../libs/js/backbone.declarative.views',
        'handlebars': '../libs/js/handlebars',
        'modernizr': '../libs/js/modernizr',
        'jquery-pnotify': '../libs/js/jquery.pnotify',
        'jquery-splitter': '../libs/js/jquery-splitter',
        'bootstrap-editable': '../libs/js/bootstrap-editable',
        'bootstrap-notify': '../libs/js/bootstrap-notify',
        'moment': '../libs/js/moment',
        'select2': '../libs/js/select2',
        'gadgets': '../libs/js/shindig',
        'jwerty': '../libs/js/jwerty',
        'jquery-wnt': '../libs/js/jquery-wnt',
        'bgiframe': '../libs/js/bgiframe'
    },

    shim: {
        'jquery': {
            exports: '$'
        },
        'lodash': {
            exports: '_'
        },
        'backbone': {
            deps: ['lodash', 'jquery'],
            exports: 'Backbone'
        },
        'backbone.declarative.views': {
            deps: ['lodash', 'backbone'],
            exports: 'Backbone'
        },
        'modernizr': {
            exports: 'Modernizr'
        },
        'handlebars': {
            exports: 'Handlebars'
        },
        'moment': {
            exports: 'moment'
        },
        'bootstrap/bootstrap-transition': {
            deps: ['jquery'],
            exports: '$'
        },
        'bootstrap/bootstrap-modal': {
            deps: ['jquery', 'bootstrap/bootstrap-transition'],
            exports: '$'
        },
        'bootstrap/bootstrap-tooltip': {
            deps: ['jquery', 'bootstrap/bootstrap-transition'],
            exports: '$'
        },
        'bootstrap/bootstrap-popover': {
            deps: ['jquery', 'bootstrap/bootstrap-transition', 'bootstrap/bootstrap-tooltip'],
            exports: '$'
        },
        'bootstrap/bootstrap-alert': {
            deps: ['jquery'],
            exports: '$'
        },
        'bootstrap-editable': {
            deps: ['jquery', 'bootstrap/bootstrap-transition', 'bootstrap/bootstrap-tooltip', 'bootstrap/bootstrap-popover'],
            exports: '$'
        },
        'bootstrap-modal': {
            deps: ['jquery', 'bootstrap/bootstrap-modal'],
            exports: '$'
        },
        'bootstrap-notify': {
            deps: ['jquery', 'bootstrap/bootstrap-alert'],
            exports: '$'
        },
        'jqueryui/jquery.ui.core': {
            deps: ['jquery'],
            exports: '$'
        },
        'jqueryui/jquery.ui.widget': {
            deps: ['jqueryui/jquery.ui.core'],
            exports: '$'
        },
        'jqueryui/jquery.ui.mouse': {
            deps: ['jqueryui/jquery.ui.widget'],
            exports: '$'
        },
        'jqueryui/jquery.ui.position': {
            deps: ['jqueryui/jquery.ui.mouse'],
            exports: '$'
        },
        'jqueryui/jquery.ui.draggable': {
            deps: ['jquery', 'jqueryui/jquery.ui.core', 'jqueryui/jquery.ui.widget',
                   'jqueryui/jquery.ui.mouse'],
            exports: '$'
        },
        'jqueryui/jquery.ui.droppable': {
            deps: ['jqueryui/jquery.ui.draggable'],
            exports: '$'
        },
        'jqueryui/jquery.ui.sortable': {
            deps: ['jquery', 'jqueryui/jquery.ui.core', 'jqueryui/jquery.ui.widget',
                   'jqueryui/jquery.ui.mouse'],
            exports: '$'
        },
        'jqueryui/jquery.ui.resizable': {
            deps: ['jquery', 'jqueryui/jquery.ui.core', 'jqueryui/jquery.ui.widget',
                   'jqueryui/jquery.ui.mouse'],
            exports: '$'
        },
        'jqueryui/jquery.ui.selectable': {
            deps: ['jquery', 'jqueryui/jquery.ui.core', 'jqueryui/jquery.ui.widget',
                   'jqueryui/jquery.ui.mouse'],
            exports: '$'
        },
        'jquery-splitter': {
            deps: ['jquery'],
            exports: '$'
        },
        'select2': {
            deps: ['jquery'],
            exports: '$'
        },
        'gadgets/json': {
            exports: 'gadgets'
        },
        'gadgets/util': {
            exports: 'gadgets'
        },
        'gadgets/rpc': {
            deps: ['gadgets/json', 'gadgets/util'],
            exports: 'gadgets'
        },
        'gadgets/pubsub': {
            deps: ['gadgets/rpc'],
            exports: 'gadgets'
        },
        'gadgets/pubsub_router': {
            deps: ['gadgets/rpc'],
            exports: 'gadgets'
        },
        'jwerty': {
            deps: ['jquery'],
            exports: 'jwerty'
        },
        'jquery-wnt': {
            deps: ['jquery'],
            exports: '$'
        },
        'bgiframe': {
            deps: ['jquery'],
            exports: '$'
        }
    }

});

// Initialize the application with the main application file.  A define call needs to be here because enforceDefine is
// true
define([
    'app'
], function(app) {

});
