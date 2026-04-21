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

// ==============================
// 3. SAVE & LOAD (localStorage)
// ==============================

function save() {
    localStorage.setItem('courses', JSON.stringify(courses));
}

function load() {
    var raw = localStorage.getItem('courses');
    return raw ? JSON.parse(raw) : null;
}

// ==============================
// 4. START APP
// ==============================

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

// ==============================
// 5. BUILD DEPARTMENT DROPDOWN
// ==============================

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

// ==============================
// 6. FILTER + SORT
// ==============================

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

// ==============================
// 7. RENDER CARDS + PAGINATION
// ==============================

function render() {
    var grid = document.getElementById('grid');
    var noResult = document.getElementById('noresult');
    var pagebar = document.getElementById('pagebar');

    grid.innerHTML = '';

    // Nothing found?
    if (shown.length === 0) {
        noResult.style.display = 'block';
        pagebar.style.display = 'none';
        document.getElementById('badge').textContent = '0 Courses';
        return;
    }

    noResult.style.display = 'none';
    pagebar.style.display = 'flex';

    var total = shown.length;
    var totalPages = Math.ceil(total / perPage);
    var start = (page - 1) * perPage;
    var end = Math.min(start + perPage, total);

    // Update badge and page info text
    document.getElementById('badge').textContent = total + ' Courses';
    document.getElementById('pginfo').textContent = 'Showing ' + (start + 1) + '-' + end + ' of ' + total;

    // Draw only the cards for this page
    for (var i = start; i < end; i++) {
        grid.appendChild(makeCard(shown[i]));
    }

    // Draw prev/next/number buttons
    makePagination(totalPages);
}

// ==============================
// 8. PAGINATION BUTTONS
// ==============================

function makePagination(totalPages) {
    var container = document.getElementById('pgbtns');
    container.innerHTML = '';

    // ← Prev button
    var prev = document.createElement('button');
    prev.className = 'pgbtn';
    prev.textContent = '← Prev';
    prev.disabled = (page === 1);
    prev.onclick = function () { page--; render(); };
    container.appendChild(prev);

    // Number buttons
    for (var i = 1; i <= totalPages; i++) {
        var btn = document.createElement('button');
        btn.className = 'pgbtn' + (i === page ? ' active' : '');
        btn.textContent = i;
        btn.onclick = (function (p) { return function () { page = p; render(); }; })(i);
        container.appendChild(btn);
    }

    // Next → button
    var next = document.createElement('button');
    next.className = 'pgbtn';
    next.textContent = 'Next →';
    next.disabled = (page === totalPages);
    next.onclick = function () { page++; render(); };
    container.appendChild(next);
}

// 9. MAKE ONE CARD

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
    // User "dr." అని type చేస్తే
    // "." special character — RegExp లో problem అవుతుంది
    // safe వల్ల special characters escape అవుతాయి 
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

// ==============================
// 10. ENROLL IN A COURSE
// ==============================

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

// ==============================
// 11. COURSE DETAILS POPUP
// ==============================

function openDetails(c) {
    var full = c.seats <= 0;
    var pct = Math.round(c.seats / c.max * 100);

    var ov = popup(
        c.title,
        '<div class="drow"><span class="dk">Department</span><span class="dv">' + c.dept + '</span></div>' +
        '<div class="drow"><span class="dk">Faculty</span>   <span class="dv">' + c.faculty + '</span></div>' +
        '<div class="drow"><span class="dk">Seats Left</span><span class="dv' + (full ? ' red' : '') + '">' + (full ? 'Full' : c.seats) + '</span></div>' +
        '<div class="drow"><span class="dk">Capacity</span>  <span class="dv">' + c.max + '</span></div>' +
        '<div class="drow"><span class="dk">Filled</span>    <span class="dv">' + (100 - pct) + '%</span></div>' +
        '<div class="bar" style="margin-top:12px;height:6px;"><div class="bar-in" style="width:' + (full ? 100 : pct) + '%;background:' + (full ? '#ef4444' : '#10b981') + '"></div></div>',
        !full
    );

    if (!full) {
        ov.querySelector('#okBtn').onclick = function () {
            ov.remove();
            enroll(c.id, { stopPropagation: function () { } });
        };
    }
}

// ==============================
// 12. ADD COURSE FORM
// ==============================

function openAddForm() {
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML =
        '<div class="popup" style="max-width:440px;">' +
        '<h2>Add New Course</h2>' +
        '<div class="twocol">' +
        '<div class="field"><label>Title *</label><input id="fT" placeholder="e.g. Data Science"></div>' +
        '<div class="field"><label>Department *</label><input id="fD" placeholder="e.g. Science"></div>' +
        '</div>' +
        '<div class="field"><label>Faculty *</label><input id="fF" placeholder="e.g. Dr. Smith"></div>' +
        '<div class="twocol">' +
        '<div class="field"><label>Available Seats *</label><input id="fS" type="number" min="0" placeholder="30"></div>' +
        '<div class="field"><label>Total Capacity *</label><input id="fM" type="number" min="1" placeholder="50"></div>' +
        '</div>' +
        '<button class="btn-blue" onclick="submitForm()">+ Add Course</button>' +
        '<button class="btn-gray" onclick="this.closest(\'.overlay\').remove()">Cancel</button>' +
        '</div>';
    document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
}

function submitForm() {
    var title = document.getElementById('fT').value.trim();
    var dept = document.getElementById('fD').value.trim();
    var faculty = document.getElementById('fF').value.trim();
    var seats = parseInt(document.getElementById('fS').value);
    var max = parseInt(document.getElementById('fM').value);

    if (!title || !dept || !faculty || isNaN(seats) || isNaN(max)) {
        toast('Please fill all fields!', 'error'); return;
    }
    if (seats > max) {
        toast('Seats cannot exceed capacity!', 'error'); return;
    }

    courses.push({ id: Date.now(), title: title, dept: dept, faculty: faculty, seats: seats, max: max });
    save();
    buildDeptDropdown();
    applyFilters();
    document.querySelector('.overlay').remove();
    toast('"' + title + '" added!', 'success');
}

// ==============================
// 13. HELPER: MAKE A POPUP
// ==============================


// ==============================
// 14. DARK MODE
// ==============================

function toggleDark() {
    document.body.classList.toggle('dark');
    var on = document.body.classList.contains('dark');
    document.getElementById('darkBtn').textContent = on ? '☀️' : '🌙';
    localStorage.setItem('dark', on);
}

// ==============================
// 15. RESET ALL FILTERS
// ==============================

function resetAll() {
    document.getElementById('search').value = '';
    document.getElementById('dept').value = 'all';
    document.getElementById('sort').value = '';
    document.getElementById('avail').checked = false;
    keyword = '';
    applyFilters();
}

// ==============================
// 16. TOAST MESSAGE
// ==============================

function toast(msg, type) {
    var old = document.querySelector('.toast');
    if (old) old.remove();

    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);

    setTimeout(function () { t.remove(); }, 3000);
}

// ==============================
// START!
// ==============================
window.onload = init;
