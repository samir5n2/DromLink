import requests
import json
import os
import subprocess

# --- CONFIGURATION ---
PROD_BASE_URL = "https://dromlink-production.up.railway.app/api"
LOCAL_DATA_FILE = "data.json"

def sync():
    print("🚀 Starting Data Synchronization from Production...")
    
    # 1. Get Admin Credentials
    print("\n🔑 Please enter your Production Admin credentials:")
    username = input("Username: ")
    password = input("Password: ")

    # 2. Get JWT Token
    print("\n📡 Connecting to production server...")
    try:
        # We'll use the login endpoint to get a token. 
        # Usually SimpleJWT uses /api/token/ but let's check common patterns.
        # Based on api.ts, the project uses Bearer tokens.
        # Let's try to login via the existing RegisterView if it supports login or a common JWT path.
        # Looking at urls.py, there isn't a clear 'login' path, but MeView uses IsAuthenticated.
        # Let's assume there's a token endpoint or use simple auth if supported.
        # Actually, let's use the standard SimpleJWT endpoint if it exists or try to find it.
        
        # PRO-TIP: We can also try to get the token from the user if they are logged in on the browser.
        # But let's try a common endpoint first.
        token_url = PROD_BASE_URL.replace('/api', '/api/token/') # Common default
        login_data = {"username": username, "password": password}
        
        # Fallback to the known RegisterView behavior if login is separate? 
        # Actually, let's just ask the user for the Token directly to be safe, 
        # OR better: Add a simple login to our script.
        
        response = requests.post(token_url, json=login_data)
        if response.status_code != 200:
            # Try another common path
            token_url = PROD_BASE_URL.replace('/api', '/api/auth/login/')
            response = requests.post(token_url, json=login_data)
            
        if response.status_code != 200:
            print("❌ Failed to login. Please make sure the credentials are correct and the server is up.")
            print("Hint: If you have a custom login URL, you can edit this script.")
            return

        token = response.json().get('access')
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return

    # 3. Fetch Export Data
    print("📥 Fetching full data dump from production...")
    headers = {"Authorization": f"Bearer {token}"}
    export_url = f"{PROD_BASE_URL}/sync-export/"
    
    response = requests.get(export_url, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to fetch data. Status code: {response.status_code}")
        print(f"Error: {response.text}")
        return

    data = response.json()
    
    # 4. Save locally
    with open(LOCAL_DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"✅ Data saved to {LOCAL_DATA_FILE}")

    # 5. Load into local database
    print("🔄 Loading data into local database (db.sqlite3)...")
    try:
        # Run loaddata command
        result = subprocess.run(['python', 'manage.py', 'loaddata', LOCAL_DATA_FILE], capture_output=True, text=True)
        if result.returncode == 0:
            print("🎉 Synchronization Complete! Local database is now up to date.")
        else:
            print("⚠️ Warning: Data was downloaded but could not be loaded automatically.")
            print(result.stderr)
            print("\nYou can try running it manually: python manage.py loaddata data.json")
    except Exception as e:
        print(f"❌ Error running loaddata: {e}")

if __name__ == "__main__":
    sync()
