"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  const showStar = getStarHTML(story, currentUser);

  return $(`
      <li id="${story.storyId}">
      ${showDeleteBtn ? deleteStoryBtn() : ''}
      ${showStar ? showStar : ''}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>

    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */



function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `<span class="star">
<i class="${starType} fa-star"></i>
</span>`
}

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

function deleteStoryBtn() {
  return `<span class="trash-can">
  <i class="fas fa-trash-alt"></i></span>`
}

async function deleteStory(evt) {
  console.debug("deleteStory");
  const $closestLi = $(evt.target).closest('li');
  const storyId = $closestLi.attr('id');

  await storyList.removeStory(currentUser, storyId);
  //regenerate users story list
  await displayUserStories();

}

$ownStories.on('click', '.trash-can', deleteStory)

async function submitNewStory(evt) {
  console.debug("submitNewStory");
  evt.preventDefault();

  //get all form elements
  const title = $('#create-title').val();
  const url = $("#create-url").val();
  const author = $("#create-author").val();
  const username = currentUser.username;
  const storyData = { title, url, author, username };

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);
}

$submitForm.on("submit", submitNewStory);

/** Users own stories functionality to display or not display users stories */

function displayUserStories() {
  console.debug("displayUserStories");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append('<p>No stories added yet!</p>');
  } else {
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }
}

/** Display favorites list on the page*/

function displayUserFavorites() {
  console.debug("displayUserFavorites");
  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append('<p>No favorites added yet!</p>')
  } else {
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }
  $favoritedStories.show()
}
/** Favorited/un-favorited story toggling functionality */

async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  // see if the item is already favorited (checking by presence of star)
  if ($tgt.hasClass("fas")) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}

$storiesLists.on("click", ".star", toggleStoryFavorite);