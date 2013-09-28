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
/*global require*/
define([
    'collections/PersonalWidgetDefinitions',
    'models/PersonalWidgetDefinition',
    'comms/Constants',
    'comms/Comms',
    'marketplace/MarketplaceTransport',
    'services/Notifications',
    'views/Warning',

    //libs
    'lodash'
], function (PersonalWidgetDefinitions, PersonalWidgetDefinition, CommsConstants, Comms, MarketplaceTransport,
             Notifications, Warning, _) {
    'use strict';

    var AddWidgetContainer = function () {
    };

    _.extend(AddWidgetContainer.prototype, {

        initialize: function() {
            var me = this;
            Comms.register(CommsConstants.ADD_WIDGET_CHANNEL_NAME, function (sender, msg) {

                //msg will always be a json string
                var cfg = JSON.parse(msg);

                // Must return a value for the callback function to be invoked on the client side.
                return me.addWidget(cfg);
            });
        },

        addWidget: function (config) {
            var widgetsJSON = config.widgetsJSON;
            this.processMarketplaceWidgetData(widgetsJSON.baseUrl, widgetsJSON.itemId);
            return widgetsJSON.itemId;
        },

        processMarketplaceWidgetData: function (marketplaceUrl, widgetId) {
            var me = this;
            MarketplaceTransport.send({
                url: marketplaceUrl + "/relationship/getOWFRequiredItems",
                method: "POST",
                content: {
                    id: widgetId
                },
                onSuccess: function (jsonData) {
                    var widgetListJson = [], data = jsonData.data;

                    for (var i = 0, len = data.length; i < len; i++) {
                        var serviceItem = data[i];
                        widgetListJson.push(me.createModel(serviceItem, widgetId));
                    }

                    if (widgetListJson.length > 0) {
                        me.submitWidgetList(widgetListJson, marketplaceUrl);
                    }
                },
                onFailure: function (json) {
                    var modal = new Warning({
                        title: 'Error',
                        content: 'Error has occurred while adding widgets from Marketplace',
                        ok: function (evt) {
                            this.hide();
                        }
                    });
                    modal.show();

                }
            });
        },

        createModel: function (serviceItem, widgetId) {
            var directRequired = [];
            for (var j = 0; j < serviceItem.requires.length; j++) {
                directRequired.push(serviceItem.requires[j].uuid);
            }

            var widgetJson = {
                id: serviceItem.uuid,
                widgetUrl: serviceItem.launchUrl,
                displayName: serviceItem.title,
                widgetType: 'standard',

                description: serviceItem.description ? serviceItem.description : '',
                imageUrlLarge: serviceItem.imageLargeUrl,
                imageUrlSmall: serviceItem.imageSmallUrl,
                singleton: serviceItem.owfProperties.singleton,
                isVisibleForLaunch: serviceItem.owfProperties.visibleInLaunch,
                isBackground: serviceItem.owfProperties.background,

                universalName: serviceItem.universalName,

                height: serviceItem.owfProperties.height != null ? serviceItem.owfProperties.height : 200,
                width: serviceItem.owfProperties.width != null ? serviceItem.owfProperties.width : 200

            };

            //todo handle intents from marketplace when intents feature is being worked on

            if (directRequired.length > 0) {
                widgetJson.requiredWidgets = directRequired;
            }

            var pwd = new PersonalWidgetDefinition({
                isVisibleForLaunch: true,
                isAssignedToPerson: true,
                widgetDefinition: widgetJson
            });

            return pwd;
        },

        submitWidgetList: function (widgetList, mpUrl) {
            //search to see if these pwds already exist in the all collection
            //if so then update the pwd in the all collection
            //otherwise add the newPwd to all
            _.forEach(widgetList, function(pwd) {
                var wd = pwd.get('widgetDefinition');
                if (wd != null) {
                    var foundPwd = PersonalWidgetDefinitions.all.find(function(p) {
                      return wd.id === p.get('widgetDefinition').id;
                    },this);

                    //if pwd is found copy wd
                    if (foundPwd != null) {
                        foundPwd.set('widgetDefinition',wd);
                    }
                    else {
                        //add new pwd to all
                        PersonalWidgetDefinitions.all.add(pwd);
                    }
                }
            },this);

            PersonalWidgetDefinitions.all.sync('update', PersonalWidgetDefinitions.all);
        }

    });

    return AddWidgetContainer;
});