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
    'services/FocusManager',
    'jquery'
],

function(Modal, FocusManager, $) {
    'use strict';

    /**
     * Shows a warning window to user. Also manages circular focus.
     *
     * Events:
     * shown: Fired when the modal has finished animating in
     * hidden: Fired when the modal has finished animating out
     */
    return Modal.extend({
        show: function (options) {
            var $focusElBeforeShow = FocusManager.activeEl(),
                me = this;

            me.$el
                .one('hidden', function () {
                    $focusElBeforeShow.focus();
                })
                .one('shown', function () {
                    var $buttons = me.$el.find('.modal-footer > .btn'),
                        $firstButton = $buttons.first();

                    me.initCircularFocus($firstButton, $buttons.last());
                    $firstButton.focus();
                });

            return Modal.prototype.show.call(me, options);
        }

    });

});
