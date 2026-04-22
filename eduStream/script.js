// 1. OUR DATA
var courses = [];
var shown = [];
var page = 1;
var perPage = 6;
var keyword = '';

// 2. DEFAULT COURSE LIST
var defaultCourses = [
    { id: 1, title: "Neural Networks 101", dept: "Computer Science", faculty: "Dr. Aris", seats: 12, max: 50 },
    { id: 2, title: "Modernist Literature", dept: "English", faculty: "Prof. Sterling", seats: 0, max: 30 },
    { id: 3, title: "Macroeconomics", dept: "Business", faculty: "Prof. Zhang", seats: 45, max: 100 },
    { id: 4, title: "Inorganic Chemistry", dept: "Science", faculty: "Dr. Kovac", seats: 5, max: 40 },
    { id: 5, title: "UI/UX Design Systems", dept: "Digital Arts", faculty: "Prof. Miller", seats: 2, max: 15 },
    { id: 6, title: "Criminal Law Foundations", dept: "Law", faculty: "Judge Rehnquist", seats: 25, max: 30 },
    { id: 7, title: "Astrophysics II", dept: "Science", faculty: "Dr. Tyson", seats: 0, max: 12 },
    { id: 8, title: "Public Health Policy", dept: "Medicine", faculty: "Dr. Fauci", seats: 80, max: 120 },
    { id: 9, title: "Data Structures", dept: "Computer Science", faculty: "Dr. Gupta", seats: 18, max: 60 },
    { id: 10, title: "World History", dept: "History", faculty: "Prof. Lee", seats: 30, max: 80 },
    { id: 11, title: "Organic Chemistry", dept: "Science", faculty: "Dr. Patel", seats: 10, max: 35 },
    { id: 12, title: "Business Ethics", dept: "Business", faculty: "Prof. Adams", seats: 20, max: 50 }
];


function save() {
    localStorage.setItem('courses', JSON.stringify(courses));
}

function load() {
    var raw = localStorage.getItem('courses');
    return raw ? JSON.parse(raw) : null;
}


function init() {
    // Restore dark mode
    if (localStorage.getItem('dark') === 'true') toggleDark();

    // Load saved or default courses
    var saved = load();
    courses = (saved && saved.length > 0) ? saved : defaultCourses;

    // Build dept dropdown
    buildDeptDropdown();

    // Show cards
    applyFilters();
}


function buildDeptDropdown() {
    // Get unique dept names
    var depts = [];
    for (var i = 0; i < courses.length; i++) {
        if (depts.indexOf(courses[i].dept) === -1) {
            depts.push(courses[i].dept);
        }
    }
    depts.sort();

    var sel = document.getElementById('dept');
    sel.innerHTML = '<option value="all">All Departments</option>';
    for (var j = 0; j < depts.length; j++) {
        sel.innerHTML += '<option value="' + depts[j] + '">' + depts[j] + '</option>';
    }
}



function applyFilters() {
    keyword = document.getElementById('search').value.trim().toLowerCase();
    var dept = document.getElementById('dept').value;
    var sort = document.getElementById('sort').value;
    var avail = document.getElementById('avail').checked;

    // Copy all courses into result
    var result = courses.slice();

    // Filter by dept
    if (dept !== 'all') {
        result = result.filter(function (c) { return c.dept === dept; });
    }

    // Filter to available seats only
    if (avail) {
        result = result.filter(function (c) { return c.seats > 0; });
    }

    // Filter by search keyword
    if (keyword) {
        result = result.filter(function (c) {
            return c.title.toLowerCase().indexOf(keyword) > -1
                || c.dept.toLowerCase().indexOf(keyword) > -1
                || c.faculty.toLowerCase().indexOf(keyword) > -1;
        });
    }

    // Sort
    if (sort === 'asc') result.sort(function (a, b) { return a.seats - b.seats; });
    if (sort === 'desc') result.sort(function (a, b) { return b.seats - a.seats; });

    shown = result;
    page = 1;       // always reset to page 1 after filter
    render();
}


function enroll(id, e) {
    e.stopPropagation();   // stop card click
    var c = courses.filter(function (x) { return x.id === id; })[0];
    if (!c || c.seats <= 0) return;

    var ov = popup(
        'Confirm Enrollment',
        '<p style="color:#555;font-size:14px;">Enroll in <strong>' + c.title + '</strong>?<br>' +
        '<span style="color:#059669;font-weight:bold;">' + c.seats + ' seat(s) left</span></p>',
        true
    );

    ov.querySelector('#okBtn').onclick = function () {
        c.seats--;         // remove 1 seat
        save();
        ov.remove();
        applyFilters();
        toast('Enrolled in "' + c.title + '"!', 'success');
    };
}

function toggleDark() {
    document.body.classList.toggle('dark');
    var on = document.body.classList.contains('dark');
    document.getElementById('darkBtn').textContent = on ? '☀️' : '🌙';
    localStorage.setItem('dark', on);
}


function resetAll() {
    document.getElementById('search').value = '';
    document.getElementById('dept').value = 'all';
    document.getElementById('sort').value = '';
    document.getElementById('avail').checked = false;
    keyword = '';
    applyFilters();
}

function makeCard(c) {
    var full = c.seats <= 0;
    var pct = Math.round(c.seats / c.max * 100);
    var color = pct > 30 ? '#10b981' : pct > 10 ? '#f59e0b' : '#ef4444';

    // Highlight matching search text in yellow
    function hl(text) {
        if (!keyword) return text;
        var safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.replace(new RegExp('(' + safe + ')', 'gi'), '<mark>$1</mark>');
    }

    var card = document.createElement('div');
    card.className = 'card';
    card.onclick = function (e) {
        if (e.target.className === 'btn-enroll') return;  // don't open popup on enroll click
        openDetails(c);
    };

    card.innerHTML =
        '<div class="card-top">' +
        '<span class="dept">' + hl(c.dept) + '</span>' +
        '<span class="' + (full ? 'badge-full' : 'badge-open') + '">' + (full ? 'FULL' : 'OPEN') + '</span>' +
        '</div>' +
        '<div class="ctitle">' + hl(c.title) + '</div>' +
        '<div class="cfaculty">👤 ' + hl(c.faculty) + '</div>' +
        '<div class="card-foot">' +
        '<div>' +
        '<div class="slabel">Seats</div>' +
        '<div class="sval' + (full ? ' red' : '') + '">' + (full ? 'Full' : c.seats + ' / ' + c.max) + '</div>' +
        '<div class="bar"><div class="bar-in" style="width:' + (full ? 100 : pct) + '%;background:' + (full ? '#ef4444' : color) + '"></div></div>' +
        '</div>' +
        '<button class="btn-enroll" ' + (full ? 'disabled' : '') + ' onclick="enroll(' + c.id + ',event)">' +
        (full ? 'Locked' : 'Enroll') +
        '</button>' +
        '</div>';

    return card;
}


window.onload = init;
