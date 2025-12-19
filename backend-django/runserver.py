# run_server.py
from waitress import serve
from staf_manag.staf_manag.wsgi import application

if __name__ == '__main__':
    print("Starting Django server on http://127.0.0.1:8000")
    serve(application, host='127.0.0.1', port=8000, threads=4)