import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Message, Notification

def wipe_chats():
    m_count = Message.objects.all().count()
    Message.objects.all().delete()
    
    n_count = Notification.objects.filter(notification_type='message').count()
    Notification.objects.filter(notification_type='message').delete()
    
    print(f"Deleted {m_count} messages and {n_count} notifications.")

if __name__ == "__main__":
    wipe_chats()
