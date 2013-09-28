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

/*jshint bitwise:false*/
define([
    'models/DashboardInstance',
    'views/dashboard/EditDashboard',
    'jquery',
    'lodash',
    'handlebars',
    'bootstrap/bootstrap-modal'
],

function(DashboardInstance, EditDashboard, $, _, Handlebars) {

    var createFromExistingTpl = Handlebars.compile(
                                    '<div class="control-group create-from-existing">' +
                                        '<label class="control-label checkbox" for="description">' +
                                            '<input type="checkbox" value="" tabindex="0">' +
                                            '<span>Create From Existing</span>' +
                                        '</label>' +
                                        '<div class="controls">' +
                                            '<select disabled tabindex="0">' +
                                                '{{#each this}}' +
                                                    '<option value="{{id}}">{{name}}</option>' +
                                                '{{/each}}' +
                                            '</select>' +
                                        '</div>' +
                                    '</div>'
                                );
    var importTpl = '<div class="control-group import">' +
                        '<label class="control-label checkbox" for="description">' +
                            '<input type="checkbox" value="" tabindex="0">' +
                            '<span>Import</span>' +
                        '</label>' +
                        '<div class="controls">' +
                            '<input type="file" class="file" accept="application/json" name="file" disabled="disabled">' +
                        '</div>' +
                    '</div>';

    var invalidFile = 'Invalid JSON file.';

    return EditDashboard.extend({

        id: 'create-dashboard-window',

        // dashboard instances collection
        dashboards: null,

        title: 'Create Dashboard',

        events: _.extend({}, EditDashboard.prototype.events, {
            'click .create-from-existing label': '_toggleCreateFromExisting',
            'click .import label': '_toggleImport'
        }),

        initialize: function() {
            this.model = new DashboardInstance({
                name: ''
            });
            EditDashboard.prototype.initialize.apply( this, arguments );
        },

        render: function() {
            EditDashboard.prototype.render.call( this );

            this._$existingDashboards = $( createFromExistingTpl(this.options.dashboards.toJSON()) );
            this._$existingDashboardsCheckbox = this._$existingDashboards.find('input[type="checkbox"]');
            this._$existingDashboardsDropDown = this._$existingDashboards.find('select').select2({
                width: '100%',
                placeholder: "Select a Dashboard"
            });

            this._$importFromFile = $(importTpl);
            this._$importFromFileCheckbox = this._$importFromFile.find('input[type="checkbox"]');
            this._$importFromFileInput = this._$importFromFile.find('input[type="file"]');

            // listen to change directly as event doesn't bubble
            this._$importFromFileInput.on('change', _.bind(this._onFileChange, this));

            this.$form
                .append(this._$existingDashboards)
                .append(this._$importFromFile);

            return this;
        },

        ok: function(evt) {
            evt.preventDefault();
            evt.stopPropagation();

            if(! this.isFormValid() ) {
                return;
            }

            this.model.set({
                name: this.$form.find('.name').val(),
                description: this.$form.find('.description').val()
            });

            // is creating from existing dashboard
            if (this._$existingDashboardsCheckbox.prop('checked')) {
                this._createFromExisting();
            }
            // is importing a dashboard
            else if (this._$importFromFileCheckbox.prop('checked')) {
                this._createFromImport();
            }
            else {
                this._deferred.resolve(this.model);
            }
        },

        create: function() {
            this.show();
            this._deferred = $.Deferred();
            return this._deferred.promise();
        },

        remove: function() {
            this._$importFromFileInput.off();
            EditDashboard.prototype.remove.apply(this, arguments);
        },

        onHide: function () {
            this._$existingDashboardsDropDown.select2('destroy');
        },

        _onFileChange: function (evt) {
            this.hideErrorMsg(evt.currentTarget);
        },

        _createFromExisting: function () {
            var dashboardId = this._$existingDashboardsDropDown.select2('val'),
                dashboard = this.dashboards.get(dashboardId);

            this.model.copy(dashboard);
            this._deferred.resolve(this.model);
        },

        _createFromImport: function () {
            var me = this,
                frameName = 'dashboard_upload',
                uploadFrame = $('<iframe name="' + frameName + '" style="display:none"/>');

            this.$form.attr('method', 'POST')
                .attr('enctype', 'multipart/form-data')
                .attr('action', '/ozp/rest/owf/dashboard-templates');

            $('body').append(uploadFrame);

            uploadFrame.load(function(evt) {

                var response = uploadFrame[0].contentWindow.document.body.innerHTML,
                    json;

                // validate JSON
                try {
                    json = JSON.parse(response);
                }
                catch(err) {
                    me.showErrorMsg( me._$importFromFileInput, invalidFile );
                }

                if(json) {
                    me.model.copy(json);
                    me._deferred.resolve(me.model);
                }
                uploadFrame.remove();

            });

            //setup complete
            this.$form.attr('target', frameName).submit();
        },

        _disableCreateFromExisting: function() {
            this._$existingDashboardsCheckbox.prop('checked', false);
            this._$existingDashboardsDropDown.select2('disable');
        },

        _toggleCreateFromExisting: function(evt) {
            var checked;

            this._disableImport();

            checked = this._$existingDashboardsCheckbox.prop('checked');

            // manually check checkbox if clicked on text
            if (evt.target.nodeName.toLowerCase() !== 'input') {
                this._$existingDashboardsCheckbox.prop('checked', !checked);
                this._$existingDashboardsDropDown.select2(checked ? 'disable' : 'enable');
            }
            else {
                this._$existingDashboardsDropDown.select2(checked ? 'enable' : 'disable');
            }
        },

        _disableImport: function() {
            this._$importFromFileCheckbox.prop('checked', false);
            this._$importFromFileInput.prop('disabled', true);
            this.hideErrorMsg(this._$importFromFileInput);
        },

        _toggleImport: function(evt) {
            var checked;

            this._disableCreateFromExisting();
            this.hideErrorMsg(this._$importFromFileInput);

            checked = this._$importFromFileCheckbox.prop('checked');

            // manually check checkbox if clicked on text
            if (evt.target.nodeName.toLowerCase() !== 'input') {
                this._$importFromFileCheckbox.prop('checked', !checked);
                this._$importFromFileInput.prop('disabled', checked ? true: false);
            }
            else {
                this._$importFromFileInput.prop('disabled', checked ? false: true);
            }
        }
    });
});
