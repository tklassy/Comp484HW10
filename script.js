// hw10 additions
//
// info - selected actions
// warning - resources reaching 25% or lower
// error - actions rejected due to insufficient resources
// log and group - completed actions and stat changes
// custom and table - resources reaching 100%
// browser errors - unfinished couch climbing action

// get a copy of the current pet stats
function hw10Stats() {
  return {
    weight: pet_info.weight,
    energy: pet_info.energy,
    sleep: pet_info.sleep,
    happiness: pet_info.happiness,
  };
}

// log the selected action
function hw10LogAction(action) {
  console.info("[KitKat] Action selected: " + action);
}

// log a rejected action
function hw10LogRejection(action, rejection) {
  // being full or rested is not an insufficient resource error
  if (
    rejection === "Full. Exercise." ||
    rejection === "Rested. Play or exercise."
  ) {
    console.info("[KitKat] " + action + " declined: " + rejection);
  } else {
    console.error("[KitKat] " + action + " rejected: " + rejection);
  }
}

// log a successful action and group the stat changes
function hw10LogSuccess(action, beforeStats, afterStats) {
  console.log("[KitKat] " + action + " complete.");

  console.group("[KitKat] " + action + " stats");
  console.log("Before:", beforeStats);
  console.log("After:", afterStats);
  console.groupEnd();
}

// check for low and maxed resources
function hw10CheckStats(beforeStats, afterStats) {
  var maxed = false;

  var needs = {
    weight: "Eat.",
    energy: "Eat or sleep.",
    sleep: "Sleep.",
    happiness: "Play.",
  };

  statNames.forEach(function (stat) {
    var value = afterStats[stat];

    // warn when a stat reaches or crosses the low threshold
    if (beforeStats[stat] > 25 && value <= 25) {
      console.warn(
        "[KitKat] " + stat + " low: " + value + "/100. " + needs[stat],
      );
    }

    // use custom styling when a stat reaches its maximum
    if (beforeStats[stat] < 100 && value === 100) {
      console.log(
        "%c[KitKat] " + stat + " maxed. Do something else.",
        "color: #27473f; background: #edf0e7; font-weight: bold; padding: 4px 8px;",
      );

      maxed = true;
    }
  });

  // show all current stats if any resource reached its maximum
  if (maxed) {
    console.table(afterStats);
  }
}

// unfinished couch climbing action
function hw10ClimbCouch() {
  if (busy) return;

  var thisAction = ++actionNumber;

  hw10LogAction("climb");
  setBusy(true);
  $("#message").text("Fine.");

  // this is where climbing would find the couch and calculate its location
  // the couch is part of the background and has no html element
  // intentionally keep searching for up to 4.5 seconds to cause a violation
  var searchStart = performance.now();
  var couch = document.getElementById("couch");

  while (!couch && performance.now() - searchStart < 4500) {
    couch = document.getElementById("couch");
  }

  // use the approximate couch position after the search times out
  setPose("left");
  $image.addClass("bob");

  $pet
    .animate({ left: "45%", top: "45%" }, duration(1000))
    .queue(function (next) {
      // intentionally request a missing image to cause a 404
      var missingImage = new Image();
      missingImage.src = "images/kitkatClimb.png";

      $("#message").text("Not implemented.");

      // intentionally access an undefined activity to cause a typeerror
      // run separately so the error does not interrupt the animation queue
      setTimeout(function () {
        if (thisAction !== actionNumber) return;

        var climbPose = activities.climb.pose;
      }, 0);

      next();
    })
    .delay(duration(700))
    .queue(function (next) {
      setPose("right");
      next();
    })
    .animate(home, duration(1000));

  // restore the original pet state
  $pet.promise().done(function () {
    if (thisAction !== actionNumber) return;

    $image.removeClass("bob shake");
    $pet.css(home);
    setPose("sit");
    setBusy(false);
  });
}

// project 2 - gigapet

// pet name and starting stat values
var pet_info = {
  name: "Kit-Kat",
  weight: 70,
  energy: 70,
  sleep: 70,
  happiness: 70,
};

var statNames = ["weight", "energy", "sleep", "happiness"];
var home = { left: "50%", top: "72%" };
var busy = false;
var actionNumber = 0;
var $pet, $image;

// cat images
var poses = {
  sit: "kitkatSit.png",
  stand: "kitkatStand.png",
  left: "kitkatLeft.png",
  right: "kitkatRight.png",
  play: "kitkatPlay.png",
  workout: "kitkatWorkout.png",
  sleep: "kitkatSleep.png",
};

// x and y give each task's position as percentages of the room
// changes follow this order: weight, energy, sleep, happiness
var activities = {
  treat: { x: 62, y: 60, pose: "stand", changes: [12, 8, 0, 5] },
  play: { x: 53, y: 83, pose: "play", changes: [-3, -12, -5, 15] },
  exercise: { x: 28, y: 61, pose: "workout", changes: [-7, -20, -10, -5] },
  sleep: { x: 82, y: 46, pose: "sleep", changes: [-3, 20, 30, 5] },
};

$(function () {
  $pet = $("#pet");
  $image = $("#pet-image");

  $("#pet-name").text(pet_info.name);
  updateStats();

  // handle clicks on the action buttons and room props
  $("[data-action]").on("click", function () {
    var action = $(this).attr("data-action");

    // hw10 - route the unfinished action separately
    if (action === "climb") {
      hw10ClimbCouch();
    } else {
      startAction(action);
    }
  });

  $("#reset").on("click", resetPet);

  $("#scene").on("dragstart", function (event) {
    event.preventDefault();
  });

  // load the cat images before an action uses them
  Object.keys(poses).forEach(function (pose) {
    var image = new Image();
    image.src = "images/" + poses[pose];
  });
});

// skip animation time when reduced motion is enabled
function duration(ms) {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
}

// change the image and the pose used by the css
function setPose(pose) {
  $pet.attr("data-pose", pose);
  $image.attr({ src: "images/" + poses[pose], alt: "Kit-Kat: " + pose });
}

// lock the action controls while a trip is running
function setBusy(value) {
  busy = value;
  $("[data-action]").prop("disabled", value);
}

// update the pet stats
function updateStats() {
  // keep every stat within 0 to 100, then update its number and meter
  statNames.forEach(function (stat) {
    pet_info[stat] = Math.max(0, Math.min(100, pet_info[stat]));

    $("#" + stat + "-value").text(pet_info[stat]);
    $("#" + stat).val(pet_info[stat]);
  });
}

// check if kit-kat can perform the action
function getRejection(action) {
  if (action === "treat") {
    return pet_info.weight >= 95 ? "Full. Exercise." : "";
  }

  if (action === "sleep") {
    if (pet_info.weight < 5) return "Hungry. Eat first.";

    if (pet_info.sleep >= 95 && pet_info.energy >= 95)
      return "Rested. Play or exercise.";

    return "";
  }

  // exercise needs more food and rest than playing does
  var exercise = action === "exercise";

  if (pet_info.weight < (exercise ? 15 : 5)) return "Hungry. Eat.";

  if (pet_info.energy < (exercise ? 25 : 15))
    return "Low energy. Eat or sleep.";

  if (pet_info.sleep < (exercise ? 20 : 10)) return "Tired. Sleep.";

  return "";
}

// perform the selected action
function startAction(action) {
  if (busy || !activities[action]) return;

  var task = activities[action];
  var rejection = getRejection(action);
  var thisAction = ++actionNumber;

  // hw10 - save the starting stats and log the selected action
  var beforeStats = hw10Stats();
  hw10LogAction(action);

  setBusy(true);
  $("#message").text(rejection || "Fine.");

  if (rejection) {
    // hw10 - log the reason the action was rejected
    hw10LogRejection(action, rejection);

    // wait for the short shake; rejected actions do not change stats
    setPose("stand");
    $image.addClass("shake");
    $pet.delay(duration(450));
  } else {
    setPose(task.x < 50 ? "left" : "right");
    $image.addClass("bob");

    // one second out, two seconds doing the task, one second home
    $pet
      .animate({ left: task.x + "%", top: task.y + "%" }, duration(1000))
      .queue(function (next) {
        setPose(task.pose);
        next();
      })
      .delay(duration(2000))
      .queue(function (next) {
        setPose(task.x < 50 ? "right" : "left");
        next();
      })
      .animate(home, duration(1000));
  }

  // wait until the queued movement and delays finish
  $pet.promise().done(function () {
    // ignore the result if reset canceled this action
    if (thisAction !== actionNumber) return;

    $image.removeClass("bob shake");
    $pet.css(home);
    setPose("sit");

    if (!rejection) {
      // apply the stat changes for the completed action
      statNames.forEach(function (stat, index) {
        pet_info[stat] += task.changes[index];
      });

      updateStats();

      // hw10 - log the completed action and check the stat thresholds
      var afterStats = hw10Stats();

      hw10LogSuccess(action, beforeStats, afterStats);
      hw10CheckStats(beforeStats, afterStats);

      $("#message").text("Done.");
    }

    setBusy(false);
  });
}

// reset kit-kat to the starting state
function resetPet() {
  // mark the action as canceled before clearing its queue
  actionNumber += 1;

  // remove waiting steps, then stop the step currently running
  $pet.clearQueue().stop();

  $image.removeClass("bob shake");
  $pet.css(home);
  setPose("sit");

  statNames.forEach(function (stat) {
    pet_info[stat] = 70;
  });

  updateStats();
  setBusy(false);

  $("#message").text("Ready.");
}
