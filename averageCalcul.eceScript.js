// ==UserScript==
// @name         Calculation of averages [ECE Paris]
// @namespace    ECE Paris Script
// @version      0.1
// @description  Allows you to calculate course averages automatically and add the average box to the grades table.
// @author       BragdonD
// @match        https://campusonline.inseec.net/note/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// @grant        none
// ==/UserScript==

var $ = window.jQuery;
var nbSubject = -1;
/** It is the variable that will store the parsing of the table. It will acts as a result of the database. **/
var databaseRes = []

const gradeRegex = /([0-9]{1,2},[0-9]{1,2}) (?:\([0-9]{1,2}(?:\.[0-9]{1,2})?\%\))?/g
const parseGradeRegex = /([0-9]{1,2},[0-9]{1,2})|(?:[0-9]{1,2}(?:.[0-9]{1,2})?)?/g

function CreateNewSubjectInDbRes(name, $parent) {
    databaseRes.push({ sub: name, grades: {}, row: $parent });
    nbSubject += 1;
}

function parseSubject($children, $parent) {
    let subjectName = $children[0].textContent;
    CreateNewSubjectInDbRes(subjectName, $parent);
    if($children[1].classList.contains("ponderation")) {
        let subjectCoeff = $children[1].textContent;
        databaseRes[nbSubject].coeff = subjectCoeff;
    }
}

function parseGrade(gradeStrArr) {
    let grades = [];
    for(let i=0; i<gradeStrArr?.length; i++)
    {
        let parseResult = gradeStrArr[i].match(parseGradeRegex);
        parseResult = parseResult.filter(str => str !== "");
        grades.push({
            grade: parseResult[0],
            coeff: parseResult[1] !== undefined ? parseResult[1] : 100,
        });
    }
    return grades;
}

function parseGrades($children, $parent){
    const continu = "Continu";
    const exam = "Examen";
    const project = "Project";

    let subjectPartName = $children[0].textContent;
    let subjectPartCoeff = $children[2].textContent;
    let subjectPartGrades = $children[3].textContent;

    let nameToInsert = subjectPartName.includes(continu) ? continu : subjectPartName.includes(exam) ? exam : project;

    databaseRes[nbSubject]["grades"][nameToInsert] = {
        grades: parseGrade(subjectPartGrades.match(gradeRegex)),
        coeff: subjectPartCoeff,
        row: $parent
    }
}

function parseRow($row, index) {
    let $children = $row.querySelectorAll("td");
    if($children[0].classList.contains("item-fpc")) {
        parseSubject($children, $row);
    }
    if($children[0].classList.contains("item-ev1")) {
        parseGrades($children, $row);
    }
}

function parseTable($table) {
    var $rows = $table.find("tr");
    $rows.each( (index, item) => {
        if(item.classList.contains("slave")) {
            parseRow(item, index);
        }
    });
}

function equalizeGradesType(type) {
    if(type === undefined) return;
    let totalCoeff = 0;
    type.grades.forEach((item) => {
       totalCoeff += parseFloat(item.coeff);
    });
    type.grades.forEach((item) => {
       item.grade = parseFloat(item.grade.replace(/,/, '.'));
       item.coeff = item.coeff/(totalCoeff)
    });
}

function equalizeGrades() {
    databaseRes.forEach((item) => {
        let nbOfContinuGrades = item.grades.Continu?.length;
        let nbOfExamGrades = item.grades.Examen?.length;
        let nbOfProjectGrades = item.grades.Project?.length;
        equalizeGradesType(item.grades.Continu);
        equalizeGradesType(item.grades.Examen);
        equalizeGradesType(item.grades.Projecy);
    });
}

function displayAverage() {

}

function calculateAverage(type) {
    if(type === undefined) return;
    let average = 0;
    type.grades.forEach((item) => {
       average += (item.grade * item.coeff)
    });
    type.average = parseFloat(average);
}

function calculateEachAverage() {
    databaseRes.forEach((item) => {
        calculateAverage(item.grades.Continu);
        calculateAverage(item.grades.Examen);
        calculateAverage(item.grades.Projecy);
    });
}

function modifyTable($table) {
    var $rows = $table.find("tr");
    $rows.each( (index, item) => {
        let grandParent = item.getParent().getParent();
        let newTd = document.createElement('td');
        ///item.appendChild(.addClass);
    });
}

(function() {
    'use strict';
    $("#resultat-note").arrive("#table_note", function() {
        var $table = $(this);
        modifyTable($table);
        parseTable($table);
        equalizeGrades();
        calculateEachAverage();
        console.log(databaseRes);
    });
})();