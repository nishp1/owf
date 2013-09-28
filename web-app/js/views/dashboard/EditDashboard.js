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
    'views/Modal',

    // Libraries.
    'jquery',
    'handlebars',
    'lodash',
    'bootstrap/bootstrap-modal',
    'select2'
],

function(Modal, $, Handlebars, _) {

    var nameErrorMessage = 'Name is required!';

    return Modal.extend({

        id: 'edit-dashboard-window',

        title: 'Edit Dashboard',

        // jQuery wrapped form instance
        $form: null,

        template:   Handlebars.compile(
                        '<form class="form-horizontal">' +
                            '<div class="control-group">' + 
                                '<label class="control-label" for="name">Name</label>' + 
                                '<div class="controls">' + 
                                    '<input type="text" class="name" placeholder="Dashboard name..." value="{{name}}" tabindex="0">' + 
                                '</div>' + 
                            '</div>' + 
                            '<div class="control-group">' + 
                                '<label class="control-label" for="description">Description</label>' + 
                                '<div class="controls">' + 
                                    '<textarea rows="3" class="description" placeholder="Dashboard description..." tabindex="0">{{description}}</textarea>' + 
                                '</div>' + 
                            '</div>' +
                        '</form>'
                    ),
        
        events: _.extend({}, Modal.prototype.events, {
            'focusout .name': '_onNameChange'
        }),

        name: function () {
            return this.model && this.model.get('name');
        },

        description: function () {
            return this.model && this.model.get('description');
        },

        render: function () {
            Modal.prototype.render.call(this);

            this.$form = $( this.template(this) );
            this.$body.html( this.$form );

            return this;
        },

        remove: function () {
            this.tearDownCircularFocus();
            Modal.prototype.remove.call(this);
        },

        isFormValid: function () {
            return (this.$form.find('.error').length === 0);
        },

        ok: function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            
            if( this.isFormValid() ) {
                this.model.set({
                    name: this.$form.find('.name').val(),
                    description: this.$form.find('.description').val()
                });

                this._deferred.resolve(this.model);
            }
        },

        edit: function() {
            this._deferred = $.Deferred();
            return this._deferred.promise();
        },

        showErrorMsg: function (input, msg) {
            var $input = $(input),
                $helpBlock = $input.siblings('.help-block'),
                $controlGroup = $input.parents('.control-group');

            // if an error is found, replace it.
            if( $helpBlock[0] ) {
                $helpBlock.html(msg);
            }
            else {
                $helpBlock = $('<span class="help-block">' + msg + '</span>');
                $input.after( $helpBlock );
            }
            $controlGroup.addClass( 'error' );
        },

        hideErrorMsg: function (input) {
            var $input = $(input);

            $input.parents('.control-group').removeClass('error');
            $input.siblings('.help-block').remove();
        },

        _onNameChange: function (evt) {
            var $name = $(evt.currentTarget);

            if(!$name.val()) {
                this.showErrorMsg($name, nameErrorMessage);
            }
            else {
                this.hideErrorMsg($name);
            }
        },

        onShown: function () {
            var me = this;

            me.initCircularFocus();

            // IE7 needs it
            setTimeout(function () {
                me.focus();
            }, 0);
        }
    });
});
