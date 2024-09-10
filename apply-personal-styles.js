// ==UserScript==
// @name         Change average sheet style [ECE Paris]
// @namespace    ECE Paris Script
// @version      0.1
// @description  Allows you to change the average style sheet automatically.
// @author       BragdonD
// @match        https://campusonline.inseec.net/note/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// @grant        none
// ==/UserScript==

var $ = window.jQuery;

const ensStyle = `
color: #fff !important;
background-color: #376bc5;
font-weight: bold !important;
`;
const ev1Style = `
color: #000 !important;
background-color: #95bcff;
`;
const fpcStyle = `
color: #000 !important;
background-color: #619bff;
font-weight: bold !important;
`;

function changeEnsStyle($ensElement) {
    $ensElement.attr("style", function() { return $(this).attr("style") + ensStyle });
}

function changeEv1Style($ev1Element) {
    $ev1Element.attr("style", function() { return $(this).attr("style") + ev1Style });
}

function changeFpcStyle($fpcElement) {
    $fpcElement.attr("style", function() { return $(this).attr("style") + fpcStyle });
}

(function() {
    'use strict';
    const resultatsContainerId = "resultat-note";
    const resultatsTableId = "table_note";

    window.addEventListener("display-grades", () => {
        const table = $("#".concat(resultatsTableId));
        changeEnsStyle($(".item-ens"));
        changeEv1Style($(".item-ev1"));
        changeFpcStyle($(".item-fpc"));
    });
})();
