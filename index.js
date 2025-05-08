// index.js – Login & Registration logic
document.getElementById('showRegister').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
});
document.getElementById('showLogin').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
});

// Handle Login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
          log('User logged in: ' + email);
          const user = cred.user;
          const uid = user.uid;
          // Determine user role and redirect accordingly
          if (ADMIN_EMAILS.includes(user.email)) {
              // Admin user
              window.location = 'admin.html';
          } else {
              // Check if Teacher
              db.collection('teachers').doc(uid).get()
                .then(docSnap => {
                    if (docSnap.exists) {
                        const teacherData = docSnap.data();
                        if (teacherData.approved === false) {
                            // Teacher exists but not approved
                            alert('Your account is not yet approved by admin.');
                            auth.signOut();
                        } else {
                            // Approved teacher
                            window.location = 'teacher.html';
                        }
                    } else {
                        // Not a teacher – check if Student
                        db.collection('students').doc(uid).get()
                          .then(snap => {
                              if (snap.exists) {
                                  const studentData = snap.data();
                                  if (studentData.approved === false) {
                                      // Student not approved
                                      alert('Your account is not yet approved by admin.');
                                      auth.signOut();
                                  } else {
                                      // Approved student
                                      window.location = 'student.html';
                                  }
                              } else {
                                  // No profile found for this user
                                  log('Unknown user role for: ' + email);
                                  alert('No user profile found. Contact administrator.');
                                  auth.signOut();
                              }
                          })
                          .catch(error => {
                              console.error('Error checking student profile:', error);
                              alert('Error verifying student profile. Please try again.');
                              auth.signOut();
                          });
                    }
                })
                .catch(error => {
                    console.error('Error checking teacher profile:', error);
                    alert('Error verifying user role. Please try again.');
                    auth.signOut();
                });
          }
      })
      .catch(error => {
          alert('Login failed: ' + error.message);
          log('Login failed for ' + email + ': ' + error.message);
      });
});

// Handle Student Registration form submission
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
          // Create student profile in Firestore (unapproved by default)
          return db.collection('students').doc(cred.user.uid).set({
              name: name,
              email: email,
              approved: false  // waiting for admin approval
          });
      })
      .then(() => {
          log('New student registered: ' + email + ' (pending approval)');
          alert('Registration successful! Please wait for admin approval before logging in.');
          // Log the new student out until approved
          return auth.signOut();
      })
      .catch(error => {
          alert('Registration failed: ' + error.message);
          log('Registration failed for ' + email + ': ' + error.message);
          auth.signOut();
      });
});
