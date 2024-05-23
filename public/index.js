import { Scheduler } from './scheduler.module.js';

const terminalHideDelay = 300;
const terminalShowDelay = 100;

const scheduler = new Scheduler({
    appendTo   : 'app',
    startDate  : new Date(2024, 1, 19, 6),
    endDate    : new Date(2024, 1, 19, 20),
    viewPreset : 'hourAndDay',
    features   : {
        dependencies : {
            // Makes dependency lines easier to click
            clickWidth     : 5,
            // Round the corners of the dependency lines
            radius         : 10,
            // How far in px from the edge of the event bar to place the terminals
            // (negative numbers are further away from the bar, positive further inside)
            terminalOffset : 0,
            // Size of dependency terminals in px
            terminalSize   : 12,
            // Time to wait after mouse enters an event bar, before showing the terminals
            // (using a short delay, to make UI feel less "jumpy" when moving mouse over multiple events)
            terminalShowDelay,
            // Time to wait before hiding a terminal after mouse leaves the event bar / terminal.
            // Lets us use an animation for the hide operation
            terminalHideDelay
        },
        dependencyEdit : {
            showLagField : false
        }
    },
    crudManager : {
        loadUrl          : 'http://localhost:1337/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/sync',
        autoSync         : true,
        // This config enables response validation and dumping of found errors to the browser console.
        // It's meant to be used as a development stage helper only so please set it to false for production systems.
        validateResponse : true
    },
    columns : [{ text : 'Name', field : 'name', width : 130 }]
});