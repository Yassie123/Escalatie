/*
  Arduino Button Serial Output (Newline) & LED Blink

  Reads a digital input on pin 4.
  Prints '1' (pressed) or '0' (not pressed) to the Serial Monitor on a NEW LINE
  ONLY when the button's state changes.
  Blinks the built-in LED when the button is pressed.
  Assumes a momentary push button is connected between pin 4 and GND.
  Uses the internal pull-up resistor.

  - Button state change from NOT pressed to PRESSED: Pin 4 goes LOW -> Serial sends '1'\n, LED starts blinking.
  - Button state change from PRESSED to NOT pressed: Pin 4 goes HIGH -> Serial sends '0'\n, LED stops blinking and turns OFF.
  - No change in button state: No serial output. LED continues its current behavior (blinking or off).
*/

// Define the pin the button is connected to
const int buttonPin = 4;
// Define the built-in LED pin (usually 13)
const int ledPin = LED_BUILTIN;

// Variable to store the stable, debounced button state
int buttonState = HIGH; // Initialize assuming not pressed (HIGH due to pull-up)
// Variable to store the last raw reading (for debounce)
int lastReading = HIGH;

// Debounce variables
unsigned long lastDebounceTime = 0; // Last time the input pin reading changed
unsigned long debounceDelay = 50;    // Debounce time in ms

// LED Blink variables
unsigned long lastLedToggleTime = 0; // Last time the LED was toggled
unsigned long blinkInterval = 200;   // Blink interval in ms (e.g., 200ms on, 200ms off)
int ledState = LOW;                  // Current state of the LED

void setup() {
  // Initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
  delay(100); // Allow serial to initialize


  // Initialize the button pin as an input with the internal pull-up resistor enabled:
  pinMode(buttonPin, INPUT_PULLUP);

  // Initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW); // Start with LED off

  // Read the initial state to set buttonState correctly
  // and send it once
  buttonState = digitalRead(buttonPin);
  lastReading = buttonState; // Initialize last reading
  if (buttonState == LOW) {
    Serial.println('1'); // '1' will be on the next line
  } else {
    Serial.println('0'); // '0' will be on the next line
  }
}

void loop() {
  // --- Button Reading and Debouncing ---
  int currentReading = digitalRead(buttonPin);

  // If the reading changed, reset the debounce timer
  if (currentReading != lastReading) {
    lastDebounceTime = millis();
  }

  // If the reading has been stable longer than the debounce delay
  if ((millis() - lastDebounceTime) > debounceDelay) {
    // If the stable reading is different from the current button state,
    // then the button state has effectively changed.
    if (currentReading != buttonState) {
      buttonState = currentReading; // Update the stable state

      // --- Serial Output on State Change ---
      // Send the new state via serial ONLY when it changes, each on a new line
      if (buttonState == LOW) {
        Serial.println('1'); // Button has just been pressed, send '1' then newline
      } else {
        Serial.println('0'); // Button has just been released, send '0' then newline
      }
    }
  }
  lastReading = currentReading; // Update last reading for next loop

  // --- LED Control (remains the same) ---
  if (buttonState == LOW) {
    // Button is PRESSED - Blink the LED
    unsigned long currentMillis = millis();
    if (currentMillis - lastLedToggleTime >= blinkInterval) {
      // Time to toggle the LED
      lastLedToggleTime = currentMillis; // Reset the timer
      // Toggle LED state
      if (ledState == LOW) {
        ledState = HIGH;
      } else {
        ledState = LOW;
      }
      // Update the actual LED
      digitalWrite(ledPin, ledState);
    }
  } else {
    // Button is NOT PRESSED - Turn LED off
    if (ledState == HIGH) { // Only write if it's currently on
       digitalWrite(ledPin, LOW);
       ledState = LOW; // Update the state variable
    }
  }

  // --- Loop Delay ---
  // Small delay to keep the loop responsive but not overwhelm the processor.
  delay(5);
}
