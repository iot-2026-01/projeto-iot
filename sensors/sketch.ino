// ============================================================
//  Sistema Inteligente de Balanceamento Dinamico de Carga
//  ESP32 (MQTT + Wi-Fi) ou Arduino Uno (somente serial)
//
//  ESP32 pin map:
//    34/35/32  – Current sensors
//    21/22     – I2C LCD (SDA/SCL)
//    25/26/27  – Relay IN1/IN2/IN3  (LOW = relay ON)
//    18/19/23  – Status LEDs
//    5         – Buzzer
//    12/13/14  – Push buttons
//
//  Uno pin map: A0-A2, A4/A5, D2-D4, D6-D12 (sem MQTT)
// ============================================================

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#if defined(ARDUINO_ARCH_ESP32)
#include <WiFi.h>
#include <PubSubClient.h>
#define USE_MQTT 1
#endif

#if __has_include("secrets.h")
#include "secrets.h"
#else
#define WIFI_SSID         "Wokwi-GUEST"
#define WIFI_PASSWORD     ""
#define MQTT_BROKER       "broker.hivemq.com"
#define MQTT_PORT         1883
#define MQTT_USER         ""
#define MQTT_PASSWORD     ""
#define MQTT_TOPIC_PREFIX "projeto-iot"
#define DEVICE_ID         "balancer-01"
#endif

// ── LCD ──────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ── Pin definitions ──────────────────────────────────────────
#if defined(ARDUINO_ARCH_ESP32)
const uint8_t SENSOR_PINS[3] = {34, 35, 32};
const uint8_t RELAY_PINS[3]  = {25, 26, 27};
const uint8_t LED_PINS[3]    = {18, 19, 23};
const uint8_t PIN_BUZZER     = 5;
const uint8_t BTN_OVERRIDE   = 12;
const uint8_t BTN_RESET      = 13;
const uint8_t BTN_MODE       = 14;
const int16_t ADC_CENTER     = 2048;
const float   AMPS_PER_COUNT = 0.007325f;
#else
const uint8_t SENSOR_PINS[3] = {A0, A1, A2};
const uint8_t RELAY_PINS[3]  = {2,  3,  4};
const uint8_t LED_PINS[3]    = {6,  7,  8};
const uint8_t PIN_BUZZER     = 9;
const uint8_t BTN_OVERRIDE   = 10;
const uint8_t BTN_RESET      = 11;
const uint8_t BTN_MODE       = 12;
const int16_t ADC_CENTER     = 512;
const float   AMPS_PER_COUNT = 0.0293f;
#endif

// ── Calibration ──────────────────────────────────────────────
const float OVERLOAD_THRESHOLD = 10.0;
const float HYSTERESIS         = 1.5;

// ── Sampling ─────────────────────────────────────────────────
const uint16_t SAMPLES            = 200;
const uint32_t SAMPLE_INTERVAL_US = 100;

// ── Timing ───────────────────────────────────────────────────
const uint32_t DISPLAY_MS      = 500;
const uint32_t BUZZER_ON_MS    = 80;
const uint32_t BUZZER_OFF_MS   = 420;
const uint32_t LOG_INTERVAL_MS = 1000;

// ── State ────────────────────────────────────────────────────
float    current_rms[3]        = {0, 0, 0};
bool     overload[3]           = {false, false, false};
bool     relay_state[3]        = {false, false, false};
bool     manual_override       = false;
uint8_t  display_mode          = 0;

uint32_t last_display_ms       = 0;
uint32_t last_log_ms           = 0;
uint32_t buzzer_timer          = 0;
bool     buzzer_beeping        = false;
bool     any_overload_active   = false;

uint32_t total_overload_events = 0;
uint32_t redistribution_count  = 0;

#if USE_MQTT
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);
char         mqtt_topic[80];
uint32_t     last_mqtt_retry_ms = 0;
bool         mqtt_connected     = false;
const uint32_t MQTT_RETRY_MS    = 5000;
#endif

// ── Button debounce ──────────────────────────────────────────
struct Button {
  uint8_t  pin;
  bool     last_state;
  uint32_t last_change_ms;
};

Button btn_override = {BTN_OVERRIDE, HIGH, 0};
Button btn_reset    = {BTN_RESET,    HIGH, 0};
Button btn_mode     = {BTN_MODE,     HIGH, 0};

const uint32_t DEBOUNCE_MS = 50;

// ── Forward declarations ─────────────────────────────────────
void log_serial();
#if USE_MQTT
void setup_wifi();
void setup_mqtt();
bool connect_mqtt();
void publish_mqtt();
void ensure_mqtt(uint32_t now);
#endif

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  Serial.println(F("=== Energy Balancing System v2.0 ==="));
  Serial.println(F("Ch,Current_A,Overload,Relay"));

  lcd.init();
  lcd.backlight();
  lcd.print(F("Energy Balancer"));
  lcd.setCursor(0, 1);
  lcd.print(F("  Initializing.."));
  delay(1500);
  lcd.clear();

  for (uint8_t i = 0; i < 3; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    pinMode(LED_PINS[i],   OUTPUT);
    digitalWrite(RELAY_PINS[i], HIGH);
    digitalWrite(LED_PINS[i],   LOW);
  }

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  pinMode(BTN_OVERRIDE, INPUT_PULLUP);
  pinMode(BTN_RESET,    INPUT_PULLUP);
  pinMode(BTN_MODE,     INPUT_PULLUP);

#if USE_MQTT
  setup_wifi();
  setup_mqtt();
  connect_mqtt();
#endif

  Serial.println(F("Ready."));
}

// ============================================================
//  MAIN LOOP
// ============================================================
void loop() {
  uint32_t now = millis();

  for (uint8_t ch = 0; ch < 3; ch++)
    current_rms[ch] = measure_rms(SENSOR_PINS[ch]);

  for (uint8_t ch = 0; ch < 3; ch++) {
    if (!overload[ch] && current_rms[ch] >= OVERLOAD_THRESHOLD) {
      overload[ch] = true;
      total_overload_events++;
    } else if (overload[ch] && current_rms[ch] < (OVERLOAD_THRESHOLD - HYSTERESIS)) {
      overload[ch] = false;
    }
  }

  any_overload_active = false;
  for (uint8_t ch = 0; ch < 3; ch++)
    if (overload[ch]) any_overload_active = true;

  if (!manual_override) redistribute_load();

  for (uint8_t ch = 0; ch < 3; ch++)
    digitalWrite(LED_PINS[ch], overload[ch] ? HIGH : LOW);

  handle_buzzer(now);
  handle_buttons(now);

#if USE_MQTT
  ensure_mqtt(now);
#endif

  if (now - last_display_ms >= DISPLAY_MS) {
    last_display_ms = now;
    update_display();
  }

  if (now - last_log_ms >= LOG_INTERVAL_MS) {
    last_log_ms = now;
    log_serial();
#if USE_MQTT
    publish_mqtt();
#endif
  }
}

// ============================================================
//  RMS MEASUREMENT
// ============================================================
float measure_rms(uint8_t pin) {
  long     sum_sq = 0;
  uint16_t raw;
  int16_t  centered;

  for (uint16_t n = 0; n < SAMPLES; n++) {
    raw      = analogRead(pin);
    centered = (int16_t)raw - ADC_CENTER;
    sum_sq  += (long)centered * centered;
    delayMicroseconds(SAMPLE_INTERVAL_US);
  }

  float rms_counts = sqrt((float)sum_sq / SAMPLES);
  return rms_counts * AMPS_PER_COUNT;
}

// ============================================================
//  LOAD REDISTRIBUTION
// ============================================================
void redistribute_load() {
  for (uint8_t ch = 0; ch < 3; ch++) {
    if (overload[ch] && !relay_state[ch]) {
      relay_state[ch] = true;
      digitalWrite(RELAY_PINS[ch], LOW);
      redistribution_count++;
      Serial.print(F("ACTION: Load cut on channel "));
      Serial.println(ch + 1);
    } else if (!overload[ch] && relay_state[ch]) {
      relay_state[ch] = false;
      digitalWrite(RELAY_PINS[ch], HIGH);
      Serial.print(F("ACTION: Load restored on channel "));
      Serial.println(ch + 1);
    }
  }
}

// ============================================================
//  BUZZER
// ============================================================
void handle_buzzer(uint32_t now) {
  if (!any_overload_active) {
    digitalWrite(PIN_BUZZER, LOW);
    buzzer_beeping = false;
    buzzer_timer   = now;
    return;
  }

  uint32_t elapsed = now - buzzer_timer;

  if (buzzer_beeping && elapsed >= BUZZER_ON_MS) {
    digitalWrite(PIN_BUZZER, LOW);
    buzzer_beeping = false;
    buzzer_timer   = now;
  } else if (!buzzer_beeping && elapsed >= BUZZER_OFF_MS) {
    digitalWrite(PIN_BUZZER, HIGH);
    buzzer_beeping = true;
    buzzer_timer   = now;
  }
}

// ============================================================
//  BUTTONS
// ============================================================
bool button_pressed(Button &btn, uint32_t now) {
  bool state = digitalRead(btn.pin);
  if (state != btn.last_state && (now - btn.last_change_ms) >= DEBOUNCE_MS) {
    btn.last_state     = state;
    btn.last_change_ms = now;
    if (state == LOW) return true;
  }
  return false;
}

void handle_buttons(uint32_t now) {
  if (button_pressed(btn_override, now)) {
    manual_override = !manual_override;
    if (manual_override) {
      Serial.println(F("BTN: Manual override ENABLED"));
      for (uint8_t ch = 0; ch < 3; ch++) {
        relay_state[ch] = true;
        digitalWrite(RELAY_PINS[ch], LOW);
      }
    } else {
      Serial.println(F("BTN: Manual override DISABLED"));
    }
  }

  if (button_pressed(btn_reset, now)) {
    Serial.println(F("BTN: Reset"));
    manual_override = false;
    for (uint8_t ch = 0; ch < 3; ch++) {
      overload[ch]    = false;
      relay_state[ch] = false;
      digitalWrite(RELAY_PINS[ch], HIGH);
      digitalWrite(LED_PINS[ch],   LOW);
    }
    digitalWrite(PIN_BUZZER, LOW);
  }

  if (button_pressed(btn_mode, now)) {
    display_mode = (display_mode + 1) % 3;
    lcd.clear();
    last_display_ms = 0;
  }
}

// ============================================================
//  LCD DISPLAY
// ============================================================
void print_channel_short(uint8_t ch) {
  lcd.print((char)('A' + ch));
  lcd.print(':');
  if (current_rms[ch] < 10.0) lcd.print(' ');
  lcd.print(current_rms[ch], 1);
  lcd.print(overload[ch] ? '!' : 'A');
}

void update_display() {
  uint8_t col;

  switch (display_mode) {

    case 0:
      lcd.setCursor(0, 0);
      print_channel_short(0);
      lcd.print(' ');
      print_channel_short(1);
      lcd.print(' ');

      lcd.setCursor(0, 1);
      print_channel_short(2);
      if (manual_override) {
        lcd.print(F(" [OVR]  "));
        lcd.print(' ');
#if USE_MQTT
      } else if (!mqtt_connected) {
        lcd.print(F(" [MQTT?] "));
#endif
      } else {
        lcd.print(F("         "));
      }
      break;

    case 1:
      lcd.setCursor(0, 0);
      lcd.print(F("Relays: "));
      for (uint8_t ch = 0; ch < 3; ch++) {
        lcd.print(relay_state[ch] ? 'X' : 'O');
        if (ch < 2) lcd.print(' ');
      }
      lcd.print(F("   "));

      lcd.setCursor(0, 1);
      lcd.print(any_overload_active
        ? F("!! OVERLOAD !!  ")
        : F("System normal   "));
      break;

    case 2:
      lcd.setCursor(0, 0);
      lcd.print(F("Eventos:"));
      col = 8;
      if      (total_overload_events < 10)    { lcd.print(F("       ")); col += 7; }
      else if (total_overload_events < 100)   { lcd.print(F("      ")); col += 6; }
      else if (total_overload_events < 1000)  { lcd.print(F("     ")); col += 5; }
      else if (total_overload_events < 10000) { lcd.print(F("    ")); col += 4; }
      else                                    { lcd.print(F("   ")); col += 3; }
      lcd.print(total_overload_events);

      lcd.setCursor(0, 1);
      lcd.print(F("Redistrib:"));
      col = 10;
      if      (redistribution_count < 10)   { lcd.print(F("    ")); col += 4; }
      else if (redistribution_count < 100)  { lcd.print(F("   ")); col += 3; }
      else if (redistribution_count < 1000) { lcd.print(F("  ")); col += 2; }
      else                                  { lcd.print(' '); col += 1; }
      lcd.print(redistribution_count);
      break;
  }
}

// ============================================================
//  SERIAL LOG  (CSV)
// ============================================================
void log_serial() {
  for (uint8_t ch = 0; ch < 3; ch++) {
    Serial.print(ch + 1);       Serial.print(',');
    Serial.print(current_rms[ch], 2); Serial.print(',');
    Serial.print(overload[ch] ? 1 : 0);    Serial.print(',');
    Serial.println(relay_state[ch] ? 1 : 0);
  }
  if (manual_override)
    Serial.println(F("# Manual override active"));
}

// ============================================================
//  MQTT  (ESP32 only)
// ============================================================
#if USE_MQTT

void setup_wifi() {
  lcd.setCursor(0, 1);
  lcd.print(F(" Wi-Fi...       "));
  Serial.print(F("Wi-Fi: connecting to "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint8_t attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(250);
    Serial.print('.');
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("Wi-Fi: connected, IP "));
    Serial.println(WiFi.localIP());
    lcd.setCursor(0, 1);
    lcd.print(F(" Wi-Fi OK       "));
    delay(800);
  } else {
    Serial.println(F("Wi-Fi: connection failed"));
    lcd.setCursor(0, 1);
    lcd.print(F(" Wi-Fi FAIL     "));
    delay(1500);
  }
  lcd.clear();
}

void setup_mqtt() {
  snprintf(mqtt_topic, sizeof(mqtt_topic), "%s/%s/telemetria",
           MQTT_TOPIC_PREFIX, DEVICE_ID);
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(512);
}

bool connect_mqtt() {
  if (WiFi.status() != WL_CONNECTED) return false;

  Serial.print(F("MQTT: connecting to "));
  Serial.print(MQTT_BROKER);
  Serial.print(':');
  Serial.println(MQTT_PORT);

  bool ok;
  if (strlen(MQTT_USER) > 0) {
    ok = mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASSWORD);
  } else {
    ok = mqttClient.connect(DEVICE_ID);
  }

  if (ok) {
    mqtt_connected = true;
    Serial.print(F("MQTT: connected, topic "));
    Serial.println(mqtt_topic);
    mqttClient.publish(mqtt_topic, "{\"status\":\"online\"}", true);
    return true;
  }

  mqtt_connected = false;
  Serial.print(F("MQTT: failed, rc="));
  Serial.println(mqttClient.state());
  return false;
}

void ensure_mqtt(uint32_t now) {
  if (mqttClient.connected()) {
    mqttClient.loop();
    mqtt_connected = true;
    return;
  }

  mqtt_connected = false;
  if (now - last_mqtt_retry_ms < MQTT_RETRY_MS) return;
  last_mqtt_retry_ms = now;
  connect_mqtt();
}

void publish_mqtt() {
  if (!mqttClient.connected()) return;

  char payload[480];
  int len = snprintf(payload, sizeof(payload),
    "{"
      "\"device\":\"%s\","
      "\"uptime_ms\":%lu,"
      "\"override\":%s,"
      "\"any_overload\":%s,"
      "\"events\":%lu,"
      "\"redistributions\":%lu,"
      "\"channels\":["
        "{\"id\":1,\"current_a\":%.2f,\"overload\":%s,\"relay\":%s},"
        "{\"id\":2,\"current_a\":%.2f,\"overload\":%s,\"relay\":%s},"
        "{\"id\":3,\"current_a\":%.2f,\"overload\":%s,\"relay\":%s}"
      "]"
    "}",
    DEVICE_ID,
    millis(),
    manual_override ? "true" : "false",
    any_overload_active ? "true" : "false",
    total_overload_events,
    redistribution_count,
    current_rms[0], overload[0] ? "true" : "false", relay_state[0] ? "true" : "false",
    current_rms[1], overload[1] ? "true" : "false", relay_state[1] ? "true" : "false",
    current_rms[2], overload[2] ? "true" : "false", relay_state[2] ? "true" : "false"
  );

  if (len < 0 || len >= (int)sizeof(payload)) {
    Serial.println(F("MQTT: payload too large"));
    return;
  }

  if (mqttClient.publish(mqtt_topic, payload, false)) {
    Serial.print(F("MQTT: published to "));
    Serial.println(mqtt_topic);
  } else {
    Serial.println(F("MQTT: publish failed"));
    mqtt_connected = false;
  }
}

#endif
