from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Class(models.Model):
    classroom_id = models.AutoField(primary_key=True)
    scanner_id = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"Classroom {self.classroom_id}"


class Student(models.Model):
    student_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='student_profile')
    student_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, null=True, blank=True)
    # image = models.ImageField(upload_to='student_images/', null=True, blank=True)  # for CV
    rfid = models.CharField(max_length=100, unique=True)
    overall_attendance = models.FloatField(default=0.0)  # percentage
    year = models.IntegerField()  # e.g., 1, 2, 3, 4
    dept = models.CharField(max_length=100)  # e.g., CS, IT
    section = models.CharField(max_length=10)  # e.g., A, B, C

    def __str__(self):
        return self.student_name

class Course(models.Model):
    course_id = models.AutoField(primary_key=True)
    course_name = models.CharField(max_length=200)
    course_code = models.CharField(max_length=20, unique=True, null=True, blank=True)

    def __str__(self):
        return self.course_name

class Teacher(models.Model):
    teacher_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='teacher_profile')
    teacher_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, null=True, blank=True)
    # image = models.ImageField(upload_to='teacher_images/', null=True, blank=True)
    rfid = models.CharField(max_length=100, unique=True)
    department = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        return self.teacher_name

class Management(models.Model):
    ROLE_CHOICES = [
        ('university_admin', 'University Admin'),
        ('event_admin', 'Event Admin'),
    ]
    Management_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='management_profile')
    Management_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, null=True, blank=True)
    department = models.CharField(max_length=100, blank=True, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='university_admin')

    def __str__(self):
        return self.Management_name

class TaughtCourse(models.Model):
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='taught_courses')
    teacher = models.ForeignKey('Teacher', on_delete=models.CASCADE, related_name='taught_courses')
    classes_taken = models.CharField(max_length=255)  # e.g., "Class A, Class B"
    section = models.CharField(max_length=10, blank=True)  # e.g., A, B, C
    year = models.IntegerField(null=True, blank=True)  # e.g., 1, 2, 3, 4
    program = models.CharField(max_length=100, blank=True, default='')  # e.g., BSCS, BSIT

    def __str__(self):
        return f"{self.teacher} teaches {self.course}"

class StudentCourse(models.Model):
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='student_courses')
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='student_courses')
    teacher = models.ForeignKey('Teacher', on_delete=models.CASCADE, related_name='student_courses')
    classes_attended = models.CharField(max_length=255, blank=True)  # e.g., "Class A, Class B"

    def __str__(self):
        return f"{self.student} - {self.course} - {self.teacher}"


class UpdateAttendanceRequest(models.Model):
    """
    Model for attendance update requests sent by teachers.
    Teachers can request attendance updates for specific students in specific courses.
    Management can approve or reject these requests.
    student is nullable to support bulk / batch-level requests from the frontend.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    teacher = models.ForeignKey('Teacher', on_delete=models.CASCADE, related_name='attendance_update_requests')
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='attendance_update_requests',
                                null=True, blank=True)
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='attendance_update_requests')
    batch = models.CharField(max_length=20, blank=True, default='')  # e.g., "2023" batch year
    program = models.CharField(max_length=100, blank=True, default='')  # e.g., "BSCS"
    attendance_type = models.CharField(max_length=50, blank=True, default='')  # e.g., "Lecture"
    slots = models.IntegerField(null=True, blank=True)  # number of slots to add
    classes_to_add = models.CharField(max_length=255, blank=True, default='')  # e.g., "Class A, Class B"
    reason = models.TextField(blank=True)  # Optional reason for the request
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey('Management', on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_attendance_requests')

    def __str__(self):
        return f"Request by {self.teacher} in {self.course} - {self.status}"

    class Meta:
        ordering = ['-requested_at']


class AttendanceSession(models.Model):
    """
    Model for attendance sessions started by teachers.
    Teachers can start/stop sessions for a specific course, section, and year.
    Supports optional geolocation validation and QR-only mode.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('stopped', 'Stopped'),
    ]

    teacher = models.ForeignKey('Teacher', on_delete=models.CASCADE, related_name='attendance_sessions')
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='attendance_sessions')
    section = models.CharField(max_length=10)  # e.g., A, B, C
    year = models.IntegerField()  # e.g., 1, 2, 3, 4
    program = models.CharField(max_length=100, blank=True, default='')  # e.g., BSCS
    session_type = models.CharField(max_length=50, blank=True, default='')  # e.g., Lecture, Lab
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    qr_code_token = models.CharField(max_length=255, unique=True)  # Token for QR code validation
    started_at = models.DateTimeField(auto_now_add=True)
    stopped_at = models.DateTimeField(null=True, blank=True)
    # Geolocation for classroom validation
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    radius_meters = models.IntegerField(default=50, null=True, blank=True)
    # When False, QR scan alone marks attendance (no RFID required)
    require_rfid = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.teacher} - {self.course} - {self.section} - Year {self.year} - {self.status}"

    class Meta:
        ordering = ['-started_at']


class AttendanceRecord(models.Model):
    """
    Model for tracking 2FA attendance (RFID + QR code).
    Students must scan both RFID and QR code to mark attendance
    (unless the session has require_rfid=False).
    """
    session = models.ForeignKey('AttendanceSession', on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='attendance_records')
    rfid_scanned = models.BooleanField(default=False)
    rfid_scanned_at = models.DateTimeField(null=True, blank=True)
    qr_scanned = models.BooleanField(default=False)
    qr_scanned_at = models.DateTimeField(null=True, blank=True)
    is_present = models.BooleanField(default=False)  # True only when required scans complete
    marked_present_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.student} - {self.session} - Present: {self.is_present}"

    class Meta:
        unique_together = ['session', 'student']
        ordering = ['-marked_present_at']


# ============ Event Management Models ============

class EventParticipant(models.Model):
    """
    A registered user who can register for and attend events.
    Has a Django User account for authenticated access.
    """
    participant_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True,
                                related_name='participant_profile')
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True, default='')

    def __str__(self):
        return self.name


class Event(models.Model):
    """
    An event created by an event admin (Management user with role='event_admin').
    """
    event_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    venue = models.CharField(max_length=255, blank=True, default='')
    date = models.DateField()
    reg_start = models.DateField(null=True, blank=True)
    reg_end = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, default='')
    registration_link = models.URLField(blank=True, default='')
    created_by = models.ForeignKey('Management', on_delete=models.CASCADE,
                                   related_name='events', null=True, blank=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-date']


class EventRegistration(models.Model):
    """
    Tracks which participants have registered for which events.
    """
    STATUS_CHOICES = [
        ('registered', 'Registered'),
        ('cancelled', 'Cancelled'),
    ]
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    participant = models.ForeignKey(EventParticipant, on_delete=models.CASCADE,
                                    related_name='registrations')
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='registered')

    class Meta:
        unique_together = ['event', 'participant']

    def __str__(self):
        return f"{self.participant} → {self.event}"


class EventAttendance(models.Model):
    """
    Tracks attendance at an event.
    """
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendance_records')
    participant = models.ForeignKey(EventParticipant, on_delete=models.CASCADE,
                                    related_name='event_attendances')
    status = models.CharField(max_length=20, default='present')
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['event', 'participant']

    def __str__(self):
        return f"{self.participant} at {self.event} - {self.status}"

