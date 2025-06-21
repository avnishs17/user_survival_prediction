# Titanic Survival Prediction - MLOps Project

This project demonstrates a complete MLOps pipeline for predicting Titanic passenger survival using various modern tools and technologies including Astronomer Airflow, Redis, Alibi Detect for drift detection, Prometheus and Grafana for monitoring.

## 🎯 Project Overview

This project was built to learn and implement various MLOps tools and practices:
- **Astronomer Airflow**: Orchestrating data pipelines
- **Redis**: Feature store for caching processed features
- **Alibi Detect**: Data drift detection
- **Prometheus & Grafana**: Monitoring and visualization
- **PostgreSQL**: Data storage
- **Google Cloud Platform**: Data source
- **Flask**: Web application interface

## 🛠️ Technologies Used

- Python 3.11.13
- Astronomer CLI 1.31.0
- Apache Airflow
- Redis
- PostgreSQL
- Prometheus
- Grafana
- Docker & Docker Compose
- Google Cloud Platform (GCP)
- Flask
- Scikit-learn
- Alibi Detect

## 📋 Prerequisites

- Windows 11
- Docker Desktop (running)
- Conda environment
- Google Cloud Platform account (setup instructions below)
- Astronomer CLI 1.31.0

## 🚀 Setup Instructions

### 1. Google Cloud Platform Setup

**Important**: Complete this setup before starting Astro.

#### Step 1.1: Create GCS Bucket

1. Go to Google Cloud Console → Cloud Storage → Buckets
2. Click "Create Bucket"
3. Give your bucket a name (e.g., `bucket_titanic_1`)
4. In "Choose how to control access to objects":
   - **UNTICK** `Enforce public access prevention on this bucket`
5. Continue and create the bucket
6. Upload your dataset file (e.g., `Titanic-Dataset.csv`) to the bucket

#### Step 1.2: Create Service Account

1. Go to IAM & Admin → Service Accounts
2. Click "Create Service Account"
3. Give it a name (e.g., `airflow-service-account`)
4. Click "Continue"
5. Grant this service account access to project by selecting these roles:
   - `Owner`
   - `Storage Object Admin`
   - `Storage Object Viewer`
6. Click "Continue" → "Done"

#### Step 1.3: Generate Service Account Key

1. Find your newly created service account in the list
2. Click the three dots (⋮) → "Manage Keys"
3. Click "Add Key" → "Create New Key"
4. Select "JSON" format
5. Click "Create" and download the JSON key file
6. **Important**: Save this file securely - you'll need it for Astro Airflow

#### Step 1.4: Configure Bucket Permissions

1. Go back to Cloud Storage → Buckets
2. Find your created bucket and click the three dots (⋮)
3. Click "Edit Access"
4. Add your service account with these principals/roles:
   - `Owner`
   - `Storage Object Admin`
   - `Storage Object Viewer`
5. Click "Save"

**Note**: Make sure the service account JSON key file is downloaded as it will be required for Astro setup.

### 2. Environment Setup

Create and activate a conda environment:

```bash
conda create -n titanic-mlops python=3.
conda activate titanic-mlops
```

### 3. Install Astronomer CLI

Install Astronomer CLI version 1.31.0:

```bash
# Install using winget (Windows)
winget install -e --id Astronomer.Astro -v 1.31.0

# Verify installation
astro version
```

### 4. Initialize Astro Airflow Project

```bash
# Initialize Astro project
astro dev init

# Add Google Cloud Provider to Dockerfile
# Add this line to your Dockerfile:
# RUN pip install apache-airflow-providers-google
# **Note**: Don't add `psycopg2` to `requirements.txt` initially as it conflicts with Astro setup.

```

### 5. Configure Astro Settings

Create/modify `.astro/config.yaml`:

```yaml
deployments:
  - name: dev
    executor: celery
    image:
      name: quay.io/astronomer/astro-runtime:7.3.0
    env: dev
    volumes:
      - ./include:/usr/local/airflow/include
```

### 6. Service Account Setup

1. Take the service account JSON key file downloaded from GCP (Step 1.3)
2. Place it in the `include/` folder of your Astro project
3. Rename it to `gcp-key.json`

### 7. Start Astro Development Environment

**Important**: Make sure Docker Desktop is running before executing this command.

```bash
astro dev start
```

### 8. Configure Airflow Connections

Once the containers are running, go to `http://localhost:8080` (Airflow Dashboard):

#### Google Cloud Connection
- Go to Admin → Connections → Create
- **Connection ID**: `google_cloud_default`
- **Connection Type**: `Google Cloud`
- **Keyfile Path**: `/usr/local/airflow/include/gcp-key.json`
- **Scopes**: `https://www.googleapis.com/auth/cloud-platform`

#### PostgreSQL Connection
- **Connection ID**: `postgres_default`
- **Connection Type**: `Postgres`
- **Host**: Container name (check docker container name)
- **Database**: `postgres`
- **Login**: `postgres`
- **Password**: `postgres`
- **Port**: `5432`

### 9. Create Data Pipeline DAG

Create `dags/extract_data_from_gcp.py` with the DAG to extract data from GCP bucket.

**Important Notes**:
- Make sure `dag_id="example_astronauts"` matches the DAG ID shown in Airflow dashboard
- Ensure your GCP bucket `bucket_titanic_1` contains `Titanic-Dataset.csv`
- The DAG ID might change, so use the one that appears in the dashboard after creating the file

### 10. Install Redis

```bash
# Pull Redis image
docker pull redis

# Run Redis container
docker run -d --name redis-container -p 6379:6379 redis
```

**Important**: Keep the Redis container running throughout the project.

### 11. Install Project in Development Mode

To ensure proper imports work throughout the project, install the package in development mode:

```bash
# Activate your conda environment first
conda activate titanic-mlops

# Install the project in editable mode
pip install -e .
```

**Note**: This allows you to import modules from the `src/`, `config/`, and other project directories without path issues.

### 12. Run Data Pipeline

1. Go to Airflow dashboard (`http://localhost:8080`)
2. Navigate to DAGs
3. Find your DAG (with correct DAG ID)
4. Click the play/start button to execute the pipeline
5. This will fetch data from GCP and save it to PostgreSQL

### 13. Run Training Pipeline

**Important**: After the data pipeline completes, you need to train the model and set up the feature store.

```bash
# Make sure both Astro and Redis containers are running
# Run the training pipeline to:
# - Read data from PostgreSQL
# - Preprocess the data
# - Train the ML model
# - Store features in Redis feature store
# - Save the trained model

python pipeline/training_pipeline.py

# You can also run data_ingestion.py, data_processing.py, feature_store.py and model_training.py initally to test their working.
```

**Note**: This step is crucial as it:
- Creates the trained model (`artifacts/models/random_forest_model.pkl`)
- Populates the Redis feature store with processed features
- Sets up the reference data for drift detection

### 14. Setup Monitoring with Prometheus & Grafana

Ensure you have `docker-compose.yml` and `prometheus.yml` files in your project folder, then run:

```bash
docker-compose up -d
```

This will start:
- Prometheus (accessible at `http://localhost:9090`)
- Grafana (accessible at `http://localhost:3000`)

### 15. Configure Prometheus Monitoring

1. Start your Flask application (`app.py`)
2. Go to `http://localhost:9090`
3. Navigate to Status → Targets
4. Verify that `http://host.docker.internal:5000/metrics` endpoint state is UP

### 16. Configure Grafana Dashboard

1. Go to `http://localhost:3000` (Grafana dashboard)
2. Navigate to Connections → Data Sources
3. Select Prometheus → Add Connection
4. Set Prometheus server URL: `http://prometheus:9090`
5. Click "Save & Test" (should succeed)

#### Create Visualizations

Create a new dashboard with these visualizations:

1. **Drift Detection Visualization**:
   - Metric: `drift_count_total`
   - This tracks data drift occurrences

2. **Prediction Count Visualization**:
   - Metric: `prediction_count_total`
   - This tracks the number of predictions made

## 🗂️ Project Structure

```
titanic_survival_prediction/
├── artifacts/
│   ├── models/          # Trained models
│   └── raw/            # Raw data
├── config/             # Configuration files
├── dags/               # Airflow DAGs
│   └── extract_data_from_gcp.py
├── include/            # GCP service account key
│   └── gcp-key.json
├── src/                # Source code
├── static/             # Static files for web UI
├── templates/          # HTML templates
├── app.py              # Flask application
├── docker-compose.yml  # Docker services configuration
├── prometheus.yml      # Prometheus configuration
├── requirements.txt    # Python dependencies
└── README.md
```

## 🔄 Workflow

1. **Data Extraction**: Airflow DAG fetches data from GCP bucket
2. **Data Storage**: Data is stored in PostgreSQL
3. **Data Processing**: Features are processed and stored in Redis feature store
4. **Model Training**: ML model is trained using the pipeline
5. **Model Serving**: Flask app serves predictions with drift detection
6. **Monitoring**: Prometheus collects metrics, Grafana visualizes them

## 🏃‍♂️ Running the Application

1. Ensure all containers are running:
   - Astro Airflow containers
   - Redis container
   - Prometheus & Grafana containers

2. Execute the Airflow DAG to load data

3. Run the Flask application:
   ```bash
   python app.py
   ```

4. Access the web interface at `http://localhost:5000`

## 📊 Monitoring

- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000`
- **Airflow**: `http://localhost:8080`
- **Application**: `http://localhost:5000`

## 🔍 Features

- **Data Drift Detection**: Using Alibi Detect to monitor input data drift
- **Feature Store**: Redis-based feature caching
- **Real-time Monitoring**: Prometheus metrics collection
- **Visual Dashboard**: Grafana dashboards for monitoring
- **Automated Pipeline**: Airflow orchestration
- **Web Interface**: User-friendly prediction interface

## 🚨 Important Notes

1. Keep Docker Desktop running throughout the setup
2. Ensure both Astro and Redis containers are running simultaneously
3. The DAG ID might change when creating the DAG file - use the one shown in Airflow dashboard
4. Don't include `psycopg2` in `requirements.txt` initially to avoid conflicts
5. Make sure your GCP bucket contains the required dataset
6. Prometheus server URL in Grafana should use container name (`prometheus:9090`) not localhost

## 🔧 Troubleshooting

- If containers fail to start, ensure Docker Desktop is running
- If connections fail, verify container names and ports
- If DAG doesn't appear, check the DAG ID and file syntax
- If metrics don't appear in Grafana, ensure the Flask app is running and accessible

## 🎯 Learning Outcomes

This project demonstrates:
- Setting up a complete MLOps pipeline
- Using Astronomer for Airflow orchestration
- Implementing feature stores with Redis
- Data drift detection with Alibi Detect
- Monitoring with Prometheus and Grafana
- Containerization with Docker
- Cloud integration with GCP

---

**Note**: This project is designed for learning MLOps concepts and tools. The setup involves multiple components working together to create a comprehensive machine learning operations pipeline.
