from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    Student, Teacher, Management, Course, Class, TaughtCourse, StudentCourse,
    UpdateAttendanceRequest, AttendanceSession, AttendanceRecord
)


# ============ Model Serializers for CRUD operations ============

class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model CRUD operations"""
    class Meta:
        model = Student
        fields = ['student_id', 'student_name', 'email', 'rfid', 'overall_attendance', 'year', 'dept', 'section']
        read_only_fields = ['student_id']


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for Teacher model CRUD operations"""
    class Meta:
        model = Teacher
        fields = ['teacher_id', 'teacher_name', 'email', 'rfid']
        read_only_fields = ['teacher_id']


class ManagementSerializer(serializers.ModelSerializer):
    """Serializer for Management model CRUD operations"""
    class Meta:
        model = Management
        fields = ['Management_id', 'Management_name', 'email']
        read_only_fields = ['Management_id']


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model CRUD operations"""
    class Meta:
        model = Course
        fields = ['course_id', 'course_name']
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
        fields = ['id', 'course', 'teacher', 'course_name', 'teacher_name', 'classes_taken', 'section', 'year']
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
    student_name = serializers.CharField(source='student.student_name', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.Management_name', read_only=True)

    class Meta:
        model = UpdateAttendanceRequest
        fields = [
            'id', 'teacher', 'student', 'course', 'classes_to_add', 'reason',
            'status', 'requested_at', 'processed_at', 'processed_by',
            'teacher_name', 'student_name', 'course_name', 'processed_by_name'
        ]
        read_only_fields = ['id', 'status', 'requested_at', 'processed_at', 'processed_by']


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
        fields = ('email', 'password', 'password2', 'teacher_name', 'rfid')

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
        
        # Create Teacher instance
        teacher = Teacher.objects.create(
            user=user,
            email=validated_data['email'],
            teacher_name=validated_data['teacher_name'],
            rfid=validated_data['rfid']
        )
        
        return teacher


class ManagementRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = Management
        fields = ('email', 'password', 'password2', 'Management_name')

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
        
        # Create Management instance
        management = Management.objects.create(
            user=user,
            email=validated_data['email'],
            Management_name=validated_data['Management_name']
        )
        
        return management


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class AttendanceSessionSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceSession model"""
    teacher_name = serializers.CharField(source='teacher.teacher_name', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'teacher', 'course', 'section', 'year', 'status',
            'qr_code_token', 'started_at', 'stopped_at',
            'teacher_name', 'course_name'
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
