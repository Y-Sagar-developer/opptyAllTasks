/*
  app.js
  ─────────────────────────────────────────────
  All JavaScript logic for GiftOfLife.
  Handles: auth, navigation, donors, requests,
           profile, export, modals, and toasts.

  Used by: auth/login.html, dashboard/index.html
*/

// ════════════════════════════════════════════
//   DATA LAYER — reads/writes to localStorage
// ════════════════════════════════════════════
const DB = {
  get: k => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// Seed demo data on first load
function seedDemoData() {
  if (!DB.get('donors')) {
    DB.set('donors', [
      { id: 1, fname: 'Priya',  lname: 'Sharma', blood: 'O+',  age: 28, phone: '+91 9876540001', email: 'priya@mail.com',  city: 'Chennai',   lastDon: '2024-11-10', status: 'available',  notes: 'No known conditions' },
      { id: 2, fname: 'Arjun',  lname: 'Kumar',  blood: 'A+',  age: 34, phone: '+91 9876540002', email: 'arjun@mail.com',  city: 'Mumbai',    lastDon: '2025-01-15', status: 'donated',    notes: '' },
      { id: 3, fname: 'Deepa',  lname: 'Nair',   blood: 'B+',  age: 26, phone: '+91 9876540003', email: 'deepa@mail.com',  city: 'Bangalore', lastDon: '2024-09-20', status: 'available',  notes: 'Regular donor' },
      { id: 4, fname: 'Ravi',   lname: 'Menon',  blood: 'AB+', age: 41, phone: '+91 9876540004', email: 'ravi@mail.com',   city: 'Hyderabad', lastDon: '2025-02-01', status: 'available',  notes: '' },
      { id: 5, fname: 'Aisha',  lname: 'Khan',   blood: 'O-',  age: 30, phone: '+91 9876540005', email: 'aisha@mail.com',  city: 'Chennai',   lastDon: '2024-12-05', status: 'available',  notes: 'Universal donor' },
      { id: 6, fname: 'Vikram', lname: 'Singh',  blood: 'B-',  age: 38, phone: '+91 9876540006', email: 'vikram@mail.com', city: 'Delhi',     lastDon: '2025-03-01', status: 'ineligible', notes: 'Temp ineligible – medication' },
    ]);
  }

  if (!DB.get('requests')) {
    DB.set('requests', [
      { id: 1, patient: 'Kiran Raj',  blood: 'O+',  units: 2, hospital: 'Apollo Chennai', priority: 'urgent',   status: 'pending',   date: '2025-04-10', notes: 'Post-surgery' },
      { id: 2, patient: 'Lalitha S.', blood: 'A+',  units: 1, hospital: 'MIOT Hospital',  priority: 'normal',   status: 'fulfilled', date: '2025-04-08', notes: '' },
      { id: 3, patient: 'Balu M.',    blood: 'AB+', units: 3, hospital: 'Fortis',          priority: 'critical', status: 'pending',   date: '2025-04-12', notes: 'Emergency' },
    ]);
  }

  if (!DB.get('users')) {
    DB.set('users', [
      { id: 1, fname: 'Admin', lname: 'User', email: 'admin@giftoflife.com', password: 'admin123', role: 'admin', phone: '+91 9000000001', dept: 'Administration', org: 'GiftOfLife HQ' }
    ]);
  }
}

// ════════════════════════════════════════════
//   AUTH — Login & Register
// ════════════════════════════════════════════

// Switch between Login and Register tabs
function switchAuthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'signup'));
  });
  document.getElementById('auth-login').style.display  = tab === 'login'  ? 'flex' : 'none';
  document.getElementById('auth-signup').style.display = tab === 'signup' ? 'flex' : 'none';
}

// Login: validate credentials and start session
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const users = DB.get('users') || [];
  const user  = users.find(u => u.email === email && u.password === pass);

  if (!user) {
    toast('❌ Invalid email or password');
    return;
  }

  DB.set('session', user);
  // Redirect to dashboard
  window.location.href = '../dashboard/index.html';
}

// Register: create a new account and start session
function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  const role  = document.getElementById('reg-role').value;

  if (!name || !email || !pass) { toast('⚠ Please fill all fields'); return; }

  const users = DB.get('users') || [];
  if (users.find(u => u.email === email)) { toast('⚠ Email already registered'); return; }

  const [fname, ...rest] = name.split(' ');
  const lname = rest.join(' ') || '';
  const newUser = { id: Date.now(), fname, lname, email, password: pass, role, phone: '', dept: '', org: '' };

  users.push(newUser);
  DB.set('users', users);
  DB.set('session', newUser);

  toast('✅ Account created!');
  // Redirect to dashboard after short delay so toast is visible
  setTimeout(() => { window.location.href = '../dashboard/index.html'; }, 800);
}

// Logout: clear session and go back to login
function doLogout() {
  DB.set('session', null);
  toast('👋 Logged out successfully');
  setTimeout(() => { window.location.href = '../auth/login.html'; }, 800);
}

// ════════════════════════════════════════════
//   DASHBOARD — Navigation between tabs
// ════════════════════════════════════════════
function goTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

  const tabs = ['overview', 'donors', 'requests', 'profile'];
  const idx  = tabs.indexOf(tab);
  document.querySelectorAll('.nav-tab')[idx]?.classList.add('active');
  document.getElementById('tab-' + tab)?.classList.add('active');
}

// ════════════════════════════════════════════
//   OVERVIEW — Stats and blood type chart
// ════════════════════════════════════════════
function renderOverview() {
  const donors = DB.get('donors') || [];
  const reqs   = DB.get('requests') || [];

  document.getElementById('stat-total').textContent     = donors.length;
  document.getElementById('stat-available').textContent = donors.filter(d => d.status === 'available').length;
  document.getElementById('stat-pending').textContent   = reqs.filter(r => r.status === 'pending').length;
  document.getElementById('stat-fulfilled').textContent = reqs.filter(r => r.status === 'fulfilled').length;

  // Blood type distribution grid
  const types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const grid  = document.getElementById('blood-grid');
  grid.innerHTML = types.map(t => {
    const count = donors.filter(d => d.blood === t).length;
    return `
      <div class="blood-cell">
        <div class="blood-type">${t}</div>
        <div class="blood-count">${count}</div>
        <div class="blood-lbl">donors</div>
      </div>`;
  }).join('');
}

// ════════════════════════════════════════════
//   ROLE HELPERS — Permission checks
// ════════════════════════════════════════════

// Returns the current logged-in user's role
function getRole() {
  const user = DB.get('session');
  return user ? user.role : null;
}

// Can this user add or edit donors/requests?
function canWrite() {
  return ['admin', 'staff'].includes(getRole());
}

// Can this user delete records?
function canDelete() {
  return getRole() === 'admin';
}

// Can this user fulfill requests?
function canFulfill() {
  return ['admin', 'staff'].includes(getRole());
}

// Show a "no permission" toast and stop the action
function denyAccess() {
  toast('🚫 You do not have permission for this action');
}

// ════════════════════════════════════════════
//   DONORS — List, Add, Edit, Delete
// ════════════════════════════════════════════

// Tracks which donor is being edited (null = new donor)
let editDonorId = null;

// Helper: colored badge for donor status
function statusBadge(s) {
  const map = { available: 'green', donated: 'yellow', ineligible: 'red' };
  return `<span class="badge badge-${map[s] || 'blue'}">${s}</span>`;
}

// Helper: colored badge for request priority
function priorityBadge(p) {
  const map = { normal: 'green', urgent: 'yellow', critical: 'red' };
  return `<span class="badge badge-${map[p] || 'blue'}">${p}</span>`;
}

// Render the donors table (with optional search filter)
function renderDonors() {
  const q      = (document.getElementById('donor-search')?.value || '').toLowerCase();
  const donors = (DB.get('donors') || []).filter(d =>
    `${d.fname} ${d.lname} ${d.blood} ${d.city}`.toLowerCase().includes(q)
  );

  const tbody = document.getElementById('donor-tbody');
  const empty = document.getElementById('donor-empty');

  if (!donors.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = donors.map(d => `
    <tr>
      <td><strong>${d.fname} ${d.lname}</strong></td>
      <td><span class="badge badge-red" style="font-family:'Bebas Neue';font-size:14px;letter-spacing:1px">${d.blood}</span></td>
      <td>${d.age}</td>
      <td>${d.phone}</td>
      <td>${d.city}</td>
      <td>${statusBadge(d.status)}</td>
      <td style="color:var(--muted);font-size:13px">${d.lastDon || '—'}</td>
      <td>
        <div style="display:flex;gap:6px">
          ${canWrite()  ? `<button class="btn btn-ghost btn-sm"  onclick="editDonor(${d.id})">✏</button>` : ''}
          ${canDelete() ? `<button class="btn btn-danger btn-sm" onclick="deleteDonor(${d.id})">🗑</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// Open the Add Donor modal (blank form)
function openAddDonor() {
  if (!canWrite()) { denyAccess(); return; }
  editDonorId = null;
  document.getElementById('modal-donor-title').textContent = 'Add New Donor';
  ['d-fname', 'd-lname', 'd-phone', 'd-email', 'd-city', 'd-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('d-age').value    = '';
  document.getElementById('d-blood').value  = 'A+';
  document.getElementById('d-status').value = 'available';
  document.getElementById('d-lastdon').value = '';
  openModal('modal-donor');
}

// Open the Edit Donor modal (pre-filled form)
function editDonor(id) {
  if (!canWrite()) { denyAccess(); return; }
  const d = (DB.get('donors') || []).find(x => x.id === id);
  if (!d) return;

  editDonorId = id;
  document.getElementById('modal-donor-title').textContent = 'Edit Donor';
  document.getElementById('d-fname').value   = d.fname;
  document.getElementById('d-lname').value   = d.lname;
  document.getElementById('d-blood').value   = d.blood;
  document.getElementById('d-age').value     = d.age;
  document.getElementById('d-phone').value   = d.phone;
  document.getElementById('d-email').value   = d.email;
  document.getElementById('d-city').value    = d.city;
  document.getElementById('d-lastdon').value = d.lastDon;
  document.getElementById('d-status').value  = d.status;
  document.getElementById('d-notes').value   = d.notes;
  openModal('modal-donor');
}

// Save donor (handles both add and edit)
function saveDonor() {
  const fname = document.getElementById('d-fname').value.trim();
  const lname = document.getElementById('d-lname').value.trim();
  if (!fname) { toast('⚠ First name required'); return; }

  const donor = {
    id:      editDonorId || Date.now(),
    fname,
    lname,
    blood:   document.getElementById('d-blood').value,
    age:     parseInt(document.getElementById('d-age').value) || 0,
    phone:   document.getElementById('d-phone').value.trim(),
    email:   document.getElementById('d-email').value.trim(),
    city:    document.getElementById('d-city').value.trim(),
    lastDon: document.getElementById('d-lastdon').value,
    status:  document.getElementById('d-status').value,
    notes:   document.getElementById('d-notes').value.trim(),
  };

  let donors = DB.get('donors') || [];
  if (editDonorId) {
    donors = donors.map(d => d.id === editDonorId ? donor : d);
  } else {
    donors.push(donor);
  }

  DB.set('donors', donors);
  closeModal('modal-donor');
  renderDonors();
  renderOverview();
  toast(editDonorId ? '✅ Donor updated' : '✅ Donor added');
}

// Delete a donor by ID
function deleteDonor(id) {
  if (!canDelete()) { denyAccess(); return; }
  if (!confirm('Delete this donor?')) return;
  DB.set('donors', (DB.get('donors') || []).filter(d => d.id !== id));
  renderDonors();
  renderOverview();
  toast('🗑 Donor removed');
}

// ════════════════════════════════════════════
//   REQUESTS — List, Add, Fulfill, Delete
// ════════════════════════════════════════════

// Render the blood requests table
function renderRequests() {
  const reqs  = DB.get('requests') || [];
  const tbody = document.getElementById('req-tbody');
  const empty = document.getElementById('req-empty');

  if (!reqs.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = reqs.map(r => `
    <tr>
      <td><strong>${r.patient}</strong></td>
      <td><span class="badge badge-red" style="font-family:'Bebas Neue';font-size:14px">${r.blood}</span></td>
      <td>${r.units}</td>
      <td>${r.hospital}</td>
      <td>${priorityBadge(r.priority)}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="color:var(--muted);font-size:13px">${r.date}</td>
      <td>
        <div style="display:flex;gap:6px">
          ${r.status === 'pending' && canFulfill()
            ? `<button class="btn btn-success btn-sm" onclick="fulfillRequest(${r.id})">✓ Fulfill</button>`
            : ''}
          ${canDelete() ? `<button class="btn btn-danger btn-sm" onclick="deleteRequest(${r.id})">🗑</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// Save a new blood request
function saveRequest() {
  const patient = document.getElementById('r-patient').value.trim();
  if (!patient) { toast('⚠ Patient name required'); return; }

  const req = {
    id:       Date.now(),
    patient,
    blood:    document.getElementById('r-blood').value,
    units:    parseInt(document.getElementById('r-units').value) || 1,
    hospital: document.getElementById('r-hospital').value.trim(),
    priority: document.getElementById('r-priority').value,
    status:   'pending',
    date:     new Date().toISOString().split('T')[0],
    notes:    document.getElementById('r-notes').value.trim(),
  };

  const reqs = DB.get('requests') || [];
  reqs.push(req);
  DB.set('requests', reqs);

  closeModal('modal-req');
  renderRequests();
  renderOverview();
  toast('✅ Request submitted');

  // Clear form fields
  ['r-patient', 'r-units', 'r-hospital', 'r-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

// Mark a request as fulfilled
function fulfillRequest(id) {
  if (!canFulfill()) { denyAccess(); return; }
  let reqs = DB.get('requests') || [];
  reqs = reqs.map(r => r.id === id ? { ...r, status: 'fulfilled' } : r);
  DB.set('requests', reqs);
  renderRequests();
  renderOverview();
  toast('✅ Request marked as fulfilled');
}

// Delete a request by ID
function deleteRequest(id) {
  if (!canDelete()) { denyAccess(); return; }
  if (!confirm('Delete this request?')) return;
  DB.set('requests', (DB.get('requests') || []).filter(r => r.id !== id));
  renderRequests();
  renderOverview();
  toast('🗑 Request removed');
}

// ════════════════════════════════════════════
//   PROFILE — View and Edit
// ════════════════════════════════════════════

// Update the topbar avatar and name
function updateTopbar() {
  const user = DB.get('session');
  if (!user) return;
  const init = ((user.fname || '')[0] || user.email[0]).toUpperCase();
  document.getElementById('top-avatar').textContent = init;
  document.getElementById('top-name').textContent   = user.fname || user.email;
}

// Render the profile section
function renderProfile() {
  const u = DB.get('session');
  if (!u) return;

  const init = ((u.fname || '')[0] + (u.lname || '')[0]).toUpperCase() || u.email[0].toUpperCase();
  document.getElementById('profile-avatar').textContent = init;
  document.getElementById('profile-name').textContent   = `${u.fname} ${u.lname}`.trim() || u.email;
  document.getElementById('profile-email').textContent  = u.email;
  document.getElementById('profile-role').textContent   =
    (u.role?.charAt(0).toUpperCase() + u.role?.slice(1)) || 'User';

  document.getElementById('profile-grid').innerHTML = `
    <div class="info-card">
      <h3>Personal Info</h3>
      <div class="info-row"><span class="info-key">Full Name</span>    <span class="info-val">${u.fname} ${u.lname}</span></div>
      <div class="info-row"><span class="info-key">Email</span>        <span class="info-val">${u.email}</span></div>
      <div class="info-row"><span class="info-key">Phone</span>        <span class="info-val">${u.phone || '—'}</span></div>
      <div class="info-row"><span class="info-key">Role</span>         <span class="info-val">${u.role}</span></div>
    </div>
    <div class="info-card">
      <h3>Work Info</h3>
      <div class="info-row"><span class="info-key">Department</span>   <span class="info-val">${u.dept || '—'}</span></div>
      <div class="info-row"><span class="info-key">Organization</span> <span class="info-val">${u.org || '—'}</span></div>
      <div class="info-row"><span class="info-key">Account Created</span><span class="info-val">${new Date().toLocaleDateString()}</span></div>
    </div>
  `;
}

// Open the Edit Profile modal (pre-filled)
function openEditProfile() {
  const u = DB.get('session');
  if (!u) return;
  document.getElementById('p-fname').value = u.fname || '';
  document.getElementById('p-lname').value = u.lname || '';
  document.getElementById('p-email').value = u.email || '';
  document.getElementById('p-phone').value = u.phone || '';
  document.getElementById('p-dept').value  = u.dept  || '';
  document.getElementById('p-org').value   = u.org   || '';
}

// Save profile changes
function saveProfile() {
  let user = DB.get('session');
  user.fname = document.getElementById('p-fname').value.trim();
  user.lname = document.getElementById('p-lname').value.trim();
  user.email = document.getElementById('p-email').value.trim();
  user.phone = document.getElementById('p-phone').value.trim();
  user.dept  = document.getElementById('p-dept').value.trim();
  user.org   = document.getElementById('p-org').value.trim();

  // Update in users array and session
  let users = DB.get('users') || [];
  users = users.map(u => u.id === user.id ? user : u);
  DB.set('users', users);
  DB.set('session', user);

  closeModal('modal-profile');
  updateTopbar();
  renderProfile();
  toast('✅ Profile updated');
}

// ════════════════════════════════════════════
//   EXPORT — Download data as CSV/Excel
// ════════════════════════════════════════════

// Export donors list as CSV
function exportExcel() {
  const donors  = DB.get('donors') || [];
  const headers = ['ID', 'First Name', 'Last Name', 'Blood Type', 'Age', 'Phone', 'Email', 'City', 'Last Donation', 'Status', 'Notes'];
  const rows    = donors.map(d => [d.id, d.fname, d.lname, d.blood, d.age, d.phone, d.email, d.city, d.lastDon, d.status, d.notes]);
  downloadCSV([headers, ...rows], 'giftoflife_donors.csv');
  toast('⬇ Donors exported to CSV/Excel');
}

// Export requests list as CSV
function exportRequestsExcel() {
  const reqs    = DB.get('requests') || [];
  const headers = ['ID', 'Patient', 'Blood Type', 'Units', 'Hospital', 'Priority', 'Status', 'Date', 'Notes'];
  const rows    = reqs.map(r => [r.id, r.patient, r.blood, r.units, r.hospital, r.priority, r.status, r.date, r.notes]);
  downloadCSV([headers, ...rows], 'giftoflife_requests.csv');
  toast('⬇ Requests exported to CSV/Excel');
}

// Build and trigger a CSV file download
function downloadCSV(data, filename) {
  const csv  = data.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════
//   TOAST NOTIFICATION
// ════════════════════════════════════════════
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ════════════════════════════════════════════
//   INIT — Run on every page load
// ════════════════════════════════════════════

// Seed runs immediately when script loads — before any button click
seedDemoData();

window.addEventListener('DOMContentLoaded', () => {

  const isDashboard = document.getElementById('tab-overview') !== null;
  const isAuthPage  = document.getElementById('auth-login') !== null;
  const session       = DB.get('session');

  if (isDashboard) {
    // Dashboard page: require a session
    if (!session) {
      window.location.href = '../auth/login.html';
      return;
    }
    // Render all dashboard sections
    updateTopbar();
    renderOverview();
    renderDonors();
    renderRequests();
    renderProfile();
    goTab('overview');
  }

  if (isAuthPage && session) {
    // Already logged in — skip auth and go straight to dashboard
    window.location.href = '../dashboard/index.html';
  }
});
