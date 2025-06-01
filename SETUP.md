# Project Setup
This guide explains how to set up and run the project locally. It includes instructions for the backend (Django) and the frontend (React with TypeScript and Tailwind CSS).

---

## Prerequisites
- Python 3.12+
- Node.js (if you plan to use `bun` (what I recommend), install it from [https://bun.sh](https://bun.sh))
- Git
- Docker and Docker Compose (for containerized setup)

---

## Quick Start (Docker - Recommended)

The fastest way to get the application running is using Docker Compose:

```bash
git clone https://github.com/santos-404/time-series-tfg 
cd time-series-tfg

docker compose up --build
```

Once the containers are running, access the application at:
- **Frontend**: http://127.0.0.1:8888
- **Backend API**: http://127.0.0.1:7777

The Docker setup automatically handles:
- Database migrations
- Dependencies installation
- Port configuration
- Service coordination

To stop the application:
```bash
docker compose down
```

> Ctrl+C should work to stop the containers, but if you want to ensure the containers are removed, run the previous command.

---

## Manual Setup (Development)

If you prefer to run the services individually for development:

### 1. Backend (Django API)
The backend exposes the machine learning models via a REST API using Django and TensorFlow.

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate

# Run the development server on port 7777. The frontend requests are hardcoded to target this port.
python manage.py runserver 7777
```

### 2. Frontend (React)
The frontend is located in the frontend/ directory. It connects to the Django backend to visualize and manage the time series data and predictions.

```bash
cd frontend
# Recommended: use Bun to install dependencies and run the development server.
# Other JavaScript runtimes or package managers are not tested.

bun install
bun run dev
```

### 3. Scripts and notebook
Additional scripts and analysis notebooks are located in the scripts/ directory. They can be used for:
 - Downloading raw data
 - Joining and preprocessing datasets
 - Plotting time series
 - Experimenting with model training

#### Using .env
Some scripts rely on environment variables for credentials or endpoints (e.g., ESIOS access). A template is provided:
```bash
cp .env.example .env  # And make sure to add your token on the .env
```

---

## Notes
- The project uses SQLite by default, no database configuration is required.
- You must ensure ports 7777 (backend) and 8888 (frontend) are available.
- TensorFlow models are pre-trained and stored in media/models/.
- Docker setup includes volume mounts to persist model files and enable hot-reload during development.
