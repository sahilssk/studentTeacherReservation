// admin.js

// Helper to show messages
function showMessage(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.style.color = isError ? 'red' : 'green';
  }
  
  // Add Student
  document.getElementById('addStudentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('studentName').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const password = document.getElementById('studentPassword').value.trim();
    if (!name || !email || !password) {
      showMessage('studentMessage', 'All fields are required', true);
      return;
    }
    const apiKey = firebase.app().options.apiKey;
    fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: email,
        password: password,
        displayName: name,
        emailVerified: true
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showMessage('studentMessage', `Error: ${data.error.message}`, true);
      } else {
        const uid = data.localId;
        firebase.firestore().collection('students').doc(uid).set({
          name: name,
          email: email,
          approved: true
        }).then(() => {
          showMessage('studentMessage', 'Student added successfully.');
          document.getElementById('addStudentForm').reset();
        }).catch(err => {
          showMessage('studentMessage', `Firestore error: ${err}`, true);
        });
      }
    })
    .catch(err => {
      showMessage('studentMessage', `Network error: ${err}`, true);
    });
  });
  
  // Add Teacher
  document.getElementById('addTeacherForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('teacherName').value.trim();
    const email = document.getElementById('teacherEmail').value.trim();
    const password = document.getElementById('teacherPassword').value.trim();
    if (!name || !email || !password) {
      showMessage('teacherMessage', 'All fields are required', true);
      return;
    }
    const apiKey = firebase.app().options.apiKey;
    fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: email,
        password: password,
        displayName: name,
        emailVerified: true
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showMessage('teacherMessage', `Error: ${data.error.message}`, true);
      } else {
        const uid = data.localId;
        firebase.firestore().collection('teachers').doc(uid).set({
          name: name,
          email: email,
          approved: true
        }).then(() => {
          showMessage('teacherMessage', 'Teacher added successfully.');
          document.getElementById('addTeacherForm').reset();
        }).catch(err => {
          showMessage('teacherMessage', `Firestore error: ${err}`, true);
        });
      }
    })
    .catch(err => {
      showMessage('teacherMessage', `Network error: ${err}`, true);
    });
  });
  
  // Logout Button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    firebase.auth().signOut()
      .then(() => window.location.href = 'index.html')
      .catch(error => alert('Logout failed: ' + error.message));
  });
  