from django.core.management.base import BaseCommand
from api.models import Student
import random

class Command(BaseCommand):
    help = 'Updates all students budget to be between 900 and 2500 in steps of 100'

    def handle(self, *args, **options):
        students = Student.objects.all()
        count = 0
        for student in students:
            # Random budget between 900 and 2500 in steps of 100
            # random.randint(9, 25) * 100 gives 900, 1000, ..., 2500
            student.budget_max_egp = random.randint(9, 25) * 100
            student.save()
            count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully updated budgets for {count} students'))
