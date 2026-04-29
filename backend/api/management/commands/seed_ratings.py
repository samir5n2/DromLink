import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Student, Landlord, Dorm, Rating, StudentRating

class Command(BaseCommand):
    help = 'Seeds the database with random ratings'

    def handle(self, *args, **kwargs):
        students = list(Student.objects.all())
        dorms = list(Dorm.objects.filter(approval_status='approved'))
        landlords = list(Landlord.objects.all())

        if not students or not dorms:
            self.stdout.write(self.style.WARNING('No students or approved dorms found. Seed those first.'))
            return

        good_comments = [
            "Great place, very clean!",
            "Perfect location for university students.",
            "Excellent amenities and fair price.",
            "I had a great experience living here.",
            "The room is exactly like the photos.",
            "Very helpful landlord, highly recommended.",
            "Good value for money.",
            "Best dorm in the area!",
            "مكان ممتاز ونظيف جداً!",
            "موقع مثالي للطلاب، قريب من كل الخدمات.",
            "تجربة رائعة والسكن مريح.",
            "المالك متعاون جداً وأنصح بالسكن هنا."
        ]

        bad_comments = [
            "Landlord was a bit slow to respond.",
            "A bit noisy at night.",
            "The room was smaller than expected.",
            "Wi-fi connection is very poor.",
            "Maintenance takes forever to fix issues.",
            "Too expensive for what you get.",
            "الواي فاي سيء جداً ولا يعمل معظم الوقت.",
            "المالك يتأخر في الرد والمكان يحتاج صيانة.",
            "مزعج جداً في الليل ولا يمكن النوم بهدوء.",
            "السعر غالي جداً مقارنة بالخدمات المقدمة.",
            "المكان غير نظيف عند استلامه."
        ]

        student_comments = [
            "Very respectful and quiet student.",
            "Always pays rent on time.",
            "Keeps the room very clean.",
            "A bit loud during the weekends but generally good.",
            "Highly recommend this student.",
            "Very polite and follows all house rules."
        ]

        # No need to create dummy students, we will distribute among existing ones

        # Clear existing dorm ratings to ensure we have exactly 6-7
        Rating.objects.all().delete()

        # Seed Dorm/Landlord Ratings (from Students)
        for dorm in dorms:
            num_ratings = random.randint(6, 7)
            # Use random.choices to allow replacement if there are fewer students than ratings
            selected_students = random.choices(students, k=num_ratings)
            
            for student in selected_students:
                is_good = random.choice([True, True, False]) # 2/3 chance of good rating
                if is_good:
                    d_rating = random.choice([4.0, 4.5, 5.0])
                    l_rating = random.choice([4.0, 4.5, 5.0])
                    comment = random.choice(good_comments)
                else:
                    d_rating = random.choice([1.0, 1.5, 2.0, 2.5, 3.0])
                    l_rating = random.choice([1.0, 1.5, 2.0, 2.5, 3.0])
                    comment = random.choice(bad_comments)
                
                Rating.objects.create(
                    student=student,
                    dorm=dorm,
                    dorm_rating=d_rating,
                    landlord_rating=l_rating,
                    final_rating=(d_rating + l_rating) / 2,
                    comment=comment,
                    is_anonymous=False # Force it to show names based on user request
                )

        # Seed Student Ratings (from Landlords)
        for student in students:
            num_ratings = random.randint(1, 3)
            selected_landlords = random.sample(landlords, min(num_ratings, len(landlords)))
            
            for landlord in selected_landlords:
                StudentRating.objects.get_or_create(
                    landlord=landlord,
                    student=student,
                    defaults={
                        'rating': random.choice([4.0, 4.5, 5.0, 3.5, 4.0]),
                        'comment': random.choice(student_comments),
                        'is_anonymous': random.choice([True, False])
                    }
                )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded random ratings.'))
