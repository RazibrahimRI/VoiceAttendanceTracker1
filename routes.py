import json
from datetime import datetime, timedelta
from flask import render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from app import app, db
from models import User, Attendance, Task, VoiceCommand
import geocoder

@app.route('/')
def index():
    if current_user.is_authenticated:
        if current_user.is_admin:
            return redirect(url_for('admin_dashboard'))
        else:
            # Get user's recent tasks and attendance
            recent_tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).limit(5).all()
            today = datetime.utcnow().date()
            today_attendance = Attendance.query.filter_by(user_id=current_user.id).filter(
                db.func.date(Attendance.check_in_time) == today
            ).first()
            return render_template('index.html', tasks=recent_tasks, attendance=today_attendance)
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return render_template('register.html')
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        # Make first user admin
        if User.query.count() == 0:
            user.is_admin = True
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/admin')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('index'))
    
    # Get statistics
    total_users = User.query.count()
    today = datetime.utcnow().date()
    today_attendance = Attendance.query.filter(
        db.func.date(Attendance.check_in_time) == today
    ).count()
    
    # Get recent attendance records
    recent_attendance = db.session.query(Attendance, User).join(User).order_by(
        Attendance.check_in_time.desc()
    ).limit(10).all()
    
    # Get task statistics
    total_tasks = Task.query.count()
    completed_tasks = Task.query.filter_by(status='completed').count()
    pending_tasks = Task.query.filter_by(status='pending').count()
    
    return render_template('admin.html', 
                         total_users=total_users,
                         today_attendance=today_attendance,
                         recent_attendance=recent_attendance,
                         total_tasks=total_tasks,
                         completed_tasks=completed_tasks,
                         pending_tasks=pending_tasks)

@app.route('/api/voice-command', methods=['POST'])
@login_required
def process_voice_command():
    data = request.get_json()
    command_text = data.get('command', '').lower().strip()
    
    # Log the voice command
    voice_command = VoiceCommand(
        user_id=current_user.id,
        command_text=command_text,
        command_type='unknown'
    )
    
    response = {'success': False, 'message': 'Command not recognized'}
    
    try:
        # Parse attendance commands
        if any(word in command_text for word in ['check in', 'mark attendance', 'attendance']):
            response = handle_attendance_command(command_text, data)
            voice_command.command_type = 'attendance'
        
        # Parse task commands
        elif any(word in command_text for word in ['task', 'add task', 'create task']):
            response = handle_task_command(command_text, data)
            voice_command.command_type = 'task'
        
        # Parse query commands
        elif any(word in command_text for word in ['show', 'list', 'display', 'what are']):
            response = handle_query_command(command_text)
            voice_command.command_type = 'query'
        
        else:
            response = {
                'success': False, 
                'message': 'I can help you with attendance, tasks, and queries. Try saying "check in", "add task", or "show my tasks".'
            }
        
        voice_command.response = response['message']
        voice_command.success = response['success']
        
    except Exception as e:
        response = {'success': False, 'message': f'Error processing command: {str(e)}'}
        voice_command.success = False
        voice_command.response = response['message']
    
    db.session.add(voice_command)
    db.session.commit()
    
    return jsonify(response)

def handle_attendance_command(command_text, data):
    """Handle attendance-related voice commands"""
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    if not latitude or not longitude:
        return {'success': False, 'message': 'Location access is required for attendance marking'}
    
    # Check if user already checked in today
    today = datetime.utcnow().date()
    existing_attendance = Attendance.query.filter_by(user_id=current_user.id).filter(
        db.func.date(Attendance.check_in_time) == today
    ).first()
    
    if 'check out' in command_text or 'checkout' in command_text:
        if existing_attendance and not existing_attendance.check_out_time:
            existing_attendance.check_out_time = datetime.utcnow()
            db.session.commit()
            return {'success': True, 'message': 'Successfully checked out!'}
        else:
            return {'success': False, 'message': 'No check-in found for today or already checked out'}
    
    if existing_attendance:
        return {'success': False, 'message': 'You have already checked in today'}
    
    # Get location name (optional)
    location_name = "Unknown Location"
    try:
        g = geocoder.osm([latitude, longitude], method='reverse')
        if g.ok:
            location_name = g.address
    except:
        pass
    
    # Create attendance record
    attendance = Attendance(
        user_id=current_user.id,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
        status='present'
    )
    
    db.session.add(attendance)
    db.session.commit()
    
    return {'success': True, 'message': f'Attendance marked successfully at {location_name}'}

def handle_task_command(command_text, data):
    """Handle task-related voice commands"""
    # Extract task title from command
    task_title = ""
    
    if 'add task' in command_text or 'create task' in command_text:
        # Extract everything after "add task" or "create task"
        if 'add task' in command_text:
            task_title = command_text.split('add task', 1)[1].strip()
        elif 'create task' in command_text:
            task_title = command_text.split('create task', 1)[1].strip()
        
        if not task_title:
            return {'success': False, 'message': 'Please specify a task title. Say "add task [task name]"'}
        
        # Create new task
        task = Task(
            user_id=current_user.id,
            title=task_title,
            status='pending',
            priority='medium'
        )
        
        db.session.add(task)
        db.session.commit()
        
        return {'success': True, 'message': f'Task "{task_title}" added successfully'}
    
    return {'success': False, 'message': 'Task command not recognized. Try "add task [task name]"'}

def handle_query_command(command_text):
    """Handle query-related voice commands"""
    if any(word in command_text for word in ['my tasks', 'tasks', 'show tasks']):
        tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).limit(5).all()
        if tasks:
            task_list = ', '.join([f"{task.title} ({task.status})" for task in tasks])
            return {'success': True, 'message': f'Your recent tasks: {task_list}'}
        else:
            return {'success': True, 'message': 'You have no tasks yet'}
    
    elif any(word in command_text for word in ['attendance', 'checked in']):
        today = datetime.utcnow().date()
        attendance = Attendance.query.filter_by(user_id=current_user.id).filter(
            db.func.date(Attendance.check_in_time) == today
        ).first()
        
        if attendance:
            if attendance.check_out_time:
                return {'success': True, 'message': f'You checked in at {attendance.check_in_time.strftime("%H:%M")} and checked out at {attendance.check_out_time.strftime("%H:%M")}'}
            else:
                return {'success': True, 'message': f'You checked in at {attendance.check_in_time.strftime("%H:%M")} today'}
        else:
            return {'success': True, 'message': 'You have not checked in today'}
    
    return {'success': False, 'message': 'Query not recognized. Try "show my tasks" or "show attendance"'}

@app.route('/api/admin/stats')
@login_required
def admin_stats():
    if not current_user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    # Attendance stats for the last 7 days
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=6)
    
    attendance_stats = []
    for i in range(7):
        date = start_date + timedelta(days=i)
        count = Attendance.query.filter(db.func.date(Attendance.check_in_time) == date).count()
        attendance_stats.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    
    # Task status distribution
    task_stats = {
        'pending': Task.query.filter_by(status='pending').count(),
        'in_progress': Task.query.filter_by(status='in_progress').count(),
        'completed': Task.query.filter_by(status='completed').count()
    }
    
    return jsonify({
        'attendance_stats': attendance_stats,
        'task_stats': task_stats
    })

@app.route('/tasks')
@login_required
def tasks():
    user_tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).all()
    return render_template('tasks.html', tasks=user_tasks)

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    data = request.get_json()
    task = Task(
        user_id=current_user.id,
        title=data['title'],
        description=data.get('description', ''),
        priority=data.get('priority', 'medium')
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Task created successfully'})

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    task.status = data.get('status', task.status)
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.priority = data.get('priority', task.priority)
    task.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'Task updated successfully'})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    db.session.delete(task)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Task deleted successfully'})
