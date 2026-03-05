// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;
const API_BASE = "https://rithm-jeopardy.herokuapp.com/api";

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */
async function getCategoryIds() {
  const res = await axios.get(`${API_BASE}/categories?count=100`);
  let catArray = res.data;
  // Shuffle and pick first NUM_CATEGORIES
  for (let i = catArray.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [catArray[i], catArray[j]] = [catArray[j], catArray[i]];
  }
  return catArray.slice(0, NUM_CATEGORIES).map(cat => cat.id);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */
async function getCategory(catId) {
  const res = await axios.get(`${API_BASE}/category?id=${catId}`);
  let clues = res.data.clues;
  // Shuffle clues and pick first NUM_QUESTIONS_PER_CAT
  for (let i = clues.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [clues[i], clues[j]] = [clues[j], clues[i]];
  }
  let selectedClues = clues.slice(0, NUM_QUESTIONS_PER_CAT).map(clue => ({
    question: clue.question,
    answer: clue.answer,
    showing: null
  }));
  return { title: res.data.title, clues: selectedClues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */
async function fillTable() {
  const $board = $("#jeopardy");
  $board.empty();

  // Header row
  let $thead = $("<thead>");
  let $tr = $("<tr>");
  for (let cat of categories) {
    $tr.append($("<th>").text(cat.title));
  }
  $thead.append($tr);
  $board.append($thead);

  // Body rows
  let $tbody = $("<tbody>");
  for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
    let $tr = $("<tr>");
    for (let j = 0; j < NUM_CATEGORIES; j++) {
      let $td = $("<td>")
        .attr("data-row", i)
        .attr("data-col", j)
        .addClass("clue-cell")
        .text("?");
      $tr.append($td);
    }
    $tbody.append($tr);
  }
  $board.append($tbody);
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */
function handleClick(evt) {
  let $cell = $(evt.target);
  let row = $cell.data("row");
  let col = $cell.data("col");
  let clue = categories[col].clues[row];

  if (clue.showing === null) {
    clue.showing = "question";
    $cell.text(clue.question);
  } else if (clue.showing === "question") {
    clue.showing = "answer";
    $cell.text(clue.answer);
  }
  // If already showing answer, do nothing
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
  $("#jeopardy").html("<tr><td colspan='6'>Loading...</td></tr>");
  $("#restart").prop("disabled", true).text("Loading...");
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
  $("#restart").prop("disabled", false).text("Restart");
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */
async function setupAndStart() {
  showLoadingView();
  categories = [];
  let catIds = await getCategoryIds();
  for (let id of catIds) {
    let cat = await getCategory(id);
    categories.push(cat);
  }
  await fillTable();
  hideLoadingView();
}

/** On click of start / restart button, set up game. */
$("#restart").on("click", function () {
  setupAndStart();
});

/** On page load, add event handler for clicking clues */
$(function () {
  $("#jeopardy").on("click", ".clue-cell", handleClick);
  setupAndStart();
});