#include <DHT.h>

#define TRIG 2
#define ECHO 3
#define DHTPIN 4
#define DHTTYPE DHT11
#define BUZZER 5
#define LDR A0

DHT dht(DHTPIN, DHTTYPE);

unsigned long lastTime = 0;
const unsigned long DELAY_MS = 1000;

void setup() {
  Serial.begin(9600);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(BUZZER, OUTPUT);

  dht.begin();
}

void loop() {
  // 1. Check for incoming serial commands from the Node.js backend to ring Buzzer
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == '1') {
      // Success Beep
      tone(BUZZER, 1000, 150);
      delay(200);
      tone(BUZZER, 1500, 250);
    } else if (cmd == '0') {
      // Error beep
      tone(BUZZER, 300, 600);
    }
  }

  unsigned long now = millis();
  if (now - lastTime >= DELAY_MS) {
    lastTime = now;
    
    // 🔹 Ultrasonic
    digitalWrite(TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);

    long duration = pulseIn(ECHO, HIGH, 30000);
    int distance = 0;
    if (duration > 0) {
      distance = duration * 0.034 / 2;
    }

    // 🔹 DHT11
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    if (isnan(hum) || (isnan(temp))) { hum = 0; temp = 0; }

    // 🔹 LDR
    int lightValue = analogRead(LDR);

    // 🔴 CRITICAL: We MUST print exact JSON format so the Node server can parse it!
    // Do NOT print text like "----- SENSOR DATA -----"
    Serial.print("{\"dist\":");
    Serial.print(distance);
    Serial.print(", \"temp\":");
    Serial.print(temp);
    Serial.print(", \"hum\":");
    Serial.print(hum);
    Serial.print(", \"light\":");
    Serial.print(lightValue);
    Serial.println("}");
  }
}