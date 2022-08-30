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

/** Variables to help adding data inside each array bellow **/
var nbYears = -1;
var nbSemesters = -1;
var nbModules = -1;
var nbSubject = -1;

/** It is the variables that will store the parsing of the table.. **/
var years = [];
var semesters = [];
var modules = [];
var subjects = [];

const yearIdentificationStr = "Année";          ///String to identify if the line is a year
const semestreIdentificationStr = "Semestre";   ///String to identify if the line is a semester
const moduleIdentificationStr = "Module";       ///String to identify if the line is a module

const gradeRegex = /([0-9]{1,2},[0-9]{1,2}) (?:\([0-9]{1,2}(?:\.[0-9]{1,2})?\%\))?/g  ///Regex to parse the grade the first time and obtain a result like "19.50 (50.0%)"
const parseGradeRegex = /([0-9]{1,2},[0-9]{1,2})|(?:[0-9]{1,2}(?:.[0-9]{1,2})?)?/g    ///Regex to parse the grade in two components 19.50 and 50.0

/**
 * Function to create a new year inside the array
 * @param {number} number the year's number
 * @param {HTMLElement} $parent the selected parent row
 */
function createYear(number, $parent) {
    years.push({year: number, row: $parent, coeff: 1, average: 0});
    nbYears += 1;
}

/**
 * Function to create a new semester inside the array
 * @param {number} number the semester number
 * @param {HTMLElement} $parent the selected parent row
 */
function createSemester(number, $parent) {
    semesters.push({number: number, nbYears: nbYears, row: $parent, coeff: 1, average: 0});
    nbSemesters += 1;
}

/**
 * Function to create a new module inside the array
 * @param {string} name the module name
 * @param {HTMLElement} $parent the selected parent row
 */
function createModule(name, $parent) {
    modules.push({name: name, semestreId: nbSemesters, subject: [], row: $parent, coeff: 0, average: 0});
    nbModules += 1;
}

/**
 * Function to create a new subject inside the array
 * @param {string} name the subject name
 * @param {HTMLElement} $parent the selected parent row
 */
function CreateNewSubject(name, $parent) {
    subjects.push({ sub: name, grades: {}, moduleId: nbModules, row: $parent });
    nbSubject += 1;
}

/**
 * Function to parse a row when it is detected as a subject row
 * @param {HTMLCollectionOf} $children the selected row's children - it is a <td></td> element list
 * @param {HTMLElement} $parent the selected parent row
 */
function parseSubject($children, $parent) {
    let subjectName = $children[0].textContent; ///Get the subject name
    CreateNewSubject(subjectName, $parent); ///create the new subject inside the array
    if($children[1].classList.contains("ponderation")) { ///Get the coefficient of the subject for the module average calculus
        let subjectCoeff = $children[1].textContent;
        subjects[nbSubject].coeff = subjectCoeff;
    }
}

/**
 * Function to turn the string of grades into an array of grades
 * @param {string} gradeStrArr The grade are store inside a string under the format 19,50 (50.0%)
 * @returns the array of grades to store inside the properties grade of the subject inside the array
 */
function parseGrade(gradeStrArr) {
    let grades = [];
    for(let i=0; i<gradeStrArr?.length; i++)
    {
        let parseResult = gradeStrArr[i].match(parseGradeRegex);
        parseResult = parseResult.filter(str => str !== ""); /// filter all the empty expression that are taken in by the regex
        /**
         * ParseResult is divide now as
         * [0] === the grade
         * [1] === the coefficient
         * [1] does not exist some times
         */
        grades.push({   ///Add the grades to the array of grades inside each
            grade: parseResult[0],
            coeff: parseResult[1] !== undefined ? parseResult[1] : 100, ///the coefficient is not given when the grades have a ponderation of 100% so it need to be add as 100
        });
    }
    return grades;
}

/**
 * Function to parses all the grades of a subject (continu, exam and project)
 * @param {Object} $children the selected row's children - a td element list
 * @param {Object} $parent the selected parent row
 */
function parseGrades($children, $parent){
    /**
     * The identificator for each type part of a subject
     */
    const continu = "Continu";
    const exam = "Examen";
    const project = "Project";

    let subjectPartName = $children[0].textContent;   ///get the name of the subject's part
    let subjectPartCoeff = $children[2].textContent;  ///get the coeff of the subject's part
    let subjectPartGrades = $children[3].textContent; ///get the grades of the subject's part
    ///check the part of the subject to insert ( Continu, Examen, Project )
    let nameToInsert = subjectPartName.includes(continu) ? continu : subjectPartName.includes(exam) ? exam : project;
    ///add it to the subject and add its grades, its coefficient and its row
    subjects[nbSubject]["grades"][nameToInsert] = {
        grades: parseGrade(subjectPartGrades.match(gradeRegex)),
        coeff: subjectPartCoeff,
        row: $parent
    }
}

/**
 * Function to parse a row of the table
 * @param {Object} $row the selected row to parse
 * @param {Number} index the row's index
 */
function parseRow($row, index) {
    let $children = $row.querySelectorAll("td"); ///get all the td from the row
    ///test if the row is a Module, a year or a semestrer
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
    ///test if the row is a subpart of a subject
    if($children[0].classList.contains("item-fpc")) {
        parseSubject($children, $row);
    }
    ///test if the row contains grades
    if($children[0].classList.contains("item-ev1")) {
        parseGrades($children, $row);
    }
}

/**
 * Function to parse the grades table
 * @param {Object} $table the table to parse
 */
function parseTable($table) {
    var $rows = $table.find("tr");
    $rows.each( (index, item) => {
        if(item.classList.contains("slave") ||
           item.classList.contains("master")) {
            parseRow(item, index);
        }
    });
}

/**
 * Function to transform each grades which are string into float number.
 * Furthermore it will equalize the coefficient of each grades to remove the unknow coefficient
 * @param {Object} type the subject part
 * @returns {void}
 */
function equalizeGradesType(type) {
    if(type === undefined) return; ///test if the subject part exist
    let totalCoeff = 0; ///variable to store the subject part total coeff and then calcul the correct coeff for each grade
    type.grades.forEach((item) => {
       totalCoeff += parseFloat(item.coeff);
    });
    type.grades.forEach((item) => {
       item.grade = parseFloat(item.grade.replace(/,/, '.')); ///transform the string grade into a float grade
       item.coeff = item.coeff/(totalCoeff) ///get the right coefficient for the grades
    });
}

/**
 * Function to manage the grades's transformation for each subject's type
 */
function equalizeGrades() {
    subjects.forEach((item) => {
        equalizeGradesType(item.grades.Continu);
        equalizeGradesType(item.grades.Examen);
        equalizeGradesType(item.grades.Project);
    });
}

/**
 * Function to make the average for each subject part (Continu - Exam - Project)
 * @param {Object} type the type of the subject part
 * @returns {void}
 */
function calculateGradesAverage(type) {
    if(type === undefined) return; ///test if the subject part exist
    if(type.grades.length === 0) { ///if there is no grades we can go next
        type.average = undefined;
        return;
    }
    let average = 0;
    type.grades.forEach((item) => { ///add to the average
       average += (item.grade * item.coeff)
    });
    type.average = parseFloat(average); ///store the average
}

/**
 * Function to manage the grades's average calcul for each subject's type
 */
function calculateEachGradesAverage() {
    subjects.forEach((item) => {
        calculateGradesAverage(item.grades.Continu);
        calculateGradesAverage(item.grades.Examen);
        calculateGradesAverage(item.grades.Project);
    });
}

/**
 * Function to transform the coeff of the subject part from a string to a float
 */
function transformToFloatCoeffForEachSubject() {
    let modifyCoeff = (type) => {
        if(type === undefined) return; ///test if the type exists
        type.coeff = type.coeff?.match(parseGradeRegex);
        type.coeff = type.coeff?.filter(str => str !== "")[0];
        type.coeff = parseFloat(type.coeff);
    }
    subjects.forEach((item) => {
        modifyCoeff(item.grades.Continu);
        modifyCoeff(item.grades.Examen);
        modifyCoeff(item.grades.Project);
    });
}

/**
 * Function to calcul the coefficient of each subject part
 * @param {Object} subject the subject to optimize the coefficient of each part
 * @returns {boolean} if false need to be handle because it means that the subject doesn't have any grades for now.
 */
function equalizeSubjectCoeff(subject) {
    let coeff = [];
    let continu = false;
    let exam = false;
    let project = false;
    if(subject.Continu !== undefined) { /// test if the subject's part exists
        if(subject.Continu?.grades.length > 0) { ///test if the subject part need to be taken into account
            coeff.push(subject.Continu?.coeff);
            continu = true;
        }
    }
    if(subject.Examen !== undefined) {
        if(subject.Examen?.grades.length > 0) {
            coeff.push(subject.Examen?.coeff);
            exam = true;
        }
    }
    if(subject.Project !== undefined) {
        if(subject.Project?.grades.length > 0) {
            coeff.push(subject.Project?.coeff);
            project = true;
        }
    }
    if(coeff.length === 0) return false;
    let finalCoeff = coeff.reduce((i, n) => { return i + n}); ///calcul the summ of all the coefficient
    ///Calcul each coeff
    if(subject.Continu !== undefined) {
        subject.Continu.coeff = subject.Continu.coeff / finalCoeff;
    }
    if(subject.Examen !== undefined) {
        subject.Examen.coeff = subject.Examen.coeff / finalCoeff;
    }
    if(subject.Project !== undefined) {
        subject.Project.coeff = subject.Project.coeff / finalCoeff;
    }
    ///Operation to get if there is at least one grade for the subject
    return continu || exam || project;
}

/**
 * Function to calcul all the subject average and set it inside the subjects array
 */
function calculateSubjectAverage() {
    subjects.forEach((item) => {
        if(equalizeSubjectCoeff(item.grades) === false) {
            item.average = undefined;
            return;
        }
        item.average = 0; ///reset to the 0 the subject average
        ///add to the item average
        item.average += (item.grades.Continu !== undefined ? (item.grades.Continu.average * item.grades.Continu.coeff) : 0);
        item.average += (item.grades.Examen !== undefined ? (item.grades.Examen.average * item.grades.Examen.coeff) : 0);
        item.average += (item.grades.Project !== undefined ? (item.grades.Project.average * item.grades.Project.coeff) : 0);
    });
}

/**
 * Function to transform each subject's coeff from a string into an integer
 */
function transformtoIntSubjectCoeff() {
    subjects.forEach((item) => {
        item.coeff = parseInt(item.coeff);
    });
}

/**
 * Function to calcul the module's average
 */
function calculateModulesAverage() {
    /**
     * Function to get the average for the module
     * @param coeffs an array of all the module's subject coeff
     * @param grades an array of all the module's subject grades
     * @returns the average of the module or undefined if the module contains 0 grade
     */
    const getAverage = (coeffs, grades) => {
        let val = 0;
        let coeff = 0;
        for(let i=0; i < coeffs.length; i++){
            if(grades[i] !== undefined) { /// test if there is at least one grade for the module
                val += coeffs[i]*grades[i];
                coeff += coeffs[i];
            }
        }
        if(coeff === 0) return undefined;
        return val/coeff; ///the subject for the modules
    }
    let index = 0;
    modules.forEach((module) => {
        let coeffs = [];
        let grades = [];
        let bonus = 0;
        subjects.forEach((item) => {
            if(item.moduleId === index) {
                if(item.sub.includes("Bonus")) { ///bonus grade is a little bit special it is directly add to the scientific module
                    bonus = item.average;
                    bonus /= 20.0;
                    return;
                }
                coeffs.push(item.coeff); ///add the subject coeff
                grades.push(item.average); ///add the subject grade
            }
        });
        module.average = getAverage(coeffs, grades);
        module.average += bonus;
        module.coeff = coeffs.reduce((i, n) => { return i + n});
        index++;
    });
}

/**
 * Function to add a column to each row of the table
 * @param {HTMLElement} $table the table that needs to be modified
 */
function modifyTable($table) {
    var $rows = $table.find("tr");
    $rows.each( (index, item) => {
        let parent = item.parentNode;
        let children = item.querySelectorAll("td");
        let firstChild = children[0];
        if(parent.tagName === 'THEAD') { ///check if the row is inside the table's header to add the column name
            if(index === 1) {
                let newTh = document.createElement('th');
                newTh.classList.add("entete-average");
                newTh.innerText = "Moyenne"
                item.appendChild(newTh);
            }
            return;
        }
        ///if the parent is not inside the table's header then we add the grade
        let newTd = document.createElement('td');
        newTd.classList.add("average");
        newTd.classList.add(firstChild.classList.contains("item-ens") ? "item-ens" : firstChild.classList.contains("item-fpc") ? "item-fpc" : "item-ev1");
        newTd.setAttribute("style", "font-weight: 400!important; text-align: center; border-right: 1px solid #d3d3d3;");
        item.appendChild(newTd);
    });
}

/**
 * Function to add the average text to the td element
 * @param {number} average the grade to add
 * @param {HTMLElement} elem the td element
 * @returns void
 */
function fillElem(average, elem) {
    if(average === undefined) return;
    elem.innerText = average;
}

/**
 * Function to display the average if it is not undefined
 * @param average
 * @returns
 */
function displayGradeAverage(average) {
    if(average === undefined) return; ///test if the average's calcul has been succesfull
    let children = average.row.children;
    if(children !== undefined) {
        fillElem(average.average?.toFixed(2), children[children.length-1]);
    }
}

/**
 * Function to fill all the new td that has been created
 */
function fillNewTd() {
    subjects.forEach((item) => {
        displayGradeAverage(item);
        displayGradeAverage(item.grades.Continu);
        displayGradeAverage(item.grades.Examen);
        displayGradeAverage(item.grades.Project);
    });
    modules.forEach((item) => {
        displayGradeAverage(item);
    });
}

/**
 * Function to remove a strange apparition of a second table when the window is resized
 */
function removeUnwanted() {
    $("#resultat-note").arrive(".releve_note", function() {
        let $elem = $(this);
        $elem.remove();
    });
}

/**
 * Main function to execute the code
 */
(function() {
    'use strict';
    /**
     * We waited for the table to be display after the grades are load from the origin
     */
    $("#resultat-note").arrive("#table_note", function() {
        var $table = $(this);
        removeUnwanted();
        modifyTable($table);
        parseTable($table);
        equalizeGrades();
        calculateEachGradesAverage();
        transformToFloatCoeffForEachSubject();
        calculateSubjectAverage();
        transformtoIntSubjectCoeff();
        calculateModulesAverage();
        fillNewTd();
    });
})();
