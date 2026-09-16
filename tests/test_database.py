"""Automated tests for database layer, domain models, relationships, constraints, and time-series persistence."""

from datetime import datetime, timezone, timedelta
import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from backend.app.db.base import Base
from backend.app.models import IntegratedNode, Mine, Sensor, SensorReading, Zone

# Use an isolated in-memory SQLite database for tests
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_session():
    """Create an isolated in-memory test database and session for each test."""
    test_engine = create_async_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async with session_factory() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()


@pytest.mark.asyncio
async def test_database_connection(test_session: AsyncSession):
    """Verify active database session can execute a simple query."""
    result = await test_session.execute(select(1))
    assert result.scalar() == 1


@pytest.mark.asyncio
async def test_domain_hierarchy_persistence(test_session: AsyncSession):
    """Verify full domain hierarchy can be created and queried:

    Mine -> Zone -> IntegratedNode -> Sensor -> SensorReading.
    """
    now = datetime.now(timezone.utc)

    # 1. Create Mine
    mine = Mine(name="Apex Deep Mine", code="APX-01")
    test_session.add(mine)
    await test_session.flush()
    assert mine.id is not None

    # 2. Create Zone
    zone = Zone(mine_id=mine.id, name="Zone A - South Drift", code="ZA-S")
    test_session.add(zone)
    await test_session.flush()
    assert zone.id is not None

    # 3. Create IntegratedNode
    node = IntegratedNode(
        zone_id=zone.id,
        node_identifier="NODE-EXP-001",
        status="ACTIVE",
        last_seen_at=now,
    )
    test_session.add(node)
    await test_session.flush()
    assert node.id is not None

    # 4. Create Sensors across multiple categories
    s_disp = Sensor(node_id=node.id, sensor_type="displacement", sensor_identifier="disp_1")
    s_vib = Sensor(node_id=node.id, sensor_type="vibration", sensor_identifier="vib_1")
    s_ch4 = Sensor(node_id=node.id, sensor_type="methane_ch4", sensor_identifier="gas_ch4")
    test_session.add_all([s_disp, s_vib, s_ch4])
    await test_session.flush()
    assert s_disp.id is not None

    # 5. Create SensorReading (Telemetry observation)
    reading = SensorReading(
        sensor_id=s_disp.id,
        node_id=node.id,
        timestamp=now,
        value=2.45,
    )
    test_session.add(reading)
    await test_session.commit()

    # Query back and verify relationships
    stmt = select(Mine).where(Mine.name == "Apex Deep Mine")
    res = await test_session.execute(stmt)
    saved_mine = res.scalar_one()

    assert len(saved_mine.zones) == 1
    saved_zone = saved_mine.zones[0]
    assert saved_zone.name == "Zone A - South Drift"

    assert len(saved_zone.nodes) == 1
    saved_node = saved_zone.nodes[0]
    assert saved_node.node_identifier == "NODE-EXP-001"
    assert len(saved_node.sensors) == 3


@pytest.mark.asyncio
async def test_node_identifier_unique_constraint(test_session: AsyncSession):
    """Verify unique constraint on IntegratedNode.node_identifier."""
    mine = Mine(name="Test Mine", code="TM-01")
    test_session.add(mine)
    await test_session.flush()

    zone = Zone(mine_id=mine.id, name="Test Zone")
    test_session.add(zone)
    await test_session.flush()

    node1 = IntegratedNode(zone_id=zone.id, node_identifier="NODE-DUPLICATE")
    test_session.add(node1)
    await test_session.flush()

    node2 = IntegratedNode(zone_id=zone.id, node_identifier="NODE-DUPLICATE")
    test_session.add(node2)

    with pytest.raises(IntegrityError):
        await test_session.flush()

    await test_session.rollback()


@pytest.mark.asyncio
async def test_mine_name_unique_constraint(test_session: AsyncSession):
    """Verify unique constraint on Mine.name."""
    mine1 = Mine(name="Unique Mine", code="UM-01")
    mine2 = Mine(name="Unique Mine", code="UM-02")
    test_session.add_all([mine1, mine2])

    with pytest.raises(IntegrityError):
        await test_session.flush()

    await test_session.rollback()


@pytest.mark.asyncio
async def test_historical_time_series_persistence(test_session: AsyncSession):
    """Verify multiple chronological observations can be persisted for a single sensor and retrieved in time order."""
    mine = Mine(name="Time Series Mine", code="TSM-01")
    test_session.add(mine)
    await test_session.flush()

    zone = Zone(mine_id=mine.id, name="Extraction Face")
    test_session.add(zone)
    await test_session.flush()

    node = IntegratedNode(zone_id=zone.id, node_identifier="NODE-TS-100")
    test_session.add(node)
    await test_session.flush()

    sensor = Sensor(node_id=node.id, sensor_type="crack_detection")
    test_session.add(sensor)
    await test_session.flush()

    base_time = datetime(2026, 9, 9, 12, 0, 0, tzinfo=timezone.utc)

    # Insert 5 chronological readings (e.g. at 0s, 10s, 20s, 30s, 40s)
    readings = [
        SensorReading(
            sensor_id=sensor.id,
            node_id=node.id,
            timestamp=base_time + timedelta(seconds=i * 10),
            value=float(i * 0.5),
        )
        for i in range(5)
    ]
    test_session.add_all(readings)
    await test_session.commit()

    # Query ordered by timestamp
    query = (
        select(SensorReading)
        .where(SensorReading.sensor_id == sensor.id)
        .order_by(SensorReading.timestamp.asc())
    )
    result = await test_session.execute(query)
    stored_readings = result.scalars().all()

    assert len(stored_readings) == 5
    assert stored_readings[0].value == 0.0
    assert stored_readings[4].value == 2.0
    assert stored_readings[0].timestamp < stored_readings[4].timestamp


@pytest.mark.asyncio
async def test_node_wise_time_series_retrieval(test_session: AsyncSession):
    """Verify BE-REQ-004 & BE-REQ-006: Telemetry can be queried node-wise across multiple sensors."""
    mine = Mine(name="Multi-Sensor Mine", code="MSM-01")
    test_session.add(mine)
    await test_session.flush()

    zone = Zone(mine_id=mine.id, name="West Drift")
    test_session.add(zone)
    await test_session.flush()

    node = IntegratedNode(zone_id=zone.id, node_identifier="NODE-MS-200")
    test_session.add(node)
    await test_session.flush()

    s_disp = Sensor(node_id=node.id, sensor_type="displacement")
    s_temp = Sensor(node_id=node.id, sensor_type="temperature")
    test_session.add_all([s_disp, s_temp])
    await test_session.flush()

    now = datetime.now(timezone.utc)
    r1 = SensorReading(sensor_id=s_disp.id, node_id=node.id, timestamp=now, value=1.2)
    r2 = SensorReading(sensor_id=s_temp.id, node_id=node.id, timestamp=now, value=28.5)
    test_session.add_all([r1, r2])
    await test_session.commit()

    # Query all readings for this node
    stmt = (
        select(SensorReading)
        .where(SensorReading.node_id == node.id)
        .order_by(SensorReading.timestamp.asc())
    )
    result = await test_session.execute(stmt)
    node_readings = result.scalars().all()

    assert len(node_readings) == 2
    sensor_types = {r.sensor.sensor_type for r in node_readings}
    assert "displacement" in sensor_types
    assert "temperature" in sensor_types

