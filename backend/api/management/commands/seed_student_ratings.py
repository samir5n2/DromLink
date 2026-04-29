import random
from django.core.management.base import BaseCommand
from api.models import Student, Landlord, StudentRating

class Command(BaseCommand):
    help = 'Seed realistic random ratings for students'

    def handle(self, *args, **kwargs):
        students = Student.objects.all()
        landlords = Landlord.objects.all()

        if not landlords:
            self.stdout.write(self.style.ERROR('No landlords found. Please seed landlords first.'))
            return

        comments = [
            "Great student, very quiet and respectful.",
            "Always pays on time, highly recommended tenant.",
            "Keeps the room clean and tidy.",
            "Very polite and friendly person.",
            "Excellent communication and follows building rules.",
            "Responsible and dependable tenant.",
            "A pleasure to have in my property.",
            "Respects neighbors and common areas.",
            "Very cooperative during maintenance visits.",
            "Top-tier student tenant, no issues at all."
        ]

        tags_list = ["Quiet", "Punctual", "Clean", "Polite", "Friendly", "Responsible", "Respectful"]

        ratings_created = 0
        for student in students:
            # Generate 1-2 ratings per student
            num_ratings = random.randint(1, 2)
            
            # Select random landlords to give ratings
            raters = random.sample(list(landlords), min(num_ratings, len(landlords)))
            
            for landlord in raters:
                rating_val = random.choice([4.0, 4.5, 5.0, 5.0, 5.0]) # Bias towards positive ratings
                
                # Check if rating already exists to avoid duplicates
                if not StudentRating.objects.filter(landlord=landlord, student=student).exists():
                    StudentRating.objects.create(
                        landlord=landlord,
                        student=student,
                        rating=rating_val,
                        comment=random.choice(comments),
                        tags=", ".join(random.sample(tags_list, k=random.randint(1, 3))),
                        is_anonymous=random.choice([True, False, False, False])
                    )
                    ratings_created += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {ratings_created} student ratings'))
