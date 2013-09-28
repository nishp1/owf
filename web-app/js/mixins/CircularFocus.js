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
    'jquery',
    'lodash',
    'services/KeyboardManager'
], function($, _, KeyboardManager) {

    var circularFocus = {

        _isInitialized: false,
        _$firstEl: null,
        _$lastEl: null,

        initCircularFocus: function(firstEl, lastEl, beforeLoop, beforeBackLoop) {
            var $focusables;

            // Adjust variables if some optional ones were omitted
            if(firstEl && _.isFunction(firstEl)) {
                beforeLoop = firstEl;
                firstEl = null;
            }
            if(lastEl && _.isFunction(lastEl)) {
                beforeBackLoop = lastEl;
                lastEl = null;
            }

            // only find focusable elements if no elements are post
            if(!firstEl || !lastEl) {
                $focusables = this.$focusables();
            }

            this._$firstEl = firstEl ? ((firstEl instanceof $) ? firstEl : $(firstEl)) : $focusables.first();
            this._$lastEl = lastEl ? ((lastEl instanceof $) ? lastEl : $(lastEl)) : $focusables.last();

            // If defined, assign beforeLoop and beforeBackLoop callbacks
            if(beforeLoop) { 
                this._beforeLoop = beforeLoop;
            }
            if(beforeBackLoop) {
                this._beforeBackLoop = beforeBackLoop;
            }

            if(!this._isInitialized) {
                _.bindAll(this, '_focusFirstElement', '_focusLastElement');
                this._isInitialized = true;
            }
            
            //monitor both keydown and keypress since FF 3.6 only fires
            //keypress on successive elements when you hold down tab
            KeyboardManager.on(this._$lastEl, 'keydown(tab)', this._focusFirstElement);
            KeyboardManager.on(this._$lastEl, 'keypress(tab)', this._focusFirstElement);

            KeyboardManager.on(this._$firstEl, 'keydown(shift+tab)', this._focusLastElement);
            KeyboardManager.on(this._$firstEl, 'keypress(shift+tab)', this._focusLastElement);

            return this;
        },

        tearDownCircularFocus: function() {
            if(this._$lastEl) {
                KeyboardManager.off(this._$lastEl, 'keydown(tab)');
                KeyboardManager.off(this._$lastEl, 'keypress(tab)');
                delete this._$lastEl;
            }

            if(this._$firstEl) {
                KeyboardManager.off(this._$firstEl, 'keydown(shift+tab)');
                KeyboardManager.off(this._$firstEl, 'keypress(shift+tab)');
                delete this._$firstEl;
            }

            return this;
        },

        reinitCircularFocus: function(firstEl, lastEl, beforeLoop, beforeBackLoop) {
            this.tearDownCircularFocus();
            this.initCircularFocus(firstEl, lastEl, beforeLoop, beforeBackLoop);

            return this;
        },

        _beforeBackLoop: null,

        _beforeLoop: null,

        _focusFirstElement: function(evt) {
            if(this._beforeLoop) {
                this._beforeLoop();
            }
            this._focusAndPrevent(this._$firstEl, evt);
        },

        _focusLastElement: function(evt) {
            if(this._beforeBackLoop) {
                this._beforeBackLoop();
            }
            this._focusAndPrevent(this._$lastEl, evt);
        },

        _focusAndPrevent: function($el, evt) {
            $el.focus();
            evt.preventDefault();
        }
    };

    return circularFocus;
});