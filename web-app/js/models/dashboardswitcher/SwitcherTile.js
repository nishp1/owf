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

    var SwitcherTile = Backbone.Model.extend({
        defaults: {
            "id": null,
            "switcherItem": null,
            "isStack": false,
            "children": null
        },

        initialize: function(attributes, options) {
            var me = this;
            // If this is for a dashboard, destroy ourselves when our contained dashboard is removed.
            if (!this.get('isStack') && this.get('switcherItem')) {
                this.listenTo(this.get('switcherItem'), {
                    'remove': function() {
                        me.trigger('destroy', me, me.collection);
                    }
                });
            }
        }
    });

    return SwitcherTile;
});
