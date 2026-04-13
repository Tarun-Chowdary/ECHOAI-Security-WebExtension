def generate_explanation(features, url):
    reasons = []

    if features.get("url_length", 0) > 75:
        reasons.append("URL is unusually long")

    if features.get("has_ip", 0):
        reasons.append("Uses IP address instead of domain")

    if not features.get("has_https", 1):
        reasons.append("Not using HTTPS")

    if features.get("suspicious_token_count", 0) > 0:
        reasons.append("Contains suspicious keywords")

    return reasons
