// student.js – Student dashboard logic
let teacherCache = {};  // cache teacher info (name, email) by teacher UID

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location = 'index.html';
    } else {
        if (ADMIN_EMAILS.includes(user.email)) {
            // Redirect admin users away from student page
            window.location = 'admin.html';
            return;
        }
        // Verify the user is a student
        db.collection('students').doc(user.uid).get().then(docSnap => {
            if (!docSnap.exists) {
                // If not a student (maybe a teacher), redirect appropriately
                db.collection('teachers').doc(user.uid).get().then(snap => {
                    if (snap.exists) {
                        window.location = 'teacher.html';
                    } else {
                        auth.signOut();
                        window.location = 'index.html';
                    }
                }).catch(error => {
                    console.error('Error checking teacher profile:', error);
                    auth.signOut().then(() => window.location = 'index.html');
                });
            } else {
                const studentData = docSnap.data();
                if (!studentData.approved) {
                    // Student exists but not approved by admin
                    alert('Your account is not yet approved by admin.');
                    log('Unapproved student logged in: ' + user.email);
                    auth.signOut();
                    window.location = 'index.html';
                    return;
                }
                // Valid student – display welcome info and load dashboard data
                document.getElementById('studentInfo').textContent =
                    'Welcome, ' + studentData.name + ' (' + studentData.email + ')';
                loadTeachersList();
                loadMyAppointments();
            }
        }).catch(error => {
            console.error('Error verifying student:', error);
            alert('Error loading profile. Please try again.');
            auth.signOut().then(() => window.location = 'index.html');
        });
    }
});

// Logout button
document.getElementById('studentLogout').addEventListener('click', () => {
    auth.signOut().then(() => {
        log('Student logged out');
        window.location = 'index.html';
    });
});

// Load all approved teachers and display for the student to browse
function loadTeachersList() {
    const listDiv = document.getElementById('teachersListStudent');
    listDiv.innerHTML = '';
    db.collection('teachers').where('approved', '==', true).get().then(snapshot => {
        if (snapshot.empty) {
            listDiv.textContent = 'No teachers available.';
            return;
        }
        const table = document.createElement('table');
        const headerRow = document.createElement('tr');
        ['Name', 'Dept', 'Subject', 'Actions'].forEach(head => {
            const th = document.createElement('th');
            th.textContent = head;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        snapshot.forEach(doc => {
            const data = doc.data();
            // Cache teacher name/email for later use (appointments list)
            teacherCache[doc.id] = { name: data.name, email: data.email };
            const tr = document.createElement('tr');
            // Combine searchable text in a data attribute for filtering
            tr.dataset.info = (data.name + ' ' + (data.subject || '') + ' ' + (data.department || '')).toLowerCase();
            // Name
            const tdName = document.createElement('td');
            tdName.textContent = data.name;
            tr.appendChild(tdName);
            // Dept
            const tdDept = document.createElement('td');
            tdDept.textContent = data.department || '';
            tr.appendChild(tdDept);
            // Subject
            const tdSubj = document.createElement('td');
            tdSubj.textContent = data.subject || '';
            tr.appendChild(tdSubj);
            // Actions (Book / Message buttons)
            const tdActions = document.createElement('td');
            const bookBtn = document.createElement('button');
            bookBtn.textContent = 'Book';
            bookBtn.addEventListener('click', () => showBookingForm(doc.id, data.name));
            const msgBtn = document.createElement('button');
            msgBtn.textContent = 'Message';
            msgBtn.addEventListener('click', () => showMessageForm(doc.id, data.name));
            tdActions.appendChild(bookBtn);
            tdActions.appendChild(msgBtn);
            tr.appendChild(tdActions);
            table.appendChild(tr);
        });
        listDiv.appendChild(table);
    }).catch(error => {
        console.error('Error loading teachers list:', error);
        listDiv.textContent = 'Error loading teachers list.';
    });
}

// Filter the teachers list as the student types a search query
document.getElementById('teacherSearch').addEventListener('input', () => {
    const query = document.getElementById('teacherSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#teachersListStudent tr');
    rows.forEach((row, index) => {
        if (index === 0) return; // skip header row
        row.style.display = row.dataset.info.includes(query) ? '' : 'none';
    });
});

// Show the appointment booking form for a selected teacher
let currentTeacherId = null;
function showBookingForm(teacherId, teacherName) {
    currentTeacherId = teacherId;
    document.getElementById('selectedTeacherName').textContent = teacherName;
    document.getElementById('bookingFormContainer').classList.remove('hidden');
    document.getElementById('messageFormContainer').classList.add('hidden');
    document.getElementById('bookingFormContainer').scrollIntoView();
}

// Cancel the booking form
document.getElementById('cancelBooking').addEventListener('click', () => {
    document.getElementById('bookingFormContainer').classList.add('hidden');
    currentTeacherId = null;
});

// Handle appointment booking form submission by student
document.getElementById('bookApptForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!currentTeacherId) return;
    const datetimeStr = document.getElementById('bookDatetime').value;
    const purpose = document.getElementById('bookPurpose').value;
    const datetime = new Date(datetimeStr);
    db.collection('appointments').add({
        teacherId: currentTeacherId,
        studentId: auth.currentUser.uid,
        time: datetime,
        purpose: purpose,
        status: 'pending'
    }).then(() => {
        log('Student booked appointment with teacher ' + currentTeacherId + ' on ' + datetime.toString());
        alert('Appointment requested. Waiting for approval.');
        document.getElementById('bookApptForm').reset();
        document.getElementById('bookingFormContainer').classList.add('hidden');
        currentTeacherId = null;
        loadMyAppointments();
    }).catch(error => {
        alert('Failed to book appointment: ' + error.message);
        log('Error booking appointment: ' + error.message);
    });
});

// Show the message form for a selected teacher
let currentMsgTeacherId = null;
function showMessageForm(teacherId, teacherName) {
    currentMsgTeacherId = teacherId;
    document.getElementById('msgTeacherName').textContent = teacherName;
    document.getElementById('messageFormContainer').classList.remove('hidden');
    document.getElementById('bookingFormContainer').classList.add('hidden');
    document.getElementById('messageFormContainer').scrollIntoView();
}

// Cancel the message form
document.getElementById('cancelMessage').addEventListener('click', () => {
    document.getElementById('messageFormContainer').classList.add('hidden');
    currentMsgTeacherId = null;
});

// Handle send-message form submission (student -> teacher message)
document.getElementById('sendMsgForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!currentMsgTeacherId) return;
    const msgText = document.getElementById('messageText').value;
    db.collection('messages').add({
        teacherId: currentMsgTeacherId,
        studentId: auth.currentUser.uid,
        message: msgText,
        fromStudent: true,
        timestamp: new Date()
    }).then(() => {
        log('Student sent message to teacher ' + currentMsgTeacherId);
        alert('Message sent.');
        document.getElementById('sendMsgForm').reset();
        document.getElementById('messageFormContainer').classList.add('hidden');
        currentMsgTeacherId = null;
    }).catch(error => {
        alert('Failed to send message: ' + error.message);
        log('Error sending message: ' + error.message);
    });
});

// Load the logged-in student's appointments and display in a table
function loadMyAppointments() {
    const myApptDiv = document.getElementById('myAppointmentsList');
    myApptDiv.innerHTML = '';
    db.collection('appointments').where('studentId', '==', auth.currentUser.uid)
      .get().then(snapshot => {
        if (snapshot.empty) {
            myApptDiv.textContent = 'No appointments yet.';
            return;
        }
        const table = document.createElement('table');
        const headerRow = document.createElement('tr');
        ['Teacher', 'Date/Time', 'Purpose', 'Status'].forEach(head => {
            const th = document.createElement('th');
            th.textContent = head;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        snapshot.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement('tr');
            // Teacher Name
            const tdTeacher = document.createElement('td');
            if (teacherCache[data.teacherId]) {
                tdTeacher.textContent = teacherCache[data.teacherId].name;
            } else {
                tdTeacher.textContent = '(Unknown)';
            }
            tr.appendChild(tdTeacher);
            // Date/Time
            const tdTime = document.createElement('td');
            if (data.time) {
                const dateObj = data.time.toDate ? data.time.toDate() : new Date(data.time);
                tdTime.textContent = dateObj.toLocaleString();
            } else {
                tdTime.textContent = '';
            }
            tr.appendChild(tdTime);
            // Purpose
            const tdPurpose = document.createElement('td');
            tdPurpose.textContent = data.purpose || '';
            tr.appendChild(tdPurpose);
            // Status
            const tdStatus = document.createElement('td');
            tdStatus.textContent = data.status;
            tr.appendChild(tdStatus);
            table.appendChild(tr);
        });
        myApptDiv.appendChild(table);
    }).catch(error => {
        console.error('Error loading appointments:', error);
        myApptDiv.textContent = 'Error loading appointments.';
    });
}
