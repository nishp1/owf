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
 * Logic for widget state based on model changes is identical between widget panels 
 * and Taskbar Headers.  Therefore that logic is separated out here
 */
define([

], function() {
    'use strict';

    return {
        events: {
            'mousedown': 'activateWidget'
        },

        modelEvents: {
            'change:active': 'updateActive',
            'change:maximized': 'updateMaximize',
            'change:minimized': 'updateMinimize',
            'change:collapsed': 'updateCollapse',
            'destroy': 'remove'
        },

        initialize: function() {
            this.updateActive();
            this.updateMinimize();
            this.updateMaximize();
            this.updateCollapse();
        },

        updateMinimize: function() {
            this.$el[this.model.get('minimized') ? 'addClass' : 'removeClass']('minimized');
        },

        updateMaximize: function() {
            this.$el[this.model.get('maximized') ? 'addClass' : 'removeClass']('maximized');
        },

        updateCollapse: function() {
            this.$el[this.model.get('collapsed') ? 'addClass' : 'removeClass']('collapsed');
        },

        updateActive: function() {
            this.$el[this.model.get('active') ? 'addClass' : 'removeClass']('active');

            if (this.model.get('active')) {
                this.model.set('minimized', false);
            }
        },

        activateWidget: function() {
            this.model.set('active', true);
        }
    };
});
