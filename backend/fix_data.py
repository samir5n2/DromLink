import os
import django
import random

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Student, Dorm, DormImage

def fix_data():
    print("Starting optimized data fix script...")

    # 1. Update Students
    print("Updating students (bulk)...")
    students = list(Student.objects.all())
    for s in students:
        s.preferences_set = True
        if s.budget_min_egp == 0:
            s.budget_min_egp = random.randint(500, 1500)
    
    Student.objects.bulk_update(students, ['preferences_set', 'budget_min_egp'])
    print(f"Updated {len(students)} students.")

    # 2. Update Dorms
    print("Updating dorms (bulk)...")
    dorms = list(Dorm.objects.all())
    for d in dorms:
        if d.gender_preference and d.gender_policy == 'mixed':
            d.gender_policy = d.gender_preference
        d.is_available = True
    
    Dorm.objects.bulk_update(dorms, ['gender_policy', 'is_available'])
    print(f"Updated {len(dorms)} dorms.")

    # 3. Fix broken image links
    print("Fixing all image links to point to local files...")
    local_images = os.listdir(os.path.join('media', 'dorm_images'))
    if local_images:
        dorm_images = list(DormImage.objects.all())
        to_update = []
        for di in dorm_images:
            # Always pick a random local image for every record to be 100% sure it works
            img_file = random.choice(local_images)
            di.image = f"dorm_images/{img_file}"
            to_update.append(di)
        
        if to_update:
            DormImage.objects.bulk_update(to_update, ['image'])
            print(f"Fixed {len(to_update)} image records using local files.")
    
    print("Data fix finished successfully!")

    print("Data fix finished successfully!")

if __name__ == "__main__":
    fix_data()
