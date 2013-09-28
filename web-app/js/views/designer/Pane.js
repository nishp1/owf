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
    'views/panes/Pane',
    'jquery',
    'lodash',
    'bootstrap-editable'
], function (Pane, $, _) {

    'use strict';

    var percentageUnitsRegex = /^\d+(\.\d+)?%$/i,
        pxUnitsRegex = /^\d+(\.\d+)?px$/i,
        isPercentageSize = function (size) {
            return size && percentageUnitsRegex.test(size);
        },
        isPixelSize = function (size) {
            return size && pxUnitsRegex.test(size);
        };

    return Pane.extend({
        vtype: 'designerpane',

        paneType: null,

        attributes: function () {
            return {
                tabindex: !this.options.box ? 0 : -1
            };
        },

        keynavEvents: {
            'keyup(space)': 'openEditable'
        },

        editableDisabled: false,

        openEditable: function (evt) {
            var me = this;

            if(evt.target.nodeName !== 'INPUT' && this.$editable && this.editableDisabled !== true) {
                evt.stopPropagation();

                this.$editable.editable('show').one('hidden', function () {
                    // to prevent keyup from firing again
                    setTimeout(function() {
                        me.$el.focus();
                    }, 200);
                });
            }
        },

        enableEditable: function () {
            this.editableDisabled = false;
            this.$editable && this.$editable.editable('enable');
        },

        disableEditable: function () {
            this.editableDisabled = true;
            this.$editable && this.$editable.editable('disable');
        },

        initialize: function () {
            if(!this.options.box) {
                this.$el.addClass( this.options.paneType );
            }
            Pane.prototype.initialize.apply( this, arguments );
        },

        getPaneType: function () {
            return this.options.paneType;
        },

        setPaneType: function (paneType) {
            this.$el.removeClass(this.options.paneType);
            this.options.paneType = paneType;
            this.$el.addClass( paneType );
        },

        getWidgets: function () {
            return this.options.widgets || [];
        },

        setWidgets: function (widgets) {
            this.options.widgets = [].concat(widgets);
        },

        afterRender: function () {
            var size = this.options.width || this.options.height,
                text;

            // don't allow editing for a single pane
            if( !this.options.box && ((size && size !== '100%') || this.options.flex) ) {
                text = this.options.flex ? 'Variable' : size;
                var $size = $( '<h3>' + _.escape( text ) + '</h3>' );
                this.$el.append( $size );
                this.initEditable();
            }
            return this;
        },

        nest: function ( ruleType ) {
            var paneType = this.getPaneType(),
                widgets = this.options.widgets,
                config = ruleType === 'vertical' ? {
                    vtype: 'hbox',
                    panes: [
                        { vtype: 'designerpane', paneType: paneType, width: '50%', widgets: widgets },
                        { vtype: 'designerpane', paneType: paneType, width: '50%', widgets: [] }
                    ]
                } : {
                    vtype: 'vbox',
                    panes: [
                        { vtype: 'designerpane', paneType: paneType, height: '50%', widgets: widgets },
                        { vtype: 'designerpane', paneType: paneType, height: '50%', widgets: [] }
                    ]
                };

            // remove widgets from current pane
            delete this.options.widgets;

            // cleanup
            this.removeEditable();

            // remove pane class to avoid stacking
            this.$el
                .removeClass( this.getPaneType() )
                .removeAttr('tabindex') // remove tab index so that this pane is not focusable
                .empty();

            
            this.addView( config );
            this.options.box = config;
            return this;
        },

        reset: function (widgets) {
            this.$el.addClass( this.getPaneType() );
            
            var box = this.views[0];
            
            // remove sub view if found
            if( box ) {
                this.removeView(box);
                delete this.options.box;
            }
            this.options.widgets = widgets;
            this.$el.attr('tabindex', 0);
        },

        initEditable: function () {
            this.$editable = this.$el.children('h3');
            this.$editable.editable({
                mode: 'inline',
                onblur : 'submit',
                showbuttons: false,
                validate: _.bind( this.validate, this ),
                display: _.bind( this.editComplete, this )
            });
        },

        removeEditable: function () {
            this.$editable && this.$editable.editable( 'destroy' );
            this.$editable = null;
        },

        validate: function (value) {
            value = $.trim( value );
            var num = parseFloat( value );

            if(isNaN( num )) {
                return "Nice try! Invalid input, please enter a valid value. For example, 400px or 50%.";
            }

            if( isPercentageSize( value ) ) {
                if( num <= 0 ) {
                    return "Width/Height of 0% or lower is not allowed";
                }
                else if( num >= 100 ) {
                    return "Width/Height of 100% or higher is not allowed";
                }
            }
            else if( num < 36 ) {
                return "Minimum width/height allowed is 36px";
            }
        },

        editComplete: function (value) {
            if( !isPixelSize( value ) && !isPercentageSize( value ) ) {
                value = parseFloat( value ) + 'px';
            }
            this.$editable.html( value );

            this.trigger( 'sizeChange', value );
        },

        updateSize: function (options) {
            Pane.prototype.updateSize.call( this, options );

            this.$el.children('h3')
                .editable( 'destroy' )
                .html( this.options.flex ? 'Variable' : (this.options.width || this.options.height) );

            this.initEditable();
        },

        remove: function () {
            this.removeEditable();
            Pane.prototype.remove.call( this );
        }

    });

});
