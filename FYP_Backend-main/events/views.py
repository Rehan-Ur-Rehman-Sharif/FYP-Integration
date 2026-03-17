from django.contrib.auth import authenticate, login, logout
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils import timezone

from .models import Event, Registration, Attendance, EventParticipant
from .serializers import (
    EventSerializer,
    RegistrationSerializer,
    AttendanceSerializer,
    EventParticipantRegistrationSerializer,
    EventParticipantLoginSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(obj, 'organiser', None) == request.user


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(organiser=self.request.user)

    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        event = self.get_object()
        reg, created = Registration.objects.get_or_create(user=request.user, event=event)
        serializer = RegistrationSerializer(reg)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class EventParticipantRegistrationView(APIView):
    """API endpoint for creating event participant user accounts."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EventParticipantRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            participant = serializer.save()
            return Response({
                'message': 'Participant registered successfully',
                'username': participant.user.username,
                'display_name': participant.display_name,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventParticipantLoginView(APIView):
    """API endpoint for participant login."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EventParticipantLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            login_as = serializer.validated_data.get('login_as', '').lower()

            if login_as and login_as != 'event_participant':
                return Response({'error': 'Invalid login_as value'}, status=status.HTTP_400_BAD_REQUEST)

            user = authenticate(username=username, password=password)
            if user is None:
                return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

            try:
                participant = user.event_participant
            except EventParticipant.DoesNotExist:
                return Response({'error': 'Event participant profile not found for this user'}, status=status.HTTP_404_NOT_FOUND)

            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': 'event_participant',
                'username': user.username,
                'display_name': participant.display_name,
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventParticipantLogoutView(APIView):
    """API endpoint to log out an event participant (session based)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related('event', 'user').all()
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # users see their registrations; organisers can see registrations for their events
        user = self.request.user
        return Registration.objects.filter(models.Q(user=user) | models.Q(event__organiser=user))

    @action(detail=True, methods=['post'])
    def mark_attendance(self, request, pk=None):
        reg = self.get_object()
        # only organiser of the event or the user themself can mark attendance
        if request.user != reg.user and request.user != reg.event.organiser:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        reg.attended = True
        reg.save()
        att, _ = Attendance.objects.get_or_create(registration=reg, defaults={'present': True})
        serializer = AttendanceSerializer(att)
        return Response(serializer.data)


class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Attendance.objects.select_related('registration__user', 'registration__event').all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Attendance.objects.filter(models.Q(registration__user=user) | models.Q(registration__event__organiser=user))


class ParticipantDashboardView(APIView):
    """Participant dashboard: list upcoming events with registration/attendance status."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        today = now.date()

        # Upcoming events: event_date or start_time in the future.
        upcoming_events = Event.objects.filter(
            models.Q(event_date__gte=today) | models.Q(start_time__gte=now)
        ).order_by('event_date', 'start_time')

        serializer = EventSerializer(upcoming_events, many=True, context={'request': request})
        return Response(serializer.data)
