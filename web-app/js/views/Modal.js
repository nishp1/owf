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
    'events/EventBus',
    'mixins/CircularFocus',
    'jquery',
    'lodash',
    'handlebars',
    'bootstrap/bootstrap-modal',
    'bgiframe'
],

function(View, EventBus, CircularFocus, $, _, Handlebars) {
    'use strict';

    var killEvent = function (e) { return false; };
    var template =   Handlebars.compile(
                        '{{#if title}}' + 
                            '<div class="modal-header">' + 
                                '{{#if closable}}' + 
                                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" tabindex="-1">&times;</button>' +
                                '{{/if}}' + 
                                '<h4>{{title}}</h4>' +
                            '</div>' +
                        '{{/if}}' +

                        '<div class="modal-body">{{content}}</div>' +

                        '{{#if footer}}' + 
                            '<div class="modal-footer">' +
                                '{{#if cancelText}}' + 
                                    '<button data-dismiss="modal" class="btn {{cancelClassName}} cancel">{{cancelText}}</button>' +
                                '{{/if}}' + 
                                '<button class="btn {{okClassName}} ok">{{okText}}</button>' +
                            '</div>' +
                        '{{/if}}'
                    );

    /**
     * Bootstrap Modal wrapper for use with Backbone
     *
     * Events:
     * shown: Fired when the modal has finished animating in
     * hidden: Fired when the modal has finished animating out
     */
    var ModalView = View.extend(_.extend({}, CircularFocus, {

        className: 'modal hide',

        // let scripts enforce focus on the modal element so it may receive
        // key events i.e. 'esc' to close
        attributes: {
            'tabindex' : '-1'
        },

        events:  {
            'click .cancel': 'cancel',
            'click .ok': 'ok'
        },

        defaults: {
            useShims: false,
            title: false,
            closable: true,
            escape: true,
            backdrop: true,
            removeOnClose: true,
            footer: true,
            okText: 'OK',
            okClassName: 'btn-primary',
            cancelText: 'Cancel',
            cancelClassName: '',
            animate: true,
            onShow: $.noop,
            onShown: $.noop,
            onHide: $.noop,
            onHidden: $.noop,
            ok: killEvent,
            cancel: killEvent
        },

        /**
         * Creates an instance of a Bootstrap Modal
         *
         * @see http://twitter.github.com/bootstrap/javascript.html#modals
         *
         * @param {Object} options
         * @param {String} [options.title]              Title. Default: none
         * @param {String|Method} [options.content]     Modal content. Default: none
         * @param {String|Method} [options.closable]    'X' button in the header. Default: true

         * @param {Boolean} [options.escape]            Closes the modal when escape key is pressed. Default: true
         * @param {String} [options.backdrop]           Includes a modal-backdrop element. Alternatively, specify static for a backdrop which doesn't close the modal on click. Default: true
         * @param {String} [options.removeOnClose]      Remove view from DOM on close. Default: false

         * @param {String} [options.footer]             Whether to show footer. Default: true
         * @param {String} [options.okText]             Text for the OK button. Default: 'OK'
         * @param {String} [options.cancelText]         Text for the cancel button. Default: 'Cancel'. If passed a falsey value, the button will not be shown.
         
         * @param {Boolean} [options.animate]           Animates modal. Default: true
         * @param {Boolean} [options.onShow]            Callback to execute when show method is called
         * @param {Boolean} [options.onShown]           Callback to execute when modal is shown
         * @param {Boolean} [options.onHide]            Callback to execute when hide method is called
         * @param {Boolean} [options.onHidden]          Callback to execute when modal is hidden
         * @param {Boolean} [options.ok]                Callback to execute when ok is pressed
         * @param {Boolean} [options.cancel]            Callback to execute when cancel is pressed
         */
        initialize: function () {
            View.prototype.initialize.apply(this, arguments);

            var me = this,
                options = _.extend({}, ModalView.prototype.defaults, this.options);

            // fill in falsy values in `this` with options
            _.defaults(this, options);

            this.animate && this.$el.addClass('fade');

            this.$el
                .on('show.' + this.cid, function(e) {
                    if(e.target === me.el) {
                        me.onShow.apply(me, arguments);
                    }
                })
                .on('shown.' + this.cid, function(e) {
                    if(e.target === me.el) {
                        me.onShown.apply(me, arguments);
                    }
                })
                .on('hide.' + this.cid, function(e) {
                    if(e.target === me.el) {
                        me.onHide.apply(me, arguments);
                    }
                })
                .on('hidden.' + this.cid, function(e) {
                    if(e.target === me.el) {
                        me.onHidden.apply(me, arguments);
                        EventBus.trigger('modal:hidden');
                        me.removeOnClose && me.remove();
                    }
                });
        },
        
        render: function () {
            this.$el.html( template(this) );
            this.$body = this.$el.children( '.modal-body' );
            this.isRendered = true;
            
            return this;
        },

        isVisible: function() {
            return this.$el.is(':visible');
        },

        toggleVisible: function() {
            if(this.isVisible()) {
                return this.hide();
            } else {
                return this.show();
            }
        },

        css: function () {
            var returnValue = View.prototype.css.apply(this, arguments);
            this._shim();
            return returnValue;
        },

        center: function () {
            this.css('margin-left', (this.$el.outerWidth() / 2) * -1);
        },

        /*
         * Show window. If render is not called before, view is added to body.
         */
        show: function (options) {
            var me = this,
                dfd = $.Deferred(),
                $modal = $('.modal:visible');

            // Check if another modal is active
            if ($modal.length && $modal[0].id != this.id) {
                // TODO track a shared activeModal variable instead of hitting the dom
//            if (ModalView.activeModal && ModalView.activeModal.id != me.id) {
                // Cannot show modal because another is active. Reject deferred and return
                return dfd.reject().promise();
            }

            if(!this.isRendered) {
                $(document.body).append(this.render().el);
            }

            this.$el.one('shown', function () {
                me._shim();
                dfd.resolve();
            }).modal({
                show: true,
                keyboard: this.escape,
                backdrop: this.backdrop
            });

            return dfd.promise();
        },

        /*
         * Hide window.
         */
        hide: function () {
            var dfd = $.Deferred();

            if(this.$el.is(':visible')) {
                this.$el.one('hidden', function () {
                    dfd.resolve();
                }).modal('hide');
            }
            else {
                return dfd.resolve().promise();
            }

            return dfd.promise();
        },

        remove: function (animate) {
            // remove hidden and show events
            this.$el.off('.' + this.cid);
            this.tearDownCircularFocus();
            View.prototype.remove.call(this);
        },

        _shim: function () {
            if(this.useShims) {
                this.$el.bgiframe();
            }
        }

    }));

    return ModalView;
});
