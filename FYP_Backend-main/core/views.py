from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
import qrcode
import io
import base64
import secrets
from .serializers import (
    StudentRegistrationSerializer,
    TeacherRegistrationSerializer,
    ManagementRegistrationSerializer,
    LoginSerializer,
    StudentSerializer,
    TeacherSerializer,
    ManagementSerializer,
    CourseSerializer,
    ClassSerializer,
    TaughtCourseSerializer,
    StudentCourseSerializer,
    UpdateAttendanceRequestSerializer,
    AttendanceSessionSerializer,
    AttendanceRecordSerializer,
    RFIDScanSerializer,
    QRScanSerializer,
    StudentAttendanceSummarySerializer,
    CourseAttendanceSummarySerializer,
)
from .models import (
    Student, Teacher, Management, StudentCourse, TaughtCourse, Course, Class,
    UpdateAttendanceRequest, AttendanceSession, AttendanceRecord
)


# ============ Unified Frontend-Compatible Endpoints ============

class UnifiedLoginView(APIView):
    """
    Unified login endpoint matching the frontend's expected format.

    POST /api/login
    Request body: { "email": "...", "password": "...", "role": "student|teacher|admin" }

    The frontend (Login.jsx) sends a single { email, password, role } payload.
    Role "admin" is mapped to the Management model.
    """
    permission_classes = [AllowAny]

    ROLE_MAP = {
        'student': (Student, 'student'),
        'teacher': (Teacher, 'teacher'),
        'admin': (Management, 'admin'),
        'management': (Management, 'admin'),
    }

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        role = request.data.get('role', 'student').strip().lower()

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if role not in self.ROLE_MAP:
            return Response(
                {'error': f'Invalid role. Must be one of: {", ".join(self.ROLE_MAP)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=email, password=password)
        if user is None:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        ModelClass, user_type = self.ROLE_MAP[role]
        try:
            profile = ModelClass.objects.get(user=user)
        except ModelClass.DoesNotExist:
            return Response(
                {'error': f'No {role} profile found for this account'},
                status=status.HTTP_404_NOT_FOUND
            )

        refresh = RefreshToken.for_user(user)

        if user_type == 'student':
            response_data = {
                'message': 'Login successful',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': 'student',
                'id': profile.student_id,
                'name': profile.student_name,
                'email': profile.email,
            }
        elif user_type == 'teacher':
            response_data = {
                'message': 'Login successful',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': 'teacher',
                'id': profile.teacher_id,
                'name': profile.teacher_name,
                'email': profile.email,
            }
        else:  # admin / management
            response_data = {
                'message': 'Login successful',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': 'admin',
                'id': profile.Management_id,
                'name': profile.Management_name,
                'email': profile.email,
            }

        return Response(response_data, status=status.HTTP_200_OK)


class UnifiedSignupView(APIView):
    """
    Unified signup endpoint matching the frontend's expected format.

    POST /api/signup
    Request body: {
      "role": "student|teacher|admin|management",
      "name": "...",
      "email": "...",
      "password": "...",
            // Student extras: "id" (used as student_rollNo), "year", "program" (dept), "section"
            // Teacher extras: "id" (used as teacher_rollNo)
      // Admin extras: "university", "department"
    }

    The frontend (SignUp.jsx and admin ManageStudents/ManageTeacher) sends all
    registration data through this single endpoint.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        role = request.data.get('role', '').strip().lower()
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not role or not name or not email or not password:
            return Response(
                {'error': 'role, name, email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if role not in ('student', 'teacher', 'admin', 'management'):
            return Response(
                {'error': f'Invalid role: {role}. Must be one of: student, teacher, admin, management'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(username=email, email=email, password=password)

        # Resolve the management instance that is registering this user.
        # Priority: authenticated requesting user's management profile > explicit management_id param.
        management = None
        if request.user and request.user.is_authenticated:
            management = Management.objects.filter(user=request.user).first()
        if not management:
            mgmt_id = request.data.get('management_id', '')
            if mgmt_id:
                management = Management.objects.filter(pk=mgmt_id).first()

        try:
            if role == 'student':
                return self._register_student(request, user, name, email, management)
            elif role == 'teacher':
                return self._register_teacher(request, user, name, email, management)
            else:  # admin or management
                return self._register_management(request, user, name, email)
        except Exception as e:
            user.delete()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    def _parse_and_create_courses(courses_raw):
        """
        Parse a comma-separated course string like "CS301: Database, CS401: Algo"
        into Course model objects (get_or_create), returning a list of dicts.
        """
        created_courses = []
        if not courses_raw:
            return created_courses
        for item in courses_raw.split(','):
            item = item.strip()
            if not item:
                continue
            if ':' in item:
                code, _, cname = item.partition(':')
                code = code.strip()
                cname = cname.strip()
            else:
                code = ''
                cname = item

            if code:
                course = Course.objects.filter(course_code=code).first()
                if not course:
                    course = Course.objects.create(course_code=code, course_name=cname or code)
            else:
                course = Course.objects.filter(course_name=cname).first()
                if not course:
                    course = Course.objects.create(course_code='', course_name=cname)
            created_courses.append({'course_id': course.course_id, 'course_code': course.course_code, 'course_name': course.course_name})
        return created_courses

    def _register_student(self, request, user, name, email, management=None):
        student_roll_no = request.data.get('id', '').strip() or f'S{user.id}'
        if Student.objects.filter(student_rollNo=student_roll_no).exists():
            student_roll_no = f'{student_roll_no}_{user.id}'

        year_raw = request.data.get('year', '1')
        try:
            year_int = int(year_raw)
        except (ValueError, TypeError):
            year_int = 1

        dept = (
            request.data.get('program', '').strip() or
            request.data.get('dept', '').strip() or
            ''
        )
        section = request.data.get('section', '').strip() or 'A'

        student = Student.objects.create(
            user=user,
            email=email,
            student_name=name,
            student_rollNo=student_roll_no,
            year=year_int,
            dept=dept,
            section=section,
            management=management,
        )

        # Handle courses: create Course + StudentCourse entries
        created_courses = []
        for course_info in self._parse_and_create_courses(request.data.get('courses', '').strip()):
            course = Course.objects.filter(pk=course_info['course_id']).first()
            if course:
                # 1st priority: same management + course + section + year + dept/year match
                taught = TaughtCourse.objects.filter(
                    course=course,
                    section=student.section,
                    year=student.year,
                    teacher__programs__icontains=student.dept,
                    teacher__years__icontains=str(student.year),
                    **({'teacher__management': management} if management else {}),
                ).first()
                # 2nd priority: same management + course + section/year
                if not taught and management:
                    taught = TaughtCourse.objects.filter(
                        course=course,
                        section=student.section,
                        year=student.year,
                        teacher__management=management,
                    ).first()
                # 3rd priority: same management + course + dept/year match (diff section)
                if not taught and management:
                    taught = TaughtCourse.objects.filter(
                        course=course,
                        teacher__programs__icontains=student.dept,
                        teacher__years__icontains=str(student.year),
                        teacher__management=management,
                    ).first()
                # 4th priority (no management context): course + section/year + dept/year match
                if not taught:
                    taught = TaughtCourse.objects.filter(
                        course=course,
                        section=student.section,
                        year=student.year,
                        teacher__programs__icontains=student.dept,
                        teacher__years__icontains=str(student.year),
                    ).first()
                # 5th priority: course + section/year only
                if not taught:
                    taught = TaughtCourse.objects.filter(
                        course=course,
                        section=student.section,
                        year=student.year,
                    ).first()
                teacher = taught.teacher if taught else None
                StudentCourse.objects.get_or_create(
                    student=student,
                    course=course,
                    defaults={'teacher': teacher, 'classes_attended': ''}
                )
                created_courses.append(course_info)

        return Response({
            'message': 'Student registered successfully',
            'user_type': 'student',
            'student_id': student.student_id,
            'name': student.student_name,
            'email': student.email,
            'courses': created_courses,
        }, status=status.HTTP_201_CREATED)

    def _register_teacher(self, request, user, name, email, management=None):
        teacher_roll_no = request.data.get('id', '').strip() or f'T{user.id}'
        if Teacher.objects.filter(teacher_rollNo=teacher_roll_no).exists():
            teacher_roll_no = f'{teacher_roll_no}_{user.id}'

        phone = request.data.get('phone', '').strip()
        years_raw = request.data.get('years', '').strip()
        programs_raw = request.data.get('programs', '').strip()

        teacher = Teacher.objects.create(
            user=user,
            email=email,
            teacher_name=name,
            teacher_rollNo=teacher_roll_no,
            phone=phone,
            years=years_raw,
            programs=programs_raw,
            management=management,
        )

        # Handle courses: create Course + TaughtCourse entries
        created_courses = []
        for course_info in self._parse_and_create_courses(request.data.get('courses', '').strip()):
            course = Course.objects.filter(pk=course_info['course_id']).first()
            if course:
                TaughtCourse.objects.get_or_create(
                    teacher=teacher,
                    course=course,
                    defaults={'classes_taken': '0'}
                )
                created_courses.append(course_info)

        return Response({
            'message': 'Teacher registered successfully',
            'user_type': 'teacher',
            'teacher_id': teacher.teacher_id,
            'name': teacher.teacher_name,
            'email': teacher.email,
            'phone': teacher.phone,
            'years': teacher.years,
            'programs': teacher.programs,
            'courses': created_courses,
        }, status=status.HTTP_201_CREATED)

    def _register_management(self, request, user, name, email):
        management = Management.objects.create(
            user=user,
            email=email,
            Management_name=name,
        )
        return Response({
            'message': 'Management user registered successfully',
            'user_type': 'admin',
            'management_id': management.Management_id,
            'name': management.Management_name,
            'email': management.email,
        }, status=status.HTTP_201_CREATED)


class UserDetailsView(APIView):
    """
    Returns the current authenticated user's profile details.

    GET /api/user-details
    Authorization: Bearer <access_token>
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            student = Student.objects.get(user=user)
            return Response({
                'role': 'student',
                'id': student.student_id,
                'name': student.student_name,
                'email': student.email,
                'year': student.year,
                'dept': student.dept,
                'section': student.section,
            })
        except Student.DoesNotExist:
            pass

        try:
            teacher = Teacher.objects.get(user=user)
            return Response({
                'role': 'teacher',
                'id': teacher.teacher_id,
                'name': teacher.teacher_name,
                'email': teacher.email,
            })
        except Teacher.DoesNotExist:
            pass

        try:
            mgmt = Management.objects.get(user=user)
            return Response({
                'role': 'admin',
                'id': mgmt.Management_id,
                'name': mgmt.Management_name,
                'email': mgmt.email,
            })
        except Management.DoesNotExist:
            pass

        return Response(
            {'error': 'User profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )


class UserLogoutView(APIView):
    """
    Logout endpoint.

    GET /api/user-logout
    Authorization: Bearer <access_token>

    Acknowledges logout. The client should discard stored tokens.
    For full token invalidation, include the refresh token in the request body
    and add 'rest_framework_simplejwt.token_blacklist' to INSTALLED_APPS.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


# ============ CRUD ViewSets for all models ============

class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Student model providing CRUD operations.
    - GET /students/ - List all students
    - POST /students/ - Create a student (use registration for new users)
    - GET /students/{id}/ - Retrieve a student
    - PUT /students/{id}/ - Update a student
    - PATCH /students/{id}/ - Partial update a student
    - DELETE /students/{id}/ - Delete a student
    - PATCH /students/{id}/update-courses/ - Replace all courses for a student
    """
    queryset = Student.objects.prefetch_related('student_courses__course', 'student_courses__teacher').all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.all()
        # Optional filters – accept both 'dept' and 'program' (frontend uses 'program')
        year = self.request.query_params.get('year')
        dept = (
            self.request.query_params.get('dept') or
            self.request.query_params.get('program')
        )
        section = self.request.query_params.get('section')
        if year:
            queryset = queryset.filter(year=year)
        if dept:
            queryset = queryset.filter(dept=dept)
        if section:
            queryset = queryset.filter(section=section)
        return queryset

    @action(detail=True, methods=['patch'], url_path='update-courses')
    def update_courses(self, request, pk=None):
        """
        Replace all courses for a student.
        Accepts the same comma-separated format as signup:
          { "courses": "CS301: Database Systems, CS401: Algorithms" }
        All existing StudentCourse records for this student are removed and
        new ones are created from the provided list.
        """
        student = self.get_object()
        courses_raw = request.data.get('courses', '').strip()

        if not courses_raw:
            return Response({'error': 'courses field is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Delete all existing StudentCourse records for this student
        student.student_courses.all().delete()

        management = student.management
        created_courses = []

        for course_info in UnifiedSignupView._parse_and_create_courses(courses_raw):
            course = Course.objects.filter(pk=course_info['course_id']).first()
            if not course:
                continue

            # Teacher matching (same priority chain as registration)
            taught = TaughtCourse.objects.filter(
                course=course,
                section=student.section,
                year=student.year,
                teacher__programs__icontains=student.dept,
                teacher__years__icontains=str(student.year),
                **({'teacher__management': management} if management else {}),
            ).first()
            if not taught and management:
                taught = TaughtCourse.objects.filter(
                    course=course, section=student.section, year=student.year,
                    teacher__management=management,
                ).first()
            if not taught and management:
                taught = TaughtCourse.objects.filter(
                    course=course,
                    teacher__programs__icontains=student.dept,
                    teacher__years__icontains=str(student.year),
                    teacher__management=management,
                ).first()
            if not taught:
                taught = TaughtCourse.objects.filter(
                    course=course, section=student.section, year=student.year,
                    teacher__programs__icontains=student.dept,
                    teacher__years__icontains=str(student.year),
                ).first()
            if not taught:
                taught = TaughtCourse.objects.filter(
                    course=course, section=student.section, year=student.year,
                ).first()

            teacher = taught.teacher if taught else None
            StudentCourse.objects.create(
                student=student,
                course=course,
                teacher=teacher,
                classes_attended=''
            )
            created_courses.append(course_info)

        return Response({
            'message': 'Courses updated successfully',
            'student_id': student.student_id,
            'courses': created_courses,
        }, status=status.HTTP_200_OK)


class TeacherViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Teacher model providing CRUD operations.
    - GET /teachers/ - List all teachers
    - POST /teachers/ - Create a teacher (use registration for new users)
    - GET /teachers/{id}/ - Retrieve a teacher
    - PUT /teachers/{id}/ - Update a teacher
    - PATCH /teachers/{id}/ - Partial update a teacher
    - DELETE /teachers/{id}/ - Delete a teacher

    Optional filter query params: ?year=X&program=Y
    """
    queryset = Teacher.objects.prefetch_related('taught_courses__course').all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.all()

        # Scope to the logged-in management's teachers
        try:
            management = Management.objects.get(user=self.request.user)
            queryset = queryset.filter(management=management)
        except Management.DoesNotExist:
            pass

        # Filter by year or program – stored as comma-separated strings, match whole values only
        # Accept both singular (?year=) and plural (?years=) param names
        year = (self.request.query_params.get('year') or self.request.query_params.get('years') or '').strip()
        program = (self.request.query_params.get('program') or self.request.query_params.get('programs') or '').strip()
        if year:
            queryset = queryset.filter(
                Q(years=year) |
                Q(years__startswith=f'{year},') |
                Q(years__endswith=f',{year}') |
                Q(years__icontains=f',{year},')
            )
        if program:
            queryset = queryset.filter(
                Q(programs=program) |
                Q(programs__startswith=f'{program},') |
                Q(programs__endswith=f',{program}') |
                Q(programs__icontains=f',{program},')
            )
        return queryset


class ManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Management model providing CRUD operations.
    - GET /management/ - List all management users
    - POST /management/ - Create a management user (use registration for new users)
    - GET /management/{id}/ - Retrieve a management user
    - PUT /management/{id}/ - Update a management user
    - PATCH /management/{id}/ - Partial update a management user
    - DELETE /management/{id}/ - Delete a management user
    """
    queryset = Management.objects.all()
    serializer_class = ManagementSerializer
    permission_classes = [IsAuthenticated]


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course model providing CRUD operations.
    - GET /courses/ - List all courses
    - POST /courses/ - Create a course
    - GET /courses/{id}/ - Retrieve a course
    - PUT /courses/{id}/ - Update a course
    - PATCH /courses/{id}/ - Partial update a course
    - DELETE /courses/{id}/ - Delete a course
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]


class ClassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Class (Classroom) model providing CRUD operations.
    - GET /classes/ - List all classes
    - POST /classes/ - Create a class
    - GET /classes/{id}/ - Retrieve a class
    - PUT /classes/{id}/ - Update a class
    - PATCH /classes/{id}/ - Partial update a class
    - DELETE /classes/{id}/ - Delete a class
    """
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]


class TaughtCourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TaughtCourse model providing CRUD operations.
    - GET /taught-courses/ - List all taught courses
    - POST /taught-courses/ - Create a taught course
    - GET /taught-courses/{id}/ - Retrieve a taught course
    - PUT /taught-courses/{id}/ - Update a taught course
    - PATCH /taught-courses/{id}/ - Partial update a taught course
    - DELETE /taught-courses/{id}/ - Delete a taught course
    """
    queryset = TaughtCourse.objects.all()
    serializer_class = TaughtCourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.all()
        # Optional filters
        course_id = self.request.query_params.get('course')
        teacher_id = self.request.query_params.get('teacher')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        return queryset


class StudentCourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudentCourse model providing CRUD operations.
    - GET /student-courses/ - List all student courses
    - POST /student-courses/ - Create a student course
    - GET /student-courses/{id}/ - Retrieve a student course
    - PUT /student-courses/{id}/ - Update a student course
    - PATCH /student-courses/{id}/ - Partial update a student course
    - DELETE /student-courses/{id}/ - Delete a student course
    """
    queryset = StudentCourse.objects.all()
    serializer_class = StudentCourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.all()
        # Optional filters
        student_id = self.request.query_params.get('student')
        course_id = self.request.query_params.get('course')
        teacher_id = self.request.query_params.get('teacher')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        return queryset


class UpdateAttendanceRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for UpdateAttendanceRequest model providing CRUD operations.
    - GET /update-attendance-requests/ - List all update attendance requests
    - POST /update-attendance-requests/ - Create an update attendance request (by teacher)
    - GET /update-attendance-requests/{id}/ - Retrieve an update attendance request
    - PUT /update-attendance-requests/{id}/ - Update an update attendance request
    - PATCH /update-attendance-requests/{id}/ - Partial update an update attendance request
    - DELETE /update-attendance-requests/{id}/ - Delete an update attendance request
    - POST /update-attendance-requests/{id}/approve/ - Approve the request (by management)
    - POST /update-attendance-requests/{id}/reject/ - Reject the request (by management)
    """
    queryset = UpdateAttendanceRequest.objects.all()
    serializer_class = UpdateAttendanceRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user
        requested_management_id = self.request.query_params.get('management_id') or self.request.query_params.get('management')

        # Restrict visibility to management-owned requests only.
        if user.is_superuser:
            if requested_management_id:
                queryset = queryset.filter(management_id=requested_management_id)
        else:
            management = Management.objects.filter(user=user).first()
            if management:
                # A management user can only query their own management_id.
                if requested_management_id and str(management.Management_id) != str(requested_management_id):
                    queryset = queryset.none()
                else:
                    queryset = queryset.filter(management=management)
            else:
                queryset = queryset.none()

        # Optional filters
        teacher_roll_no = self.request.query_params.get('teacher_rollNo') or self.request.query_params.get('teacher')
        student_roll_no = self.request.query_params.get('student_rollNo') or self.request.query_params.get('student')
        course_id = self.request.query_params.get('course')
        request_status = self.request.query_params.get('status')
        if teacher_roll_no:
            queryset = queryset.filter(teacher__teacher_rollNo=teacher_roll_no)
        if student_roll_no:
            queryset = queryset.filter(student__student_rollNo=student_roll_no)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if request_status:
            queryset = queryset.filter(status=request_status)
        return queryset

    def perform_create(self, serializer):
        """Auto-set management from the teacher's management on create"""
        teacher = serializer.validated_data.get('teacher')
        management = teacher.management if teacher else None
        serializer.save(management=management)

    def _process_request(self, request, pk, approve):
        """Helper method to approve or reject a request"""
        from django.utils import timezone
        from django.http import Http404

        # Ensure non-management users get an explicit authorization error.
        try:
            management = Management.objects.get(user=request.user)
        except Management.DoesNotExist:
            return Response(
                {'error': 'Only management users can process attendance requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            attendance_request = self.get_object()
        except Http404:
            return Response(
                {'error': 'Update attendance request not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if attendance_request.status != 'pending':
            return Response(
                {'error': f'Request has already been {attendance_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if approve:
            # Approve: Update the student's attendance in the StudentCourse
            try:
                student_course = StudentCourse.objects.get(
                    student=attendance_request.student,
                    course=attendance_request.course,
                    teacher=attendance_request.teacher
                )
                # Append the new classes to the existing attendance
                if student_course.classes_attended:
                    student_course.classes_attended = f"{student_course.classes_attended}, {attendance_request.classes_to_add}"
                else:
                    student_course.classes_attended = attendance_request.classes_to_add
                student_course.save()
            except StudentCourse.DoesNotExist:
                # Create new StudentCourse record if it doesn't exist
                StudentCourse.objects.create(
                    student=attendance_request.student,
                    course=attendance_request.course,
                    teacher=attendance_request.teacher,
                    classes_attended=attendance_request.classes_to_add
                )
            attendance_request.status = 'approved'
            message = 'Attendance request approved and attendance updated'
        else:
            attendance_request.status = 'rejected'
            message = 'Attendance request rejected'

        attendance_request.processed_at = timezone.now()
        attendance_request.processed_by = management
        attendance_request.save()

        serializer = self.get_serializer(attendance_request)
        return Response({
            'message': message,
            'request': serializer.data
        }, status=status.HTTP_200_OK)

    def approve(self, request, pk=None):
        """Approve the attendance update request"""
        return self._process_request(request, pk, approve=True)

    def reject(self, request, pk=None):
        """Reject the attendance update request"""
        return self._process_request(request, pk, approve=False)


class AttendanceSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AttendanceSession model providing CRUD operations and session management.
    - GET /attendance-sessions/ - List all attendance sessions
    - POST /attendance-sessions/ - Create/start an attendance session
    - GET /attendance-sessions/{id}/ - Retrieve an attendance session
    - PUT /attendance-sessions/{id}/ - Update an attendance session
    - PATCH /attendance-sessions/{id}/ - Partial update an attendance session
    - DELETE /attendance-sessions/{id}/ - Delete an attendance session
    - POST /attendance-sessions/{id}/stop/ - Stop an active session
    - GET /attendance-sessions/{id}/qr/ - Get QR code for the session
    - GET /attendance-sessions/{id}/attendance/ - Get attendance records for the session
    """
    queryset = AttendanceSession.objects.all()
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.all()
        # Optional filters
        teacher_id = self.request.query_params.get('teacher')
        course_id = self.request.query_params.get('course')
        session_status = self.request.query_params.get('status')
        section = self.request.query_params.get('section')
        year = self.request.query_params.get('year')
        
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if session_status:
            queryset = queryset.filter(status=session_status)
        if section:
            queryset = queryset.filter(section=section)
        if year:
            queryset = queryset.filter(year=year)
        
        return queryset

    def create(self, request, *args, **kwargs):
        """Start a new attendance session"""
        # Generate a unique QR code token
        qr_token = secrets.token_urlsafe(32)
        
        # Create the session without the token first
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Save the session and set the token
            session = serializer.save(qr_code_token=qr_token, status='active')
            
            # Return the updated serializer data
            response_serializer = self.get_serializer(session)
            return Response({
                'message': 'Attendance session started successfully',
                'session': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        """Stop an active attendance session"""
        try:
            session = self.get_object()
        except AttendanceSession.DoesNotExist:
            return Response(
                {'error': 'Attendance session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if session.status != 'active':
            return Response(
                {'error': 'Session is already stopped'},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.status = 'stopped'
        session.stopped_at = timezone.now()
        session.save()

        serializer = self.get_serializer(session)
        return Response({
            'message': 'Attendance session stopped successfully',
            'session': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def qr(self, request, pk=None):
        """Generate and return QR code for the session"""
        try:
            session = self.get_object()
        except AttendanceSession.DoesNotExist:
            return Response(
                {'error': 'Attendance session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if session.status != 'active':
            return Response(
                {'error': 'Session is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(session.qr_code_token)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return Response({
            'qr_code': f'data:image/png;base64,{img_base64}',
            'qr_token': session.qr_code_token,
            'session_id': session.id
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """Get attendance records for the session"""
        try:
            session = self.get_object()
        except AttendanceSession.DoesNotExist:
            return Response(
                {'error': 'Attendance session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        records = AttendanceRecord.objects.filter(session=session)
        serializer = AttendanceRecordSerializer(records, many=True)
        
        # Calculate statistics
        total_students = records.count()
        present_students = records.filter(is_present=True).count()
        rfid_only = records.filter(rfid_scanned=True, qr_scanned=False).count()
        qr_only = records.filter(rfid_scanned=False, qr_scanned=True).count()
        
        return Response({
            'records': serializer.data,
            'statistics': {
                'total_students': total_students,
                'present': present_students,
                'absent': total_students - present_students,
                'rfid_only': rfid_only,
                'qr_only': qr_only
            }
        }, status=status.HTTP_200_OK)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AttendanceRecord model providing CRUD operations.
    - GET /attendance-records/ - List all attendance records
    - GET /attendance-records/{id}/ - Retrieve an attendance record
    """
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.all()
        # Optional filters
        session_id = self.request.query_params.get('session')
        student_id = self.request.query_params.get('student')
        is_present = self.request.query_params.get('is_present')
        
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if is_present is not None:
            queryset = queryset.filter(is_present=is_present.lower() == 'true')
        
        return queryset


class RFIDScanView(APIView):
    """
    API endpoint for RFID scanning
    POST /attendance/rfid-scan/
    """
    permission_classes = [AllowAny]  # Allow hardware to scan without auth

    def _mark_attendance_if_complete(self, record, session):
        """
        Helper method to mark attendance and update StudentCourse if both scans are complete.
        """
        if record.rfid_scanned and record.qr_scanned:
            record.is_present = True
            record.marked_present_at = timezone.now()
            
            # Update StudentCourse attendance
            student_course, _ = StudentCourse.objects.get_or_create(
                student=record.student,
                course=session.course,
                teacher=session.teacher
            )
            
            # Append the session date to classes_attended
            session_date = session.started_at.strftime('%Y-%m-%d')
            if student_course.classes_attended:
                student_course.classes_attended = f"{student_course.classes_attended}, {session_date}"
            else:
                student_course.classes_attended = session_date
            student_course.save()

    def post(self, request):
        serializer = RFIDScanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        rfid = serializer.validated_data['rfid']
        session_id = serializer.validated_data['session_id']

        # Get student by roll number encoded on the RFID card
        try:
            student = Student.objects.get(student_rollNo=rfid)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found with this roll number'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get session
        try:
            session = AttendanceSession.objects.get(id=session_id)
        except AttendanceSession.DoesNotExist:
            return Response(
                {'error': 'Attendance session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if session is active
        if session.status != 'active':
            return Response(
                {'error': 'Attendance session is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if student is enrolled in this course/section/year
        if student.section != session.section or student.year != session.year:
            return Response(
                {'error': 'Student is not enrolled in this section/year'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create attendance record
        record, created = AttendanceRecord.objects.get_or_create(
            session=session,
            student=student
        )

        # Update RFID scan
        record.rfid_scanned = True
        record.rfid_scanned_at = timezone.now()

        # Check if both RFID and QR are scanned
        self._mark_attendance_if_complete(record, session)

        record.save()

        return Response({
            'message': 'RFID scanned successfully',
            'student': student.student_name,
            'rfid_scanned': True,
            'qr_scanned': record.qr_scanned,
            'is_present': record.is_present,
            'needs_qr': not record.qr_scanned
        }, status=status.HTTP_200_OK)


class QRScanView(APIView):
    """
    API endpoint for QR code scanning
    POST /attendance/qr-scan/
    """
    permission_classes = [IsAuthenticated]

    def _mark_attendance_if_complete(self, record, session):
        """
        Helper method to mark attendance and update StudentCourse if both scans are complete.
        """
        if record.rfid_scanned and record.qr_scanned:
            record.is_present = True
            record.marked_present_at = timezone.now()
            
            # Update StudentCourse attendance
            student_course, _ = StudentCourse.objects.get_or_create(
                student=record.student,
                course=session.course,
                teacher=session.teacher
            )
            
            # Append the session date to classes_attended
            session_date = session.started_at.strftime('%Y-%m-%d')
            if student_course.classes_attended:
                student_course.classes_attended = f"{student_course.classes_attended}, {session_date}"
            else:
                student_course.classes_attended = session_date
            student_course.save()

    def post(self, request):
        serializer = QRScanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        qr_token = serializer.validated_data['qr_token']
        student_id = serializer.validated_data['student_id']

        # Get student
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get session by QR token
        try:
            session = AttendanceSession.objects.get(qr_code_token=qr_token)
        except AttendanceSession.DoesNotExist:
            return Response(
                {'error': 'Invalid QR code or session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if session is active
        if session.status != 'active':
            return Response(
                {'error': 'Attendance session is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if student is enrolled in this course/section/year
        if student.section != session.section or student.year != session.year:
            return Response(
                {'error': 'Student is not enrolled in this section/year'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create attendance record
        record, created = AttendanceRecord.objects.get_or_create(
            session=session,
            student=student
        )

        # Update QR scan
        record.qr_scanned = True
        record.qr_scanned_at = timezone.now()

        # Check if both RFID and QR are scanned
        self._mark_attendance_if_complete(record, session)

        record.save()

        return Response({
            'message': 'QR code scanned successfully',
            'student': student.student_name,
            'rfid_scanned': record.rfid_scanned,
            'qr_scanned': True,
            'is_present': record.is_present,
            'needs_rfid': not record.rfid_scanned
        }, status=status.HTTP_200_OK)


# ============ Registration Views ============


class StudentRegistrationView(generics.CreateAPIView):
    """
    API endpoint for student registration
    """
    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            student = serializer.save()
            return Response({
                'message': 'Student registered successfully',
                'student_id': student.student_id,
                'email': student.email,
                'student_name': student.student_name
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TeacherRegistrationView(generics.CreateAPIView):
    """
    API endpoint for teacher registration
    """
    serializer_class = TeacherRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            teacher = serializer.save()
            return Response({
                'message': 'Teacher registered successfully',
                'teacher_id': teacher.teacher_id,
                'email': teacher.email,
                'teacher_name': teacher.teacher_name
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManagementRegistrationView(generics.CreateAPIView):
    """
    API endpoint for management registration
    """
    serializer_class = ManagementRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            management = serializer.save()
            return Response({
                'message': 'Management registered successfully',
                'management_id': management.Management_id,
                'email': management.email,
                'management_name': management.Management_name
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentLoginView(APIView):
    """
    API endpoint for student login
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # Authenticate user
            user = authenticate(username=email, password=password)
            
            if user is not None:
                # Check if user has a student profile
                try:
                    student = Student.objects.get(user=user)
                    # Generate JWT tokens
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'message': 'Login successful',
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user_type': 'student',
                        'student_id': student.student_id,
                        'student_name': student.student_name,
                        'email': student.email
                    }, status=status.HTTP_200_OK)
                except Student.DoesNotExist:
                    return Response({
                        'error': 'Student profile not found for this user'
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({
                    'error': 'Invalid email or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TeacherLoginView(APIView):
    """
    API endpoint for teacher login
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # Authenticate user
            user = authenticate(username=email, password=password)
            
            if user is not None:
                # Check if user has a teacher profile
                try:
                    teacher = Teacher.objects.get(user=user)
                    # Generate JWT tokens
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'message': 'Login successful',
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user_type': 'teacher',
                        'teacher_id': teacher.teacher_id,
                        'teacher_name': teacher.teacher_name,
                        'email': teacher.email
                    }, status=status.HTTP_200_OK)
                except Teacher.DoesNotExist:
                    return Response({
                        'error': 'Teacher profile not found for this user'
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({
                    'error': 'Invalid email or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManagementLoginView(APIView):
    """
    API endpoint for management login
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # Authenticate user
            user = authenticate(username=email, password=password)
            
            if user is not None:
                # Check if user has a management profile
                try:
                    management = Management.objects.get(user=user)
                    # Generate JWT tokens
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'message': 'Login successful',
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user_type': 'management',
                        'management_id': management.Management_id,
                        'management_name': management.Management_name,
                        'email': management.email
                    }, status=status.HTTP_200_OK)
                except Management.DoesNotExist:
                    return Response({
                        'error': 'Management profile not found for this user'
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({
                    'error': 'Invalid email or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============ Admin Dashboard Attendance Summary Views ============

class StudentAttendanceSummaryView(APIView):
    """
    Returns attendance summary for a student across all enrolled courses.

    GET /api/attendance/student/?student_rollNo=<roll_no>
         /api/attendance/student/?student_id=<pk>

    Used by the admin dashboard → View Attendance → Individual Student Search tab.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student_roll_no = request.query_params.get('student_rollNo', '').strip() or request.query_params.get('rfid', '').strip()
        student_id = request.query_params.get('student_id', '').strip()

        if not student_roll_no and not student_id:
            return Response(
                {'error': 'Provide student_rollNo or student_id as query param'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if student_roll_no:
                student = Student.objects.get(student_rollNo=student_roll_no)
            else:
                student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        # Build per-course attendance from StudentCourse + AttendanceRecord data
        student_courses = StudentCourse.objects.filter(student=student).select_related('course', 'teacher')
        courses_data = []
        for sc in student_courses:
            attended_list, attended = _classes_attended_count(sc.classes_attended)

            # Count total sessions for this course/teacher combination
            total_sessions = AttendanceSession.objects.filter(
                course=sc.course,
                teacher=sc.teacher
            ).count()

            percent = _attendance_percent(attended, total_sessions)

            courses_data.append({
                'course_id': sc.course.course_id,
                'course_code': sc.course.course_code,
                'course_name': sc.course.course_name,
                'teacher_name': sc.teacher.teacher_name,
                'classes_attended_list': attended_list,
                'attended': attended,
                'total_sessions': total_sessions,
                'percent': percent,
            })

        data = {
            'student_id': student.student_id,
            'name': student.student_name,
            'student_rollNo': student.student_rollNo,
            'year': student.year,
            'program': student.dept,
            'section': student.section,
            'email': student.email or '',
            'overall_attendance': student.overall_attendance,
            'courses': courses_data,
        }
        serializer = StudentAttendanceSummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


def _attendance_percent(attended, total_sessions):
    """Return attendance percentage (0–100 rounded to 1 dp), avoiding division by zero."""
    return round(attended / total_sessions * 100, 1) if total_sessions > 0 else 0.0


def _classes_attended_count(classes_attended_str):
    """Parse a comma-separated attendance string and return (list_of_dates, count)."""
    attended_list = [d.strip() for d in classes_attended_str.split(',') if d.strip()] \
        if classes_attended_str else []
    return attended_list, len(attended_list)


class CourseAttendanceSummaryView(APIView):
    """
    Returns attendance summary for all students enrolled in a given course.

    GET /api/attendance/course/?course_code=<code>
         /api/attendance/course/?course_id=<pk>

    Used by the admin dashboard → View Attendance → Course-wise Attendance tab.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        course_code = request.query_params.get('course_code', '').strip()
        course_id = request.query_params.get('course_id', '').strip()

        if not course_code and not course_id:
            return Response(
                {'error': 'Provide course_code or course_id as query param'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if course_code:
                course = Course.objects.get(course_code=course_code)
            else:
                course = Course.objects.get(course_id=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

        # Total sessions held for this course
        total_sessions = AttendanceSession.objects.filter(course=course).count()

        # All students enrolled in this course via StudentCourse
        student_courses = StudentCourse.objects.filter(course=course).select_related('student')
        students_data = []
        for sc in student_courses:
            _, attended = _classes_attended_count(sc.classes_attended)
            percent = _attendance_percent(attended, total_sessions)

            students_data.append({
                'student_id': sc.student.student_id,
                'roll': sc.student.student_rollNo,
                'name': sc.student.student_name,
                'year': sc.student.year,
                'program': sc.student.dept,
                'section': sc.student.section,
                'attended': attended,
                'total_sessions': total_sessions,
                'percent': percent,
            })

        data = {
            'course_id': course.course_id,
            'course_code': course.course_code,
            'course_name': course.course_name,
            'students': students_data,
        }
        serializer = CourseAttendanceSummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


# Template-based views for login and register pages

def student_login_page(request):
    """
    Django template view for student login
    """
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            try:
                student = Student.objects.get(user=user)
                login(request, user)
                messages.success(request, 'Login successful!')
                return redirect('student-dashboard')
            except Student.DoesNotExist:
                messages.error(request, 'Student profile not found for this user')
        else:
            messages.error(request, 'Invalid email or password')
    
    return render(request, 'core/student_login.html')


def teacher_login_page(request):
    """
    Django template view for teacher login
    """
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            try:
                teacher = Teacher.objects.get(user=user)
                login(request, user)
                messages.success(request, 'Login successful!')
                return redirect('teacher-dashboard')
            except Teacher.DoesNotExist:
                messages.error(request, 'Teacher profile not found for this user')
        else:
            messages.error(request, 'Invalid email or password')
    
    return render(request, 'core/teacher_login.html')


def management_login_page(request):
    """
    Django template view for management login
    """
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            try:
                management = Management.objects.get(user=user)
                login(request, user)
                messages.success(request, 'Login successful!')
                return redirect('management-dashboard')
            except Management.DoesNotExist:
                messages.error(request, 'Management profile not found for this user')
        else:
            messages.error(request, 'Invalid email or password')
    
    return render(request, 'core/management_login.html')


def student_register_page(request):
    """
    Django template view for student registration
    """
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        student_name = request.POST.get('student_name')
        student_roll_no = request.POST.get('student_rollNo')
        year = request.POST.get('year')
        dept = request.POST.get('dept')
        section = request.POST.get('section')
        
        errors = []
        
        # Validation
        if password != password2:
            errors.append("Passwords don't match")
        
        if User.objects.filter(email=email).exists():
            errors.append("Email already exists")
        
        try:
            validate_password(password)
        except ValidationError as e:
            errors.extend(e.messages)
        
        if not errors:
            try:
                # Create user
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password
                )
                
                # Create student
                student = Student.objects.create(
                    user=user,
                    email=email,
                    student_name=student_name,
                    student_rollNo=student_roll_no,
                    year=int(year),
                    dept=dept,
                    section=section
                )
                
                messages.success(request, 'Registration successful! Please login.')
                return redirect('student-login-page')
            except Exception as e:
                errors.append(str(e))
        
        return render(request, 'core/student_register.html', {'errors': errors})
    
    return render(request, 'core/student_register.html')


def teacher_register_page(request):
    """
    Django template view for teacher registration
    """
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        teacher_name = request.POST.get('teacher_name')
        teacher_roll_no = request.POST.get('teacher_rollNo')
        
        errors = []
        
        # Validation
        if password != password2:
            errors.append("Passwords don't match")
        
        if User.objects.filter(email=email).exists():
            errors.append("Email already exists")
        
        try:
            validate_password(password)
        except ValidationError as e:
            errors.extend(e.messages)
        
        if not errors:
            try:
                # Create user
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password
                )
                
                # Create teacher
                teacher = Teacher.objects.create(
                    user=user,
                    email=email,
                    teacher_name=teacher_name,
                    teacher_rollNo=teacher_roll_no
                )
                
                messages.success(request, 'Registration successful! Please login.')
                return redirect('teacher-login-page')
            except Exception as e:
                errors.append(str(e))
        
        return render(request, 'core/teacher_register.html', {'errors': errors})
    
    return render(request, 'core/teacher_register.html')


def management_register_page(request):
    """
    Django template view for management registration
    """
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        management_name = request.POST.get('Management_name')
        
        errors = []
        
        # Validation
        if password != password2:
            errors.append("Passwords don't match")
        
        if User.objects.filter(email=email).exists():
            errors.append("Email already exists")
        
        try:
            validate_password(password)
        except ValidationError as e:
            errors.extend(e.messages)
        
        if not errors:
            try:
                # Create user
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password
                )
                
                # Create management
                management = Management.objects.create(
                    user=user,
                    email=email,
                    Management_name=management_name
                )
                
                messages.success(request, 'Registration successful! Please login.')
                return redirect('management-login-page')
            except Exception as e:
                errors.append(str(e))
        
        return render(request, 'core/management_register.html', {'errors': errors})
    
    return render(request, 'core/management_register.html')


@login_required
def student_dashboard(request):
    """
    Dashboard view for students with attendance information
    """
    try:
        student = Student.objects.get(user=request.user)
        
        # Get course-wise attendance
        student_courses = StudentCourse.objects.filter(student=student).select_related('course', 'teacher')
        
        course_attendance = []
        for sc in student_courses:
            # Calculate attendance percentage for this course
            taught_course = TaughtCourse.objects.filter(
                course=sc.course, 
                teacher=sc.teacher
            ).first()
            
            if taught_course:
                # Parse classes attended and classes taken
                classes_attended = len(sc.classes_attended.split(',')) if sc.classes_attended else 0
                classes_taken = len(taught_course.classes_taken.split(',')) if taught_course.classes_taken else 0
                
                attendance_percentage = (classes_attended / classes_taken * 100) if classes_taken > 0 else 0
            else:
                attendance_percentage = 0
            
            course_attendance.append({
                'course_name': sc.course.course_name,
                'teacher_name': sc.teacher.teacher_name,
                'attendance': round(attendance_percentage, 1)
            })
        
        context = {
            'student_name': student.student_name,
            'student_id': student.student_id,
            'overall_attendance': round(student.overall_attendance, 1),
            'total_courses': len(course_attendance),
            'course_attendance': course_attendance,
        }
        
        return render(request, 'core/student_dashboard.html', context)
    except Student.DoesNotExist:
        messages.error(request, 'Student profile not found')
        return redirect('student-login-page')


@login_required
def teacher_dashboard(request):
    """
    Dashboard view for teachers
    """
    try:
        teacher = Teacher.objects.get(user=request.user)
        
        # Get courses taught by this teacher
        taught_courses = TaughtCourse.objects.filter(teacher=teacher).select_related('course')
        
        courses = []
        for tc in taught_courses:
            courses.append({
                'course_name': tc.course.course_name,
                'classes_taken': tc.classes_taken if tc.classes_taken else 'None'
            })
        
        context = {
            'teacher_name': teacher.teacher_name,
            'teacher_id': teacher.teacher_id,
            'email': teacher.email,
            'total_courses': len(courses),
            'courses': courses,
        }
        
        return render(request, 'core/teacher_dashboard.html', context)
    except Teacher.DoesNotExist:
        messages.error(request, 'Teacher profile not found')
        return redirect('teacher-login-page')


@login_required
def management_dashboard(request):
    """
    Dashboard view for management
    """
    try:
        management = Management.objects.get(user=request.user)
        
        context = {
            'management_name': management.Management_name,
            'management_id': management.Management_id,
            'email': management.email,
        }
        
        return render(request, 'core/management_dashboard.html', context)
    except Management.DoesNotExist:
        messages.error(request, 'Management profile not found')
        return redirect('management-login-page')


def logout_page(request):
    """
    Logout view
    """
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('student-login-page')


