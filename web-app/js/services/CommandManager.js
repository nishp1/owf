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
    'jquery'
],

function($) {
    'use strict';

    var _commands = {};

    function Command(id, handler) {
        this.id = id;
        this.handler = handler;
    }

    Command.prototype.execute = function() {
        var result = this.handler.apply(this, arguments);
        if (!result) {
            // If command does not return a promise, assume that it handled the
            // command synchronously and return a resolved promise
            return (new $.Deferred()).resolve(result).promise();
        } else {
            return result;
        }
    };

    var CommandManager = {

        unregister:  function(id) {
            _commands[id] = null;
            return this;
        },

        register:  function(id, handler) {
            // Could place some de-regsiter command logic here and announce that
            // an old command has been replaced
            // will hold off until there is a need
            _commands[id] = new Command(id, handler);
            return this;
        },

        execute:  function(id) {
            var command = _commands[id];
            if (command) {
                return command.execute.apply(command, Array.prototype.slice.call(arguments, 1));
            } else {
                return (new $.Deferred()).reject().promise();
            }
        }

    };

    return CommandManager;

});