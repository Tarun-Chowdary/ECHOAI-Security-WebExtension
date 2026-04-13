import pickle

def load_model():
    with open("model/phishing_model.pkl", "rb") as f:
        model = pickle.load(f)
    return model