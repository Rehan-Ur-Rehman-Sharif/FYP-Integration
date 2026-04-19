from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q, Max
from .models import (
    Student, Teacher, Management, Course, Class, TaughtCourse, StudentCourse,
    UpdateAttendanceRequest, AttendanceSession, AttendanceRecord
)


# ============ Model Serializers for CRUD operations ============

class StudentCourseInlineSerializer(serializers.ModelSerializer):
    """Inline courses for StudentSerializer"""
    course_id = serializers.IntegerField(source='course.course_id', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    classes_taken_count = serializers.SerializerMethodField()

    def get_classes_taken_count(self, obj):
        """Return total classes taken for this course (from TaughtCourse)."""
        # Prefer a direct (course, teacher) mapping when available.
        if getattr(obj, 'teacher_id', None):
            qs = TaughtCourse.objects.filter(course=obj.course, teacher_id=obj.teacher_id)

            student = getattr(obj, 'student', None)
            if student is not None:
                # Only apply section/year filters if they actually narrow to rows;
                # avoids returning 0 due to mismatched data conventions.
                if getattr(student, 'section', None):
                    qs_section = qs.filter(section=student.section)
                    if qs_section.exists():
                        qs = qs_section
                if getattr(student, 'year', None) is not None:
                    qs_year = qs.filter(year=student.year)
                    if qs_year.exists():
                        qs = qs_year

            taught = qs.order_by('-id').first()
            return taught.classes_taken_count if taught else 0

        # If teacher is null, fall back to aggregating possible taught courses for that student/course.
        student = getattr(obj, 'student', None)
        if student is None:
            return 0

        qs = TaughtCourse.objects.filter(course=obj.course)
        if getattr(student, 'management_id', None):
            qs_mgmt = qs.filter(teacher__management_id=student.management_id)
            if qs_mgmt.exists():
                qs = qs_mgmt

        if getattr(student, 'section', None):
            qs_section = qs.filter(section=student.section)
            if qs_section.exists():
                qs = qs_section

        if getattr(student, 'year', None) is not None:
            qs_year = qs.filter(year=student.year)
            if qs_year.exists():
                qs = qs_year

        return qs.aggregate(max_count=Max('classes_taken_count')).get('max_count') or 0

    class Meta:
        model = StudentCourse
        fields = ['id', 'course_id', 'course_code', 'course_name', 'classes_attended_count', 'classes_taken_count']


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model CRUD operations"""
    # 'program' is a frontend-friendly alias for the 'dept' field
    program = serializers.CharField(source='dept', read_only=True)
    courses = StudentCourseInlineSerializer(source='student_courses', many=True, read_only=True)

    class Meta:
        model = Student
        fields = ['student_id', 'student_name', 'email', 'student_rollNo', 'overall_attendance', 'year', 'dept', 'program', 'section', 'management', 'courses']
        read_only_fields = ['student_id', 'program', 'courses']


class TaughtCourseInlineSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)

    class Meta:
        model = TaughtCourse
        fields = ['id', 'course', 'course_code', 'course_name', 'section', 'year']


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for Teacher model CRUD operations"""
    courses = TaughtCourseInlineSerializer(source='taught_courses', many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = ['teacher_id', 'teacher_name', 'email', 'teacher_rollNo', 'phone', 'years', 'programs', 'management', 'courses']
        read_only_fields = ['teacher_id', 'courses']


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
        fields = ['course_id', 'course_code', 'course_name']
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
        fields = ['id', 'course', 'teacher', 'course_name', 'teacher_name', 'classes_taken_count', 'section', 'year']
        read_only_fields = ['id']


class StudentCourseSerializer(serializers.ModelSerializer):
    """Serializer for StudentCourse model CRUD operations"""
    student_name = serializers.CharField(source='student.student_name', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.teacher_name', read_only=True)

    class Meta:
        model = StudentCourse
        fields = ['id', 'student', 'course', 'teacher', 'student_name', 'course_name', 'teacher_name', 'classes_attended_count']
        read_only_fields = ['id']


class UpdateAttendanceRequestSerializer(serializers.ModelSerializer):
    """Serializer for UpdateAttendanceRequest model CRUD operations"""
    teacher = serializers.PrimaryKeyRelatedField(read_only=True)
    student = serializers.PrimaryKeyRelatedField(read_only=True)
    teacher_rollNo = serializers.SlugRelatedField(
        source='teacher',
        slug_field='teacher_rollNo',
        queryset=Teacher.objects.all(),
        required=False,
    )
    student_rollNo = serializers.SlugRelatedField(
        source='student',
        slug_field='student_rollNo',
        queryset=Student.objects.all(),
    )

    # Allow alternative payloads from frontend integrations.
    # - `course_code` can be used instead of numeric `course`
    # - `slot_count` can be used instead of `classes_to_add`
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), required=False)
    course_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    slot_count = serializers.IntegerField(write_only=True, required=False, min_value=1)
    classes_to_add = serializers.CharField(required=False, allow_blank=True)
    program = serializers.CharField(write_only=True, required=False, allow_blank=True)
    section = serializers.CharField(write_only=True, required=False, allow_blank=True)
    teacher_name = serializers.CharField(source='teacher.teacher_name', read_only=True)
    student_name = serializers.CharField(source='student.student_name', read_only=True)
    student_dept = serializers.CharField(source='student.dept', read_only=True)
    student_section = serializers.CharField(source='student.section', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.Management_name', read_only=True)
    management_name = serializers.CharField(source='management.Management_name', read_only=True)

    class Meta:
        model = UpdateAttendanceRequest
        fields = [
            'id', 'teacher', 'student', 'teacher_rollNo', 'student_rollNo',
            'course', 'course_code', 'slot_count', 'program', 'section',
            'management', 'classes_to_add', 'reason', 'attendanceType',
            'status', 'requested_at', 'processed_at', 'processed_by',
            'teacher_name', 'student_name', 'student_dept', 'student_section', 'course_name', 'processed_by_name', 'management_name'
        ]
        read_only_fields = [
            'id', 'teacher', 'student', 'status', 'requested_at', 'processed_at', 'processed_by', 'management'
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)

        request = self.context.get('request')

        # Map `course_code` -> `course` when the numeric id isn't provided.
        course = attrs.get('course')
        course_code = (self.initial_data.get('course_code') or '').strip()
        if not course and course_code:
            try:
                attrs['course'] = Course.objects.get(course_code=course_code)
            except Course.DoesNotExist:
                raise serializers.ValidationError({'course_code': 'Invalid course_code'})

        # Ensure classes_to_add is provided; if `slot_count` is provided, synthesize it.
        classes_to_add = (attrs.get('classes_to_add') or '').strip()
        slot_count = self.initial_data.get('slot_count', None)
        if not classes_to_add:
            try:
                slot_int = int(slot_count) if slot_count is not None else None
            except (ValueError, TypeError):
                slot_int = None

            if slot_int and slot_int > 0:
                attrs['classes_to_add'] = ', '.join([f'Slot {i + 1}' for i in range(slot_int)])
            else:
                raise serializers.ValidationError({'classes_to_add': 'This field is required.'})

        # Infer teacher if not provided.
        teacher = attrs.get('teacher')
        if not teacher:
            # If the authenticated user is a teacher, default to that.
            if request is not None and getattr(request, 'user', None) and request.user.is_authenticated:
                teacher_user = Teacher.objects.filter(user=request.user).first()
                if teacher_user:
                    attrs['teacher'] = teacher_user
                    teacher = teacher_user

        # If still missing, infer from student enrollment or taught course assignment.
        if not teacher:
            student = attrs.get('student')
            course = attrs.get('course')
            if student and course:
                # Prefer a concrete StudentCourse mapping when it exists.
                sc_qs = StudentCourse.objects.filter(student=student, course=course).exclude(teacher__isnull=True)
                sc_teacher_ids = list(sc_qs.values_list('teacher_id', flat=True).distinct())
                if len(sc_teacher_ids) == 1:
                    attrs['teacher'] = Teacher.objects.get(teacher_id=sc_teacher_ids[0])
                    teacher = attrs['teacher']
                else:
                    # Fall back to taught course assignment in student's section/year.
                    tc_qs = TaughtCourse.objects.filter(
                        course=course,
                        section=student.section,
                        year=student.year,
                    )
                    if student.management_id:
                        tc_qs = tc_qs.filter(teacher__management_id=student.management_id)
                    program = (self.initial_data.get('program') or '').strip()
                    if program:
                        program_filtered = tc_qs.filter(
                            Q(teacher__programs=program) |
                            Q(teacher__programs__startswith=f'{program},') |
                            Q(teacher__programs__endswith=f',{program}') |
                            Q(teacher__programs__icontains=f',{program},')
                        )
                        # If teacher.programs is not maintained (blank), don't let
                        # the optional `program` parameter break inference.
                        if program_filtered.exists():
                            tc_qs = program_filtered
                    teacher_ids = list(tc_qs.values_list('teacher_id', flat=True).distinct())
                    if len(teacher_ids) == 1:
                        attrs['teacher'] = Teacher.objects.get(teacher_id=teacher_ids[0])
                        teacher = attrs['teacher']

        if not attrs.get('teacher'):
            raise serializers.ValidationError({'teacher_rollNo': 'This field is required.'})

        if not attrs.get('course'):
            raise serializers.ValidationError({'course': 'This field is required.'})

        return attrs

    def create(self, validated_data):
        # Drop integration-only fields that don't exist on the model.
        validated_data.pop('course_code', None)
        validated_data.pop('slot_count', None)
        validated_data.pop('program', None)
        validated_data.pop('section', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Drop integration-only fields that don't exist on the model.
        validated_data.pop('course_code', None)
        validated_data.pop('slot_count', None)
        validated_data.pop('program', None)
        validated_data.pop('section', None)
        return super().update(instance, validated_data)


# ============ Registration Serializers ============

class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = Student
        fields = ('email', 'password', 'password2', 'student_name', 'student_rollNo', 'year', 'dept', 'section')

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
            student_rollNo=validated_data['student_rollNo'],
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
        fields = ('email', 'password', 'password2', 'teacher_name', 'teacher_rollNo')

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
            teacher_rollNo=validated_data['teacher_rollNo']
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
            'id', 'teacher', 'course', 'section', 'year', 'slot_count', 'status',
            'qr_code_token', 'started_at', 'stopped_at',
            'teacher_name', 'course_name',
            'attendance_type', 'program', 'latitude', 'longitude', 'radius_meters'
        ]
        read_only_fields = ['id', 'qr_code_token', 'started_at', 'stopped_at']

    def validate_radius_meters(self, value):
        # Keep radius practical for indoor scanning; GPS jitter indoors can be significant.
        if value is None:
            return value
        if value < 10:
            raise serializers.ValidationError('radius_meters must be at least 10 meters.')
        if value > 500:
            raise serializers.ValidationError('radius_meters must be at most 500 meters.')
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        lat = attrs.get('latitude')
        lon = attrs.get('longitude')
        if (lat is None) ^ (lon is None):
            raise serializers.ValidationError({'latitude': 'latitude and longitude must both be provided', 'longitude': 'latitude and longitude must both be provided'})
        if lat is not None and not (-90 <= lat <= 90):
            raise serializers.ValidationError({'latitude': 'latitude must be between -90 and 90'})
        if lon is not None and not (-180 <= lon <= 180):
            raise serializers.ValidationError({'longitude': 'longitude must be between -180 and 180'})
        return attrs


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
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)


# ============ Admin Dashboard Attendance Serializers ============

class StudentCourseSummarySerializer(serializers.Serializer):
    """Per-course attendance summary for one student (used in student-wise view)."""
    course_id = serializers.IntegerField()
    course_code = serializers.CharField()
    course_name = serializers.CharField()
    teacher_name = serializers.CharField()
    attended = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    percent = serializers.FloatField()


class StudentAttendanceSummarySerializer(serializers.Serializer):
    """Full attendance summary for a single student across all enrolled courses."""
    student_id = serializers.IntegerField()
    name = serializers.CharField()
    student_rollNo = serializers.CharField()
    year = serializers.IntegerField()
    program = serializers.CharField()
    section = serializers.CharField()
    email = serializers.CharField()
    overall_attendance = serializers.FloatField()
    courses = StudentCourseSummarySerializer(many=True)


class StudentAttendanceSummaryListSerializer(serializers.Serializer):
    """Attendance summary response for multiple filtered students."""
    count = serializers.IntegerField()
    filters = serializers.DictField(required=False)
    students = StudentAttendanceSummarySerializer(many=True)


class CourseStudentAttendanceSerializer(serializers.Serializer):
    """Per-student attendance entry for a course (used in course-wise view)."""
    student_id = serializers.IntegerField()
    roll = serializers.CharField()
    name = serializers.CharField()
    year = serializers.IntegerField()
    program = serializers.CharField()    # dept
    section = serializers.CharField()
    attended = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    percent = serializers.FloatField()


class CourseAttendanceSummarySerializer(serializers.Serializer):
    """Attendance summary for all students enrolled in a given course."""
    course_id = serializers.IntegerField()
    course_code = serializers.CharField()
    course_name = serializers.CharField()
    students = CourseStudentAttendanceSerializer(many=True)
