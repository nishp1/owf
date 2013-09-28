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

    var SuperClass = View,
        tpl =
            '<div class="thumb-wrap">' +
                '<img class="thumb" src="{{image}}"/>' +
            '</div>' +
            '<span class="widget-name">{{name}}</span>';

    return SuperClass.extend({
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
                'data-title': this.model.name(),
                'data-content': this.model.description() || 'No description found!',
                'tabIndex': '0'
            };
            return retVal;
        },

        data: function () {
            return {
                name: this.model.name(),
                image: this.model.largeImage()
            };
        },

        render: function () {
            var me = this;

            this.$el.html(this.template(this.data()));

            //attach error handler to use the default image if needed
            this.$_thumb = this.$el.find('.thumb').on('error', function() {
                //chrome needs this to be in setTimeout or the default image won't render
                var el = this;
                setTimeout(function() {
                    el.src = me.defaultImageUrl;
                }, 0);
            });

            return this;
        },

        remove: function () {
            this.$_thumb.off();
            return SuperClass.prototype.remove.call(this);
        }

    });

});
