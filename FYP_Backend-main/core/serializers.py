from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    Student, Teacher, Management, Course, Class, TaughtCourse, StudentCourse,
    UpdateAttendanceRequest, AttendanceSession, AttendanceRecord,
    Event, EventParticipant, EventRegistration, EventAttendance,
)


# ============ Model Serializers for CRUD operations ============

class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model CRUD operations"""
    class Meta:
        model = Student
        fields = ['student_id', 'student_name', 'email', 'rfid', 'overall_attendance', 'year', 'dept', 'section']
        read_only_fields = ['student_id']


class StudentCourseDetailSerializer(serializers.ModelSerializer):
    """Nested course info returned inside StudentDetailSerializer"""
    course_id = serializers.IntegerField(source='course.course_id', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    teacher_name = serializers.CharField(source='teacher.teacher_name', read_only=True)
    # Compute numeric attendance counts from comma-separated strings
    classes_attended_count = serializers.SerializerMethodField()
    total_classes = serializers.SerializerMethodField()
    attendance_percentage = serializers.SerializerMethodField()

    class Meta:
        model = StudentCourse
        fields = [
            'course_id', 'course_name', 'course_code', 'teacher_name',
            'classes_attended_count', 'total_classes', 'attendance_percentage',
        ]

    def _count(self, s):
        if not s:
            return 0
        return len([x for x in s.split(',') if x.strip()])

    def get_classes_attended_count(self, obj):
        return self._count(obj.classes_attended)

    def get_total_classes(self, obj):
        try:
            tc = TaughtCourse.objects.get(course=obj.course, teacher=obj.teacher)
            return self._count(tc.classes_taken)
        except TaughtCourse.DoesNotExist:
            return 0

    def get_attendance_percentage(self, obj):
        attended = self.get_classes_attended_count(obj)
        total = self.get_total_classes(obj)
        if total == 0:
            return 0.0
        return round(attended / total * 100, 1)


class StudentDetailSerializer(serializers.ModelSerializer):
    """Full student profile including course attendance stats — used by /me endpoint"""
    courses = StudentCourseDetailSerializer(source='student_courses', many=True, read_only=True)

    class Meta:
        model = Student
        fields = [
            'student_id', 'student_name', 'email', 'overall_attendance',
            'year', 'dept', 'section', 'courses',
        ]


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for Teacher model CRUD operations"""
    class Meta:
        model = Teacher
        fields = ['teacher_id', 'teacher_name', 'email', 'rfid', 'department']
        read_only_fields = ['teacher_id']


class TeacherDetailSerializer(serializers.ModelSerializer):
    """Full teacher profile including taught courses — used by /me endpoint"""
    taught_courses = serializers.SerializerMethodField()
    batches = serializers.SerializerMethodField()
    programs = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = [
            'teacher_id', 'teacher_name', 'email', 'department',
            'taught_courses', 'batches', 'programs',
        ]

    def get_taught_courses(self, obj):
        return [
            {
                'course_id': tc.course.course_id,
                'course_name': tc.course.course_name,
                'course_code': tc.course.course_code,
                'section': tc.section,
                'year': tc.year,
                'program': tc.program,
            }
            for tc in obj.taught_courses.select_related('course').all()
        ]

    def get_batches(self, obj):
        years = obj.taught_courses.values_list('year', flat=True).distinct()
        return [str(y) for y in years if y is not None]

    def get_programs(self, obj):
        programs = obj.taught_courses.values_list('program', flat=True).distinct()
        return [p for p in programs if p]


class ManagementSerializer(serializers.ModelSerializer):
    """Serializer for Management model CRUD operations"""
    class Meta:
        model = Management
        fields = ['Management_id', 'Management_name', 'email', 'department', 'role']
        read_only_fields = ['Management_id']


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model CRUD operations"""
    class Meta:
        model = Course
        fields = ['course_id', 'course_name', 'course_code']
        read_only_fields = ['course_id']


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class model CRUD operations"""
    class Meta:
        model = Class
        fields = ['classroom_id', 'scanner_id']
        read_only_fields = ['classroom_id']


class TaughtCourseSerializer(serializers.ModelSerializer):
    """Serializer for TaughtCourse model CRUD operations"""
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.teacher_name', read_only=True)

    class Meta:
        model = TaughtCourse
        fields = ['id', 'course', 'teacher', 'course_name', 'teacher_name', 'classes_taken', 'section', 'year', 'program']
        read_only_fields = ['id']


class StudentCourseSerializer(serializers.ModelSerializer):
    """Serializer for StudentCourse model CRUD operations"""
    student_name = serializers.CharField(source='student.student_name', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.teacher_name', read_only=True)

    class Meta:
        model = StudentCourse
        fields = ['id', 'student', 'course', 'teacher', 'student_name', 'course_name', 'teacher_name', 'classes_attended']
        read_only_fields = ['id']


class UpdateAttendanceRequestSerializer(serializers.ModelSerializer):
    """Serializer for UpdateAttendanceRequest model CRUD operations"""
    teacher_name = serializers.CharField(source='teacher.teacher_name', read_only=True)
    student_name = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.Management_name', read_only=True)

    class Meta:
        model = UpdateAttendanceRequest
        fields = [
            'id', 'teacher', 'student', 'course',
            'batch', 'program', 'attendance_type', 'slots',
            'classes_to_add', 'reason',
            'status', 'requested_at', 'processed_at', 'processed_by',
            'teacher_name', 'student_name', 'course_name', 'processed_by_name'
        ]
        read_only_fields = ['id', 'status', 'requested_at', 'processed_at', 'processed_by']

    def get_student_name(self, obj):
        return obj.student.student_name if obj.student else None


# ============ Registration Serializers ============

class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = Student
        fields = ('email', 'password', 'password2', 'student_name', 'rfid', 'year', 'dept', 'section')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        
        return attrs

    def create(self, validated_data):
        # Remove password2 as it's not needed for User creation
        validated_data.pop('password2')
        
        # Create User instance
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Create Student instance
        student = Student.objects.create(
            user=user,
            email=validated_data['email'],
            student_name=validated_data['student_name'],
            rfid=validated_data['rfid'],
            year=validated_data['year'],
            dept=validated_data['dept'],
            section=validated_data['section']
        )
        
        return student


class TeacherRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = Teacher
        fields = ('email', 'password', 'password2', 'teacher_name', 'rfid', 'department')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        teacher = Teacher.objects.create(
            user=user,
            email=validated_data['email'],
            teacher_name=validated_data['teacher_name'],
            rfid=validated_data['rfid'],
            department=validated_data.get('department', '')
        )
        
        return teacher


class ManagementRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = Management
        fields = ('email', 'password', 'password2', 'Management_name', 'department', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        management = Management.objects.create(
            user=user,
            email=validated_data['email'],
            Management_name=validated_data['Management_name'],
            department=validated_data.get('department', ''),
            role=validated_data.get('role', 'university_admin')
        )
        
        return management


class EventParticipantRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = EventParticipant
        fields = ('email', 'password', 'password2', 'name', 'phone')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        participant = EventParticipant.objects.create(
            user=user,
            email=validated_data['email'],
            name=validated_data['name'],
            phone=validated_data.get('phone', '')
        )
        return participant


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class AttendanceSessionSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceSession model"""
    teacher_name = serializers.CharField(source='teacher.teacher_name', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'teacher', 'course', 'section', 'year', 'program', 'session_type',
            'status', 'qr_code_token', 'started_at', 'stopped_at',
            'latitude', 'longitude', 'radius_meters', 'require_rfid',
            'teacher_name', 'course_name', 'course_code',
        ]
        read_only_fields = ['id', 'qr_code_token', 'started_at', 'stopped_at']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceRecord model"""
    student_name = serializers.CharField(source='student.student_name', read_only=True)
    session_details = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'session', 'student', 'rfid_scanned', 'rfid_scanned_at',
            'qr_scanned', 'qr_scanned_at', 'is_present', 'marked_present_at',
            'student_name', 'session_details'
        ]
        read_only_fields = [
            'id', 'rfid_scanned', 'rfid_scanned_at', 'qr_scanned', 'qr_scanned_at',
            'is_present', 'marked_present_at'
        ]

    def get_session_details(self, obj):
        return {
            'course': obj.session.course.course_name,
            'course_code': obj.session.course.course_code,
            'teacher': obj.session.teacher.teacher_name,
            'section': obj.session.section,
            'year': obj.session.year
        }


class RFIDScanSerializer(serializers.Serializer):
    """Serializer for RFID scan requests"""
    rfid = serializers.CharField(required=True)
    session_id = serializers.IntegerField(required=True)


class QRScanSerializer(serializers.Serializer):
    """Serializer for QR scan requests"""
    qr_token = serializers.CharField(required=True)
    student_id = serializers.IntegerField(required=True)
    # Optional geolocation sent by the student's browser
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)


# ============ Event Serializers ============

class EventParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventParticipant
        fields = ['participant_id', 'name', 'email', 'phone']
        read_only_fields = ['participant_id']


class EventRegistrationSerializer(serializers.ModelSerializer):
    participant_name = serializers.CharField(source='participant.name', read_only=True)
    participant_email = serializers.CharField(source='participant.email', read_only=True)

    class Meta:
        model = EventRegistration
        fields = ['id', 'event', 'participant', 'registered_at', 'status',
                  'participant_name', 'participant_email']
        read_only_fields = ['id', 'registered_at']


class EventAttendanceSerializer(serializers.ModelSerializer):
    participant_name = serializers.CharField(source='participant.name', read_only=True)

    class Meta:
        model = EventAttendance
        fields = ['id', 'event', 'participant', 'status', 'scanned_at', 'participant_name']
        read_only_fields = ['id', 'scanned_at']


class EventSerializer(serializers.ModelSerializer):
    registered_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.Management_name', read_only=True)

    class Meta:
        model = Event
        fields = [
            'event_id', 'title', 'venue', 'date', 'reg_start', 'reg_end',
            'description', 'registration_link', 'created_by', 'created_by_name',
            'registered_count',
        ]
        read_only_fields = ['event_id']

    def get_registered_count(self, obj):
        return obj.registrations.filter(status='registered').count()

