// Working code for TX

// #include <SPI.h>
// #include <LoRa.h>

// #define SS 5
// #define RST 14
// #define DIO0 26

// void setup() {
//   Serial.begin(115200);
//   LoRa.setPins(SS, RST, DIO0);

//   if (!LoRa.begin(433E6)) { // use 433E6 / 868E6 / 915E6 based on your module's freq band
//     Serial.println("LoRa init failed. Check wiring.");
//     while (1);
//   }

//   LoRa.setTxPower(20, PA_OUTPUT_PA_BOOST_PIN);

//   Serial.println("LoRa init OK");
// }

// int counter = 0;

// void loop() {
//   Serial.print("Sending packet: ");
//   Serial.println(counter);

//   LoRa.beginPacket();
//   LoRa.print("hello ");
//   LoRa.print(counter);
//   LoRa.endPacket();

//   counter++;
//   delay(2000);
// }



/*
  LoRa SX1278 - Receiver Test
  Board: ESP32 Dev Kit (ESP32-WROOM-32 style devkit)
  Library: "LoRa" by Sandeep Mistry

  Listens for packets and prints them along with signal strength (RSSI).
*/

#include <SPI.h>
#include <LoRa.h>

#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_NSS   5
#define LORA_RST   14
#define LORA_DIO0  26   // matches this board's wiring

#define LORA_FREQUENCY 433E6  // must match the transmitter

void setup() {
  Serial.begin(115200);
  while (!Serial) { delay(5000); }
  delay(5000);

  Serial.println("LoRa Receiver Test starting...");

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);
  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("LoRa init FAILED. Check wiring.");
    while (1) { delay(1000); }
  }

  Serial.println("LoRa Receiver ready. Waiting for packets...");
}

void loop() {
  int packetSize = LoRa.parsePacket();

  if (packetSize) {
    String received = "";
    while (LoRa.available()) {
      received += (char)LoRa.read();
    }

    Serial.print("Received: '");
    Serial.print(received);
    Serial.print("' | RSSI: ");
    Serial.print(LoRa.packetRssi());
    Serial.print(" dBm | SNR: ");
    Serial.println(LoRa.packetSnr());
  }
}