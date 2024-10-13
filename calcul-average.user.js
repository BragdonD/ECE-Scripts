// ==UserScript==
// @name         Calculation of averages [ECE Paris]
// @namespace    ECE Paris Script
// @version      0.2
// @description  Allows you to calculate course averages automatically and add the average box to the grades table.
// @author       BragdonD
// @match        https://campusonline.inseec.net/note/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js

// @homepageURL   https://github.com/bragdond/ECE-Scripts
// @supportURL    https://github.com/bragdond/ECE-Scripts/issues
// @downloadURL   https://raw.githubusercontent.com/bragdond/ECE-Scripts/main/calcul-average.user.js
// @updateURL     https://raw.githubusercontent.com/bragdond/ECE-Scripts/main/calcul-average.user.js

// @grant        none
// @updateURL    https://github.com/BragdonD/ECE-Scripts/blob/main/averagecalcul.js
// ==/UserScript==

/**
 * @typedef {Object} Grade
 * @property {number} value - The value of the grade.
 * @property {number} weight - The weight of the grade.
 */

/**
 * @typedef {Object} CourseGradePart
 * @property {string} name - The name of the course grade part.
 * @property {number} weight - The weight of the course grade part.r}
 * @property {Array.<Grade>} grades - The grades of the course grade part.
 * @property {number} average - The average grade of the course grade part.
 */

/**
 * @typedef {CourseGrade}
 * @property {string} name - The name of the course.
 * @property {Array.<CourseGradePart>} courseParts - The course grade parts.
 * @property {number} coefficient - The coefficient of the course.
 * @property {number} average
 */

/**
 * @typedef {Object} Module
 * @property {string} name - The name of the module.
 * @property {Array.<Course>} courses - The courses of the module.
 * @property {number} average - The average grade of the module.
 */

/**
 * @typedef {Object} Semester
 * @property {string} name - The name of the semester.
 * @property {Array.<Module>} modules - The modules of the semester.
 */

/**
 * @typedef {Object} Year
 * @property {string} name - The name of the year.
 * @property {Array.<Semester>} semesters - The semesters of the year.
 */

(function () {
    'use strict';
    const resultatsContainerId = "resultat-note";
    const resultatsTableId = "table_note";
    const averageLocalStorage = "compute-average"

    const resultsContainer = document.querySelector(
        "#".concat(resultatsContainerId)
    );

    if (!resultsContainer) {
        return;
    }

    /**
     * Homogenizes the weights of grades in a course part.
     *
     * @param {Object} coursePart - The course part object containing grades.
     * @returns {Object} - The course part object with homogenized weights.
     */
    const homogenizeCoursePartGradesWeight = (coursePart) => {
        const maxPossibleWeight = 100; // for 100%
        let cpTotalWeight = 0.0;

        for (const grade of coursePart.grades) {
            cpTotalWeight += grade.weight;
        }

        if (cpTotalWeight >= 100) {
            return coursePart;
        }

        coursePart.grades.forEach((grade) => {
            grade.weight = (grade.weight / cpTotalWeight) * maxPossibleWeight;
        })
        return coursePart;
    }

    /**
     * Homogenizes the weight of each course part in a course.
     * If the total weight of all course parts is less than 100, the weights are adjusted proportionally to make the total weight equal to 100.
     * If the total weight is already 100 or more, the course is returned unchanged.
     * @param {Object} course - The course object containing course parts.
     * @returns {Object} - The course object with homogenized course part weights.
     */
    const homogenizeCoursePartWeight = (course) => {
        const maxPossibleWeight = 100;
        let cpTotalWeight = 0.0;
        for (const cp of course.courseParts) {
            if (cp.grades.length > 0) {
                cpTotalWeight += cp.weight;
            }
        }

        if (cpTotalWeight >= 100) {
            return course;
        }

        course.courseParts.forEach((cp) => {
            if (cp.grades.length > 0) {
                cp.weight = (cp.weight / cpTotalWeight) * maxPossibleWeight;
            } else {
                cp.weight = 0;
            }
        })
        return course;
    }

    /**
     * Homogenizes the coefficient of each course in the given module.
     *
     * @param {Object} module - The module object containing courses.
     * @returns {Object} - The modified module object with homogenized coefficients.
     */
    const homogenizeModuleCoursesCoeff = (module) => {
        module.courses.forEach((course) => {
            let cpWithGrades = 0;
            for (const cp of course.courseParts) {
                if (cp.grades.length > 0) {
                    cpWithGrades += 1;
                }
            }
            if (cpWithGrades == 0) {
                course.coefficient = 0;
            }
        })
        return module;
    }

    /**
     * Computes the average for a course part.
     *
     * @param {Object} cp - The course part object.
     * @param {Array} cp.grades - The array of grades for the course part.
     * @param {number} cp.average - The average of the course part.
     * @param {number} cp.weight - The weight of the course part.
     * @returns {Object} - The updated course part object with the computed average.
     */
    const computeCoursePartAverage = (cp) => {
        if (cp.grades.length == 0) {
            cp.average = 0;
            return cp;
        }
        for (const grade of cp.grades) {
            if(grade.value == null) {
                cp.average = undefined;
                cp.weight = 0;
                return cp;
            }
            cp.average += grade.value * (grade.weight / 100);
        }
        cp.average = Number(cp.average.toFixed(2));
        return cp;
    }

    /**
     * compute the average of a Course object
     * @param {Course} course
     */
    const computeCourseAverage = (course) => {
        let availableCP = 0;
        for (const coursePart of course.courseParts) {
            course.average += coursePart.average * (coursePart.weight / 100);
            if (coursePart.weight > 0) {
                availableCP += 1;
            }
        }
        if (availableCP == 0) {
            course.average = undefined
            course.coefficient = 0
        } else {
            course.average = Number(course.average.toFixed(2));
        }
        if (course.resit != undefined && course.resit != null) {
            course.average = course.resit
        }
        return course;
    }

    /**
     * Computes the average for a given module.
     *
     * @param {Object} module - The module object containing courses.
     * @returns {Object} - The module object with the computed average.
     */
    const computeModuleAverage = (module) => {
        let totalCoeff = 0;
        module.average = 0;
        for (const course of module.courses) {
            module.average += course.average * course.coefficient;
            totalCoeff += course.coefficient
        }
        if (totalCoeff > 0) {
            module.average = (module.average / totalCoeff)
            module.average = Number(module.average.toFixed(2));
        } else {
            module.average = undefined
        }
        return module;
    }

    window.addEventListener("extract-grades", () => {
        let grades = window.localStorage.getItem("grades")
        if (grades == null) {
            return;
        }
        grades = JSON.parse(grades)
        console.log("STARTING TO COMPUTE AVERAGES")
        // kinda forced due to composition
        grades.forEach(
            /**
             *
             * @param {Year} year
             */
            (year) => {
                year.semesters.forEach(
                    /**
                     *
                     * @param {Semester} semester
                     */
                    (semester) => {
                        semester.modules.forEach(
                            /**
                             *
                             * @param {Module} module
                             */
                            (module) => {
                                module.courses.forEach(
                                    /**
                                     *
                                     * @param {Course} course
                                     */
                                    (course) => {
                                        course.courseParts.forEach(
                                            /**
                                             *
                                             * @param {CourseGradePart} coursePart
                                             */
                                            (cp) => {
                                                cp = homogenizeCoursePartGradesWeight(cp);
                                                cp = computeCoursePartAverage(cp);
                                                return cp
                                            }
                                        );
                                        course = homogenizeCoursePartWeight(course);
                                        course = computeCourseAverage(course);
                                    }
                                )
                                module = homogenizeModuleCoursesCoeff(module);
                                module = computeModuleAverage(module)
                            }
                        );

                    }
                );

            }
        );

        window.localStorage.setItem("grades", JSON.stringify(grades));
        console.log("DONE WITH AVERAGE COMPUTING")
        window.dispatchEvent(new Event("compute-averages"));
    });
})();
