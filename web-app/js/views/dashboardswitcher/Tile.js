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
    'views/View',
    'views/dashboardswitcher/Tiles',
    'events/EventBus',
    // Libraries.
    'jquery',
    'lodash',
    'handlebars',
    'moment',
    'bootstrap/bootstrap-tooltip'
],

function(View, Tiles, EventBus, $, _, Handlebars, moment) {

    var tpl =
        '<div class="thumb-wrap">' +
            '<div class="thumb">' +
            '</div>' +
        '</div>' +
        '{{#if isStack}}' +
            '<div class="btn-group">' +
                '<button rel="tooltip" class="btn refresh" tabindex="0" data-original-title="Restore"><span class="icon-refresh"></span></button>' +
                '<button rel="tooltip" class="btn remove" tabindex="0" data-original-title="Delete"><span class="icon-remove"></span></button>' +
            '</div>'+
        '{{else}}' +
            '<div class="btn-group">' +
                '<button rel="tooltip" class="btn share" tabindex="0" data-original-title="Share"><span class="icon-share"></span></button>' +
                '<button rel="tooltip" class="btn refresh" tabindex="0" data-original-title="Restore"><span class="icon-refresh"></span></button>' +
                '<button rel="tooltip" class="btn edit" tabindex="0" data-original-title="Edit"><span class="icon-edit"></span></button>' +
                '<button rel="tooltip" class="btn remove" tabindex="0" data-original-title="Delete"><span class="icon-remove"></span></button>' +
            '</div>'+
        '{{/if}}' +
        '<span class="dashboard-name">{{name}}</span>';


    return View.extend({

        className: function() {
            return (this.model.get('isStack') ? 'stack' : 'dashboard');
        },


        template: Handlebars.compile(tpl),

        modelEvents: {
            'remove': 'remove',
            'destroy': 'remove'
        },

        attributes: function() {
            return {
                'rel': 'popover',
                'tabindex': '0'
            };
        },

        tooltipDelay: { show: 1000, hide: 100 },

        initialize: function () {
            View.prototype.initialize.call(this);
            this.listenTo(this.model.get('switcherItem'), 'change:name', this.render);
            this.listenTo(this.model.get('switcherItem'), 'change:createdBy', this.render);
            this.listenTo(this.model.get('switcherItem'), 'change:lastAccessed', this.render);
            this.listenTo(this.model.get('switcherItem'), 'change:description', this.render);
            this.listenTo(this.model.get('switcherItem'), 'change:groups', this.render);
            this.listenTo(this.model.get('switcherItem'), 'destroy', this.remove);
        },

        name: function () {
            return this.model.get('switcherItem').get('name');
        },
        isStack: function () {
            return this.model.get('isStack');
        },

        render: function() {
            var me = this;

            this.$el
                .empty()
                .html( this.template(this) );

            // Update the tooltip data elements.
            this.$el.attr('data-original-title', this.model.get('switcherItem').get('name'));
            this.$el.attr('data-content',this.getToolTip(this.model));

            return this;
        },

        getToolTip: function(model) {
            var str = '<p class=\'tip-description\'>' + _.escape(model.get('switcherItem').get('description')) +'</p>',
                createdBy,
                lastAccessed;

            if (model.get('isStack')) {
                return str;
            }
            else {
                var groups = model.get('switcherItem').get('groups');

                // If we have groups, display a groups listing in the tooltip.
                if (groups && groups.length > 0) {
                    str += '<p class="group"><strong>Group(s): </strong>' + _.pluck(groups, 'name').join(', ') + '</p>';
                }

                // created by info
                createdBy = model.get('switcherItem').get('createdBy');
                str += '<p class="created-by"><strong>Created by: </strong>' + ( createdBy ? _.escape(createdBy) : '') + '</p>';

                // last modified info
                lastAccessed = model.get('switcherItem').get('lastAccessed');
                str += '<p class="last-updated"><strong>Last Modified: </strong><span class="time">' +( lastAccessed ? moment(lastAccessed).fromNow() : '') + '</span></p>';

                return str;
            }
        },

        remove: function () {
            this.$el.popover('destroy');
            this.$el.find('.btn').tooltip('destroy');
            View.prototype.remove.call(this);
        }
    });
});
