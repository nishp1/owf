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
 * This function defines the preferences API functions that are being
 * kept for backwards compatibility with OWF 7
 */
;(function(OWF, Ozone, $, document) {
    'use strict';

    /**
     * Simplified version of the old Ozone.util.ModalDlg that
     * was used in default onFailure handler
     */
    function createErrorWindow(msg) {
        //using inline styles to avoid putting stylesheet requirements on widgets.
        var html = '<div style="position: absolute; top: 50%; margin-top: -4em; ' +
            ' left: 50%; margin-left: -5em; height: 10em; width: 10em; text-align: center; ' +
            'background-color: white; border: 1px solid black;">' +
                '<p></p>' + 
                '<button>OK</button>' +
            '</div>',
            win = $(html).addClass(OWF.Preferences.errorWindowClass);

        function removeWin() {
            win.children('button').off('click', removeWin);
            win.remove();
        }

        win.children('p').text(msg);
        win.children('button').click(removeWin);

        win.appendTo(document.body);
    }

    /**
     * Converts a OWF.Widgets.findWidgetDefinitions response widget
     * into a OWF.Preferences.findWidgets response widget
     */
    function createFindWidgetsResponse(widget) {
        return {
            id: widget.id,
            namespace: 'widget',
            path: widget.id,
            value: {
                allRequired: widget.allRequiredWidgets,
                background: widget.isBackground,
                definitionVisible: widget.isVisibleForLaunch,
                description: widget.description,
                descriptorUrl: widget.descriptorUrl,
                directRequired: widget.requiredWidgets,
                headerIcon: widget.imageUrlSmall,
                height: widget.height,
                image: widget.imageUrlLarge,
                intents: {
                    receive: widget.receiveableIntents,
                    send: widget.sendableIntents
                },
                largeIconUrl: widget.imageUrlLarge,
                maximized: false,
                minimized: false,
                namespace: widget.displayName,
                singleton: widget.isSingleton,
                smallIconUrl: widget.imageUrlSmall,
                tags: widget.tags,
                universalName: widget.universalName,
                url: widget.widgetUrl,
                visible: widget.isVisibleForLaunch,
                widgetTypes: [{id: 1, name: widget.widgetType}],
                widgetVersion: widget.version,
                width: widget.width,
                x: 0,
                y: 0
            }
        };
    }

    /**
     * handles a success response from the new API and converts it into 
     * a response for the old API
     * @param response The new API's response
     * @param onSuccess The user-provided callback
     */
    function handleSuccess(response, onSuccess) {
        //user info has to be passed to onSuccess, but the new API
        //doesn't give that information, so we must get it from a
        //separate call.  If that call fails, just return null for username
        OWF.getCurrentUser().always(function(user) {
            var username = this.state() === 'resolved' ? user.username : null;

            onSuccess({
                id: response.id,
                namespace: response.namespace,
                path: response.name,
                value: response.value,
                user: {
                    userId: username
                }
            });
        });
    }

    /**
     * handles a failure response from the new API and converts it into 
     * a response for the old API
     * @param response The new API's response
     * @param onSuccess The user-provided success callback
     * @param onFailure The user provided failure callback
     */
    function handleFailure(response, onSuccess, onFailure) {
        //preference not found
        if (response.status === 404) {
            onSuccess({success: true, preference: null});
        }
        else {
            onFailure(response.responseText, response.status);
        }
    }

    function legacyPrefsFunction(cfg, verb) {
        var onSuccess = cfg.onSuccess, 
            onFailure = cfg.onFailure || createErrorWindow;

        OWF.Preferences[verb + 'Preference']({
            namespace: cfg.namespace,
            name: cfg.name,
            value: cfg.value,
            scope: 'person'
        }).done(function (resp) {
            handleSuccess(resp, onSuccess, onFailure);
        }).fail(function(resp) {
            handleFailure(resp, onSuccess, onFailure);  
        });
    }

    /**
     * @name getUserPreference
     * @methodOf OWF.Preferences
     * @deprecated Use OWF.Preferences.getPreference instead
     * @description Retrieves the user preference for the provided name and namespace
     * @param {Object} cfg config object see below for properties
     * @param {String} cfg.namespace The namespace of the requested user preference
     * @param {String} cfg.name The name of the requested user preference
     * @param {Function} cfg.onSuccess The function to be called if the user preference is 
     *   successfully retrieved from the database.  This function takes a single argument, which
     *   is an object.  If a preference is found, thecomplete structure as shown in the example
     *   will be returned.  If it is not found this function is passed the following object: 
     *   {success: true, preference: null}.
     * @example
     * The following is an example of a complete preference object passed to the onSuccess
     * function:
     * {
     *     "value":"true",
     *     "path":"militaryTime", //the preference's name
     *     "user":
     *     {
     *         "userId":"testAdmin1" //NOTE: As of OWF 8, user information is retrieved 
     *                               //separately from the preference itself.  If that
     *                               //retrieval fails, userId could be null here
     *     },
     *     "namespace":"com.mycompany.AnnouncingClock"
     * }
     * @param {Function} [cfg.onFailure] This parameter is optional. If this function is not 
     *   specified a default error message will be displayed.This function is called if an error
     *   occurs on preference retrieval.  It is not called if the preference is simply missing.
     *  This function should accept two arguments:<br>
     *  <br>
     *  error: String<br>
     *  The error message<br>
     *  <br>
     *  Status: The numeric HTTP Status code (if applicable)<br>
     *  401: You are not authorized to access this entity.<br>
     *  500: An unexpected error occurred.<br>
     *  400: The requested entity failed to pass validation.<br>
     * @example
     * The following shows how to make a call to getUserPreference:
     * function onSuccess(pref){
     *     alert(Ozone.util.toString(pref.value));
     * }
     *
     * function onFailure(error,status){
     *     alert('Error ' + error);
     *     alert(status);
     * }
     *
     * // The following code calls getUserPreference with the above defined onSuccess and
     * // onFailure callbacks.
     * OWF.Preferences.getUserPreference({
     *     namespace:'com.company.widget',
     *     name:'First President',
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */
    /**
     * @name setUserPreference
     * @methodOf OWF.Preferences
     * @deprecated Use OWF.Preferences.setPreference instead
     * @description Creates or updates a user preference for the provided namespace and name.
     * @param {Object} cfg config object see below for properties
     * @param {String} cfg.namespace  The namespace of the user preference
     * @param {String} cfg.name The name of the user preference
     * @param {String} cfg.value  The value of the user preference. The value can be any string
     *   including JSON.
     * @param {Function} cfg.onSuccess The function to be called if the user preference is 
     *   successfully updated in the database.
     * @example
     * The following is an example of a complete preference object passed to the onSuccess
     * function:
     * {
     *     "value":"true",
     *     "path":"militaryTime", //the preference's name
     *     "user":
     *     {
     *         "userId":"testAdmin1" //NOTE: As of OWF 8, user information is retrieved 
     *                               //separately from the preference itself.  If that
     *                               //retrieval fails, userId could be null here
     *     },
     *     "namespace":"com.mycompany.AnnouncingClock"
     * }
     * @param {Function} [cfg.onFailure] The function to be called if the user preference cannot
     *   be stored in the database.  If this function is not specified a default error message 
     *   will be displayed. This function is passed back the following parameters:<br>
     * <br>
     * error: String<br>
     * The error message<br>
     * <br>
     * Status: The HTTP Status code<br>
     * 401: You are not authorized to access this entity.<br>
     * 500: An unexpected error occurred.<br>
     * 400: The requested entity failed to pass validation.<br>
     * @example
     *
     * function onSuccess(pref){
     *     alert(pref.value);
     * }
     *
     * function onFailure(error,status){
     *     alert('Error ' + error);
     *     alert(status);
     * }
     *
     * var text = 'George Washington';
     * OWF.Preferences.setUserPreference({
     *     namespace:'com.company.widget',
     *     name:'First President',
     *     value:text,
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */
    /**
     * @name deleteUserPreference
     * @methodOf OWF.Preferences
     * @deprecated Use deletePreference instead
     * @description Deletes a user preference with the provided namespace and name.
     * @param {Object} cfg config object see below for properties
     * @param {String} cfg.namespace The namespace of the user preference
     * @param {String} cfg.name The name of the user preference
     * @param {Function} cfg.onSuccess The function to be called if the user preference is 
     *   successfully deleted from the database. If the preference is not found this function is
     *   passed the following object: {success: true, preference: null}.
     * @example
     * The following is an example of a complete preference object passed to the onSuccess
     * function:
     *
     * {
     *     "value":"true",
     *     "path":"militaryTime", //the preference's name
     *     "user":
     *     {
     *         "userId":"testAdmin1" //NOTE: As of OWF 8, user information is retrieved 
     *                               //separately from the preference itself.  If that
     *                               //retrieval fails, userId could be null here
     *     },
     *     "namespace":"com.mycompany.AnnouncingClock"
     * }
     * @param {Function} [cfg.onFailure] The function to be called if the user preference cannot
     *   be deleted from the database. If this function is not specified a default error message
     *   will be displayed. This function is passed back the following parameters: <br>
     * <br>
     * error: String <br>
     * The error message <br>
     * <br>
     * Status: The HTTP Status code<br>
     * <br>
     * 401: You are not authorized to access this entity.<br>
     * 500: An unexpected error occurred.<br>
     * 404: The user preference was not found.<br>
     * 400: The requested entity failed to pass validation. <br>
     * <br>
     * @example
     * function onSuccess(pref){
     *     alert(pref.value);
     * }
     *
     * function onFailure(error,status){
     *     alert('Error ' + error);
     *     alert(status);
     * }
     *
     * OWF.Preferences.deleteUserPreference({
     *     namespace:'com.company.widget',
     *     name:'First President',
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */

    OWF.Preferences = OWF.Preferences || {};

    //create getUserPreference, setUserPreference
    $.each(['get', 'set'], function(idx, verb) {
        OWF.Preferences[verb + 'UserPreference'] = function(cfg) {
            legacyPrefsFunction(cfg, verb);
        };
    });

    $.extend(OWF.Preferences, {
        /**
         * @private
         * The css class applied to the
         * error window div created by the default
         * onFailure implementation
         */
        errorWindowClass: '_owf_error_window',

        /*
         * deleteUserPreference can't be defined using legacyPrefsFunction
         * because it has to call getPreference before it calls deletePreference.
         * This is necessary because it has to return the value that the preference
         * had before it was deleted
         */
        deleteUserPreference: function(cfg) {
            var onSuccess = cfg.onSuccess, 
                onFailure = cfg.onFailure || createErrorWindow,
                preferenceOriginalValue,
                conf = {
                    namespace: cfg.namespace,
                    name: cfg.name,
                    value: cfg.value,
                    scope: 'person'
                };

            //get the current value, then delete the preference, and
            //call handleSuccess with its prior value
            OWF.Preferences.getPreference(conf).then(function(pref) {
                preferenceOriginalValue = pref;
                return OWF.Preferences.deletePreference(conf);
            }).done(function () {
                handleSuccess(preferenceOriginalValue, onSuccess, onFailure);
            }).fail(function(resp) {
                handleFailure(resp, onSuccess, onFailure);  
            });
        },

        /**
         * @name doesUserPreferenceExist
         * @methodOf OWF.Preferences
         * @deprecated Use OWF.preferences.getPreference instead
         * @description Checks for the existence of a user preference for a given namespace and 
         * name
         * @param {Object} cfg config object see below for properties
         * @param {String} cfg.namespace The namespace of the requested user
         * @param {String} cfg.name The name of the requested user
         * @param {Function} cfg.onSuccess The callback function that is called if a preference 
         * successfully return from the database.
         * This method is passed an object having the following properties:<br>
         * <br>
         *     {Number} statusCode: status code<br>
         *     {Boolean} preferenceExist: true if preference exists<br>
         * <br>
         * @param {Function} [cfg.onFailure] The callback function that is called if there was
         * an error looking up the preference.  This function is <em>not</em> called
         * if the preference simply does not exist
         * @example
         *
         * var onSuccess = function(obj) {
         *     if (obj.statusCode = 200) {
         *         alert(obj.preferenceExist);
         *     }
         * };
         *
         * var onFailure = function(error) {
         *     alert(error);
         * };
         *
         * OWF.Preferences.doesUserPreferenceExist({
         *     namespace:'foo.bar.0',
         *     name:'test path entry 0',
         *     onSuccess:onSuccess,
         *     onFailure:onFailure
         * });
         */
        doesUserPreferenceExist: function(cfg) {
            var onSuccess = cfg && cfg.onSuccess, onFailure = cfg && cfg.onFailure || createErrorWindow;

            OWF.Preferences.getPreference({
                name: cfg.name,
                namespace: cfg.namespace,
                scope: 'person'
            }).done(function(preference) {
                onSuccess({
                    preferenceExist: true,
                    statusCode: 200
                });
            }).fail(function(response) {
                if (response.status == 404) {
                    onSuccess({
                        preferenceExist: false,

                        //the actual status code is 404, but for compatibility with
                        //how the API used to work, we will still tell them it was 200
                        statusCode: 200
                    });
                }
                else {
                    onFailure(response.responseText, response.status);
                }
            });
        },

        /**
         * @name getCurrentUser
         * @methodOf OWF.Preferences
         * @deprecated Use OWF.getCurrentUser instead
         * @description retrieves the current user logged into the system
         * @param {Object} cfg config object see below for properties
         * @param {Function} cfg.onSuccess The callback function that is called for a successful 
         * retrieval of the user logged in.
         * This method is passed an object having the following properties:<br>
         * <br>
         *     {String} currentUserName: user name<br>
         *     {String} currentUser: user real name<br>
         *     {String} currentUserPrevLogin: previous login date<br>
         *     {Number} currentId: database pk index<br>
         * <br>
         * @param {Function} cfg.[onFailure] The callback function that is called when the system 
         * is unable to retrieve the current user logged in. Callback parameter is an error 
         * string.
         * @example
         *
         * var onSuccess = function(obj) {
         *     if (obj) {
         *         alert(obj.currentUser);
         *     }
         * };
         *
         * var onFailure = function(error) {
         *     alert(error);
         * };
         *
         * OWF.Preferences.getCurrentUser({
         *     onSuccess:onSuccess,
         *     onFailure:onFailure
         * });
         */
        getCurrentUser: function(cfg) {
            var onSuccess = cfg && cfg.onSuccess, onFailure = cfg && cfg.onFailure || createErrorWindow,
                promise;

            promise = OWF.getCurrentUser();

            if (onSuccess) {
                promise.done(function(user) {
                    onSuccess({
                        currentUserName: user.username,
                        currentUser: user.fullName,
                        currentUserPrevLogin: user.prevLogin,
                        currentId: user.id
                    });
                });
            }

            if (onFailure) {
                promise.fail(function(resp) {
                     onFailure(resp.responseText, resp.status);   
                });
            }
        },

        /**
         * @name findWidgets
         * @methodOf OWF.Preferences
         * @deprecated Use OWF.Widgets.findWidgetDefinitions instead
         * @description Gets all widgets for a given user.
         * @param {Object} cfg config object see below for properties
         * @param {Boolean} [cfg.userOnly] boolean flag that determines whether to only return 
         *  widgets assigned to the user (excluding widgets to which the user only has access via 
         *  their assigned groups)
         * @param {Object} [cfg.searchParams] object containing search parameters
         * @param {String} [cfg.searchParams.widgetName] name of widget '%' are wildcards
         * @param {String} [cfg.searchParams.widgetNameExactMatch] true or false to match the name
         *  exactly. defaults to false
         * @param {String} [cfg.searchParams.widgetVersion] version of widget '%' are wildcards
         * @param {String} [cfg.searchParams.widgetGuid] Guid of widget '%' are wildcards
         * @param {String} [cfg.searchParams.universalName] Universal name of widget '%' are 
         *  wildcards
         * @param {Function} cfg.onSuccess callback function to capture the success result.
         *  This method is passed an array of objects having the following properties:<br>
         * <br>
         *     {Number} id: database pk identifier<br>
         *     {String} namespace: "widget"<br>
         *     {Object} value: widget object having the following properties:<br>
         *     <br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} visible: true if widget is visible<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} namespace: widget name<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} url: url of widget application<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} headerIcon: url of widget header icon<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} image: url of widget image<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} smallIconUrl: url of widget's small icon<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} largeIconUrl: url of widget's large icon<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} width: width of the widget in pixels<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} height: height of the widget in pixels<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} x: x-axis position<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} y: y-axis position<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} minimized: true if widget is minimized<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} maximized: true if widget is maximized<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} widgetVersion: widget version<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} tags: array of tag strings<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} definitionVisible: true if definition is 
         *      visible<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} singleton: true if widget is a singleton<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} background: true if widget runs in the background
         *      <br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} allRequired: array of all widgets required by this 
         *      widget<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} directRequired: array of all widgets directly 
         *      required by this widget<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} widgetTypes: array of widget types this widget 
         *      belongs to<br>
         *     <br>
         *     {String} path: The guid of the widget.<br>
         * <br>
         * @param {Function} [cfg.onFailure] callback to execute if there is an error (optional, 
         *  a default alert provided).  This callback is called with two parameters: a error 
         *  message string, and optionally a status code
         * @example
         *
         * var onSuccess = function(widgets) {
         *     if (widgets.length > 0) {
         *         alert(widgets[0].value.namespace);
         *     }
         * };
         *
         * var onFailure = function(error, status) {
         *     alert(error);
         * };
         *
         * OWF.Preferences.findWidgets({
         *     onSuccess:onSuccess,
         *     onFailure:onFailure
         * });
         */
        findWidgets: function(cfg) {
            var newCfg = {}, 
                searchParams = cfg && cfg.searchParams || {},
                onSuccess = cfg && cfg.onSuccess,
                onFailure = cfg && cfg.onFailure || createErrorWindow,
                promise;


            //convert old cfg parameter to new
            newCfg.displayName = searchParams.widgetName;
            newCfg.displayNameExactMatch = searchParams.widgetNameExactMatch;
            newCfg.version = searchParams.widgetVersion;
            newCfg.id = searchParams.widgetGuid;
            newCfg.universalName = searchParams.universalName;
            newCfg.userOnly = searchParams.userOnly;

            promise = OWF.Widgets.findWidgetDefinitions(newCfg);

            if (onSuccess) {
                promise.done(function(widgets) {
                    onSuccess($.map(widgets, createFindWidgetsResponse));
                });
            }

            if (onFailure) {
                promise.fail(function(resp) {
                     onFailure(resp.responseText, resp.status);   
                });
            }
        },

        /**
         * @deprecated Use OWF.Widgets.getWidgetDefinition
         * @name getWidget
         * @methodOf OWF.Preferences
         * @deprecated Use OWF.Widgets.getWidget instead
         * @description Gets the requested widget definition for a given user.
         * @param {Object} cfg config object see below for properties
         * @param {String} [cfg.searchParams.widgetId] Guid of widget 
         * @param {Function} cfg.onSuccess callback function to capture the success result.
         *  This method is passed an object having the following properties:<br>
         * <br>
         *     {Number} id: database pk identifier<br>
         *     {String} namespace: "widget"<br>
         *     {Object} value: widget object having the following properties:<br>
         *     <br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} visible: true if widget is visible<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} namespace: widget name<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} url: url of widget application<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} headerIcon: url of widget header icon<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} image: url of widget image<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} smallIconUrl: url of widget's small icon<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} largeIconUrl: url of widget's large icon<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} width: width of the widget in pixels<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} height: height of the widget in pixels<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} x: x-axis position<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} y: y-axis position<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} minimized: true if widget is minimized<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} maximized: true if widget is maximized<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{String} widgetVersion: widget version<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} tags: array of tag strings<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} definitionVisible: true if definition is 
         *      visible<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} singleton: true if widget is a singleton<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} background: true if widget runs in the background
         *      <br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} allRequired: array of all widgets required by this 
         *      widget<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} directRequired: array of all widgets directly 
         *      required by this widget<br>
         *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} widgetTypes: array of widget types this widget 
         *      belongs to<br>
         *     <br>
         *     {String} path: The guid of the widget.<br>
         * <br>
         * @param {Function} [cfg.onFailure] callback to execute if there is an error (optional, 
         *  a default alert provided).  This callback is called with two parameters: a error 
         *  message string, and optionally a status code
         * @example
         *
         * var onSuccess = function(widgets) {
         *     if (widgets.length > 0) {
         *         alert(widgets[0].value.namespace);
         *     }
         * };
         *
         * var onFailure = function(error, status) {
         *     alert(error);
         * };
         */
        getWidget: function(cfg) {
            var onSuccess = cfg && cfg.onSuccess, 
                onFailure = cfg && cfg.onFailure || createErrorWindow;

            OWF.Widgets.getWidgetDefinition({id: cfg.widgetId})
                .done(function(widget) {
                    onSuccess(createFindWidgetsResponse(widget));
                })
                .fail(function(message, code) {
                    onFailure(message, code);
                });
        },

        /**
         * @deprecated Use OWF.getContainerVersion instead
         * @name getServerVersion
         * @methodOf OWF.Preferences
         *
         * @param {Function} cfg.onSuccess The callback function to which the 
         * server version is passed.  Accepts an object with a serverVersion property
         */
        getServerVersion: function(cfg) {
            cfg.onSuccess({serverVersion: OWF.getContainerVersion()});
        }
    });

    /**
     * @name getUserPreference
     * @methodOf Ozone.pref.PrefServer
     * @deprecated Use OWF.Preferences.getPreference instead
     * @description Retrieves the user preference for the provided name and namespace
     * @param {Object} cfg config object see below for properties
     * @param {String} cfg.namespace The namespace of the requested user preference
     * @param {String} cfg.name The name of the requested user preference
     * @param {Function} cfg.onSuccess The function to be called if the user preference is 
     *   successfully retrieved from the database.  This function takes a single argument, which
     *   is an object.  If a preference is found, thecomplete structure as shown in the example
     *   will be returned.  If it is not found this function is passed the following object: 
     *   {success: true, preference: null}.
     * @example
     * The following is an example of a complete preference object passed to the onSuccess
     * function:
     * {
     *     "value":"true",
     *     "path":"militaryTime", //the preference's name
     *     "user":
     *     {
     *         "userId":"testAdmin1" //NOTE: As of OWF 8, user information is retrieved 
     *                               //separately from the preference itself.  If that
     *                               //retrieval fails, userId could be null here
     *     },
     *     "namespace":"com.mycompany.AnnouncingClock"
     * }
     * @param {Function} [cfg.onFailure] This parameter is optional. If this function is not 
     *   specified a default error message will be displayed.This function is called if an error
     *   occurs on preference retrieval.  It is not called if the preference is simply missing.
     *  This function should accept two arguments:<br>
     *  <br>
     *  error: String<br>
     *  The error message<br>
     *  <br>
     *  Status: The numeric HTTP Status code (if applicable)<br>
     *  401: You are not authorized to access this entity.<br>
     *  500: An unexpected error occurred.<br>
     *  400: The requested entity failed to pass validation.<br>
     * @example
     * The following shows how to make a call to getUserPreference:
     * function onSuccess(pref){
     *     alert(Ozone.util.toString(pref.value));
     * }
     *
     * function onFailure(error,status){
     *     alert('Error ' + error);
     *     alert(status);
     * }
     *
     * // The following code calls getUserPreference with the above defined onSuccess and
     * // onFailure callbacks.
     * Ozone.pref.PrefServer.getUserPreference({
     *     namespace:'com.company.widget',
     *     name:'First President',
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */
    /**
     * @name setUserPreference
     * @methodOf Ozone.pref.PrefServer
     * @deprecated Use OWF.Preferences.setPreference instead
     * @description Creates or updates a user preference for the provided namespace and name.
     * @param {Object} cfg config object see below for properties
     * @param {String} cfg.namespace  The namespace of the user preference
     * @param {String} cfg.name The name of the user preference
     * @param {String} cfg.value  The value of the user preference. The value can be any string
     *   including JSON.
     * @param {Function} cfg.onSuccess The function to be called if the user preference is 
     *   successfully updated in the database.
     * @example
     * The following is an example of a complete preference object passed to the onSuccess
        * function:
     * {
     *     "value":"true",
     *     "path":"militaryTime", //the preference's name
     *     "user":
     *     {
     *         "userId":"testAdmin1" //NOTE: As of OWF 8, user information is retrieved 
     *                               //separately from the preference itself.  If that
     *                               //retrieval fails, userId could be null here
     *     },
     *     "namespace":"com.mycompany.AnnouncingClock"
     * }
     * @param {Function} [cfg.onFailure] The function to be called if the user preference cannot
     *   be stored in the database.  If this function is not specified a default error message 
     *   will be displayed. This function is passed back the following parameters:<br>
     * <br>
     * error: String<br>
     * The error message<br>
     * <br>
     * Status: The HTTP Status code<br>
     * 401: You are not authorized to access this entity.<br>
     * 500: An unexpected error occurred.<br>
     * 400: The requested entity failed to pass validation.<br>
     * @example
     *
     * function onSuccess(pref){
     *     alert(pref.value);
     * }
     *
     * function onFailure(error,status){
     *     alert('Error ' + error);
     *     alert(status);
     * }
     *
     * var text = 'George Washington';
     * Ozone.pref.PrefServer.setUserPreference({
     *     namespace:'com.company.widget',
     *     name:'First President',
     *     value:text,
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */
    /**
     * @name deleteUserPreference
     * @methodOf Ozone.pref.PrefServer
     * @deprecated Use OWF.Preferences.deletePreference instead
     * @description Deletes a user preference with the provided namespace and name.
     * @param {Object} cfg config object see below for properties
     * @param {String} cfg.namespace The namespace of the user preference
     * @param {String} cfg.name The name of the user preference
     * @param {Function} cfg.onSuccess The function to be called if the user preference is 
     *   successfully deleted from the database. If the preference is not found this function is
     *   passed the following object: {success: true, preference: null}.
     * @example
     * The following is an example of a complete preference object passed to the onSuccess
     * function:
     *
     * {
     *     "value":"true",
     *     "path":"militaryTime", //the preference's name
     *     "user":
     *     {
     *         "userId":"testAdmin1" //NOTE: As of OWF 8, user information is retrieved 
     *                               //separately from the preference itself.  If that
     *                               //retrieval fails, userId could be null here
     *     },
     *     "namespace":"com.mycompany.AnnouncingClock"
     * }
     * @param {Function} [cfg.onFailure] The function to be called if the user preference cannot
     *   be deleted from the database. If this function is not specified a default error message
     *   will be displayed. This function is passed back the following parameters: <br>
     * <br>
     * error: String <br>
     * The error message <br>
     * <br>
     * Status: The HTTP Status code<br>
     * <br>
     * 401: You are not authorized to access this entity.<br>
     * 500: An unexpected error occurred.<br>
     * 404: The user preference was not found.<br>
     * 400: The requested entity failed to pass validation. <br>
     * <br>
     * @example
     * function onSuccess(pref){
     *     alert(pref.value);
     * }
     *
     * function onFailure(error,status){
     *     alert('Error ' + error);
     *     alert(status);
     * }
     *
     * Ozone.pref.PrefServer.deleteUserPreference({
     *     namespace:'com.company.widget',
     *     name:'First President',
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */
    /**
     * @name doesUserPreferenceExist
     * @methodOf Ozone.pref.PrefServer
     * @deprecated Use OWF.Preferences.getPreference instead
     * @description Checks for the existence of a user preference for a given namespace and 
     * name
     * @param {Object} cfg config object see below for properties
     * @param {String} cfg.namespace The namespace of the requested user
     * @param {String} cfg.name The name of the requested user
     * @param {Function} cfg.onSuccess The callback function that is called if a preference 
     * successfully return from the database.
     * This method is passed an object having the following properties:<br>
     * <br>
     *     {Number} statusCode: status code<br>
     *     {Boolean} preferenceExist: true if preference exists<br>
     * <br>
     * @param {Function} [cfg.onFailure] The callback function that is called if there was
     * an error looking up the preference.  This function is <em>not</em> called
     * if the preference simply does not exist
     * @example
     *
     * var onSuccess = function(obj) {
     *     if (obj.statusCode = 200) {
     *         alert(obj.preferenceExist);
     *     }
     * };
     *
     * var onFailure = function(error) {
     *     alert(error);
     * };
     *
     * Ozone.pref.PrefServer.doesUserPreferenceExist({
     *     namespace:'foo.bar.0',
     *     name:'test path entry 0',
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */
    /**
     * @name getCurrentUser
     * @methodOf Ozone.pref.PrefServer
     * @deprecated Use OWF.getCurrentUser instead
     * @description retrieves the current user logged into the system
     * @param {Object} cfg config object see below for properties
     * @param {Function} cfg.onSuccess The callback function that is called for a successful 
     * retrieval of the user logged in.
     * This method is passed an object having the following properties:<br>
     * <br>
     *     {String} currentUserName: user name<br>
     *     {String} currentUser: user real name<br>
     *     {Date} currentUserPrevLogin: previous login date<br>
     *     {Number} currentId: database pk index<br>
     * <br>
     * @param {Function} cfg.[onFailure] The callback function that is called when the system 
     * is unable to retrieve the current user logged in. Callback parameter is an error 
     * string.
     * @example
     *
     * var onSuccess = function(obj) {
     *     if (obj) {
     *         alert(obj.currentUser);
     *     }
     * };
     *
     * var onFailure = function(error) {
     *     alert(error);
     * };
     *
     * Ozone.pref.PrefServer.getCurrentUser({
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */
    /**
     * @name findWidgets
     * @methodOf Ozone.pref.PrefServer
     * @deprecated Use OWF.Widgets.findWidgetDefinitions instead
     * @description Gets all widgets for a given user.
     * @param {Object} cfg config object see below for properties
     * @param {Boolean} [cfg.userOnly] boolean flag that determines whether to only return 
     *  widgets assigned to the user (excluding widgets to which the user only has access via 
     *  their assigned groups)
     * @param {Object} [cfg.searchParams] object containing search parameters
     * @param {String} [cfg.searchParams.widgetName] name of widget '%' are wildcards
     * @param {String} [cfg.searchParams.widgetNameExactMatch] true or false to match the name
     *  exactly. defaults to false
     * @param {String} [cfg.searchParams.widgetVersion] version of widget '%' are wildcards
     * @param {String} [cfg.searchParams.widgetGuid] Guid of widget '%' are wildcards
     * @param {String} [cfg.searchParams.universalName] Universal name of widget '%' are 
     *  wildcards
     * @param {Function} cfg.onSuccess callback function to capture the success result.
     *  This method is passed an array of objects having the following properties:<br>
     * <br>
     *     {Number} id: database pk identifier<br>
     *     {String} namespace: "widget"<br>
     *     {Object} value: widget object having the following properties:<br>
     *     <br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} visible: true if widget is visible<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} namespace: widget name<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} url: url of widget application<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} headerIcon: url of widget header icon<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} image: url of widget image<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} smallIconUrl: url of widget's small icon<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} largeIconUrl: url of widget's large icon<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} width: width of the widget in pixels<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} height: height of the widget in pixels<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} x: x-axis position<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} y: y-axis position<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} minimized: true if widget is minimized<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} maximized: true if widget is maximized<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} widgetVersion: widget version<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} tags: array of tag strings<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} definitionVisible: true if definition is 
     *      visible<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} singleton: true if widget is a singleton<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} background: true if widget runs in the background
     *      <br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} allRequired: array of all widgets required by this 
     *      widget<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} directRequired: array of all widgets directly 
     *      required by this widget<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} widgetTypes: array of widget types this widget 
     *      belongs to<br>
     *     <br>
     *     {String} path: The guid of the widget.<br>
     * <br>
     * @param {Function} [cfg.onFailure] callback to execute if there is an error (optional, 
     *  a default alert provided).  This callback is called with two parameters: a error 
     *  message string, and optionally a status code
     * @example
     *
     * var onSuccess = function(widgets) {
     *     if (widgets.length > 0) {
     *         alert(widgets[0].value.namespace);
     *     }
     * };
     *
     * var onFailure = function(error, status) {
     *     alert(error);
     * };
     *
     * Ozone.pref.PrefServer.findWidgets({
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */
    /**
     * @deprecated Use OWF.getContainerVersion instead
     * @name getServerVersion
     * @methodOf OWF.pref.PrefServer
     *
     * @param {Function} cfg.onSuccess The callback function to which the 
     * server version is passed.  Accepts an object with a serverVersion property
     */
    /**
     * @deprecated Use OWF.Widgets.getWidgetDefinition
     * @name getWidget
     * @methodOf Ozone.pref.PrefServer
     * @deprecated Use OWF.Widgets.getWidget instead
     * @description Gets the requested widget definition for a given user.
     * @param {Object} cfg config object see below for properties
     * @param {String} [cfg.searchParams.widgetId] Guid of widget 
     * @param {Function} cfg.onSuccess callback function to capture the success result.
     *  This method is passed an object having the following properties:<br>
     * <br>
     *     {Number} id: database pk identifier<br>
     *     {String} namespace: "widget"<br>
     *     {Object} value: widget object having the following properties:<br>
     *     <br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} visible: true if widget is visible<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} namespace: widget name<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} url: url of widget application<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} headerIcon: url of widget header icon<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} image: url of widget image<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} smallIconUrl: url of widget's small icon<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} largeIconUrl: url of widget's large icon<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} width: width of the widget in pixels<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} height: height of the widget in pixels<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} x: x-axis position<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Number} y: y-axis position<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} minimized: true if widget is minimized<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} maximized: true if widget is maximized<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{String} widgetVersion: widget version<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} tags: array of tag strings<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} definitionVisible: true if definition is 
     *      visible<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} singleton: true if widget is a singleton<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Boolean} background: true if widget runs in the background
     *      <br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} allRequired: array of all widgets required by this 
     *      widget<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} directRequired: array of all widgets directly 
     *      required by this widget<br>
     *     &nbsp;&nbsp;&nbsp;&nbsp;{Array} widgetTypes: array of widget types this widget 
     *      belongs to<br>
     *     <br>
     *     {String} path: The guid of the widget.<br>
     * <br>
     * @param {Function} [cfg.onFailure] callback to execute if there is an error (optional, 
     *  a default alert provided).  This callback is called with two parameters: a error 
     *  message string, and optionally a status code
     * @example
     *
     * var onSuccess = function(widgets) {
     *     if (widgets.length > 0) {
     *         alert(widgets[0].value.namespace);
     *     }
     * };
     *
     * var onFailure = function(error, status) {
     *     alert(error);
     * };
     *
     * Ozone.pref.PrefServer.findWidgets({
     *     onSuccess:onSuccess,
     *     onFailure:onFailure
     * });
     */

    //really old API support
    Ozone.pref = Ozone.pref || {};
    Ozone.pref.PrefServer = OWF.Preferences;
})(window.OWF = window.OWF || {}, window.Ozone = window.Ozone || {}, window._$, document);
