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
    'bootstrap/bootstrap-modal'
],

function(View, $, _) {

    return View.extend({

        // backbone view for a list item
        listItemView: null,

        // class to add when item is selected or focused
        selectedClassName: 'selected',

        // currently selected item (backbone view)
        selectedItem: null,

        events: {
            'click > *': 'onItemClick',
            'focusin > *': '_selectFocusedItem',
            'focusout > *': 'clearSelection'
        },

        modelEvents: {
            'add': 'addOne',
            'reset': 'addAll'
        },

        keynavEvents: {
            'keyup(enter)': 'onItemClick'
        },

        initialize: function () {
            this.listItemView = this.listItemView || this.options.listItemView;
            View.prototype.initialize.apply(this, arguments);
        },

        render: function () {
            View.prototype.render.apply(this, arguments);
            this.addAll();
            return this;
        },

        createOne: function (item) {
            var view = new this.listItemView({ model: item });
            view.render();
            return view;
        },

        addOne: function(item) {
            var view = this.createOne( item );
            this.$el.append(view.el);
            return view;
        },

        addAll: function() {
            this.collection.each(_.bind(this.addOne, this));
        },

        // handle item clicks
        // selects clicked item
        onItemClick: function (evt) {
            this.selectItem($(evt.currentTarget));
        },

        selectItem: function ($el) {
            this.clearSelection();

            this.selectedItem = $el.data('view');
            $el.addClass( this.selectedClassName );
        },

        clearSelection: function () {
            if(this.selectedItem) {
                this.selectedItem.$el.removeClass( this.selectedClassName );
                delete this.selectedItem;
            }
        },

        _selectFocusedItem: function (evt) {
            this.selectItem($(evt.target));
        }
    });

});
