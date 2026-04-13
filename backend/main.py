from fastapi import FastAPI
from pydantic import BaseModel

from model.feature_extractor import extract_features
from model.model_loader import load_model

from agent.decision_engine import classify_risk, decide_action
from agent.explanation_engine import generate_explanation

from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
app = FastAPI()

# CORS (for extension)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = load_model()

print("Model classes:", model.classes_)


class URLRequest(BaseModel):
    url: str


@app.get("/")
def home():
    return {"message": "Phishing Detection API is running"}


@app.post("/predict")
def predict(data: URLRequest):
    url = data.url.lower()

    # 🔍 Feature extraction
    feature_list, feature_dict = extract_features(url)

    print("Features:", feature_list)

    # 🤖 Model probability
    

    feature_names = [
    "url_length",
    "domain_length",
    "path_length",
    "dot_count",
    "hyphen_count",
    "at_count",
    "question_count",
    "ampersand_count",
    "equal_count",
    "digit_count",
    "digit_ratio",
    "has_ip",
    "suspicious_token_count",
    "is_https"
    ]

    df = pd.DataFrame([feature_list], columns=feature_names)

    probs = model.predict_proba(df)[0]
    confidence = float(probs[1])  # phishing probability

    print("Confidence:", confidence)

    # 🎯 Base prediction using threshold
    if confidence > 0.4:
        prediction = 1
    else:
        prediction = 0

    # 🚨 RULE-BASED BOOST (VERY IMPORTANT 🔥)
    suspicious_words = ["login", "verify", "secure", "account", "update", "bank"]

    if any(word in url for word in suspicious_words):
        print("Rule triggered: suspicious keyword detected")
        prediction = 1
        confidence = max(confidence, 0.7)

    if "@" in url or "//" in url.replace("https://", "").replace("http://", ""):
        print("Rule triggered: suspicious symbols")
        prediction = 1
        confidence = max(confidence, 0.8)
    if url.startswith("http://"):
        print("Rule triggered: no HTTPS")
        prediction = 1
        confidence = max(confidence, 0.6)

    # 🎯 Risk + Action
    risk = classify_risk(confidence)
    action = decide_action(risk)

    # 💬 Explanation
    reasons = generate_explanation(feature_dict, url)

    return {
        "prediction": "phishing" if prediction == 1 else "safe",
        "confidence": round(confidence, 3),
        "risk": risk,
        "action": action,
        "reasons": reasons
    }