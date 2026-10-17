
const tests = [
  {
    id: 1,
    title: "Test 01",
    date: "2026-10-11",
    type: "part",
    available: true,
    file: "tests/test-01.html"
  },
  {
    id: 2,
    title: "Test 02",
    date: "2026-10-18",
    type: "part",
    available: false,
    file: "tests/test-02.html"
  },
  {
    id: 3,
    title: "Test 03",
    date: "2026-11-01",
    type: "part",
    available: false,
    file: "tests/test-03.html"
  },
  {
    id: 4,
    title: "Test 04",
    date: "2026-11-08",
    type: "part",
    available: false,
    file: "tests/test-04.html"
  },
  {
    id: 5,
    title: "Test 05",
    date: "2026-11-22",
    type: "part",
    available: false,
    file: "tests/test-05.html"
  },
  {
    id: 6,
    title: "Test 06",
    date: "2026-11-29",
    type: "part",
    available: false,
    file: "tests/test-06.html"
  },
  {
    id: 7,
    title: "Test 07",
    date: "2026-12-13",
    type: "part",
    available: false,
    file: "tests/test-07.html"
  },
  {
    id: 8,
    title: "Test 08",
    date: "2026-12-20",
    type: "part",
    available: false,
    file: "tests/test-08.html"
  },
  {
    id: 9,
    title: "Test 09",
    date: "2027-01-03",
    type: "part",
    available: false,
    file: "tests/test-09.html"
  },
  {
    id: 10,
    title: "Test 10",
    date: "2027-01-10",
    type: "part",
    available: false,
    file: "tests/test-10.html"
  },
  {
    id: 11,
    title: "Test 11",
    date: "2027-01-24",
    type: "part",
    available: false,
    file: "tests/test-11.html"
  },
  {
    id: 12,
    title: "Test 12",
    date: "2027-01-31",
    type: "part",
    available: false,
    file: "tests/test-12.html"
  },
  {
    id: 13,
    title: "Test 13",
    date: "2027-02-14",
    type: "part",
    available: false,
    file: "tests/test-13.html"
  },
  {
    id: 14,
    title: "Test 14",
    date: "2027-02-28",
    type: "part",
    available: false,
    file: "tests/test-14.html"
  },
  {
    id: 15,
    title: "Test 15",
    date: "2027-03-07",
    type: "full",
    available: false,
    file: "tests/test-15.html"
  },
  {
    id: 16,
    title: "Test 16",
    date: "2027-03-14",
    type: "full",
    available: false,
    file: "tests/test-16.html"
  },
  {
    id: 17,
    title: "Test 17",
    date: "2027-03-21",
    type: "full",
    available: false,
    file: "tests/test-17.html"
  },
  {
    id: 18,
    title: "Test 18",
    date: "2027-03-28",
    type: "full",
    available: false,
    file: "tests/test-18.html"
  },
  {
    id: 19,
    title: "Test 19",
    date: "2027-04-04",
    type: "full",
    available: false,
    file: "tests/test-19.html"
  },
  {
    id: 20,
    title: "Test 20",
    date: "2027-04-11",
    type: "full",
    available: false,
    file: "tests/test-20.html"
  },
  {
    id: 21,
    title: "Test 21",
    date: "2027-04-18",
    type: "full",
    available: false,
    file: "tests/test-21.html"
  },
  {
    id: 22,
    title: "Test 22",
    date: "2027-04-25",
    type: "full",
    available: false,
    file: "tests/test-22.html"
  },
  {
    id: 23,
    title: "Test 23",
    date: "2027-04-30",
    type: "full",
    available: false,
    file: "tests/test-23.html"
  }
];

/*
 * Scheduled status helper.
 * A test becomes live at 00:00 India time on its scheduled date.
 * Its CBT file must also exist at the configured path.
 */
function isTestScheduledLive(test, now = new Date()) {
  const todayInIndia = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);

  return todayInIndia >= test.date;
}

function getTestStatus(test, now = new Date()) {
  if (isTestScheduledLive(test, now)) {
    return "live";
  }

  return "upcoming";
}

function getLiveTests(now = new Date()) {
  return tests.filter(test => getTestStatus(test, now) === "live");
}

function getUpcomingTests(now = new Date()) {
  return tests.filter(test => getTestStatus(test, now) === "upcoming");
}

function getTestById(id) {
  return tests.find(test => test.id === Number(id)) || null;
}
