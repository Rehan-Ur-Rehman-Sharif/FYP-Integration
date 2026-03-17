from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import Event, Registration, Attendance, EventParticipant


class EventSerializer(serializers.ModelSerializer):
    organiser = serializers.ReadOnlyField(source='organiser.username')
    participants_count = serializers.SerializerMethodField(read_only=True)
    attendance_count = serializers.SerializerMethodField(read_only=True)

    # Participant-specific fields (evaluated based on authenticated user)
    is_registered = serializers.SerializerMethodField(read_only=True)
    attended = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Event
        fields = '__all__'

    def get_participants_count(self, obj):
        return obj.registrations.count()

    def get_attendance_count(self, obj):
        return obj.registrations.filter(attended=True).count()

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.registrations.filter(user=request.user).exists()

    def get_attended(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.registrations.filter(user=request.user, attended=True).exists()


class EventParticipantRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    display_name = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
        )
        return EventParticipant.objects.create(
            user=user,
            display_name=validated_data.get('display_name', ''),
        )


class EventParticipantLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    login_as = serializers.CharField(required=False, default='event_participant')


class RegistrationSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Registration
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'
