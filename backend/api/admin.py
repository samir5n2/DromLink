from django.contrib import admin
from .models import Student, Dorm, Rating, Landlord, DormImage, Location

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

class DormImageInline(admin.TabularInline):
    model = DormImage
    extra = 1

@admin.register(Landlord)
class LandlordAdmin(admin.ModelAdmin):
    list_display = ('landlord_id', 'name', 'username', 'email', 'phone_number')
    search_fields = ('name', 'email', 'username')
    exclude = ('user',)

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'name', 'username', 'gender', 'preferred_room_type')
    search_fields = ('student_id', 'name', 'username', 'phone_number')
    list_filter = ('gender', 'preferred_room_type', 'needs_wifi')
    exclude = ('user',)

@admin.register(Dorm)
class DormAdmin(admin.ModelAdmin):
    list_display = ('dorm_id', 'name', 'landlord', 'location', 'price_egp', 'capacity', 'current_occupants', 'bedrooms', 'bathrooms')
    search_fields = ('dorm_id', 'name', 'address')
    list_filter = ('room_type', 'has_wifi', 'location')
    inlines = [DormImageInline]

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('student', 'dorm', 'final_rating')
    list_filter = ('final_rating',)
