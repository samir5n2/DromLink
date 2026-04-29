import os
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings
from api.models import Student, Dorm, Rating

class Command(BaseCommand):
    help = 'Imports data from CSV files (students.csv, dorms.csv, ratings.csv) into the database'

    def handle(self, *args, **options):
        base_path = settings.BASE_DIR.parent
        
        students_path = os.path.join(base_path, 'students.csv')
        dorms_path = os.path.join(base_path, 'dorms.csv')
        ratings_path = os.path.join(base_path, 'ratings.csv')
        
        self.stdout.write("Importing Dorms...")
        if os.path.exists(dorms_path):
            dorms_df = pd.read_csv(dorms_path)
            for _, row in dorms_df.iterrows():
                Dorm.objects.update_or_create(
                    dorm_id=row['dorm_id'],
                    defaults={
                        'name': row['name'],
                        'price_egp': row['price_egp'],
                        'distance_km': row['distance_km'],
                        'room_type': row['room_type'],
                        'gender_policy': row['gender_policy'],
                        'has_wifi': str(row['has_wifi']).lower() == 'true',
                        'has_kitchen': str(row['has_kitchen']).lower() == 'true',
                        'has_laundry': str(row['has_laundry']).lower() == 'true',
                        'has_ac': str(row['has_ac']).lower() == 'true',
                        'has_gym': str(row['has_gym']).lower() == 'true',
                    }
                )
            self.stdout.write(self.style.SUCCESS(f'Successfully imported {len(dorms_df)} dorms'))
        else:
            self.stdout.write(self.style.ERROR(f'File not found: {dorms_path}'))

        self.stdout.write("Importing Students...")
        if os.path.exists(students_path):
            students_df = pd.read_csv(students_path)
            for _, row in students_df.iterrows():
                Student.objects.update_or_create(
                    student_id=row['student_id'],
                    defaults={
                        'gender': row['gender'],
                        'budget_min_egp': row['budget_min_egp'],
                        'budget_max_egp': row['budget_max_egp'],
                        'preferred_distance_km': row['preferred_distance_km'],
                        'preferred_room_type': row['preferred_room_type'],
                        'needs_wifi': str(row['needs_wifi']).lower() == 'true',
                        'needs_kitchen': str(row['needs_kitchen']).lower() == 'true',
                        'needs_laundry': str(row['needs_laundry']).lower() == 'true',
                        'needs_ac': str(row['needs_ac']).lower() == 'true',
                        'needs_gym': str(row['needs_gym']).lower() == 'true',
                    }
                )
            self.stdout.write(self.style.SUCCESS(f'Successfully imported {len(students_df)} students'))
        else:
            self.stdout.write(self.style.ERROR(f'File not found: {students_path}'))

        self.stdout.write("Importing Ratings...")
        if os.path.exists(ratings_path):
            ratings_df = pd.read_csv(ratings_path)
            for _, row in ratings_df.iterrows():
                try:
                    student = Student.objects.get(student_id=row['student_id'])
                    dorm = Dorm.objects.get(dorm_id=row['dorm_id'])
                    Rating.objects.update_or_create(
                        student=student,
                        dorm=dorm,
                        defaults={
                            'dorm_rating': row['dorm_rating'],
                            'landlord_rating': row['landlord_rating'],
                            'final_rating': row['final_rating'],
                            'dorm_tags': row['dorm_tags'] if pd.notna(row['dorm_tags']) else '',
                            'landlord_tags': row['landlord_tags'] if pd.notna(row['landlord_tags']) else '',
                        }
                    )
                except Student.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Student {row['student_id']} not found, skipping rating"))
                except Dorm.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Dorm {row['dorm_id']} not found, skipping rating"))
            self.stdout.write(self.style.SUCCESS(f'Successfully imported ratings'))
        else:
            self.stdout.write(self.style.ERROR(f'File not found: {ratings_path}'))
