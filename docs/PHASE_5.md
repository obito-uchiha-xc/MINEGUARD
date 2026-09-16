# SIH 2026 Integrated Mine Safety Monitoring System
## Phase 5: Live Monitoring Documentation

**Document Version**: 1.0  
**Phase Status**: **COMPLETED** (Strict Stop before Phase 6: Risk & Alert Engine)  

---

## 1. Phase Objective

Build the backend's **live monitoring and real-time data delivery layer**, streaming accepted multi-sensor telemetry to connected clients (e.g. mine monitoring dashboards) immediately after database persistence.

Phase 5 fulfills the real-time push requirement (`BE-REQ-007`) by establishing a resilient, bidirectional WebSocket interface backed by an in-process pub/sub broadcaster, with node-level subscription filtering, backpressure management, keepalive heartbeats, and strict failure isolation.

---

## 2. Distinction: Known vs. Implemented vs. TBD

### 2.1 KNOWN (Source of Truth — Project Overview)
- **Real-time / continuous monitoring**: The system must provide continuous visibility of mine safety conditions (Sec. 1).
- **Live telemetry dashboard**: Centralized visualization requires real-time data feeds for monitored zones and nodes (Sec. 9).
- **Multi-sensor streams**: Nodes report displacement, vibration, crack evolution, environmental metrics (T, H, P), and hazardous gases ($\text{CH}_4$, $\text{CO}$, $\text{O}_2$) (Sec. 4).

### 2.2 IMPLEMENTED (Phase 5 Capabilities)
- **Transport**: Standardized on WebSockets at `/api/v1/ws/telemetry` (🔵 D-004).
- **TelemetryBroadcaster**: In-process asyncio pub/sub broadcaster (`backend.app.services.broadcaster`) maintaining bounded per-client queues (`asyncio.Queue(maxsize=50)`).
- **Ingestion Hook**: Integrated directly into `TelemetryIngestionService` (`backend.app.services.ingestion`), fanning out `LiveTelemetryEvent` records immediately after `session.commit()`.
- **Node Filtering**: Clients can filter by `node_identifier` via client-to-server `SubscriptionMessage` (🔵 D-024). Default is all-node telemetry.
- **Backpressure Policy**: Drop-newest policy for slow clients (`put_nowait()`); DB persistence and healthy clients are never affected (🔵 D-021).
- **Keepalive Frames**: Server-initiated `KeepalivePing` frames every 30 seconds to detect dead TCP connections (🔵 D-022).
- **Failure Isolation**: Broadcaster failures and client disconnects are caught and isolated; the database transaction and HTTP 201 ingestion response never fail due to broadcast errors.
- **DTO Reuse**: Broadcast events directly reuse `SensorReadingResponse` from Phase 4, eliminating data duplication.

### 2.3 TBD (Explicitly Excluded / Deferred to Future Phases)
- **Authentication**: WebSocket endpoint is unauthenticated in Phase 5; authentication remains TBD pending security baseline (🔵 D-006, D-023).
- **External Message Brokers**: Redis/Kafka are excluded; in-process asyncio broadcaster satisfies prototype scale (🔵 D-007).
- **Risk Evaluation & AI**: No risk scores, thresholds, or anomaly detections are emitted in live frames (deferred to Phase 6 & Phase 7).
- **Alert Dispatching**: Alert frames are reserved for Phase 6.

---

## 3. Live Monitoring Architecture

```text
Mother System Gateway
        │
        │ HTTP POST /api/v1/ingestion/telemetry (Phase 3)
        ▼
┌──────────────────────────────────────────────┐
│  TelemetryIngestionService                   │
│  1. Node resolution                          │
│  2. Sensor mapping                           │
│  3. Atomic DB persist (session.commit())     │
└──────────────────────┬───────────────────────┘
                       │
                       │ (After successful commit)
                       ▼
┌──────────────────────────────────────────────┐
│  TelemetryBroadcaster (In-Process Singleton) │
│  • Fans out to registered client queues      │
│  • Applies node_identifier filter (D-024)    │
│  • Enforces backpressure drop policy (D-021) │
└──────────────┬──────────────────┬────────────┘
               │                  │
        Client A Queue     Client B Queue (Filtered)
               │                  │
               ▼                  ▼
┌──────────────────────┐   ┌──────────────────────┐
│  WebSocket Handler   │   │  WebSocket Handler   │
│  (/api/v1/ws/telemetry)  (/api/v1/ws/telemetry) │
│  • Sender task       │   │  • Sender task       │
│  • Keepalive task    │   │  • Keepalive task    │
└──────────────┬───────┘   └──────────────┬───────┘
               │                  │
               ▼                  ▼
      Dashboard Client A   Dashboard Client B
     (Receives All Nodes) (Receives NODE-01 Only)
```

---

## 4. Message Contracts & Schemas

Defined in `backend/app/schemas/live.py`:

### 4.1 Server-to-Client: Live Telemetry Event
Emitted immediately upon successful database commit of an incoming telemetry frame.
```json
{
  "event_type": "telemetry",
  "node_identifier": "NODE-01",
  "node_id": 1,
  "readings": [
    {
      "id": 101,
      "sensor_id": 5,
      "sensor_type": "temperature",
      "sensor_identifier": "TEMP-01",
      "unit": "degC",
      "node_id": 1,
      "node_identifier": "NODE-01",
      "timestamp": "2026-09-09T20:30:00Z",
      "value": 24.8
    }
  ],
  "ingested_at": "2026-09-09T20:30:01.123456Z"
}
```

### 4.2 Client-to-Server: Node Subscription Filter
Sent by the client to restrict incoming events to a single node. If omitted, all nodes are broadcast.
```json
{
  "action": "subscribe",
  "node_identifier": "NODE-01"
}
```
**Server Acknowledgment:**
```json
{
  "event_type": "subscribed",
  "node_identifier": "NODE-01"
}
```

### 4.3 Server-to-Client: Keepalive Heartbeat
Emitted every `WS_KEEPALIVE_INTERVAL_S` (default: 30s) to keep TCP state active and allow clients to verify server liveness.
```json
{
  "event_type": "ping",
  "server_time": "2026-09-09T20:30:30Z"
}
```

---

## 5. Client Connection Lifecycle

1. **Connect**: Client connects to `/api/v1/ws/telemetry`. The connection is accepted, a UUID client ID is allocated, and the client is subscribed to the broadcaster with `node_filter=None`.
2. **Optional Subscription Filter**: Client may transmit a `SubscriptionMessage`. The broadcaster updates the client's filter and replies with an acknowledgment frame.
3. **Streaming & Heartbeats**:
   - **Sender Task**: Continually drains the client's private `asyncio.Queue` and transmits JSON text frames over the WebSocket.
   - **Keepalive Task**: Periodically transmits `KeepalivePing` frames at configured intervals.
4. **Clean Disconnection**:
   - Disconnection is detected via `WebSocketDisconnect` or socket error.
   - Broadcaster deregisters the client immediately under `asyncio.shield` so no subsequent events are queued.
   - Sender and keepalive background tasks are cancelled and cleaned up.

---

## 6. Backpressure & Concurrency Guarantees

- **Bounded Queue**: Every client gets an `asyncio.Queue(maxsize=50)`.
- **Drop Policy**: If a client fails to read frames fast enough and its queue reaches capacity, `put_nowait()` catches `QueueFull` and drops the event for that client only.
- **Persistence Integrity**: Event drops are logged as warnings and have **zero impact** on database persistence.
- **Thread Safety**: Client registration and filter updates are synchronized via an `asyncio.Lock` inside the broadcaster.

---

## 7. Verification & Automated Test Coverage

Phase 5 includes 14 automated tests in `tests/test_live.py`:

| Test Name | Type | Purpose Verified |
| :--- | :--- | :--- |
| `test_live_telemetry_event_schema` | Unit | Verifies schema serialization and reuse of Phase 4 `SensorReadingResponse`. |
| `test_subscription_message_schema` | Unit | Verifies subscription message parsing with/without `node_identifier`. |
| `test_keepalive_ping_schema` | Unit | Verifies keepalive ping format and UTC timestamp. |
| `test_broadcaster_subscribe_and_unsubscribe` | Unit | Tests client registration lifecycle, ID tracking, and idempotent removal. |
| `test_broadcaster_filtering_logic` | Unit | Tests selective delivery based on `node_identifier` filter vs all-node delivery. |
| `test_broadcaster_filter_update` | Unit | Tests dynamic update of subscription filter while connected. |
| `test_broadcaster_backpressure_drop_newest` | Unit | Tests bounded queue overflow and drop policy under heavy load. |
| `test_broadcaster_publish_with_no_clients` | Unit | Ensures safe no-op when no subscribers are connected. |
| `test_ws_connection_and_disconnect` | Integration | Tests WebSocket handshake, registry tracking, and graceful disconnect cleanup. |
| `test_ws_receives_live_telemetry_on_ingestion` | Integration | Tests end-to-end flow: HTTP POST ingestion $\rightarrow$ DB persist $\rightarrow$ WS frame received. |
| `test_ws_node_filter_receives_only_target_node` | Integration | Tests that a filtered WS client receives only target node events. |
| `test_ws_multiple_clients_fanout` | Integration | Tests concurrent fan-out to multiple connected clients. |
| `test_ws_invalid_message_gracefully_ignored` | Integration | Confirms malformed or invalid client frames do not crash the connection. |
| `test_broadcast_failure_isolated_from_ingestion_transaction` | Integration | Proves that broadcaster exceptions never fail the ingestion transaction. |
