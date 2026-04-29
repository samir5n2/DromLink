web: python backend/manage.py migrate && gunicorn --pythonpath backend backend.wsgi:application --bind 0.0.0.0:$PORT
