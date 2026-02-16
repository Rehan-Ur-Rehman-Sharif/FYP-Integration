from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
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
    QRScanSerializer
)
from .models import (
    Student, Teacher, Management, StudentCourse, TaughtCourse, Course, Class,
    UpdateAttendanceRequest, AttendanceSession, AttendanceRecord
)


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
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.all()
        # Optional filters
        year = self.request.query_params.get('year')
        dept = self.request.query_params.get('dept')
        section = self.request.query_params.get('section')
        if year:
            queryset = queryset.filter(year=year)
        if dept:
            queryset = queryset.filter(dept=dept)
        if section:
            queryset = queryset.filter(section=section)
        return queryset


class TeacherViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Teacher model providing CRUD operations.
    - GET /teachers/ - List all teachers
    - POST /teachers/ - Create a teacher (use registration for new users)
    - GET /teachers/{id}/ - Retrieve a teacher
    - PUT /teachers/{id}/ - Update a teacher
    - PATCH /teachers/{id}/ - Partial update a teacher
    - DELETE /teachers/{id}/ - Delete a teacher
    """
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]


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
        # Optional filters
        teacher_id = self.request.query_params.get('teacher')
        student_id = self.request.query_params.get('student')
        course_id = self.request.query_params.get('course')
        request_status = self.request.query_params.get('status')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if request_status:
            queryset = queryset.filter(status=request_status)
        return queryset

    def _process_request(self, request, pk, approve):
        """Helper method to approve or reject a request"""
        from django.utils import timezone
        from django.http import Http404

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

        # Get management user
        try:
            management = Management.objects.get(user=request.user)
        except Management.DoesNotExist:
            return Response(
                {'error': 'Only management users can process attendance requests'},
                status=status.HTTP_403_FORBIDDEN
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

        # Get student by RFID
        try:
            student = Student.objects.get(rfid=rfid)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found with this RFID'},
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
        rfid = request.POST.get('rfid')
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
                    rfid=rfid,
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
        rfid = request.POST.get('rfid')
        
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
                    rfid=rfid
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


