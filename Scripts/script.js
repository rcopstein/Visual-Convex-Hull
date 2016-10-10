// Variables

var pointSize = 5;

var points = [];
var lineSteps = [];
var lineStepsCount = 0;

// Functions

function polarAngle(origin, point)
{
  // Get the difference

  var diff = {
    x: point.x - origin.x,
    y: point.y - origin.y
  }

  // Get the angle
  // Note that the Y axis is inverted on the canvas' coordinate system
  // That's why we invert the Y difference

  var angle = Math.atan2(-diff.y, diff.x);

  // Atan2 will return a number from -PI/2 to PI/2
  // Make sure that the result is between 0 and 2*PI

  if (angle < 0) angle += 2 * Math.PI;

  // Return angle

  return angle;

}

function findHull()
{
  // Check if there are enough points

  if (points.length < 3) return;

  // Clear previous line steps

  lineSteps = [];

  // Find the lowest point (the one with the smallest y value)
  // Since the Y-axis is inverted, find the one with the highest y value

  var lowest = points[0];
  for (i = 1; i < points.length; i++)
  {
    if (points[i].y > lowest.y)
    {
      lowest = points[i];
    }
  }

  // Sort elements by polar angle relative to the lowest point

  points.sort(function(a, b) {

    // Get angles

    var angleA = polarAngle(lowest, a);
    var angleB = polarAngle(lowest, b);

    // Return their difference

    return angleA - angleB;

  });

  // Create Stack and steps array (0 = add, 1 = remove)

  var stack = [];
  stack.push(points[0]);
  stack.push(points[1]);
  stack.push(points[2]);

  var steps = [];
  steps.push({ action: 0, point: points[0] });
  steps.push({ action: 0, point: points[1] });
  steps.push({ action: 0, point: points[2] });

  // Apply the Graham Scan loop
  // Register every addition / removal of points

  for (i = 3; i < points.length; i++)
  {
    var top = stack.pop();
    var next = stack.pop();

    while (polarAngle(next, top) > polarAngle(top, points[i]))
    {
      steps.push({ action: 1, point: top });

      top = next;
      next = stack.pop();
    }
  
    stack.push(next);
    stack.push(top);
    stack.push(points[i]);

    steps.push({ action: 0, point: points[i] });
  }

  // Make sure we end in the starting point

  stack.push(points[0]);
  steps.push({ action: 0, point: points[0] });

  // Define line steps

  var pointSteps = [];

  for (i = 0; i < steps.length; i++)
  {
    var step = steps[i];

    // If a point was added

    if (step.action == 0)
    {
      // If we are not the first point add a line from the last point to this one

      var last = pointSteps.pop();

      if (last)
      {
        lineSteps.push({ action: 0, line: { from: last, to: step.point } });
        pointSteps.push(last);
      }

      pointSteps.push(step.point);
    }

    // If a point was removed

    else
    {
      // Remove the last point and the last line

      lineSteps.push({ action: 1 });
      pointSteps.pop();
    }
  }

  // Assign line count

  lineStepsCount = lineSteps.length;

}

function draw()
{
  // Clear canvas

  context.clearRect(0, 0, canvas.width, canvas.height);

  // Setup colors

  context.fillStyle   = '#000000';
  context.strokeStyle = '#777777';

  // Define lines by lineSteps

  lines = [];
  for (i = 0; i < lineStepsCount; i++)
  {
    var step = lineSteps[i];

    if (step.action == 0)
    {
      lines.push(step.line);
    }
    else
    {
      lines.pop();
    }
  }

  // Draw each line

  for (var i = 0; i < lines.length; i++)
  {
    var line = lines[i];

    context.beginPath();

    context.moveTo(line.from.x, line.from.y);
    context.lineTo(line.to.x, line.to.y);

    context.stroke();
  }

  // Draw each point

  for (var i = 0; i < points.length; i++)
  {
    context.fillRect(points[i].x - (pointSize / 2), points[i].y - (pointSize / 2), pointSize, pointSize);
  }
}

// Setup Components

var canvas         = document.getElementById('MainCanvas');
var clearButton    = document.getElementById('ClearButton');
var nextButton     = document.getElementById('NextStep');
var previousButton = document.getElementById('PreviousStep');
var lastButton     = document.getElementById('LastStep');
var firstButton    = document.getElementById('FirstStep');

var context = canvas.getContext('2d');

canvas.width = canvas.scrollWidth;
canvas.height = canvas.scrollHeight;

// Add event handlers

canvas.addEventListener("click", function (evt) {

  var rect = canvas.getBoundingClientRect();
  var scaleX = canvas.width / rect.width;
  var scaleY = canvas.height / rect.height;

  var point = {
    x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
    y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
  }

  points.push(point);
  findHull();

});

clearButton.addEventListener("click", function(evt) {

  points = [];
  lineSteps = [];
  lineStepsCount = 0;

});

lastButton.addEventListener("click", function(evt) {

  lineStepsCount = lineSteps.length;

});

nextButton.addEventListener("click", function(evt) {

  if (lineStepsCount < lineSteps.length) lineStepsCount++;

});

previousButton.addEventListener("click", function(evt) {

  if (lineStepsCount > 0) lineStepsCount--;

});

firstButton.addEventListener("click", function(evt) {

  lineStepsCount = 0;

});

// Start animation loop

var FPS = 60;
setInterval(function() { draw(); }, 1000/FPS);
