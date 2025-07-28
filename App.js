class UserManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = null;
    }

    // Register a new user
    register(userData) {
        if (this.users.some(user => user.email === userData.email)) {
            throw new Error('Email already registered');
        }

        userData.id = Date.now();
        userData.connections = [];
        userData.posts = [];
        userData.messages = []; // Initialize message array
        this.users.push(userData);
        this.saveUsers();
        return userData;
    }

    // Login an existing user
    login(email, password, userType) {
        const user = this.users.find(u => u.email === email && u.password === password && u.userType === userType);
        if (user) {
            this.currentUser = user;
            return user;
        }
        throw new Error('Invalid credentials');
    }

    // Save users to local storage
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // Send a message from one user to another
    sendMessage(sender, receiverEmail, messageText, file = null) {
        const receiver = this.users.find(user => user.email === receiverEmail);
        if (!receiver) {
            throw new Error('Receiver not found');
        }

        const message = {
            sender: sender.email,
            receiver: receiver.email,
            text: messageText,
            timestamp: new Date(),
            file: file ? file.name : null, // Store file name if file is provided
        };

        // Store message in sender's and receiver's message list
        sender.messages.push(message);
        receiver.messages.push(message);
        this.saveUsers();
    }

    // Clear chat history for the current user
    clearChat(user) {
        user.messages = [];
        this.saveUsers();
    }

    // Send connection request from student to alumni
    sendConnectionRequest(student, alumniEmail) {
        const alumni = this.users.find(user => user.email === alumniEmail && user.userType === 'alumni');
        
        if (!alumni) {
            throw new Error('Alumni not found');
        }

        // Check if connection request already exists
        if (alumni.connectionRequests && 
            alumni.connectionRequests.some(req => req.studentEmail === student.email)) {
            throw new Error('Connection request already sent');
        }

        // Initialize connection requests array if not exists
        alumni.connectionRequests = alumni.connectionRequests || [];

        // Add connection request
        const request = {
            studentEmail: student.email,
            studentName: student.name,
            timestamp: new Date(),
            status: 'pending'
        };

        alumni.connectionRequests.push(request);
        this.saveUsers();

        return request;
    }

    // Alumni accepts connection request
    acceptConnectionRequest(alumni, studentEmail) {
        if (!alumni.connectionRequests) {
            throw new Error('No connection requests');
        }

        const requestIndex = alumni.connectionRequests.findIndex(
            req => req.studentEmail === studentEmail && req.status === 'pending'
        );

        if (requestIndex === -1) {
            throw new Error('Connection request not found');
        }

        // Update request status
        alumni.connectionRequests[requestIndex].status = 'accepted';

        // Add to connections
        alumni.connections = alumni.connections || [];
        const student = this.users.find(user => user.email === studentEmail);
        
        alumni.connections.push({
            email: student.email,
            name: student.name
        });

        student.connections = student.connections || [];
        student.connections.push({
            email: alumni.email,
            name: alumni.name
        });

        this.saveUsers();
        return alumni.connectionRequests[requestIndex];
    }

    // Alumni rejects connection request
    rejectConnectionRequest(alumni, studentEmail) {
        if (!alumni.connectionRequests) {
            throw new Error('No connection requests');
        }

        const requestIndex = alumni.connectionRequests.findIndex(
            req => req.studentEmail === studentEmail && req.status === 'pending'
        );

        if (requestIndex === -1) {
            throw new Error('Connection request not found');
        }

        // Update request status
        alumni.connectionRequests[requestIndex].status = 'rejected';
        this.saveUsers();

        return alumni.connectionRequests[requestIndex];
    }
}

class DashboardRenderer {
    static renderStudentDashboard(user) {
        document.body.innerHTML = `
            <div class="top-container">
                <h2 class="sub-heading">Kammavari Sangham (R) 1952, K.S. Group of Institutions</h2>
                <header class="header">
                    <img src="images/ksit-logo.png" alt="KSIT Logo" class="ksit-logo">
                    <div class="text-container">
                        <h1 class="main-heading">KS Institute of Technology</h1>
                        <p class="address">
                            No.14, Raghuvanahalli, Kanakapura Road, Bengaluru - 560109, 9900710055<br>
                            Affiliated to VTU, Belagavi & Approved by AICTE, New Delhi, Accredited by NBA, NAAC & IEI
                        </p>
                    </div>
                </header>
            </div>

            <div class="container student-dashboard">
                <header>
                    <h1>Student Dashboard</h1>
                    <p>Welcome, ${user.name}</p>
                </header>

                <div class="dashboard">
                    <div class="dashboard-section">
                        <h2>Alumni Connections</h2>
                        <button onclick="studentActions.findConnections()">Find Connections</button>
                        <div id="find-connections"></div>
                    </div>
                    <div class="dashboard-section">
                        <h2>Internship Opportunities</h2>
                        <button onclick="studentActions.postInternshipInterest()">Post Interest</button>
                        <div id="internship-opportunities">
                            ${studentActions.displayInternships()}
                        </div>
                    </div>
                    <div class="dashboard-section">
                        <h2>Skills & Achievements</h2>
                        <button onclick="studentActions.addSkill()">Add Skill</button>
                    </div>
                    <div class="dashboard-section">
                        <h2>Messages</h2>
                        <button onclick="studentActions.openMessages()">Open Messages</button>
                    </div>
                </div>
            </div>
        `;
    }

    static renderAlumniDashboard(user) {
        document.body.innerHTML = `
            <div class="top-container">
                <h2 class="sub-heading">Kammavari Sangham (R) 1952, K.S. Group of Institutions</h2>
                <header class="header">
                    <img src="images/ksit-logo.png" alt="KSIT Logo" class="ksit-logo">
                    <div class="text-container">
                        <h1 class="main-heading">KS Institute of Technology</h1>
                        <p class="address">
                            No.14, Raghuvanahalli, Kanakapura Road, Bengaluru - 560109, 9900710055<br>
                            Affiliated to VTU, Belagavi & Approved by AICTE, New Delhi, Accredited by NBA, NAAC & IEI
                        </p>
                    </div>
                </header>
            </div>

            <div class="container alumni-dashboard">
                <header>
                    <h1>Alumni Dashboard</h1>
                    <p>Welcome, ${user.name}</p>
                </header>

                <div class="dashboard">
                    <div class="dashboard-section">
                        <h2>Pending Connection Requests</h2>
                        <button onclick="alumniActions.findConnections()">Find Connections</button>
                        <div id="find-connections"></div>
                    </div>
                    <div class="dashboard-section">
                        <h2>Job Opportunities</h2>
                        <button onclick="alumniActions.postJobOpportunities()">Post Job Opportunity</button>
                    </div>
                    <div class="dashboard-section">
                        <h2>Mentorship</h2>
                        <button onclick="alumniActions.offerMentorship()">Offer Mentorship</button>
                    </div>
                    <div class="dashboard-section">
                        <h2>Messages</h2>
                        <button onclick="alumniActions.openMessages()">Open Messages</button>
                    </div>
                </div>
            </div>
        `;
    }

    static renderMessages(user, recipientEmail) {
        const messages = user.messages.filter(msg => 
            (msg.sender === user.email && msg.receiver === recipientEmail) || 
            (msg.receiver === user.email && msg.sender === recipientEmail)
        ).map(msg => `
            <div class="message">
                <strong>${msg.sender === user.email ? 'You' : msg.sender}</strong> - 
                <span>${new Date(msg.timestamp).toLocaleString()}</span>
                <p>${msg.text}</p>
                ${msg.file ? `<a href="#">Download: ${msg.file}</a>` : ''}
            </div>
        `).join('');

        const userList = userManager.users.filter(u => u.email !== user.email).map(u => `<option value="${u.email}">${u.name}</option>`).join('');

        document.body.innerHTML = `
            <div class="top-container">
                <h2 class="sub-heading">Kammavari Sangham (R) 1952, K.S. Group of Institutions</h2>
                <header class="header">
                    <img src="images/ksit-logo.png" alt="KSIT Logo" class="ksit-logo">
                    <div class="text-container">
                        <h1 class="main-heading">KS Institute of Technology</h1>
                        <p class="address">
                            No.14, Raghuvanahalli, Kanakapura Road, Bengaluru - 560109, 9900710055<br>
                            Affiliated to VTU, Belagavi & Approved by AICTE, New Delhi, Accredited by NBA, NAAC & IEI
                        </p>
                    </div>
                </header>
            </div>

            <div class="container messages-window">
                <header>
                    <h1>Messages</h1>
                    <p>Welcome, ${user.name}</p>
                    <button onclick="studentActions.clearChat()">Clear Chat</button>
                </header>

                <label for="recipient">Select recipient:</label>
                <select id="recipient">
                    <option value="">Select a user</option>
                    ${userList}
                </select>

                <div class="messages-list">
                    ${messages}
                </div>

                <textarea id="message-text" placeholder="Type a message"></textarea>
                <input type="file" id="file-upload">
                <button onclick="studentActions.sendMessage()">Send Message</button>
            </div>
        `;
    }
}

// Student Actions Object
const studentActions = {
    findConnections() {
        const alumni = userManager.users.filter(user => user.userType === 'alumni');
        const connectionList = `
            <h2>Available Alumni Connections</h2>
            <ul>
                ${alumni.map(alumnus => `
                    <li>
                        ${alumnus.name} (${alumnus.currentCompany}) 
                        <button onclick="studentActions.sendConnectionRequest('${alumnus.email}')">Send Connection Request</button>
                    </li>
                `).join('')}
            </ul>
        `;
        document.getElementById('find-connections').innerHTML = connectionList;
    },

    sendConnectionRequest(alumniEmail) {
        try {
            const student = userManager.currentUser;
            const request = userManager.sendConnectionRequest(student, alumniEmail);
            alert('Connection request sent successfully!');
        } catch (error) {
            alert(error.message);
        }
    },

    postInternshipInterest() {
        const internshipDetails = prompt('Enter your internship interest details:');
        if (internshipDetails) {
            alert(`Internship Interest posted: ${internshipDetails}`);
            userManager.currentUser.internships.push(internshipDetails);
            userManager.saveUsers();
        }
    },

    displayInternships() {
        const internships = userManager.users.filter(user => user.userType === 'alumni').map(user => {
            return user.internships ? user.internships.join('<br>') : '';
        }).join('<br>');
        return internships ? `<p>${internships}</p>` : '<p>No internships available currently.</p>';
    },

    addSkill() {
        const skill = prompt('Enter a skill to add:');
        if (skill) {
            alert(`Skill added: ${skill}`);
        }
    },

    openMessages() {
        const recipientEmail = prompt('Enter recipient email:');
        DashboardRenderer.renderMessages(userManager.currentUser, recipientEmail);
    },

    sendMessage() {
        const recipientEmail = document.getElementById('recipient').value;
        const messageText = document.getElementById('message-text').value;
        const file = document.getElementById('file-upload').files[0];

        if (recipientEmail && messageText) {
            const recipient = userManager.users.find(user => user.email === recipientEmail);
            userManager.sendMessage(userManager.currentUser, recipientEmail, messageText, file);
            alert('Message sent!');
            studentActions.openMessages(); // Reload the chat
        } else {
            alert('Please select a recipient and enter a message.');
        }
    },

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            userManager.clearChat(userManager.currentUser);
            studentActions.openMessages();
        }
    }
};

// Alumni Actions Object
const alumniActions = {
    findConnections() {
        const pendingConnections = userManager.currentUser.connectionRequests.filter(req => req.status === 'pending');
        const connectionList = `
            <h2>Pending Connection Requests</h2>
            <ul>
                ${pendingConnections.map(req => `
                    <li>
                        ${req.studentName} 
                        <button onclick="alumniActions.acceptConnectionRequest('${req.studentEmail}')">Accept</button>
                        <button onclick="alumniActions.rejectConnectionRequest('${req.studentEmail}')">Reject</button>
                    </li>
                `).join('')}
            </ul>
        `;
        document.getElementById('find-connections').innerHTML = connectionList;
    },

    acceptConnectionRequest(studentEmail) {
        try {
            const alumni = userManager.currentUser;
            userManager.acceptConnectionRequest(alumni, studentEmail);
            alert('Connection request accepted!');
            alumniActions.findConnections();
        } catch (error) {
            alert(error.message);
        }
    },

    rejectConnectionRequest(studentEmail) {
        try {
            const alumni = userManager.currentUser;
            userManager.rejectConnectionRequest(alumni, studentEmail);
            alert('Connection request rejected!');
            alumniActions.findConnections();
        } catch (error) {
            alert(error.message);
        }
    },

    postJobOpportunities() {
        const jobDetails = prompt('Enter job opportunity details:');
        if (jobDetails) {
            alert(`Job Opportunity posted: ${jobDetails}`);
        }
    },

    offerMentorship() {
        const mentorshipDetails = prompt('Enter mentorship details:');
        if (mentorshipDetails) {
            alert(`Mentorship offered: ${mentorshipDetails}`);
        }
    },

    openMessages() {
        const recipientEmail = prompt('Enter recipient email:');
        DashboardRenderer.renderMessages(userManager.currentUser, recipientEmail);
    }
};

// Event Listeners and other logic for signup, login, etc., remain the same as the previous code.

// User Management Instance
const userManager = new UserManager();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const userTypeSelect = document.getElementById('signup-user-type');

    // Dynamic Field Display
    userTypeSelect.addEventListener('change', (e) => {
        const studentFields = document.getElementById('student-fields');
        const alumniFields = document.getElementById('alumni-fields');

        if (e.target.value === 'student') {
            studentFields.style.display = 'block';
            alumniFields.style.display = 'none';
        } else {
            studentFields.style.display = 'none';
            alumniFields.style.display = 'block';
        }
    });

    // Signup Logic
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const userType = document.getElementById('signup-user-type').value;

        const userData = { 
            name, 
            email, 
            password, 
            userType 
        };

        if (userType === 'student') {
            userData.university = document.getElementById('university').value;
            userData.major = document.getElementById('major').value;
            userData.graduationYear = document.getElementById('graduation-year').value;
        } else {
            userData.university = document.getElementById('alumni-university').value;
            userData.graduationYear = document.getElementById('graduation-year-alumni').value;
            userData.currentCompany = document.getElementById('current-company').value;
        }

        try {
            const registeredUser = userManager.register(userData);
            if (userType === 'student') {
                DashboardRenderer.renderStudentDashboard(registeredUser);
            } else {
                DashboardRenderer.renderAlumniDashboard(registeredUser);
            }
        } catch (error) {
            alert(error.message);
        }
    });

    // Login Logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const userType = document.getElementById('login-user-type').value;

        try {
            const user = userManager.login(email, password, userType);
            if (user.userType === 'student') {
                DashboardRenderer.renderStudentDashboard(user);
            } else {
                DashboardRenderer.renderAlumniDashboard(user);
            }
        } catch (error) {
            alert(error.message);
        }
    });
});

