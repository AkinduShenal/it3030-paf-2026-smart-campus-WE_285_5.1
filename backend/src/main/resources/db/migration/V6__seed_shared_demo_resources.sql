INSERT INTO resources (
    name,
    type,
    capacity,
    location,
    status,
    availability_days,
    availability_start,
    availability_end
)
SELECT
    'Lecture Hall A-201',
    'LECTURE_HALL',
    180,
    'Building A - Floor 2',
    'ACTIVE',
    'Weekdays',
    TIME '08:00:00',
    TIME '18:00:00'
WHERE NOT EXISTS (
    SELECT 1 FROM resources WHERE name = 'Lecture Hall A-201'
);

INSERT INTO resources (
    name,
    type,
    capacity,
    location,
    status,
    availability_days,
    availability_start,
    availability_end
)
SELECT
    'Lab C-03',
    'LAB',
    35,
    'Building C - Floor 1',
    'ACTIVE',
    'Weekdays',
    TIME '08:30:00',
    TIME '17:30:00'
WHERE NOT EXISTS (
    SELECT 1 FROM resources WHERE name = 'Lab C-03'
);

INSERT INTO resources (
    name,
    type,
    capacity,
    location,
    status,
    availability_days,
    availability_start,
    availability_end
)
SELECT
    'Meeting Room B-12',
    'MEETING_ROOM',
    12,
    'Building B - Floor 1',
    'ACTIVE',
    'Weekdays',
    TIME '09:00:00',
    TIME '17:00:00'
WHERE NOT EXISTS (
    SELECT 1 FROM resources WHERE name = 'Meeting Room B-12'
);

INSERT INTO resources (
    name,
    type,
    capacity,
    location,
    status,
    availability_days,
    availability_start,
    availability_end
)
SELECT
    'Projector P-01',
    'PROJECTOR',
    1,
    'Media Store - Basement',
    'ACTIVE',
    'Mon-Fri',
    TIME '08:00:00',
    TIME '16:30:00'
WHERE NOT EXISTS (
    SELECT 1 FROM resources WHERE name = 'Projector P-01'
);

INSERT INTO resources (
    name,
    type,
    capacity,
    location,
    status,
    availability_days,
    availability_start,
    availability_end
)
SELECT
    'Camera CAM-07',
    'CAMERA',
    1,
    'AV Room - Basement',
    'ACTIVE',
    'Mon-Fri',
    TIME '08:00:00',
    TIME '16:30:00'
WHERE NOT EXISTS (
    SELECT 1 FROM resources WHERE name = 'Camera CAM-07'
);
