def classify_risk(confidence):
    if confidence >= 0.8:
        return "HIGH"
    elif confidence >= 0.5:
        return "MEDIUM"
    else:
        return "LOW"


def decide_action(risk):
    if risk == "HIGH":
        return "BLOCK"
    elif risk == "MEDIUM":
        return "WARN"
    else:
        return "ALLOW"