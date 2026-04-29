from django.contrib.auth.models import User
from django.db.models import Avg
from rest_framework import serializers
from .models import Student, Dorm, DormImage, Landlord, Rating, Location, BookingRequest, Message, Notification, SavedDorm, StudentRating, SiteRating, LandlordRating, ContactMessage
import re

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    user_type = serializers.ChoiceField(choices=['student', 'landlord'], write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'user_type')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("هذا المستخدم موجود بالفعل / This username is already taken")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'\d', value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class LandlordSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Landlord
        fields = '__all__'

    def get_avatar_url(self, obj):
        seed = f"{obj.landlord_id}_{obj.name}"
        if obj.gender == 'male':
            return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}_male&backgroundColor=b6e3f4&topType=shortHair,shaggy,shaggyMullet,frizzle"
        else:
            return f"https://api.dicebear.com/7.x/lorelei/svg?seed={seed}_female&backgroundColor=ffd5dc"

    def get_average_rating(self, obj):
        try:
            from .models import Rating
            avg = Rating.objects.filter(dorm__landlord=obj).aggregate(Avg('landlord_rating'))['landlord_rating__avg']
            return round(avg, 1) if avg else 0.0
        except Exception:
            return 0.0

    def get_total_reviews(self, obj):
        from .models import Rating
        return Rating.objects.filter(dorm__landlord=obj).count()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        # Determine if contact info should be visible
        is_visible = False
        if request and request.user.is_authenticated:
            # Check if user is the landlord themselves
            if hasattr(request.user, 'landlord') and request.user.landlord == instance:
                is_visible = True
            # Check if user is staff
            elif request.user.is_staff:
                is_visible = True
            # Check if there is an approved booking for ANY dorm of this landlord
            else:
                from .models import BookingRequest
                try:
                    student = request.user.student
                    if BookingRequest.objects.filter(student=student, dorm__landlord=instance, status='approved').exists():
                        is_visible = True
                except:
                    pass

        if not is_visible:
            ret['email'] = "Hidden"
            ret['phone_number'] = "Hidden"
        return ret

class StudentSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'

    def get_avatar_url(self, obj):
        seed = f"{obj.student_id}_{obj.name}"
        if obj.gender == 'male':
            return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}_male&backgroundColor=b6e3f4&topType=shortHair,shaggy,shaggyMullet,frizzle"
        else:
            return f"https://api.dicebear.com/7.x/lorelei/svg?seed={seed}_female&backgroundColor=ffd5dc"

    def get_average_rating(self, obj):
        try:
            from .models import StudentRating
            avg = StudentRating.objects.filter(student=obj).aggregate(Avg('rating'))['rating__avg']
            return round(avg, 1) if avg else 0.0
        except Exception:
            return 0.0

    def get_total_reviews(self, obj):
        from .models import StudentRating
        return StudentRating.objects.filter(student=obj).count()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        # Determine if contact info should be visible
        is_visible = False
        if request and request.user.is_authenticated:
            # Check if user is the student themselves
            if hasattr(request.user, 'student') and request.user.student == instance:
                is_visible = True
            # Check if user is staff
            elif request.user.is_staff:
                is_visible = True
            # Check if user is a landlord who has an approved booking with this student
            else:
                from .models import BookingRequest
                try:
                    landlord = request.user.landlord
                    if BookingRequest.objects.filter(student=instance, dorm__landlord=landlord, status='approved').exists():
                        is_visible = True
                except:
                    pass

        if not is_visible:
            ret['email'] = "Hidden"
            ret['phone_number'] = "Hidden"
        return ret

class DormImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DormImage
        fields = ['id', 'dorm', 'image', 'uploaded_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.image:
            img_url = instance.image.url
            # If it's already a full external URL, don't prefix or build absolute URI with local host
            if img_url.startswith('http'):
                ret['image'] = img_url
            else:
                request = self.context.get('request')
                if request:
                    ret['image'] = request.build_absolute_uri(img_url)
                else:
                    ret['image'] = img_url
        return ret


class DormSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    location_details = LocationSerializer(source='location', read_only=True)
    landlord_details = LandlordSerializer(source='landlord', read_only=True)
    has_approved_booking = serializers.SerializerMethodField()
    
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    
    class Meta:
        model = Dorm
        fields = '__all__'
        read_only_fields = ['approval_status', 'rejection_reason']

    def get_images(self, obj):
        # Sort images by uploaded_at descending to show latest first
        images = obj.images.all().order_by('-uploaded_at')
        return DormImageSerializer(images, many=True, context=self.context).data

    def get_average_rating(self, obj):
        try:
            from .models import Rating
            avg = Rating.objects.filter(dorm=obj).aggregate(Avg('dorm_rating'))['dorm_rating__avg']
            return round(avg, 1) if avg else 0.0
        except Exception:
            return 0.0

    def get_total_reviews(self, obj):
        from .models import Rating
        return Rating.objects.filter(dorm=obj).count()

    def get_has_approved_booking(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                student = request.user.student
                if student:
                    from .models import BookingRequest
                    return BookingRequest.objects.filter(student=student, dorm=obj, status='approved').exists()
            except Exception:
                pass

            try:
                landlord = request.user.landlord
                if landlord:
                    return obj.landlord == landlord
            except Exception:
                pass

            if request.user.is_staff or request.user.is_superuser:
                return True
        return False

class RatingSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    class Meta:
        model = Rating
        fields = '__all__'

class BookingRequestSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    dorm_details = DormSerializer(source='dorm', read_only=True)
    
    class Meta:
        model = BookingRequest
        fields = '__all__'
        read_only_fields = ['student', 'created_at', 'updated_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    sender_type = serializers.SerializerMethodField()
    receiver_type = serializers.SerializerMethodField()
    sender_profile_id = serializers.SerializerMethodField()
    receiver_profile_id = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    receiver_avatar = serializers.SerializerMethodField()
    is_chat_closed = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = [
            'timestamp', 'is_read', 'sender', 
            'sender_name', 'receiver_name', 'sender_type', 'receiver_type',
            'sender_profile_id', 'receiver_profile_id', 'sender_avatar', 'receiver_avatar'
        ]
        extra_kwargs = {
            'receiver': {'required': False, 'allow_null': True}
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Ensure sender and receiver are IDs (integers) in the output
        if instance.sender:
            ret['sender'] = instance.sender.id
        if instance.receiver:
            ret['receiver'] = instance.receiver.id
        return ret

    def get_sender_name(self, obj):
        if not obj.sender: return "Guest"
        if hasattr(obj.sender, 'student'): return obj.sender.student.name
        if hasattr(obj.sender, 'landlord'): return obj.sender.landlord.name
        return obj.sender.username

    def get_receiver_name(self, obj):
        if not obj.receiver: return "User"
        if hasattr(obj.receiver, 'student'): return obj.receiver.student.name
        if hasattr(obj.receiver, 'landlord'): return obj.receiver.landlord.name
        return obj.receiver.username

    def get_sender_type(self, obj):
        if not obj.sender: return 'guest'
        if hasattr(obj.sender, 'student'): return 'student'
        if hasattr(obj.sender, 'landlord'): return 'landlord'
        return 'admin'

    def get_receiver_type(self, obj):
        if not obj.receiver: return 'admin'
        if hasattr(obj.receiver, 'student'): return 'student'
        if hasattr(obj.receiver, 'landlord'): return 'landlord'
        return 'admin'

    def get_sender_profile_id(self, obj):
        if not obj.sender: return None
        if hasattr(obj.sender, 'student'): return obj.sender.student.student_id
        if hasattr(obj.sender, 'landlord'): return obj.sender.landlord.landlord_id
        return None

    def get_receiver_profile_id(self, obj):
        if not obj.receiver: return None
        if hasattr(obj.receiver, 'student'): return obj.receiver.student.student_id
        if hasattr(obj.receiver, 'landlord'): return obj.receiver.landlord.landlord_id
        return None

    def get_sender_avatar(self, obj):
        if not obj.sender:
            return f"https://api.dicebear.com/7.x/bottts/svg?seed=guest_{obj.id}&backgroundColor=b6e3f4"
        
        user = obj.sender
        if hasattr(user, 'student'):
            student = user.student
            seed = f"{student.student_id}_{student.name}"
            style = "micah" if student.gender == 'male' else "adventurer"
        elif hasattr(user, 'landlord'):
            landlord = user.landlord
            seed = f"{landlord.landlord_id}_{landlord.name}"
            style = "micah" if landlord.gender == 'male' else "adventurer"
        else:
            seed = f"admin_{user.id}"
            return f"https://api.dicebear.com/7.x/bottts/svg?seed={seed}&backgroundColor=b6e3f4"
            
        return f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}&flip=true&backgroundColor=b6e3f4,c0aede,d1d4f9"

    def get_receiver_avatar(self, obj):
        if not obj.receiver:
            return f"https://api.dicebear.com/7.x/bottts/svg?seed=admin_{obj.id}&backgroundColor=b6e3f4"
            
        user = obj.receiver
        if hasattr(user, 'student'):
            student = user.student
            seed = f"{student.student_id}_{student.name}"
            style = "micah" if student.gender == 'male' else "adventurer"
        elif hasattr(user, 'landlord'):
            landlord = user.landlord
            seed = f"{landlord.landlord_id}_{landlord.name}"
            style = "micah" if landlord.gender == 'male' else "adventurer"
        else:
            seed = f"admin_{user.id}"
            return f"https://api.dicebear.com/7.x/bottts/svg?seed={seed}&backgroundColor=b6e3f4"
            
        return f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}&flip=true&backgroundColor=b6e3f4,c0aede,d1d4f9"

    def create(self, validated_data):
        receiver_input = validated_data.pop('receiver', None)
        receiver_obj = None

        if receiver_input:
            if isinstance(receiver_input, User):
                receiver_obj = receiver_input
            else:
                # Try to get user by ID first
                try:
                    if str(receiver_input).isdigit():
                        receiver_obj = User.objects.get(id=int(receiver_input))
                except (User.DoesNotExist, ValueError):
                    pass
                
                if not receiver_obj:
                    # Try by username
                    try:
                        receiver_obj = User.objects.get(username=receiver_input)
                    except User.DoesNotExist:
                        # Check if it's a student ID or landlord ID
                        student = Student.objects.filter(student_id=receiver_input).first()
                        if student:
                            receiver_obj = student.user
                        else:
                            landlord = Landlord.objects.filter(landlord_id=receiver_input).first()
                            if landlord:
                                receiver_obj = landlord.user

        if not receiver_obj:
            # Fallback for contact_ inquiries (Admin replying)
            if isinstance(receiver_input, str) and receiver_input.startswith('contact_'):
                try:
                    contact_id = int(receiver_input.replace('contact_', ''))
                    from .models import ContactMessage
                    contact = ContactMessage.objects.get(id=contact_id)
                    receiver_obj = contact.user
                    validated_data['contact_message_id'] = contact_id
                except:
                    pass

        if not receiver_obj:
            raise serializers.ValidationError({"receiver": "Message has no valid receiver."})

        # Check if chat is closed/locked
        booking_id = validated_data.get('booking_request_id')
        contact_id = validated_data.get('contact_message_id')
        
        if booking_id:
            from .models import BookingRequest
            try:
                booking = BookingRequest.objects.get(id=booking_id)
                if booking.is_chat_closed:
                    raise serializers.ValidationError("This chat is closed and no more messages can be sent.")
            except BookingRequest.DoesNotExist:
                pass
                
        if contact_id:
            from .models import ContactMessage
            try:
                contact = ContactMessage.objects.get(id=contact_id)
                if contact.is_resolved:
                    raise serializers.ValidationError("This inquiry has been resolved and the chat is closed.")
            except ContactMessage.DoesNotExist:
                pass

        validated_data['receiver'] = receiver_obj
        # Handle sender from request
        if 'request' in self.context:
            validated_data['sender'] = self.context['request'].user
        
        # Capture is_chat_closed from view input
        if 'is_chat_closed' in validated_data:
             pass 

        return super().create(validated_data)

    def get_is_chat_closed(self, obj):
        # If explicitly marked on the message
        if obj.is_chat_closed:
            return True
        # If part of a booking request that is closed
        if obj.booking_request and obj.booking_request.is_chat_closed:
            return True
        # If part of a contact message that is resolved
        if obj.contact_message and obj.contact_message.is_resolved:
            return True
        return False

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at']

class SavedDormSerializer(serializers.ModelSerializer):
    dorm_details = DormSerializer(source='dorm', read_only=True)
    
    class Meta:
        model = SavedDorm
        fields = ['id', 'student', 'dorm', 'dorm_details', 'saved_at']
        read_only_fields = ['student']

class StudentRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentRating
        fields = '__all__'
        read_only_fields = ['landlord', 'created_at']

class SiteRatingSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_type = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    profile_id = serializers.SerializerMethodField()

    class Meta:
        model = SiteRating
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

    def get_user_name(self, obj):
        if hasattr(obj.user, 'student'): return obj.user.student.name
        if hasattr(obj.user, 'landlord'): return obj.user.landlord.name
        return obj.user.username

    def get_user_type(self, obj):
        if hasattr(obj.user, 'student'): return 'student'
        if hasattr(obj.user, 'landlord'): return 'landlord'
        return 'admin'
    
    def get_profile_id(self, obj):
        if hasattr(obj.user, 'student'): return obj.user.student.student_id
        if hasattr(obj.user, 'landlord'): return obj.user.landlord.landlord_id
        return None

class LandlordRatingSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    class Meta:
        model = LandlordRating
        fields = '__all__'
        read_only_fields = ['student', 'created_at']

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'is_resolved', 'admin_response']
