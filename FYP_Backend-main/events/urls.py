from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    EventViewSet,
    RegistrationViewSet,
    AttendanceViewSet,
    EventParticipantRegistrationView,
    EventParticipantLoginView,
    EventParticipantLogoutView,
    ParticipantDashboardView,
    EventRegisterByLinkView,
)

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'registrations', RegistrationViewSet, basename='registration')
router.register(r'attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    # CRUD endpoints (viewsets)
    path('', include(router.urls)),

    # DRF browsable API login/logout
    path('api-auth/', include('rest_framework.urls')),

    # Event participant auth endpoints
    path('participants/register/', EventParticipantRegistrationView.as_view(), name='event-participant-register'),
    path('participants/login/', EventParticipantLoginView.as_view(), name='event-participant-login'),
    path('participants/logout/', EventParticipantLogoutView.as_view(), name='event-participant-logout'),
    path('participants/dashboard/', ParticipantDashboardView.as_view(), name='event-participant-dashboard'),
    path('register-by-link/<str:token>/', EventRegisterByLinkView.as_view(), name='event-register-by-link'),
]
