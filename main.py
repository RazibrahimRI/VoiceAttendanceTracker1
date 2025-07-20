from app import app
import routes  # Import routes to register them

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
from dotenv import load_dotenv
import os

load_dotenv()  # This reads the .env file

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SECRET_KEY'] = os.getenv("SESSION_SECRET")
