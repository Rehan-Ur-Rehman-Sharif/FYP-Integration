from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import (
    Student, Teacher, Management, Course, Class, TaughtCourse, StudentCourse,
    UpdateAttendanceRequest, AttendanceSession, AttendanceRecord
)


class StudentRegistrationTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('student-register')
        self.valid_data = {
            'email': 'student@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'student_name': 'Test Student',
            'rfid': 'RFID001',
            'year': 1,
            'dept': 'CS',
            'section': 'A'
        }

    def test_student_registration_success(self):
        """Test successful student registration"""
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('student_id', response.data)
        self.assertEqual(response.data['email'], 'student@test.com')
        
        # Verify user and student were created
        self.assertTrue(User.objects.filter(email='student@test.com').exists())
        self.assertTrue(Student.objects.filter(email='student@test.com').exists())

    def test_student_registration_password_mismatch(self):
        """Test registration fails when passwords don't match"""
        data = self.valid_data.copy()
        data['password2'] = 'DifferentPass123!'
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_registration_duplicate_email(self):
        """Test registration fails with duplicate email"""
        self.client.post(self.url, self.valid_data, format='json')
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class StudentLoginTestCase(APITestCase):
    def setUp(self):
        self.register_url = reverse('student-register')
        self.login_url = reverse('student-login')
        self.credentials = {
            'email': 'student@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'student_name': 'Test Student',
            'rfid': 'RFID001',
            'year': 1,
            'dept': 'CS',
            'section': 'A'
        }
        # Register a student
        self.client.post(self.register_url, self.credentials, format='json')

    def test_student_login_success(self):
        """Test successful student login"""
        response = self.client.post(self.login_url, {
            'email': 'student@test.com',
            'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user_type'], 'student')

    def test_student_login_invalid_password(self):
        """Test login fails with invalid password"""
        response = self.client.post(self.login_url, {
            'email': 'student@test.com',
            'password': 'WrongPassword123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_login_nonexistent_user(self):
        """Test login fails with nonexistent user"""
        response = self.client.post(self.login_url, {
            'email': 'nonexistent@test.com',
            'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TeacherRegistrationTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('teacher-register')
        self.valid_data = {
            'email': 'teacher@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'teacher_name': 'Test Teacher',
            'rfid': 'RFID002'
        }

    def test_teacher_registration_success(self):
        """Test successful teacher registration"""
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('teacher_id', response.data)
        self.assertEqual(response.data['email'], 'teacher@test.com')
        
        # Verify user and teacher were created
        self.assertTrue(User.objects.filter(email='teacher@test.com').exists())
        self.assertTrue(Teacher.objects.filter(email='teacher@test.com').exists())


class TeacherLoginTestCase(APITestCase):
    def setUp(self):
        self.register_url = reverse('teacher-register')
        self.login_url = reverse('teacher-login')
        self.credentials = {
            'email': 'teacher@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'teacher_name': 'Test Teacher',
            'rfid': 'RFID002'
        }
        # Register a teacher
        self.client.post(self.register_url, self.credentials, format='json')

    def test_teacher_login_success(self):
        """Test successful teacher login"""
        response = self.client.post(self.login_url, {
            'email': 'teacher@test.com',
            'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user_type'], 'teacher')


class ManagementRegistrationTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('management-register')
        self.valid_data = {
            'email': 'management@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'Management_name': 'Test Management'
        }

    def test_management_registration_success(self):
        """Test successful management registration"""
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('management_id', response.data)
        self.assertEqual(response.data['email'], 'management@test.com')
        
        # Verify user and management were created
        self.assertTrue(User.objects.filter(email='management@test.com').exists())
        self.assertTrue(Management.objects.filter(email='management@test.com').exists())


class ManagementLoginTestCase(APITestCase):
    def setUp(self):
        self.register_url = reverse('management-register')
        self.login_url = reverse('management-login')
        self.credentials = {
            'email': 'management@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'Management_name': 'Test Management'
        }
        # Register a management user
        self.client.post(self.register_url, self.credentials, format='json')

    def test_management_login_success(self):
        """Test successful management login"""
        response = self.client.post(self.login_url, {
            'email': 'management@test.com',
            'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user_type'], 'management')


class UserTypeSeparationTestCase(APITestCase):
    """Test that users can only login through their correct user type endpoint"""
    
    def test_student_cannot_login_as_teacher(self):
        """Test that a student cannot login through teacher endpoint"""
        # Register a student
        student_register_url = reverse('student-register')
        student_data = {
            'email': 'student@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'student_name': 'Test Student',
            'rfid': 'RFID001',
            'year': 1,
            'dept': 'CS',
            'section': 'A'
        }
        self.client.post(student_register_url, student_data, format='json')
        
        # Try to login as teacher
        teacher_login_url = reverse('teacher-login')
        response = self.client.post(teacher_login_url, {
            'email': 'student@test.com',
            'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ============ CRUD Tests for Models ============

class AuthenticatedAPITestCase(APITestCase):
    """Base class for authenticated API tests"""
    
    def setUp(self):
        # Create a user for authentication
        self.user = User.objects.create_user(
            username='testuser@test.com',
            email='testuser@test.com',
            password='TestPass123!'
        )
        self.client.force_authenticate(user=self.user)


class StudentCRUDTestCase(AuthenticatedAPITestCase):
    """Test CRUD operations for Student model"""
    
    def setUp(self):
        super().setUp()
        # Create a student for testing
        self.student = Student.objects.create(
            student_name='Test Student',
            email='student@test.com',
            rfid='RFID001',
            year=1,
            dept='CS',
            section='A'
        )
        self.list_url = reverse('student-list')
        self.detail_url = reverse('student-detail', args=[self.student.student_id])
    
    def test_list_students(self):
        """Test listing all students"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_retrieve_student(self):
        """Test retrieving a single student"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student_name'], 'Test Student')
    
    def test_update_student(self):
        """Test updating a student"""
        data = {'student_name': 'Updated Student', 'email': 'updated@test.com', 'rfid': 'RFID001', 'year': 2, 'dept': 'IT', 'section': 'B'}
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student_name'], 'Updated Student')
    
    def test_partial_update_student(self):
        """Test partially updating a student"""
        data = {'student_name': 'Partially Updated'}
        response = self.client.patch(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student_name'], 'Partially Updated')
    
    def test_delete_student(self):
        """Test deleting a student"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Student.objects.filter(student_id=self.student.student_id).exists())
    
    def test_filter_students_by_year(self):
        """Test filtering students by year"""
        Student.objects.create(student_name='Year 2 Student', email='year2@test.com', rfid='RFID002', year=2, dept='CS', section='A')
        response = self.client.get(self.list_url, {'year': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['year'], 1)


class TeacherCRUDTestCase(AuthenticatedAPITestCase):
    """Test CRUD operations for Teacher model"""
    
    def setUp(self):
        super().setUp()
        self.teacher = Teacher.objects.create(
            teacher_name='Test Teacher',
            email='teacher@test.com',
            rfid='RFID001'
        )
        self.list_url = reverse('teacher-list')
        self.detail_url = reverse('teacher-detail', args=[self.teacher.teacher_id])
    
    def test_list_teachers(self):
        """Test listing all teachers"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_retrieve_teacher(self):
        """Test retrieving a single teacher"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['teacher_name'], 'Test Teacher')
    
    def test_update_teacher(self):
        """Test updating a teacher"""
        data = {'teacher_name': 'Updated Teacher', 'email': 'updated@test.com', 'rfid': 'RFID001'}
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['teacher_name'], 'Updated Teacher')
    
    def test_delete_teacher(self):
        """Test deleting a teacher"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class ManagementCRUDTestCase(AuthenticatedAPITestCase):
    """Test CRUD operations for Management model"""
    
    def setUp(self):
        super().setUp()
        self.management = Management.objects.create(
            Management_name='Test Management',
            email='management@test.com'
        )
        self.list_url = reverse('management-list')
        self.detail_url = reverse('management-detail', args=[self.management.Management_id])
    
    def test_list_management(self):
        """Test listing all management users"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_retrieve_management(self):
        """Test retrieving a single management user"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['Management_name'], 'Test Management')
    
    def test_update_management(self):
        """Test updating a management user"""
        data = {'Management_name': 'Updated Management', 'email': 'updated@test.com'}
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['Management_name'], 'Updated Management')
    
    def test_delete_management(self):
        """Test deleting a management user"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class CourseCRUDTestCase(AuthenticatedAPITestCase):
    """Test CRUD operations for Course model"""
    
    def setUp(self):
        super().setUp()
        self.course = Course.objects.create(course_name='Test Course')
        self.list_url = reverse('course-list')
        self.detail_url = reverse('course-detail', args=[self.course.course_id])
    
    def test_list_courses(self):
        """Test listing all courses"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_course(self):
        """Test creating a course"""
        data = {'course_name': 'New Course'}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['course_name'], 'New Course')
    
    def test_retrieve_course(self):
        """Test retrieving a single course"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['course_name'], 'Test Course')
    
    def test_update_course(self):
        """Test updating a course"""
        data = {'course_name': 'Updated Course'}
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['course_name'], 'Updated Course')
    
    def test_delete_course(self):
        """Test deleting a course"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class ClassCRUDTestCase(AuthenticatedAPITestCase):
    """Test CRUD operations for Class model"""
    
    def setUp(self):
        super().setUp()
        self.classroom = Class.objects.create(scanner_id='SCANNER001')
        self.list_url = reverse('class-list')
        self.detail_url = reverse('class-detail', args=[self.classroom.classroom_id])
    
    def test_list_classes(self):
        """Test listing all classes"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_class(self):
        """Test creating a class"""
        data = {'scanner_id': 'SCANNER002'}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['scanner_id'], 'SCANNER002')
    
    def test_retrieve_class(self):
        """Test retrieving a single class"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['scanner_id'], 'SCANNER001')
    
    def test_update_class(self):
        """Test updating a class"""
        data = {'scanner_id': 'UPDATED_SCANNER'}
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['scanner_id'], 'UPDATED_SCANNER')
    
    def test_delete_class(self):
        """Test deleting a class"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class TaughtCourseCRUDTestCase(AuthenticatedAPITestCase):
    """Test CRUD operations for TaughtCourse model"""
    
    def setUp(self):
        super().setUp()
        self.course = Course.objects.create(course_name='Test Course')
        self.teacher = Teacher.objects.create(teacher_name='Test Teacher', email='teacher@test.com', rfid='RFID001')
        self.taught_course = TaughtCourse.objects.create(
            course=self.course,
            teacher=self.teacher,
            classes_taken='Class A, Class B'
        )
        self.list_url = reverse('taughtcourse-list')
        self.detail_url = reverse('taughtcourse-detail', args=[self.taught_course.id])
    
    def test_list_taught_courses(self):
        """Test listing all taught courses"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_taught_course(self):
        """Test creating a taught course"""
        new_teacher = Teacher.objects.create(teacher_name='New Teacher', email='new@test.com', rfid='RFID002')
        data = {'course': self.course.course_id, 'teacher': new_teacher.teacher_id, 'classes_taken': 'Class C'}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_retrieve_taught_course(self):
        """Test retrieving a single taught course"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['course_name'], 'Test Course')
        self.assertEqual(response.data['teacher_name'], 'Test Teacher')
    
    def test_update_taught_course(self):
        """Test updating a taught course"""
        data = {'course': self.course.course_id, 'teacher': self.teacher.teacher_id, 'classes_taken': 'Class D, Class E'}
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['classes_taken'], 'Class D, Class E')
    
    def test_delete_taught_course(self):
        """Test deleting a taught course"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_filter_by_teacher(self):
        """Test filtering taught courses by teacher"""
        response = self.client.get(self.list_url, {'teacher': self.teacher.teacher_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class StudentCourseCRUDTestCase(AuthenticatedAPITestCase):
    """Test CRUD operations for StudentCourse model"""
    
    def setUp(self):
        super().setUp()
        self.student = Student.objects.create(student_name='Test Student', email='student@test.com', rfid='RFID001', year=1, dept='CS', section='A')
        self.course = Course.objects.create(course_name='Test Course')
        self.teacher = Teacher.objects.create(teacher_name='Test Teacher', email='teacher@test.com', rfid='RFID002')
        self.student_course = StudentCourse.objects.create(
            student=self.student,
            course=self.course,
            teacher=self.teacher,
            classes_attended='Class A'
        )
        self.list_url = reverse('studentcourse-list')
        self.detail_url = reverse('studentcourse-detail', args=[self.student_course.id])
    
    def test_list_student_courses(self):
        """Test listing all student courses"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_student_course(self):
        """Test creating a student course"""
        new_student = Student.objects.create(student_name='New Student', email='new@test.com', rfid='RFID003', year=2, dept='IT', section='B')
        data = {'student': new_student.student_id, 'course': self.course.course_id, 'teacher': self.teacher.teacher_id, 'classes_attended': 'Class B'}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_retrieve_student_course(self):
        """Test retrieving a single student course"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student_name'], 'Test Student')
        self.assertEqual(response.data['course_name'], 'Test Course')
        self.assertEqual(response.data['teacher_name'], 'Test Teacher')
    
    def test_update_student_course(self):
        """Test updating a student course"""
        data = {'student': self.student.student_id, 'course': self.course.course_id, 'teacher': self.teacher.teacher_id, 'classes_attended': 'Class A, Class B'}
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['classes_attended'], 'Class A, Class B')
    
    def test_delete_student_course(self):
        """Test deleting a student course"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_filter_by_student(self):
        """Test filtering student courses by student"""
        response = self.client.get(self.list_url, {'student': self.student.student_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class UnauthenticatedAccessTestCase(APITestCase):
    """Test that CRUD endpoints require authentication"""
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access CRUD endpoints"""
        endpoints = [
            reverse('student-list'),
            reverse('teacher-list'),
            reverse('management-list'),
            reverse('course-list'),
            reverse('class-list'),
            reverse('taughtcourse-list'),
            reverse('studentcourse-list'),
            reverse('updateattendancerequest-list'),
        ]
        for url in endpoints:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UpdateAttendanceRequestCRUDTestCase(AuthenticatedAPITestCase):
    """Test CRUD operations for UpdateAttendanceRequest model"""
    
    def setUp(self):
        super().setUp()
        # Create required related objects
        self.teacher = Teacher.objects.create(
            teacher_name='Test Teacher',
            email='teacher@test.com',
            rfid='RFID001'
        )
        self.student = Student.objects.create(
            student_name='Test Student',
            email='student@test.com',
            rfid='RFID002',
            year=1,
            dept='CS',
            section='A'
        )
        self.course = Course.objects.create(course_name='Test Course')
        
        # Create an update attendance request
        self.attendance_request = UpdateAttendanceRequest.objects.create(
            teacher=self.teacher,
            student=self.student,
            course=self.course,
            classes_to_add='Class A, Class B',
            reason='Student was marked absent by mistake'
        )
        
        self.list_url = reverse('updateattendancerequest-list')
        self.detail_url = reverse('updateattendancerequest-detail', args=[self.attendance_request.id])
    
    def test_list_update_attendance_requests(self):
        """Test listing all update attendance requests"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_update_attendance_request(self):
        """Test creating an update attendance request"""
        new_student = Student.objects.create(
            student_name='New Student',
            email='new@test.com',
            rfid='RFID003',
            year=2,
            dept='IT',
            section='B'
        )
        data = {
            'teacher': self.teacher.teacher_id,
            'student': new_student.student_id,
            'course': self.course.course_id,
            'classes_to_add': 'Class C',
            'reason': 'Late arrival registered'
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['classes_to_add'], 'Class C')
        self.assertEqual(response.data['status'], 'pending')
    
    def test_retrieve_update_attendance_request(self):
        """Test retrieving a single update attendance request"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['teacher_name'], 'Test Teacher')
        self.assertEqual(response.data['student_name'], 'Test Student')
        self.assertEqual(response.data['course_name'], 'Test Course')
        self.assertEqual(response.data['status'], 'pending')
    
    def test_update_attendance_request(self):
        """Test updating an update attendance request"""
        data = {
            'teacher': self.teacher.teacher_id,
            'student': self.student.student_id,
            'course': self.course.course_id,
            'classes_to_add': 'Class D, Class E',
            'reason': 'Updated reason'
        }
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['classes_to_add'], 'Class D, Class E')
        self.assertEqual(response.data['reason'], 'Updated reason')
    
    def test_delete_update_attendance_request(self):
        """Test deleting an update attendance request"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(UpdateAttendanceRequest.objects.filter(id=self.attendance_request.id).exists())
    
    def test_filter_by_status(self):
        """Test filtering update attendance requests by status"""
        response = self.client.get(self.list_url, {'status': 'pending'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        response = self.client.get(self.list_url, {'status': 'approved'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_filter_by_teacher(self):
        """Test filtering update attendance requests by teacher"""
        response = self.client.get(self.list_url, {'teacher': self.teacher.teacher_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class UpdateAttendanceRequestApproveRejectTestCase(APITestCase):
    """Test approve and reject functionality for UpdateAttendanceRequest"""
    
    def setUp(self):
        # Create management user for approving/rejecting
        self.management_user = User.objects.create_user(
            username='management@test.com',
            email='management@test.com',
            password='TestPass123!'
        )
        self.management = Management.objects.create(
            user=self.management_user,
            email='management@test.com',
            Management_name='Test Management'
        )
        
        # Create regular user (non-management)
        self.regular_user = User.objects.create_user(
            username='regular@test.com',
            email='regular@test.com',
            password='TestPass123!'
        )
        
        # Create required related objects
        self.teacher = Teacher.objects.create(
            teacher_name='Test Teacher',
            email='teacher@test.com',
            rfid='RFID001'
        )
        self.student = Student.objects.create(
            student_name='Test Student',
            email='student@test.com',
            rfid='RFID002',
            year=1,
            dept='CS',
            section='A'
        )
        self.course = Course.objects.create(course_name='Test Course')
        
        # Create an update attendance request
        self.attendance_request = UpdateAttendanceRequest.objects.create(
            teacher=self.teacher,
            student=self.student,
            course=self.course,
            classes_to_add='Class A, Class B',
            reason='Student was marked absent by mistake'
        )
        
        self.approve_url = reverse('updateattendancerequest-approve', args=[self.attendance_request.id])
        self.reject_url = reverse('updateattendancerequest-reject', args=[self.attendance_request.id])
    
    def test_approve_request_by_management(self):
        """Test that management can approve attendance requests"""
        self.client.force_authenticate(user=self.management_user)
        response = self.client.post(self.approve_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['request']['status'], 'approved')
        
        # Verify StudentCourse was created/updated
        student_course = StudentCourse.objects.get(
            student=self.student,
            course=self.course,
            teacher=self.teacher
        )
        self.assertEqual(student_course.classes_attended, 'Class A, Class B')
        
        # Verify the request was updated
        self.attendance_request.refresh_from_db()
        self.assertEqual(self.attendance_request.status, 'approved')
        self.assertEqual(self.attendance_request.processed_by, self.management)
        self.assertIsNotNone(self.attendance_request.processed_at)
    
    def test_approve_request_updates_existing_attendance(self):
        """Test that approving a request updates existing attendance"""
        # Create existing StudentCourse
        student_course = StudentCourse.objects.create(
            student=self.student,
            course=self.course,
            teacher=self.teacher,
            classes_attended='Class X'
        )
        
        self.client.force_authenticate(user=self.management_user)
        response = self.client.post(self.approve_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify attendance was appended
        student_course.refresh_from_db()
        self.assertEqual(student_course.classes_attended, 'Class X, Class A, Class B')
    
    def test_reject_request_by_management(self):
        """Test that management can reject attendance requests"""
        self.client.force_authenticate(user=self.management_user)
        response = self.client.post(self.reject_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['request']['status'], 'rejected')
        
        # Verify no StudentCourse was created
        self.assertFalse(StudentCourse.objects.filter(
            student=self.student,
            course=self.course,
            teacher=self.teacher
        ).exists())
        
        # Verify the request was updated
        self.attendance_request.refresh_from_db()
        self.assertEqual(self.attendance_request.status, 'rejected')
        self.assertEqual(self.attendance_request.processed_by, self.management)
        self.assertIsNotNone(self.attendance_request.processed_at)
    
    def test_non_management_cannot_approve(self):
        """Test that non-management users cannot approve requests"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.approve_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify request was not changed
        self.attendance_request.refresh_from_db()
        self.assertEqual(self.attendance_request.status, 'pending')
    
    def test_non_management_cannot_reject(self):
        """Test that non-management users cannot reject requests"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.reject_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify request was not changed
        self.attendance_request.refresh_from_db()
        self.assertEqual(self.attendance_request.status, 'pending')
    
    def test_cannot_approve_already_processed_request(self):
        """Test that already processed requests cannot be approved again"""
        # First approve the request
        self.client.force_authenticate(user=self.management_user)
        self.client.post(self.approve_url)
        
        # Try to approve again
        response = self.client.post(self.approve_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already been approved', response.data['error'])
    
    def test_cannot_reject_already_processed_request(self):
        """Test that already processed requests cannot be rejected"""
        # First reject the request
        self.client.force_authenticate(user=self.management_user)
        self.client.post(self.reject_url)
        
        # Try to reject again
        response = self.client.post(self.reject_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already been rejected', response.data['error'])
    
    def test_unauthenticated_cannot_approve(self):
        """Test that unauthenticated users cannot approve requests"""
        response = self.client.post(self.approve_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_unauthenticated_cannot_reject(self):
        """Test that unauthenticated users cannot reject requests"""
        response = self.client.post(self.reject_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ============ Attendance Session Tests ============

class AttendanceSessionTestCase(APITestCase):
    """Test attendance session functionality"""
    
    def setUp(self):
        # Create authenticated user
        self.user = User.objects.create_user(
            username='teacher@test.com',
            email='teacher@test.com',
            password='TestPass123!'
        )
        self.teacher = Teacher.objects.create(
            user=self.user,
            teacher_name='Test Teacher',
            email='teacher@test.com',
            rfid='RFID001'
        )
        self.course = Course.objects.create(course_name='Test Course')
        
        self.client.force_authenticate(user=self.user)
        
        self.session_url = reverse('attendancesession-list')
    
    def test_create_attendance_session(self):
        """Test creating/starting an attendance session"""
        data = {
            'teacher': self.teacher.teacher_id,
            'course': self.course.course_id,
            'section': 'A',
            'year': 1
        }
        response = self.client.post(self.session_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['session']['status'], 'active')
        self.assertIn('qr_code_token', response.data['session'])
        self.assertIsNotNone(response.data['session']['qr_code_token'])
    
    def test_list_attendance_sessions(self):
        """Test listing attendance sessions"""
        AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1'
        )
        
        response = self.client.get(self.session_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_stop_attendance_session(self):
        """Test stopping an active attendance session"""
        session = AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1',
            status='active'
        )
        
        stop_url = reverse('attendancesession-stop', args=[session.id])
        response = self.client.post(stop_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['session']['status'], 'stopped')
        self.assertIsNotNone(response.data['session']['stopped_at'])
    
    def test_cannot_stop_already_stopped_session(self):
        """Test that already stopped sessions cannot be stopped again"""
        session = AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1',
            status='stopped'
        )
        
        stop_url = reverse('attendancesession-stop', args=[session.id])
        response = self.client.post(stop_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_qr_code(self):
        """Test getting QR code for an active session"""
        session = AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1',
            status='active'
        )
        
        qr_url = reverse('attendancesession-qr', args=[session.id])
        response = self.client.get(qr_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('qr_code', response.data)
        self.assertIn('qr_token', response.data)
        self.assertIn('data:image/png;base64,', response.data['qr_code'])
    
    def test_cannot_get_qr_for_stopped_session(self):
        """Test that QR code cannot be generated for stopped sessions"""
        session = AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1',
            status='stopped'
        )
        
        qr_url = reverse('attendancesession-qr', args=[session.id])
        response = self.client.get(qr_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_filter_sessions_by_teacher(self):
        """Test filtering sessions by teacher"""
        other_teacher = Teacher.objects.create(
            teacher_name='Other Teacher',
            email='other@test.com',
            rfid='RFID002'
        )
        
        AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1'
        )
        
        AttendanceSession.objects.create(
            teacher=other_teacher,
            course=self.course,
            section='B',
            year=2,
            qr_code_token='test_token_2'
        )
        
        response = self.client.get(self.session_url, {'teacher': self.teacher.teacher_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['teacher'], self.teacher.teacher_id)


class RFIDScanTestCase(APITestCase):
    """Test RFID scanning functionality"""
    
    def setUp(self):
        self.teacher = Teacher.objects.create(
            teacher_name='Test Teacher',
            email='teacher@test.com',
            rfid='RFID001'
        )
        self.course = Course.objects.create(course_name='Test Course')
        self.student = Student.objects.create(
            student_name='Test Student',
            email='student@test.com',
            rfid='RFID_STUDENT_1',
            year=1,
            dept='CS',
            section='A'
        )
        self.session = AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1',
            status='active'
        )
        
        self.rfid_scan_url = reverse('rfid-scan')
    
    def test_rfid_scan_success(self):
        """Test successful RFID scan"""
        data = {
            'rfid': 'RFID_STUDENT_1',
            'session_id': self.session.id
        }
        response = self.client.post(self.rfid_scan_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['rfid_scanned'])
        self.assertFalse(response.data['qr_scanned'])
        self.assertFalse(response.data['is_present'])
        self.assertTrue(response.data['needs_qr'])
        
        # Verify record was created
        record = AttendanceRecord.objects.get(session=self.session, student=self.student)
        self.assertTrue(record.rfid_scanned)
        self.assertFalse(record.qr_scanned)
        self.assertFalse(record.is_present)
    
    def test_rfid_scan_invalid_student(self):
        """Test RFID scan with invalid student RFID"""
        data = {
            'rfid': 'INVALID_RFID',
            'session_id': self.session.id
        }
        response = self.client.post(self.rfid_scan_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_rfid_scan_inactive_session(self):
        """Test RFID scan on inactive session"""
        self.session.status = 'stopped'
        self.session.save()
        
        data = {
            'rfid': 'RFID_STUDENT_1',
            'session_id': self.session.id
        }
        response = self.client.post(self.rfid_scan_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_rfid_scan_wrong_section(self):
        """Test RFID scan with student from different section"""
        self.student.section = 'B'
        self.student.save()
        
        data = {
            'rfid': 'RFID_STUDENT_1',
            'session_id': self.session.id
        }
        response = self.client.post(self.rfid_scan_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class QRScanTestCase(APITestCase):
    """Test QR code scanning functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='student@test.com',
            email='student@test.com',
            password='TestPass123!'
        )
        self.teacher = Teacher.objects.create(
            teacher_name='Test Teacher',
            email='teacher@test.com',
            rfid='RFID001'
        )
        self.course = Course.objects.create(course_name='Test Course')
        self.student = Student.objects.create(
            user=self.user,
            student_name='Test Student',
            email='student@test.com',
            rfid='RFID_STUDENT_1',
            year=1,
            dept='CS',
            section='A'
        )
        self.session = AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1',
            status='active'
        )
        
        self.client.force_authenticate(user=self.user)
        self.qr_scan_url = reverse('qr-scan')
    
    def test_qr_scan_success(self):
        """Test successful QR scan"""
        data = {
            'qr_token': 'test_token_1',
            'student_id': self.student.student_id
        }
        response = self.client.post(self.qr_scan_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['rfid_scanned'])
        self.assertTrue(response.data['qr_scanned'])
        self.assertFalse(response.data['is_present'])
        self.assertTrue(response.data['needs_rfid'])
        
        # Verify record was created
        record = AttendanceRecord.objects.get(session=self.session, student=self.student)
        self.assertFalse(record.rfid_scanned)
        self.assertTrue(record.qr_scanned)
        self.assertFalse(record.is_present)
    
    def test_qr_scan_invalid_token(self):
        """Test QR scan with invalid token"""
        data = {
            'qr_token': 'invalid_token',
            'student_id': self.student.student_id
        }
        response = self.client.post(self.qr_scan_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_qr_scan_inactive_session(self):
        """Test QR scan on inactive session"""
        self.session.status = 'stopped'
        self.session.save()
        
        data = {
            'qr_token': 'test_token_1',
            'student_id': self.student.student_id
        }
        response = self.client.post(self.qr_scan_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TwoFactorAttendanceTestCase(APITestCase):
    """Test 2FA attendance (RFID + QR)"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='student@test.com',
            email='student@test.com',
            password='TestPass123!'
        )
        self.teacher = Teacher.objects.create(
            teacher_name='Test Teacher',
            email='teacher@test.com',
            rfid='RFID001'
        )
        self.course = Course.objects.create(course_name='Test Course')
        self.student = Student.objects.create(
            user=self.user,
            student_name='Test Student',
            email='student@test.com',
            rfid='RFID_STUDENT_1',
            year=1,
            dept='CS',
            section='A'
        )
        self.session = AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1',
            status='active'
        )
        
        self.client.force_authenticate(user=self.user)
        self.rfid_scan_url = reverse('rfid-scan')
        self.qr_scan_url = reverse('qr-scan')
    
    def test_both_scans_marks_present(self):
        """Test that both RFID and QR scans mark student as present"""
        # First scan RFID
        rfid_data = {
            'rfid': 'RFID_STUDENT_1',
            'session_id': self.session.id
        }
        rfid_response = self.client.post(self.rfid_scan_url, rfid_data, format='json')
        self.assertEqual(rfid_response.status_code, status.HTTP_200_OK)
        self.assertFalse(rfid_response.data['is_present'])
        
        # Then scan QR
        qr_data = {
            'qr_token': 'test_token_1',
            'student_id': self.student.student_id
        }
        qr_response = self.client.post(self.qr_scan_url, qr_data, format='json')
        self.assertEqual(qr_response.status_code, status.HTTP_200_OK)
        self.assertTrue(qr_response.data['is_present'])
        
        # Verify record shows present
        record = AttendanceRecord.objects.get(session=self.session, student=self.student)
        self.assertTrue(record.rfid_scanned)
        self.assertTrue(record.qr_scanned)
        self.assertTrue(record.is_present)
        self.assertIsNotNone(record.marked_present_at)
        
        # Verify StudentCourse was updated
        student_course = StudentCourse.objects.get(
            student=self.student,
            course=self.course,
            teacher=self.teacher
        )
        self.assertIsNotNone(student_course.classes_attended)
        self.assertIn(self.session.started_at.strftime('%Y-%m-%d'), student_course.classes_attended)
    
    def test_qr_then_rfid_marks_present(self):
        """Test that scanning QR first then RFID also marks present"""
        # First scan QR
        qr_data = {
            'qr_token': 'test_token_1',
            'student_id': self.student.student_id
        }
        qr_response = self.client.post(self.qr_scan_url, qr_data, format='json')
        self.assertEqual(qr_response.status_code, status.HTTP_200_OK)
        self.assertFalse(qr_response.data['is_present'])
        
        # Then scan RFID
        rfid_data = {
            'rfid': 'RFID_STUDENT_1',
            'session_id': self.session.id
        }
        rfid_response = self.client.post(self.rfid_scan_url, rfid_data, format='json')
        self.assertEqual(rfid_response.status_code, status.HTTP_200_OK)
        self.assertTrue(rfid_response.data['is_present'])
        
        # Verify record shows present
        record = AttendanceRecord.objects.get(session=self.session, student=self.student)
        self.assertTrue(record.is_present)
    
    def test_only_rfid_does_not_mark_present(self):
        """Test that only RFID scan does not mark student as present"""
        rfid_data = {
            'rfid': 'RFID_STUDENT_1',
            'session_id': self.session.id
        }
        response = self.client.post(self.rfid_scan_url, rfid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_present'])
        
        # Verify no StudentCourse was created
        self.assertFalse(StudentCourse.objects.filter(
            student=self.student,
            course=self.course,
            teacher=self.teacher
        ).exists())
    
    def test_only_qr_does_not_mark_present(self):
        """Test that only QR scan does not mark student as present"""
        qr_data = {
            'qr_token': 'test_token_1',
            'student_id': self.student.student_id
        }
        response = self.client.post(self.qr_scan_url, qr_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_present'])
        
        # Verify no StudentCourse was created
        self.assertFalse(StudentCourse.objects.filter(
            student=self.student,
            course=self.course,
            teacher=self.teacher
        ).exists())
    
    def test_neither_scan_no_attendance(self):
        """Test that no scans means no attendance record"""
        # Verify no record exists
        self.assertFalse(AttendanceRecord.objects.filter(
            session=self.session,
            student=self.student
        ).exists())


class AttendanceSessionStatisticsTestCase(APITestCase):
    """Test attendance statistics endpoint"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='teacher@test.com',
            email='teacher@test.com',
            password='TestPass123!'
        )
        self.teacher = Teacher.objects.create(
            user=self.user,
            teacher_name='Test Teacher',
            email='teacher@test.com',
            rfid='RFID001'
        )
        self.course = Course.objects.create(course_name='Test Course')
        self.session = AttendanceSession.objects.create(
            teacher=self.teacher,
            course=self.course,
            section='A',
            year=1,
            qr_code_token='test_token_1',
            status='active'
        )
        
        # Create students
        self.student1 = Student.objects.create(
            student_name='Student 1',
            email='student1@test.com',
            rfid='RFID_1',
            year=1, dept='CS', section='A'
        )
        self.student2 = Student.objects.create(
            student_name='Student 2',
            email='student2@test.com',
            rfid='RFID_2',
            year=1, dept='CS', section='A'
        )
        self.student3 = Student.objects.create(
            student_name='Student 3',
            email='student3@test.com',
            rfid='RFID_3',
            year=1, dept='CS', section='A'
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_attendance_statistics(self):
        """Test getting attendance statistics for a session"""
        # Create different attendance scenarios
        # Student 1: Both RFID and QR (present)
        AttendanceRecord.objects.create(
            session=self.session,
            student=self.student1,
            rfid_scanned=True,
            qr_scanned=True,
            is_present=True
        )
        
        # Student 2: Only RFID (not present)
        AttendanceRecord.objects.create(
            session=self.session,
            student=self.student2,
            rfid_scanned=True,
            qr_scanned=False,
            is_present=False
        )
        
        # Student 3: Only QR (not present)
        AttendanceRecord.objects.create(
            session=self.session,
            student=self.student3,
            rfid_scanned=False,
            qr_scanned=True,
            is_present=False
        )
        
        attendance_url = reverse('attendancesession-attendance', args=[self.session.id])
        response = self.client.get(attendance_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['statistics']['total_students'], 3)
        self.assertEqual(response.data['statistics']['present'], 1)
        self.assertEqual(response.data['statistics']['absent'], 2)
        self.assertEqual(response.data['statistics']['rfid_only'], 1)
        self.assertEqual(response.data['statistics']['qr_only'], 1)


