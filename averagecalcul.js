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

var nbYears = -1;
var nbSemesters = -1;
var nbModules = -1;
var nbSubject = -1;

/** It is the variable that will store the parsing of the table. It will acts as a result of the database. **/
var years = [];
var semesters = [];
var modules = [];
var subjects = [];

const yearIdentificationStr = "Année";
const semestreIdentificationStr = "Semestre";
const moduleIdentificationStr = "Module";

const gradeRegex = /([0-9]{1,2},[0-9]{1,2}) (?:\([0-9]{1,2}(?:\.[0-9]{1,2})?\%\))?/g
const parseGradeRegex = /([0-9]{1,2},[0-9]{1,2})|(?:[0-9]{1,2}(?:.[0-9]{1,2})?)?/g

function createYear(number, $parent) {
    years.push({year: number, row: $parent, coeff: 1, average: 0});
    nbYears += 1;
}

function createSemester(number, $parent) {
    semesters.push({number: number, nbYears: nbYears, row: $parent, coeff: 1, average: 0});
    nbSemesters += 1;
}

function createModule(name, $parent) {
    modules.push({name: name, semestreId: nbSemesters, subject: [], coeff: 0, average: 0});
    nbModules += 1;
}

function CreateNewSubject(name, $parent) {
    subjects.push({ sub: name, grades: {}, moduleId: nbModules, row: $parent });
    nbSubject += 1;
}

function parseSubject($children, $parent) {
    let subjectName = $children[0].textContent;
    CreateNewSubject(subjectName, $parent);
    if($children[1].classList.contains("ponderation")) {
        let subjectCoeff = $children[1].textContent;
        subjects[nbSubject].coeff = subjectCoeff;
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

    subjects[nbSubject]["grades"][nameToInsert] = {
        grades: parseGrade(subjectPartGrades.match(gradeRegex)),
        coeff: subjectPartCoeff,
        row: $parent
    }
}

function parseRow($row, index) {
    let $children = $row.querySelectorAll("td");
    if($children[0].classList.contains("item-ens")) {
        if($children[0].textContent.includes(yearIdentificationStr)) {
            createYear(nbYears + 2, $row);
        }
        else if($children[0].textContent.includes(semestreIdentificationStr)) {
            createSemester(nbSemesters + 2, $row);
        }
        else if($children[0].textContent.includes(moduleIdentificationStr)) {
            createModule($children[0].textContent,$row);
        }
    }
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
        if(item.classList.contains("slave") ||
           item.classList.contains("master")) {
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
    subjects.forEach((item) => {
        let nbOfContinuGrades = item.grades.Continu?.length;
        let nbOfExamGrades = item.grades.Examen?.length;
        let nbOfProjectGrades = item.grades.Project?.length;
        equalizeGradesType(item.grades.Continu);
        equalizeGradesType(item.grades.Examen);
        equalizeGradesType(item.grades.Project);
    });
}

function calculateGradesAverage(type) {
    if(type === undefined) return;
    let average = 0;
    type.grades.forEach((item) => {
       average += (item.grade * item.coeff)
    });
    type.average = parseFloat(average);
}

function calculateEachGradesAverage() {
    subjects.forEach((item) => {
        calculateGradesAverage(item.grades.Continu);
        calculateGradesAverage(item.grades.Examen);
        calculateGradesAverage(item.grades.Project);
    });
}

function transformToFloatCoeffBySubject() {
    let modifyCoeff = (type) => {
        if(type === undefined) return;
        type.coeff = type.coeff?.match(parseGradeRegex);
    }
    subjects.forEach((item) => {
        modifyCoeff(item.grades.Continu);
        modifyCoeff(item.grades.Examen);
        modifyCoeff(item.grades.Project);
    });
}

function equalizeSubjectCoeff(subject) {
    let coeff = [];
    if(subject.Continu !== undefined) {
        if(subject.Continu?.grades.length > 0) {
            coeff.push(subject.Continu?.coeff);
        }
    }
    if(subject.Examen !== undefined) {
        if(subject.Examen?.grades.length > 0) {
            coeff.push(subject.Examen?.coeff);
        }
    }
    if(subject.Project !== undefined) {
        if(subject.Project?.grades.length > 0) {
            coeff.push(subject.Project?.coeff);
        }
    }

    let finalCoeff = coeff.reduce((i, n) => { return i + n});
    subject.Project.coeff = subject.Project?.coeff / finalCoeff;
}

function calculateSubjectAverage() {
    subjects.forEach((item) => {
        item.average = item.grades.Continu
    });
}

function modifyTable($table) {
    var $rows = $table.find("tr");
    $rows.each( (index, item) => {
        let parent = item.parentNode;
        let children = item.querySelectorAll("td");
        let firstChild = children[0];
        if(parent.tagName === 'THEAD') {
            if(index === 1) {
                let newTh = document.createElement('th');
                newTh.classList.add("entete-average");
                newTh.innerText = "Moyenne"
                item.appendChild(newTh);
            }
            return;
        }

        let newTd = document.createElement('td');
        newTd.classList.add("average");
        newTd.classList.add(firstChild.classList.contains("item-ens") ? "item-ens" : firstChild.classList.contains("item-fpc") ? "item-fpc" : "item-ev1");
        newTd.setAttribute("style", "font-weight: 400!important; text-align: center; border-right: 1px solid #d3d3d3;");
        item.appendChild(newTd);
    });
}

function fillContinu(average, elem) {
    if(average === undefined) return;
    elem.innerText = average;
}

function displayAverage(average) {
    if(average === undefined) return;
    let Children = average.row.children;
    if(Children !== undefined) {
        fillContinu(average.average.toFixed(2), Children[Children.length-1]);
    }
}

function fillNewTd() {
    subjects.forEach((item) => {
        displayAverage(item.grades.Continu);
        displayAverage(item.grades.Examen);
        displayAverage(item.grades.Project);
    });
}

function removeUnwanted() {
    $("#resultat-note").arrive(".releve_note", function() {
        let $elem = $(this);
        $elem.remove();
    });
}

(function() {
    'use strict';
    $("#resultat-note").arrive("#table_note", function() {
        var $table = $(this);
        removeUnwanted();
        modifyTable($table);
        parseTable($table);
        equalizeGrades();
        calculateEachGradesAverage();
        transformToFloatCoeffBySubject();
        console.log(subjects);
        console.log(years);
        console.log(semesters);
        console.log(modules);
        fillNewTd();
    });
})();
