// Since this example code uses the p5 collide2d library, be sure to remind
// students to load it in. Model how to do this by either connecting a local
// copy (included in the templates), connecting a hosted copy through a CDN, or
// (as a last resort) by pasting it in its entirety in this script as the first
// line.
/* global createCanvas, colorMode, HSB, width, height, random, background, fill, noFill, color, random,
          rect, ellipse, stroke, image, loadImage, frameRate, collideRectRect, collideRectCircle, text,
          mouseX, mouseY, strokeWeight, line, mouseIsPressed, windowWidth, windowHeight, noStroke,
          keyCode, UP_ARROW, LEFT_ARROW, RIGHT_ARROW, DOWN_ARROW, textSize, noLoop, loop, round 
          ml5 createCapture VIDEO classifyVideo */

let backgroundColor,
  playerSnake,
  currentApple,
  score,
  segment,
  fr,
  obstacles,
  video,
  classifier,
  flippedVideo;
let label = "waiting...";

function preload() {
  classifier = ml5.imageClassifier(
    "https://teachablemachine.withgoogle.com/models/1iaccE-Pl/model.json"
  );
}
function setup() {
  // Canvas & color settings
  width = 896;
  height = 672;
  fr = 12;
  createCanvas(width, height);

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  flippedVideo = ml5.flipImage(video);
  // Start classifying
  classifyVideo();

  colorMode(HSB, 360, 100, 100);
  backgroundColor = 95;
  frameRate(fr);

  obstacles = [];
  for (let i = 0; i < 3; i++) {
    obstacles.push(new Obstacle());
  }

  playerSnake = new Snake();
  currentApple = new Apple();
  score = 0;
}

function draw() {
  background(backgroundColor);
  image(flippedVideo, 0, 0);
  textSize(30)
  text(label, 20, 80)

  // The snake performs the following four methods:
  playerSnake.moveSelf();
  playerSnake.showSelf();
  playerSnake.checkCollisions();
  playerSnake.checkApples();
  playerSnake.checkObstacles();
  // The apple needs fewer methods to show up on screen.
  currentApple.showSelf();
  obstacles.forEach(obstacle => obstacle.showSelf());
  // We put the score in its own function for readability.
  displayScore();
}

// Get a prediction for the current video frame
function classifyVideo() {
  flippedVideo = ml5.flipImage(video);
  classifier.classify(flippedVideo, gotResult);
  flippedVideo.remove();
}

// When we get a result
function gotResult(error, results) {
  // If there is an error
  if (error) {
    console.error(error);
    return;
  }
  // The results are in an array ordered by confidence.
  // console.log(results[0]);
  label = results[0].label;
  // Classifiy again!
  controlSnake();
  classifyVideo();
}

function displayScore() {
  text(`Score: ${score}`, 20, 40);
}

class Snake {
  constructor() {
    this.size = 30;
    this.x = width / 2;
    this.y = height - 30;
    this.direction = "N";
    this.speed = 12;

    this.tail = [new TailSegment(this.x, this.y)];
  }

  moveSelf() {
    if (this.direction === "N") {
      this.y -= this.speed;
    } else if (this.direction === "S") {
      this.y += this.speed;
    } else if (this.direction === "E") {
      this.x += this.speed;
    } else if (this.direction === "W") {
      this.x -= this.speed;
    } else {
      console.log("Error: invalid direction");
    }

    this.tail.unshift(new TailSegment(this.x, this.y));
    this.tail.pop();
  }

  showSelf() {
    if (this.y <= 0) {
      this.y = height;
    } else if (this.y >= height) {
      this.y = 0;
    }
    if (this.x <= 0) {
      this.x = width;
    } else if (this.x >= width) {
      this.x = 0;
    }

    for (let i = 0; i < this.tail.length; i++) {
      segment = this.tail[i];
      segment.showSelf();
    }
  }

  checkApples() {
    if (
      collideRectCircle(
        this.x,
        this.y,
        this.size,
        this.size,
        currentApple.x,
        currentApple.y,
        currentApple.size
      )
    ) {
      score++;
      currentApple = new Apple();
      this.extendTail();
      fr++;
    }
  }

  checkCollisions() {
    if (this.tail.length <= 2) {
      return;
    }

    for (let i = 1; i < this.tail.length; i++) {
      let tailSegment = this.tail[i];
      if (
        collideRectRect(
          this.x,
          this.y,
          this.size,
          this.size,
          tailSegment.x,
          tailSegment.y,
          tailSegment.size,
          tailSegment.size
        )
      ) {
        gameOver();
      }
    }
  }

  checkObstacles() {
    obstacles.forEach(obstacle => {
      if (
        collideRectRect(
          this.x,
          this.y,
          this.size,
          this.size,
          obstacle.x,
          obstacle.y,
          obstacle.size,
          obstacle.size
        )
      ) {
        gameOver();
      }
    });
  }

  extendTail() {
    this.tail.push(new TailSegment(this.x, this.y));
  }
}

class Apple {
  constructor() {
    this.x = random(10, width - 10);
    this.y = random(10, height - 10);
    this.size = 25;
  }

  showSelf() {
    fill("red");
    ellipse(this.x, this.y, this.size);
  }
}

class Obstacle {
  constructor() {
    this.x = random(10, width - 10);
    this.y = random(10, height - 10);
    this.size = 40;
  }

  showSelf() {
    fill("green");
    rect(this.x, this.y, this.size, this.size);
  }
}

class TailSegment {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
  }
  showSelf() {
    fill("blue");
    rect(this.x, this.y, this.size, this.size);
  }
}

function controlSnake() {
  if (label === 'up' && playerSnake.direction != "S") {
    playerSnake.direction = "N";
  } else if (label === 'down' && playerSnake.direction != "N") {
    playerSnake.direction = "S";
  } else if (label === 'right' && playerSnake.direction != "W") {
    playerSnake.direction = "E";
  } else if (label === 'left' && playerSnake.direction != "E") {
    playerSnake.direction = "W";
  }
}

function restartGame() {
  score = 0;
  playerSnake = new Snake();
  currentApple = new Apple();

  // Resume draw loop
  loop();
}

function gameOver() {
  console.log("GAME OVER!");
  stroke(0);
  text("GAME OVER", 50, 50);

  // Pause draw loop
  noLoop();
}
