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

/**
 * This mixin defines behavior that binds the jquery sortable plugin to
 * the reordering of the view's backing collection.  This allows users to
 * drag the view's items in order to reorder the collection
 *
 * @usage Mix this object into your class' prototype, and then call its
 * initSortable method during your render or initialize
 */
define([
    'lodash',
    'jqueryui/jquery.ui.sortable',
    'jqueryui/jquery.ui.selectable'
], function(_, $) {
    'use strict';

    return {
        initSortable: function(sortableOptions) {
            var me = this;

            this.$el.sortable(_.extend({
                helper: function (evt, el) {
                    var $el = $(el[0].cloneNode(true)),
                        elHtml = $('<div></div>').append($el).html();
                    
                    return $(elHtml);
                },
                update: _.bind(me.handleReorder, me)
            }, sortableOptions));

            //remove the sortable plugin when the view is destroyed
            this.on('remove', function(view) {
                view.$el.sortable("destroy");
            });
        },
        
        handleReorder: function(event, ui) {
            var $item = $(ui.item),
                header = $item.data('view');

            this.collection.updateIndex(header.model, $item.index());
        }
    };
});
