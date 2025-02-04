from flask import Flask, request, jsonify
from flask_cors import CORS
from dataclasses import dataclass
from typing import List, Optional
import boto3
from openai import OpenAI
from dotenv import load_dotenv
import os
import logging
from logging.handlers import RotatingFileHandler
import time

# Load environment variables
load_dotenv()


# Configure logging with rotation
def setup_logging():
    log_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    log_file = "app.log"

    file_handler = RotatingFileHandler(
        log_file, maxBytes=10 * 1024 * 1024, backupCount=5
    )
    file_handler.setFormatter(log_formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_formatter)

    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


logger = setup_logging()


@dataclass
class Config:
    """Configuration class to store environment variables"""

    aws_access_key: str
    aws_secret_access_key: str
    aws_region: str
    openai_api_key: str
    max_labels: int = 10
    min_confidence: float = 70.0
    allowed_extensions: set = frozenset({"png", "jpg", "jpeg", "gif"})
    max_file_size: int = 5 * 1024 * 1024  # 5MB

    @classmethod
    def from_env(cls):
        required_vars = {
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
            "AWS_REGION",
            "OPENAI_API_KEY",
        }

        missing_vars = required_vars - set(os.environ.keys())
        if missing_vars:
            raise EnvironmentError(
                f"Missing required environment variables: {missing_vars}"
            )

        return cls(
            aws_access_key=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            aws_region=os.getenv("AWS_REGION"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
        )


class ImageAnalyzer:
    def __init__(self, config: Config):
        self.config = config
        self.rekognition_client = boto3.client(
            "rekognition",
            aws_access_key_id=config.aws_access_key,
            aws_secret_access_key=config.aws_secret_access_key,
            region_name=config.aws_region,
        )
        self.openai_client = OpenAI(api_key=config.openai_api_key)

    def analyze_image(self, image_bytes: bytes) -> List[dict]:
        try:
            response = self.rekognition_client.detect_labels(
                Image={"Bytes": image_bytes},
                MaxLabels=self.config.max_labels,
                MinConfidence=self.config.min_confidence,
            )
            return response["Labels"]
        except Exception as e:
            logger.error(f"Error in Rekognition analysis: {str(e)}")
            raise

    def generate_description(self, labels: List[dict]) -> str:
        label_descriptions = [
            f"{label['Name']} ({label['Confidence']:.2f}%)" for label in labels
        ]

        prompt = (
            f"The following labels were detected in an image: {', '.join(label_descriptions)}. "
            "Based on these labels, describe the image without mentioning label statistics. "
            "Include the setting, time of day, season, activities, events, and emotions conveyed. "
            "Be straightforward. If night or nightlife labels are present, describe this as "
            "a party scene with EDM atmosphere."
        )

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that generates image descriptions.",
                    },
                    {"role": "user", "content": prompt},
                ],
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error in OpenAI description generation: {str(e)}")
            raise

    def generate_music_keywords(self, description: str) -> str:
        prompt = (
            f"Based on this image description: {description}\n"
            "Generate exactly 1 music genre and 1 keyword suitable for a Spotify search. "
            "Output only the keywords separated by spaces, without any extra text or punctuation."
        )

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that suggests music genres and keywords.",
                    },
                    {"role": "user", "content": prompt},
                ],
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error in music keyword generation: {str(e)}")
            raise


def create_app(config: Config) -> Flask:
    app = Flask(__name__)
    CORS(app)
    analyzer = ImageAnalyzer(config)

    def allowed_file(filename: str) -> bool:
        return (
            "." in filename
            and filename.rsplit(".", 1)[1].lower() in config.allowed_extensions
        )

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "healthy", "timestamp": time.time()}), 200

    @app.route("/analyze-image", methods=["POST"])
    def analyze_image():
        start_time = time.time()

        try:
            if "file" not in request.files:
                return jsonify({"error": "No file provided"}), 400

            file = request.files["file"]

            if not file.filename:
                return jsonify({"error": "No selected file"}), 400

            if not allowed_file(file.filename):
                return jsonify({"error": "File type not allowed"}), 400

            file_content = file.read()
            if len(file_content) > config.max_file_size:
                return jsonify({"error": "File size exceeds maximum limit"}), 400

            labels = analyzer.analyze_image(file_content)
            description = analyzer.generate_description(labels)
            keywords = analyzer.generate_music_keywords(description)

            processing_time = time.time() - start_time

            return (
                jsonify(
                    {
                        "music_keywords": keywords,
                        "processing_time": f"{processing_time:.2f}s",
                    }
                ),
                200,
            )

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return (
                jsonify(
                    {
                        "error": "An error occurred processing your request",
                        "detail": str(e) if app.debug else "Internal server error",
                    }
                ),
                500,
            )

    return app


if __name__ == "__main__":
    config = Config.from_env()
    app = create_app(config)
    app.run(debug=True)
