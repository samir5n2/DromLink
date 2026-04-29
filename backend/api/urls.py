from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, DormViewSet, RatingViewSet, LandlordViewSet, RegisterView, MeView, LocationViewSet, AdminUsersView, DormImageViewSet, BookingRequestViewSet, MessageViewSet, NotificationViewSet, AdminDormVerificationView, SavedDormViewSet, StudentRatingViewSet, SiteRatingViewSet, LandlordRatingViewSet, SiteStatsView, ContactMessageViewSet, ReportViewSet, UpdateStudentProfileView, RecommendationView

router = DefaultRouter()
router.register(r'landlords', LandlordViewSet)
router.register(r'students', StudentViewSet)
router.register(r'dorms', DormViewSet)
router.register(r'dorm_images', DormImageViewSet)
router.register(r'ratings', RatingViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'bookings', BookingRequestViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'saved-dorms', SavedDormViewSet, basename='saved-dorm')
router.register(r'student-ratings', StudentRatingViewSet)
router.register(r'site-ratings', SiteRatingViewSet)
router.register(r'landlord-ratings', LandlordRatingViewSet)
router.register(r'contact-messages', ContactMessageViewSet)
router.register(r'reports', ReportViewSet, basename='reports')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('update-student-profile/', UpdateStudentProfileView.as_view(), name='update_student_profile'),
    path('admin/users/', AdminUsersView.as_view(), name='admin_users'),
    path('admin/dorms/', AdminDormVerificationView.as_view(), name='admin_dorms'),
    path('stats/', SiteStatsView.as_view(), name='site_stats'),
    path('recommendations/', RecommendationView.as_view(), name='recommendations'),
    path('', include(router.urls)),
]
