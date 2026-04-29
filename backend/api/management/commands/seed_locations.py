from django.core.management.base import BaseCommand
from api.models import Location

class Command(BaseCommand):
    help = 'Seeds the database with famous locations in Assiut'

    def handle(self, *args, **kwargs):
        locations = [
            "شارع النميس",
            "شارع يسري راغب",
            "شارع الجمهورية",
            "حي السادات",
            "حي الأربعين",
            "جامعة أسيوط",
            "فريال",
            "نزلة عبداللاه",
            "الوليدية"
        ]

        created_count = 0
        for name in locations:
            obj, created = Location.objects.get_or_create(name=name)
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully added {created_count} new locations.'))
