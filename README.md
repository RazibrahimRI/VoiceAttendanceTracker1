# Voice Assistant - Attendance & Task Management System

A Flask-based web application that provides voice-controlled attendance tracking and task management with location validation and admin analytics.

## Features

🎤 **Voice Recognition Interface**
- Natural language voice commands
- Hands-free operation
- Real-time speech-to-text processing

📍 **Location-Based Attendance**
- GPS location validation
- Automatic check-in/check-out
- Location name resolution

📋 **Task Management**
- Voice-controlled task creation
- Task status tracking (pending, in-progress, completed)
- Priority levels (low, medium, high)

👥 **User Management**
- Secure user authentication
- Role-based access (admin/user)
- First user becomes admin automatically

📊 **Admin Dashboard**
- Real-time analytics charts
- Attendance trends (7-day view)
- Task status distribution
- User activity monitoring

## Technology Stack

- **Backend**: Flask (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Frontend**: Bootstrap 5 (Dark Theme)
- **Voice Recognition**: Web Speech API
- **Location Services**: Geolocation API + Geocoder
- **Charts**: Chart.js
- **Icons**: Font Awesome

## Installation

### Prerequisites
- Python 3.11+
- PostgreSQL database
- Modern web browser (Chrome, Edge, Safari for voice features)

### Setup Steps

1. **Extract the project files**
   ```bash
   unzip voice-assistant-project.zip
   cd voice-assistant-project
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```
   
   Or if using uv:
   ```bash
   uv sync
   ```

3. **Set up environment variables**
   Create a `.env` file or set the following environment variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   SESSION_SECRET=your-secret-key-here
   ```

4. **Initialize the database**
   ```bash
   python app.py
   ```
   The database tables will be created automatically on first run.

5. **Run the application**
   ```bash
   python main.py
   ```
   
   Or for production:
   ```bash
   gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
   ```

6. **Access the application**
   Open your browser and go to `http://localhost:5000`

## Usage

### First Time Setup
1. Register your first account (automatically becomes admin)
2. Allow microphone and location permissions when prompted
3. Start using voice commands!

### Voice Commands

**Attendance Commands:**
- "Check in" or "Mark attendance" - Records your attendance with current location
- "Check out" - Records check-out time

**Task Commands:**
- "Add task [task name]" - Creates a new task
- "Create task [task name]" - Alternative task creation command

**Query Commands:**
- "Show my tasks" - Lists your recent tasks
- "Show attendance" - Shows today's attendance status

### Admin Features
- Access admin dashboard at `/admin`
- View attendance trends and analytics
- Monitor user activity and task completion rates
- Real-time charts and statistics

### Quick Actions
- Use the quick check-in/check-out buttons for fast attendance marking
- Keyboard shortcut: `Ctrl + Space` to toggle voice recognition

## Browser Compatibility

**Voice Recognition Support:**
- ✅ Chrome/Chromium (Recommended)
- ✅ Microsoft Edge
- ✅ Safari (iOS/macOS)
- ❌ Firefox (Limited support)

**Location Services:**
- Requires HTTPS in production for location access
- Works on localhost for development

## Security Features

- Password hashing with Werkzeug
- Session management with Flask-Login
- CSRF protection
- Input validation and sanitization
- Role-based access control

## File Structure

```
voice-assistant-project/
├── app.py              # Flask application setup
├── main.py             # Application entry point
├── models.py           # Database models
├── routes.py           # URL routes and handlers
├── pyproject.toml      # Project dependencies
├── templates/          # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── admin.html
└── static/             # Static assets
    ├── css/
    │   └── style.css
    └── js/
        ├── voice-assistant.js
        └── admin-charts.js
```

## Database Schema

**Users Table:**
- id, username, email, password_hash, is_admin, created_at

**Attendance Table:**
- id, user_id, check_in_time, check_out_time, latitude, longitude, location_name, status

**Tasks Table:**
- id, user_id, title, description, status, priority, created_at, updated_at, due_date

**Voice Commands Table:**
- id, user_id, command_text, command_type, response, timestamp, success

## Production Deployment

1. **Environment Setup:**
   - Set `SESSION_SECRET` to a secure random string
   - Configure PostgreSQL database
   - Enable HTTPS for location services

2. **Web Server:**
   - Use Gunicorn with multiple workers
   - Configure reverse proxy (Nginx recommended)
   - Set up SSL certificates

3. **Security:**
   - Keep dependencies updated
   - Use environment variables for secrets
   - Enable database connection pooling

## Troubleshooting

**Voice Recognition Issues:**
- Ensure microphone permissions are granted
- Use Chrome/Edge browsers for best compatibility
- Check browser console for error messages

**Location Problems:**
- Enable location services in browser settings
- Use HTTPS in production environments
- Check network connectivity for geocoding

**Database Errors:**
- Verify PostgreSQL is running
- Check DATABASE_URL environment variable
- Ensure database exists and is accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console logs
3. Verify environment configuration
4. Test with different browsers

---

**Enjoy your voice-controlled attendance and task management system!** 🎤✨