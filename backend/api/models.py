import uuid
from django.db import models
from django.contrib.auth.models import User

def generate_random_id():
    return str(uuid.uuid4())[:8].upper()

class Landlord(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    password = models.CharField(max_length=128, null=True, blank=True)
    account_status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('approved', 'Approved'), ('banned', 'Banned')], default='pending')
    landlord_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    gender = models.CharField(max_length=20, choices=[('male', 'Male'), ('female', 'Female')], null=True, blank=True)
    id_card_image = models.ImageField(upload_to='landlord_ids/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.username and self.password:
            if not self.user:
                user = User.objects.create_user(username=self.username, email=self.email, password=self.password)
                self.user = user
            else:
                self.user.username = self.username
                if self.email:
                    self.user.email = self.email
                if not self.user.check_password(self.password):
                    self.user.set_password(self.password)
                self.user.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    password = models.CharField(max_length=128, null=True, blank=True)
    account_status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('approved', 'Approved'), ('banned', 'Banned')], default='pending')
    student_id = models.CharField(max_length=10, primary_key=True, default=generate_random_id, editable=False)
    name = models.CharField(max_length=255, default="New Student")
    email = models.EmailField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    gender = models.CharField(max_length=20, choices=[('male', 'Male'), ('female', 'Female')], null=True, blank=True)
    preferred_room_type = models.CharField(max_length=50)
    needs_wifi = models.BooleanField(default=False)
    needs_kitchen = models.BooleanField(default=False)
    needs_laundry = models.BooleanField(default=False)
    needs_ac = models.BooleanField(default=False)
    needs_parking = models.BooleanField(default=False)
    needs_furnished = models.BooleanField(default=False)
    needs_smart_tv = models.BooleanField(default=False)
    needs_pet_friendly = models.BooleanField(default=False)
    needs_scenic_view = models.BooleanField(default=False)
    id_card_image = models.ImageField(upload_to='student_ids/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    budget_min_egp = models.IntegerField(default=0)
    budget_max_egp = models.IntegerField(default=10000)
    preferred_distance_km = models.FloatField(default=5.0)
    needs_gym = models.BooleanField(default=False)
    preferences_set = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.username and self.password:
            if not self.user:
                user = User.objects.create_user(username=self.username, email=self.email, password=self.password)
                self.user = user
            else:
                self.user.username = self.username
                if self.email:
                    self.user.email = self.email
                if not self.user.check_password(self.password):
                    self.user.set_password(self.password)
                self.user.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Location(models.Model):
    name = models.CharField(max_length=255, unique=True)
    image = models.ImageField(upload_to='location_images/', null=True, blank=True)

    def __str__(self):
        return self.name

class Dorm(models.Model):
    dorm_id = models.CharField(max_length=10, primary_key=True, default=generate_random_id, editable=False)
    landlord = models.ForeignKey(Landlord, on_delete=models.SET_NULL, null=True, blank=True, related_name='dorms')
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='dorms')
    name = models.CharField(max_length=255)
    price_egp = models.IntegerField()
    distance_km = models.FloatField()
    room_type = models.CharField(max_length=50)
    capacity = models.IntegerField(default=1)
    current_occupants = models.IntegerField(default=0)
    bedrooms = models.IntegerField(default=1)
    bathrooms = models.IntegerField(default=1)
    address = models.CharField(max_length=255, default="No Address")
    has_wifi = models.BooleanField(default=False)
    has_kitchen = models.BooleanField(default=False)
    has_laundry = models.BooleanField(default=False)
    has_ac = models.BooleanField(default=False)
    has_parking = models.BooleanField(default=False)
    is_furnished = models.BooleanField(default=False)
    has_smart_tv = models.BooleanField(default=False)
    is_pet_friendly = models.BooleanField(default=False)
    has_scenic_view = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)
    google_maps_link = models.URLField(max_length=500, null=True, blank=True)
    gender_preference = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female')], default='male')
    gender_policy = models.CharField(max_length=20, choices=[('male', 'Male'), ('female', 'Female'), ('mixed', 'Mixed')], default='mixed')
    is_available = models.BooleanField(default=True)
    has_gym = models.BooleanField(default=False)
    is_reported = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending')
    rejection_reason = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.dorm_id})"

class DormImage(models.Model):
    dorm = models.ForeignKey(Dorm, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='dorm_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.dorm.name}"

class Rating(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='ratings')
    dorm = models.ForeignKey(Dorm, on_delete=models.CASCADE, related_name='ratings')
    dorm_rating = models.FloatField()
    landlord_rating = models.FloatField()
    final_rating = models.FloatField()
    dorm_tags = models.CharField(max_length=255, null=True, blank=True)
    landlord_tags = models.CharField(max_length=255, null=True, blank=True)
    comment = models.TextField(null=True, blank=True)
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"Rating by {self.student.student_id} for {self.dorm.dorm_id}"

class BookingRequest(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='booking_requests')
    dorm = models.ForeignKey(Dorm, on_delete=models.CASCADE, related_name='booking_requests')
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending')
    message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_chat_closed = models.BooleanField(default=False)

    def __str__(self):
        return f"Booking Request {self.id} for {self.dorm.name} by {self.student.name}"

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', null=True, blank=True)
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    booking_request = models.ForeignKey(BookingRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    contact_message = models.ForeignKey('ContactMessage', on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    is_chat_closed = models.BooleanField(default=False, verbose_name="Is Chat Locked")
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)

    def __str__(self):
        sender_name = self.sender.username if self.sender else "Guest"
        return f"Message from {sender_name} to {self.receiver.username}"

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    notification_type = models.CharField(max_length=50, default='general')
    related_id = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.message}"

class SavedDorm(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='saved_dorms')
    dorm = models.ForeignKey(Dorm, on_delete=models.CASCADE, related_name='saved_by_students')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'dorm')

    def __str__(self):
        return f"{self.student.name} saved {self.dorm.name}"

class StudentRating(models.Model):
    landlord = models.ForeignKey(Landlord, on_delete=models.CASCADE, related_name='given_student_ratings')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='received_ratings')
    rating = models.FloatField()
    comment = models.TextField(null=True, blank=True)
    tags = models.CharField(max_length=255, null=True, blank=True)
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating by {self.landlord.name} for {self.student.name}"

class SiteRating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='site_ratings')
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Site Rating {self.rating}/5 by {self.user.username}"

class LandlordRating(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='given_landlord_ratings')
    landlord = models.ForeignKey(Landlord, on_delete=models.CASCADE, related_name='received_landlord_ratings')
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating by {self.student.name} for {self.landlord.name}"
class ContactMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='contact_messages')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    admin_response = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name} - {self.subject}"
