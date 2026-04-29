from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Student, Dorm, DormImage, Rating, Landlord, Location, BookingRequest, Message, Notification, SavedDorm, StudentRating, SiteRating, LandlordRating, ContactMessage
from .serializers import StudentSerializer, DormSerializer, DormImageSerializer, RatingSerializer, LandlordSerializer, RegisterSerializer, LocationSerializer, BookingRequestSerializer, MessageSerializer, NotificationSerializer, SavedDormSerializer, StudentRatingSerializer, SiteRatingSerializer, LandlordRatingSerializer, ContactMessageSerializer
from django.db.models import Avg
from rest_framework_simplejwt.tokens import RefreshToken
from .ai_recommender import recommender_instance
import re

def normalize_arabic(text):
    if not text: return ""
    text = text.replace('ة', 'ه').replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي')
    return text.lower()

class RegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user_type = serializer.validated_data['user_type']
            name = request.data.get('name', '')
            email = request.data.get('email', '')
            phone = request.data.get('phone_number', '')
            id_card_image = request.FILES.get('id_card_image')
            gender = request.data.get('gender', 'male')

            user = None
            if user_type == 'student':
                student = Student.objects.create(username=username, password=password, name=name, email=email, phone_number=phone, gender=gender, preferred_room_type="Any", id_card_image=id_card_image)
                user = student.user
            elif user_type == 'landlord':
                landlord = Landlord.objects.create(username=username, password=password, name=name, email=email, phone_number=phone, gender=gender, id_card_image=id_card_image)
                user = landlord.user

            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    "message": "User created successfully",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user_type": user_type
                }, status=status.HTTP_201_CREATED)

            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_staff or request.user.is_superuser:
            return Response({
                "type": "admin",
                "username": request.user.username,
                "user_id": request.user.id,
                "is_admin": True,
                "account_status": "approved"
            })

        if hasattr(request.user, 'student') and request.user.student:
            serializer = StudentSerializer(request.user.student)
            data = serializer.data
            data['type'] = 'student'
            data['user_id'] = request.user.id
            data['is_admin'] = False
            data['account_status'] = request.user.student.account_status
            return Response(data)
        elif hasattr(request.user, 'landlord') and request.user.landlord:
            serializer = LandlordSerializer(request.user.landlord)
            data = serializer.data
            data['type'] = 'landlord'
            data['user_id'] = request.user.id
            data['is_admin'] = False
            data['account_status'] = request.user.landlord.account_status
            return Response(data)
        return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

class SiteStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        total_students = Student.objects.count()
        total_properties = Dorm.objects.filter(approval_status='approved').count()
        avg_rating = SiteRating.objects.aggregate(Avg('rating'))['rating__avg'] or 4.9
        satisfaction_rate = round((avg_rating / 5) * 100) if avg_rating else 99
        areas_covered = Location.objects.count()

        return Response({
            "total_students": total_students,
            "total_properties": total_properties,
            "satisfaction_rate": f"{satisfaction_rate}%",
            "areas_covered": areas_covered
        })

class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'student') or not request.user.student:
            return Response({"error": "Only students can get recommendations."}, status=status.HTTP_403_FORBIDDEN)
            
        student_id = request.user.student.student_id
        search_query = request.query_params.get('search', '').lower()
        
        try:
            k = int(request.query_params.get('k', 30)) # Increase candidate pool for better search matching
        except ValueError:
            k = 30
            
        recommended_dorm_ids = recommender_instance.recommend_hybrid(student_id, k=k)
        
        if not recommended_dorm_ids:
            return Response([])
            
        # Maintain the order returned by the AI and filter by search
        dorms = []
        norm_query = normalize_arabic(search_query)
        
        for d_id in recommended_dorm_ids:
            try:
                dorm = Dorm.objects.get(dorm_id=d_id)
                if search_query:
                    # Normalize both search and content for comparison
                    content = normalize_arabic(f"{dorm.name} {dorm.address or ''} {dorm.location_details.name if dorm.location_details else ''} {dorm.description or ''}")
                    if norm_query in content:
                        dorms.append(dorm)
                else:
                    dorms.append(dorm)
            except Dorm.DoesNotExist:
                continue
                
        serializer = DormSerializer(dorms, many=True, context={'request': request})
        return Response(serializer.data)

class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        students = Student.objects.all()
        landlords = Landlord.objects.all()

        users_list = []
        for s in students:
            users_list.append({
                "id": s.student_id,
                "user_type": "student",
                "name": s.name,
                "email": getattr(s.user, 'email', '') if s.user else '',
                "role": "Student",
                "status": s.account_status,
                "id_card_image": request.build_absolute_uri(s.id_card_image.url) if s.id_card_image else None
            })
        for l in landlords:
            users_list.append({
                "id": str(l.landlord_id),
                "user_type": "landlord",
                "name": l.name,
                "email": l.email or (l.user.email if l.user else ''),
                "role": "Landlord",
                "status": l.account_status,
                "id_card_image": request.build_absolute_uri(l.id_card_image.url) if l.id_card_image else None
            })
        
        return Response(users_list)

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        user_type = request.data.get('user_type')
        user_id = request.data.get('id')
        new_status = request.data.get('status')

        if new_status not in ['pending', 'approved', 'banned']:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        if user_type == 'student':
            try:
                student = Student.objects.get(student_id=user_id)
                student.account_status = new_status
                student.save()
            except Student.DoesNotExist:
                return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        elif user_type == 'landlord':
            try:
                landlord = Landlord.objects.get(landlord_id=user_id)
                landlord.account_status = new_status
                landlord.save()
            except Landlord.DoesNotExist:
                return Response({"error": "Landlord not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Invalid user type"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Status updated successfully"})

class AdminDormVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # In a real app, you might want only 'pending' ones, but let's allow all for admin overview
        dorms = Dorm.objects.all().order_by('-dorm_id')
        
        from .serializers import DormSerializer
        serializer = DormSerializer(dorms, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        dorm_id = request.data.get('dorm_id')
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')

        if new_status not in ['pending', 'approved', 'rejected']:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dorm = Dorm.objects.get(dorm_id=dorm_id)
            dorm.approval_status = new_status
            if new_status == 'rejected':
                dorm.rejection_reason = reason
            dorm.save()
            return Response({"message": "Dorm status updated successfully"})
        except Dorm.DoesNotExist:
            return Response({"error": "Dorm not found"}, status=status.HTTP_404_NOT_FOUND)

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [AllowAny]

class LandlordViewSet(viewsets.ModelViewSet):
    queryset = Landlord.objects.all()
    serializer_class = LandlordSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'preferred_room_type', 'needs_wifi', 'needs_ac']
    search_fields = ['student_id', 'name', 'phone_number']

class DormViewSet(viewsets.ModelViewSet):
    queryset = Dorm.objects.all()
    serializer_class = DormSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['room_type', 'has_wifi', 'has_kitchen', 'has_ac', 'location', 'landlord']
    search_fields = ['name', 'dorm_id', 'address', 'description']
    ordering_fields = ['price_egp', 'distance_km']

    def get_queryset(self):
        user = self.request.user
        queryset = Dorm.objects.all()
        
        # If user is admin, they can see all dorms
        if user.is_authenticated and (user.is_staff or user.is_superuser):
            pass
        # If user is a landlord, they can see their own dorms + all approved dorms
        elif user.is_authenticated and hasattr(user, 'landlord') and user.landlord:
            queryset = queryset.filter(Q(approval_status='approved') | Q(landlord=user.landlord))
        else:
            # Public users and students only see approved dorms
            queryset = queryset.filter(approval_status='approved')
            
        search_query = self.request.query_params.get('search', None)
        if search_query:
            # Create variations for Arabic characters
            q = search_query.strip()
            # Normalize Alif, Tah Marbuta, Ha, and Ya
            q_alt = q.replace('ة', 'ه').replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي')
            q_alt2 = q.replace('ه', 'ة').replace('ا', 'أ').replace('ي', 'ى')
            
            queryset = queryset.filter(
                Q(name__icontains=q) | Q(name__icontains=q_alt) | Q(name__icontains=q_alt2) |
                Q(address__icontains=q) | Q(address__icontains=q_alt) | Q(address__icontains=q_alt2) |
                Q(description__icontains=q) | Q(description__icontains=q_alt) | Q(description__icontains=q_alt2) |
                Q(location_details__name__icontains=q) | Q(location_details__name__icontains=q_alt) | Q(location_details__name__icontains=q_alt2)
            ).distinct()
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        # Check if user is approved
        if hasattr(user, 'landlord') and user.landlord:
            if user.landlord.account_status != 'approved':
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Your account is pending approval. You cannot list properties yet.")
            dorm = serializer.save(landlord=user.landlord, approval_status='pending')
        else:
            dorm = serializer.save(approval_status='pending')
            
        # Notify admins
        admins = User.objects.filter(is_staff=True)
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                message=f"New property '{dorm.name}' is waiting for verification.",
                notification_type='dorm_verification',
                related_id=dorm.dorm_id
            )

    def perform_update(self, serializer):
        # If a landlord updates their dorm, reset to pending
        if hasattr(self.request.user, 'landlord') and self.request.user.landlord:
            dorm = self.get_object()
            serializer.save(approval_status='pending', rejection_reason=None)
            
            # Notify admins again
            admins = User.objects.filter(is_staff=True)
            for admin in admins:
                Notification.objects.create(
                    recipient=admin,
                    message=f"Property '{dorm.name}' was updated by the landlord and needs re-verification.",
                    notification_type='dorm_verification',
                    related_id=dorm.dorm_id
                )
            return
        serializer.save()

class DormImageViewSet(viewsets.ModelViewSet):
    queryset = DormImage.objects.all()
    serializer_class = DormImageSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    def perform_create(self, serializer):
        dorm_id = self.request.data.get('dorm')
        dorm = Dorm.objects.get(dorm_id=dorm_id)
        serializer.save(dorm=dorm)

class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'dorm']
    ordering_fields = ['final_rating', 'dorm_rating', 'landlord_rating']

    def perform_create(self, serializer):
        student = getattr(self.request.user, 'student', None)
        if not student:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only students can rate dorms.")
            
        dorm = serializer.validated_data.get('dorm')
        
        # Verify approved booking exists
        if not BookingRequest.objects.filter(student=student, dorm=dorm, status='approved').exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only rate dorms you have successfully booked.")
            
        serializer.save(student=student)

class BookingRequestViewSet(viewsets.ModelViewSet):
    queryset = BookingRequest.objects.all()
    serializer_class = BookingRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'student') and user.student:
            return BookingRequest.objects.filter(student=user.student)
        elif hasattr(user, 'landlord') and user.landlord:
            return BookingRequest.objects.filter(dorm__landlord=user.landlord)
        return BookingRequest.objects.none()

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'student') or not self.request.user.student:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Only students can create booking requests.")

        student = self.request.user.student
        
        # Check if student is approved
        if student.account_status != 'approved':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Your account is pending approval. You cannot make bookings yet.")
        
        # Check capacity before allowing booking
        dorm = serializer.validated_data.get('dorm')

        # Check if student already has a booking for this dorm
        if BookingRequest.objects.filter(student=student, dorm=dorm).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You have already sent a booking request for this property.")

        if dorm and dorm.capacity - dorm.current_occupants <= 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("This property is already fully booked.")
            
        # Check gender compatibility
        if dorm and dorm.gender_preference != 'mixed':
            if student.gender != dorm.gender_preference:
                from rest_framework.exceptions import ValidationError
                gender_label = "males" if dorm.gender_preference == 'male' else "females"
                raise ValidationError(f"This property is for {gender_label} only.")

        booking = serializer.save(student=student)
            
        # Send notification to landlord
        if booking.dorm.landlord and booking.dorm.landlord.user:
            student_name = student.name if student else "A student"
            Notification.objects.create(
                recipient=booking.dorm.landlord.user,
                message=f"New booking request for '{booking.dorm.name}' from {student_name}.",
                notification_type='booking_request',
                related_id=booking.id
            )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        new_status = serializer.validated_data.get('status', old_status)
        
        # Security check: Only landlord or staff can change status
        if old_status != new_status:
            user = self.request.user
            is_landlord = hasattr(user, 'landlord') and instance.dorm.landlord == user.landlord
            if not (is_landlord or user.is_staff):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have permission to change the status of this booking.")

        if old_status != 'approved' and new_status == 'approved':
            dorm = instance.dorm
            if dorm.capacity - dorm.current_occupants <= 0:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Cannot approve booking: Property is at full capacity.")
            
            dorm.current_occupants += 1
            dorm.save()
        elif old_status == 'approved' and new_status != 'approved':
            dorm = instance.dorm
            if dorm.current_occupants > 0:
                dorm.current_occupants -= 1
                dorm.save()
        
        booking = serializer.save()

        # Send notification to student
        if old_status != new_status and booking.student and booking.student.user:
            Notification.objects.create(
                recipient=booking.student.user,
                message=f"Your booking request for '{booking.dorm.name}' has been {new_status}.",
                notification_type='booking_update',
                related_id=booking.id
            )

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        if user.is_staff:
            # Admins see their own messages AND all messages linked to contact inquiries
            return Message.objects.filter(
                Q(sender=user) | 
                Q(receiver=user) | 
                Q(contact_message__isnull=False) |
                Q(booking_request__isnull=False)
            ).distinct().order_by('timestamp')
        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).distinct().order_by('timestamp')

    def perform_create(self, serializer):
        user = self.request.user
        
        # Handle account approval checks
        if user.is_authenticated:
            if hasattr(user, 'student') and user.student and user.student.account_status != 'approved':
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Your account is pending approval. You cannot send messages yet.")
            if hasattr(user, 'landlord') and user.landlord and user.landlord.account_status != 'approved':
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Your account is pending approval. You cannot send messages yet.")

        # Pass data to serializer save
        save_kwargs = {}
        
        # Pass raw receiver from request data so the serializer can handle it
        save_kwargs['receiver'] = self.request.data.get('receiver')
        
        # Pass other optional fields
        if 'booking_request' in self.request.data:
            save_kwargs['booking_request_id'] = self.request.data.get('booking_request')
        if 'contact_message' in self.request.data:
            save_kwargs['contact_message_id'] = self.request.data.get('contact_message')
            
        is_closing = self.request.data.get('is_chat_closed') == 'true' or self.request.data.get('is_chat_closed') is True
        save_kwargs['sender'] = user
        if is_closing:
            save_kwargs['is_chat_closed'] = True

        message = serializer.save(**save_kwargs)
        
        # PERSISTENT LOCKING: Update the related object status
        if is_closing:
            if message.booking_request:
                message.booking_request.is_chat_closed = True
                message.booking_request.save()
            if message.contact_message:
                message.contact_message.is_resolved = True
                message.contact_message.save()

        # Create notification for the receiver
        if message.receiver:
            sender_name = "Guest"
            if message.sender:
                sender_name = message.sender.username
                if hasattr(message.sender, 'student'): sender_name = message.sender.student.name
                elif hasattr(message.sender, 'landlord'): sender_name = message.sender.landlord.name

            Notification.objects.create(
                recipient=message.receiver,
                message=f"New message from {sender_name}: {message.content[:50]}...",
                notification_type='message',
                related_id=str(message.sender.id) if message.sender else f"contact_{contact_id}"
            )

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        sender_id = request.data.get('sender_id')
        contact_id = request.data.get('contact_message_id')
        
        if not sender_id and not contact_id:
            return Response({"error": "sender_id or contact_message_id is required"}, status=400)
        
        if contact_id:
            # Mark all messages in this inquiry as read for current user
            Message.objects.filter(contact_message_id=contact_id, receiver=request.user, is_read=False).update(is_read=True)
            Notification.objects.filter(recipient=request.user, notification_type='message', related_id=f"contact_{contact_id}").update(is_read=True)
        else:
            # Mark messages from specific sender as read
            Message.objects.filter(sender_id=sender_id, receiver=request.user, is_read=False).update(is_read=True)
            Notification.objects.filter(recipient=request.user, notification_type='message', related_id=str(sender_id)).update(is_read=True)
            
        return Response({"status": "success"})

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        count = notifications.update(is_read=True)
        return Response({'status': 'success', 'marked_read': count})

    def perform_update(self, serializer):
        serializer.save()

class AdminDormVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        dorms = Dorm.objects.filter(approval_status='pending')
        serializer = DormSerializer(dorms, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        dorm_id = request.data.get('dorm_id')
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')

        if new_status not in ['approved', 'rejected']:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dorm = Dorm.objects.get(dorm_id=dorm_id)
            dorm.approval_status = new_status
            if new_status == 'rejected':
                dorm.rejection_reason = reason
            else:
                dorm.rejection_reason = None
            dorm.save()
            
            # Notify Landlord
            if dorm.landlord and dorm.landlord.user:
                if new_status == 'approved':
                    msg = f"Your property '{dorm.name}' has been approved and is now live."
                else:
                    msg = f"Your property '{dorm.name}' was rejected. Reason: {reason}"
                
                Notification.objects.create(
                    recipient=dorm.landlord.user,
                    message=msg,
                    notification_type='dorm_status_update',
                    related_id=dorm.dorm_id
                )

            return Response({"message": f"Dorm {new_status} successfully."})
        except Dorm.DoesNotExist:
            return Response({"error": "Dorm not found"}, status=status.HTTP_404_NOT_FOUND)

class SavedDormViewSet(viewsets.ModelViewSet):
    serializer_class = SavedDormSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'student') and user.student:
            return SavedDorm.objects.filter(student=user.student).order_by('-saved_at')
        return SavedDorm.objects.none()

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'student') and self.request.user.student:
            serializer.save(student=self.request.user.student)

class StudentRatingViewSet(viewsets.ModelViewSet):
    queryset = StudentRating.objects.all()
    serializer_class = StudentRatingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'landlord']
    ordering_fields = ['rating', 'created_at']

    def perform_create(self, serializer):
        landlord = getattr(self.request.user, 'landlord', None)
        if landlord:
            student = serializer.validated_data.get('student')
            if not BookingRequest.objects.filter(student=student, dorm__landlord=landlord, status='approved').exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only rate students who have successfully booked your property.")
            serializer.save(landlord=landlord)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only landlords can rate students.")

class SiteRatingViewSet(viewsets.ModelViewSet):
    queryset = SiteRating.objects.all().order_by('-created_at')
    serializer_class = SiteRatingSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LandlordRatingViewSet(viewsets.ModelViewSet):
    queryset = LandlordRating.objects.all().order_by('-created_at')
    serializer_class = LandlordRatingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['landlord', 'student']

    def perform_create(self, serializer):
        student = getattr(self.request.user, 'student', None)
        if student:
            landlord = serializer.validated_data.get('landlord')
            if not BookingRequest.objects.filter(student=student, dorm__landlord=landlord, status='approved').exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only rate landlords you have booked from.")
            serializer.save(student=student)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only students can rate landlords.")
class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        from rest_framework.permissions import IsAdminUser
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(user=user)
        
        # Notify Admins
        from django.contrib.auth.models import User
        from .models import Notification, Message
        admins = User.objects.filter(is_staff=True)
        
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                message=f"New contact message from {instance.name}: {instance.subject}",
                notification_type='contact',
                related_id=str(instance.id)
            )
            
        # Create a single chat message thread for this contact request
        # If user is not logged in, sender will be None (Guest)
        admin_receiver = admins.first()
        if admin_receiver:
            Message.objects.create(
                sender=user,
                receiver=admin_receiver,
                content=f"[Contact Request] {instance.subject}: {instance.message}\n\nFrom: {instance.name} ({instance.email})",
                contact_message=instance
            )
class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def export(self, request):
        report_type = request.query_params.get('type', 'financial')
        format = request.query_params.get('format', 'csv')
        
        import pandas as pd
        from django.http import HttpResponse
        from .models import BookingRequest, Dorm
        from django.contrib.auth.models import User

        data = []
        filename = f"{report_type}_report.{format}"

        if report_type == 'financial':
            queryset = BookingRequest.objects.all()
            for b in queryset:
                data.append({
                    'Booking ID': b.id,
                    'Student': b.student.name,
                    'Dorm': b.dorm.name,
                    'Price (EGP)': b.dorm.price_egp,
                    'Status': b.status,
                    'Date': b.created_at.strftime('%Y-%m-%d %H:%M')
                })
        
        elif report_type == 'users':
            queryset = User.objects.all()
            for u in queryset:
                role = 'Admin' if u.is_staff else 'User'
                if hasattr(u, 'student'): role = 'Student'
                elif hasattr(u, 'landlord'): role = 'Landlord'
                data.append({
                    'User ID': u.id,
                    'Username': u.username,
                    'Email': u.email,
                    'Role': role,
                    'Date Joined': u.date_joined.strftime('%Y-%m-%d')
                })
        
        elif report_type == 'occupancy':
            queryset = Dorm.objects.all()
            for d in queryset:
                data.append({
                    'Dorm ID': d.dorm_id,
                    'Name': d.name,
                    'Location': d.location.name if d.location else 'N/A',
                    'Capacity': d.capacity,
                    'Occupants': d.current_occupants,
                    'Spots Available': d.capacity - d.current_occupants
                })

        df = pd.DataFrame(data)
        
        if format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            df.to_csv(path_or_buf=response, index=False)
            return response
        
        # Fallback for Excel if needed (requires openpyxl)
        try:
            response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            df.to_excel(response, index=False)
            return response
        except Exception:
            return Response({"error": "Excel export failed. Please use CSV."}, status=400)
class UpdateStudentProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        if not hasattr(request.user, 'student'):
            return Response({"error": "Only students can update their preferences"}, status=status.HTTP_403_FORBIDDEN)
        
        student = request.user.student
        
        # Explicitly update preference fields to be safe
        for field, value in request.data.items():
            if hasattr(student, field):
                setattr(student, field, value)
        
        # Always set preferences_set to true if we are updating through this view
        student.preferences_set = True
        student.save()
        
        serializer = StudentSerializer(student)
        return Response(serializer.data)
