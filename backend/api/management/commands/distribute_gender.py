from django.core.management.base import BaseCommand
from api.models import Dorm
import random

class Command(BaseCommand):
    help = 'Distribute gender preference randomly across dorms'

    def handle(self, *args, **kwargs):
        dorms = Dorm.objects.all()
        preferences = ['male', 'female']
        
        count = 0
        for dorm in dorms:
            dorm.gender_preference = random.choice(preferences)
            dorm.save()
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {count} dorms.'))
