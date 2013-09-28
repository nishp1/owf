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
    'jquery',
    'lodash',
    'services/KeyboardManager',
    'backbone.declarative.views'
],

function(Backbone, $, _, KeyboardManager) {

    var keynavEventRegex = /(\S+\(.*\))(.*)/;

    var View = Backbone.View.extend({

        //events that will be bound to the model or collection.
        //Syntax is similar to the 'events' property
        modelEvents: null,

        // array of events that will be relayed to a view instance from $el
        relayElEvents: null,

        // A map of keyboard events and functions. These key combinations fire when this view
        // is in focus
        // e.g. { 'keyup(alt+shift+H)': 'showHelp' }
        // e.g. { 'keyup(alt+shift+a) > .cssClass': 'doSomething' }
        keynavEvents: null,

        initialize: function() {
            var me = this;

            _.extend(me, _.pick(me.options, 'modelEvents', 'relayElEvents', 'keynavEvents'));

            // Store reference to the view instance, for easy retrieval of Backbone views from DOM Elements 
            me.$el.data('view', me);
            if (me.modelEvents) {
                me._prepareEventsProperty('modelEvents');

                if (me.model) {
                    me.listenTo(me.model, me.modelEvents);
                }
                if (me.collection) {
                    me.listenTo(me.collection, me.modelEvents);
                }
            }

            if(me.relayElEvents) {
                _( _.result(this, 'relayElEvents') ).each(function (eventName, index) {
                    me.$el.on(eventName + '.relayElEvents' + this.cid, function () {
                        me.trigger(eventName, arguments);
                    });
                });
            }


            if(me.keynavEvents) {
                me._prepareEventsProperty('keynavEvents');
                _.forOwn(me.keynavEvents, function (callback, event) {
                    var parsed = keynavEventRegex.exec(event),
                        keynav, selector;
                    
                    if(parsed) {
                        keynav = parsed[1];
                        selector = parsed[2];
                    }
                    
                    KeyboardManager.on(me.$el, keynav + '.keynavEvents', selector, callback);
                });
            }

            Backbone.View.prototype.initialize.apply(me, arguments);
        },
        
        css: function () {
            return this.$el.css.apply(this.$el, arguments);
        },

        show: function() {
            var dfd = $.Deferred();
            this.$el.css('display', '');
            this.trigger('show');

            return dfd.resolve().promise();
        },

        hide: function () {
            var dfd = $.Deferred();
            this.$el.css('display', 'none');
            this.trigger('hide');

            return dfd.resolve().promise();
        },

        /*
        * Focuses first focusable element unless a CSS selector is passed.
        */
        
        focus: function (selector) {
            if (selector) {
                this.$(selector).focus();
            }
            else if(this.$el.attr('tabindex') >= 0) {
                this.$el.focus();
            }
            else {
                this.$focusables().first().focus();
            }
            return this;    
        },

        /*
        * Returns all focusable elements.
        */
        $focusables: function () {
            return this.$el.find(View.FOCUSABLE_ELEMENTS_SELECTOR).not('[tabindex="-1"]');
        },

        remove: function() {
            if (this.isRendered) {
                this.trigger('remove', this);
            }

            // Manually remove all this.on() handlers as backbone views 
            // do not clean those.
            this.off();

            // remove relayed events
            this.$el.off('.relayElEvents');

            // cleanup keyboard events
            KeyboardManager.off(this.$el, '.keynavEvents');

            return Backbone.View.prototype.remove.apply(this, arguments);
        },

        //turn string fn names into actual functions
        _prepareEventsProperty: function(property) {

            //clone so we preparations only affect this instance
            var events = _.clone(_.result(this, property)),
                evt,
                fn;

            /*jshint forin:false*/
            for (evt in events) {
                fn = events[evt];
                if (_.isString(fn)) {
                    events[evt] = _.bind(this[fn], this);
                }
            }

            this[property] = events;
        }

    }, {
        FOCUSABLE_ELEMENTS_SELECTOR: '*[tabindex], a, button, input, textarea, select'
    });

    return View;

});
