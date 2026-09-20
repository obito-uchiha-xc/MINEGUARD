/*
  ESP32 DevKit V1 — Sensor Test Sketch
  Sensors:
    1) MPU6500 (Accelerometer + Gyroscope) — I2C
    2) SW-18010P (Vibration / Shock sensor) — Digital
    3) MQ2 (Smoke / Gas sensor) — Analog
    4) DHT22 (Temperature + Humidity) — Digital (1-wire)
    5) Soil Moisture Sensor — Analog
    6) VL53L0X (Time-of-Flight Distance sensor) — I2C

  WIRING
  --------------------------------------------------
  MPU6500 (I2C):
    VCC  -> 3.3V
    GND  -> GND
    SDA  -> GPIO 21
    SCL  -> GPIO 22
    AD0  -> GND (sets I2C address to 0x68)

  VL53L0X (I2C, shares bus with MPU6500):
    VCC -> 3.3V
    GND -> GND
    SDA -> GPIO 21
    SCL -> GPIO 22
    (default address 0x29 — no conflict with MPU6500's 0x68)

  SW-18010P (Vibration sensor, digital output module):
    VCC -> 3.3V (or 5V depending on module, check board)
    GND -> GND
    DO  -> GPIO 27

  MQ2 (Gas/Smoke sensor, analog output):
    VCC -> 5V (MQ2 needs 5V for the heater coil; use VIN pin on DevKit)
    GND -> GND
    AO  -> GPIO 34 (ADC1_CH6)

  DHT22 (Temperature/Humidity sensor):
    VCC  -> 3.3V
    GND  -> GND
    DATA -> GPIO 4  (add 10kΩ pull-up to VCC if using a bare sensor)

  Soil Moisture Sensor (analog output module):
    VCC -> 3.3V
    GND -> GND
    AO  -> GPIO 35 (ADC1_CH7)
  --------------------------------------------------

  Required libraries:
    - "DHT sensor library" by Adafruit (+ "Adafruit Unified Sensor" dependency)
    - "Adafruit VL53L0X" (+ "Adafruit BusIO" dependency)
*/

#include <Wire.h>
#include <DHT.h>
#include <Adafruit_VL53L0X.h>

// ---------------- Pin Definitions ----------------
#define SDA_PIN       21
#define SCL_PIN       22
#define VL53_SDA_PIN  32   // VL53L0X — separate bus
#define VL53_SCL_PIN  33
#define SW18010P_PIN  27
#define MQ2_PIN       34
#define DHT_PIN       4
#define SOIL_PIN      35

// ---------------- DHT22 Setup ----------------
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// ---------------- VL53L0X Setup ----------------
Adafruit_VL53L0X vl53 = Adafruit_VL53L0X();
bool vl53Ready = false;

// ---------------- MPU6500 Registers ----------------
#define MPU6500_ADDR      0x68   // AD0 -> GND
#define REG_PWR_MGMT_1    0x6B
#define REG_WHO_AM_I      0x75
#define REG_ACCEL_XOUT_H  0x3B
#define REG_GYRO_CONFIG   0x1B
#define REG_ACCEL_CONFIG  0x1C

// Scale factors (default full-scale: Accel ±2g, Gyro ±250 dps)
const float ACCEL_SCALE = 16384.0;  // LSB/g
const float GYRO_SCALE  = 131.0;    // LSB/(deg/s)

// ---------------- Soil moisture calibration ----------------
// Adjust these after testing your sensor in fully dry air and in water
const int SOIL_DRY_VALUE = 3000; // raw ADC value in dry soil/air
const int SOIL_WET_VALUE = 1200; // raw ADC value fully submerged in water

// ---------------- Vibration sensor state ----------------
volatile unsigned long vibrationCount = 0;

void IRAM_ATTR onVibration() {
  vibrationCount++;
}

// ---------------- MPU6500 Functions ----------------
void mpu6500Write(uint8_t reg, uint8_t data) {
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(reg);
  Wire.write(data);
  Wire.endTransmission();
}

uint8_t mpu6500Read(uint8_t reg) {
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(reg);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6500_ADDR, (uint8_t)1);
  return Wire.read();
}

bool mpu6500Init() {
  uint8_t whoAmI = mpu6500Read(REG_WHO_AM_I);
  Serial.print("MPU6500 WHO_AM_I: 0x");
  Serial.println(whoAmI, HEX);

  if (whoAmI != 0x70) {
    Serial.println("Warning: WHO_AM_I doesn't match 0x70. Check wiring/AD0 pin.");
  }

  mpu6500Write(REG_PWR_MGMT_1, 0x00);   // Wake up device
  delay(50);
  mpu6500Write(REG_GYRO_CONFIG, 0x00);  // ±250 dps
  mpu6500Write(REG_ACCEL_CONFIG, 0x00); // ±2g
  delay(50);

  return true;
}

void readMPU6500(float &ax, float &ay, float &az, float &gx, float &gy, float &gz) {
  Wire.beginTransmission(MPU6500_ADDR);
  Wire.write(REG_ACCEL_XOUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6500_ADDR, (uint8_t)14);

  int16_t rawAx = (Wire.read() << 8) | Wire.read();
  int16_t rawAy = (Wire.read() << 8) | Wire.read();
  int16_t rawAz = (Wire.read() << 8) | Wire.read();
  Wire.read(); Wire.read(); // skip temperature
  int16_t rawGx = (Wire.read() << 8) | Wire.read();
  int16_t rawGy = (Wire.read() << 8) | Wire.read();
  int16_t rawGz = (Wire.read() << 8) | Wire.read();

  ax = rawAx / ACCEL_SCALE;
  ay = rawAy / ACCEL_SCALE;
  az = rawAz / ACCEL_SCALE;
  gx = rawGx / GYRO_SCALE;
  gy = rawGy / GYRO_SCALE;
  gz = rawGz / GYRO_SCALE;
}

// ---------------- Setup ----------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== ESP32 Sensor Test: MPU6500 + SW-18010P + MQ2 + DHT22 + Soil Moisture + VL53L0X ===");

  // Start I2C bus once — shared by MPU6500 and VL53L0X
  Wire.begin(SDA_PIN, SCL_PIN);
  delay(100);

  mpu6500Init();

  // VL53L0X init
  if (vl53.begin(VL53L0X_I2C_ADDR, true, &Wire)) {
    vl53Ready = true;
    Serial.println("VL53L0X initialized successfully.");
  } else {
    Serial.println("Failed to detect VL53L0X. Check wiring/address.");
  }

  pinMode(SW18010P_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(SW18010P_PIN), onVibration, RISING);

  pinMode(MQ2_PIN, INPUT);
  analogSetPinAttenuation(MQ2_PIN, ADC_11db); // allows full 0-3.3V range reading

  pinMode(SOIL_PIN, INPUT);
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);

  dht.begin();

  Serial.println("Warming up MQ2 sensor (20s)... keep sensor powered and idle.");
  for (int i = 20; i > 0; i--) {
    Serial.print(i); Serial.print("s ");
    delay(1000);
  }
  Serial.println("\nWarm-up complete. Starting readings...\n");
}

// ---------------- Loop ----------------
void loop() {
  // ---- MPU6500 ----
  float ax, ay, az, gx, gy, gz;
  readMPU6500(ax, ay, az, gx, gy, gz);

  Serial.println("---------------------------------------------------");
  Serial.println("[MPU6500]");
  Serial.printf("  Accel (g):   X=%.3f  Y=%.3f  Z=%.3f\n", ax, ay, az);
  Serial.printf("  Gyro (dps):  X=%.3f  Y=%.3f  Z=%.3f\n", gx, gy, gz);

  // ---- SW-18010P ----
  Serial.println("[SW-18010P Vibration Sensor]");
  Serial.printf("  Vibration events detected: %lu\n", vibrationCount);
  Serial.printf("  Current pin state: %d\n", digitalRead(SW18010P_PIN));

  // ---- MQ2 ----
  int mq2Raw = analogRead(MQ2_PIN);
  float mq2Voltage = mq2Raw * (3.3 / 4095.0);
  Serial.println("[MQ2 Gas Sensor]");
  Serial.printf("  Raw ADC: %d   Voltage: %.2fV\n", mq2Raw, mq2Voltage);
  if (mq2Voltage > 1.5) {
    Serial.println("  >> Gas/Smoke level HIGH — possible leak or smoke detected!");
  } else {
    Serial.println("  >> Gas/Smoke level normal.");
  }

  // ---- DHT22 ----
  float humidity = dht.readHumidity();
  float tempC = dht.readTemperature();
  Serial.println("[DHT22 Temperature/Humidity]");
  if (isnan(humidity) || isnan(tempC)) {
    Serial.println("  Failed to read from DHT22! Check wiring.");
  } else {
    Serial.printf("  Temperature: %.1f C   Humidity: %.1f %%\n", tempC, humidity);
  }

  // ---- Soil Moisture ----
  int soilRaw = analogRead(SOIL_PIN);
  int soilPercent = map(soilRaw, SOIL_DRY_VALUE, SOIL_WET_VALUE, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);
  Serial.println("[Soil Moisture Sensor]");
  Serial.printf("  Raw ADC: %d   Moisture: %d %%\n", soilRaw, soilPercent);
  if (soilPercent < 20) {
    Serial.println("  >> Soil is DRY — consider watering.");
  } else if (soilPercent > 80) {
    Serial.println("  >> Soil is very WET.");
  } else {
    Serial.println("  >> Soil moisture normal.");
  }

  // ---- VL53L0X ----
  Serial.println("[VL53L0X Distance Sensor]");
  if (vl53Ready) {
    VL53L0X_RangingMeasurementData_t measure;
    vl53.rangingTest(&measure, false); // pass 'true' for debug output

    if (measure.RangeStatus != 4) { // 4 = out of range / invalid
      Serial.printf("  Distance: %d mm\n", measure.RangeMilliMeter);
    } else {
      Serial.println("  Out of range.");
    }
  } else {
    Serial.println("  Sensor not initialized.");
  }

  Serial.println("---------------------------------------------------\n");

  delay(5000); // 5-second refresh
}