import os
import django
import random
import uuid

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Landlord, Student, Dorm, Location, DormImage, Rating

def generate_random_username(base):
    return f"{base}_{uuid.uuid4().hex[:6]}"

# Data lists
first_names = [
    "احمد", "محمد", "علي", "محمود", "عمر", "ياسين", "إبراهيم", "خالد", "يوسف", "حسن",
    "سارة", "فاطمة", "مريم", "ليلى", "نور", "سلمى", "آية", "منى", "رنا", "هبة"
]
last_names = [
    "الأسيوطي", "الشريف", "منصور", "زيدان", "بدوي", "سالم", "عز", "جلال", "حسين", "كمال",
    "البدري", "العدلي", "راضي", "فوزي", "علام", "محي", "سعد", "جمال", "صالح", "ماهر"
]
asyut_neighborhoods = [
    "شركة فريال", "حي السادات", "منطقة الحمراء", "شارع النميس", "شارع الجمهورية",
    "الوليدية", "حي شرق", "حي غرب", "الأربعين", "المحطة"
]
dorm_names = [
    "سكن الأمل", "سكن المستقبل", "نزل الطلاب", "سويتات النخبة", "بيت الشباب",
    "سكن الهدى", "دار السلام", "سكن التفوق", "واحة الطلاب", "نزل المدينة"
]
descriptions = [
    "سكن هادئ ومريح قريب من جامعة أسيوط، مجهز بكافة الخدمات الأساسية.",
    "غرف واسعة ومضاءة جيداً مع إطلالة رائعة، بيئة مثالية للمذاكرة.",
    "سكن آمن مع حراسة على مدار الساعة، يتوفر واي فاي سريع ومطبخ مجهز.",
    "موقع متميز في قلب أسيوط، قريب من المواصلات والمراكز التجارية.",
    "سكن طلابي عصري بتشطيبات لوكس، يتضمن غسالة وثلاجة وتكييف."
]

def create_mock_data():
    print("Starting data generation...")
    
    # 1. Ensure Asyut location exists
    asyut_loc, _ = Location.objects.get_or_create(name="Asyut")
    print("Location Asyut ready.")

    # 2. Create 200 Landlords
    landlords = []
    for i in range(200):
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        name = f"{fname} {lname}"
        username = generate_random_username(f"landlord_{i}")
        email = f"{username}@example.com"
        
        landlord = Landlord.objects.create(
            name=name,
            username=username,
            password="password123",
            email=email,
            phone_number=f"01{random.randint(100000000, 999999999)}",
            gender=random.choice(['male', 'female']),
            account_status='approved',
            bio=f"مرحباً، أنا {name}، صاحب سكن متخصص في خدمة الطلاب في أسيوط."
        )
        landlords.append(landlord)
    print(f"Created {len(landlords)} landlords.")

    # 3. Create 800 Students
    students = []
    for i in range(800):
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        name = f"{fname} {lname}"
        username = generate_random_username(f"student_{i}")
        email = f"{username}@example.com"
        
        student = Student.objects.create(
            name=name,
            username=username,
            password="password123",
            email=email,
            phone_number=f"01{random.randint(100000000, 999999999)}",
            gender=random.choice(['male', 'female']),
            account_status='approved',
            preferred_room_type=random.choice(['single', 'shared']),
            budget_min_egp=random.randint(500, 1500),
            budget_max_egp=random.randint(1500, 5000),
            needs_gym=random.choice([True, False]),
            preferences_set=True
        )
        students.append(student)
    print(f"Created {len(students)} students.")

    # 4. Create 1000 Dorms
    dorms = []
    room_types = ['Single', 'Shared', 'Studio']
    for i in range(1000):
        landlord = random.choice(landlords)
        neighborhood = random.choice(asyut_neighborhoods)
        name = f"{random.choice(dorm_names)} - {neighborhood}"
        
        dorm = Dorm.objects.create(
            landlord=landlord,
            location=asyut_loc,
            name=name,
            price_egp=random.randint(800, 3500),
            distance_km=round(random.uniform(0.5, 5.0), 1),
            room_type=random.choice(room_types),
            capacity=random.randint(1, 4),
            current_occupants=random.randint(0, 1),
            bedrooms=random.randint(1, 3),
            bathrooms=random.randint(1, 2),
            address=f"{neighborhood}، أسيوط، مصر",
            has_wifi=random.choice([True, False, True]),
            has_kitchen=random.choice([True, False, True]),
            has_ac=random.choice([True, False]),
            is_furnished=random.choice([True, False, True]),
            description=random.choice(descriptions),
            approval_status='approved',
            gender_preference=random.choice(['male', 'female']),
            gender_policy=random.choice(['male', 'female', 'mixed']),
            is_available=True,
            has_gym=random.choice([True, False])
        )
        
        # Add a random local image
        local_images = os.listdir(os.path.join('media', 'dorm_images'))
        if local_images:
            img_file = random.choice(local_images)
            DormImage.objects.create(
                dorm=dorm,
                image=f"dorm_images/{img_file}"
            )
        else:
            # Fallback if folder is empty (shouldn't happen based on my check)
            DormImage.objects.create(
                dorm=dorm,
                image="dorm_images/default.jpg"
            )
        dorms.append(dorm)
        
    print(f"Created {len(dorms)} dorms.")

    # 5. Create random Ratings
    for i in range(1500):
        student = random.choice(students)
        dorm = random.choice(dorms)
        d_rating = random.randint(3, 5)
        l_rating = random.randint(3, 5)
        f_rating = (d_rating + l_rating) / 2
        
        Rating.objects.create(
            student=student,
            dorm=dorm,
            dorm_rating=d_rating,
            landlord_rating=l_rating,
            final_rating=f_rating,
            comment=random.choice(["سكن ممتاز وتعامل راقي", "موقع رائع وقريب من الجامعة", "نظيف جداً وهادئ", "صاحب السكن متعاون جداً"]),
            is_anonymous=random.choice([True, False])
        )
    print("Created 1500 ratings.")
    print("Data generation finished successfully!")

if __name__ == "__main__":
    create_mock_data()
