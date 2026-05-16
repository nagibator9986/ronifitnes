web: cd backend && gunicorn -w 2 -k gthread --threads 4 -b 0.0.0.0:$PORT --access-logfile - --error-logfile - app:app
