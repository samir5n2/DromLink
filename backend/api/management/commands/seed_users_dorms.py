import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Student, Landlord, Dorm, DormImage, Location

class Command(BaseCommand):
    help = 'Seeds the database with 20 Landlords, 20 Dorms, and 50 Students'

    def handle(self, *args, **kwargs):
        self.stdout.write("Cleaning up old seeded data...")
        Student.objects.filter(username__startswith='student').delete()
        Landlord.objects.filter(username__startswith='landlord').delete()
        User.objects.filter(username__startswith='student').delete()
        User.objects.filter(username__startswith='landlord').delete()

        self.stdout.write("Starting to seed data...")

        first_names = ["أحمد", "محمد", "محمود", "علي", "عمر", "خالد", "يوسف", "طارق", "حسن", "حسين",
                       "فاطمة", "مريم", "سارة", "نور", "آية", "منى", "هند", "ندى", "ياسمين", "زينب",
                       "كريم", "ماجد", "عادل", "رامي", "سامي", "تامر", "وليد", "أمير", "شادي", "وائل"]
        
        last_names = ["سالم", "عثمان", "ابراهيم", "نصار", "منصور", "النجار", "الحداد", "المصري", "سعد", "توفيق",
                      "عبدالله", "محسن", "فهمي", "رضوان", "سليمان", "جمال", "صادق", "مختار", "وهبة", "عيسى"]

        dorm_names = ["سكن الأمل", "دار الفؤاد", "سكن السلام", "الزهور", "النور", "سكن الهدى", "بيت الطلبة", "سكن الشروق",
                      "الفردوس", "سكن المستقبل", "الصفا", "المروة", "سكن الإيمان", "التقوى", "سكن التحرير", "الروضة",
                      "الواحة", "سكن السعادة", "برج الجامعة", "عمارة التوفيق"]

        room_types = ["Single", "Double", "Triple", "Shared"]
        genders = ["male", "female"]

        locations = list(Location.objects.all())

        unsplash_images = [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1522771731470-ee1d152fc229?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1502672260266-1c1de2d1d0df?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800",
        ]

        # Add 20 Landlords
        landlords = []
        for i in range(1, 21):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            username = f"landlord{i}"
            email = f"{username}@example.com"
            
            landlord = Landlord(
                username=username,
                password="password123",
                name=name,
                email=email,
                phone_number=f"010{random.randint(10000000, 99999999)}",
                account_status="approved"
            )
            landlord.save()
            landlords.append(landlord)
        
        self.stdout.write(self.style.SUCCESS('Successfully added 20 Landlords.'))

        # Add 20 Dorms
        for i in range(20):
            landlord = landlords[i] # Distribute 1 dorm per landlord
            location = random.choice(locations) if locations else None
            
            dorm = Dorm.objects.create(
                landlord=landlord,
                location=location,
                name=f"{dorm_names[i]} - {location.name if location else 'شقة'}",
                price_egp=random.randint(1500, 5000),
                distance_km=round(random.uniform(0.5, 5.0), 1),
                room_type=random.choice(room_types),
                capacity=random.randint(2, 6),
                current_occupants=random.randint(0, 2),
                bedrooms=random.randint(1, 4),
                bathrooms=random.randint(1, 3),
                address=f"شارع {random.choice(last_names)}",
                has_wifi=random.choice([True, False]),
                has_kitchen=random.choice([True, False]),
                has_laundry=random.choice([True, False]),
                has_ac=random.choice([True, False]),
            )

            # Add 2 Images per Dorm
            for _ in range(2):
                DormImage.objects.create(
                    dorm=dorm,
                    image=random.choice(unsplash_images)
                )

        self.stdout.write(self.style.SUCCESS('Successfully added 20 Dorms with 2 images each.'))

        # Add 50 Students
        for i in range(1, 51):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            username = f"student{i}"
            
            student = Student(
                username=username,
                password="password123",
                name=name,
                phone_number=f"011{random.randint(10000000, 99999999)}",
                gender=random.choice(genders),
                preferred_room_type=random.choice(room_types),
                needs_wifi=random.choice([True, False]),
                needs_kitchen=random.choice([True, False]),
                needs_laundry=random.choice([True, False]),
                needs_ac=random.choice([True, False]),
                account_status="approved"
            )
            student.save()

        self.stdout.write(self.style.SUCCESS('Successfully added 50 Students.'))
        self.stdout.write(self.style.SUCCESS('Done seeding data! All accounts have password "password123".'))
