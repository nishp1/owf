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
    // Libraries.
    'jquery',
    'lodash',
    'handlebars',
    'moment',
    'bootstrap/bootstrap-tooltip'
], function (View, $, _, Handlebars, moment) {
    'use strict';

    var tpl =
            '<div class="thumb-wrap">' +
                '<img class="thumb" src="{{image}}"/>' +
            '</div>' +
            '<span class="widget-name">{{name}}</span>';

    return View.extend({
        vtype: 'widgetTile',
        className: 'widgetTile',
        template: Handlebars.compile(tpl),

        tooltipDelay: { show: 1000, hide: 100 },

        defaultImageUrl: 'themes/common/images/settings/WidgetsIcon.png',

        modelEvents: {
            'change': 'render',
            'remove': 'remove',
            'destroy': 'remove'
        },

        attributes: function () {
            var retVal = {
                'rel': 'popover',
                'data-title': this.model.get('displayName'),
                'data-content': this.model.get('description') || 'Widget description ...',
                'tabIndex': '0'
            };
            return retVal;
        },

        initialize: function () {
            View.prototype.initialize.call(this);
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            var me = this;

            this.$el
                .empty()
                .html(this.template({
                    //todo add ellipse behavior for the name
                    name: function() {
                        return me.model.get('name') || me.model.get('displayName');
                    },
                    image: me.model.get('imageUrlLarge')
                }));

            //attach error handler to use the default image if needed
            this.$el.find('thumb-wrap, img.thumb').one('error', function() {
                //chrome needs this to be in setTimeout or the default image won't render
                var el = this;
                setTimeout(function() {
                    el.src = me.defaultImageUrl;
                }, 0);
            });

            return this;
        }

    });

});
