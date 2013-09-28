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
    'views/widgets/PanelHeader',
    'views/widgets/Iframe',
    'mixins/widgets/WidgetControl',
    'jquery',
    'lodash',
    'backbone'
], function (View, PanelHeader, Iframe, WidgetControl, $, _, Backbone) {
    
    'use strict';

    return View.extend(_.extend({}, WidgetControl, {

        model: null,
        className: 'widget panel',

        HeaderClass: PanelHeader,    //subclassses can override to get different headers

        initialize: function () {
            View.prototype.initialize.apply(this, arguments);
            WidgetControl.initialize.apply(this, arguments);

            this.containment = this.options.containment || $(document.body);

        },

        render: function() {
            this.header = new this.HeaderClass({ model: this.model });
            this.iframe = new Iframe({ model: this.model });

            this.$body = $('<div class="body"></div>')
                            .html( this.iframe.render().el );

            this.$el
                .append( this.header.render().el )
                .append( this.$body );

            return this;
        },

        mask: function() {
            $('#mask').removeClass('hide');
        },

        unmask: function() {
            $('#mask').addClass('hide');
        }
    }));
});
