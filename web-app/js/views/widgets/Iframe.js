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
    'comms/Container',
    'backbone',
    'lodash'
], function (View, commsContainer, Backbone, _) {

    'use strict';

    return View.extend({

        model: null,
        tagName: 'iframe',

        className: 'widgetframe',

        attributes: function () {
            var model = this.model,
                    iframeAttrs = null;

            iframeAttrs = commsContainer.getIframeAttributes(model);

            return _.extend({
                'frameborder': 0,
                'role': 'presentation'
            }, iframeAttrs);
        },

        render: function () {
            return this;
        },

        _ensureElement: function () {
            if (!this.el) {
                var attrs = _.extend({}, _.result(this, 'attributes')),
                    tagName = _.result(this, 'tagName'),
                    html = '';

                if (this.id) {
                    attrs.id = _.result(this, 'id');
                }
                if (this.className) {
                    attrs['class'] = _.result(this, 'className');
                }

                //we need to explicitly set the name of an iframe in the html string for ie7, ie7 will refuse to
                //set the name attribute once the element has been created (whether actually bound to the doc or not)
                if (attrs.name) {
                    html = '<' + tagName + ' name="'+ _.escape(attrs.name)+'">';
                    attrs.name = undefined;
                }
                else {
                    html = '<' + tagName + '>';
                }

                var $el = Backbone.$(html).attr(attrs);

                //attach dashboard view based on model's dashboard guid
                var dashboardGuid = this.model.get('dashboardGuid');
                if ( dashboardGuid != null) {
                    $el.data('dashboardGuid',dashboardGuid);
                }

                this.setElement($el, false);
            }
            else {
                this.setElement(_.result(this, 'el'), false);
            }
        }

    });

});
