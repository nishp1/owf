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
    'handlebars',
    'jquery',
    'bootstrap-editable',
    'bootstrap/bootstrap-tooltip'
], function (View, Handlebars, $) {
    
    'use strict';

    var tpl =
        '<img src="{{icon-src}}" class="header-icon"/>' +
        '<ul class="actions nav">' +
            '{{{btnTemplate}}}' +
            '<li class="close-li">' +
                '<a title="Close" class="close-btn">' +
                    '<i class="icon-remove"></i>' +
                '</a>' +
            '</li>' +
        '</ul>' +
        '<div class="name-content">' +
            '<span class="name">{{name}}</span>' +
        '</div>';

    return View.extend({

        events: {
            'click .close-btn' : 'close'
        },

        modelEvents: {
            'change:name' : 'setName'
        },

        model: null,
        className: 'header',
        template: Handlebars.compile(tpl),
        btnTemplate: '',    //subclasses should override

        $name: null, //Editable name span

        render: function() {
            this.$el.html( this.template(this.createTemplateModel()) );

            this.$name = this.$el.children(".name-content").children("span.name");

            this.initEditable();

            this.initTooltip();

            return this;
        },

        createTemplateModel: function() {
            var templateModel = this.model.toJSON();

            templateModel.btnTemplate = this.btnTemplate;
            
            return templateModel;
        },

        initEditable: function () {
            var me = this;

            // Set up input to edit name on dblclick
            me.$name.editable({
                mode: 'inline',
                type: 'text',
                anim: 0,
                toggle: 'dblclick',
                onblur: 'submit',
                send: 'never',
                showbuttons: false,
                clear: false,
                validate: function(value) {
                    if($.trim(value) === '') {
                        // If trims to blank string don't save
                        me.$name.editable('hide');
                    }
                }
            });

            // On save update the model
            me.$name.on('save', function(e, params) {
                me.model.set('name', params.newValue);
            });

            // When name is dblclicked apply the dashboard mask and listen for
            // clicks on it to hide it and the editable input
            me.$name.dblclick(function(e) {
                // Prevent event from causing the window to maximize
                e.stopPropagation();

                var $dashboardMask = me.$el.parents('div.dashboard').children('.mask'),
                    hideEditable = function() {
                        me.$name.blur();
                    };

                // Show the dashboard mask
                $dashboardMask.removeClass('hide');

                // If mask is clicked hide editable input
                $dashboardMask.one('click', hideEditable);

                // When editable is hidden remove the mask and unregister listener
                me.$name.one('hidden', function() {
                    $dashboardMask.addClass('hide');
                    $dashboardMask.off('click', hideEditable);
                });
            });
        },

        initTooltip: function() {
            var me = this;

            me.$name.tooltip({
                container: $('body'),
                placement: 'top',
                trigger: 'hover',
                animation: false,
                delay: 500,
                title: function() {
                    return me.$name.text();
                }
            });
        },

        // This is called when the model's name is changed for the case
        // where there are multiple headers using the same model, so a
        // name edit in one is updated in the other as well
        setName: function(model, newValue) {
            this.$name.editable('setValue', newValue);
        },

        close: function() {
            this.model.destroy();
        }
    });

});
